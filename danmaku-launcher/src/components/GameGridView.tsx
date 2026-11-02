import { Play, Settings2, Download, Clock, Trophy } from 'lucide-react';
import type { TouhouGame } from '../types/touhou.ts';
import GameCoverArt from './GameCoverArt.tsx';
import { formatPlaytime, formatScore } from '../utils/launcherLogic.ts';

interface GameGridViewProps {
  games: TouhouGame[];
  selectedGameId: string;
  onSelectGame: (game: TouhouGame) => void;
  onLaunchGame: (game: TouhouGame) => void;
  onToggleFavorite: (gameId: string) => void;
  onInstallPrompt: (game: TouhouGame) => void;
  runningGameId: string | null;
}

export default function GameGridView({
  games,
  selectedGameId,
  onSelectGame,
  onLaunchGame,
  onToggleFavorite,
  onInstallPrompt,
  runningGameId,
}: GameGridViewProps) {
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center text-neutral-400">
        <p className="text-base font-semibold text-neutral-300">No se encontraron juegos de Touhou</p>
        <p className="mt-1 text-xs text-neutral-500">Prueba ajustando el término de búsqueda o la era seleccionada.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
      {games.map((game) => {
        const isSelected = selectedGameId === game.id;
        const isRunning = runningGameId === game.id;

        return (
          <div
            key={game.id}
            onClick={() => onSelectGame(game)}
            className={`group relative flex flex-col rounded-xl p-2 transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'bg-neutral-800/90 ring-2 ring-rose-500 shadow-lg shadow-rose-950/30'
                : 'bg-neutral-900/60 hover:bg-neutral-800/70 border border-neutral-800/60'
            }`}
          >
            {/* Box Cover */}
            <div className="relative">
              <GameCoverArt
                game={game}
                size="large"
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(game.id);
                }}
              />

              {/* Running indicator overlay */}
              {isRunning && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-black/70 backdrop-blur-sm">
                  <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>EN EJECUCIÓN</span>
                  </div>
                </div>
              )}

              {/* Quick action button on hover */}
              {!isRunning && (
                <div className="absolute inset-0 z-20 hidden items-center justify-center rounded-xl bg-black/60 opacity-0 group-hover:flex group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                  {game.installed ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLaunchGame(game);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-bold shadow-lg transform active:scale-95 transition-all"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>JUGAR</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInstallPrompt(game);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-2 text-xs font-semibold shadow-lg border border-neutral-600"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Instalar</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom info summary */}
            <div className="mt-2.5 flex flex-col px-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-semibold text-rose-400">{game.code}</span>
                {game.installed ? (
                  <span className="flex items-center gap-1 text-neutral-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatPlaytime(game.playTimeMinutes)}</span>
                  </span>
                ) : (
                  <span className="text-neutral-500 text-[10px]">No instalado</span>
                )}
              </div>
              <p className="mt-0.5 text-xs font-medium text-neutral-200 line-clamp-1">
                {game.titleEnglish}
              </p>
              {game.highScore > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400/90 font-mono">
                  <Trophy className="h-2.5 w-2.5" />
                  <span>{formatScore(game.highScore)}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
