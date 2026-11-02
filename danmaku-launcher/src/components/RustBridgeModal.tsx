import { useState, useMemo } from 'react';
import { Terminal, Copy, Check, Trash2, ShieldCheck, CheckCircle2, AlertCircle, Cpu, HardDrive, Tv } from 'lucide-react';
import type { RustIpcLog } from '../types/touhou.ts';

interface RustBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ipcLogs: RustIpcLog[];
  onTriggerTestIpc?: (commandName: string) => void;
  onClearLogs?: () => void;
}

export default function RustBridgeModal({
  isOpen,
  onClose,
  ipcLogs,
  onClearLogs,
}: RustBridgeModalProps) {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'launch' | 'config' | 'install' | 'reaper'>('all');

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return ipcLogs;
    if (filter === 'launch') return ipcLogs.filter((l) => l.command.includes('launch'));
    if (filter === 'config') return ipcLogs.filter((l) => l.command.includes('config') || l.command.includes('cfg'));
    if (filter === 'install') return ipcLogs.filter((l) => l.command.includes('install') || l.command.includes('scan') || l.command.includes('extract') || l.command.includes('archive'));
    if (filter === 'reaper') return ipcLogs.filter((l) => l.command.includes('reaper') || l.command.includes('kill'));
    return ipcLogs;
  }, [ipcLogs, filter]);

  if (!isOpen) return null;

  const handleCopyAll = () => {
    const text = ipcLogs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.command}] (status: ${l.status})\nPayload: ${JSON.stringify(
            l.payload
          )}\nResponse: ${JSON.stringify(l.response)}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/90">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <span>Consola del Sistema y Registro de Actividad</span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/80">
                  En Vivo
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Monitoreo de comandos de bajo nivel: Wine, Gamescope FSR, Parches THCrap y llamadas al sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* System Diagnostics Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-2.5 bg-neutral-950/60 border-b border-neutral-800/80 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-neutral-300">
            <Cpu className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-neutral-500">Motor:</span>
            <span className="text-rose-300 font-semibold truncate">Rust Engine (CLI)</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <Tv className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-neutral-500">Video:</span>
            <span className="text-sky-300 truncate">Gamescope FSR</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-neutral-500">Wine:</span>
            <span className="text-emerald-300 truncate">WINEPREFIX=./pfx</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <HardDrive className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-neutral-500">Shift-JIS:</span>
            <span className="text-amber-300 truncate">Anti-Mojibake OK</span>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-400 mr-1">Filtrar:</span>
            {(['all', 'launch', 'config', 'install', 'reaper'] as const).map((key) => {
              const labels: Record<typeof key, string> = {
                all: 'Todos',
                launch: 'Lanzamiento',
                config: 'Configuración',
                install: 'Instalación/Scan',
                reaper: 'Reaper/Procesos',
              };
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors ${
                    filter === key
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {onClearLogs && (
              <button
                onClick={onClearLogs}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1 text-[11px] text-neutral-300 hover:bg-neutral-700 transition-colors"
                title="Limpiar registros de la sesión"
              >
                <Trash2 className="h-3 w-3 text-neutral-400" />
                <span>Limpiar</span>
              </button>
            )}
            <button
              onClick={handleCopyAll}
              disabled={ipcLogs.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-3 py-1 text-[11px] font-semibold transition-colors shadow"
              title="Copiar todos los registros al portapapeles"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copiado' : 'Copiar Registros'}</span>
            </button>
          </div>
        </div>

        {/* Live Terminal Log Stream */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-black/80 space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 space-y-2">
              <Terminal className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-sm font-semibold text-neutral-400">Consola a la espera de actividad</p>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Los eventos de ejecución con Wine, cambios de configuración binaria (.cfg), escaneo de descargas y limpieza de procesos zombies aparecerán aquí en tiempo real.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isError = log.status === 'error';
              const isRunning = log.status === 'running';

              return (
                <div
                  key={log.id}
                  className={`rounded-lg border p-3 space-y-1.5 transition-colors ${
                    isError
                      ? 'border-rose-900/60 bg-rose-950/20 text-rose-200'
                      : isRunning
                      ? 'border-amber-900/60 bg-amber-950/20 text-amber-200'
                      : 'border-neutral-800/90 bg-neutral-950/70 text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-400 bg-neutral-900 border border-neutral-700/80 px-1.5 py-0.5 rounded">
                        {log.command}
                      </span>
                      <span className="text-neutral-500">{log.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      {isError ? (
                        <span className="flex items-center gap-1 text-rose-400 font-bold">
                          <AlertCircle className="h-3 w-3" /> Error
                        </span>
                      ) : isRunning ? (
                        <span className="flex items-center gap-1 text-amber-400 font-bold animate-pulse">
                          Ejecutando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Éxito
                        </span>
                      )}
                    </div>
                  </div>

                  {log.payload && Object.keys(log.payload).length > 0 && (
                    <div className="rounded bg-black/50 p-2 text-[11px] text-neutral-300 overflow-x-auto">
                      <span className="text-neutral-500 block mb-0.5">// Parámetros:</span>
                      <pre className="text-neutral-200">{JSON.stringify(log.payload, null, 2)}</pre>
                    </div>
                  )}

                  {log.response && Object.keys(log.response).length > 0 && (
                    <div className="rounded bg-black/40 p-2 text-[11px] text-neutral-400 overflow-x-auto">
                      <span className="text-neutral-500 block mb-0.5">// Salida del motor:</span>
                      <pre className="text-emerald-300/90">{JSON.stringify(log.response, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950/90 px-6 py-3">
          <span className="text-[11px] text-neutral-400 font-mono">
            {ipcLogs.length} {ipcLogs.length === 1 ? 'evento registrado' : 'eventos registrados'}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-1.5 text-xs font-semibold transition-colors"
          >
            Cerrar Consola
          </button>
        </div>
      </div>
    </div>
  );
}
