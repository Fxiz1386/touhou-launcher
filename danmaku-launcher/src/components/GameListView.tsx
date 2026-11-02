import { Play, Download, Heart, CheckCircle2, CircleDashed } from 'lucide-react';
import type { TouhouGame } from '../types/touhou.ts';
import GameCoverArt from './GameCoverArt.tsx';
import { formatPlaytime, formatScore } from '../utils/launcherLogic.ts';

interface GameListViewProps {
  games: TouhouGame[];
  selectedGameId: string;
  onSelectGame: (game: TouhouGame) => void;
  onLaunchGame: (game: TouhouGame) => void;
  onToggleFavorite: (gameId: string) => void;
  onInstallPrompt: (game: TouhouGame) => void;
  runningGameId: string | null;
}

export default function GameListView({
  games,
  selectedGameId,
  onSelectGame,
  onLaunchGame,
  onToggleFavorite,
  onInstallPrompt,
  runningGameId,
}: GameListViewProps) {
  const getEngineName = (game: TouhouGame) => {
    if (game.era === 'pc98') return 'PC-98 / OPNA FM Synth';
    const num = typeof game.number === 'number' ? game.number : parseFloat(game.number);
    if (!isNaN(num) && num <= 9.5) return 'DirectX 8 (2002)';
    if (!isNaN(num) && num <= 13.5) return 'DirectX 9 (2009)';
    return 'DirectX 9 / Modern';
  };

  return (
    <div className="overflow-x-auto px-6 py-3">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-neutral-800 text-neutral-400 font-mono text-[11px]">
            <th className="py-2.5 px-3 w-10">Fav</th>
            <th className="py-2.5 px-3 w-16">Cover</th>
            <th className="py-2.5 px-3">Título / Código</th>
            <th className="py-2.5 px-3 hidden md:table-cell">Motor Gráfico</th>
            <th className="py-2.5 px-3">Estado</th>
            <th className="py-2.5 px-3 hidden sm:table-cell">Tiempo</th>
            <th className="py-2.5 px-3 hidden lg:table-cell">Récord</th>
            <th className="py-2.5 px-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/60">
          {games.map((game) => {
            const isSelected = selectedGameId === game.id;
            const isRunning = runningGameId === game.id;

            return (
              <tr
                key={game.id}
                onClick={() => onSelectGame(game)}
                className={`transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-rose-950/25 border-l-2 border-rose-500'
                    : 'hover:bg-neutral-900/60'
                }`}
              >
                {/* Favorite */}
                <td className="py-2 px-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(game.id);
                    }}
                    className="text-neutral-500 hover:text-rose-400 p-1"
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${
                        game.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                  </button>
                </td>

                {/* Thumb */}
                <td className="py-2 px-3">
                  <GameCoverArt game={game} size="thumb" />
                </td>

                {/* Title */}
                <td className="py-2 px-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-400">{game.code}</span>
                      <span className="font-serif text-neutral-200 font-semibold">
                        {game.titleKanji}
                      </span>
                    </div>
                    <span className="text-neutral-400 text-[11px]">{game.titleEnglish}</span>
                  </div>
                </td>

                {/* Engine */}
                <td className="py-2 px-3 text-neutral-400 hidden md:table-cell">
                  <span className="font-mono text-[11px]">{getEngineName(game)}</span>
                </td>

                {/* Status */}
                <td className="py-2 px-3">
                  {isRunning ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold font-mono text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      En Ejecución
                    </span>
                  ) : game.installed ? (
                    <span className="inline-flex items-center gap-1 text-emerald-300 text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Listo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-neutral-500 text-[11px]">
                      <CircleDashed className="h-3.5 w-3.5" />
                      No instalado
                    </span>
                  )}
                </td>

                {/* Playtime */}
                <td className="py-2 px-3 text-neutral-300 font-mono hidden sm:table-cell">
                  {game.installed ? formatPlaytime(game.playTimeMinutes) : '—'}
                </td>

                {/* High score */}
                <td className="py-2 px-3 text-amber-400/90 font-mono hidden lg:table-cell">
                  {game.highScore > 0 ? formatScore(game.highScore) : '—'}
                </td>

                {/* Action button */}
                <td className="py-2 px-3 text-right">
                  {isRunning ? (
                    <span className="text-xs font-mono text-emerald-400">Jugando...</span>
                  ) : game.installed ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLaunchGame(game);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 text-xs font-semibold shadow transition-all active:scale-95"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Jugar</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInstallPrompt(game);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 text-xs transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span>Instalar</span>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
