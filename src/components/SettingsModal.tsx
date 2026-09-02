import React, { useState } from 'react';
import { ChevronLeft, Volume2, VolumeX, Music, Smartphone, Zap, RotateCcw, HelpCircle, Info, Trash2 } from 'lucide-react';
import { UserSaveData } from '../types';
import { sound } from '../services/audio';

interface SettingsModalProps {
  saveData: UserSaveData;
  onUpdateSettings: (newSettings: Partial<UserSaveData>) => void;
  onResetProgress: () => void;
  onOpenTutorial: () => void;
  onBack: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  saveData,
  onUpdateSettings,
  onResetProgress,
  onOpenTutorial,
  onBack,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col max-w-[440px] mx-auto w-full h-full text-slate-100 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur">
        <button
          id="settings-back-btn"
          onClick={() => {
            sound.playTap();
            onBack();
          }}
          className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-200 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-xl font-bold font-fredoka text-slate-100">Settings</h1>

        <div className="w-10" />
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-5">
        {/* Audio & Feedback Section */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-outfit px-1">
            Audio & Feedback
          </span>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                {saveData.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-200">Sound Effects</span>
                <span className="text-xs text-slate-400">Rope cuts, impacts, chimes</span>
              </div>
            </div>

            <button
              id="setting-sound-toggle"
              onClick={() => {
                const next = !saveData.soundEnabled;
                onUpdateSettings({ soundEnabled: next });
                sound.setSoundEnabled(next);
                if (next) sound.playTap();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                saveData.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  saveData.soundEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Music Toggle */}
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                <Music className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-200">Background Music</span>
                <span className="text-xs text-slate-400">Calm ambient melody</span>
              </div>
            </div>

            <button
              id="setting-music-toggle"
              onClick={() => {
                const next = !saveData.musicEnabled;
                onUpdateSettings({ musicEnabled: next });
                sound.setMusicEnabled(next);
                if (saveData.soundEnabled) sound.playTap();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                saveData.musicEnabled ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  saveData.musicEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Haptics Toggle */}
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-200">Haptic Vibration</span>
                <span className="text-xs text-slate-400">Mobile device feedback</span>
              </div>
            </div>

            <button
              id="setting-haptic-toggle"
              onClick={() => {
                const next = !saveData.hapticsEnabled;
                onUpdateSettings({ hapticsEnabled: next });
                if (saveData.soundEnabled) sound.playTap();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                saveData.hapticsEnabled ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  saveData.hapticsEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Game & Tutorials */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-outfit px-1">
            Tutorial & Help
          </span>

          <button
            id="setting-replay-tutorial-btn"
            onClick={() => {
              sound.playTap();
              onOpenTutorial();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/60 active:scale-98 transition-all text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-200">How to Play</span>
                <p className="text-xs text-slate-400">View interactive tutorial instructions</p>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 rotate-180 text-slate-500" />
          </button>
        </div>

        {/* Data & Reset */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 font-outfit px-1">
            Danger Zone
          </span>

          {!showResetConfirm ? (
            <button
              id="setting-reset-prompt-btn"
              onClick={() => {
                sound.playTap();
                setShowResetConfirm(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-950/20 text-rose-400 active:scale-98 transition-all text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold">Reset Game Progress</span>
                  <p className="text-xs text-rose-400/80">Clear saved stars and level progress</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-3">
              <p className="text-xs text-rose-200 font-medium text-center">
                Are you sure you want to reset all stars and unlock progress?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    sound.playTap();
                    onResetProgress();
                    setShowResetConfirm(false);
                  }}
                  className="py-2 bg-rose-600 text-xs font-bold rounded-xl text-white shadow-lg"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* About Card */}
        <div className="text-center pt-2 pb-4 text-xs text-slate-500 font-outfit">
          <p className="font-semibold text-slate-400">Rope Cut v1.0.0</p>
          <p>Crafted with real-time physics & WebAudio</p>
        </div>
      </div>
    </div>
  );
};
