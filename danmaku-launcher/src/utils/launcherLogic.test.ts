import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterGames,
  sortGames,
  formatScore,
  formatPlaytime,
  formatMusicTimer,
  validateExecutablePath,
  getDifficultyZunFlavor,
  createRustLaunchPayload,
} from './launcherLogic.ts';
import type { TouhouGame } from '../types/touhou.ts';

const mockGames: TouhouGame[] = [
  {
    id: 'th06',
    code: 'TH06',
    number: 6,
    titleRomaji: 'Koumakyou',
    titleKanji: '東方紅魔郷',
    titleEnglish: 'The Embodiment of Scarlet Devil',
    subtitle: '~ the Embodiment of Scarlet Devil',
    releaseYear: 2002,
    era: 'windows_classic',
    themeColor: '#dc2626',
    accentColor: 'crimson',
    bannerGradient: 'from-red-900 to-rose-950',
    iconSymbol: 'scarlet_bat',
    synopsis: 'Un incidente de niebla escarlata cubre Gensokyo.',
    stageCount: 6,
    bgmCount: 17,
    installed: true,
    executablePath: 'C:\\Games\\Touhou\\th06\\th06.exe',
    lastPlayed: '2026-10-18',
    playTimeMinutes: 145,
    highScore: 84520930,
    difficulties: ['Easy', 'Normal', 'Hard', 'Lunatic', 'Extra'],
    characters: [
      {
        id: 'reimu',
        name: 'Reimu Hakurei',
        title: 'Sacerdotisa del Paraíso',
        spriteColor: '#ef4444',
        portraitSymbol: 'yin_yang',
        shotTypes: [],
      },
    ],
    replays: [],
    config: {
      resolution: '960x720',
      fullscreen: false,
      vpatch: true,
      fps60Lock: true,
      bgmVolume: 80,
      seVolume: 75,
      thcrapLanguage: 'es_ES',
      customArgs: '',
    },
    isFavorite: true,
  },
  {
    id: 'th07',
    code: 'TH07',
    number: 7,
    titleRomaji: 'Youyoumu',
    titleKanji: '東方妖々夢',
    titleEnglish: 'Perfect Cherry Blossom',
    subtitle: '~ Perfect Cherry Blossom',
    releaseYear: 2003,
    era: 'windows_classic',
    themeColor: '#ec4899',
    accentColor: 'pink',
    bannerGradient: 'from-pink-900 to-rose-950',
    iconSymbol: 'cherry_petal',
    synopsis: 'La primavera no llega a Gensokyo.',
    stageCount: 6,
    bgmCount: 19,
    installed: false,
    executablePath: '',
    lastPlayed: null,
    playTimeMinutes: 30,
    highScore: 125000000,
    difficulties: ['Easy', 'Normal', 'Hard', 'Lunatic', 'Extra', 'Phantasm'],
    characters: [],
    replays: [],
    config: {
      resolution: '640x480',
      fullscreen: true,
      vpatch: false,
      fps60Lock: true,
      bgmVolume: 100,
      seVolume: 90,
      thcrapLanguage: 'none',
      customArgs: '',
    },
    isFavorite: false,
  },
  {
    id: 'th15',
    code: 'TH15',
    number: 15,
    titleRomaji: 'Kanjuden',
    titleKanji: '東方紺珠伝',
    titleEnglish: 'Legacy of Lunatic Kingdom',
    subtitle: '~ Legacy of Lunatic Kingdom',
    releaseYear: 2015,
    era: 'windows_modern',
    themeColor: '#6366f1',
    accentColor: 'indigo',
    bannerGradient: 'from-indigo-900 to-slate-950',
    iconSymbol: 'lunatic_moon',
    synopsis: 'Invasión desde la Capital Lunar.',
    stageCount: 6,
    bgmCount: 18,
    installed: true,
    executablePath: 'C:\\Games\\Touhou\\th15\\th15.exe',
    lastPlayed: '2026-10-15',
    playTimeMinutes: 210,
    highScore: 43200100,
    difficulties: ['Easy', 'Normal', 'Hard', 'Lunatic', 'Extra'],
    characters: [],
    replays: [],
    config: {
      resolution: '1280x960',
      fullscreen: false,
      vpatch: true,
      fps60Lock: true,
      bgmVolume: 85,
      seVolume: 85,
      thcrapLanguage: 'en_US',
      customArgs: '',
    },
    isFavorite: false,
  },
];

test('filterGames matches title, code, and era', () => {
  // Test by code
  const resultTh06 = filterGames(mockGames, 'th06', 'all');
  assert.equal(resultTh06.length, 1);
  assert.equal(resultTh06[0].id, 'th06');

  // Test by era
  const resultModern = filterGames(mockGames, '', 'windows_modern');
  assert.equal(resultModern.length, 1);
  assert.equal(resultModern[0].id, 'th15');

  // Test favorites
  const favorites = filterGames(mockGames, '', 'all', true);
  assert.equal(favorites.length, 1);
  assert.equal(favorites[0].id, 'th06');

  // Test installed
  const installed = filterGames(mockGames, '', 'all', false, true);
  assert.equal(installed.length, 2);
});

test('sortGames sorts correctly', () => {
  const byPlaytime = sortGames(mockGames, 'playtime');
  assert.equal(byPlaytime[0].id, 'th15'); // 210 min

  const byHighscore = sortGames(mockGames, 'highscore');
  assert.equal(byHighscore[0].id, 'th07'); // 125,000,000

  const byNumber = sortGames(mockGames, 'number');
  assert.equal(byNumber[0].id, 'th06');
});

test('formatScore handles zero and large numbers', () => {
  assert.equal(formatScore(0), '-');
  assert.equal(formatScore(125000000), '125,000,000');
});

test('formatPlaytime formats minutes and hours', () => {
  assert.equal(formatPlaytime(45), '45 min');
  assert.equal(formatPlaytime(120), '2 h');
  assert.equal(formatPlaytime(145), '2 h 25 m');
});

test('validateExecutablePath verifies extension', () => {
  assert.equal(validateExecutablePath('').valid, false);
  assert.equal(validateExecutablePath('file.txt').valid, false);
  assert.equal(validateExecutablePath('th06.exe').valid, true);
  assert.equal(validateExecutablePath('/usr/bin/th06.sh').valid, true);
});

test('getDifficultyZunFlavor returns accurate descriptions', () => {
  const lunatic = getDifficultyZunFlavor('Lunatic');
  assert.match(lunatic.subtitle, /loca/);
  assert.match(lunatic.description, /lluvia de balas/);
});

test('createRustLaunchPayload constructs valid Tauri IPC command format', () => {
  const payload = createRustLaunchPayload(mockGames[0], 'reimu', 'Lunatic');
  assert.equal(payload.command, 'launch_game');
  assert.equal(payload.payload.game_id, 'th06');
  assert.equal(payload.payload.difficulty, 'Lunatic');
  assert.equal(payload.payload.character, 'reimu');
  assert.equal(payload.payload.resolution, '960x720');
});

test('formatMusicTimer formats audio mm:ss safely and handles Infinity/NaN', () => {
  assert.equal(formatMusicTimer(23), '0:23');
  assert.equal(formatMusicTimer(124), '2:04');
  assert.equal(formatMusicTimer(332), '5:32');
  assert.equal(formatMusicTimer(Infinity), '0:00');
  assert.equal(formatMusicTimer(-10), '0:00');
  assert.equal(formatMusicTimer(NaN), '0:00');
});

test('filterGames matches spinoff era under fighting & spin-offs filter', () => {
  const spinoffGame: TouhouGame = {
    ...mockGames[0],
    id: 'th095',
    code: 'TH09.5',
    number: 9.5,
    era: 'spinoff',
  };
  const fightingGame: TouhouGame = {
    ...mockGames[0],
    id: 'th123',
    code: 'TH12.3',
    number: 12.3,
    era: 'fighting',
  };
  const regularGame: TouhouGame = {
    ...mockGames[0],
    id: 'th06',
    code: 'TH06',
    number: 6,
    era: 'windows_classic',
  };

  const results = filterGames([spinoffGame, fightingGame, regularGame], '', 'fighting');
  assert.equal(results.length, 2);
  assert.deepEqual(results.map(g => g.id), ['th095', 'th123']);
});

test('sortGames sorts games by number including spin-offs and TH19/TH20', () => {
  const games: TouhouGame[] = [
    { ...mockGames[0], id: 'th19', number: 19 },
    { ...mockGames[0], id: 'th06', number: 6 },
    { ...mockGames[0], id: 'th095', number: 9.5 },
    { ...mockGames[0], id: 'th20', number: 20 },
    { ...mockGames[0], id: 'th128', number: 12.8 },
  ];

  const sorted = sortGames(games, 'number');
  assert.deepEqual(sorted.map(g => g.id), ['th06', 'th095', 'th128', 'th19', 'th20']);
});

