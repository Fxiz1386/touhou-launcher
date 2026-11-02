import { useState, useEffect } from 'react';
import { X, Archive, Sparkles, CheckCircle2, ShieldCheck, FolderOpen, AlertCircle } from 'lucide-react';
import type { TouhouGame, BackendDetectedZip, RustIpcLog } from '../types/touhou.ts';

interface ZipInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameInstalled: (gameCode: string) => void;
  availableGames: TouhouGame[];
  onAddLog?: (
    command: string,
    payload: Record<string, unknown>,
    response: Record<string, unknown>,
    status?: 'success' | 'running' | 'error'
  ) => string;
  onUpdateLog?: (
    id: string,
    updates: Partial<Pick<RustIpcLog, 'response' | 'status' | 'payload'>>
  ) => void;
}

export default function ZipInstallerModal({
  isOpen,
  onClose,
  onGameInstalled,
  availableGames,
  onAddLog,
  onUpdateLog,
}: ZipInstallerModalProps) {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [detectedDownloads, setDetectedDownloads] = useState<BackendDetectedZip[]>([]);
  const [installStep, setInstallStep] = useState<'idle' | 'extracting' | 'completed' | 'error'>('idle');
  const [detectedGame, setDetectedGame] = useState<string>('TH12');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scan downloads when modal opens
  useEffect(() => {
    if (isOpen && window.danmakuAPI) {
      window.danmakuAPI.scanDownloads().then((zips) => {
        if (zips && zips.length > 0) {
          setDetectedDownloads(zips);
          if (!selectedPath) {
            setSelectedPath(zips[0].path);
            setSelectedFileName(zips[0].fileName);
            if (zips[0].gameId) setDetectedGame(zips[0].gameId);
          }
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const guessGameFromFilename = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.includes('th12') || lower.includes('ufo')) return 'TH12';
    if (lower.includes('th06') || lower.includes('eosd') || lower.includes('koumakyou')) return 'TH06';
    if (lower.includes('th07') || lower.includes('pcb') || lower.includes('youyoumu')) return 'TH07';
    if (lower.includes('th08') || lower.includes('in') || lower.includes('eiyashou')) return 'TH08';
    if (lower.includes('th09') || lower.includes('pofv') || lower.includes('kaeizuka')) return 'TH09';
    if (lower.includes('th10') || lower.includes('mof') || lower.includes('fuujinroku')) return 'TH10';
    if (lower.includes('th11') || lower.includes('sa') || lower.includes('subterranean')) return 'TH11';
    if (lower.includes('th13') || lower.includes('td') || lower.includes('ten desires')) return 'TH13';
    if (lower.includes('th14') || lower.includes('ddc')) return 'TH14';
    if (lower.includes('th15') || lower.includes('lolk')) return 'TH15';
    if (lower.includes('th16') || lower.includes('hsifs')) return 'TH16';
    if (lower.includes('th17') || lower.includes('wbawc')) return 'TH17';
    if (lower.includes('th18') || lower.includes('um')) return 'TH18';
    return 'Touhou';
  };

  const handlePickFile = async () => {
    if (!window.danmakuAPI) return;
    try {
      const picked = await window.danmakuAPI.pickZipFile();
      if (picked) {
        setSelectedPath(picked);
        const name = picked.split('/').pop() || picked;
        setSelectedFileName(name);
        setDetectedGame(guessGameFromFilename(name));
      }
    } catch (e) {
      console.error('Failed to pick zip file:', e);
    }
  };

  const handleStartInstall = async () => {
    if (!selectedPath) {
      await handlePickFile();
      return;
    }

    setInstallStep('extracting');
    setErrorMessage(null);

    const fileName = selectedFileName || selectedPath.split('/').pop() || selectedPath;
    const logId = onAddLog?.(
      'extract_archive:start',
      {
        archive_path: selectedPath,
        file_name: fileName,
        detected_target: detectedGame,
        extractor: '7z / Native Rust',
      },
      {
        status: 'extracting',
        message: `Descomprimiendo y procesando archivo ${fileName}...`,
      },
      'running'
    );

    if (window.danmakuAPI) {
      try {
        const res = await window.danmakuAPI.installZip(selectedPath);
        if (res.success) {
          const gameCode = res.game_id || detectedGame;
          setDetectedGame(gameCode);
          setInstallStep('completed');

          if (logId && onUpdateLog) {
            onUpdateLog(logId, {
              status: 'success',
              response: {
                status: 'extracted',
                files_extracted: res.files_extracted,
                game_id: res.game_id,
                game_name: res.game_name,
              },
            });
          }

          onAddLog?.(
            'install_game:success',
            {
              game_id: res.game_id || gameCode,
              game_name: res.game_name || detectedGame,
              target_dir: `games/${res.game_id || gameCode}`,
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

          onGameInstalled(gameCode);
        } else {
          setInstallStep('error');
          setErrorMessage(res.error || 'Error al descomprimir el archivo.');

          if (logId && onUpdateLog) {
            onUpdateLog(logId, {
              status: 'error',
              response: { error: res.error },
            });
          }

          onAddLog?.(
            'install_game:error',
            { archive_path: selectedPath },
            { error: res.error || 'Fallo durante la extracción del archivo' },
            'error'
          );
        }
      } catch (err) {
        setInstallStep('error');
        setErrorMessage(String(err));

        if (logId && onUpdateLog) {
          onUpdateLog(logId, {
            status: 'error',
            response: { error: String(err) },
          });
        }

        onAddLog?.(
          'install_game:error',
          { archive_path: selectedPath },
          { error: String(err) },
          'error'
        );
      }
    } else {
      // Mock for browser dev environment
      setTimeout(() => {
        setInstallStep('completed');
        if (logId && onUpdateLog) {
          onUpdateLog(logId, {
            status: 'success',
            response: { status: 'mock_extracted', files_extracted: 25 },
          });
        }
        onGameInstalled(detectedGame);
      }, 1500);
    }
  };

  const resetAndClose = () => {
    setInstallStep('idle');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600/20 text-rose-400">
              <Archive className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Instalador de Archivos (.ZIP / .7z / .RAR)
              </h3>
              <p className="text-[11px] text-neutral-400">
                Detección inteligente de juegos y desofuscación Shift-JIS en Linux
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {installStep === 'idle' && (
            <>
              {/* File selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-200">
                  Archivo comprimido a instalar (.ZIP, .7z, .RAR):
                </label>
                
                {detectedDownloads.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[11px] text-neutral-400 mb-1 block">Encontrado en ~/Descargas:</span>
                    <div className="space-y-1">
                      {detectedDownloads.map((d) => (
                        <button
                          key={d.path}
                          onClick={() => {
                            setSelectedPath(d.path);
                            setSelectedFileName(d.fileName);
                            if (d.gameId) setDetectedGame(d.gameId);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                            selectedPath === d.path
                              ? 'border-rose-500 bg-rose-950/40 text-rose-200'
                              : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          <span className="font-mono truncate">{d.fileName}</span>
                          <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded ml-2 shrink-0">
                            {d.gameId || 'Detectado'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 truncate font-mono">
                    {selectedFileName || 'Ningún archivo seleccionado'}
                  </div>
                  <button
                    onClick={handlePickFile}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors shrink-0"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Examinar...</span>
                  </button>
                </div>
              </div>

              {/* Japanese Shift-JIS fix toggle */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Corrección de Codificación Shift-JIS (Anti-Mojibake)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 border border-emerald-800/80 text-emerald-400 px-2 py-0.5 rounded font-medium">
                    Automático
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Evita que los nombres japoneses de pistas de audio y ejecutables se extraigan con caracteres rotos/corruptos (<code className="text-rose-300">mojibake</code>) en Linux.
                </p>
              </div>

              {/* Destination folder */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-300">
                <span className="text-neutral-500">Destino de instalación:</span>
                <p className="font-mono text-rose-300 mt-0.5">games/{detectedGame.toLowerCase()}/</p>
              </div>
            </>
          )}

          {installStep === 'extracting' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-10 w-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-neutral-200">
                Extrayendo y desofuscando Shift-JIS...
              </p>
              <p className="text-xs text-emerald-400 font-mono">
                Reparando nombres de archivos japoneses · Creando prefijo Wine · Aplicando parches
              </p>
            </div>
          )}

          {installStep === 'completed' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-neutral-100">
                ¡Juego instalado con éxito!
              </h4>
              <p className="text-xs text-neutral-300 max-w-sm">
                Se detectó e instaló <strong className="text-rose-300">{detectedGame}</strong> con soporte para 60 FPS, prefijo Wine y parches en caliente.
              </p>
            </div>
          )}

          {installStep === 'error' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-neutral-100">
                Error en la instalación
              </h4>
              <p className="text-xs text-rose-300 max-w-sm font-mono break-all">
                {errorMessage || 'Ocurrió un error inesperado al procesar el archivo ZIP.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-800 bg-neutral-950/70 px-6 py-4">
          {installStep === 'completed' ? (
            <button
              onClick={resetAndClose}
              className="rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 text-xs font-semibold shadow transition-all"
            >
              Listo, Ver en Biblioteca
            </button>
          ) : installStep === 'error' ? (
            <>
              <button
                onClick={resetAndClose}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => setInstallStep('idle')}
                className="rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 text-xs font-semibold shadow transition-all"
              >
                Reintentar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={resetAndClose}
                disabled={installStep !== 'idle'}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStartInstall}
                disabled={installStep !== 'idle' || !selectedPath}
                className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 text-xs font-semibold shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Instalar Ahora</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
