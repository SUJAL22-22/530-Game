import React from 'react';
import { Sparkles, Check, Scissors, Target, ShieldAlert, Compass } from 'lucide-react';
import { sound } from '../services/audio';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow Header */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3 shadow-lg">
          <Scissors className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold font-fredoka text-slate-100 mb-1">How to Play</h2>
        <p className="text-xs text-slate-400 font-outfit mb-5">
          Master the physics of ropes to safely guide the payload!
        </p>

        {/* Animated Swipe Tutorial Box */}
        <div className="w-full bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mb-5 relative overflow-hidden flex flex-col items-center justify-center min-h-[130px]">
          {/* Virtual Rope in demo */}
          <div className="w-1 h-24 bg-amber-700/80 rounded-full relative">
            <div className="w-3 h-3 bg-slate-400 rounded-full -top-1.5 -left-1 absolute" />
            <div className="w-8 h-8 bg-rose-500 rounded-full -bottom-4 -left-3.5 shadow-md flex items-center justify-center text-xs">
              🍬
            </div>
          </div>

          {/* Animated Swipe Line & Hand Gesture */}
          <div className="absolute w-32 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform -rotate-12 animate-pulse" />
          <div className="absolute text-xl animate-bounce top-10 right-14 opacity-90">
            👆
          </div>

          <span className="text-[11px] text-cyan-300 font-semibold font-outfit mt-4 bg-slate-900/80 px-2.5 py-1 rounded-full border border-cyan-500/30">
            Swipe across ropes to cut them
          </span>
        </div>

        {/* Quick Rule Points */}
        <div className="w-full space-y-2.5 text-left mb-6">
          <div className="flex items-start space-x-2.5 text-xs text-slate-300 font-outfit">
            <Target className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Target Goal:</strong> Land the swinging payload safely in the bottom jar.
            </span>
          </div>
          <div className="flex items-start space-x-2.5 text-xs text-slate-300 font-outfit">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Collect Stars:</strong> Swing through 3 stars in each level for max rating!
            </span>
          </div>
          <div className="flex items-start space-x-2.5 text-xs text-slate-300 font-outfit">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Avoid Hazards:</strong> Keep away from spikes, spinning blades, and laser beams.
            </span>
          </div>
          <div className="flex items-start space-x-2.5 text-xs text-slate-300 font-outfit">
            <Compass className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Physics Mechanics:</strong> Leverage fans, portals, breakable platforms, and moving anchors!
            </span>
          </div>
        </div>

        {/* Got It Button */}
        <button
          id="tutorial-got-it-btn"
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-fredoka text-base rounded-2xl shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 active:scale-98 transition-all"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>Got It! Let's Play</span>
        </button>
      </div>
    </div>
  );
};
