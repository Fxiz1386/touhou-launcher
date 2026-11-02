import { Sun, Moon, Palette, Clock, Check, X, Sparkles } from 'lucide-react';
import { THEME_OPTIONS, type ThemeMode, type EffectiveTheme, getAutoThemeReason } from '../utils/themeLogic.ts';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  onSelectMode: (mode: ThemeMode) => void;
}

export default function ThemeSelectorModal({
  isOpen,
  onClose,
  currentMode,
  effectiveTheme,
  onSelectMode,
}: ThemeSelectorModalProps) {
  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'sun':
        return <Sun className="h-4 w-4 text-amber-500" />;
      case 'moon':
        return <Moon className="h-4 w-4 text-rose-400" />;
      case 'palette':
        return <Palette className="h-4 w-4 text-pink-500" />;
      case 'clock':
      default:
        return <Clock className="h-4 w-4 text-sky-400" />;
    }
  };

  const autoReason = getAutoThemeReason();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600/20 text-rose-400">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Ergonomía Visual & Paleta de Colores
              </h3>
              <p className="text-[11px] text-neutral-400">
                Adaptación dinámica según la hora local o selección manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar selector de temas"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Dynamic Auto Status Card */}
          {currentMode === 'auto' && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-950/30 p-3.5 space-y-1 text-sky-200">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Modo Automático Sincronizado</span>
              </div>
              <p className="text-[11px] text-sky-200/90 leading-relaxed font-sans">
                {autoReason}
              </p>
            </div>
          )}

          {/* Theme Options */}
          <div className="space-y-2.5">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = currentMode === theme.id;
              const isEffective = isSelected || (currentMode === 'auto' && effectiveTheme === theme.id);

              return (
                <div
                  key={theme.id}
                  onClick={() => onSelectMode(theme.id)}
                  className={`flex flex-col gap-2 rounded-xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-rose-500 bg-rose-950/25 ring-1 ring-rose-500/40 shadow-md'
                      : 'border-neutral-800 bg-neutral-950/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-neutral-800/80 p-2">
                        {getIcon(theme.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-100 text-xs">
                            {theme.name}
                          </span>
                          {currentMode === 'auto' && theme.id === effectiveTheme && (
                            <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-500/30">
                              Activo por hora local
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                          {theme.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Color Swatch Preview Strip */}
                  <div className="mt-1 flex items-center gap-1.5 pl-11">
                    <span className="text-[10px] text-neutral-500 font-mono mr-1">Muestras:</span>
                    {theme.previewColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="h-3.5 w-8 rounded-full border border-white/20 shadow-xs"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 bg-neutral-950/70 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-1.5 text-xs font-medium transition-colors"
          >
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
