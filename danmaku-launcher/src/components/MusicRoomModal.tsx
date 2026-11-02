import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
  X,
  Disc3,
  Download,
  FolderArchive,
  Search,
  Shuffle,
  Repeat,
  RefreshCw,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  MUSIC_ROOM_GAMES,
  TOUHOU_MUSIC_CATALOG,
  type MusicRoomGame,
} from '../data/touhouMusicData.ts';
import type {
  TouhouMusicTrack,
  DetectedMusicArchive,
  MusicLibraryStatus,
  RustIpcLog,
} from '../types/touhou.ts';
import { formatMusicTimer } from '../utils/launcherLogic.ts';

interface MusicRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGameId?: string;
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

export default function MusicRoomModal({
  isOpen,
  onClose,
  initialGameId = 'th06',
  onAddLog,
  onUpdateLog,
}: MusicRoomModalProps) {
  const [selectedGameId, setSelectedGameId] = useState<string>(initialGameId);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('danmaku_music_volume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [libraryStatus, setLibraryStatus] = useState<MusicLibraryStatus | null>(null);
  const [detectedArchives, setDetectedArchives] = useState<DetectedMusicArchive[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Selected game object
  const currentGame: MusicRoomGame = useMemo(() => {
    return MUSIC_ROOM_GAMES.find((g) => g.id === selectedGameId) || MUSIC_ROOM_GAMES[0];
  }, [selectedGameId]);

  // Load local music library status and scan downloads
  const loadLibrary = useCallback(async (gameId: string) => {
    if (!window.danmakuAPI) return;
    try {
      const status = await window.danmakuAPI.getMusicLibrary(gameId);
      setLibraryStatus(status);
      const archives = await window.danmakuAPI.scanMusicDownloads();
      setDetectedArchives(archives);
    } catch (e) {
      console.warn('Failed to load music library:', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadLibrary(selectedGameId);
    }
  }, [isOpen, selectedGameId, loadLibrary]);

  // Sync initialGameId when opened
  useEffect(() => {
    if (initialGameId && MUSIC_ROOM_GAMES.some((g) => g.id === initialGameId)) {
      setSelectedGameId(initialGameId);
      setSelectedTrackIndex(0);
    }
  }, [initialGameId]);

  // Base catalog tracks for current game
  const rawCatalogTracks: TouhouMusicTrack[] = useMemo(() => {
    return TOUHOU_MUSIC_CATALOG[selectedGameId] || [];
  }, [selectedGameId]);

  // Merge catalog tracks with local audio files
  const catalogTracks: TouhouMusicTrack[] = useMemo(() => {
    if (!libraryStatus || libraryStatus.audioFiles.length === 0) {
      return rawCatalogTracks;
    }

    const availableFiles = [...libraryStatus.audioFiles];

    return rawCatalogTracks.map((track) => {
      // Find matching audio file by track number or pattern
      const matched = availableFiles.find((f) => {
        const numMatch = f.filename.match(/^0*(\d+)/) || f.filename.match(/_(\d+)\./);
        if (numMatch && parseInt(numMatch[1], 10) === track.trackNumber) {
          return true;
        }
        if (track.fileNamePatterns) {
          return track.fileNamePatterns.some((pattern: string) =>
            f.filename.toLowerCase().includes(pattern.toLowerCase())
          );
        }
        return false;
      });

      if (matched) {
        return {
          ...track,
          audioPath: matched.path,
          audioFormat: matched.format as TouhouMusicTrack['audioFormat'],
        };
      }
      return track;
    });
  }, [rawCatalogTracks, libraryStatus]);

  // Filtered tracks by search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return catalogTracks;
    const q = searchQuery.toLowerCase();
    return catalogTracks.filter(
      (t) =>
        t.titleRomaji.toLowerCase().includes(q) ||
        t.titleEnglish.toLowerCase().includes(q) ||
        t.titleKanji.includes(q) ||
        t.stageOrRole.toLowerCase().includes(q)
    );
  }, [catalogTracks, searchQuery]);

  // Active track
  const currentTrack: TouhouMusicTrack | undefined = useMemo(() => {
    return catalogTracks[selectedTrackIndex] || catalogTracks[0];
  }, [catalogTracks, selectedTrackIndex]);

  // Detected archive for the currently selected game
  const gameArchive = useMemo(() => {
    return detectedArchives.find((a) => a.gameId === selectedGameId);
  }, [detectedArchives, selectedGameId]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem('danmaku_music_volume', String(volume));
  }, [volume, isMuted]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      if (Number.isFinite(cur)) {
        setCurrentTime(cur);
      }
      const dur = audioRef.current.duration;
      if (Number.isFinite(dur) && dur > 0 && (!Number.isFinite(duration) || duration <= 0)) {
        setDuration(dur);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (Number.isFinite(dur) && dur > 0) {
        setDuration(dur);
      } else if (dur === Infinity) {
        // Chromium workaround for OGG/Opus without early duration headers:
        // Briefly seek to a distant timestamp to trigger Chromium to resolve the duration
        const audio = audioRef.current;
        audio.currentTime = 1e101;
        audio.ontimeupdate = function () {
          audio.ontimeupdate = null;
          audio.currentTime = 0;
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
          }
        };
      }
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (!Number.isFinite(time)) return;
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack?.audioPath) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleNextTrack = useCallback(() => {
    if (catalogTracks.length === 0) return;
    setCurrentTime(0);
    setDuration(0);
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * catalogTracks.length);
      setSelectedTrackIndex(nextIdx);
    } else {
      setSelectedTrackIndex((prev) => (prev + 1) % catalogTracks.length);
    }
    setIsPlaying(true);
  }, [catalogTracks.length, isShuffle]);

  const handlePrevTrack = () => {
    if (catalogTracks.length === 0) return;
    setCurrentTime(0);
    setDuration(0);
    setSelectedTrackIndex((prev) => (prev - 1 + catalogTracks.length) % catalogTracks.length);
    setIsPlaying(true);
  };

  const handleSelectTrack = (index: number) => {
    setCurrentTime(0);
    setDuration(0);
    setSelectedTrackIndex(index);
    setIsPlaying(true);
  };

  // Change selected game
  const handleSelectGame = (gameId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setSelectedGameId(gameId);
    setSelectedTrackIndex(0);
    setCurrentTime(0);
  };

  // Handle auto-advance when track ends
  const handleTrackEnded = () => {
    if (isLooping && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      handleNextTrack();
    }
  };

  // Import detected music archive
  const handleImportDetectedArchive = async (archive: DetectedMusicArchive) => {
    if (!window.danmakuAPI) return;
    setIsImporting(true);
    setImportNotice(null);

    const logId = onAddLog?.(
      'extract_music_archive:start',
      {
        archive_path: archive.fullPath,
        file_name: archive.fileName,
        game_id: archive.gameId,
        game_title: archive.gameTitle,
        format: archive.format,
      },
      {
        status: 'extracting',
        message: `Extrayendo pistas de audio para ${archive.gameTitle}...`,
      },
      'running'
    );

    try {
      const res = await window.danmakuAPI.importMusicArchive({
        archivePath: archive.fullPath,
        gameId: archive.gameId,
      });
      if (res.success) {
        setImportNotice({
          type: 'success',
          message: `¡Se importaron ${res.filesExtracted || 0} pistas de audio para ${archive.gameTitle}!`,
        });

        if (logId && onUpdateLog) {
          onUpdateLog(logId, {
            status: 'success',
            response: {
              status: 'extracted',
              tracks_extracted: res.filesExtracted || 0,
            },
          });
        }

        onAddLog?.(
          'import_music:success',
          {
            game_id: archive.gameId,
            tracks_imported: res.filesExtracted || 0,
            target_dir: `music/${archive.gameId}`,
          },
          {
            status: 'ready',
            catalog_synced: true,
          },
          'success'
        );

        await loadLibrary(archive.gameId);
      } else {
        setImportNotice({
          type: 'error',
          message: res.error || 'Error extrayendo archivo de música.',
        });

        if (logId && onUpdateLog) {
          onUpdateLog(logId, {
            status: 'error',
            response: { error: res.error },
          });
        }

        onAddLog?.(
          'import_music:error',
          { archive_path: archive.fullPath, game_id: archive.gameId },
          { error: res.error || 'Error importando pistas de música' },
          'error'
        );
      }
    } catch (e) {
      setImportNotice({ type: 'error', message: String(e) });

      if (logId && onUpdateLog) {
        onUpdateLog(logId, {
          status: 'error',
          response: { error: String(e) },
        });
      }

      onAddLog?.(
        'import_music:error',
        { archive_path: archive.fullPath, game_id: archive.gameId },
        { error: String(e) },
        'error'
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Pick custom music archive
  const handlePickArchive = async () => {
    if (!window.danmakuAPI) return;
    try {
      const filePath = await window.danmakuAPI.pickMusicArchive();
      if (filePath) {
        await handleImportDetectedArchive({
          fileName: filePath.split('/').pop() || filePath,
          fullPath: filePath,
          size: 0,
          gameId: selectedGameId,
          gameTitle: currentGame.titleEnglish,
          format: 'ZIP',
        });
      }
    } catch (e) {
      console.warn('Pick archive error:', e);
    }
  };

  // Open external link
  const handleOpenExternal = (url: string) => {
    if (window.danmakuAPI?.openExternal) {
      window.danmakuAPI.openExternal(url);
    }
  };

  // Use formatMusicTimer for formatting audio seconds to mm:ss
  const formatTime = formatMusicTimer;

  // Determine album cover: custom extracted folder.jpg or official box cover
  const activeCoverSrc = useMemo(() => {
    if (libraryStatus?.coverImage) {
      return `danmaku-media://${libraryStatus.coverImage}`;
    }
    return currentGame.coverImage;
  }, [libraryStatus?.coverImage, currentGame.coverImage]);

  // Close and stop playback
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-fade-in">
      {/* Hidden audio element */}
      {currentTrack?.audioPath && (
        <audio
          ref={audioRef}
          src={`danmaku-media://${currentTrack.audioPath}`}
          autoPlay={isPlaying}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) {
              setDuration(d);
            }
          }}
          onEnded={handleTrackEnded}
        />
      )}

      <div className="relative w-full max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5 bg-neutral-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/30 text-rose-400 border border-rose-500/30 shadow-inner">
              <Music className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <span>上海アリス幻樂団 音楽室</span>
                  <span className="text-[11px] font-mono text-rose-400 font-semibold">ZUN Music Room & Catalog</span>
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400">
                Catálogo musical oficial de Touhou Project con comentarios e historia de ZUN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePickArchive}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 hover:text-white px-3 py-1.5 text-xs text-neutral-300 font-medium transition-colors"
              title="Selecciona un archivo .zip o .7z con canciones"
            >
              <FolderArchive className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Importar OST</span>
            </button>
            <button
              onClick={() => handleOpenExternal(currentGame.moriyaShrineUrl)}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-700/50 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-200 px-3 py-1.5 text-xs font-medium transition-colors"
              title="Descargar bandas sonoras en FLAC / OPUS desde Moriya Shrine"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Moriya Shrine OST</span>
              <ExternalLink className="h-3 w-3" />
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Game Navigation Carousel Bar */}
        <div className="border-b border-neutral-800/80 bg-neutral-950/60 px-4 py-2 shrink-0 overflow-x-auto scrollbar-none flex items-center gap-2">
          {MUSIC_ROOM_GAMES.map((game) => {
            const isSelected = game.id === selectedGameId;
            const hasArchiveInDownloads = detectedArchives.some((a) => a.gameId === game.id);
            return (
              <button
                key={game.id}
                onClick={() => handleSelectGame(game.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                  isSelected
                    ? 'bg-rose-950/80 border border-rose-500/50 text-white shadow-md'
                    : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="font-mono font-bold text-[11px] text-rose-400">{game.code}</span>
                <span className="truncate max-w-[120px]">{game.titleRomaji}</span>
                {hasArchiveInDownloads && !isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="OST disponible para importar en Descargas" />
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications / Import Banner */}
        {importNotice && (
          <div className={`px-5 py-2.5 text-xs font-medium flex items-center justify-between shrink-0 ${
            importNotice.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-b border-emerald-800' : 'bg-red-950/90 text-red-200 border-b border-red-800'
          }`}>
            <span>{importNotice.message}</span>
            <button onClick={() => setImportNotice(null)} className="hover:opacity-75">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Detected OST Archive in Downloads Banner */}
        {gameArchive && (!libraryStatus || libraryStatus.availableTracks === 0) && (
          <div className="bg-gradient-to-r from-emerald-950/90 via-neutral-900 to-emerald-950/90 border-b border-emerald-600/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-neutral-200">
                Se detectó el OST descargado de <strong>{gameArchive.gameTitle}</strong> en tu carpeta de Descargas (
                <span className="font-mono text-emerald-400 font-bold">{gameArchive.format}</span> - {(gameArchive.size / 1024 / 1024).toFixed(1)} MB).
              </span>
            </div>
            <button
              onClick={() => handleImportDetectedArchive(gameArchive)}
              disabled={isImporting}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 shadow transition-all active:scale-95 disabled:opacity-50"
            >
              {isImporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span>{isImporting ? 'Extrayendo pistas...' : 'Importar a la Sala de Música'}</span>
            </button>
          </div>
        )}

        {/* Middle Main Content Split: Left Tracklist & Right Story/Cover */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
          {/* Left Column: Tracklist (5 cols) */}
          <div className="md:col-span-5 border-r border-neutral-800/80 flex flex-col bg-neutral-950/40 overflow-hidden">
            {/* Search and Track Info Bar */}
            <div className="p-3 border-b border-neutral-800/80 flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar canción, jefe o fase..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500/60"
                />
              </div>
              <span className="text-[11px] font-mono text-neutral-400 shrink-0 px-1">
                {catalogTracks.filter((t) => t.audioPath).length}/{catalogTracks.length} OST
              </span>
            </div>

            {/* Track Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredTracks.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-xs">
                  No se encontraron canciones con ese criterio.
                </div>
              ) : (
                filteredTracks.map((t, idx) => {
                  const isCurrent = currentTrack?.id === t.id;
                  const hasAudio = !!t.audioPath;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTrack(catalogTracks.findIndex((item) => item.id === t.id))}
                      className={`w-full text-left rounded-xl p-2.5 flex items-center justify-between gap-3 transition-all group ${
                        isCurrent
                          ? 'bg-rose-950/70 border border-rose-500/40 text-white shadow-md'
                          : 'hover:bg-neutral-800/60 border border-transparent text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 text-center shrink-0">
                          {isCurrent && isPlaying ? (
                            <div className="flex items-end justify-center gap-0.5 h-4">
                              <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                              <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
                              <span className="w-1 bg-rose-400 rounded-full animate-bounce h-2" />
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-neutral-500 group-hover:text-neutral-300">
                              {t.trackNumber < 10 ? `0${t.trackNumber}` : t.trackNumber}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-rose-300' : 'text-neutral-100'}`}>
                            {t.titleRomaji}
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1.5">
                            <span className="font-japanese text-neutral-500">{t.titleKanji}</span>
                            <span>·</span>
                            <span>{t.stageOrRole}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasAudio ? (
                          <span className="rounded bg-neutral-800 border border-neutral-700/60 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 font-bold uppercase">
                            {t.audioFormat || 'AUDIO'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-600 font-mono">
                            {t.duration || 'ZUN'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Album Artwork & ZUN Story / Commentary (7 cols) */}
          <div className="md:col-span-7 flex flex-col overflow-y-auto p-5 sm:p-6 bg-neutral-900/60 space-y-5">
            {currentTrack ? (
              <>
                {/* Now Playing Header Card */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 shadow-lg">
                  {/* Album Cover with Vinyl Effect */}
                  <div className="relative shrink-0 group">
                    <img
                      src={activeCoverSrc}
                      alt={currentGame.titleEnglish}
                      className={`h-32 w-32 object-cover rounded-xl shadow-xl border border-neutral-700/60 ${
                        isPlaying ? 'ring-2 ring-rose-500/40' : ''
                      }`}
                    />
                    <div className="absolute inset-0 rounded-xl bg-black/20 pointer-events-none" />
                    {isPlaying && (
                      <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg animate-spin [animation-duration:4s]">
                        <Disc3 className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Track Titles & Metadata */}
                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
                        Pista {currentTrack.trackNumber < 10 ? `0${currentTrack.trackNumber}` : currentTrack.trackNumber}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        {currentTrack.stageOrRole}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {currentTrack.titleRomaji}
                    </h2>
                    <p className="font-japanese text-sm text-rose-400/90">
                      {currentTrack.titleKanji}
                    </p>
                    <p className="text-xs text-neutral-400 italic">
                      "{currentTrack.titleEnglish}"
                    </p>

                    <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-[11px]">
                      <span className="text-neutral-400">Juego:</span>
                      <strong className="text-neutral-200">{currentGame.titleEnglish}</strong>
                      <span className="text-neutral-500">({currentGame.releaseYear})</span>
                    </div>
                  </div>
                </div>

                {/* ZUN Official Lore & Commentary Box */}
                <div className="rounded-2xl border border-amber-900/30 bg-gradient-to-br from-neutral-950 via-neutral-950/95 to-amber-950/20 p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-900/30 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                        <BookOpen className="h-3.5 w-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-amber-300 tracking-wide uppercase flex items-center gap-2">
                        <span>Comentarios e Historia de ZUN</span>
                        <span className="text-[10px] font-normal text-amber-500 font-mono">(ZUN Official Notes)</span>
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Team Shanghai Alice
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans whitespace-pre-line">
                    {currentTrack.zunCommentary}
                  </p>

                  <div className="pt-2 text-[10px] text-neutral-500 flex items-center justify-between border-t border-neutral-800/60">
                    <span>Música compuesta por ZUN (Jun'ya Ota)</span>
                    <span>{currentGame.titleKanji}</span>
                  </div>
                </div>

                {/* Audio Status Notice if not downloaded */}
                {!currentTrack.audioPath && (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 text-xs text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Music className="h-5 w-5 text-neutral-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-neutral-200">Canción en catálogo (Archivo de audio pendiente)</p>
                        <p className="text-[11px] text-neutral-400">
                          Descarga el OST de {currentGame.titleEnglish} desde Moriya Shrine para reproducirla con calidad Lossless/Opus.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenExternal(currentGame.moriyaShrineUrl)}
                      className="shrink-0 flex items-center gap-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Descargar OST</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500 text-xs">
                Selecciona una canción para comenzar.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Playback & Scrubber Bar */}
        <div className="border-t border-neutral-800 bg-neutral-950/95 px-6 py-3.5 shrink-0 space-y-2">
          {/* Seek Scrubber & Timers */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={Number.isFinite(duration) && duration > 0 ? duration : 100}
              value={Number.isFinite(currentTime) ? currentTime : 0}
              onChange={handleSeek}
              disabled={!currentTrack?.audioPath}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-neutral-800 accent-rose-500 focus:outline-none disabled:opacity-40"
            />
            <span className="text-[11px] font-mono text-neutral-400 w-10">
              {Number.isFinite(duration) && duration > 0 ? formatTime(duration) : '--:--'}
            </span>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4">
            {/* Left track preview */}
            <div className="hidden sm:flex items-center gap-3 w-1/4 min-w-0">
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-200 truncate">
                  {currentTrack?.titleRomaji || 'Sin pista seleccionada'}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">
                  {currentTrack ? `${currentGame.code} · ${currentTrack.stageOrRole}` : ''}
                </p>
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex items-center justify-center gap-3 flex-1 sm:flex-initial">
              <button
                onClick={() => setIsShuffle((prev) => !prev)}
                className={`p-2 rounded-lg transition-colors ${
                  isShuffle ? 'text-rose-400 bg-rose-950/50' : 'text-neutral-400 hover:text-white'
                }`}
                title={isShuffle ? 'Aleatorio activado' : 'Activar aleatorio'}
              >
                <Shuffle className="h-4 w-4" />
              </button>

              <button
                onClick={handlePrevTrack}
                disabled={catalogTracks.length === 0}
                className="p-2 text-neutral-300 hover:text-white transition-colors disabled:opacity-40"
                title="Pista anterior"
              >
                <SkipBack className="h-5 w-5" />
              </button>

              <button
                onClick={togglePlay}
                disabled={!currentTrack?.audioPath}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-40 disabled:bg-neutral-800"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={handleNextTrack}
                disabled={catalogTracks.length === 0}
                className="p-2 text-neutral-300 hover:text-white transition-colors disabled:opacity-40"
                title="Pista siguiente"
              >
                <SkipForward className="h-5 w-5" />
              </button>

              <button
                onClick={() => setIsLooping((prev) => !prev)}
                className={`p-2 rounded-lg transition-colors ${
                  isLooping ? 'text-rose-400 bg-rose-950/50' : 'text-neutral-400 hover:text-white'
                }`}
                title={isLooping ? 'Repetir canción activado' : 'Repetir canción desactivado'}
              >
                <Repeat className="h-4 w-4" />
              </button>
            </div>

            {/* Right Volume & Audio Format */}
            <div className="flex items-center justify-end gap-3 w-1/4">
              {currentTrack?.audioFormat && (
                <span className="hidden lg:inline text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-emerald-400 font-bold border border-neutral-700/60">
                  {currentTrack.audioFormat}
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="text-neutral-400 hover:text-white transition-colors"
                  title={isMuted ? 'Desmutear' : 'Mutear'}
                >
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-16 sm:w-20 h-1.5 rounded-lg appearance-none cursor-pointer bg-neutral-800 accent-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
