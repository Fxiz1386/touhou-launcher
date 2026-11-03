use std::path::Path;
use std::process::Command;

use crate::config::{apply_game_config, GameConfig};
use crate::models::GameDef;

pub fn launch_game(
    game: &GameDef,
    game_dir: &Path,
    pfx_dir: &Path,
    mode: &str,
    config: &GameConfig,
) -> Result<u64, String> {
    // 1. Sync game configuration files before starting
    apply_game_config(config, game_dir)?;

    ensure_wine_audio_compatibility(pfx_dir);

    if game.id == "th06" {
        crate::installer::setup_th06_compatibility(game_dir);
    } else if game.id == "th07" {
        crate::installer::setup_th07_compatibility(game_dir);
    } else if game.id == "th08" {
        crate::installer::setup_th08_compatibility(game_dir);
    }
    if game.era.contains("DirectX 8") || game.id == "th06" || game.id == "th07" || game.id == "th08" {
        crate::installer::ensure_dx8_compatibility(game_dir);
    }
    crate::installer::ensure_thcrap_integrity(game_dir, game.id);

    // 2. Collect Wine execution arguments
    let mut wine_args: Vec<String> = Vec::new();

    let thcrap_loader = if game_dir.join("thcrap/bin/thcrap_loader.exe").exists() {
        Some("thcrap/bin/thcrap_loader.exe")
    } else if game_dir.join("thcrap/thcrap_loader.exe").exists() {
        Some("thcrap/thcrap_loader.exe")
    } else {
        None
    };

    if mode == "config" {
        let config_exe = if game_dir.join(game.custom_exe).exists() {
            game.custom_exe
        } else {
            "custom.exe"
        };
        wine_args.push(config_exe.to_string());
    } else {
        let mut launched_with_thcrap = false;

        if let Some(loader) = thcrap_loader {
            let candidates: Vec<&str> = match mode {
                "es" => vec!["thpatch-es.js", "es.js", "thpatch-en.js", "en.js", "keymap.js"],
                "en" => vec!["thpatch-en.js", "en.js", "thpatch-es.js", "es.js", "keymap.js"],
                _ => vec!["keymap.js", "thpatch-en.js", "en.js", "thpatch-es.js", "es.js"],
            };

            for config_file in candidates {
                if game_dir.join("thcrap/config").join(config_file).exists() {
                    wine_args.push(loader.to_string());
                    wine_args.push(config_file.to_string());
                    wine_args.push(game.id.to_string());
                    launched_with_thcrap = true;
                    break;
                }
            }
        }

        if !launched_with_thcrap {
            if game.id == "th06" {
                if (mode == "en" || mode == "es") && game_dir.join("th06 (thpatch-en).exe").exists() {
                    wine_args.push("th06 (thpatch-en).exe".to_string());
                } else if (mode == "en" || mode == "es") && game_dir.join("th06e.exe").exists() {
                    wine_args.push("th06e.exe".to_string());
                } else if game_dir.join("vpatch.exe").exists() {
                    wine_args.push("vpatch.exe".to_string());
                } else if game_dir.join("東方紅魔郷.exe").exists() {
                    wine_args.push("東方紅魔郷.exe".to_string());
                } else if game_dir.join("th06nc.exe").exists() {
                    wine_args.push("th06nc.exe".to_string());
                } else {
                    wine_args.push("th06.exe".to_string());
                }
            } else {
                let en_exe = format!("{} (thpatch-en).exe", game.id);
                let en_exe_alt = format!("{} (en).exe", game.id);
                if (mode == "en" || mode == "es") && game_dir.join(&en_exe).exists() {
                    wine_args.push(en_exe);
                } else if (mode == "en" || mode == "es") && game_dir.join(&en_exe_alt).exists() {
                    wine_args.push(en_exe_alt);
                } else {
                    let chosen_exe = game
                        .main_exes
                        .iter()
                        .find(|exe| game_dir.join(exe).exists())
                        .copied()
                        .unwrap_or(game.main_exes[0]);
                    wine_args.push(chosen_exe.to_string());
                }
            }
        }
    }

    // 3. For fullscreen modes, wrap execution with Gamescope to achieve true fullscreen,
    // avoiding the GNOME top bar and desktop wallpaper while retaining sharp FSR or integer scaling.
    let is_fullscreen = config.display_mode == "fullscreen_fsr" || config.display_mode == "fullscreen_int";
    let has_gamescope = Path::new("/usr/bin/gamescope").exists()
        || Command::new("which")
            .arg("gamescope")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

    let (screen_w, screen_h) = detect_screen_resolution();

    let (game_w, game_h) = match game.id {
        // PC-98 games (TH01 - TH05): native 640x480
        "th01" | "th02" | "th03" | "th04" | "th05" => (640, 480),
        // Classic Windows games (TH06 - TH09.5, TH07.5, TH10.5, TH12.3): native 640x480
        "th06" | "th07" | "th075" | "th08" | "th09" | "th095" | "th105" | "th123" => (640, 480),
        // 16:9 widescreen fighting & action spin-offs (TH13.5, TH14.5, TH15.5, TH17.5): 1280x720
        "th135" | "th145" | "th155" | "th175" => (1280, 720),
        // Modern mainline games (TH10 - TH20): native 1280x960
        _ => (1280, 960),
    };

    let mut cmd = if is_fullscreen && has_gamescope && mode != "config" {
        let mut gs = Command::new("gamescope");
        gs.arg("-w")
            .arg(game_w.to_string())
            .arg("-h")
            .arg(game_h.to_string())
            .arg("-W")
            .arg(screen_w.to_string())
            .arg("-H")
            .arg(screen_h.to_string())
            .arg("-f")
            .arg("--force-windows-fullscreen");

        if config.display_mode == "fullscreen_int" {
            gs.arg("-S").arg("integer").arg("-F").arg("nearest");
        } else {
            gs.arg("-S").arg("fit").arg("-F").arg("fsr");
        }

        gs.arg("--")
            .arg("bash")
            .arg("-c")
            .arg(
                r#"wine "$@" & PID=$!; sleep 1.2; while kill -0 $PID 2>/dev/null || pidof -q "東方紅魔郷.exe" "vpatch.exe" "th06.exe" "th06e.exe" "th075.exe" "th105.exe" "th123.exe" "th135.exe" "th145.exe" "th155.exe" "th175.exe" "th12.exe" "th12 (thpatch-en).exe" "th07.exe" "th08.exe" "th09.exe" "th095.exe" "th10.exe" "th11.exe" "th125.exe" "th128.exe" "th13.exe" "th14.exe" "th143.exe" "th15.exe" "th16.exe" "th165.exe" "th17.exe" "th18.exe" "th185.exe" "th19.exe" "th20.exe" "custom.exe"; do sleep 0.5; done; wineserver -k 2>/dev/null || true; killall -9 winedevice.exe 2>/dev/null || true"#
            )
            .arg("_");

        for arg in wine_args {
            gs.arg(arg);
        }
        gs
    } else {
        let mut b = Command::new("bash");
        b.arg("-c")
            .arg(
                r#"wine "$@" & PID=$!; sleep 1.2; while kill -0 $PID 2>/dev/null || pidof -q "東方紅魔郷.exe" "vpatch.exe" "th06.exe" "th06e.exe" "th075.exe" "th105.exe" "th123.exe" "th135.exe" "th145.exe" "th155.exe" "th175.exe" "th12.exe" "th12 (thpatch-en).exe" "th07.exe" "th08.exe" "th09.exe" "th095.exe" "th10.exe" "th11.exe" "th125.exe" "th128.exe" "th13.exe" "th14.exe" "th143.exe" "th15.exe" "th16.exe" "th165.exe" "th17.exe" "th18.exe" "th185.exe" "th19.exe" "th20.exe" "custom.exe"; do sleep 0.5; done; wineserver -k 2>/dev/null || true; killall -9 winedevice.exe 2>/dev/null || true"#
            )
            .arg("_");
        for arg in wine_args {
            b.arg(arg);
        }
        b
    };

    cmd.current_dir(game_dir)
        .env("WINEPREFIX", pfx_dir)
        .env("WINEDEBUG", "-all")
        .env("WINEFSYNC", "1")
        .env("WINEESYNC", "1")
        .env("PULSE_LATENCY_MSEC", "30");

    if game.era.contains("DirectX 8") || game.id == "th06" || game.id == "th07" || game.id == "th08" || game.id == "th075" {
        cmd.env("DXVK_FRAME_RATE", "60")
           .env("WINEDLLOVERRIDES", "d3d8=n,b");
    }

    let start_time = std::time::Instant::now();
    let mut child = cmd.spawn().map_err(|e| format!("Error ejecutando juego: {}", e))?;
    let _ = child.wait();
    let elapsed = start_time.elapsed().as_secs();
    Ok(elapsed)
}

pub fn ensure_wine_audio_compatibility(pfx_dir: &Path) {
    let user_reg = pfx_dir.join("user.reg");
    if user_reg.exists() {
        if let Ok(content) = std::fs::read_to_string(&user_reg) {
            if !content.contains("[Software\\\\Wine\\\\DirectSound]") {
                let ds_entry = "\n[Software\\\\Wine\\\\DirectSound]\n\"DefaultBitsPerSample\"=dword:00000010\n\"DefaultSampleRate\"=dword:0000ac44\n\"HardwareAcceleration\"=\"Emulation\"\n\"SpeakerConfig\"=dword:00000004\n";
                use std::io::Write;
                if let Ok(mut file) = std::fs::OpenOptions::new().append(true).open(&user_reg) {
                    let _ = file.write_all(ds_entry.as_bytes());
                }
            }
        }
    }
}

pub fn detect_screen_resolution() -> (u32, u32) {
    if let Ok(entries) = std::fs::read_dir("/sys/class/drm") {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Ok(status) = std::fs::read_to_string(path.join("status")) {
                if status.trim() == "connected" {
                    if let Ok(modes) = std::fs::read_to_string(path.join("modes")) {
                        if let Some(first_mode) = modes.lines().next() {
                            let parts: Vec<&str> = first_mode.split('x').collect();
                            if parts.len() == 2 {
                                if let (Ok(w), Ok(h)) = (parts[0].parse::<u32>(), parts[1].parse::<u32>()) {
                                    return (w, h);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    (1920, 1080)
}
