'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WISHES, CATEGORIES, Wish } from '../data/wishes';
import SparkleCanvas from '../components/SparkleCanvas';
import FavoritesModal from '../components/FavoritesModal';
import { playWishChime } from '../lib/audio';

type AmbientTheme = 'cosmic' | 'sunset' | 'aurora' | 'emerald';

const THEME_GRADIENTS: Record<AmbientTheme, { orb1: string; orb2: string; orb3: string; label: string }> = {
  cosmic: {
    orb1: 'from-purple-600/30 via-indigo-600/20 to-transparent',
    orb2: 'from-blue-600/25 via-cyan-500/15 to-transparent',
    orb3: 'from-pink-600/20 via-rose-500/15 to-transparent',
    label: 'Cosmic Sky',
  },
  sunset: {
    orb1: 'from-amber-500/30 via-orange-600/20 to-transparent',
    orb2: 'from-rose-600/25 via-pink-500/15 to-transparent',
    orb3: 'from-yellow-500/20 via-amber-400/15 to-transparent',
    label: 'Golden Dawn',
  },
  aurora: {
    orb1: 'from-emerald-500/30 via-teal-600/20 to-transparent',
    orb2: 'from-cyan-500/25 via-blue-600/15 to-transparent',
    orb3: 'from-violet-600/20 via-purple-500/15 to-transparent',
    label: 'Northern Lights',
  },
  emerald: {
    orb1: 'from-emerald-600/30 via-green-600/20 to-transparent',
    orb2: 'from-teal-500/25 via-cyan-600/15 to-transparent',
    orb3: 'from-lime-500/15 via-emerald-400/10 to-transparent',
    label: 'Zen Forest',
  },
};

export default function PositiveWishApp() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentWish, setCurrentWish] = useState<Wish>(WISHES[0]);
  const [recipientName, setRecipientName] = useState<string>('');
  const [isNameEditing, setIsNameEditing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Wish[]>([]);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(false);
  const [burstTrigger, setBurstTrigger] = useState<number>(0);
  const [wishesViewed, setWishesViewed] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<AmbientTheme>('cosmic');
  const [greeting, setGreeting] = useState<string>('Welcome');
  const [todayFormatted, setTodayFormatted] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Time-of-day greeting & favorites recovery on mount
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }

    setTodayFormatted(
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(now)
    );

    // Load saved favorites
    try {
      const saved = localStorage.getItem('aura_favorite_wishes');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {
      // LocalStorage error fallback
    }

    // Set a truly random initial wish
    const randomIndex = Math.floor(Math.random() * WISHES.length);
    setCurrentWish(WISHES[randomIndex]);
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavs: Wish[]) => {
    setFavorites(newFavs);
    try {
      localStorage.setItem('aura_favorite_wishes', JSON.stringify(newFavs));
    } catch {
      // LocalStorage error fallback
    }
  };

  // Toast notification helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Filtered pool of wishes based on category
  const filteredWishes = useMemo(() => {
    if (selectedCategory === 'all') return WISHES;
    return WISHES.filter((w) => w.category === selectedCategory);
  }, [selectedCategory]);

  // Generate a random wish from the active pool
  const generateNewWish = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 450);

    // Pick a random wish distinct from the current one if possible
    let nextWish: Wish;
    if (filteredWishes.length <= 1) {
      nextWish = filteredWishes[0] || WISHES[0];
    } else {
      const remaining = filteredWishes.filter((w) => w.id !== currentWish.id);
      nextWish = remaining[Math.floor(Math.random() * remaining.length)];
    }

    setCurrentWish(nextWish);
    setWishesViewed((prev) => prev + 1);
    setBurstTrigger((prev) => prev + 1);

    if (soundEnabled) {
      playWishChime();
    }
  }, [currentWish.id, filteredWishes, soundEnabled]);

  // Toggle favorite
  const isFavorite = favorites.some((f) => f.id === currentWish.id);
  const toggleFavorite = () => {
    if (isFavorite) {
      const updated = favorites.filter((f) => f.id !== currentWish.id);
      saveFavorites(updated);
      showToast('Removed from saved blessings');
    } else {
      const updated = [...favorites, currentWish];
      saveFavorites(updated);
      showToast('💖 Saved to your blessings collection!');
    }
  };

  // Read aloud via Speech Synthesis
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      showToast('Audio reading not supported on this browser');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const spokenText = `${
      recipientName.trim() ? `Wishing you, ${recipientName.trim()}: ` : ''
    }${currentWish.text}. Affirmation: ${currentWish.affirmation}. ${currentWish.blessing}`;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Pick smooth English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') && v.name.includes('Natural')) ||
        v.name.includes('Samantha') ||
        v.name.includes('Google UK English Female') ||
        v.name.includes('Serena')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Copy wish to clipboard
  const handleCopyWish = async () => {
    const textToCopy = `✨ A Positive Blessing For You:\n"${
      recipientName.trim() ? `Wishing you, ${recipientName.trim()}: ` : ''
    }${currentWish.text}"\n\n✦ Blessing: ${currentWish.blessing}\n✦ Affirmation: ${
      currentWish.affirmation
    }\n\nShared with love from Aura Wishes`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        showToast('✓ Blessing copied to clipboard!');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('✓ Blessing copied to clipboard!');
      }
    } catch {
      showToast('Unable to copy text automatically');
    }
  };

  // Share wish
  const handleShare = async () => {
    const shareData = {
      title: 'A Positive Wish For You',
      text: `✨ "${currentWish.text}" — ${currentWish.blessing}`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!');
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyWish();
    }
  };



  const themeColors = THEME_GRADIENTS[activeTheme];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#060814] text-white">
      {/* Interactive Sparkle Canvas */}
      <SparkleCanvas burstTrigger={burstTrigger} />

      {/* Luminous Ambient Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className={`absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br ${themeColors.orb1} blur-[120px] animate-aura-1 opacity-70`}
        />
        <div
          className={`absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br ${themeColors.orb2} blur-[140px] animate-aura-2 opacity-60`}
        />
        <div
          className={`absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br ${themeColors.orb3} blur-[130px] animate-aura-3 opacity-60`}
        />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl text-sm font-medium text-white flex items-center gap-2 animate-wish-reveal"
        >
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 p-[1px] shadow-lg shadow-purple-900/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0d1e] rounded-[15px] flex items-center justify-center text-xl">
              ✨
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight shimmer-text">
              Aura Wishes
            </h1>
            <p className="text-xs text-white/50 hidden sm:block">
              Daily radiant blessings & positivity
            </p>
          </div>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              showToast(soundEnabled ? 'Chimes muted' : 'Chimes enabled 🔔');
            }}
            className="p-2.5 rounded-xl glass-pill text-white/80 hover:text-white transition-all text-sm flex items-center gap-1.5"
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            aria-label={soundEnabled ? 'Mute chime audio' : 'Enable chime audio'}
          >
            <span>{soundEnabled ? '🔔' : '🔕'}</span>
            <span className="text-xs hidden md:inline">
              {soundEnabled ? 'Chime On' : 'Chime Off'}
            </span>
          </button>

          {/* Favorites Button */}
          <button
            id="favorites-btn"
            onClick={() => setIsFavoritesOpen(true)}
            className="p-2.5 rounded-xl glass-pill text-white/80 hover:text-white transition-all text-sm flex items-center gap-1.5"
            title="View saved blessings"
            aria-label="View saved blessings"
          >
            <span>💖</span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              {favorites.length}
            </span>
          </button>

          {/* Theme Palette Switcher */}
          <div className="relative group">
            <button
              id="theme-select-btn"
              className="p-2.5 rounded-xl glass-pill text-white/80 hover:text-white transition-all text-sm flex items-center gap-1.5"
              aria-label="Change aura theme"
              title="Change aura ambient theme"
            >
              <span>🎨</span>
            </button>
            <div className="absolute right-0 mt-2 hidden group-hover:flex flex-col gap-1 p-2 rounded-2xl glass-panel shadow-2xl z-30 min-w-[140px]">
              {(['cosmic', 'sunset', 'aurora', 'emerald'] as AmbientTheme[]).map((thm) => (
                <button
                  key={thm}
                  onClick={() => setActiveTheme(thm)}
                  className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTheme === thm
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {THEME_GRADIENTS[thm].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full">
        {/* Personalization Greeting Bar */}
        <section aria-label="Personalized greeting" className="text-center mb-6 max-w-md w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-xs text-white/70 shadow-sm mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {greeting}
              {todayFormatted ? ` • ${todayFormatted}` : ''}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-1">
            {isNameEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsNameEditing(false);
                  if (recipientName.trim()) {
                    showToast(`Wishes personalized for ${recipientName.trim()}`);
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  id="recipient-name-input"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Enter your name..."
                  autoFocus
                  maxLength={30}
                  className="px-3 py-1 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-400 text-black hover:bg-amber-300 transition-colors"
                >
                  Save
                </button>
              </form>
            ) : (
              <button
                id="edit-name-btn"
                onClick={() => setIsNameEditing(true)}
                className="group flex items-center gap-1.5 text-xs text-white/60 hover:text-amber-300 transition-colors"
                title="Click to personalize with your name"
              >
                <span>
                  {recipientName.trim()
                    ? `Personalized for: `
                    : `Want a personalized blessing? `}
                </span>
                <span className="font-semibold text-white/90 group-hover:text-amber-300 underline underline-offset-4 decoration-amber-400/40">
                  {recipientName.trim() ? recipientName.trim() : 'Add your name'}
                </span>
                <span>✏️</span>
              </button>
            )}
          </div>
        </section>

        {/* Category Pills */}
        <nav aria-label="Wish categories" className="w-full flex justify-center mb-6 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 px-2">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`category-${cat.id}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    // generate a wish matching the selected category
                    const pool = cat.id === 'all' ? WISHES : WISHES.filter((w) => w.category === cat.id);
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    setCurrentWish(pick);
                    setBurstTrigger((p) => p + 1);
                    if (soundEnabled) playWishChime();
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400/90 to-pink-500/90 text-white shadow-lg shadow-pink-500/25 scale-105'
                      : 'glass-pill text-white/70 hover:text-white'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Wish Card */}
        <article
          id="active-wish-card"
          className={`glass-panel relative w-full max-w-2xl rounded-3xl p-6 sm:p-10 transition-all duration-500 ${
            isAnimating ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100'
          }`}
        >
          {/* Subtle Top Glow Border */}
          <div
            className={`absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r ${currentWish.themeColor} opacity-70 blur-[1px]`}
          />

          {/* Card Header Row */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">
                {CATEGORIES.find((c) => c.id === currentWish.category)?.icon || '✨'}
              </span>
              <span className="text-xs uppercase tracking-wider font-bold text-amber-300/90">
                {CATEGORIES.find((c) => c.id === currentWish.category)?.label || 'Blessing'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Text-to-speech button */}
              <button
                id="listen-wish-btn"
                onClick={handleToggleSpeech}
                className={`p-2 rounded-xl transition-all text-xs flex items-center gap-1.5 ${
                  isSpeaking
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse'
                    : 'bg-white/5 hover:bg-white/15 text-white/70 hover:text-white'
                }`}
                title={isSpeaking ? 'Stop voice reading' : 'Listen to this wish'}
                aria-label={isSpeaking ? 'Stop voice reading' : 'Listen to wish audio'}
              >
                <span>{isSpeaking ? '⏹️' : '🔊'}</span>
                <span className="hidden sm:inline">
                  {isSpeaking ? 'Listening...' : 'Listen'}
                </span>
              </button>

              {/* Heart/Favorite toggle */}
              <button
                id="favorite-toggle-btn"
                onClick={toggleFavorite}
                className={`p-2 rounded-xl transition-all text-sm ${
                  isFavorite
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 scale-110'
                    : 'bg-white/5 hover:bg-white/15 text-white/60 hover:text-pink-300'
                }`}
                title={isFavorite ? 'Remove from saved' : 'Save to favorites'}
                aria-label={isFavorite ? 'Remove wish from favorites' : 'Save wish to favorites'}
              >
                {isFavorite ? '❤️' : '🤍'}
              </button>
            </div>
          </div>

          {/* Central Wish Text */}
          <div className="my-6 sm:my-8 text-center sm:text-left">
            {recipientName.trim() && (
              <p className="text-sm font-medium text-amber-300/90 mb-3 tracking-wide">
                Dear {recipientName.trim()},
              </p>
            )}

            <blockquote className="text-xl sm:text-2xl md:text-3xl font-serif leading-relaxed text-white/95 tracking-tight">
              &ldquo;{currentWish.text}&rdquo;
            </blockquote>

            {/* Benediction / Blessing */}
            <div className="mt-6 flex items-start gap-2.5 text-amber-200/90 bg-amber-400/[0.07] border border-amber-300/15 rounded-2xl p-4">
              <span className="text-amber-400 text-lg">✦</span>
              <p className="text-sm font-medium leading-relaxed">
                {currentWish.blessing}
              </p>
            </div>

            {/* Daily Affirmation Pill */}
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">
                Affirmation:
              </span>
              <span className="text-xs sm:text-sm font-semibold text-cyan-200 bg-cyan-400/10 border border-cyan-400/20 px-3.5 py-1.5 rounded-full">
                &ldquo;{currentWish.affirmation}&rdquo;
              </span>
            </div>
          </div>

          {/* Interactive Card Footer Controls */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Quick Share / Copy tools */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <button
                id="copy-wish-btn"
                onClick={handleCopyWish}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold transition-all border border-white/10 flex items-center gap-1.5 active:scale-95"
              >
                <span>📋</span>
                <span>Copy Wish</span>
              </button>
              <button
                id="share-wish-btn"
                onClick={handleShare}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold transition-all border border-white/10 flex items-center gap-1.5 active:scale-95"
              >
                <span>📤</span>
                <span>Share</span>
              </button>
            </div>

            {/* Primary Action Button: Generate Random Wish */}
            <button
              id="generate-wish-btn"
              onClick={generateNewWish}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 hover:from-amber-300 hover:via-pink-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-pink-500/25 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span className="text-lg">✨</span>
              <span>Manifest New Wish</span>
            </button>
          </div>
        </article>

        {/* Exploration Insights / Counter */}
        <section aria-label="Session stats" className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Blessings experienced: <strong className="text-white/70">{wishesViewed}</strong></span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            <span>Treasury: <strong className="text-white/70">{WISHES.length} Curated Wishes</strong></span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span>Tap &apos;Spacebar&apos; anytime to reveal next wish</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-white/40 border-t border-white/5 bg-black/20 backdrop-blur-md">
        <p>
          Crafted with love • May every day bring you light, purpose, and peace.
        </p>
      </footer>

      {/* Saved Favorites Dialog */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onRemoveFavorite={(id) => {
          const updated = favorites.filter((f) => f.id !== id);
          saveFavorites(updated);
        }}
        onSelectWish={(wish) => {
          setCurrentWish(wish);
          setBurstTrigger((p) => p + 1);
          if (soundEnabled) playWishChime();
        }}
      />
    </div>
  );
}
