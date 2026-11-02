import type { TouhouGame, TouhouEra, GameDifficulty } from '../types/touhou.ts';

/**
 * Filter touhou games based on query string, selected era, favorites filter, and installation status
 */
export function filterGames(
  games: TouhouGame[],
  query: string,
  era: TouhouEra,
  onlyFavorites: boolean = false,
  onlyInstalled: boolean = false
): TouhouGame[] {
  const cleanQuery = query.trim().toLowerCase();

  return games.filter((game) => {
    // Era filter
    if (era !== 'all') {
      if (era === 'fighting') {
        if (game.era !== 'fighting' && game.era !== 'spinoff') return false;
      } else if (game.era !== era) {
        return false;
      }
    }

    // Favorites filter
    if (onlyFavorites && !game.isFavorite) {
      return false;
    }

    // Installed filter
    if (onlyInstalled && !game.installed) {
      return false;
    }

    // Text search filter
    if (!cleanQuery) return true;

    const matchesCode = game.code.toLowerCase().includes(cleanQuery);
    const matchesKanji = game.titleKanji.includes(cleanQuery);
    const matchesRomaji = game.titleRomaji.toLowerCase().includes(cleanQuery);
    const matchesEnglish = game.titleEnglish.toLowerCase().includes(cleanQuery);
    const matchesCharacter = game.characters.some((c) =>
      c.name.toLowerCase().includes(cleanQuery)
    );

    return matchesCode || matchesKanji || matchesRomaji || matchesEnglish || matchesCharacter;
  });
}

export type SortMode = 'number' | 'playtime' | 'highscore' | 'title' | 'release';

/**
 * Sorts games according to selected criterion
 */
export function sortGames(games: TouhouGame[], sortMode: SortMode): TouhouGame[] {
  const cloned = [...games];

  switch (sortMode) {
    case 'number':
      return cloned.sort((a, b) => {
        const numA = typeof a.number === 'number' ? a.number : parseFloat(a.number.toString());
        const numB = typeof b.number === 'number' ? b.number : parseFloat(b.number.toString());
        return numA - numB;
      });
    case 'playtime':
      return cloned.sort((a, b) => b.playTimeMinutes - a.playTimeMinutes);
    case 'highscore':
      return cloned.sort((a, b) => b.highScore - a.highScore);
    case 'title':
      return cloned.sort((a, b) => a.titleRomaji.localeCompare(b.titleRomaji));
    case 'release':
      return cloned.sort((a, b) => b.releaseYear - a.releaseYear);
    default:
      return cloned;
  }
}

/**
 * Format raw game score into formatted string with commas or kanji notation
 */
export function formatScore(score: number): string {
  if (score === 0) return '-';
  return score.toLocaleString('en-US');
}

/**
 * Format minutes into readable human playtime
 */
export function formatPlaytime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${remainingMinutes} m`;
}

/**
 * Format audio seconds into mm:ss, protecting against Infinity, NaN, and negative values
 */
export function formatMusicTimer(seconds: number): string {
  if (!Number.isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Validates executable filename for Touhou game
 */
export function validateExecutablePath(path: string): { valid: boolean; reason?: string } {
  if (!path || path.trim().length === 0) {
    return { valid: false, reason: 'La ruta del ejecutable no puede estar vacía' };
  }
  const trimmed = path.trim();
  const lower = trimmed.toLowerCase();
  const hasValidExtension =
    lower.endsWith('.exe') || lower.endsWith('.sh') || lower.endsWith('.bat') || lower.endsWith('.app');

  if (!hasValidExtension) {
    return {
      valid: false,
      reason: 'El archivo debe ser un ejecutable válido (.exe, .sh, .bat o .app)',
    };
  }

  return { valid: true };
}

/**
 * Returns ZUN's official tongue-in-cheek descriptions for STG difficulties
 */
export function getDifficultyZunFlavor(diff: GameDifficulty): { subtitle: string; description: string; color: string } {
  switch (diff) {
    case 'Easy':
      return {
        subtitle: 'Para los que no juegan STG habitualmente',
        description: 'La densidad de balas es suave y los patrones son lentos. Ideal para disfrutar de la música y la historia sin sudar.',
        color: '#22c55e',
      };
    case 'Normal':
      return {
        subtitle: 'El estándar de Gensokyo',
        description: 'La experiencia auténtica diseñada por ZUN. Velocidad media y patrones justos que premian el movimiento milimétrico.',
        color: '#3b82f6',
      };
    case 'Hard':
      return {
        subtitle: 'Para veteranos del Danmaku',
        description: 'Balas a alta velocidad, cortinas complejas y menor margen de error en el hitbox.',
        color: '#f97316',
      };
    case 'Lunatic':
      return {
        subtitle: 'Solo para gente un poco loca (ZUN dixit)',
        description: 'Una lluvia de balas implacable donde el espacio entre proyectiles parece inexistente. Tu concentración debe ser absoluta.',
        color: '#ef4444',
      };
    case 'Extra':
      return {
        subtitle: 'El verdadero desafío tras terminar el juego',
        description: 'Un solo intento sin opción de continuar. El jefe final te esperará con sus Spell Cards más memorables y difíciles.',
        color: '#a855f7',
      };
    case 'Phantasm':
      return {
        subtitle: 'Más allá de la locura',
        description: 'Dificultad legendaria exclusiva para quienes dominaron el Extra Stage.',
        color: '#ec4899',
      };
  }
}

/**
 * Prepares Rust IPC invocation arguments for launching a Touhou game
 */
export function createRustLaunchPayload(
  game: TouhouGame,
  characterId: string,
  difficulty: GameDifficulty
) {
  return {
    command: 'launch_game',
    payload: {
      game_id: game.id,
      code: game.code,
      executable_path: game.executablePath,
      character: characterId,
      difficulty,
      resolution: game.config.resolution,
      fullscreen: game.config.fullscreen,
      vpatch_enabled: game.config.vpatch,
      fps_limit: game.config.fps60Lock ? 60 : 0,
      bgm_volume: game.config.bgmVolume,
      se_volume: game.config.seVolume,
      thcrap_language: game.config.thcrapLanguage,
      custom_args: game.config.customArgs ? game.config.customArgs.split(' ') : [],
      wine_prefix: game.config.winePrefix || null,
    },
  };
}
