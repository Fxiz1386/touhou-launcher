use std::path::{Path, PathBuf};

#[derive(Clone, Debug)]
pub struct GameDef {
    pub id: &'static str,
    pub title: &'static str,
    pub subtitle: &'static str,
    pub era: &'static str,
    pub dir_name: &'static str,
    pub signatures: &'static [&'static str],
    pub main_exes: &'static [&'static str],
    pub custom_exe: &'static str,
    pub description: &'static str,
}

pub static GAMES: &[GameDef] = &[
    GameDef {
        id: "th06",
        title: "Touhou 06: Embodiment of Scarlet Devil",
        subtitle: "東方紅魔郷 ~ the Embodiment of Scarlet Devil",
        era: "DirectX 8 (Era Clásica 2002)",
        dir_name: "th06",
        signatures: &["th06.exe", "th06e.exe", "th06.dat", "東方紅魔郷.exe", "th06nc.exe", "th06CM.dat"],
        main_exes: &["th06nc.exe", "th06e.exe", "東方紅魔郷.exe", "th06.exe"],
        custom_exe: "custom.exe",
        description: "El legendario inicio de la era Windows. Investiga la misteriosa niebla escarlata que cubre Gensokyo.",
    },
    GameDef {
        id: "th07",
        title: "Touhou 07: Perfect Cherry Blossom",
        subtitle: "東方妖々夢 ~ Perfect Cherry Blossom",
        era: "DirectX 8 (Era Clásica 2003)",
        dir_name: "th07",
        signatures: &["th07.exe", "th07.dat", "東方妖々夢.exe"],
        main_exes: &["th07.exe", "東方妖々夢.exe"],
        custom_exe: "custom.exe",
        description: "La primavera no llega a Gensokyo. Investiga el invierno perpetuo hacia el inframundo.",
    },
    GameDef {
        id: "th08",
        title: "Touhou 08: Imperishable Night",
        subtitle: "東方永夜抄 ~ Imperishable Night",
        era: "DirectX 8 (Era Clásica 2004)",
        dir_name: "th08",
        signatures: &["th08.exe", "th08.dat", "東方永夜抄.exe"],
        main_exes: &["th08.exe", "東方永夜抄.exe"],
        custom_exe: "custom.exe",
        description: "La luna llena ha sido sustituida por una réplica falsa. Detén la noche para devolver la auténtica luna.",
    },
    GameDef {
        id: "th09",
        title: "Touhou 09: Phantasmagoria of Flower View",
        subtitle: "東方花映塚 ~ Phantasmagoria of Flower View",
        era: "DirectX 9 (Era Clásica 2005)",
        dir_name: "th09",
        signatures: &["th09.exe", "th09.dat"],
        main_exes: &["th09.exe"],
        custom_exe: "custom.exe",
        description: "Las flores florecen fuera de temporada en todo Gensokyo en una batalla competitiva de danmaku.",
    },
    GameDef {
        id: "th095",
        title: "Touhou 09.5: Shoot the Bullet",
        subtitle: "東方文花帖 ~ Shoot the Bullet",
        era: "DirectX 9 (2005)",
        dir_name: "th095",
        signatures: &["th095.exe", "th095.dat"],
        main_exes: &["th095.exe"],
        custom_exe: "custom.exe",
        description: "Aya Shameimaru toma fotografías de los patrones danmaku más desafiantes.",
    },
    GameDef {
        id: "th10",
        title: "Touhou 10: Mountain of Faith",
        subtitle: "東方風神録 ~ Mountain of Faith",
        era: "DirectX 9 (Era Moderna 2007)",
        dir_name: "th10",
        signatures: &["th10.exe", "th10.dat"],
        main_exes: &["th10.exe"],
        custom_exe: "custom.exe",
        description: "Nuevos dioses descienden sobre la Montaña Youkai demandando la fe del Santuario Hakurei.",
    },
    GameDef {
        id: "th11",
        title: "Touhou 11: Subterranean Animism",
        subtitle: "東方地霊殿 ~ Subterranean Animism",
        era: "DirectX 9 (Era Moderna 2008)",
        dir_name: "th11",
        signatures: &["th11.exe", "th11.dat"],
        main_exes: &["th11.exe"],
        custom_exe: "custom.exe",
        description: "Un géiser emana del subsuelo trayendo antiguos espíritus y llamas infernales.",
    },
    GameDef {
        id: "th12",
        title: "Touhou 12: Undefined Fantastic Object",
        subtitle: "東方星蓮船 ~ Undefined Fantastic Object",
        era: "DirectX 9 (Era Moderna 2009)",
        dir_name: "th12",
        signatures: &["th12.exe", "th12.dat"],
        main_exes: &["th12.exe", "th12 (thpatch-en).exe"],
        custom_exe: "custom.exe",
        description: "Surca los cielos tras un barco volador y resuelve el misterio de los objetos flotantes no identificados.",
    },
    GameDef {
        id: "th125",
        title: "Touhou 12.5: Double Spoiler",
        subtitle: "ダブルスポイラー ~ 東方文花帖",
        era: "DirectX 9 (2010)",
        dir_name: "th125",
        signatures: &["th125.exe", "th125.dat"],
        main_exes: &["th125.exe"],
        custom_exe: "custom.exe",
        description: "Competición fotográfica periodística entre Aya Shameimaru y Hatate Himekaidou.",
    },
    GameDef {
        id: "th128",
        title: "Touhou 12.8: Fairy Wars",
        subtitle: "妖精大戦争 ~ 東方三月精",
        era: "DirectX 9 (2010)",
        dir_name: "th128",
        signatures: &["th128.exe", "th128.dat"],
        main_exes: &["th128.exe"],
        custom_exe: "custom.exe",
        description: "Cirno congela balas en una guerra desatada entre hadas traviesas.",
    },
    GameDef {
        id: "th13",
        title: "Touhou 13: Ten Desires",
        subtitle: "東方神霊廟 ~ Ten Desires",
        era: "DirectX 9 (Era Moderna 2011)",
        dir_name: "th13",
        signatures: &["th13.exe", "th13.dat"],
        main_exes: &["th13.exe", "th13 (thpatch-en).exe"],
        custom_exe: "custom.exe",
        description: "Aparecen espíritus divinos por todo Gensokyo. Investiga su origen junto a Reimu, Marisa, Sanae o Youmu.",
    },
    GameDef {
        id: "th14",
        title: "Touhou 14: Double Dealing Character",
        subtitle: "東方輝針城 ~ Double Dealing Character",
        era: "DirectX 9 (2013)",
        dir_name: "th14",
        signatures: &["th14.exe", "th14.dat"],
        main_exes: &["th14.exe"],
        custom_exe: "custom.exe",
        description: "Las herramientas y armas de los habitantes comienzan a moverse y atacar por voluntad propia.",
    },
    GameDef {
        id: "th143",
        title: "Touhou 14.3: Impossible Spell Card",
        subtitle: "弾幕アマノジャク ~ Impossible Spell Card",
        era: "DirectX 9 (2014)",
        dir_name: "th143",
        signatures: &["th143.exe", "th143.dat"],
        main_exes: &["th143.exe"],
        custom_exe: "custom.exe",
        description: "Seija Kijin usa objetos tramposos para sobrevivir a patrones de danmaku catalogados como imposibles.",
    },
    GameDef {
        id: "th15",
        title: "Touhou 15: Legacy of Lunatic Kingdom",
        subtitle: "東方紺珠伝 ~ Legacy of Lunatic Kingdom",
        era: "DirectX 9 (2015)",
        dir_name: "th15",
        signatures: &["th15.exe", "th15.dat"],
        main_exes: &["th15.exe"],
        custom_exe: "custom.exe",
        description: "La Capital Lunar inicia una invasión y purificación agresiva sobre Gensokyo.",
    },
    GameDef {
        id: "th16",
        title: "Touhou 16: Hidden Star in Four Seasons",
        subtitle: "東方天空璋 ~ Hidden Star in Four Seasons",
        era: "DirectX 9 (2017)",
        dir_name: "th16",
        signatures: &["th16.exe", "th16.dat"],
        main_exes: &["th16.exe"],
        custom_exe: "custom.exe",
        description: "Las cuatro estaciones climáticas se manifiestan de golpe en distintas partes de Gensokyo.",
    },
    GameDef {
        id: "th165",
        title: "Touhou 16.5: Violet Detector",
        subtitle: "秘封ナイトメアダイアリー ~ Violet Detector",
        era: "DirectX 9 (2018)",
        dir_name: "th165",
        signatures: &["th165.exe", "th165.dat"],
        main_exes: &["th165.exe"],
        custom_exe: "custom.exe",
        description: "Sumireko Usami viaja a través de pesadillas tomando fotos psíquicas de balas imposibles.",
    },
    GameDef {
        id: "th17",
        title: "Touhou 17: Wily Beast and Weakest Creature",
        subtitle: "東方鬼形獣 ~ Wily Beast and Weakest Creature",
        era: "DirectX 9 (2019)",
        dir_name: "th17",
        signatures: &["th17.exe", "th17.dat"],
        main_exes: &["th17.exe"],
        custom_exe: "custom.exe",
        description: "Espíritus animales del Reino de las Bestias intentan conquistar el mundo exterior.",
    },
    GameDef {
        id: "th18",
        title: "Touhou 18: Unconnected Marketeers",
        subtitle: "東方虹龍洞 ~ Unconnected Marketeers",
        era: "DirectX 9 (2021)",
        dir_name: "th18",
        signatures: &["th18.exe", "th18.dat"],
        main_exes: &["th18.exe"],
        custom_exe: "custom.exe",
        description: "Misteriosas cartas de habilidad de intercambio circulan por Gensokyo desde las cuevas del dragón arcoíris.",
    },
    GameDef {
        id: "th185",
        title: "Touhou 18.5: 100th Black Market",
        subtitle: "バレットフィリア達の闇市場 ~ 100th Black Market",
        era: "DirectX 9 (2022)",
        dir_name: "th185",
        signatures: &["th185.exe", "th185.dat"],
        main_exes: &["th185.exe"],
        custom_exe: "custom.exe",
        description: "Marisa Kirisame explora los mercados negros de cartas de habilidad en constante cambio.",
    },
    GameDef {
        id: "th19",
        title: "Touhou 19: Unfinished Dream of All Living Ghost",
        subtitle: "東方獣王園 ~ Unfinished Dream of All Living Ghost",
        era: "DirectX 9 (2023)",
        dir_name: "th19",
        signatures: &["th19.exe", "th19.dat"],
        main_exes: &["th19.exe"],
        custom_exe: "custom.exe",
        description: "Aparecen espíritus y bestias reclamando posesión de la tierra en un danmaku de combate split-screen.",
    },
    GameDef {
        id: "th20",
        title: "Touhou 20: Fanciful Dream and Wondering Beast",
        subtitle: "東方夢想録 ~ Fanciful Dream and Wondering Beast",
        era: "DirectX 9 (2024)",
        dir_name: "th20",
        signatures: &["th20.exe", "th20.dat"],
        main_exes: &["th20.exe"],
        custom_exe: "custom.exe",
        description: "La más reciente entrega oficial de Touhou Project creada por ZUN.",
    },
];

pub fn find_game_def(id: &str) -> Option<&'static GameDef> {
    GAMES.iter().find(|g| g.id == id)
}

#[derive(Clone, Debug)]
#[allow(dead_code)]
pub struct GameStatus {
    pub installed: bool,
    pub path: Option<PathBuf>,
    pub has_spanish: bool,
    pub has_english: bool,
    pub has_japanese: bool,
}

impl GameStatus {
    pub fn check(def: &GameDef, games_dir: &Path) -> Self {
        let game_dir = games_dir.join(def.dir_name);
        
        // Also check legacy folder for th12
        let legacy_dir = games_dir.parent().map(|p| p.join("Touhou 12 - Undefined Fantastic Object"));
        
        let steam_th06 = std::env::var("HOME").ok().map(|h| PathBuf::from(h).join(".local/share/Steam/steamapps/common/th06nc"));

        let target_dir = if game_dir.exists() {
            Some(game_dir)
        } else if def.id == "th12" && legacy_dir.as_ref().map_or(false, |d| d.exists()) {
            legacy_dir
        } else if def.id == "th06" && steam_th06.as_ref().map_or(false, |d| d.exists()) {
            steam_th06
        } else {
            None
        };

        if let Some(dir) = target_dir {
            // Check if any of the main exes exist
            let installed = def.signatures.iter().any(|sig| dir.join(sig).exists());
            if installed {
                let has_thcrap_es = dir.join("thcrap/config/thpatch-es.js").exists() 
                    || dir.join("thcrap/repos/thpatch/lang_es").exists();
                let has_thcrap_en = dir.join("thcrap/config/thpatch-en.js").exists()
                    || dir.join("thcrap/repos/thpatch/lang_en").exists()
                    || dir.join("th06e.exe").exists();
                let has_ja = def.main_exes.iter().any(|exe| dir.join(exe).exists());

                return GameStatus {
                    installed: true,
                    path: Some(dir),
                    has_spanish: has_thcrap_es,
                    has_english: has_thcrap_en,
                    has_japanese: has_ja,
                };
            }
        }

        GameStatus {
            installed: false,
            path: None,
            has_spanish: false,
            has_english: false,
            has_japanese: false,
        }
    }
}
