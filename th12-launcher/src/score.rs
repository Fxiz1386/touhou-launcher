use std::path::{Path, PathBuf};
use std::fs;
use crate::models::GameDef;

struct BitReader<'a> {
    data: &'a [u8],
    pos: usize,
    current: u8,
    mask: u8,
}

impl<'a> BitReader<'a> {
    fn new(data: &'a [u8]) -> Self {
        Self {
            data,
            pos: 0,
            current: 0,
            mask: 0x80,
        }
    }

    fn read_bit(&mut self) -> u32 {
        if self.mask == 0x80 {
            if self.pos < self.data.len() {
                self.current = self.data[self.pos];
                self.pos += 1;
            } else {
                self.current = 0;
            }
        }
        let val = if (self.current & self.mask) != 0 { 1 } else { 0 };
        self.mask >>= 1;
        if self.mask == 0 {
            self.mask = 0x80;
        }
        val
    }

    fn read_bits(&mut self, count: usize) -> u32 {
        let mut val = 0;
        for _ in 0..count {
            val = (val << 1) | self.read_bit();
        }
        val
    }
}

pub fn decrypt_th_crypt(data: &[u8], body_size: usize) -> Vec<u8> {
    let mut key: u8 = 0xAC;
    let step: u8 = 0x35;
    let block: usize = 0x10;
    let mut size = body_size;
    let mut limit = body_size;

    let mut out = vec![0u8; data.len()];
    let mut addup = size % block;
    if addup >= block / 4 {
        addup = 0;
    }
    addup += size % 2;
    size -= addup;

    let mut in_offset = 0;
    let mut out_offset = 0;

    while size > 0 && limit > 0 {
        let cur_block = size.min(block);
        if in_offset + cur_block > data.len() {
            break;
        }

        let mut in_idx = 0;
        for j in 0..2 {
            let mut out_idx = cur_block as isize - j as isize - 1;
            let count = (cur_block - j + 1) / 2;
            for _ in 0..count {
                if out_idx >= 0 && (out_idx as usize) < cur_block && in_offset + in_idx < data.len() {
                    out[out_offset + out_idx as usize] = data[in_offset + in_idx] ^ key;
                }
                in_idx += 1;
                out_idx -= 2;
                key = key.wrapping_add(step);
            }
        }

        limit -= cur_block;
        size -= cur_block;
        in_offset += cur_block;
        out_offset += cur_block;
    }

    if addup > 0 && in_offset + addup <= data.len() && out_offset + addup <= out.len() {
        out[out_offset..out_offset + addup].copy_from_slice(&data[in_offset..in_offset + addup]);
    }

    out
}

pub fn lzss_decompress(input: &[u8], expected_size: usize) -> Vec<u8> {
    let mut reader = BitReader::new(input);
    let mut dictionary = [0u8; 0x2000];
    let mut dic_index = 1usize;
    let mut decompressed = Vec::with_capacity(expected_size.min(1024 * 1024));

    while dic_index < dictionary.len() && (expected_size == 0 || decompressed.len() < expected_size) {
        let flag = reader.read_bits(1);
        if flag != 0 {
            let ch = reader.read_bits(8) as u8;
            decompressed.push(ch);
            dictionary[dic_index] = ch;
            dic_index = (dic_index + 1) & 0x1FFF;
        } else {
            let mut offset = reader.read_bits(13) as usize;
            if offset == 0 {
                break;
            }
            let length = (reader.read_bits(4) + 3) as usize;
            for _ in 0..length {
                let ch = dictionary[offset & 0x1FFF];
                offset += 1;
                decompressed.push(ch);
                dictionary[dic_index] = ch;
                dic_index = (dic_index + 1) & 0x1FFF;
            }
        }
    }

    decompressed
}

/// Parse modern Touhou score files (TH10 to TH19)
/// Returns (max_score, play_time_seconds)
pub fn parse_modern_score_file(bytes: &[u8]) -> Option<(u64, u64)> {
    if bytes.len() < 24 {
        return None;
    }

    // Signature: 4 bytes (e.g. TH21, TH31, etc.)
    if bytes[0] != b'T' || bytes[1] != b'H' {
        return None;
    }

    let encoded_body_size = u32::from_le_bytes(bytes[16..20].try_into().ok()?) as usize;
    let decoded_body_size = u32::from_le_bytes(bytes[20..24].try_into().ok()?) as usize;

    if 24 + encoded_body_size > bytes.len() {
        return None;
    }

    let body = &bytes[24..24 + encoded_body_size];
    let decrypted = decrypt_th_crypt(body, encoded_body_size);
    let decomp = lzss_decompress(&decrypted, decoded_body_size);

    let mut offset = 0;
    let mut max_score: u64 = 0;
    let mut total_play_time_seconds: u64 = 0;

    while offset + 12 <= decomp.len() {
        let sig = &decomp[offset..offset + 2];
        let ch_size = u32::from_le_bytes(decomp[offset + 4..offset + 8].try_into().unwrap_or([0; 4])) as usize;
        if ch_size < 12 || offset + ch_size > decomp.len() {
            break;
        }

        let chapter_data = &decomp[offset + 12..offset + ch_size];

        if sig == b"CR" && chapter_data.len() >= 4 {
            // 5 levels x 10 ranking entries
            // Each entry:
            // Score: u32 (score / 10)
            // StageProgress: u8
            // ContinueCount: u8
            // Name: 10 bytes
            // DateTime: u32
            // SlowRate: f32
            // Plus 4 extra bytes in TH11+
            let mut score_offset = 4;
            let entry_size = 28;

            for _lv in 0..5 {
                for _rank in 0..10 {
                    if score_offset + entry_size <= chapter_data.len() {
                        let sc = u32::from_le_bytes(chapter_data[score_offset..score_offset + 4].try_into().unwrap_or([0; 4])) as u64;
                        let name_bytes = &chapter_data[score_offset + 6..score_offset + 16];
                        let name_str = String::from_utf8_lossy(name_bytes);
                        let clean_name = name_str.trim_matches(|c: char| c == '\0' || c == ' ' || c == '-');

                        // Real score is sc * 10. Filter out unplayed default placeholder scores (where name is "--------" or empty)
                        if !clean_name.is_empty() && clean_name != "ZUN" {
                            let real_score = sc * 10;
                            if real_score > max_score {
                                max_score = real_score;
                            }
                        }
                        score_offset += entry_size;
                    }
                }
            }

            // Next 8 bytes: play_count (u32), play_time_frames (u32)
            if score_offset + 8 <= chapter_data.len() {
                let play_time_frames = u32::from_le_bytes(chapter_data[score_offset + 4..score_offset + 8].try_into().unwrap_or([0; 4])) as u64;
                let play_time_sec = play_time_frames / 60;
                total_play_time_seconds += play_time_sec;
            }
        }

        offset += ch_size;
    }

    Some((max_score, total_play_time_seconds))
}

/// Parse classic Touhou score files (TH06)
pub fn parse_th06_score_file(bytes: &[u8]) -> Option<(u64, u64)> {
    if bytes.len() < 16 {
        return None;
    }

    let mut data = bytes.to_vec();
    let mut temp: u8 = 0;
    for i in 2..data.len() {
        temp = temp.wrapping_add(data[i - 1]);
        temp = (temp >> 5) | (temp << 3);
        data[i] ^= temp;
    }

    let mut max_score: u64 = 0;
    let mut offset = 12; // skip FileHeader

    while offset + 8 <= data.len() {
        let sig = &data[offset..offset + 4];
        let ch_size = u16::from_le_bytes(data[offset + 4..offset + 6].try_into().unwrap_or([0; 2])) as usize;
        if ch_size < 8 || offset + ch_size > data.len() {
            break;
        }

        if sig == b"HSCR" && ch_size >= 28 {
            let sc = u32::from_le_bytes(data[offset + 8..offset + 12].try_into().unwrap_or([0; 4])) as u64;
            let name_bytes = &data[offset + 15..offset + 24];
            let name_str = String::from_utf8_lossy(name_bytes);
            let clean_name = name_str.trim_matches(|c: char| c == '\0' || c == ' ');

            // In TH06, default entries are "Nanashi"
            if clean_name != "Nanashi" && !clean_name.is_empty() {
                if sc > max_score {
                    max_score = sc;
                }
            }
        }

        offset += ch_size;
    }

    Some((max_score, 0))
}

/// Locates and extracts real high score and playtime for a given Touhou game.
/// Searches both local game directory and Wine prefix ShanghaiAlice AppData.
pub fn scan_game_score_and_playtime(game: &GameDef, game_dir: &Path, pfx_dir: &Path) -> (u64, u64) {
    let mut candidates: Vec<PathBuf> = Vec::new();

    // 1. Local game folder
    candidates.push(game_dir.join("score.dat"));
    candidates.push(game_dir.join(format!("score{}.dat", game.id)));
    candidates.push(game_dir.join(format!("{}.dat", game.id)));

    // 2. Wine prefix AppData
    // e.g. pfx/drive_c/users/*/AppData/Roaming/ShanghaiAlice/<game_id>/scorethXX.dat
    let shanghai_alice_dir = pfx_dir.join("drive_c/users");
    if let Ok(users) = fs::read_dir(&shanghai_alice_dir) {
        for u in users.flatten() {
            let app_data = u.path().join("AppData/Roaming/ShanghaiAlice").join(game.id);
            candidates.push(app_data.join("score.dat"));
            candidates.push(app_data.join(format!("score{}.dat", game.id)));
        }
    }

    for path in candidates {
        if path.exists() {
            if let Ok(bytes) = fs::read(&path) {
                if game.id == "th06" {
                    if let Some(res) = parse_th06_score_file(&bytes) {
                        if res.0 > 0 || res.1 > 0 {
                            return res;
                        }
                    }
                } else if let Some(res) = parse_modern_score_file(&bytes) {
                    return res;
                }
            }
        }
    }

    (0, 0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_th12_score_file() {
        let path = Path::new("../Touhou 12 - Undefined Fantastic Object/scoreth12.dat");
        if path.exists() {
            if let Ok(bytes) = fs::read(path) {
                let res = parse_modern_score_file(&bytes);
                assert!(res.is_some());
            }
        }
    }
}
