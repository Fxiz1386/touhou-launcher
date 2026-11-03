use std::fs::{self, File};
use std::io::{self};
use std::path::{Path, PathBuf};
use zip::ZipArchive;

use crate::models::{GAMES, GameDef};

#[allow(dead_code)]
pub struct InstallResult {
    pub game_id: String,
    pub game_name: String,
    pub target_dir: PathBuf,
    pub files_extracted: usize,
}

pub fn detect_game_in_zip(zip_path: &Path) -> Result<Option<&'static GameDef>, String> {
    detect_game_in_archive(zip_path)
}

pub fn detect_game_in_archive(path: &Path) -> Result<Option<&'static GameDef>, String> {
    let name_lower = path.file_name()
        .and_then(|n| n.to_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_default();

    // Ignore backups or temporary files
    if name_lower.contains("backup") {
        return Ok(None);
    }

    let rules: &[(&[&str], &str)] = &[
        (&["th06", "touhou 6", "touhou 06", "scarlet devil", "koumakyou"], "th06"),
        (&["th07", "touhou 7", "touhou 07", "cherry blossom", "youyoumu"], "th07"),
        (&["th08", "touhou 8", "touhou 08", "imperishable night", "eiyashou"], "th08"),
        (&["th095", "touhou 9.5", "shoot the bullet", "bohemian"], "th095"),
        (&["th09", "touhou 9", "touhou 09", "flower view", "kaeizuka"], "th09"),
        (&["th10", "touhou 10", "mountain of faith", "fuujinroku"], "th10"),
        (&["th11", "touhou 11", "subterranean animism", "chireiden"], "th11"),
        (&["th125", "touhou 12.5", "double spoiler"], "th125"),
        (&["th128", "touhou 12.8", "fairy wars", "great fairy wars"], "th128"),
        (&["th12", "touhou 12", "fantastic object", "seirensen"], "th12"),
        (&["th13", "touhou 13", "ten desires", "shinreibyou"], "th13"),
        (&["th143", "touhou 14.3", "impossible spell card"], "th143"),
        (&["th14", "touhou 14", "double dealing character", "kishinjou"], "th14"),
        (&["th15", "touhou 15", "legacy of lunatic kingdom", "kanjuden"], "th15"),
        (&["th165", "touhou 16.5", "violet detector"], "th165"),
        (&["th16", "touhou 16", "hidden star in four seasons", "tenkuushou"], "th16"),
        (&["th17", "touhou 17", "wily beast and weakest creature", "kikeijuu"], "th17"),
        (&["th185", "touhou 18.5", "100th black market"], "th185"),
        (&["th18", "touhou 18", "unconnected marketeers", "kouryuudou"], "th18"),
        (&["th19", "touhou 19", "unfinished dream of all living ghost", "juuouen"], "th19"),
        (&["th20", "touhou 20", "fanciful dream and wondering beast", "musouroku"], "th20"),
    ];

    for (patterns, id) in rules {
        if patterns.iter().any(|pat| name_lower.contains(pat)) {
            if let Some(game) = GAMES.iter().find(|g| g.id == *id) {
                return Ok(Some(game));
            }
        }
    }

    // Only inspect ZIP interior if filename has any Touhou or TH hint
    let has_hint = name_lower.contains("th") || name_lower.contains("touhou") || name_lower.contains("東方");
    if has_hint {
        if let Ok(file) = File::open(path) {
            if let Ok(mut archive) = ZipArchive::new(file) {
                let limit = archive.len().min(100);
                let mut entry_names = Vec::new();
                for i in 0..limit {
                    if let Ok(file) = archive.by_index(i) {
                        entry_names.push(file.name().to_lowercase());
                    }
                }
                for game in GAMES {
                    for sig in game.signatures {
                        let sig_lower = sig.to_lowercase();
                        if entry_names.iter().any(|name| name.ends_with(&sig_lower) || name.contains(&sig_lower)) {
                            return Ok(Some(game));
                        }
                    }
                }
            }
        }
    }

    Ok(None)
}

pub fn install_zip(zip_path: &Path, games_dir: &Path) -> Result<InstallResult, String> {
    let game = detect_game_in_archive(zip_path)?
        .ok_or_else(|| "No se reconoció qué juego de Touhou contiene este archivo.".to_string())?;

    let target_dir = games_dir.join(game.dir_name);
    fs::create_dir_all(&target_dir).map_err(|e| format!("Error creando carpeta de destino: {}", e))?;

    let ext = zip_path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let mut count = 0;

    if ext == "7z" || ext == "rar" {
        // Use 7z command line to extract
        let output = std::process::Command::new("7z")
            .arg("x")
            .arg("-y")
            .arg(format!("-o{}", target_dir.display()))
            .arg(zip_path)
            .output()
            .map_err(|e| format!("Error al ejecutar 7z: {}", e))?;

        if !output.status.success() {
            return Err(format!("Error extrayendo archivo 7z: {}", String::from_utf8_lossy(&output.stderr)));
        }

        // Count extracted items
        if let Ok(entries) = fs::read_dir(&target_dir) {
            count = entries.count();
        }
    } else {
        let file = File::open(zip_path).map_err(|e| format!("Error abriendo ZIP: {}", e))?;
        let mut archive = ZipArchive::new(file).map_err(|e| format!("Error leyendo ZIP: {}", e))?;

        // Determine if there is a common root directory in the zip
        let mut prefix_to_strip = None;
        if archive.len() > 0 {
            let first_name = archive.by_index(0).map(|f| f.name().to_string()).unwrap_or_default();
            if let Some(slash_idx) = first_name.find('/') {
                let candidate = &first_name[..=slash_idx];
                let all_have_prefix = (0..archive.len()).all(|i| {
                    if let Ok(f) = archive.by_index(i) {
                        f.name().starts_with(candidate)
                    } else {
                        false
                    }
                });
                if all_have_prefix {
                    prefix_to_strip = Some(candidate.to_string());
                }
            }
        }

        for i in 0..archive.len() {
            let mut entry = archive.by_index(i).map_err(|e| format!("Error leyendo entrada ZIP: {}", e))?;
            
            let raw_name = entry.name().to_string();
            let rel_name = if let Some(ref prefix) = prefix_to_strip {
                raw_name.strip_prefix(prefix).unwrap_or(&raw_name)
            } else {
                &raw_name
            };

            if rel_name.is_empty() || rel_name.contains("..") {
                continue;
            }

            let outpath = target_dir.join(rel_name);

            if entry.is_dir() {
                fs::create_dir_all(&outpath).map_err(|e| format!("Error creando subdirectorio: {}", e))?;
            } else {
                if let Some(parent) = outpath.parent() {
                    if !parent.exists() {
                        fs::create_dir_all(parent).map_err(|e| format!("Error creando directorio padre: {}", e))?;
                    }
                }

                let mut outfile = File::create(&outpath).map_err(|e| format!("Error creando archivo {}: {}", outpath.display(), e))?;
                io::copy(&mut entry, &mut outfile).map_err(|e| format!("Error extrayendo {}: {}", outpath.display(), e))?;
                count += 1;
            }
        }
    }

    // Flatten any nested subdirectory created by archive extraction
    flatten_nested_directory(&target_dir);

    // Automatically purge unnecessary Windows installer bloatware (~50MB+)
    purge_unnecessary_bloat(&target_dir);

    // Restore any previously backed up save data (scores, replays)
    if let Some(parent) = games_dir.parent() {
        let backups_dir = parent.join("backups");
        let _ = restore_saves(game.id, &target_dir, &backups_dir);
    }

    if game.id == "th06" {
        setup_th06_compatibility(&target_dir);
    } else if game.id == "th07" {
        setup_th07_compatibility(&target_dir);
    } else if game.id == "th08" {
        setup_th08_compatibility(&target_dir);
    }
    if game.era.contains("DirectX 8") || game.id == "th06" || game.id == "th07" || game.id == "th08" {
        ensure_dx8_compatibility(&target_dir);
    }
    ensure_thcrap_integrity(&target_dir, game.id);

    // Automatically apply Community Patches (Translations, 60 FPS, vpatch, DXVK)
    let _ = crate::patcher::patch_game(game.id, &target_dir);

    Ok(InstallResult {
        game_id: game.id.to_string(),
        game_name: game.title.to_string(),
        target_dir,
        files_extracted: count,
    })
}

pub fn flatten_nested_directory(game_dir: &Path) {
    // Attempt up to 3 passes in case of multiple nested wrapper directories
    for _ in 0..3 {
        // If there is already an executable file at root, no need to flatten
        let has_exe_at_root = if let Ok(entries) = fs::read_dir(game_dir) {
            entries.flatten().any(|e| {
                e.path().is_file()
                    && e.path()
                        .extension()
                        .and_then(|ext| ext.to_str())
                        .map(|s| s.eq_ignore_ascii_case("exe"))
                        .unwrap_or(false)
            })
        } else {
            false
        };

        if has_exe_at_root {
            break;
        }

        // Search for subdirectories (excluding hidden dirs, __MACOSX, and thcrap)
        let subdirs: Vec<PathBuf> = if let Ok(entries) = fs::read_dir(game_dir) {
            entries
                .flatten()
                .map(|e| e.path())
                .filter(|p| {
                    if !p.is_dir() {
                        return false;
                    }
                    let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                    !name.starts_with('.') && name != "__MACOSX" && name != "thcrap"
                })
                .collect()
        } else {
            Vec::new()
        };

        if subdirs.is_empty() {
            break;
        }

        // Find candidate directory that contains an .exe or is the sole subfolder
        let candidate = if subdirs.len() == 1 {
            Some(subdirs[0].clone())
        } else {
            subdirs.into_iter().find(|dir| {
                if let Ok(sub_entries) = fs::read_dir(dir) {
                    sub_entries.flatten().any(|e| {
                        e.path().is_file()
                            && e.path()
                                .extension()
                                .and_then(|ext| ext.to_str())
                                .map(|s| s.eq_ignore_ascii_case("exe"))
                                .unwrap_or(false)
                    })
                } else {
                    false
                }
            })
        };

        if let Some(nested_dir) = candidate {
            if let Ok(nested_entries) = fs::read_dir(&nested_dir) {
                for item in nested_entries.flatten() {
                    let source = item.path();
                    if let Some(file_name) = source.file_name() {
                        let dest = game_dir.join(file_name);
                        if dest.exists() && dest.is_dir() && source.is_dir() {
                            if let Ok(inner) = fs::read_dir(&source) {
                                for inner_item in inner.flatten() {
                                    if let Some(inner_name) = inner_item.path().file_name() {
                                        let _ = fs::rename(inner_item.path(), dest.join(inner_name));
                                    }
                                }
                            }
                            let _ = fs::remove_dir_all(&source);
                        } else {
                            let _ = fs::rename(&source, &dest);
                        }
                    }
                }
            }
            let _ = fs::remove_dir_all(&nested_dir);
        } else {
            break;
        }
    }
}

pub fn purge_unnecessary_bloat(game_dir: &Path) {
    let thcrap_bin = game_dir.join("thcrap/bin");
    if thcrap_bin.exists() {
        if let Ok(entries) = fs::read_dir(&thcrap_bin) {
            let keep_set: &[&str] = &[
                "thcrap_loader.exe", "thcrap.dll", "thcrap_tsa.dll", "thcrap_tasofro.dll",
                "win32_utf8.dll", "jansson.dll", "zlib-ng.dll",
                "act_nut_lib.dll", "libpng16.dll", "libssl-1_1.dll", "libcrypto-1_1.dll",
                "update.json"
            ];
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_lowercase();
                    if !keep_set.iter().any(|k| k.to_lowercase() == name) {
                        let _ = fs::remove_file(&path);
                    }
                }
            }
        }
        let update_json = thcrap_bin.join("update.json");
        if !update_json.exists() {
            let _ = fs::write(update_json, "[]");
        }
    }
}

pub fn setup_th06_compatibility(game_dir: &Path) {
    let suffixes = ["CM", "ED", "IN", "MD", "ST", "TL"];
    let entries: Vec<PathBuf> = match fs::read_dir(game_dir) {
        Ok(read) => read.flatten().map(|e| e.path()).collect(),
        Err(_) => return,
    };

    for suffix in suffixes {
        let suffix_lower = suffix.to_lowercase();
        let source_file = entries.iter().find(|p| {
            if let Some(name) = p.file_name().and_then(|n| n.to_str()) {
                let lower = name.to_lowercase();
                (lower.contains(&suffix_lower) || lower.ends_with(&format!("{}.dat", suffix_lower)))
                    && lower.ends_with(".dat")
            } else {
                false
            }
        });

        if let Some(src) = source_file {
            if let Some(src_name) = src.file_name().and_then(|n| n.to_str()) {
                let targets = [
                    format!("紅魔郷{}.dat", suffix),
                    format!("紅魔郷{}.DAT", suffix),
                    format!("\u{008d}g\u{2013}\u{201a}\u{2039}\u{00bd}{}.dat", suffix),
                    format!("\u{008d}g\u{2013}\u{201a}\u{2039}\u{00bd}{}.DAT", suffix),
                    format!("th06{}.dat", suffix),
                    format!("th06{}.DAT", suffix),
                ];

                for target_name in &targets {
                    if target_name != src_name {
                        let target_path = game_dir.join(target_name);
                        if !target_path.exists() {
                            #[cfg(unix)]
                            let _ = std::os::unix::fs::symlink(src_name, &target_path);
                        }
                    }
                }
            }
        }
    }

    // Ensure vpatch_th06.dll symlink exists
    let vpatch_uni = game_dir.join("vpatch_th06_unicode.dll");
    let vpatch_std = game_dir.join("vpatch_th06.dll");
    if vpatch_uni.exists() && !vpatch_std.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink("vpatch_th06_unicode.dll", &vpatch_std);
    }

    // Ensure th06.exe symlink exists
    let main_exe = game_dir.join("東方紅魔郷.exe");
    let th06_exe = game_dir.join("th06.exe");
    if main_exe.exists() && !th06_exe.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink("東方紅魔郷.exe", &th06_exe);
    }

    // Ensure cfg compatibility
    let main_cfg = game_dir.join("東方紅魔郷.cfg");
    let moji_cfg = game_dir.join("“Œ•û\u{008d}g–‚‹½.cfg");
    if main_cfg.exists() && !moji_cfg.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink("東方紅魔郷.cfg", &moji_cfg);
    } else if moji_cfg.exists() && !main_cfg.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink("“Œ•û\u{008d}g–‚‹½.cfg", &main_cfg);
    }
}

pub fn setup_th07_compatibility(game_dir: &Path) {
    let jp_exe = game_dir.join("東方妖々夢.exe");
    let en_exe = game_dir.join("th07.exe");
    if jp_exe.exists() && !en_exe.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink("東方妖々夢.exe", &en_exe);
    }
    let jp_cfg = game_dir.join("東方妖々夢.cfg");
    let en_cfg = game_dir.join("th07.cfg");
    if jp_cfg.exists() && !en_cfg.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink("東方妖々夢.cfg", &en_cfg);
    } else if en_cfg.exists() && !jp_cfg.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink("th07.cfg", &jp_cfg);
    }
}

pub fn setup_th08_compatibility(game_dir: &Path) {
    let jp_exe = game_dir.join("東方永夜抄.exe");
    let en_exe = game_dir.join("th08.exe");
    if jp_exe.exists() && !en_exe.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink("東方永夜抄.exe", &en_exe);
    }
    let jp_cfg = game_dir.join("東方永夜抄.cfg");
    let en_cfg = game_dir.join("th08.cfg");
    if jp_cfg.exists() && !en_cfg.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink("東方永夜抄.cfg", &en_cfg);
    } else if en_cfg.exists() && !jp_cfg.exists() {
        #[cfg(unix)]
        let _ = std::os::unix::fs::symlink("th08.cfg", &jp_cfg);
    }
}

const D3D8_DLL: &[u8] = include_bytes!("../assets/d3d8.dll");

pub fn ensure_dx8_compatibility(game_dir: &Path) {
    let d3d8_path = game_dir.join("d3d8.dll");
    if !d3d8_path.exists() {
        let _ = fs::write(&d3d8_path, D3D8_DLL);
    }
    let dxvk_conf = game_dir.join("dxvk.conf");
    if !dxvk_conf.exists() {
        let _ = fs::write(
            &dxvk_conf,
            "d3d8.maxFrameRate = 60\nd3d9.maxFrameRate = 60\nd3d9.presentInterval = 1\n",
        );
    }
}

const TOUHOU_KEYMAP_DLL: &[u8] = include_bytes!("../assets/TouhouKeymap.dll");

pub fn ensure_thcrap_integrity(game_dir: &Path, game_id: &str) {
    let thcrap_bin = game_dir.join("thcrap/bin");
    if thcrap_bin.exists() {
        let update_json = thcrap_bin.join("update.json");
        let _ = fs::write(&update_json, "[]");

        let keymap_dll = thcrap_bin.join("TouhouKeymap.dll");
        if !keymap_dll.exists() {
            let _ = fs::write(&keymap_dll, TOUHOU_KEYMAP_DLL);
        }
    }

    let keymap_ini = game_dir.join("TouhouKeymap.ini");
    if !keymap_ini.exists() {
        let mut content = String::from(
r#"[TouhouKeymap]
Enable Keymapper = 1

[KeySettings]
Up = 38, 87
Down = 40, 83
Left = 37, 65
Right = 39, 68
Shot = 90, 74
Bomb = 88, 75
Focus = 16, 76
"#
        );
        if game_id == "th13" {
            content.push_str("Trance = 67, 85\n");
        }
        if game_id == "th09" || game_id == "th19" {
            content.push_str("Charge = 67, 85\n");
        }
        let _ = fs::write(&keymap_ini, content);
    }

    let config_dir = game_dir.join("thcrap/config");
    if config_dir.exists() {
        let games_js = config_dir.join("games.js");
        let needs_write = match fs::read_to_string(&games_js) {
            Ok(content) => !content.contains(game_id),
            Err(_) => true,
        };

        if needs_write {
            if game_id == "th06" {
                let target_exe = if game_dir.join("vpatch.exe").exists() {
                    "../vpatch.exe"
                } else if game_dir.join("東方紅魔郷.exe").exists() {
                    "../東方紅魔郷.exe"
                } else {
                    "../th06.exe"
                };
                let content = format!(
                    "{{\n  \"th06\": \"{}\",\n  \"th06_custom\": \"../custom.exe\"\n}}\n",
                    target_exe
                );
                let _ = fs::write(games_js, content);
            } else {
                let content = format!(
                    "{{\n  \"{}\": \"../{}.exe\",\n  \"{}_custom\": \"../custom.exe\"\n}}\n",
                    game_id, game_id, game_id
                );
                let _ = fs::write(games_js, content);
            }
        }

        let keymap_js = config_dir.join("keymap.js");
        let needs_keymap = match fs::read_to_string(&keymap_js) {
            Ok(content) => !content.contains("base_tsa"),
            Err(_) => true,
        };
        if needs_keymap {
            let _ = fs::write(
                &keymap_js,
                "{\n  \"console\": false,\n  \"dat_dump\": false,\n  \"patches\": [\n    {\n      \"archive\": \"repos/nmlgc/base_tsa/\"\n    }\n  ]\n}\n",
            );
        }
    }
}

pub fn dir_size(path: &Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                total += entry.metadata().map(|m| m.len()).unwrap_or(0);
            } else if p.is_dir() {
                total += dir_size(&p);
            }
        }
    }
    total
}

pub fn format_size(bytes: u64) -> String {
    if bytes >= 1024 * 1024 * 1024 {
        format!("{:.1} GB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
    } else if bytes >= 1024 * 1024 {
        format!("{:.0} MB", bytes as f64 / (1024.0 * 1024.0))
    } else if bytes >= 1024 {
        format!("{:.0} KB", bytes as f64 / 1024.0)
    } else {
        format!("{} B", bytes)
    }
}

pub fn get_game_dir_size(game: &GameDef, games_dir: &Path) -> (u64, String) {
    let status = crate::models::GameStatus::check(game, games_dir);
    if let Some(dir) = status.path {
        let real_path = fs::canonicalize(&dir).unwrap_or(dir);
        let bytes = dir_size(&real_path);
        (bytes, format_size(bytes))
    } else {
        (0, "0 MB".to_string())
    }
}

pub fn backup_saves(game: &GameDef, game_dir: &Path, backups_dir: &Path) -> Result<usize, String> {
    let dest_dir = backups_dir.join(game.id);
    fs::create_dir_all(&dest_dir).map_err(|e| format!("Error creando carpeta backup: {}", e))?;

    let mut saved_count = 0;
    if let Ok(entries) = fs::read_dir(game_dir) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            let name_lower = name.to_lowercase();
            if (name_lower.starts_with("score") && name_lower.ends_with(".dat")) || name_lower == "score.dat" {
                if fs::copy(entry.path(), dest_dir.join(&name)).is_ok() {
                    saved_count += 1;
                }
            }
        }
    }

    let replay_dir = game_dir.join("replay");
    if replay_dir.exists() && replay_dir.is_dir() {
        let dest_replay = dest_dir.join("replay");
        let _ = fs::create_dir_all(&dest_replay);
        if let Ok(entries) = fs::read_dir(&replay_dir) {
            for entry in entries.flatten() {
                if fs::copy(entry.path(), dest_replay.join(entry.file_name())).is_ok() {
                    saved_count += 1;
                }
            }
        }
    }

    Ok(saved_count)
}

pub fn restore_saves(game_id: &str, target_dir: &Path, backups_dir: &Path) -> usize {
    let backup_game = backups_dir.join(game_id);
    let mut restored = 0;
    if backup_game.exists() && backup_game.is_dir() {
        if let Ok(entries) = fs::read_dir(&backup_game) {
            for entry in entries.flatten() {
                let path = entry.path();
                let name = entry.file_name();
                if path.is_file() {
                    if fs::copy(&path, target_dir.join(&name)).is_ok() {
                        restored += 1;
                    }
                } else if path.is_dir() && name.to_string_lossy().eq_ignore_ascii_case("replay") {
                    let target_replay = target_dir.join("replay");
                    let _ = fs::create_dir_all(&target_replay);
                    if let Ok(replays) = fs::read_dir(&path) {
                        for rep in replays.flatten() {
                            if fs::copy(rep.path(), target_replay.join(rep.file_name())).is_ok() {
                                restored += 1;
                            }
                        }
                    }
                }
            }
        }
    }
    restored
}

pub fn uninstall_game(game: &GameDef, games_dir: &Path, root_dir: &Path, keep_saves: bool) -> Result<u64, String> {
    let status = crate::models::GameStatus::check(game, games_dir);
    let dir = status.path.ok_or_else(|| format!("{} no está instalado.", game.title))?;

    let real_path = fs::canonicalize(&dir).unwrap_or_else(|_| dir.clone());
    let bytes_freed = dir_size(&real_path);

    if keep_saves {
        let backups_dir = root_dir.join("backups");
        let _ = backup_saves(game, &real_path, &backups_dir);
    }

    // 1. If symlink in games_dir (e.g. games/th12), remove symlink
    let symlink_path = games_dir.join(game.dir_name);
    if symlink_path.exists() {
        if let Ok(meta) = fs::symlink_metadata(&symlink_path) {
            if meta.file_type().is_symlink() {
                let _ = fs::remove_file(&symlink_path);
            } else if symlink_path == real_path {
                let _ = fs::remove_dir_all(&symlink_path);
            }
        }
    }

    // 2. Remove real directory if it still exists
    if real_path.exists() {
        fs::remove_dir_all(&real_path).map_err(|e| format!("Error eliminando carpeta del juego: {}", e))?;
    }

    // 3. For legacy folders like "Touhou 12 - Undefined Fantastic Object"
    if game.id == "th12" {
        let legacy = root_dir.join("Touhou 12 - Undefined Fantastic Object");
        if legacy.exists() {
            let _ = fs::remove_dir_all(&legacy);
        }
    }

    Ok(bytes_freed)
}
