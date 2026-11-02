import { Gamepad2, Keyboard, X, CheckCircle2 } from 'lucide-react';

interface GamepadHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamepadConnected: boolean;
  gamepadName?: string;
}

export default function GamepadHelpModal({
  isOpen,
  onClose,
  gamepadConnected,
  gamepadName,
}: GamepadHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Navegación con Mando & Teclado
              </h3>
              <p className="text-[11px] text-neutral-400">
                Control completo de la interfaz para Steam Deck, sofá y escritorio
              </p>
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
        <div className="p-6 space-y-5 text-xs">
          {/* Gamepad connection status */}
          <div
            className={`flex items-center justify-between rounded-xl p-3.5 border ${
              gamepadConnected
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Gamepad2 className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="font-semibold text-neutral-200">
                  {gamepadConnected ? 'Mando Detectado' : 'Sin Mando Detectado'}
                </p>
                <p className="text-[11px] text-neutral-400 font-mono">
                  {gamepadName || 'Conecta un mando USB o Bluetooth (Xbox / DualSense / Steam Deck)'}
                </p>
              </div>
            </div>
            {gamepadConnected && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
          </div>

          {/* Mappings */}
          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-200 flex items-center gap-2">
              <Gamepad2 className="h-3.5 w-3.5 text-rose-400" />
              Controles en el Launcher
            </h4>
            <div className="divide-y divide-neutral-800/80 rounded-xl border border-neutral-800 bg-neutral-950/80 text-neutral-300">
              <div className="flex items-center justify-between p-2.5">
                <span>Navegar entre juegos</span>
                <span className="font-mono text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded">D-Pad / Stick Izquierdo / Flechas</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span>Seleccionar / Jugar Juego</span>
                <span className="font-mono text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded">Botón A / Cruz / Enter</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span>Volver / Cerrar Modal</span>
                <span className="font-mono text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded">Botón B / Círculo / Escape</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span>Cambiar de Pestaña</span>
                <span className="font-mono text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded">LB / RB / Tab</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span>Marcar como Favorito</span>
                <span className="font-mono text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded">Botón Y / Triángulo / F</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-200 flex items-center gap-2">
              <Keyboard className="h-3.5 w-3.5 text-sky-400" />
              Mapeo Inyectado dentro del Juego (STG)
            </h4>
            <p className="text-neutral-400 text-[11px]">
              El hook del launcher inyecta soporte directo sin necesidad de programas externos (AntiMicroX o Steam Input):
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="rounded bg-neutral-950 p-2 border border-neutral-800 text-neutral-300">
                <span className="text-rose-400 font-bold">Disparo:</span> Botón A / Z / J
              </div>
              <div className="rounded bg-neutral-950 p-2 border border-neutral-800 text-neutral-300">
                <span className="text-sky-400 font-bold">Spell Card:</span> Botón B / X / K
              </div>
              <div className="rounded bg-neutral-950 p-2 border border-neutral-800 text-neutral-300">
                <span className="text-amber-400 font-bold">Modo Focus:</span> RT / Shift / L
              </div>
              <div className="rounded bg-neutral-950 p-2 border border-neutral-800 text-neutral-300">
                <span className="text-emerald-400 font-bold">Pausa:</span> Start / Escape
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 bg-neutral-950/70 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-1.5 text-xs font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
