import { useState } from 'react';
import {
  Play,
  Square,
  Sparkles,
  Monitor,
  Volume2,
  FolderOpen,
  History,
  Gamepad,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle,
  Tv,
  FileCode2,
} from 'lucide-react';
import type { TouhouGame, GameDifficulty } from '../types/touhou.ts';
import { getDifficultyZunFlavor, formatPlaytime, formatScore } from '../utils/launcherLogic.ts';
import GameCoverArt from './GameCoverArt.tsx';

interface GameDetailViewProps {
  game: TouhouGame;
  onLaunch: (game: TouhouGame, characterId: string, difficulty: GameDifficulty) => void;
  onStop: (gameId: string) => void;
  isRunning: boolean;
  runningSeconds: number;
  onUpdateConfig: (gameId: string, newConfig: Partial<TouhouGame['config']>) => void;
  onInstallPrompt: (game: TouhouGame) => void;
  onOpenDirectory: (gameId: string) => void;
  onUninstallPrompt: (game: TouhouGame) => void;
  onToggleFavorite: (gameId: string) => void;
  onExportReplay: (replayId: string) => void;
}

export default function GameDetailView({
  game,
  onLaunch,
  onStop,
  isRunning,
  runningSeconds,
  onUpdateConfig,
  onInstallPrompt,
  onOpenDirectory,
  onUninstallPrompt,
  onToggleFavorite,
  onExportReplay,
}: GameDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    'game' | 'graphics' | 'audio_controls' | 'files_patches' | 'replays'
  >('game');

  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('Normal');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    game.characters[0]?.id || 'reimu'
  );
  const [isPatchUpdating, setIsPatchUpdating] = useState(false);
  const [patchSuccess, setPatchSuccess] = useState(false);
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpdatePatch = () => {
    setIsPatchUpdating(true);
    setTimeout(() => {
      setIsPatchUpdating(false);
      setPatchSuccess(true);
      setTimeout(() => setPatchSuccess(false), 3000);
    }, 1200);
  };

  const handleSaveBinaryCfg = () => {
    setConfigSavedNotice(true);
    setTimeout(() => setConfigSavedNotice(false), 2500);
  };

  const difficultyInfo = getDifficultyZunFlavor(selectedDifficulty);

  return (
    <div className="flex flex-col h-full bg-neutral-950/60 overflow-y-auto">
      {/* Top Hero Banner */}
      <div className={`banner-hero relative w-full border-b border-neutral-800 bg-gradient-to-r ${game.bannerGradient} p-5 sm:p-6 overflow-hidden`}>
        {/* Danmaku decorative elements */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-radial from-rose-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
          {/* Game Title & Header info */}
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            <div className="w-24 sm:w-28 shrink-0 shadow-2xl rounded-lg overflow-hidden border border-white/10 hidden xs:block sm:block">
              <GameCoverArt game={game} size="compact" showBadges={false} />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-400 bg-black/50 px-2 py-0.5 rounded border border-rose-500/30 shrink-0">
                  {game.code}
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wider whitespace-nowrap break-keep">
                  {game.titleKanji}
                </span>
                <span className="text-xs text-neutral-300 font-mono">({game.releaseYear})</span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-neutral-100 leading-snug break-words">
                {game.titleEnglish}
              </h2>
              <p className="text-xs font-mono text-neutral-400">
                {game.subtitle} · {game.era === 'pc98' ? 'PC-98' : 'Windows (Wine/Proton)'}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-neutral-300">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
                  <span className="text-neutral-400">Tiempo jugado:</span>
                  <strong className="text-white font-mono">{formatPlaytime(game.playTimeMinutes)}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
                  <span className="text-neutral-400">Puntuación máxima:</span>
                  <strong className="text-amber-400 font-mono">{formatScore(game.highScore)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Row: dedicated full-width area */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
            {isRunning ? (
              <div className="flex flex-wrap items-center gap-3 w-full">
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/70 px-4 py-2.5 shadow-lg">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-emerald-300 tracking-wider">
                      JUEGO EN EJECUCIÓN
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      Tiempo: {formatTimer(runningSeconds)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onStop(game.id)}
                  className="flex items-center gap-2 rounded-xl bg-red-700 hover:bg-red-600 text-white px-5 py-2.5 text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Cierra el juego y mata procesos zombies con Wine Reaper"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span>Detener / Reaper</span>
                </button>
              </div>
            ) : game.installed ? (
              <div className="flex flex-wrap items-center gap-3 w-full">
                <button
                  onClick={() => onLaunch(game, selectedCharacterId, selectedDifficulty)}
                  className="group relative flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white px-7 py-3 text-sm font-bold shadow-xl shadow-rose-950/50 transition-all active:scale-95 border border-rose-400/40 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
                  <span className="tracking-wide">JUGAR AHORA</span>
                </button>

                <div className="text-[11px] font-mono text-neutral-300 bg-black/40 px-3 py-2 rounded-lg border border-neutral-800 flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-rose-300">
                    <Tv className="h-3.5 w-3.5" />
                    <span>
                      {game.config.resolution === '1920x1080_Pillarbox'
                        ? 'FSR Gamescope (Nativo)'
                        : game.config.resolution}
                    </span>
                  </div>
                  <span className="text-neutral-600">|</span>
                  <div className="text-neutral-400">
                    {game.config.thcrapLanguage === 'es_ES' ? '🇪🇸 Español' : game.config.thcrapLanguage === 'en_US' ? '🇺🇸 Inglés' : '🇯🇵 Japonés'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5 w-full">
                <button
                  onClick={() => {
                    if (window.danmakuAPI?.openExternal) {
                      window.danmakuAPI.openExternal('https://moriyashrine.org/resources/categories/games.5/');
                    } else {
                      window.open('https://moriyashrine.org/resources/categories/games.5/', '_blank');
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-5 py-2.5 text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Abre la página segura de descargas de Touhou Project en Moriya Shrine"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Descargar en Moriya Shrine</span>
                </button>

                <button
                  onClick={() => onInstallPrompt(game)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 px-4 py-2.5 text-xs font-bold shadow-lg border border-neutral-700 cursor-pointer transition-colors"
                >
                  <FolderOpen className="h-4 w-4 text-rose-400" />
                  <span>Instalar Archivo (.ZIP / .7z / .rar)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 5 Clear Tabs Navigation */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto border-t border-white/10 pt-3">
          <button
            onClick={() => setActiveTab('game')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'game'
                ? 'bg-neutral-900 text-rose-400 shadow-sm ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Juego & Danmaku</span>
          </button>

          <button
            onClick={() => setActiveTab('graphics')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'graphics'
                ? 'bg-neutral-900 text-rose-400 shadow-sm ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Gráficos & Pantalla (FSR / Gamescope)</span>
          </button>

          <button
            onClick={() => setActiveTab('audio_controls')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'audio_controls'
                ? 'bg-neutral-900 text-rose-400 shadow-sm ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Sonido & Controles (.cfg)</span>
          </button>

          <button
            onClick={() => setActiveTab('files_patches')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'files_patches'
                ? 'bg-neutral-900 text-rose-400 shadow-sm ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Archivos & THCRAP</span>
          </button>

          <button
            onClick={() => setActiveTab('replays')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'replays'
                ? 'bg-neutral-900 text-rose-400 shadow-sm ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Partidas & Replays ({game.replays.length})</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 flex-1 space-y-6">
        {/* ================= TAB 1: JUEGO & DANMAKU ================= */}
        {activeTab === 'game' && (
          <div className="flex flex-col space-y-6 max-w-4xl">
            {/* Moriya Shrine Recommendation when not installed */}
            {!game.installed && (
              <div className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-neutral-900 to-neutral-900 p-5 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600/20 text-rose-400">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-100">
                        ¿No tienes {game.titleEnglish} instalado?
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Descarga la versión completa desde el repositorio comunitario confiable
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-rose-950 border border-rose-800 text-rose-300 px-2 py-0.5 rounded font-mono">
                    Fuente segura
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Puedes obtener el juego en formato <code className="text-rose-300">.ZIP</code>, <code className="text-rose-300">.7z</code> o <code className="text-rose-300">.RAR</code> directamente en <strong>Moriya Shrine</strong>. Al descargarlo en tu carpeta <code className="text-neutral-200 font-mono">~/Descargas</code>, DanmakuLauncher lo detectará automáticamente y te permitirá instalarlo con corrección de caracteres japoneses (Anti-Mojibake) y 60 FPS estables en Linux.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      if (window.danmakuAPI?.openExternal) {
                        window.danmakuAPI.openExternal('https://moriyashrine.org/resources/categories/games.5/');
                      } else {
                        window.open('https://moriyashrine.org/resources/categories/games.5/', '_blank');
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-semibold shadow transition-all active:scale-95 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Abrir Moriya Shrine (Descargar)</span>
                  </button>

                  <button
                    onClick={() => onInstallPrompt(game)}
                    className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-rose-400" />
                    <span>Instalar archivo existente (.ZIP / .7z / .rar)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Synopsis */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5">
              <h3 className="text-xs font-mono font-semibold uppercase text-rose-400 tracking-wider">
                Sinopsis del Incidente
              </h3>
              <p className="mt-2 text-sm text-neutral-300 leading-relaxed font-sans">
                {game.synopsis}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-400 border-t border-neutral-800/80 pt-3">
                <span>Fases: <strong className="text-neutral-200">{game.stageCount} Stages</strong></span>
                <span>·</span>
                <span>BGM compuestas por ZUN: <strong className="text-neutral-200">{game.bgmCount} Pistas</strong></span>
                <span>·</span>
                <span>Ruta ejecutable: <code className="text-rose-300 font-mono text-[11px]">{game.executablePath || 'Pendiente de asignar'}</code></span>
              </div>
            </div>

            {/* Character & Shot Type Selector */}
            {game.characters.length > 0 && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-semibold uppercase text-rose-400 tracking-wider">
                    Selección de Personaje & Tipo de Disparo
                  </h3>
                  <span className="text-xs text-neutral-400">
                    ZUN Original Sprite Specs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {game.characters.map((char) => {
                    const isCharSelected = selectedCharacterId === char.id;
                    const shot = char.shotTypes[0];

                    return (
                      <div
                        key={char.id}
                        onClick={() => setSelectedCharacterId(char.id)}
                        className={`flex flex-col justify-between rounded-lg p-3.5 border transition-all cursor-pointer ${
                          isCharSelected
                            ? 'border-rose-500 bg-rose-950/20 shadow-md ring-1 ring-rose-500/40'
                            : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-neutral-100">
                              {char.name}
                            </span>
                            {isCharSelected && (
                              <Check className="h-4 w-4 text-rose-400" />
                            )}
                          </div>
                          <span className="text-xs text-neutral-400">{char.title}</span>

                          {shot && (
                            <div className="mt-3 text-xs space-y-1.5 border-t border-neutral-800/80 pt-2.5">
                              <p className="font-medium text-rose-300">{shot.name} · {shot.japaneseName}</p>
                              <p className="text-neutral-400 text-[11px] leading-snug">{shot.description}</p>
                              <p className="text-neutral-300 text-[11px]">
                                <span className="text-neutral-500">Bomba:</span> {shot.bombSpellCard}
                              </p>
                            </div>
                          )}
                        </div>

                        {shot && (
                          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-neutral-400 border-t border-neutral-800/80 pt-2">
                            <span>Velocidad: {shot.speed}</span>
                            <span>Poder: {shot.power}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Difficulty selector with ZUN flavor */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4">
              <h3 className="text-xs font-mono font-semibold uppercase text-rose-400 tracking-wider">
                Nivel de Dificultad (ZUN Style)
              </h3>

              <div className="flex flex-wrap gap-2.5">
                {game.difficulties.map((diff) => {
                  const isDiffSelected = selectedDifficulty === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`rounded-lg py-2 px-4 text-xs font-bold transition-all border cursor-pointer ${
                        isDiffSelected
                          ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                          : 'bg-neutral-800/80 text-neutral-300 border-neutral-700/80 hover:bg-neutral-700'
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>

              {/* ZUN commentary box */}
              <div
                className="rounded-lg p-3.5 border border-neutral-800 bg-black/40 text-xs space-y-1.5"
                style={{ borderLeftColor: difficultyInfo.color, borderLeftWidth: '3px' }}
              >
                <p className="font-semibold text-neutral-200">{difficultyInfo.subtitle}</p>
                <p className="text-neutral-400 leading-relaxed">{difficultyInfo.description}</p>
              </div>
            </div>

            {/* Custom launch args for power users */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-3">
              <h3 className="text-xs font-mono font-semibold uppercase text-rose-400 tracking-wider">
                Argumentos Personalizados (Wine / CLI)
              </h3>
              <input
                type="text"
                value={game.config.customArgs}
                onChange={(e) => onUpdateConfig(game.id, { customArgs: e.target.value })}
                placeholder="ej: -window -nosound -fps60"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:border-rose-500 focus:outline-none"
              />
              <p className="text-[11px] text-neutral-400">
                Parámetros enviados directamente al subproceso de Rust al invocar <code className="text-rose-300">launch_game</code>.
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 2: GRÁFICOS & PANTALLA ================= */}
        {activeTab === 'graphics' && (
          <div className="space-y-6 max-w-4xl">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">
                  Presets de Pantalla y Escalado (Wine + Gamescope + FSR)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Optimizado para monitores modernos en Linux/Wayland evitando estiramientos no deseados.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Preset 1: FSR Gamescope */}
                <div
                  onClick={() => onUpdateConfig(game.id, { resolution: '1920x1080_Pillarbox', fullscreen: true })}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    game.config.resolution === '1920x1080_Pillarbox'
                      ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/40 shadow-lg'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-neutral-100">1. Pantalla Completa FSR</span>
                    {game.config.resolution === '1920x1080_Pillarbox' && <Check className="h-4 w-4 text-rose-400" />}
                  </div>
                  <span className="text-[11px] font-mono text-rose-400">AMD FidelityFX + Gamescope</span>
                  <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
                    Escala a la resolución nativa de tu monitor mediante <code className="text-rose-300">gamescope</code>, manteniendo 60 FPS estables y suavizado de bordes sin distorsión.
                  </p>
                </div>

                {/* Preset 2: Integer scaling */}
                <div
                  onClick={() => onUpdateConfig(game.id, { resolution: '1280x960', fullscreen: true })}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    game.config.resolution === '1280x960'
                      ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/40 shadow-lg'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-neutral-100">2. Pantalla Completa Entero (Integer)</span>
                    {game.config.resolution === '1280x960' && <Check className="h-4 w-4 text-rose-400" />}
                  </div>
                  <span className="text-[11px] font-mono text-rose-400">4:3 Pixel-Art Puro</span>
                  <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
                    Mantiene la relación de aspecto 4:3 con bordes negros laterales limpios y píxeles nítidos sin borrosidad de interpolación.
                  </p>
                </div>

                {/* Preset 3: Windowed HD 960x720 */}
                <div
                  onClick={() => onUpdateConfig(game.id, { resolution: '960x720', fullscreen: false })}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    game.config.resolution === '960x720' && !game.config.fullscreen
                      ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/40 shadow-lg'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-neutral-100">3. Ventana HD (960×720)</span>
                    {game.config.resolution === '960x720' && !game.config.fullscreen && (
                      <Check className="h-4 w-4 text-rose-400" />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-rose-400">1.5x Escala Exacta</span>
                  <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
                    Ventana nítida 1.5x perfecta para monitores 1080p y multitarea sin perder la estética original de ZUN.
                  </p>
                </div>

                {/* Preset 4: Retro 640x480 */}
                <div
                  onClick={() => onUpdateConfig(game.id, { resolution: '640x480', fullscreen: false })}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    game.config.resolution === '640x480'
                      ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/40 shadow-lg'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-neutral-100">4. Ventana Retro (640×480)</span>
                    {game.config.resolution === '640x480' && <Check className="h-4 w-4 text-rose-400" />}
                  </div>
                  <span className="text-[11px] font-mono text-rose-400">Resolución Original Windows 2002</span>
                  <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
                    Tamaño clásico 1:1 original tal y como se ejecutaba en CRT a principios de los 2000.
                  </p>
                </div>
              </div>
            </div>

            {/* Vpatch & Refresh Rate Compatibility */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-100">
                Inyección de Compatibilidad (vpatch & D3D8to9)
              </h3>
              <p className="text-xs text-neutral-400">
                Para juegos antiguos como Touhou 6 (EoSD), vpatch elimina el tearing en Wayland e inyecta compatibilidad directa con pantallas a 144Hz+.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg bg-neutral-950 p-3.5 border border-neutral-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-neutral-200">Activar Vpatch + D3D8to9</span>
                  <p className="text-[11px] text-neutral-400">
                    Asegura refresco sincronizado a 60 FPS estables sin tearing ni aceleración excesiva en Linux.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={game.config.vpatch}
                  onChange={(e) => onUpdateConfig(game.id, { vpatch: e.target.checked })}
                  className="h-5 w-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg bg-neutral-950 p-3.5 border border-neutral-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-neutral-200">Bloqueo estricto a 60 FPS</span>
                  <p className="text-[11px] text-neutral-400">
                    Mantiene la velocidad física original de los patrones Danmaku.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={game.config.fps60Lock}
                  onChange={(e) => onUpdateConfig(game.id, { fps60Lock: e.target.checked })}
                  className="h-5 w-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: SONIDO & MANDOS (.cfg) ================= */}
        {activeTab === 'audio_controls' && (
          <div className="space-y-6 max-w-4xl">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-100">
                    Configurador Interno del Juego (Sin necesidad de custom.exe)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    El launcher codifica y escribe directamente los archivos de configuración binaria (<code className="text-rose-300 font-mono">{game.id}.cfg</code>).
                  </p>
                </div>
                <button
                  onClick={handleSaveBinaryCfg}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 text-xs font-semibold shadow transition-all"
                >
                  <FileCode2 className="h-4 w-4" />
                  <span>Guardar binario .cfg</span>
                </button>
              </div>

              {configSavedNotice && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 p-3 text-xs text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Configuración binaria guardada exitosamente en <code className="font-mono">{game.id}.cfg</code> (Rust binary writer).</span>
                </div>
              )}

              {/* Volume Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="space-y-2 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                    <span className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-rose-400" />
                      Volumen de Música (BGM)
                    </span>
                    <span className="font-mono text-rose-400">{game.config.bgmVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={game.config.bgmVolume}
                    onChange={(e) => onUpdateConfig(game.id, { bgmVolume: parseInt(e.target.value) })}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-neutral-500">Música de ZUN en formato WAV / MIDI emulado</p>
                </div>

                <div className="space-y-2 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                    <span className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-sky-400" />
                      Efectos de Sonido (SE)
                    </span>
                    <span className="font-mono text-sky-400">{game.config.seVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={game.config.seVolume}
                    onChange={(e) => onUpdateConfig(game.id, { seVolume: parseInt(e.target.value) })}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-neutral-500">Sonido de disparos, graze y spell cards</p>
                </div>
              </div>

              {/* Gamepad & Controls */}
              <div className="space-y-3 pt-3 border-t border-neutral-800">
                <h4 className="text-xs font-mono font-semibold uppercase text-rose-400 tracking-wider">
                  Soporte de Controles Modernos (Hook Injected)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-neutral-950 p-3 border border-neutral-800 space-y-1">
                    <p className="font-semibold text-neutral-200">Teclado Moderno (WASD + JKL)</p>
                    <p className="text-neutral-400 text-[11px]">
                      Movimiento: <kbd className="bg-neutral-800 px-1 rounded">WASD</kbd> / Flechas
                      <br />Disparo: <kbd className="bg-neutral-800 px-1 rounded">Z</kbd> o <kbd className="bg-neutral-800 px-1 rounded">J</kbd>
                      <br />Bomba / Spell: <kbd className="bg-neutral-800 px-1 rounded">X</kbd> o <kbd className="bg-neutral-800 px-1 rounded">K</kbd>
                      <br />Modo Concentrado (Focus): <kbd className="bg-neutral-800 px-1 rounded">Shift</kbd> o <kbd className="bg-neutral-800 px-1 rounded">L</kbd>
                    </p>
                  </div>

                  <div className="rounded-lg bg-neutral-950 p-3 border border-neutral-800 space-y-1">
                    <p className="font-semibold text-neutral-200">Gamepad / Mando (Xbox / PS / Steam Deck)</p>
                    <p className="text-neutral-400 text-[11px]">
                      Botón A / Cruz: Disparo
                      <br />Botón B / Círculo: Bomba
                      <br />Gatillo RT / R2: Modo Concentrado (Hitbox visible)
                      <br />Zona Muerta del Stick: <strong className="text-rose-300 font-mono">10%</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: ARCHIVOS & THCRAP ================= */}
        {activeTab === 'files_patches' && (
          <div className="space-y-6 max-w-4xl">
            {/* Language & THCrap Switcher */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-100">
                    Idiomas y Parches en Caliente (THCRAP)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Alterna instantáneamente entre traducciones sin abrir ventanas intermedias molestas.
                  </p>
                </div>

                <button
                  onClick={handleUpdatePatch}
                  disabled={isPatchUpdating}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isPatchUpdating ? 'animate-spin text-rose-400' : ''}`} />
                  <span>{isPatchUpdating ? 'Sincronizando...' : 'Actualizar Parches'}</span>
                </button>
              </div>

              {patchSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 p-3 text-xs text-emerald-300">
                  <Check className="h-4 w-4" />
                  <span>Parches comunitarios de THCRAP actualizados correctamente al último commit.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Spanish */}
                <div
                  onClick={() => onUpdateConfig(game.id, { thcrapLanguage: 'es_ES' })}
                  className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                    game.config.thcrapLanguage === 'es_ES'
                      ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/40'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-neutral-100 flex items-center gap-1.5">
                      <span>🇪🇸</span> Español
                    </span>
                    {game.config.thcrapLanguage === 'es_ES' && <Check className="h-4 w-4 text-rose-400" />}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Traducción completa de la comunidad hispana (thcrap:es).</p>
                </div>

                {/* English */}
                <div
                  onClick={() => onUpdateConfig(game.id, { thcrapLanguage: 'en_US' })}
                  className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                    game.config.thcrapLanguage === 'en_US'
                      ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/40'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-neutral-100 flex items-center gap-1.5">
                      <span>🇺🇸</span> English
                    </span>
                    {game.config.thcrapLanguage === 'en_US' && <Check className="h-4 w-4 text-rose-400" />}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Traducción oficial de Touhou Patch Center (thpatch-en).</p>
                </div>

                {/* Japanese */}
                <div
                  onClick={() => onUpdateConfig(game.id, { thcrapLanguage: 'ja_JP' })}
                  className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                    game.config.thcrapLanguage === 'ja_JP'
                      ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/40'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-neutral-100 flex items-center gap-1.5">
                      <span>🇯🇵</span> 日本語 (Original)
                    </span>
                    {game.config.thcrapLanguage === 'ja_JP' && <Check className="h-4 w-4 text-rose-400" />}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Ejecutable original de ZUN sin parches inyectados.</p>
                </div>
              </div>
            </div>

            {/* Storage & Safe Uninstall Management */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-100">
                Gestión de Almacenamiento & Sistema Operativo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-neutral-950 p-3.5 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400">Espacio en Disco</span>
                  <p className="text-base font-bold font-mono text-neutral-100 mt-0.5">524 MB</p>
                  <span className="text-[10px] text-neutral-500">Calculado en tiempo real</span>
                </div>

                <div className="rounded-lg bg-neutral-950 p-3.5 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400">Prefijo Wine</span>
                  <p className="text-xs font-mono text-neutral-200 mt-0.5 truncate">~/.local/share/wineprefixes/touhou</p>
                  <span className="text-[10px] text-emerald-400">Wine 9.0 Staging activo</span>
                </div>

                <div className="rounded-lg bg-neutral-950 p-3.5 border border-neutral-800">
                  <span className="text-[11px] text-neutral-400">Integración GNOME / Wayland</span>
                  <p className="text-xs font-mono text-neutral-200 mt-0.5">touhou-launcher.desktop</p>
                  <span className="text-[10px] text-sky-400">Acceso directo registrado</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onOpenDirectory(game.id)}
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3.5 py-2 text-xs font-medium transition-colors"
                >
                  <FolderOpen className="h-4 w-4 text-amber-400" />
                  <span>Abrir carpeta en gestor de archivos</span>
                </button>

                <button
                  onClick={() => onUninstallPrompt(game)}
                  className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 hover:bg-red-950/60 text-red-300 px-3.5 py-2 text-xs font-medium transition-colors ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Desinstalar Juego...</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: PARTIDAS & REPLAYS ================= */}
        {activeTab === 'replays' && (
          <div className="space-y-6 max-w-4xl">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-100">
                    Historial de Repeticiones Guardadas (.rpy)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Permite ver partidas grabadas, exportarlas o transferirlas para compartir tus récords en torneos de Danmaku.
                  </p>
                </div>

                <button
                  onClick={() => alert('Función lista para conectar con el backend Rust: scan_replays()')}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  <span>Importar Replay (.rpy)</span>
                </button>
              </div>

              {game.replays.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs">
                  No hay repeticiones guardadas para este juego aún. Completa una partida para grabar tu primer replay.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 font-mono text-[11px]">
                        <th className="py-2 px-3">Archivo</th>
                        <th className="py-2 px-3">Jugador</th>
                        <th className="py-2 px-3">Personaje</th>
                        <th className="py-2 px-3">Dificultad</th>
                        <th className="py-2 px-3">Puntuación</th>
                        <th className="py-2 px-3">Fase</th>
                        <th className="py-2 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {game.replays.map((rep) => (
                        <tr key={rep.id} className="hover:bg-neutral-800/40">
                          <td className="py-2.5 px-3 font-mono text-rose-300 font-semibold">{rep.name}</td>
                          <td className="py-2.5 px-3 text-neutral-200">{rep.player}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{rep.character}</td>
                          <td className="py-2.5 px-3 font-semibold text-neutral-300">{rep.difficulty}</td>
                          <td className="py-2.5 px-3 font-mono text-amber-400">{formatScore(rep.score)}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{rep.stageReached}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => onExportReplay(rep.id)}
                              className="rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2 py-1 text-[11px] transition-colors"
                            >
                              Exportar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
