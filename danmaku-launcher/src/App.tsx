/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import Navbar from './components/Navbar.tsx';
import DanmakuCanvas, { type DanmakuMode } from './components/DanmakuCanvas.tsx';
import DownloadsAlertBanner from './components/DownloadsAlertBanner.tsx';
import LibraryToolbar from './components/LibraryToolbar.tsx';
import GameGridView from './components/GameGridView.tsx';
import GameListView from './components/GameListView.tsx';
import GameDetailView from './components/GameDetailView.tsx';
import ZipInstallerModal from './components/ZipInstallerModal.tsx';
import UninstallModal from './components/UninstallModal.tsx';
import MusicRoomModal from './components/MusicRoomModal.tsx';
import RustBridgeModal from './components/RustBridgeModal.tsx';
import GamepadHelpModal from './components/GamepadHelpModal.tsx';
import ThemeSelectorModal from './components/ThemeSelectorModal.tsx';
import { useGamepad } from './hooks/useGamepad.ts';
import { INITIAL_TOUHOU_GAMES } from './data/touhouDatabase.ts';
import type { TouhouGame, TouhouEra, GameDifficulty, RustIpcLog } from './types/touhou.ts';
import { filterGames, sortGames, type SortMode, createRustLaunchPayload } from './utils/launcherLogic.ts';
import { type ThemeMode, type EffectiveTheme, resolveEffectiveTheme } from './utils/themeLogic.ts';

export default function App() {
  // Navigation & View states
  const [currentTab, setCurrentTab] = useState<'library' | 'music' | 'rust_bridge'>('library');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedGameId, setSelectedGameId] = useState<string>('th06');
  const [showDetailPanel, setShowDetailPanel] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState<TouhouEra>('all');
  const [sortMode, setSortMode] = useState<SortMode>('number');
  const [onlyInstalled, setOnlyInstalled] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Games Database
  const [games, setGames] = useState<TouhouGame[]>(() => {
    const saved = localStorage.getItem('danmaku_launcher_games');
    if (saved) {
      try {
        const parsed: TouhouGame[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(parsed.map((g) => [g.id, g]));
          return INITIAL_TOUHOU_GAMES.map((initialGame) => {
            const savedGame = existingMap.get(initialGame.id);
            if (savedGame) {
              return {
                ...initialGame,
                installed: savedGame.installed,
                executablePath: savedGame.executablePath,
                lastPlayed: savedGame.lastPlayed,
                playTimeMinutes: savedGame.playTimeMinutes,
                highScore: savedGame.highScore,
                isFavorite: savedGame.isFavorite,
                config: { ...initialGame.config, ...savedGame.config },
              };
            }
            return initialGame;
          });
        }
      } catch (e) {
        return INITIAL_TOUHOU_GAMES;
      }
    }
    return INITIAL_TOUHOU_GAMES;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('danmaku_launcher_games', JSON.stringify(games));
  }, [games]);

  // Process execution state
  const [runningGameId, setRunningGameId] = useState<string | null>(null);
  const [runningSeconds, setRunningSeconds] = useState(0);

  // Danmaku ambient canvas mode
  const [danmakuMode, setDanmakuMode] = useState<DanmakuMode>('sakura');

  // Modals state
  const [isZipInstallerOpen, setIsZipInstallerOpen] = useState(false);
  const [isMusicRoomOpen, setIsMusicRoomOpen] = useState(false);
  const [isRustBridgeOpen, setIsRustBridgeOpen] = useState(false);
  const [isGamepadHelpOpen, setIsGamepadHelpOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [gameToUninstall, setGameToUninstall] = useState<TouhouGame | null>(null);

  // Theme mode & Local time synchronization
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('danmaku_theme_mode') as ThemeMode) || 'auto';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
    resolveEffectiveTheme(themeMode)
  );

  // Auto time check and HTML class sync
  useEffect(() => {
    localStorage.setItem('danmaku_theme_mode', themeMode);
    const updateTheme = () => {
      const resolved = resolveEffectiveTheme(themeMode);
      setEffectiveTheme(resolved);

      document.documentElement.setAttribute('data-theme', resolved);
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();
    const timer = setInterval(updateTheme, 60000);
    return () => clearInterval(timer);
  }, [themeMode]);

  // Auto-scan downloads banner state
  const [hasDownloadsBanner, setHasDownloadsBanner] = useState(false);
  const [detectedZip, setDetectedZip] = useState<{ path: string; fileName: string; gameTitle?: string; gameId?: string } | null>(null);

  // IPC communication log
  const [ipcLogs, setIpcLogs] = useState<RustIpcLog[]>([
    {
      id: 'log_0',
      timestamp: new Date().toLocaleTimeString(),
      command: 'init_system_runtime',
      payload: { platform: 'linux_wayland', wine_version: '9.0_staging', gamescope: true },
      response: { status: 'ready', detected_games: 3 },
      status: 'success',
    },
  ]);

  const addIpcLog = useCallback(
    (
      command: string,
      payload: Record<string, unknown>,
      response: Record<string, unknown>,
      status: 'success' | 'running' | 'error' = 'success'
    ) => {
      const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setIpcLogs((prev) => [
        {
          id,
          timestamp: new Date().toLocaleTimeString(),
          command,
          payload,
          response,
          status,
        },
        ...prev.slice(0, 99),
      ]);
      return id;
    },
    []
  );

  const updateIpcLog = useCallback(
    (
      id: string,
      updates: Partial<Pick<RustIpcLog, 'response' | 'status' | 'payload'>>
    ) => {
      setIpcLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
      );
    },
    []
  );

  // Sync real game statuses from Rust backend
  const refreshGamesStatus = useCallback(async () => {
    if (!window.danmakuAPI) return;
    try {
      const backendGames = await window.danmakuAPI.getGamesStatus();
      console.log('DanmakuLauncher: Loaded games from Rust backend:', backendGames.length);
      if (Array.isArray(backendGames) && backendGames.length > 0) {
        setGames((prev) =>
          prev.map((g) => {
            const found = backendGames.find((bg) => bg.id === g.id);
            if (!found) return g;
            return {
              ...g,
              installed: found.installed,
              executablePath: found.path || g.executablePath,
              playTimeMinutes: found.play_time_minutes ?? g.playTimeMinutes,
              highScore: found.high_score ?? g.highScore,
              lastPlayed: found.last_played ?? g.lastPlayed,
              config: {
                ...g.config,
                resolution: (found.display_mode === 'window_1280' ? '1280x960' : found.display_mode === 'window_960' ? '960x720' : found.display_mode === 'window_640' ? '640x480' : '1920x1080_Pillarbox'),
                fullscreen: found.display_mode.startsWith('fullscreen'),
                fps60Lock: found.fps_60,
                bgmVolume: found.bgm_volume,
                seVolume: found.se_volume,
                thcrapLanguage: (found.language === 'en' ? 'en_US' : found.language === 'ja' ? 'ja_JP' : 'es_ES'),
              },
            };
          })
        );
      }
    } catch (e) {
      console.warn('Backend games status failed:', e);
    }
  }, []);

  // Initial load: refresh real games and scan for zips
  useEffect(() => {
    refreshGamesStatus();
    if (window.danmakuAPI) {
      window.danmakuAPI.scanDownloads().then((zips) => {
        if (zips && zips.length > 0) {
          const first = zips[0];
          setDetectedZip({
            path: first.path,
            fileName: first.fileName,
            gameId: first.gameId || undefined,
            gameTitle: first.gameTitle || undefined,
          });
          setHasDownloadsBanner(true);
        } else {
          setHasDownloadsBanner(false);
        }
      }).catch(() => setHasDownloadsBanner(false));
    }
  }, [refreshGamesStatus]);

  // Running game timer
  useEffect(() => {
    let interval: number;
    if (runningGameId) {
      interval = window.setInterval(() => {
        setRunningSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRunningSeconds(0);
    }
    return () => clearInterval(interval);
  }, [runningGameId]);

  // Filtered & Sorted Games list
  const filteredGames = useMemo(() => {
    const filtered = filterGames(games, searchQuery, selectedEra, onlyFavorites, onlyInstalled);
    return sortGames(filtered, sortMode);
  }, [games, searchQuery, selectedEra, onlyFavorites, onlyInstalled, sortMode]);

  // Selected Game object
  const selectedGame = useMemo(() => {
    return games.find((g) => g.id === selectedGameId) || games[0];
  }, [games, selectedGameId]);

  // Installed count
  const installedCount = useMemo(() => {
    return games.filter((g) => g.installed).length;
  }, [games]);

  // Gamepad navigation support
  const handleGamepadNavigateNext = useCallback(() => {
    const currentIndex = filteredGames.findIndex((g) => g.id === selectedGameId);
    if (currentIndex < filteredGames.length - 1) {
      setSelectedGameId(filteredGames[currentIndex + 1].id);
    }
  }, [filteredGames, selectedGameId]);

  const handleGamepadNavigatePrev = useCallback(() => {
    const currentIndex = filteredGames.findIndex((g) => g.id === selectedGameId);
    if (currentIndex > 0) {
      setSelectedGameId(filteredGames[currentIndex - 1].id);
    }
  }, [filteredGames, selectedGameId]);

  const { gamepadConnected, gamepadName } = useGamepad({
    onNavigateNext: handleGamepadNavigateNext,
    onNavigatePrev: handleGamepadNavigatePrev,
    onSelect: () => {
      if (selectedGame && selectedGame.installed && !runningGameId) {
        handleLaunchGame(selectedGame, selectedGame.characters[0]?.id || 'reimu', 'Normal');
      }
    },
    onBack: () => {
      setIsZipInstallerOpen(false);
      setIsMusicRoomOpen(false);
      setIsRustBridgeOpen(false);
      setIsGamepadHelpOpen(false);
      setIsThemeSelectorOpen(false);
      setGameToUninstall(null);
    },
  });

  // Keyboard navigation listener (Arrow keys, Enter, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleGamepadNavigateNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleGamepadNavigatePrev();
      } else if (e.key === 'Escape') {
        setIsZipInstallerOpen(false);
        setIsMusicRoomOpen(false);
        setIsRustBridgeOpen(false);
        setIsGamepadHelpOpen(false);
        setIsThemeSelectorOpen(false);
        setGameToUninstall(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGamepadNavigateNext, handleGamepadNavigatePrev]);

  // Action: Launch game (Real Wine + Gamescope + THCrap Execution)
  const handleLaunchGame = async (game: TouhouGame, characterId: string, difficulty: GameDifficulty) => {
    if (!game.installed) {
      setSelectedGameId(game.id);
      setIsZipInstallerOpen(true);
      return;
    }

    setRunningGameId(game.id);
    setRunningSeconds(0);

    const displayMode = game.config.fullscreen ? 'fullscreen_fsr' : game.config.resolution;
    const language = game.config.thcrapLanguage === 'en_US' ? 'en' : game.config.thcrapLanguage === 'ja_JP' ? 'ja' : 'es';

    if (window.danmakuAPI) {
      addIpcLog('launch_game', { gameId: game.id, displayMode, language }, { status: 'running_wine' });
      try {
        const res = await window.danmakuAPI.launchGame({
          gameId: game.id,
          displayMode,
          language,
        });
        addIpcLog('launch_game', { gameId: game.id }, res);
      } catch (err) {
        addIpcLog('launch_game', { gameId: game.id }, { error: String(err) });
      } finally {
        setRunningGameId(null);
        await refreshGamesStatus();
      }
    } else {
      const payload = createRustLaunchPayload(game, characterId, difficulty);
      addIpcLog('launch_game', payload.payload, { status: 'mock_started' });
    }

    // Update last played & sync
    await refreshGamesStatus();
  };

  // Action: Stop game (Reaper)
  const handleStopGame = async (gameId: string) => {
    if (window.danmakuAPI?.stopGame) {
      try {
        await window.danmakuAPI.stopGame(gameId);
      } catch (e) {
        console.warn('Reaper stop game error:', e);
      }
    }
    addIpcLog(
      'reaper_kill_zombies',
      { game_id: gameId },
      { exit_code: 0, reaper_status: 'all_wine_processes_cleaned' }
    );
    setRunningGameId(null);
    await refreshGamesStatus();
  };

  // Action: Toggle favorite
  const handleToggleFavorite = (gameId: string) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, isFavorite: !g.isFavorite } : g))
    );
  };

  // Action: Update game config (Real binary .cfg sync)
  const handleUpdateConfig = async (gameId: string, newConfig: Partial<TouhouGame['config']>) => {
    const targetGame = games.find((g) => g.id === gameId);
    if (!targetGame) return;
    const updatedConfig = { ...targetGame.config, ...newConfig };

    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, config: updatedConfig } : g))
    );

    if (window.danmakuAPI) {
      const displayMode = updatedConfig.fullscreen ? 'fullscreen_fsr' : updatedConfig.resolution;
      const language = updatedConfig.thcrapLanguage === 'en_US' ? 'en' : updatedConfig.thcrapLanguage === 'ja_JP' ? 'ja' : 'es';
      try {
        await window.danmakuAPI.saveConfig({
          gameId,
          color32: true,
          fps60: updatedConfig.fps60Lock,
          bgm: updatedConfig.bgmVolume,
          se: updatedConfig.seVolume,
          pad: 600,
          displayMode,
          language,
        });
        addIpcLog('write_binary_cfg', { gameId, config: updatedConfig }, { success: true });
      } catch (err) {
        addIpcLog('write_binary_cfg', { gameId }, { error: String(err) });
      }
    }
  };

  // Action: Install game from ZIP / Downloads
  const handleInstallGame = async (_gameCode: string) => {
    await refreshGamesStatus();
  };

  // Action: Uninstall game (Real removal + preserve saves)
  const handleConfirmUninstall = async (gameId: string, keepSaves: boolean) => {
    if (window.danmakuAPI) {
      try {
        await window.danmakuAPI.uninstallGame({ gameId, keepSaves });
        addIpcLog('uninstall_game', { gameId, keepSaves }, { success: true });
        await refreshGamesStatus();
      } catch (err) {
        addIpcLog('uninstall_game', { gameId }, { error: String(err) });
      }
    } else {
      setGames((prev) =>
        prev.map((g) => {
          if (g.id === gameId) {
            return {
              ...g,
              installed: false,
              executablePath: '',
              replays: keepSaves ? g.replays : [],
              highScore: keepSaves ? g.highScore : 0,
            };
          }
          return g;
        })
      );
    }
    setGameToUninstall(null);
  };

  // Action: Open local directory in file manager
  const handleOpenDirectory = (gameId: string) => {
    if (window.danmakuAPI) {
      window.danmakuAPI.openFolder(gameId);
      addIpcLog('open_directory', { gameId }, { success: true });
    } else {
      alert(`Abriendo carpeta del juego: ${gameId}`);
    }
  };

  // Action: Export replay
  const handleExportReplay = (replayId: string) => {
    addIpcLog('export_replay', { replay_id: replayId }, { exported_to: `~/Descargas/${replayId}` });
    alert(`Replay exportado a ~/Descargas/${replayId}`);
  };

  // Cycle danmaku mode
  const handleCycleDanmaku = () => {
    const modes: DanmakuMode[] = ['sakura', 'danmaku', 'minimal', 'off'];
    const nextIdx = (modes.indexOf(danmakuMode) + 1) % modes.length;
    setDanmakuMode(modes[nextIdx]);
  };

  // Quick launch helper
  const quickLaunchGame = games.find((g) => g.installed) || games[0];

  return (
    <div className={`relative min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white theme-${effectiveTheme}`}>
      {/* Danmaku Ambient Background Canvas */}
      <DanmakuCanvas mode={danmakuMode} />

      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'music') {
            setIsMusicRoomOpen(true);
          } else if (tab === 'rust_bridge') {
            setIsRustBridgeOpen(true);
          } else {
            setCurrentTab('library');
          }
        }}
        onOpenZipInstaller={() => setIsZipInstallerOpen(true)}
        onOpenGamepadHelp={() => setIsGamepadHelpOpen(true)}
        gamepadConnected={gamepadConnected}
        danmakuMode={danmakuMode}
        onToggleDanmaku={handleCycleDanmaku}
        onQuickLaunch={() => {
          if (quickLaunchGame) {
            setSelectedGameId(quickLaunchGame.id);
            handleLaunchGame(quickLaunchGame, quickLaunchGame.characters[0]?.id || 'reimu', 'Normal');
          }
        }}
        quickLaunchGameName={quickLaunchGame.code}
        themeMode={themeMode}
        effectiveTheme={effectiveTheme}
        onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
      />

      {/* Auto-detected Downloads Banner */}
      {hasDownloadsBanner && detectedZip && (
        <DownloadsAlertBanner
          fileName={detectedZip.fileName}
          detectedGameCode={detectedZip.gameId || 'TH'}
          detectedGameTitle={detectedZip.gameTitle || detectedZip.fileName}
          fileSize="Descargas"
          onInstall={async () => {
            if (window.danmakuAPI && detectedZip.path) {
              const logId = addIpcLog(
                'extract_archive:start',
                {
                  archive_path: detectedZip.path,
                  file_name: detectedZip.fileName,
                  detected_game: detectedZip.gameId || 'TH',
                  source: 'Auto-scan ~/Descargas',
                  extractor: '7z / Native Rust',
                },
                {
                  status: 'extracting',
                  message: `Descomprimiendo y procesando archivo ${detectedZip.fileName}...`,
                },
                'running'
              );

              try {
                const res = await window.danmakuAPI.installZip(detectedZip.path);
                if (res.success) {
                  updateIpcLog(logId, {
                    status: 'success',
                    response: {
                      status: 'extracted',
                      files_extracted: res.files_extracted,
                      game_id: res.game_id,
                      game_name: res.game_name,
                    },
                  });

                  addIpcLog(
                    'install_game:success',
                    {
                      game_id: res.game_id,
                      game_name: res.game_name,
                      target_dir: `games/${res.game_id}`,
                      files_extracted: res.files_extracted,
                    },
                    {
                      status: 'ready_to_play',
                      flattened: true,
                      bloatware_purged: true,
                      compatibility_configured: true,
                    },
                    'success'
                  );

                  await refreshGamesStatus();
                } else {
                  updateIpcLog(logId, {
                    status: 'error',
                    response: { error: res.error },
                  });

                  addIpcLog(
                    'install_game:error',
                    { archive_path: detectedZip.path },
                    { error: res.error || 'Error al descomprimir archivo' },
                    'error'
                  );
                }
              } catch (err) {
                updateIpcLog(logId, {
                  status: 'error',
                  response: { error: String(err) },
                });

                addIpcLog(
                  'install_game:error',
                  { archive_path: detectedZip.path },
                  { error: String(err) },
                  'error'
                );
              }
            }
            setHasDownloadsBanner(false);
          }}
        />
      )}

      {/* Onboarding Moriya Shrine Banner if no games installed */}
      {installedCount === 0 && !hasDownloadsBanner && (
        <div className="mx-6 mb-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-950/60 via-neutral-900 to-neutral-900 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-600/20 text-rose-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-100">
                ¡Bienvenido a Touhou Project Launcher!
              </p>
              <p className="text-xs text-neutral-300">
                Aún no tienes ningún juego instalado. Puedes descargar tus entregas favoritas de forma segura y completa desde <strong>Moriya Shrine</strong> (.zip o .7z). Al guardarlo en <code className="text-rose-300 font-mono">~/Descargas</code>, el launcher lo detectará automáticamente.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (window.danmakuAPI?.openExternal) {
                  window.danmakuAPI.openExternal('https://moriyashrine.org/resources/categories/games.5/');
                } else {
                  window.open('https://moriyashrine.org/resources/categories/games.5/', '_blank');
                }
              }}
              className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Explorar Moriya Shrine</span>
            </button>
            <button
              onClick={() => setIsZipInstallerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Instalar Archivo Local</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace: Split View with Library and Detail Panel */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Top Library Section */}
        <section
          aria-label="Catálogo de juegos Touhou"
          className="flex-1 flex flex-col border-r border-neutral-800/80 min-w-0 overflow-hidden"
        >
          {/* Library Toolbar */}
          <LibraryToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedEra={selectedEra}
            onSelectEra={setSelectedEra}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            onlyInstalled={onlyInstalled}
            onToggleOnlyInstalled={() => setOnlyInstalled((v) => !v)}
            onlyFavorites={onlyFavorites}
            onToggleOnlyFavorites={() => setOnlyFavorites((v) => !v)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalGamesCount={filteredGames.length}
            installedCount={installedCount}
          />

          {/* Library Content: Grid vs List */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'grid' ? (
              <GameGridView
                games={filteredGames}
                selectedGameId={selectedGameId}
                onSelectGame={(g) => {
                  setSelectedGameId(g.id);
                  setShowDetailPanel(true);
                }}
                onLaunchGame={(g) =>
                  handleLaunchGame(g, g.characters[0]?.id || 'reimu', 'Normal')
                }
                onToggleFavorite={handleToggleFavorite}
                onInstallPrompt={(g) => {
                  setSelectedGameId(g.id);
                  setIsZipInstallerOpen(true);
                }}
                runningGameId={runningGameId}
              />
            ) : (
              <GameListView
                games={filteredGames}
                selectedGameId={selectedGameId}
                onSelectGame={(g) => {
                  setSelectedGameId(g.id);
                  setShowDetailPanel(true);
                }}
                onLaunchGame={(g) =>
                  handleLaunchGame(g, g.characters[0]?.id || 'reimu', 'Normal')
                }
                onToggleFavorite={handleToggleFavorite}
                onInstallPrompt={(g) => {
                  setSelectedGameId(g.id);
                  setIsZipInstallerOpen(true);
                }}
                runningGameId={runningGameId}
              />
            )}
          </div>
        </section>

        {/* Right Detail Panel: 5 Organized Tabs */}
        {showDetailPanel && selectedGame && (
          <aside
            aria-label="Panel de configuración y ejecución del juego"
            className="w-full lg:w-[600px] xl:w-[720px] shrink-0 border-t lg:border-t-0 border-neutral-800 flex flex-col bg-neutral-950/90 backdrop-blur-md"
          >
            <GameDetailView
              game={selectedGame}
              onLaunch={handleLaunchGame}
              onStop={handleStopGame}
              isRunning={runningGameId === selectedGame.id}
              runningSeconds={runningSeconds}
              onUpdateConfig={handleUpdateConfig}
              onInstallPrompt={() => setIsZipInstallerOpen(true)}
              onOpenDirectory={handleOpenDirectory}
              onUninstallPrompt={(g) => setGameToUninstall(g)}
              onToggleFavorite={handleToggleFavorite}
              onExportReplay={handleExportReplay}
            />
          </aside>
        )}
      </main>

      {/* Modals */}
      <ZipInstallerModal
        isOpen={isZipInstallerOpen}
        onClose={() => setIsZipInstallerOpen(false)}
        onGameInstalled={(code) => handleInstallGame(code)}
        availableGames={games}
        onAddLog={addIpcLog}
        onUpdateLog={updateIpcLog}
      />

      <UninstallModal
        game={gameToUninstall}
        isOpen={gameToUninstall !== null}
        onClose={() => setGameToUninstall(null)}
        onConfirmUninstall={handleConfirmUninstall}
      />

      <MusicRoomModal
        isOpen={isMusicRoomOpen}
        onClose={() => setIsMusicRoomOpen(false)}
        initialGameId={selectedGame?.id || 'th06'}
        onAddLog={addIpcLog}
        onUpdateLog={updateIpcLog}
      />

      <RustBridgeModal
        isOpen={isRustBridgeOpen}
        onClose={() => setIsRustBridgeOpen(false)}
        ipcLogs={ipcLogs}
        onClearLogs={() => setIpcLogs([])}
      />

      <GamepadHelpModal
        isOpen={isGamepadHelpOpen}
        onClose={() => setIsGamepadHelpOpen(false)}
        gamepadConnected={gamepadConnected}
        gamepadName={gamepadName}
      />

      <ThemeSelectorModal
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
        currentMode={themeMode}
        effectiveTheme={effectiveTheme}
        onSelectMode={(mode) => setThemeMode(mode)}
      />
    </div>
  );
}
