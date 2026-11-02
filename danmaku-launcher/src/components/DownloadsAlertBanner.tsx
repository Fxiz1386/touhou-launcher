import { Archive, Sparkles, X, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface DownloadsAlertBannerProps {
  fileName: string;
  detectedGameCode: string;
  detectedGameTitle: string;
  fileSize: string;
  onInstall: () => void | Promise<void>;
}

export default function DownloadsAlertBanner({
  fileName,
  detectedGameCode,
  detectedGameTitle,
  fileSize,
  onInstall,
}: DownloadsAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (dismissed) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await onInstall();
      setInstalledSuccess(true);
      setTimeout(() => {
        setDismissed(true);
      }, 2000);
    } catch (e) {
      console.error('Error during auto-install:', e);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Aviso de archivo detectado en Descargas"
      className="relative z-10 mx-6 mb-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-950/70 via-neutral-900/90 to-neutral-900/90 p-4 shadow-lg backdrop-blur-md"
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
          <Archive className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-rose-400 tracking-wide">
              DETECCIÓN AUTOMÁTICA EN ~/DESCARGAS
            </span>
            <span className="text-xs text-neutral-400">· {fileSize}</span>
          </div>
          <p className="text-sm font-medium text-neutral-100">
            Se ha detectado <span className="font-mono text-rose-300">{fileName}</span> ({detectedGameCode}: {detectedGameTitle})
          </p>
          <p className="text-xs text-neutral-400">
            Listo para extraer con corrección de codificación Shift-JIS en <code className="text-neutral-300 font-mono">games/{detectedGameCode.toLowerCase()}/</code>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        {installedSuccess ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 py-2 px-3">
            <CheckCircle className="h-4 w-4" />
            <span>¡Instalado correctamente!</span>
          </div>
        ) : (
          <>
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{installing ? 'Extrayendo (Shift-JIS)...' : 'Instalar con 1 Clic'}</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Cerrar aviso de descarga"
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
