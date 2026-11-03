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
        id: "th01",
        title: "Touhou 01: Highly Responsive to Prayers",
        subtitle: "東方靈異伝 ~ Highly Responsive to Prayers",
        era: "PC-98 (1996)",
        dir_name: "th01",
        signatures: &["reiiden.hdi", "th01.hdi", "reiiden.fdi", "th01.fdi", "game.bat", "reiiden.bat", "th01.exe", "np21.exe", "np2.exe"],
        main_exes: &["th01.exe", "np21.exe", "np2.exe", "reiiden.bat", "game.bat"],
        custom_exe: "",
        description: "El legendario debut de Touhou Project en PC-98. Reimu golpea el orbe Yin-Yang en una mezcla de rompebloques y danmaku.",
    },
    GameDef {
        id: "th02",
        title: "Touhou 02: Story of Eastern Wonderland",
        subtitle: "東方封魔録 ~ the Story of Eastern Wonderland",
        era: "PC-98 (1997)",
        dir_name: "th02",
        signatures: &["fumaroku.hdi", "th02.hdi", "fumaroku.fdi", "th02.fdi", "game.bat", "th02.exe"],
        main_exes: &["th02.exe", "np21.exe", "np2.exe", "game.bat"],
        custom_exe: "",
        description: "El primer danmaku vertical tradicional de Touhou Project y debut de Marisa Kirisame en PC-98.",
    },
    GameDef {
        id: "th03",
        title: "Touhou 03: Phantasmagoria of Dim. Dream",
        subtitle: "東方夢時空 ~ Phantasmagoria of Dim.Dream",
        era: "PC-98 (1997)",
        dir_name: "th03",
        signatures: &["yumejiku.hdi", "th03.hdi", "yumejiku.fdi", "th03.fdi", "game.bat", "th03.exe"],
        main_exes: &["th03.exe", "np21.exe", "np2.exe", "game.bat"],
        custom_exe: "",
        description: "Duelo versus danmaku en PC-98 donde compiten nueve personajes por el secreto de las ruinas.",
    },
    GameDef {
        id: "th04",
        title: "Touhou 04: Lotus Land Story",
        subtitle: "東方幻想郷 ~ Lotus Land Story",
        era: "PC-98 (1998)",
        dir_name: "th04",
        signatures: &["gensokyo.hdi", "th04.hdi", "gensokyo.fdi", "th04.fdi", "game.bat", "th04.exe"],
        main_exes: &["th04.exe", "np21.exe", "np2.exe", "game.bat"],
        custom_exe: "",
        description: "Cuarta entrega de PC-98, cuna del legendario Bad Apple!! y la aparición de Yuuka Kazami.",
    },
    GameDef {
        id: "th05",
        title: "Touhou 05: Mystic Square",
        subtitle: "東方怪綺談 ~ Mystic Square",
        era: "PC-98 (1998)",
        dir_name: "th05",
        signatures: &["kaikidan.hdi", "th05.hdi", "kaikidan.fdi", "th05.fdi", "game.bat", "th05.exe"],
        main_exes: &["th05.exe", "np21.exe", "np2.exe", "game.bat"],
        custom_exe: "",
        description: "La cumbre de la era PC-98. Viaje a través del Makai con Reimu, Marisa, Mima y Yuuka.",
    },
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
        id: "th075",
        title: "Touhou 07.5: Immaterial and Missing Power",
        subtitle: "東方萃夢想 ~ Immaterial and Missing Power",
        era: "DirectX 8 (Lucha 2004)",
        dir_name: "th075",
        signatures: &["th075.exe", "th075e.exe", "th075.dat", "東方萃夢想.exe"],
        main_exes: &["th075.exe", "th075e.exe", "東方萃夢想.exe"],
        custom_exe: "custom.exe",
        description: "Primer juego de lucha oficial co-desarrollado con Twilight Frontier. Niebla y banquetes interminables en Gensokyo.",
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
        id: "th105",
        title: "Touhou 10.5: Scarlet Weather Rhapsody",
        subtitle: "東方緋想天 ~ Scarlet Weather Rhapsody",
        era: "DirectX 9 (Lucha 2007)",
        dir_name: "th105",
        signatures: &["th105.exe", "th105e.exe", "th105.dat", "東方緋想天.exe"],
        main_exes: &["th105.exe", "th105e.exe", "東方緋想天.exe"],
        custom_exe: "custom.exe",
        description: "Juego de lucha danmaku con sistema de clima y baraja de cartas de hechizo.",
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
        id: "th123",
        title: "Touhou 12.3: Touhou Hisoutensoku",
        subtitle: "東方非想天則 ~ Choudokyuu Gyuunyuu no Nazo wo Oe",
        era: "DirectX 9 (Lucha 2009)",
        dir_name: "th123",
        signatures: &["th123.exe", "th123e.exe", "th123.dat", "東方非想天則.exe"],
        main_exes: &["th123.exe", "th123e.exe", "東方非想天則.exe"],
        custom_exe: "custom.exe",
        description: "Expansión independiente de combate danmaku 2D contra una silueta colosal.",
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
        id: "th135",
        title: "Touhou 13.5: Hopeless Masquerade",
        subtitle: "東方心綺楼 ~ Hopeless Masquerade",
        era: "DirectX 9 (Lucha 2013)",
        dir_name: "th135",
        signatures: &["th135.exe", "th135e.exe", "th135.dat", "東方心綺楼.exe"],
        main_exes: &["th135.exe", "th135e.exe", "東方心綺楼.exe"],
        custom_exe: "",
        description: "Combate danmaku aéreo 2D donde las facciones religiosas compiten por el fervor del público.",
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
        id: "th145",
        title: "Touhou 14.5: Urban Legend in Limbo",
        subtitle: "東方深秘録 ~ Urban Legend in Limbo",
        era: "DirectX 9 (Lucha 2015)",
        dir_name: "th145",
        signatures: &["th145.exe", "th145e.exe", "th145.dat", "東方深秘録.exe"],
        main_exes: &["th145.exe", "th145e.exe", "東方深秘録.exe"],
        custom_exe: "",
        description: "Lucha aérea donde las leyendas urbanas del mundo exterior se manifiestan como ataques de ocultismo.",
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
        id: "th155",
        title: "Touhou 15.5: Antinomy of Common Flowers",
        subtitle: "東方憑依華 ~ Antinomy of Common Flowers",
        era: "DirectX 9 (Lucha 2017)",
        dir_name: "th155",
        signatures: &["th155.exe", "th155e.exe", "th155.dat", "東方憑依華.exe"],
        main_exes: &["th155.exe", "th155e.exe", "東方憑依華.exe"],
        custom_exe: "",
        description: "Lucha por parejas bajo la Posesión Perfecta, alternando entre Master y Slave en tiempo real.",
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
        id: "th175",
        title: "Touhou 17.5: Sunken Fossil World",
        subtitle: "東方剛欲異聞 ~ Suibotsushita Yuushuu no Goku",
        era: "DirectX 9 (Acción 2021)",
        dir_name: "th175",
        signatures: &["th175.exe", "th175e.exe", "th175.dat", "東方剛欲異聞.exe"],
        main_exes: &["th175.exe", "th175e.exe", "東方剛欲異聞.exe"],
        custom_exe: "",
        description: "Juego de acción y plataformas danmaku investigando las erupciones de petróleo y agua negra en el subsuelo.",
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
        title: "Touhou 20: Fossilized Wonders",
        subtitle: "東方夢想録 ~ Fossilized Wonders",
        era: "DirectX 9 (2025)",
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
