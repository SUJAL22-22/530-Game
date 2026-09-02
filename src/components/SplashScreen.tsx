import React from 'react';
import { Play, Scissors, Sparkles } from 'lucide-react';
import { sound } from '../services/audio';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  return (
    <div
      onClick={() => {
        sound.playTap();
        onStart();
      }}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-8 text-slate-100 max-w-[440px] mx-auto w-full h-full cursor-pointer select-none overflow-hidden"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Tag */}
      <div className="pt-8 flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900/80 border border-slate-800 rounded-full text-slate-400 text-xs font-semibold">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Physics Puzzle Adventure</span>
      </div>

      {/* Center Hero Logo with Swinging Animation */}
      <div className="flex flex-col items-center">
        {/* Animated Hanging Rope + Candy Visual */}
        <div className="flex flex-col items-center mb-6 animate-pulse">
          <div className="w-1 h-20 bg-amber-700/80 rounded-full shadow-lg origin-top transform -rotate-6 animate-bounce" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-yellow-300 shadow-xl flex items-center justify-center text-2xl -mt-2">
            🍬
          </div>
        </div>

        {/* Title */}
        <div className="relative flex items-center justify-center">
          <h1 className="text-5xl font-extrabold font-fredoka tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-teal-400 drop-shadow-sm">
            Rope Cut
          </h1>
          <div className="absolute -top-3 -right-6 text-amber-400">
            <Scissors className="w-6 h-6 transform -rotate-45" />
          </div>
        </div>

        <p className="text-sm text-slate-400 font-outfit mt-2 max-w-xs text-center">
          Swipe, cut ropes & master 2D physics puzzles
        </p>
      </div>

      {/* Bottom Tap to Play */}
      <div className="pb-10 flex flex-col items-center space-y-4">
        <button
          id="splash-play-btn"
          className="px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-teal-500 hover:from-amber-300 hover:to-teal-400 text-slate-950 font-bold font-fredoka text-xl rounded-2xl shadow-xl shadow-amber-950/60 flex items-center space-x-3 active:scale-95 transition-all"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>Tap to Start</span>
        </button>

        <span className="text-xs text-slate-500 font-outfit animate-pulse">
          Tap anywhere to begin
        </span>
      </div>
    </div>
  );
};
