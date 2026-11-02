import { useState } from 'react';
import { Sparkles, Moon, Sun, Ghost, Flame, Heart } from 'lucide-react';
import type { TouhouGame } from '../types/touhou.ts';

interface GameCoverArtProps {
  game: TouhouGame;
  size?: 'large' | 'compact' | 'thumb';
  onToggleFavorite?: (e: React.MouseEvent) => void;
  showBadges?: boolean;
}

export default function GameCoverArt({
  game,
  size = 'large',
  onToggleFavorite,
  showBadges = true,
}: GameCoverArtProps) {
  const [imageError, setImageError] = useState(false);

  const coverKey = game.code.replace('.', '_');

  // Fallback motif only when official cover is missing
  const renderFallbackMotif = () => {
    switch (game.iconSymbol) {
      case 'scarlet_bat':
        return <Moon className="h-12 w-12 text-rose-300 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]" />;
      case 'star_ufo':
        return <Sparkles className="h-12 w-12 text-sky-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />;
      case 'spirit_fire':
        return <Flame className="h-12 w-12 text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]" />;
      case 'cherry_petal':
        return <Sun className="h-12 w-12 text-pink-300 drop-shadow-[0_0_12px_rgba(244,114,182,0.6)]" />;
      case 'moon_crescent':
        return <Moon className="h-12 w-12 text-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]" />;
      default:
        return <Ghost className="h-12 w-12 text-neutral-400" />;
    }
  };

  if (size === 'thumb') {
    return (
      <div className="relative flex h-14 w-10 shrink-0 flex-col items-center justify-between overflow-hidden rounded-md border border-neutral-700/80 bg-neutral-900 shadow">
        {!imageError ? (
          <img
            src={`./covers/${coverKey}.png`}
            alt={game.code}
            onError={() => setImageError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-b ${game.bannerGradient} flex items-center justify-center`}>
            <span className="text-[10px] font-bold text-white">{game.code}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
        <span className="relative z-10 text-[9px] font-mono font-bold text-white drop-shadow p-0.5">{game.code}</span>
      </div>
    );
  }

  const isCompact = size === 'compact';

  return (
    <div
      className={`cover-box group/cover relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 transition-all duration-300 ${
        isCompact
          ? 'aspect-[340/500] w-28 shrink-0 shadow-lg'
          : 'aspect-[340/500] w-full shadow-lg hover:border-rose-500/50 hover:shadow-rose-950/40 hover:shadow-xl'
      }`}
    >
      {/* Background Cover Image or Fallback Gradient */}
      {!imageError ? (
        <img
          src={`./covers/${coverKey}.png`}
          alt={game.titleEnglish}
          onError={() => setImageError(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/cover:scale-105"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-b ${game.bannerGradient} flex flex-col items-center justify-center p-3 text-center`}>
          {renderFallbackMotif()}
          <span className="mt-2 text-xs font-serif font-bold text-white drop-shadow">{game.titleKanji}</span>
          <span className="text-[9px] font-mono text-neutral-300">{game.titleRomaji}</span>
        </div>
      )}

      {/* Smooth readable gradient overlays (only on top and bottom) */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/95 via-black/75 to-transparent pointer-events-none" />

      {/* Top badges & Favorite button */}
      <div className={`relative z-10 flex items-center justify-between ${isCompact ? 'p-1.5' : 'p-3'}`}>
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-neutral-100 backdrop-blur-md border border-white/15 shadow">
            {game.code}
          </span>
          {showBadges && game.installed && !isCompact && (
            <span className="rounded-md bg-emerald-950/90 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/40 backdrop-blur-sm shadow">
              Instalado
            </span>
          )}
        </div>

        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            aria-label={game.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            className="rounded-full bg-black/60 p-1 text-neutral-300 backdrop-blur-md hover:bg-black/85 hover:text-rose-400 transition-colors shadow"
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                game.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'
              }`}
            />
          </button>
        )}
      </div>

      {/* Bottom metadata */}
      <div className={`relative z-10 ${isCompact ? 'p-1.5' : 'p-3'}`}>
        {!isCompact && (
          <h4 className="font-serif font-bold tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-xs line-clamp-1">
            {game.titleKanji}
          </h4>
        )}
        <p className={`font-semibold text-neutral-100 drop-shadow line-clamp-1 ${isCompact ? 'text-[9px]' : 'text-[11px] mt-0.5'}`}>
          {game.titleEnglish}
        </p>
        <div className={`flex items-center justify-between text-neutral-400 font-mono ${isCompact ? 'text-[8px] mt-0.5' : 'text-[10px] mt-1'}`}>
          <span>{game.releaseYear}</span>
          <span className="text-neutral-300">ZUN</span>
        </div>
      </div>
    </div>
  );
}
