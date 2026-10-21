'use client';

import React from 'react';
import { Wish } from '../data/wishes';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Wish[];
  onRemoveFavorite: (id: string) => void;
  onSelectWish: (wish: Wish) => void;
}

export default function FavoritesModal({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onSelectWish,
}: FavoritesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="favorites-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-opacity"
      onClick={onClose}
    >
      <div
        className="glass-panel relative w-full max-w-xl max-h-[85vh] rounded-3xl p-6 md:p-8 flex flex-col shadow-2xl border border-white/20 animate-wish-reveal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💖</span>
            <div>
              <h2 id="favorites-title" className="text-xl font-bold text-white">
                Saved Blessings
              </h2>
              <p className="text-xs text-white/60">
                {favorites.length} {favorites.length === 1 ? 'wish' : 'wishes'} bookmarked
              </p>
            </div>
          </div>
          <button
            id="close-favorites-btn"
            onClick={onClose}
            className="rounded-full w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            aria-label="Close saved wishes dialog"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {favorites.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <p className="text-4xl mb-3">✨</p>
              <p className="text-base font-medium">No saved wishes yet</p>
              <p className="text-xs mt-1 text-white/40">
                Click the heart icon on any wish to treasure it here!
              </p>
            </div>
          ) : (
            favorites.map((wish) => (
              <div
                key={wish.id}
                className="group relative rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 p-4 transition-all duration-300"
              >
                <p className="text-sm text-white/90 leading-relaxed font-serif italic mb-2">
                  &ldquo;{wish.text}&rdquo;
                </p>
                <p className="text-xs text-amber-300/80 font-medium mb-3">
                  ✦ {wish.blessing}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      onSelectWish(wish);
                      onClose();
                    }}
                    className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors flex items-center gap-1"
                  >
                    Display this wish →
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(wish.id)}
                    className="text-xs text-red-400/70 hover:text-red-300 hover:underline transition-colors"
                    aria-label={`Remove wish ${wish.id} from favorites`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
