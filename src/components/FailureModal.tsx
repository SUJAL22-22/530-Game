import React from 'react';
import { RotateCcw, LayoutGrid, AlertCircle, HelpCircle } from 'lucide-react';
import { sound } from '../services/audio';

interface FailureModalProps {
  levelId: number;
  reason: string;
  hintText?: string;
  onRetry: () => void;
  onLevelSelect: () => void;
  onShowHint: () => void;
}

export const FailureModal: React.FC<FailureModalProps> = ({
  levelId,
  reason,
  hintText,
  onRetry,
  onLevelSelect,
  onShowHint,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Defeat Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-3 shadow-lg shadow-rose-950/40">
          <AlertCircle className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-bold font-fredoka text-slate-100 mb-1">Level Failed</h2>
        <p className="text-xs text-rose-300 font-medium mb-4">
          {reason || 'The payload was lost!'}
        </p>

        {/* Tip Box */}
        {hintText && (
          <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 mb-6 text-left">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-400 mb-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hint</span>
            </div>
            <p className="text-xs text-slate-300 font-outfit leading-relaxed">{hintText}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            id="failure-retry-btn"
            onClick={() => {
              sound.playTap();
              onRetry();
            }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold font-fredoka text-lg rounded-2xl shadow-lg shadow-rose-950/50 flex items-center justify-center space-x-2 active:scale-98 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Try Again</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              id="failure-hint-btn"
              onClick={() => {
                sound.playTap();
                onShowHint();
              }}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold font-outfit text-sm rounded-2xl border border-slate-700/60 flex items-center justify-center space-x-2 active:scale-98 transition-all"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Use Hint</span>
            </button>

            <button
              id="failure-levels-btn"
              onClick={() => {
                sound.playTap();
                onLevelSelect();
              }}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold font-outfit text-sm rounded-2xl border border-slate-700/60 flex items-center justify-center space-x-2 active:scale-98 transition-all"
            >
              <LayoutGrid className="w-4 h-4 text-sky-400" />
              <span>Levels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
