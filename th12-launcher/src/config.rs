use std::collections::HashMap;
use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GameConfig {
    pub game_id: String,
    pub display_mode: String, // "fullscreen_fsr", "fullscreen_int", "window_1280", "window_960", "window_640"
    #[serde(default = "default_lang")]
    pub lang: String,         // "es", "en", "ja"
    pub color_32bit: bool,
    pub fps_60: bool,
    pub bgm_volume: u8, // 0..100
    pub se_volume: u8,  // 0..100
    pub pad_deadzone: u16, // 400, 600, 800
}

fn default_lang() -> String {
    "es".to_string()
}

impl GameConfig {
    pub fn default_for(game_id: &str) -> Self {
        Self {
            game_id: game_id.to_string(),
            display_mode: "fullscreen_fsr".to_string(),
            lang: "es".to_string(),
            color_32bit: true,
            fps_60: true,
            bgm_volume: 100,
            se_volume: 100,
            pad_deadzone: 600,
        }
    }
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct GameStats {
    #[serde(default)]
    pub play_time_seconds: u64,
    #[serde(default)]
    pub high_score: u64,
    #[serde(default)]
    pub last_played: Option<String>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct LauncherSettings {
    pub configs: HashMap<String, GameConfig>,
    #[serde(default)]
    pub stats: HashMap<String, GameStats>,
}

pub fn current_timestamp_iso() -> String {
    std::process::Command::new("date")
        .arg("+%Y-%m-%dT%H:%M:%SZ")
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| {
            let secs = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            format!("{}", secs)
        })
}

impl LauncherSettings {
    pub fn load(path: &Path) -> Self {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(settings) = serde_json::from_str::<LauncherSettings>(&content) {
                    return settings;
                }
            }
        }
        Self::default()
    }

    pub fn save(&self, path: &Path) -> Result<(), String> {
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Error serializando configuraciones: {}", e))?;
        fs::write(path, json)
            .map_err(|e| format!("Error guardando configuraciones: {}", e))?;
        Ok(())
    }

    pub fn get_or_default(&self, game_id: &str) -> GameConfig {
        self.configs.get(game_id).cloned().unwrap_or_else(|| GameConfig::default_for(game_id))
    }

    pub fn set_config(&mut self, config: GameConfig) {
        self.configs.insert(config.game_id.clone(), config);
    }

    pub fn get_stats(&self, game_id: &str) -> GameStats {
        self.stats.get(game_id).cloned().unwrap_or_default()
    }

    pub fn set_stats(&mut self, game_id: &str, stats: GameStats) {
        self.stats.insert(game_id.to_string(), stats);
    }

    pub fn record_session(&mut self, game_id: &str, elapsed_seconds: u64, file_score: Option<u64>, file_playtime: Option<u64>) {
        let mut entry = self.get_stats(game_id);
        entry.play_time_seconds += elapsed_seconds;
        if let Some(f_play) = file_playtime {
            if f_play > entry.play_time_seconds {
                entry.play_time_seconds = f_play;
            }
        }
        if let Some(f_score) = file_score {
            if f_score > entry.high_score {
                entry.high_score = f_score;
            }
        }
        entry.last_played = Some(current_timestamp_iso());
        self.stats.insert(game_id.to_string(), entry);
    }
}

// Default 60-byte binary template for Touhou 12 config
const DEFAULT_TH12_CFG: [u8; 60] = [
    0x01, 0x00, 0x12, 0x00, 0x00, 0x00, 0x01, 0x00,
    0x02, 0x00, 0x04, 0x00, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0x03, 0x00, 0x58, 0x02,
    0x58, 0x02, 0x00, 0x01, 0x01, 0x03, 0x00, 0x02,
    0x64, 0x64, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00,
    0x2b, 0x01, 0x00, 0x00, 0x38, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
];

// Default 60-byte binary template for Touhou 13 config
const DEFAULT_TH13_CFG: [u8; 60] = [
    0x01, 0x00, 0x13, 0x00, 0x00, 0x00, 0x01, 0x00,
    0x02, 0x00, 0x04, 0x00, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0x03, 0x00, 0x00, 0x00,
    0x58, 0x02, 0x58, 0x02, 0x00, 0x01, 0x01, 0x03,
    0x00, 0x02, 0x64, 0x64, 0x00, 0x00, 0x00, 0x00,
    0x2b, 0x01, 0x00, 0x00, 0x38, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
];

// Default 56-byte binary template for Touhou 6 config
const DEFAULT_TH06_CFG: [u8; 56] = [
    0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x04, 0x00, // 0x00..0x07 keys
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, // 0x08..0x0f keys
    0x03, 0x00, 0x00, 0x00,                         // 0x10..0x13 keys
    0x02, 0x01, 0x00, 0x00,                         // 0x14..0x17 CONSTANT MAGIC 0x00000102!
    0x02, 0x03,                                     // 0x18..0x19
    0x00,                                           // 0x1a Color depth (0x00 = 32-bit, 0x01 = 16-bit)
    0x01, 0x01, 0x01,                               // 0x1b..0x1d
    0x01,                                           // 0x1e Window mode (0x01 = Windowed, 0x00 = Fullscreen)
    0x00,                                           // 0x1f Frameskip (0x00 = 60fps, 0x01 = 30fps)
    0x58, 0x02,                                     // 0x20..0x21 Pad X deadzone (600)
    0x58, 0x02,                                     // 0x22..0x23 Pad Y deadzone (600)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 0x24..0x2b
    0x00, 0x00, 0x00, 0x00,                         // 0x2c..0x2f
    0x00, 0x00, 0x00, 0x00,                         // 0x30..0x33
    0x01, 0x00, 0x00, 0x00,                         // 0x34..0x37 bitflags
];

/// Applies the game configuration directly to the respective game's configuration files.
pub fn apply_game_config(config: &GameConfig, game_dir: &Path) -> Result<(), String> {
    match config.game_id.as_str() {
        "th06" => apply_th06_config(config, game_dir),
        "th07" | "th08" => apply_th07_config(config, game_dir),
        "th13" => apply_th13_config(config, game_dir),
        _ => apply_th12_config(config, game_dir),
    }
}

fn apply_th12_config(config: &GameConfig, game_dir: &Path) -> Result<(), String> {
    let cfg_name = format!("{}.cfg", config.game_id);
    let cfg_path = game_dir.join(&cfg_name);
    let mut data = if cfg_path.exists() {
        fs::read(&cfg_path).unwrap_or_else(|_| DEFAULT_TH12_CFG.to_vec())
    } else {
        DEFAULT_TH12_CFG.to_vec()
    };

    if data.len() < 60 {
        data.resize(60, 0);
    }

    // Header magic: 0x00120001 (0x01, 0x00, 0x12, 0x00)
    data[0x00] = 0x01;
    data[0x01] = 0x00;
    data[0x02] = 0x12;
    data[0x03] = 0x00;

    // Bytes 0x16-0x17 & 0x18-0x19: Pad deadzone (u16 LE)
    let dz_bytes = config.pad_deadzone.to_le_bytes();
    data[0x16] = dz_bytes[0];
    data[0x17] = dz_bytes[1];
    data[0x18] = dz_bytes[0];
    data[0x19] = dz_bytes[1];

    // Byte 0x1a: Color depth (0 = 32-bit, 1 = 16-bit)
    data[0x1a] = if config.color_32bit { 0x00 } else { 0x01 };

    // Byte 0x1b: BGM enabled (1 = on, 0 = off)
    data[0x1b] = if config.bgm_volume > 0 { 0x01 } else { 0x00 };

    // Byte 0x1c: Sound Effects (SE) enabled (1 = on, 0 = off)
    // CRITICAL: When 0x00, Touhou 12 completely bypasses playing any sound effects!
    data[0x1c] = if config.se_volume > 0 { 0x01 } else { 0x00 };

    // Byte 0x1d: Screen mode
    // 0 = 640x480 full, 1 = 640x480 win, 2 = 960x720 win, 3 = 1280x960 win
    data[0x1d] = match config.display_mode.as_str() {
        "fullscreen_fsr" | "fullscreen_int" | "window_1280" => 0x03,
        "window_960" => 0x02,
        "window_640" => 0x01,
        _ => 0x03,
    };

    // Byte 0x1e: Frameskip (0 = every frame / 60fps, 1 = 1/2 / 30fps)
    data[0x1e] = if config.fps_60 { 0x00 } else { 0x01 };

    // Byte 0x1f: Input sensitivity (default 0x02)
    if data[0x1f] == 0 {
        data[0x1f] = 0x02;
    }

    // Bytes 0x20 & 0x21: Audio volume (0-100)
    data[0x20] = config.bgm_volume.min(100);
    data[0x21] = config.se_volume.min(100);

    // Byte 0x39: Clear bit 0 (bit 8 of 0x38..0x3b DWORD bitflags).
    // This permanently disables the "Please select a window mode" (Dialog 203) prompt at game startup!
    data[0x39] &= !0x01;

    fs::write(&cfg_path, &data)
        .map_err(|e| format!("Error guardando {}: {}", cfg_name, e))?;

    Ok(())
}

fn apply_th13_config(config: &GameConfig, game_dir: &Path) -> Result<(), String> {
    let cfg_name = format!("{}.cfg", config.game_id);
    let cfg_path = game_dir.join(&cfg_name);
    let mut data = if cfg_path.exists() {
        fs::read(&cfg_path).unwrap_or_else(|_| DEFAULT_TH13_CFG.to_vec())
    } else {
        DEFAULT_TH13_CFG.to_vec()
    };

    if data.len() < 60 {
        data.resize(60, 0);
    }

    // Header magic: 0x00130001 (0x01, 0x00, 0x13, 0x00)
    data[0x00] = 0x01;
    data[0x01] = 0x00;
    data[0x02] = 0x13;
    data[0x03] = 0x00;

    // Bytes 0x18-0x19 & 0x1a-0x1b: Pad deadzone (u16 LE)
    let dz_bytes = config.pad_deadzone.to_le_bytes();
    data[0x18] = dz_bytes[0];
    data[0x19] = dz_bytes[1];
    data[0x1a] = dz_bytes[0];
    data[0x1b] = dz_bytes[1];

    // Byte 0x1c: Color depth (0 = 32-bit, 1 = 16-bit)
    data[0x1c] = if config.color_32bit { 0x00 } else { 0x01 };

    // Byte 0x1d: BGM enabled (1 = on, 0 = off)
    data[0x1d] = if config.bgm_volume > 0 { 0x01 } else { 0x00 };

    // Byte 0x1e: Sound Effects (SE) enabled (1 = on, 0 = off)
    data[0x1e] = if config.se_volume > 0 { 0x01 } else { 0x00 };

    // Byte 0x1f: Screen mode
    // 0 = 640x480 full, 1 = 640x480 win, 2 = 960x720 win, 3 = 1280x960 win
    data[0x1f] = match config.display_mode.as_str() {
        "fullscreen_fsr" | "fullscreen_int" | "window_1280" => 0x03,
        "window_960" => 0x02,
        "window_640" => 0x01,
        _ => 0x03,
    };

    // Byte 0x20: Frameskip (0 = every frame / 60fps, 1 = 1/2 / 30fps)
    data[0x20] = if config.fps_60 { 0x00 } else { 0x01 };

    // Byte 0x21: Input sensitivity (default 0x02)
    if data[0x21] == 0 {
        data[0x21] = 0x02;
    }

    // Bytes 0x22 & 0x23: Audio volume (0-100)
    data[0x22] = config.bgm_volume.min(100);
    data[0x23] = config.se_volume.min(100);

    // Byte 0x39: Clear bit 0 (bit 8 of 0x38..0x3b DWORD bitflags).
    data[0x39] &= !0x01;

    fs::write(&cfg_path, &data)
        .map_err(|e| format!("Error guardando {}: {}", cfg_name, e))?;

    Ok(())
}

fn apply_th06_config(config: &GameConfig, game_dir: &Path) -> Result<(), String> {
    // 1. Update or create vpatch.ini
    // Display mode calculations:
    // fullscreen_fsr: 1440x1080 borderless centered on 1920x1080 (4:3 aspect ratio full monitor height)
    // fullscreen_int: 1280x960 borderless centered (2x integer scaling)
    // window_1280: 1280x960 standard window with titlebar
    // window_960: 960x720 standard window with titlebar
    // window_640: 640x480 standard window with titlebar
    let (width, height, titlebar, x, y) = match config.display_mode.as_str() {
        "fullscreen_fsr" | "fullscreen_int" => (640, 480, 0, 0, 0),
        "window_1280" => (1280, 960, 1, 0, 0),
        "window_960" => (960, 720, 1, 0, 0),
        "window_640" => (640, 480, 1, 0, 0),
        _ => (640, 480, 0, 0, 0),
    };

    let fps = if config.fps_60 { 60 } else { 30 };

    let vpatch_content = format!(
r#"[Window]
AskWindowMode = 0
enabled = 1
X = {}
Y = {}
Width = {}
Height = {}
TitleBar = {}
AlwaysOnTop = 0

[Option]
Vsync = 0
SleepType = 1
BltPrepareTime = 4
AutoBltPrepareTime = 1
GameFPS = {}
ReplaySkipFPS = 240
ReplaySlowFPS = 30
CalcFPS = 1
AlwaysBlt = 0
BugFixCherry = 1
BugFixTh10Power3 = 1
"#,
        x, y, width, height, titlebar, fps
    );

    let vpatch_path = game_dir.join("vpatch.ini");
    fs::write(&vpatch_path, vpatch_content)
        .map_err(|e| format!("Error guardando vpatch.ini: {}", e))?;

    // 2. Ensure both 東方紅魔郷.cfg and mojibake version exist with proper windowed flag
    // In 東方紅魔郷.cfg (56 bytes):
    // - 0x14..0x18: MUST ALWAYS BE 0x02, 0x01, 0x00, 0x00 (magic version 0x102)
    // - 0x18: 0x02
    // - 0x19: 0x03
    // - 0x1a: Color depth (0x00 = 32-bit, 0x01 = 16-bit)
    // - 0x1b: 0x01
    // - 0x1c: 0x01
    // - 0x1d: 0x01
    // - 0x1e: Window mode (0x01 = Windowed, 0x00 = Fullscreen). Always keep 0x01 so VPatch handles scaling and Wine doesn't crash into a black corner!
    // - 0x1f: Refresh rate (0x00 = 60fps, 0x01 = 30fps)
    // - 0x20..0x23: Pad deadzone (u16 LE for X and Y)
    let cfg_names = ["東方紅魔郷.cfg", "“Œ•û\u{008d}g–‚‹½.cfg"];
    for name in &cfg_names {
        let p = game_dir.join(name);
        let mut data = if p.exists() && fs::metadata(&p).map(|m| m.len() >= 56).unwrap_or(false) {
            fs::read(&p).unwrap_or_else(|_| DEFAULT_TH06_CFG.to_vec())
        } else {
            DEFAULT_TH06_CFG.to_vec()
        };

        if data.len() < 56 {
            data.resize(56, 0);
        }

        // Magic 0x00000102 at 0x14..0x18
        data[0x14] = 0x02;
        data[0x15] = 0x01;
        data[0x16] = 0x00;
        data[0x17] = 0x00;
        data[0x18] = 0x02;
        data[0x19] = 0x03;

        // Byte 0x1a: Color depth (0x00 = 32-bit, 0x01 = 16-bit)
        data[0x1a] = if config.color_32bit { 0x00 } else { 0x01 };

        data[0x1b] = 0x01;
        data[0x1c] = 0x01;
        data[0x1d] = 0x01;

        // Byte 0x1e: Window mode (0x01 = Windowed, 0x00 = Fullscreen)
        // Keep it windowed (0x01) so VPatch handles scaling and Wine doesn't crash into a black corner!
        data[0x1e] = 0x01;

        // Byte 0x1f: Frameskip (0x00 = 60fps, 0x01 = 30fps)
        data[0x1f] = if config.fps_60 { 0x00 } else { 0x01 };

        // Bytes 0x20-0x23: Pad sensitivity
        let dz_bytes = config.pad_deadzone.to_le_bytes();
        data[0x20] = dz_bytes[0];
        data[0x21] = dz_bytes[1];
        data[0x22] = dz_bytes[0];
        data[0x23] = dz_bytes[1];

        let _ = fs::write(&p, &data);
    }

    Ok(())
}

fn apply_th07_config(config: &GameConfig, game_dir: &Path) -> Result<(), String> {
    // 1. Sync vpatch.ini if present to ensure 640x480 at (0, 0) without titlebar in fullscreen
    let (width, height, titlebar, x, y) = match config.display_mode.as_str() {
        "fullscreen_fsr" | "fullscreen_int" => (640, 480, 0, 0, 0),
        "window_1280" => (1280, 960, 1, 0, 0),
        "window_960" => (960, 720, 1, 0, 0),
        "window_640" => (640, 480, 1, 0, 0),
        _ => (640, 480, 0, 0, 0),
    };
    let fps = if config.fps_60 { 60 } else { 30 };

    let vpatch_path = game_dir.join("vpatch.ini");
    if vpatch_path.exists() {
        let vpatch_content = format!(
r#"[Window]
AskWindowMode = 0
enabled = 1
X = {}
Y = {}
Width = {}
Height = {}
TitleBar = {}
AlwaysOnTop = 0

[Option]
Vsync = 0
SleepType = 1
BltPrepareTime = 4
AutoBltPrepareTime = 1
GameFPS = {}
ReplaySkipFPS = 240
ReplaySlowFPS = 30
CalcFPS = 1
AlwaysBlt = 0
BugFixCherry = 1
BugFixTh10Power3 = 1
"#,
            x, y, width, height, titlebar, fps
        );
        let _ = fs::write(&vpatch_path, vpatch_content);
    }

    // 2. Ensure th07.cfg / th08.cfg and Japanese equivalents have proper Window mode (0x01) and pad deadzone
    let cfg_name = format!("{}.cfg", config.game_id);
    let jp_cfg_name = match config.game_id.as_str() {
        "th07" => "東方妖々夢.cfg",
        "th08" => "東方永夜抄.cfg",
        _ => "",
    };

    let mut target_names = vec![cfg_name.as_str()];
    if !jp_cfg_name.is_empty() {
        target_names.push(jp_cfg_name);
    }

    for name in target_names {
        let p = game_dir.join(name);
        if p.exists() {
            if let Ok(mut data) = fs::read(&p) {
                if data.len() >= 40 {
                    let dz_bytes = config.pad_deadzone.to_le_bytes();
                    data[0x18] = dz_bytes[0];
                    data[0x19] = dz_bytes[1];
                    data[0x1a] = dz_bytes[0];
                    data[0x1b] = dz_bytes[1];

                    // Byte 0x26: Window mode (0x01 = Windowed so Gamescope handles fullscreen scaling)
                    data[0x26] = 0x01;

                    let _ = fs::write(&p, &data);
                }
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_th12_config_apply() {
        let temp_dir = std::env::temp_dir().join("test_th12_cfg");
        let _ = fs::create_dir_all(&temp_dir);

        let config = GameConfig {
            game_id: "th12".into(),
            display_mode: "fullscreen_fsr".into(),
            lang: "es".into(),
            color_32bit: true,
            fps_60: true,
            bgm_volume: 85,
            se_volume: 90,
            pad_deadzone: 400,
        };

        apply_game_config(&config, &temp_dir).expect("Failed to apply th12 config");

        let data = fs::read(temp_dir.join("th12.cfg")).expect("Failed to read th12.cfg");
        assert_eq!(data.len(), 60);
        assert_eq!(data[0x00..0x04], [0x01, 0x00, 0x12, 0x00], "Magic header 0x120001");
        assert_eq!(data[0x1b], 0x01, "BGM enabled");
        assert_eq!(data[0x1c], 0x01, "SE enabled");
        assert_eq!(data[0x1d], 0x03, "Display mode 1280x960");
        assert_eq!(data[0x1a], 0x00, "32-bit color");
        assert_eq!(data[0x1e], 0x00, "60 FPS");
        assert_eq!(data[0x20], 85, "BGM volume");
        assert_eq!(data[0x21], 90, "SE volume");
        assert_eq!(data[0x39] & 0x01, 0x00, "Always ask prompt disabled");
        let dz = u16::from_le_bytes([data[0x16], data[0x17]]);
        assert_eq!(dz, 400, "Deadzone");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_th13_config_apply() {
        let temp_dir = std::env::temp_dir().join("test_th13_cfg");
        let _ = fs::create_dir_all(&temp_dir);

        let config = GameConfig {
            game_id: "th13".into(),
            display_mode: "fullscreen_int".into(),
            lang: "es".into(),
            color_32bit: true,
            fps_60: true,
            bgm_volume: 70,
            se_volume: 80,
            pad_deadzone: 600,
        };

        apply_game_config(&config, &temp_dir).expect("Failed to apply th13 config");

        let data = fs::read(temp_dir.join("th13.cfg")).expect("Failed to read th13.cfg");
        assert_eq!(data.len(), 60);
        assert_eq!(data[0x00..0x04], [0x01, 0x00, 0x13, 0x00], "Magic header 0x130001");
        assert_eq!(data[0x1c], 0x00, "32-bit color");
        assert_eq!(data[0x1d], 0x01, "BGM enabled");
        assert_eq!(data[0x1e], 0x01, "SE enabled");
        assert_eq!(data[0x1f], 0x03, "Display mode 1280x960");
        assert_eq!(data[0x20], 0x00, "60 FPS");
        assert_eq!(data[0x22], 70, "BGM volume");
        assert_eq!(data[0x23], 80, "SE volume");
        assert_eq!(data[0x39] & 0x01, 0x00, "Always ask prompt disabled");
        let dz = u16::from_le_bytes([data[0x18], data[0x19]]);
        assert_eq!(dz, 600, "Deadzone");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_th06_config_apply() {
        let temp_dir = std::env::temp_dir().join("test_th06_cfg");
        let _ = fs::create_dir_all(&temp_dir);

        let config = GameConfig {
            game_id: "th06".into(),
            display_mode: "window_960".into(),
            lang: "es".into(),
            color_32bit: false,
            fps_60: true,
            bgm_volume: 100,
            se_volume: 100,
            pad_deadzone: 600,
        };

        apply_game_config(&config, &temp_dir).expect("Failed to apply th06 config");

        let vpatch = fs::read_to_string(temp_dir.join("vpatch.ini")).expect("Failed to read vpatch.ini");
        assert!(vpatch.contains("Width = 960"));
        assert!(vpatch.contains("Height = 720"));
        assert!(vpatch.contains("TitleBar = 1"));
        assert!(vpatch.contains("GameFPS = 60"));

        let cfg = fs::read(temp_dir.join("東方紅魔郷.cfg")).expect("Failed to read th06 cfg");
        assert_eq!(cfg.len(), 56);
        assert_eq!(&cfg[0x14..0x18], &[0x02, 0x01, 0x00, 0x00], "Magic header 0x102 preserved");
        assert_eq!(cfg[0x1a], 0x01, "16-bit color selected");
        assert_eq!(cfg[0x1e], 0x01, "Windowed mode enabled");
        assert_eq!(cfg[0x1f], 0x00, "60 FPS");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_settings_save_and_load() {
        let temp_file = std::env::temp_dir().join("test_launcher_settings.json");
        let mut settings = LauncherSettings::default();

        let cfg12 = GameConfig {
            game_id: "th12".into(),
            display_mode: "fullscreen_fsr".into(),
            lang: "es".into(),
            color_32bit: true,
            fps_60: true,
            bgm_volume: 80,
            se_volume: 75,
            pad_deadzone: 600,
        };
        settings.set_config(cfg12);

        settings.save(&temp_file).expect("Failed to save settings");
        let loaded = LauncherSettings::load(&temp_file);

        let loaded_12 = loaded.get_or_default("th12");
        assert_eq!(loaded_12.display_mode, "fullscreen_fsr");
        assert_eq!(loaded_12.lang, "es");
        assert_eq!(loaded_12.bgm_volume, 80);
        assert_eq!(loaded_12.se_volume, 75);

        let _ = fs::remove_file(&temp_file);
    }
}
