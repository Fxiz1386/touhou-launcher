import { Search, LayoutGrid, List, Heart, CheckCircle2 } from 'lucide-react';
import type { TouhouEra } from '../types/touhou.ts';
import type { SortMode } from '../utils/launcherLogic.ts';

interface LibraryToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedEra: TouhouEra;
  onSelectEra: (era: TouhouEra) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  onlyInstalled: boolean;
  onToggleOnlyInstalled: () => void;
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalGamesCount: number;
  installedCount: number;
}

export default function LibraryToolbar({
  searchQuery,
  onSearchChange,
  selectedEra,
  onSelectEra,
  sortMode,
  onSortModeChange,
  onlyInstalled,
  onToggleOnlyInstalled,
  onlyFavorites,
  onToggleOnlyFavorites,
  viewMode,
  onViewModeChange,
  totalGamesCount,
  installedCount,
}: LibraryToolbarProps) {
  const eras: { id: TouhouEra; label: string }[] = [
    { id: 'all', label: 'Todos los Juegos' },
    { id: 'windows_classic', label: 'Windows Clásico (TH06–12)' },
    { id: 'windows_modern', label: 'Windows Moderno (TH13–20)' },
    { id: 'fighting', label: 'Lucha & Spin-offs' },
    { id: 'pc98', label: 'PC-98 (Retro)' },
  ];

  return (
    <div className="space-y-3.5 px-6 py-2">
      {/* Top search & sorting row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por código (TH06), título o personaje..."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/80 pl-9 pr-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        {/* Filters and View controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick toggle: Installed only */}
          <button
            onClick={onToggleOnlyInstalled}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              onlyInstalled
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Instalados ({installedCount})</span>
          </button>

          {/* Quick toggle: Favorites */}
          <button
            onClick={onToggleOnlyFavorites}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              onlyFavorites
                ? 'border-rose-500/50 bg-rose-950/40 text-rose-300'
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
            <span>Favoritos</span>
          </button>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-xs text-neutral-300">
            <span className="text-neutral-500">Ordenar:</span>
            <select
              value={sortMode}
              onChange={(e) => onSortModeChange(e.target.value as SortMode)}
              className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="number" className="bg-neutral-900 text-neutral-200">
                Saga oficial (Nº)
              </option>
              <option value="playtime" className="bg-neutral-900 text-neutral-200">
                Tiempo jugado
              </option>
              <option value="highscore" className="bg-neutral-900 text-neutral-200">
                Puntuación récord
              </option>
              <option value="title" className="bg-neutral-900 text-neutral-200">
                Nombre de juego
              </option>
              <option value="release" className="bg-neutral-900 text-neutral-200">
                Año de lanzamiento
              </option>
            </select>
          </div>

          {/* View mode toggle (Grid vs List) */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900/80 p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              title="Vista de cuadrícula con carátulas 340×500"
              aria-label="Vista de cuadrícula"
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-rose-600/30 text-rose-300'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              title="Vista de lista compacta"
              aria-label="Vista de lista"
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-rose-600/30 text-rose-300'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Era tabs row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-800/60 scrollbar-none">
        {eras.map((era) => {
          const isActive = selectedEra === era.id;
          return (
            <button
              key={era.id}
              onClick={() => onSelectEra(era.id)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-neutral-800 text-rose-400 font-semibold shadow-sm ring-1 ring-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
              }`}
            >
              {era.label}
            </button>
          );
        })}
        <div className="ml-auto text-xs text-neutral-500 whitespace-nowrap pl-3">
          Mostrando {totalGamesCount} títulos
        </div>
      </div>
    </div>
  );
}
