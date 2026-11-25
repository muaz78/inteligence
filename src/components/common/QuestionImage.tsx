import React, { useState } from 'react';
import { 
  Maximize2, 
  Info, 
  ShieldCheck, 
  Image as ImageIcon, 
  AlertCircle, 
  X,
  Camera,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import type { QuestionMediaRecord } from '../../media/questionMediaRegistry';
import { sounds } from '../../utils/soundEffects';

interface QuestionImageProps {
  media: QuestionMediaRecord | null;
  altText: string;
  categoryLabel?: string;
  difficultyLabel?: string;
  className?: string;
  allowZoom?: boolean;
}

export const QuestionImage: React.FC<QuestionImageProps> = ({
  media,
  altText,
  categoryLabel,
  difficultyLabel,
  className = '',
  allowZoom = true,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showAttribution, setShowAttribution] = useState(false);

  if (!media) {
    return (
      <div className={`relative w-full aspect-video rounded-3xl bg-gradient-to-br from-slate-100 to-blue-50 border border-slate-200 flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
        <span className="text-xs font-black text-slate-400 font-tech uppercase tracking-wider">
          Standard Geography Query
        </span>
      </div>
    );
  }

  const handleOpenZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playHover();
    setIsZoomed(true);
  };

  const handleCloseZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setIsZoomed(false);
  };

  const toggleAttribution = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setShowAttribution(!showAttribution);
  };

  return (
    <>
      <div 
        className={`group relative w-full aspect-video max-h-[340px] sm:max-h-[380px] rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-200/90 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-blue-300 ${className}`}
      >
        {/* Loading Shimmer Skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse flex flex-col items-center justify-center">
            <Camera className="w-8 h-8 text-blue-400 animate-bounce mb-2" />
            <span className="text-[11px] font-black text-slate-400 font-tech uppercase tracking-widest">
              Loading Authentic Photograph...
            </span>
          </div>
        )}

        {/* Real World Photograph */}
        {!imageError ? (
          <img
            src={media.url}
            alt={altText}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            loading="eager"
          />
        ) : (
          /* Graceful Fallback if Network fails or image is blocked */
          <div className={`w-full h-full bg-gradient-to-br ${media.fallbackGradient} p-6 flex flex-col items-center justify-center text-white text-center`}>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-black uppercase font-tech tracking-wider text-white/90">
              Verified Photographic Reference
            </span>
            <p className="text-sm font-bold text-white mt-1 max-w-md">
              {media.caption}
            </p>
            <span className="text-[10px] text-white/70 mt-2 font-mono">
              Source: {media.source}
            </span>
          </div>
        )}

        {/* Subtle Top Gradient Scrim for Overlaid Badges */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Subtle Bottom Gradient Scrim for Caption */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none" />

        {/* Top Badges: Category & Difficulty */}
        <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center space-x-2">
            {categoryLabel && (
              <span className="bg-slate-900/80 backdrop-blur-md text-white border border-white/20 px-3 py-1 rounded-full text-[10px] font-black font-tech uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-orange-400" />
                <span>{categoryLabel}</span>
              </span>
            )}
            {difficultyLabel && (
              <span className="bg-blue-600/90 backdrop-blur-md text-white border border-blue-400/40 px-2.5 py-1 rounded-full text-[10px] font-black font-tech uppercase tracking-wider shadow-sm">
                {difficultyLabel}
              </span>
            )}
          </div>

          {/* Quick Actions: Zoom & Info */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={toggleAttribution}
              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-colors cursor-pointer shadow-sm"
              title="Photo Credit & License Information"
            >
              <Info className="w-4 h-4" />
            </button>
            {allowZoom && (
              <button
                onClick={handleOpenZoom}
                className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-colors cursor-pointer shadow-sm"
                title="Inspect High-Res Photograph"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Caption & Verification Status */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-auto">
          <div className="text-left max-w-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 font-tech flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authentic Photographic Record</span>
            </span>
            <p className="text-xs sm:text-sm font-black text-white font-tech leading-snug drop-shadow-md">
              {media.caption}
            </p>
          </div>

          <div className="hidden sm:block text-right shrink-0 ml-3">
            <span className="text-[9px] text-white/80 font-bold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">
              {media.source}
            </span>
          </div>
        </div>

        {/* Attribution Popover */}
        {showAttribution && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="absolute inset-x-3 bottom-3 z-20 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 border border-blue-400/30 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-400 font-tech tracking-wider block">
                  Image Source & Licensing Information
                </span>
                <p className="text-xs font-bold text-white mt-0.5">
                  {media.attribution}
                </p>
                <div className="flex items-center space-x-3 text-[10px] text-slate-300 font-medium mt-2">
                  <span>Author: <strong className="text-white">{media.author}</strong></span>
                  <span>•</span>
                  <span>License: <strong className="text-emerald-400">{media.license}</strong></span>
                  <span>•</span>
                  <span>Archive: <strong className="text-white">{media.source}</strong></span>
                </div>
              </div>
              <button
                onClick={toggleAttribution}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Photo Inspection Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/85 backdrop-blur-lg animate-in fade-in duration-200"
          onClick={handleCloseZoom}
        >
          <div 
            className="relative max-w-5xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black text-white font-tech uppercase tracking-wide">
                  High-Resolution Image Inspection
                </h3>
              </div>
              <button
                onClick={handleCloseZoom}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res View Area */}
            <div className="p-4 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-black/50">
              <img
                src={media.url}
                alt={altText}
                className="max-h-[65vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>

            {/* Detailed Photo Information Bar */}
            <div className="px-6 py-4 bg-slate-900 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="text-sm font-black text-white font-tech">
                  {media.caption}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {media.attribution}
                </p>
              </div>

              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-300 shrink-0">
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">
                  License: {media.license}
                </span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">
                  Archive: {media.source}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
