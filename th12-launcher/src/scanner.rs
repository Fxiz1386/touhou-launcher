use std::fs;
use std::path::{Path, PathBuf};

use crate::installer::detect_game_in_archive;

#[derive(Clone, Debug)]
#[allow(dead_code)]
pub struct DetectedZip {
    pub zip_path: PathBuf,
    pub filename: String,
    pub game_id: String,
    pub game_title: String,
}

pub fn scan_for_zips(games_dir: &Path) -> Vec<DetectedZip> {
    let mut dirs_to_scan = Vec::new();

    // Check Downloads and Descargas in $HOME
    if let Ok(home) = std::env::var("HOME") {
        let descargas = PathBuf::from(&home).join("Descargas");
        if descargas.exists() && !dirs_to_scan.contains(&descargas) {
            dirs_to_scan.push(descargas);
        }
        let downloads = PathBuf::from(&home).join("Downloads");
        if downloads.exists() && !dirs_to_scan.contains(&downloads) {
            dirs_to_scan.push(downloads);
        }
    }

    // Check parent / current dir
    if let Some(parent) = games_dir.parent() {
        if !dirs_to_scan.contains(&parent.to_path_buf()) {
            dirs_to_scan.push(parent.to_path_buf());
        }
    }

    let valid_extensions = ["zip", "7z", "rar"];
    let mut found = Vec::new();

    for dir in dirs_to_scan {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
                    if name.contains("backup") || name.contains("Backup") {
                        continue;
                    }
                    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
                    if valid_extensions.iter().any(|&e| ext == e) {
                        if let Ok(Some(game)) = detect_game_in_archive(&path) {
                            found.push(DetectedZip {
                                zip_path: path.clone(),
                                filename: name.to_string(),
                                game_id: game.id.to_string(),
                                game_title: game.title.to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    found
}
