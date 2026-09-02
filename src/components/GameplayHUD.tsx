import React from 'react';
import { Pause, RotateCcw, HelpCircle, Star } from 'lucide-react';
import { LevelConfig } from '../types';
import { sound } from '../services/audio';

interface GameplayHUDProps {
  level: LevelConfig;
  starsCollected: number;
  cutsCount: number;
  cutLimit?: number;
  showHint: boolean;
  onPause: () => void;
  onRestart: () => void;
  onToggleHint: () => void;
}

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  level,
  starsCollected,
  cutsCount,
  cutLimit,
  showHint,
  onPause,
  onRestart,
  onToggleHint,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-3 pt-4 flex flex-col pointer-events-none z-10">
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between max-w-[440px] mx-auto w-full px-2">
        {/* Left: Pause & Restart */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            id="hud-pause-btn"
            onClick={() => {
              sound.playTap();
              onPause();
            }}
            aria-label="Pause game"
            className="w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-700/60 text-slate-200 flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:bg-slate-800"
          >
            <Pause className="w-5 h-5 fill-slate-200" />
          </button>
          <button
            id="hud-restart-btn"
            onClick={() => {
              sound.playTap();
              onRestart();
            }}
            aria-label="Restart level"
            className="w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-700/60 text-slate-200 flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:bg-slate-800"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Level Title & Star Counter */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-outfit">
            Level {level.id}
          </div>
          <div className="flex items-center space-x-1 mt-0.5">
            {[0, 1, 2].map((idx) => {
              const isCollected = idx < starsCollected;
              return (
                <Star
                  key={idx}
                  className={`w-6 h-6 transition-all duration-300 ${
                    isCollected
                      ? 'text-amber-400 fill-amber-400 glow-gold scale-110'
                      : 'text-slate-600 fill-slate-800/80'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Right: Cuts info & Hint */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {cutLimit && (
            <div className="bg-slate-900/80 backdrop-blur px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs font-medium text-slate-200 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase leading-none">Cuts</span>
              <span className="font-bold font-fredoka text-amber-300">
                {cutsCount}/{cutLimit}
              </span>
            </div>
          )}

          <button
            id="hud-hint-btn"
            onClick={() => {
              sound.playTap();
              onToggleHint();
            }}
            aria-label="Show hint"
            title="Need help? Tap for hint!"
            className={`w-10 h-10 rounded-xl border backdrop-blur flex items-center justify-center shadow-lg active:scale-95 transition-all ${
              showHint
                ? 'bg-amber-500/30 border-amber-400 text-amber-300 ring-2 ring-amber-400/50'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Level Objective / Hint Banner */}
      <div className="mt-2 mx-auto max-w-[360px] w-full flex justify-center pointer-events-auto">
        {showHint && level.hint ? (
          <div className="w-full bg-amber-950/90 border border-amber-500/60 backdrop-blur text-amber-200 text-xs px-3.5 py-2 rounded-xl shadow-xl animate-fade-in text-center font-medium flex items-center justify-center space-x-1.5">
            <span>💡 {level.hint.text}</span>
          </div>
        ) : (
          <div className="bg-slate-900/75 border border-slate-800/80 backdrop-blur text-slate-300 text-[11px] px-3 py-1 rounded-full shadow-md text-center font-outfit truncate max-w-full">
            🎯 {level.description || `Cut ropes to guide payload safely to the goal!`}
          </div>
        )}
      </div>
    </div>
  );
};
