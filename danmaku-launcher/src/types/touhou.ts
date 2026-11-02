export type TouhouEra = 'all' | 'windows_classic' | 'windows_modern' | 'fighting' | 'pc98' | 'spinoff';

export type GameDifficulty = 'Easy' | 'Normal' | 'Hard' | 'Lunatic' | 'Extra' | 'Phantasm';

export interface ShotType {
  id: string;
  name: string;
  japaneseName: string;
  subShot: string;
  description: string;
  bombSpellCard: string;
  speed: string; // e.g. "★★★☆☆"
  power: string; // e.g. "★★★★☆"
}

export interface PlayableCharacter {
  id: string;
  name: string;
  title: string;
  spriteColor: string;
  portraitSymbol: string;
  shotTypes: ShotType[];
}

export interface GameReplay {
  id: string;
  name: string;
  player: string;
  character: string;
  difficulty: GameDifficulty;
  date: string;
  score: number;
  stageReached: string;
  slowRate: string;
}

export interface GameConfig {
  resolution: '640x480' | '960x720' | '1280x960' | '1920x1080_Pillarbox';
  fullscreen: boolean;
  vpatch: boolean;
  fps60Lock: boolean;
  bgmVolume: number; // 0 - 100
  seVolume: number;  // 0 - 100
  thcrapLanguage: 'es_ES' | 'en_US' | 'ja_JP' | 'none';
  customArgs: string;
  winePrefix?: string;
}

export interface TouhouGame {
  id: string;
  code: string; // e.g. "TH06", "TH07"
  number: number | string;
  titleRomaji: string;
  titleKanji: string;
  titleEnglish: string;
  subtitle: string;
  releaseYear: number;
  era: TouhouEra;
  themeColor: string; // Hex color
  accentColor: string; // Hex or Tailwind class
  bannerGradient: string;
  iconSymbol: string;
  synopsis: string;
  stageCount: number;
  bgmCount: number;
  installed: boolean;
  executablePath: string;
  lastPlayed: string | null;
  playTimeMinutes: number;
  highScore: number;
  difficulties: GameDifficulty[];
  characters: PlayableCharacter[];
  replays: GameReplay[];
  config: GameConfig;
  isFavorite: boolean;
}

export interface MusicTrack {
  id: string;
  trackNumber: number;
  titleKanji: string;
  titleRomaji: string;
  titleEnglish: string;
  gameId: string;
  gameCode: string;
  gameTitle: string;
  zunCommentary: string;
  notes: { frequency: number; duration: number }[]; // Chiptune melody notes for Web Audio API synthesis
}

export interface RustIpcLog {
  id: string;
  timestamp: string;
  command: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
  status: 'success' | 'running' | 'error';
}

export interface BackendGameStatus {
  id: string;
  title: string;
  subtitle: string;
  era: string;
  installed: boolean;
  path: string | null;
  has_spanish: boolean;
  has_english: boolean;
  has_japanese: boolean;
  display_mode: string;
  language: string;
  color_32bit: boolean;
  fps_60: boolean;
  bgm_volume: number;
  se_volume: number;
  pad_deadzone: number;
  play_time_minutes?: number;
  play_time_seconds?: number;
  high_score?: number;
  last_played?: string | null;
}

export interface BackendDetectedZip {
  path: string;
  fileName: string;
  gameId: string | null;
  gameTitle: string | null;
}

export interface TouhouMusicTrack {
  id: string;
  gameId: string;
  trackNumber: number;
  titleKanji: string;
  titleRomaji: string;
  titleEnglish: string;
  stageOrRole: string; // e.g. "Tema del Menú", "Tema de Cirno", "Tema de Flandre Scarlet"
  zunCommentary: string; // Historia y comentarios de ZUN
  duration?: string;
  fileNamePatterns?: string[];
  audioPath?: string | null;
  audioFormat?: 'OPUS' | 'FLAC' | 'MP3' | 'WAV' | 'OGG' | null;
}

export interface DetectedMusicArchive {
  fileName: string;
  fullPath: string;
  size: number;
  gameId: string;
  gameTitle: string;
  format: 'OPUS' | 'FLAC' | 'MP3' | 'ZIP';
}

export interface MusicLibraryStatus {
  gameId: string;
  totalTracks: number;
  availableTracks: number;
  hasAudio: boolean;
  coverImage: string | null;
  audioFiles: {
    filename: string;
    path: string;
    format: string;
    size: number;
  }[];
}

export interface DanmakuAPI {
  getGamesStatus: () => Promise<BackendGameStatus[]>;
  launchGame: (payload: { gameId: string; displayMode?: string; language?: string }) => Promise<{ success: boolean; output?: string; error?: string }>;
  saveConfig: (payload: {
    gameId: string;
    color32?: boolean;
    fps60?: boolean;
    bgm?: number;
    se?: number;
    pad?: number;
    displayMode?: string;
    language?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  openFolder: (gameId: string) => Promise<{ success: boolean }>;
  installZip: (zipPath: string) => Promise<{ success: boolean; game_id?: string; game_name?: string; files_extracted?: number; error?: string }>;
  pickZipFile: () => Promise<string | null>;
  scanDownloads: () => Promise<BackendDetectedZip[]>;
  uninstallGame: (payload: { gameId: string; keepSaves?: boolean }) => Promise<{ success: boolean; error?: string }>;
  updatePatches: (gameId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  stopGame: (gameId: string) => Promise<{ success: boolean }>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  getMusicLibrary: (gameId: string) => Promise<MusicLibraryStatus>;
  scanMusicDownloads: () => Promise<DetectedMusicArchive[]>;
  importMusicArchive: (payload: { archivePath: string; gameId: string }) => Promise<{ success: boolean; error?: string; filesExtracted?: number }>;
  pickMusicArchive: () => Promise<string | null>;
}

declare global {
  interface Window {
    danmakuAPI?: DanmakuAPI;
  }
}
