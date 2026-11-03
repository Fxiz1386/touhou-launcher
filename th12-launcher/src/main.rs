slint::include_modules!();

mod config;
mod installer;
mod models;
mod patcher;
mod runner;
mod scanner;
mod score;

use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};

use config::{apply_game_config, LauncherSettings};
use installer::install_zip;
use models::{find_game_def, GameStatus};
use runner::launch_game;
use scanner::scan_for_zips;

fn get_project_root() -> PathBuf {
    if let Ok(dir) = env::var("TOUHOU_PROJECT_DIR") {
        let p = PathBuf::from(dir);
        if p.exists() {
            return p;
        }
    }
    let current = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    if current.join("games").exists() || current.join("Touhou 12 - Undefined Fantastic Object").exists() {
        return current;
    }
    if let Some(parent) = current.parent() {
        if parent.join("games").exists() || parent.join("Touhou 12 - Undefined Fantastic Object").exists() {
            return parent.to_path_buf();
        }
    }
    if let Ok(exe) = env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            if exe_dir.join("games").exists() || exe_dir.join("Touhou 12 - Undefined Fantastic Object").exists() {
                return exe_dir.to_path_buf();
            }
        }
    }
    current
}

fn update_ui_for_game(
    ui: &AppWindow,
    game_id: &str,
    games_dir: &Path,
    settings: &LauncherSettings,
) {
    if let Some(def) = find_game_def(game_id) {
        let status = GameStatus::check(def, games_dir);
        ui.set_selected_game_id(def.id.into());
        ui.set_selected_game_title(def.title.into());
        ui.set_selected_game_subtitle(def.subtitle.into());
        ui.set_selected_game_era(def.era.into());
        ui.set_selected_game_desc(def.description.into());
        ui.set_is_selected_installed(status.installed);

        // Load and apply this game's display and config settings to the UI
        let cfg = settings.get_or_default(game_id);
        ui.set_selected_lang(cfg.lang.clone().into());
        ui.set_selected_display_mode(cfg.display_mode.into());
        ui.set_cfg_color_32bit(cfg.color_32bit);
        ui.set_cfg_fps_60(cfg.fps_60);
        ui.set_cfg_bgm_vol(cfg.bgm_volume as i32);
        ui.set_cfg_se_vol(cfg.se_volume as i32);
        ui.set_cfg_pad_deadzone(cfg.pad_deadzone as i32);

        // If not installed, check if there is an installer ZIP already present
        if !status.installed {
            let found = scan_for_zips(games_dir);
            if let Some(matching) = found.iter().find(|z| z.game_id == game_id) {
                ui.set_detected_zip_path(matching.zip_path.to_string_lossy().to_string().into());
                ui.set_detected_zip_name(matching.filename.clone().into());
            } else {
                ui.set_detected_zip_path("".into());
                ui.set_detected_zip_name("".into());
            }
        } else {
            ui.set_detected_zip_path("".into());
            ui.set_detected_zip_name("".into());
        }
    }

    // Refresh general install badges
    if let Some(th06_def) = find_game_def("th06") {
        let s06 = GameStatus::check(th06_def, games_dir);
        ui.set_th06_installed(s06.installed);
    }
    if let Some(th12_def) = find_game_def("th12") {
        let s12 = GameStatus::check(th12_def, games_dir);
        ui.set_th12_installed(s12.installed);
    }
    if let Some(th13_def) = find_game_def("th13") {
        let s13 = GameStatus::check(th13_def, games_dir);
        ui.set_th13_installed(s13.installed);
    }
}

fn run_cli(args: &[String]) -> Result<(), slint::PlatformError> {
    let root = get_project_root();
    let games_dir = root.join("games");
    let pfx_dir = root.join("pfx");
    let settings_path = root.join("launcher_settings.json");
    let mut settings = LauncherSettings::load(&settings_path);

    let subcmd = args.get(0).map(|s| s.as_str()).unwrap_or("status");
    match subcmd {
        "status" => {
            let mut list = Vec::new();
            let mut settings_dirty = false;
            for def in models::GAMES {
                let status = GameStatus::check(def, &games_dir);
                let cfg = settings.get_or_default(def.id);
                let mut stats = settings.get_stats(def.id);

                if let Some(dir) = &status.path {
                    let (file_score, file_playtime) = score::scan_game_score_and_playtime(def, dir, &pfx_dir);
                    if file_score > stats.high_score {
                        stats.high_score = file_score;
                        settings_dirty = true;
                    }
                    if file_playtime > stats.play_time_seconds {
                        stats.play_time_seconds = file_playtime;
                        settings_dirty = true;
                    }
                    if settings_dirty {
                        settings.set_stats(def.id, stats.clone());
                    }
                }

                list.push(serde_json::json!({
                    "id": def.id,
                    "title": def.title,
                    "subtitle": def.subtitle,
                    "era": def.era,
                    "installed": status.installed,
                    "path": status.path.map(|p| p.to_string_lossy().to_string()),
                    "has_spanish": status.has_spanish,
                    "has_english": status.has_english,
                    "has_japanese": status.has_japanese,
                    "display_mode": cfg.display_mode,
                    "language": cfg.lang,
                    "color_32bit": cfg.color_32bit,
                    "fps_60": cfg.fps_60,
                    "bgm_volume": cfg.bgm_volume,
                    "se_volume": cfg.se_volume,
                    "pad_deadzone": cfg.pad_deadzone,
                    "play_time_seconds": stats.play_time_seconds,
                    "play_time_minutes": stats.play_time_seconds / 60,
                    "high_score": stats.high_score,
                    "last_played": stats.last_played,
                }));
            }
            if settings_dirty {
                let _ = settings.save(&settings_path);
            }
            println!("{}", serde_json::to_string_pretty(&list).unwrap_or_default());
        }
        "launch" => {
            let game_id = args.get(1).map(|s| s.as_str()).unwrap_or("th12");
            let mode = args.get(2).map(|s| s.as_str()).unwrap_or("fullscreen_fsr");
            let lang = args.get(3).map(|s| s.as_str()).unwrap_or("es");

            if let Some(def) = find_game_def(game_id) {
                let status = GameStatus::check(def, &games_dir);
                if let Some(dir) = status.path {
                    let mut cfg = settings.get_or_default(game_id);
                    cfg.display_mode = mode.to_string();
                    cfg.lang = lang.to_string();
                    let _ = config::apply_game_config(&cfg, &dir);
                    settings.set_config(cfg.clone());
                    let _ = settings.save(&settings_path);

                    println!("Launching {} in mode {} ({})", def.title, mode, lang);
                    match runner::launch_game(def, &dir, &pfx_dir, lang, &cfg) {
                        Ok(elapsed) => {
                            let (file_score, file_playtime) = score::scan_game_score_and_playtime(def, &dir, &pfx_dir);
                            settings.record_session(game_id, elapsed, Some(file_score), Some(file_playtime));
                            let _ = settings.save(&settings_path);
                            let stats = settings.get_stats(game_id);
                            println!("{}", serde_json::json!({
                                "success": true,
                                "session_seconds": elapsed,
                                "play_time_seconds": stats.play_time_seconds,
                                "play_time_minutes": stats.play_time_seconds / 60,
                                "high_score": stats.high_score,
                                "last_played": stats.last_played,
                            }));
                        }
                        Err(e) => {
                            eprintln!("Launch error: {}", e);
                        }
                    }
                } else {
                    eprintln!("Game {} is not installed", game_id);
                }
            } else {
                eprintln!("Unknown game {}", game_id);
            }
        }
        "install" => {
            if let Some(zip_path_str) = args.get(1) {
                let zip_path = PathBuf::from(zip_path_str);
                let password = args.get(2).map(|s| s.as_str());
                match installer::install_zip(&zip_path, &games_dir, password) {
                    Ok(result) => {
                        println!("{}", serde_json::json!({
                            "success": true,
                            "game_id": result.game_id,
                            "game_name": result.game_name,
                            "target_dir": result.target_dir.to_string_lossy(),
                            "files_extracted": result.files_extracted,
                        }));
                    }
                    Err(e) => {
                        println!("{}", serde_json::json!({
                            "success": false,
                            "error": e,
                        }));
                    }
                }
            } else {
                println!("{}", serde_json::json!({
                    "success": false,
                    "error": "Missing ZIP file path",
                }));
            }
        }
        "scan" => {
            let found = scanner::scan_for_zips(&games_dir);
            let out: Vec<_> = found.into_iter().map(|item| {
                serde_json::json!({
                    "path": item.zip_path.to_string_lossy().to_string(),
                    "fileName": item.filename,
                    "gameId": item.game_id,
                    "gameTitle": item.game_title,
                })
            }).collect();
            println!("{}", serde_json::to_string(&out).unwrap_or_default());
        }
        "config" => {
            let game_id = args.get(1).map(|s| s.as_str()).unwrap_or("th12");
            let mut cfg = settings.get_or_default(game_id);
            if let Some(val) = args.get(2) { cfg.color_32bit = val == "true" || val == "1"; }
            if let Some(val) = args.get(3) { cfg.fps_60 = val == "true" || val == "1"; }
            if let Some(val) = args.get(4).and_then(|s| s.parse().ok()) { cfg.bgm_volume = val; }
            if let Some(val) = args.get(5).and_then(|s| s.parse().ok()) { cfg.se_volume = val; }
            if let Some(val) = args.get(6).and_then(|s| s.parse().ok()) { cfg.pad_deadzone = val; }
            if let Some(val) = args.get(7) { cfg.display_mode = val.to_string(); }
            if let Some(val) = args.get(8) { cfg.lang = val.to_string(); }

            if let Some(def) = find_game_def(game_id) {
                let status = GameStatus::check(def, &games_dir);
                if let Some(dir) = status.path {
                    let _ = config::apply_game_config(&cfg, &dir);
                }
            }
            settings.set_config(cfg);
            let _ = settings.save(&settings_path);
            println!("{}", serde_json::json!({ "success": true }));
        }
        "uninstall" => {
            let game_id = args.get(1).map(|s| s.as_str()).unwrap_or("");
            let keep_saves = args.get(2).map(|s| s == "true" || s == "1").unwrap_or(true);
            if let Some(def) = find_game_def(game_id) {
                let status = GameStatus::check(def, &games_dir);
                if let Some(dir) = status.path {
                    if keep_saves {
                        let backup = root.join("saves_backup").join(game_id);
                        let _ = std::fs::create_dir_all(&backup);
                        if let Ok(entries) = std::fs::read_dir(&dir) {
                            for e in entries.flatten() {
                                let name = e.file_name().to_string_lossy().to_string();
                                if name.ends_with(".dat") || name.ends_with(".rpy") {
                                    let _ = std::fs::copy(e.path(), backup.join(&name));
                                }
                            }
                        }
                    }
                    let _ = std::fs::remove_dir_all(&dir);
                    println!("{}", serde_json::json!({ "success": true }));
                } else {
                    eprintln!("Game not installed");
                }
            }
        }
        "update-patches" => {
            let game_id = args.get(1).map(|s| s.as_str()).unwrap_or("");
            if let Some(def) = find_game_def(game_id) {
                let status = GameStatus::check(def, &games_dir);
                if let Some(dir) = status.path {
                    match patcher::patch_game(game_id, &dir) {
                        Ok(msg) => println!("{}", serde_json::json!({ "success": true, "message": msg })),
                        Err(e) => eprintln!("{}", serde_json::json!({ "success": false, "error": e })),
                    }
                }
            }
        }
        _ => {
            eprintln!("Unknown CLI command: {}", subcmd);
        }
    }
    Ok(())
}

fn main() -> Result<(), slint::PlatformError> {
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 && args[1] == "cli" {
        return run_cli(&args[2..]);
    }

    let _ = slint::set_xdg_app_id("touhou-launcher");
    let ui = AppWindow::new()?;
    let _ = slint::set_xdg_app_id("touhou-launcher");
    let root = get_project_root();
    let games_dir = root.join("games");
    let pfx_dir = root.join("pfx");
    let settings_path = root.join("launcher_settings.json");

    let settings = Arc::new(Mutex::new(LauncherSettings::load(&settings_path)));

    // Initial state: default to th12
    {
        let s = settings.lock().unwrap();
        update_ui_for_game(&ui, "th12", &games_dir, &s);
    }

    // On select game
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    let settings_clone = Arc::clone(&settings);
    ui.on_select_game(move |game_id| {
        if let Some(ui) = ui_handle.upgrade() {
            let s = settings_clone.lock().unwrap();
            update_ui_for_game(&ui, &game_id, &games_dir_clone, &s);
            ui.set_status_msg(format!("Juego seleccionado: {}", game_id).into());
            ui.set_is_status_error(false);
        }
    });

    // On change display mode (quick resolution selector)
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    let settings_clone = Arc::clone(&settings);
    let settings_path_clone = settings_path.clone();
    ui.on_change_display_mode(move |game_id, display_mode| {
        let mut s = settings_clone.lock().unwrap();
        let mut cfg = s.get_or_default(&game_id);
        cfg.display_mode = display_mode.to_string();
        s.set_config(cfg.clone());
        let _ = s.save(&settings_path_clone);

        if let Some(def) = find_game_def(&game_id) {
            let status = GameStatus::check(def, &games_dir_clone);
            if let Some(dir) = status.path {
                let _ = apply_game_config(&cfg, &dir);
            }
        }

        if let Some(ui) = ui_handle.upgrade() {
            let mode_name = match display_mode.as_str() {
                "fullscreen_fsr" => "Pantalla Completa (FSR 60 FPS)",
                "fullscreen_int" => "Pantalla Completa (Entero Pixel-Art)",
                "window_1280" => "Ventana HD (1280x960)",
                "window_960" => "Ventana Mediana (960x720)",
                "window_640" => "Ventana Clásica (640x480)",
                _ => display_mode.as_str(),
            };
            ui.set_status_msg(format!("✓ Modo de pantalla actualizado a: {}", mode_name).into());
            ui.set_is_status_error(false);
        }
    });

    // On change language
    let settings_clone = Arc::clone(&settings);
    let settings_path_clone = settings_path.clone();
    ui.on_change_language(move |game_id, lang| {
        let mut s = settings_clone.lock().unwrap();
        let mut cfg = s.get_or_default(&game_id);
        cfg.lang = lang.to_string();
        s.set_config(cfg);
        let _ = s.save(&settings_path_clone);
    });

    // On save full game config from modal
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    let settings_clone = Arc::clone(&settings);
    let settings_path_clone = settings_path.clone();
    ui.on_save_game_config(move |game_id, display_mode, color_32bit, fps_60, bgm_vol, se_vol, pad_deadzone| {
        let mut cfg = {
            let s = settings_clone.lock().unwrap();
            s.get_or_default(&game_id)
        };
        cfg.display_mode = display_mode.to_string();
        cfg.color_32bit = color_32bit;
        cfg.fps_60 = fps_60;
        cfg.bgm_volume = bgm_vol.clamp(0, 100) as u8;
        cfg.se_volume = se_vol.clamp(0, 100) as u8;
        cfg.pad_deadzone = pad_deadzone.clamp(100, 1000) as u16;

        {
            let mut s = settings_clone.lock().unwrap();
            s.set_config(cfg.clone());
            let _ = s.save(&settings_path_clone);
        }

        let mut applied = false;
        if let Some(def) = find_game_def(&game_id) {
            let status = GameStatus::check(def, &games_dir_clone);
            if let Some(dir) = status.path {
                let _ = apply_game_config(&cfg, &dir);
                applied = true;
            }
        }

        if let Some(ui) = ui_handle.upgrade() {
            ui.set_selected_display_mode(cfg.display_mode.into());
            ui.set_cfg_color_32bit(cfg.color_32bit);
            ui.set_cfg_fps_60(cfg.fps_60);
            ui.set_cfg_bgm_vol(cfg.bgm_volume as i32);
            ui.set_cfg_se_vol(cfg.se_volume as i32);
            ui.set_cfg_pad_deadzone(cfg.pad_deadzone as i32);

            let msg = if applied {
                format!("✓ Ajustes guardados y aplicados directamente al juego ({})", game_id)
            } else {
                format!("✓ Ajustes guardados para {}", game_id)
            };
            ui.set_status_msg(msg.into());
            ui.set_is_status_error(false);
        }
    });

    // On play game
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    let pfx_clone = pfx_dir.clone();
    let settings_clone = Arc::clone(&settings);
    let settings_path_clone = settings_path.clone();
    ui.on_play_game(move |game_id, lang| {
        if let Some(def) = find_game_def(&game_id) {
            let status = GameStatus::check(def, &games_dir_clone);
            if let Some(dir) = status.path {
                let cfg = {
                    let mut s = settings_clone.lock().unwrap();
                    let mut c = s.get_or_default(&game_id);
                    c.lang = lang.to_string();
                    s.set_config(c.clone());
                    let _ = s.save(&settings_path_clone);
                    c
                };

                if let Some(ui) = ui_handle.upgrade() {
                    let mode_desc = match cfg.display_mode.as_str() {
                        "fullscreen_fsr" => "Pantalla Completa FSR",
                        "fullscreen_int" => "Retro Pixel-Art",
                        "window_1280" => "Ventana HD",
                        "window_960" => "Ventana 960x720",
                        _ => "Ventana 640x480",
                    };
                    ui.set_status_msg(format!("Iniciando {} [{}] en modo {}...", def.title, lang, mode_desc).into());
                    ui.set_is_status_error(false);
                }

                if let Err(e) = launch_game(def, &dir, &pfx_clone, &lang, &cfg) {
                    if let Some(ui) = ui_handle.upgrade() {
                        ui.set_status_msg(format!("Error al ejecutar: {}", e).into());
                        ui.set_is_status_error(true);
                    }
                }
            } else if let Some(ui) = ui_handle.upgrade() {
                ui.set_status_msg("El juego no está instalado. Instálalo primero con un archivo .ZIP.".into());
                ui.set_is_status_error(true);
            }
        }
    });

    // On open legacy custom.exe config
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    let pfx_clone = pfx_dir.clone();
    let settings_clone = Arc::clone(&settings);
    ui.on_open_config(move |game_id| {
        if let Some(def) = find_game_def(&game_id) {
            let status = GameStatus::check(def, &games_dir_clone);
            if let Some(dir) = status.path {
                let cfg = {
                    let s = settings_clone.lock().unwrap();
                    s.get_or_default(&game_id)
                };
                if let Some(ui) = ui_handle.upgrade() {
                    ui.set_status_msg(format!("Abriendo custom.exe clásico para {}...", def.title).into());
                    ui.set_is_status_error(false);
                }
                let _ = launch_game(def, &dir, &pfx_clone, "config", &cfg);
            }
        }
    });

    // On open folder
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    ui.on_open_folder(move |game_id| {
        if let Some(def) = find_game_def(&game_id) {
            let status = GameStatus::check(def, &games_dir_clone);
            let dir_to_open = status.path.unwrap_or_else(|| games_dir_clone.clone());
            let _ = Command::new("xdg-open").arg(&dir_to_open).spawn();
            if let Some(ui) = ui_handle.upgrade() {
                ui.set_status_msg(format!("Carpeta abierta: {}", dir_to_open.display()).into());
                ui.set_is_status_error(false);
            }
        }
    });

    // On update patches
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    ui.on_update_patches(move |game_id| {
        if let Some(def) = find_game_def(&game_id) {
            let status = GameStatus::check(def, &games_dir_clone);
            if let Some(dir) = status.path {
                if let Some(ui) = ui_handle.upgrade() {
                    ui.set_status_msg(format!("Descargando y optimizando parches para {}...", def.title).into());
                    ui.set_is_status_error(false);
                }
                match patcher::patch_game(&game_id, &dir) {
                    Ok(msg) => {
                        if let Some(ui) = ui_handle.upgrade() {
                            ui.set_status_msg(format!("✓ {}", msg).into());
                            ui.set_is_status_error(false);
                        }
                    }
                    Err(e) => {
                        if let Some(ui) = ui_handle.upgrade() {
                            ui.set_status_msg(format!("Error aplicando parches: {}", e).into());
                            ui.set_is_status_error(true);
                        }
                    }
                }
            }
        }
    });

    // On pick zip and install
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    let settings_clone = Arc::clone(&settings);
    ui.on_pick_zip_and_install(move || {
        let file = rfd::FileDialog::new()
            .add_filter("Archivos ZIP de Touhou", &["zip"])
            .set_title("Selecciona el archivo .ZIP de Touhou")
            .pick_file();

        if let Some(path) = file {
            if let Some(ui) = ui_handle.upgrade() {
                ui.set_status_msg(format!("Extrayendo y preparando {}...", path.file_name().unwrap_or_default().to_string_lossy()).into());
                ui.set_is_status_error(false);
            }

            match install_zip(&path, &games_dir_clone, None) {
                Ok(result) => {
                    if let Some(ui) = ui_handle.upgrade() {
                        let s = settings_clone.lock().unwrap();
                        update_ui_for_game(&ui, &result.game_id, &games_dir_clone, &s);
                        ui.set_status_msg(format!("✓ ¡{} instalado con éxito! ({} archivos preparados)", result.game_name, result.files_extracted).into());
                        ui.set_is_status_error(false);
                    }
                }
                Err(err) => {
                    if let Some(ui) = ui_handle.upgrade() {
                        ui.set_status_msg(format!("Error instalando ZIP: {}", err).into());
                        ui.set_is_status_error(true);
                    }
                }
            }
        }
    });

    // On auto scan zips
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    let settings_clone = Arc::clone(&settings);
    ui.on_auto_scan_zips(move || {
        let found = scan_for_zips(&games_dir_clone);
        if let Some(ui) = ui_handle.upgrade() {
            if found.is_empty() {
                ui.set_status_msg("No se encontraron nuevos archivos .ZIP en Descargas ni en la carpeta actual.".into());
                ui.set_is_status_error(false);
            } else {
                let first = &found[0];
                ui.set_status_msg(format!("Instalando detectado: {} ({})", first.filename, first.game_title).into());
                ui.set_is_status_error(false);

                match install_zip(&first.zip_path, &games_dir_clone, None) {
                    Ok(result) => {
                        let s = settings_clone.lock().unwrap();
                        update_ui_for_game(&ui, &result.game_id, &games_dir_clone, &s);
                        ui.set_status_msg(format!("✓ ¡{} instalado con éxito desde Descargas!", result.game_name).into());
                        ui.set_is_status_error(false);
                    }
                    Err(e) => {
                        ui.set_status_msg(format!("Error: {}", e).into());
                        ui.set_is_status_error(true);
                    }
                }
            }
        }
    });

    // On request uninstall (open confirmation modal)
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    ui.on_request_uninstall(move |game_id| {
        if let Some(def) = find_game_def(&game_id) {
            let (_bytes, size_str) = installer::get_game_dir_size(def, &games_dir_clone);
            if let Some(ui) = ui_handle.upgrade() {
                ui.set_uninstall_game_name(def.title.into());
                ui.set_uninstall_size_str(size_str.into());
                ui.set_uninstall_keep_saves(true);
                ui.set_show_uninstall_modal(true);
            }
        }
    });

    // On confirm uninstall
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    let root_clone = root.clone();
    let settings_clone = Arc::clone(&settings);
    ui.on_confirm_uninstall(move |game_id, keep_saves| {
        if let Some(def) = find_game_def(&game_id) {
            match installer::uninstall_game(def, &games_dir_clone, &root_clone, keep_saves) {
                Ok(freed_bytes) => {
                    let freed_str = installer::format_size(freed_bytes);
                    if let Some(ui) = ui_handle.upgrade() {
                        let s = settings_clone.lock().unwrap();
                        update_ui_for_game(&ui, &game_id, &games_dir_clone, &s);
                        let saves_msg = if keep_saves {
                            " (partidas guardadas preservadas en backups)"
                        } else {
                            ""
                        };
                        ui.set_status_msg(format!("✓ {} desinstalado con éxito. Se liberaron {}{}.", def.title, freed_str, saves_msg).into());
                        ui.set_is_status_error(false);
                    }
                }
                Err(e) => {
                    if let Some(ui) = ui_handle.upgrade() {
                        ui.set_status_msg(format!("Error desinstalando: {}", e).into());
                        ui.set_is_status_error(true);
                    }
                }
            }
        }
    });

    // On install detected zip
    let ui_handle = ui.as_weak();
    let games_dir_clone = games_dir.clone();
    let settings_clone = Arc::clone(&settings);
    ui.on_install_detected_zip(move |zip_path_str| {
        let zip_path = PathBuf::from(zip_path_str.as_str());
        if let Some(ui) = ui_handle.upgrade() {
            ui.set_status_msg(format!("Instalando {}...", zip_path.file_name().unwrap_or_default().to_string_lossy()).into());
            ui.set_is_status_error(false);
        }

        match installer::install_zip(&zip_path, &games_dir_clone, None) {
            Ok(result) => {
                if let Some(ui) = ui_handle.upgrade() {
                    let s = settings_clone.lock().unwrap();
                    update_ui_for_game(&ui, &result.game_id, &games_dir_clone, &s);
                    ui.set_status_msg(format!("✓ ¡{} instalado con éxito! ({} archivos preparados)", result.game_name, result.files_extracted).into());
                    ui.set_is_status_error(false);
                }
            }
            Err(e) => {
                if let Some(ui) = ui_handle.upgrade() {
                    ui.set_status_msg(format!("Error instalando ZIP: {}", e).into());
                    ui.set_is_status_error(true);
                }
            }
        }
    });

    ui.run()
}
