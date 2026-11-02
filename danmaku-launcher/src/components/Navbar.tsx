import { Gamepad2, Sparkles, Terminal, Music, FolderArchive, Play, Flame, Palette, Sun, Moon, Clock } from 'lucide-react';
import type { DanmakuMode } from './DanmakuCanvas.tsx';
import type { ThemeMode, EffectiveTheme } from '../utils/themeLogic.ts';

interface NavbarProps {
  currentTab: 'library' | 'music' | 'rust_bridge';
  onSelectTab: (tab: 'library' | 'music' | 'rust_bridge') => void;
  onOpenZipInstaller: () => void;
  onOpenGamepadHelp: () => void;
  gamepadConnected: boolean;
  danmakuMode: DanmakuMode;
  onToggleDanmaku: () => void;
  onQuickLaunch: () => void;
  quickLaunchGameName: string;
  themeMode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  onOpenThemeSelector: () => void;
}

export default function Navbar({
  currentTab,
  onSelectTab,
  onOpenZipInstaller,
  onOpenGamepadHelp,
  gamepadConnected,
  danmakuMode,
  onToggleDanmaku,
  onQuickLaunch,
  quickLaunchGameName,
  themeMode,
  effectiveTheme,
  onOpenThemeSelector,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-8 border-b border-neutral-800 bg-neutral-950/85 px-6 backdrop-blur-md">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onSelectTab('library')}
          className="group flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-600 to-red-800 text-white shadow-md shadow-rose-900/30 ring-1 ring-rose-400/30 group-hover:scale-105 transition-transform">
            <Flame className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-base font-bold tracking-tight text-neutral-100 whitespace-nowrap">
              DANMAKU LAUNCHER
            </span>
            <span className="text-[10px] font-mono text-neutral-400 -mt-1 tracking-wider uppercase">
              東方PROJECT · RUST CORE
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation links */}
      <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => onSelectTab('library')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            currentTab === 'library'
              ? 'text-rose-400 border-b-2 border-rose-500 font-semibold'
              : 'text-neutral-300 hover:text-white'
          }`}
        >
          <span>Biblioteca</span>
        </button>

        <button
          onClick={() => onSelectTab('music')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            currentTab === 'music'
              ? 'text-rose-400 border-b-2 border-rose-500 font-semibold'
              : 'text-neutral-300 hover:text-white'
          }`}
        >
          <Music className="h-4 w-4" />
          <span>Música ZUN</span>
        </button>

        <button
          onClick={onOpenZipInstaller}
          className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors whitespace-nowrap py-1"
        >
          <FolderArchive className="h-4 w-4" />
          <span>Instalar ZIP</span>
        </button>

        <button
          onClick={() => onSelectTab('rust_bridge')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            currentTab === 'rust_bridge'
              ? 'text-rose-400 border-b-2 border-rose-500 font-semibold'
              : 'text-neutral-300 hover:text-white'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>Consola de Registros</span>
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action + Utility Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Theme mode button */}
        <button
          onClick={onOpenThemeSelector}
          title={`Tema: ${themeMode === 'auto' ? `Automático (${effectiveTheme})` : themeMode}`}
          aria-label="Cambiar tema de la interfaz"
          className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:text-neutral-200 px-2.5 py-1.5 text-xs text-neutral-400 transition-colors"
        >
          {themeMode === 'auto' ? (
            <Clock className="h-3.5 w-3.5 text-sky-400" />
          ) : effectiveTheme === 'zun_pastel' ? (
            <Palette className="h-3.5 w-3.5 text-pink-400" />
          ) : effectiveTheme === 'light' ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-rose-400" />
          )}
          <span className="hidden lg:inline text-[11px] font-medium">
            {themeMode === 'auto'
              ? `Auto: ${effectiveTheme === 'zun_pastel' ? 'Pastel' : 'Noche'}`
              : effectiveTheme === 'zun_pastel'
              ? 'ZUN Pastel'
              : effectiveTheme === 'light'
              ? 'Diurno'
              : 'Noche'}
          </span>
        </button>

        {/* Gamepad status indicator */}
        <button
          onClick={onOpenGamepadHelp}
          title={gamepadConnected ? 'Mando conectado (Haz clic para ver mapa de botones)' : 'Conecta un mando o pulsa para ver teclas'}
          aria-label="Estado del mando y controles"
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
            gamepadConnected
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
              : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Gamepad2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-mono">{gamepadConnected ? 'Mando' : 'Mando'}</span>
        </button>

        {/* Danmaku particle toggle */}
        <button
          onClick={onToggleDanmaku}
          title={`Efectos Danmaku: ${danmakuMode}`}
          aria-label={`Cambiar modo de partículas Danmaku, actual: ${danmakuMode}`}
          className={`rounded-lg border p-1.5 text-xs transition-colors ${
            danmakuMode !== 'off'
              ? 'border-rose-500/40 bg-rose-950/30 text-rose-300'
              : 'border-neutral-800 bg-neutral-900/60 text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Sparkles className="h-4 w-4" />
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onQuickLaunch}
          className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white px-4 py-2 text-xs font-semibold shadow-md shadow-rose-950/40 transition-all whitespace-nowrap"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Jugar {quickLaunchGameName}</span>
        </button>
      </div>
    </header>
  );
}
