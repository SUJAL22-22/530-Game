import React from 'react';
import { Play, RotateCcw, LayoutGrid, Volume2, VolumeX, Music } from 'lucide-react';
import { sound } from '../services/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onLevelSelect,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Header */}
        <h2 className="text-2xl font-bold font-fredoka text-slate-100 mb-1">Game Paused</h2>
        <p className="text-sm text-slate-400 mb-6 font-outfit">Take a breather or adjust settings</p>

        {/* Action Buttons */}
        <div className="w-full space-y-3 mb-6">
          <button
            id="pause-resume-btn"
            onClick={() => {
              sound.playTap();
              onResume();
            }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-fredoka text-lg rounded-2xl shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 active:scale-98 transition-all"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Resume</span>
          </button>

          <button
            id="pause-restart-btn"
            onClick={() => {
              sound.playTap();
              onRestart();
            }}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold font-outfit text-base rounded-2xl border border-slate-700/60 flex items-center justify-center space-x-2 active:scale-98 transition-all"
          >
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <span>Restart Level</span>
          </button>

          <button
            id="pause-levels-btn"
            onClick={() => {
              sound.playTap();
              onLevelSelect();
            }}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold font-outfit text-base rounded-2xl border border-slate-700/60 flex items-center justify-center space-x-2 active:scale-98 transition-all"
          >
            <LayoutGrid className="w-5 h-5 text-sky-400" />
            <span>Level Selection</span>
          </button>
        </div>

        {/* Audio Quick Toggles */}
        <div className="flex items-center space-x-3 pt-2 border-t border-slate-800 w-full justify-center">
          <button
            id="pause-sound-toggle"
            onClick={() => {
              sound.playTap();
              onToggleSound();
            }}
            className={`p-3 rounded-2xl border transition-all ${
              soundEnabled
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            id="pause-music-toggle"
            onClick={() => {
              sound.playTap();
              onToggleMusic();
            }}
            className={`p-3 rounded-2xl border transition-all ${
              musicEnabled
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Music className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
