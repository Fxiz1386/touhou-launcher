use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use std::process::Command;

fn download_file(url: &str, dest: &Path) -> Result<(), String> {
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Error creando directorio {}: {}", parent.display(), e))?;
    }

    let status = Command::new("curl")
        .arg("-sL")
        .arg("--fail")
        .arg(url)
        .arg("-o")
        .arg(dest)
        .status()
        .map_err(|e| format!("Error ejecutando curl para {}: {}", url, e))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("Fallo descargando {}", url))
    }
}

pub fn auto_patch_th06(game_dir: &Path) -> Result<String, String> {
    // 1. Direct3D 8 to 9 wrapper
    let d3d8_path = game_dir.join("d3d8.dll");
    if !d3d8_path.exists() {
        let embedded_d3d8 = include_bytes!("../assets/d3d8.dll");
        let mut f = File::create(&d3d8_path).map_err(|e| format!("Error creando d3d8.dll: {}", e))?;
        f.write_all(embedded_d3d8).map_err(|e| format!("Error escribiendo d3d8.dll: {}", e))?;
    }

    // 2. Framerate limiter dxvk.conf
    let dxvk_conf = game_dir.join("dxvk.conf");
    let _ = fs::write(dxvk_conf, "d3d8.maxFrameRate = 60\nd3d9.maxFrameRate = 60\nd3d9.presentInterval = 1\n");

    // 3. vpatch.ini setup
    let vpatch_ini = game_dir.join("vpatch.ini");
    if !vpatch_ini.exists() {
        let ini_content = "[Window]\nAskWindowMode = 0\nenabled = 1\nX = 300\nY = 20\nWidth = 960\nHeight = 720\nTitleBar = 1\nAlwaysOnTop = 0\n\n[Option]\nVsync = 0\nSleepType = 1\nBltPrepareTime = 4\nAutoBltPrepareTime = 1\nGameFPS = 60\nReplaySkipFPS = 240\nReplaySlowFPS = 30\nCalcFPS = 1\nAlwaysBlt = 0\nBugFixCherry = 1\nBugFixTh10Power3 = 1\n";
        let _ = fs::write(vpatch_ini, ini_content);
    }

    // 4. Download Spanish translations from Ghildrean repository
    let base_url = "https://raw.githubusercontent.com/Ghildrean/touhou-es-es/master/ghildrean/";
    let repo_dir = game_dir.join("thcrap/repos/ghildrean/ghildrean");

    let files_to_download = [
        "patch.js",
        "th06/spells.js",
        "th06/musiccmt.js",
        "th06/msg1.dat.jdiff",
        "th06/msg2.dat.jdiff",
        "th06/msg3.dat.jdiff",
        "th06/msg4.dat.jdiff",
        "th06/msg5.dat.jdiff",
        "th06/msg6.dat.jdiff",
        "th06/msg7.dat.jdiff",
    ];

    let mut downloaded_count = 0;
    for rel in files_to_download.iter() {
        let dest = repo_dir.join(rel);
        if !dest.exists() {
            let url = format!("{}{}", base_url, rel);
            if download_file(&url, &dest).is_ok() {
                downloaded_count += 1;
            }
        } else {
            downloaded_count += 1;
        }
    }

    // 5. Setup thcrap configs
    let config_dir = game_dir.join("thcrap/config");
    fs::create_dir_all(&config_dir).map_err(|e| format!("Error creando config dir: {}", e))?;

    let thpatch_es = r#"{
  "console": false,
  "dat_dump": false,
  "patches": [
    { "archive": "repos/nmlgc/base_tsa/" },
    { "archive": "repos/nmlgc/script_latin/" },
    { "archive": "repos/nmlgc/western_name_order/" },
    { "archive": "repos/thpatch/lang_en/" },
    { "archive": "repos/ghildrean/ghildrean/" }
  ]
}"#;
    let _ = fs::write(config_dir.join("thpatch-es.js"), thpatch_es);
    crate::installer::setup_th06_compatibility(game_dir);
    crate::installer::ensure_thcrap_integrity(game_dir, "th06");

    Ok(format!("Touhou 6 optimizado: 60 FPS fix (d3d8to9 + vpatch) y {} textos en Español preparados.", downloaded_count))
}

pub fn auto_patch_th12(game_dir: &Path) -> Result<String, String> {
    let repo_dir = game_dir.join("thcrap/repos/thpatch/lang_es");
    fs::create_dir_all(&repo_dir).map_err(|e| format!("Error creando repo dir: {}", e))?;

    // Download manifest and patch.js
    let patch_js_path = repo_dir.join("patch.js");
    if !patch_js_path.exists() {
        let _ = download_file("https://srv.thpatch.net/lang_es/patch.js", &patch_js_path);
    }
    let files_js_path = repo_dir.join("files.js");
    if !files_js_path.exists() {
        let _ = download_file("https://srv.thpatch.net/lang_es/files.js", &files_js_path);
    }

    // Download key th12 translation files if missing
    let base_url = "https://srv.thpatch.net/lang_es/";
    let essential_files = [
        "th12/stringdefs.js",
        "th12/title/title01.png",
        "th12/title/weapon.png",
        "th12/title/rank00.png",
        "th12/title/select01.png",
        "th12/title/result00.png",
        "stringdefs.js",
        "themes.js",
    ];

    let mut count = 0;
    for rel in essential_files.iter() {
        let dest = repo_dir.join(rel);
        if !dest.exists() {
            let url = format!("{}{}", base_url, rel);
            if download_file(&url, &dest).is_ok() {
                count += 1;
            }
        } else {
            count += 1;
        }
    }

    // Configure thcrap config
    let config_dir = game_dir.join("thcrap/config");
    fs::create_dir_all(&config_dir).map_err(|e| format!("Error creando config dir: {}", e))?;

    let thpatch_es = r#"{
  "console": false,
  "dat_dump": false,
  "patches": [
    { "archive": "repos/nmlgc/base_tsa/" },
    { "archive": "repos/nmlgc/base_tasofro/" },
    { "archive": "repos/nmlgc/script_latin/" },
    { "archive": "repos/nmlgc/western_name_order/" },
    { "archive": "repos/thpatch/lang_en/" },
    { "archive": "repos/thpatch/lang_es/" }
  ]
}"#;
    let _ = fs::write(config_dir.join("thpatch-es.js"), thpatch_es);

    let games_js = r#"{
  "th12": "../th12.exe",
  "th12_custom": "../custom.exe"
}"#;
    let _ = fs::write(config_dir.join("games.js"), games_js);
    crate::installer::ensure_thcrap_integrity(game_dir, "th12");

    Ok(format!("Touhou 12 optimizado: DXVK activo y perfil en Español preparado ({} componentes)", count))
}

pub fn auto_patch_th13(game_dir: &Path) -> Result<String, String> {
    let repo_dir = game_dir.join("thcrap/repos/thpatch/lang_es");
    fs::create_dir_all(&repo_dir).map_err(|e| format!("Error creando repo dir: {}", e))?;

    // Download manifest and patch.js
    let patch_js_path = repo_dir.join("patch.js");
    if !patch_js_path.exists() {
        let _ = download_file("https://srv.thpatch.net/lang_es/patch.js", &patch_js_path);
    }
    let files_js_path = repo_dir.join("files.js");
    if !files_js_path.exists() {
        let _ = download_file("https://srv.thpatch.net/lang_es/files.js", &files_js_path);
    }

    // Download key th13 translation files if missing
    let base_url = "https://srv.thpatch.net/lang_es/";
    let essential_files = [
        "th13/stringdefs.js",
        "stringdefs.js",
        "themes.js",
    ];

    let mut count = 0;
    for rel in essential_files.iter() {
        let dest = repo_dir.join(rel);
        if !dest.exists() {
            let url = format!("{}{}", base_url, rel);
            if download_file(&url, &dest).is_ok() {
                count += 1;
            }
        } else {
            count += 1;
        }
    }

    // Configure thcrap config
    let config_dir = game_dir.join("thcrap/config");
    fs::create_dir_all(&config_dir).map_err(|e| format!("Error creando config dir: {}", e))?;

    let thpatch_es = r#"{
  "console": false,
  "dat_dump": false,
  "patches": [
    { "archive": "repos/nmlgc/base_tsa/" },
    { "archive": "repos/nmlgc/base_tasofro/" },
    { "archive": "repos/nmlgc/script_latin/" },
    { "archive": "repos/nmlgc/western_name_order/" },
    { "archive": "repos/thpatch/lang_en/" },
    { "archive": "repos/thpatch/lang_es/" }
  ]
}"#;
    let _ = fs::write(config_dir.join("thpatch-es.js"), thpatch_es);

    let games_js = r#"{
  "th13": "../th13.exe",
  "th13_custom": "../custom.exe"
}"#;
    let _ = fs::write(config_dir.join("games.js"), games_js);
    crate::installer::ensure_thcrap_integrity(game_dir, "th13");

    Ok(format!("Touhou 13 optimizado: DXVK activo y perfil en Español preparado ({} componentes)", count))
}

pub fn patch_game(game_id: &str, game_dir: &Path) -> Result<String, String> {
    match game_id {
        "th06" => auto_patch_th06(game_dir),
        "th12" => auto_patch_th12(game_dir),
        "th13" => auto_patch_th13(game_dir),
        _ => Err(format!("No hay parches automáticos definidos para {}", game_id)),
    }
}
