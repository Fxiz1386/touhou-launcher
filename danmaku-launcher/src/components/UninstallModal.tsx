import { useState } from 'react';
import { X, Trash2, Shield, AlertTriangle } from 'lucide-react';
import type { TouhouGame } from '../types/touhou.ts';

interface UninstallModalProps {
  game: TouhouGame | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmUninstall: (gameId: string, keepSaves: boolean) => void;
}

export default function UninstallModal({
  game,
  isOpen,
  onClose,
  onConfirmUninstall,
}: UninstallModalProps) {
  const [keepSaves, setKeepSaves] = useState(true);

  if (!isOpen || !game) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/20 text-red-400">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Desinstalar {game.code}
              </h3>
              <p className="text-[11px] text-neutral-400">{game.titleEnglish}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-neutral-300 leading-relaxed">
            Estás a punto de desinstalar los archivos del juego de tu equipo para liberar espacio (aprox. 524 MB).
          </p>

          {/* Option: Keep saves vs full wipe */}
          <div className="space-y-2.5 pt-2">
            <label
              onClick={() => setKeepSaves(true)}
              className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                keepSaves
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'border-neutral-800 bg-neutral-950'
              }`}
            >
              <input
                type="radio"
                name="uninstall_choice"
                checked={keepSaves}
                onChange={() => setKeepSaves(true)}
                className="mt-0.5 accent-emerald-500"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-neutral-100 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  Conservar partidas y replays (Recomendado)
                </span>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Mantiene tus récords, puntuaciones altas y archivos <code className="text-rose-300">.rpy</code> en <code className="text-neutral-300">~/.local/share/touhou/saves/</code> para cuando reinstales el juego.
                </p>
              </div>
            </label>

            <label
              onClick={() => setKeepSaves(false)}
              className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                !keepSaves
                  ? 'border-red-500/50 bg-red-950/20'
                  : 'border-neutral-800 bg-neutral-950'
              }`}
            >
              <input
                type="radio"
                name="uninstall_choice"
                checked={!keepSaves}
                onChange={() => setKeepSaves(false)}
                className="mt-0.5 accent-red-500"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-neutral-100 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  Borrado total (Eliminar partidas y replays)
                </span>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Elimina todos los archivos del juego, saves y configuraciones sin dejar rastro en disco.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-800 bg-neutral-950/70 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirmUninstall(game.id, keepSaves);
              onClose();
            }}
            className="flex items-center gap-2 rounded-lg bg-red-700 hover:bg-red-600 text-white px-5 py-2 text-xs font-semibold shadow transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Confirmar Desinstalación</span>
          </button>
        </div>
      </div>
    </div>
  );
}
