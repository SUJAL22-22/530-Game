import React, { useState } from 'react';
import { ChevronLeft, Star, Lock, Play, Trophy, Sparkles } from 'lucide-react';
import { WORLDS, LEVELS } from '../data/levels';
import { UserSaveData } from '../types';
import { sound } from '../services/audio';

interface LevelSelectModalProps {
  saveData: UserSaveData;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  saveData,
  onSelectLevel,
  onBack,
}) => {
  const [selectedWorldId, setSelectedWorldId] = useState<number>(saveData.currentWorld || 1);

  const currentWorld = WORLDS.find((w) => w.id === selectedWorldId) || WORLDS[0];
  const isWorldUnlocked = saveData.totalStars >= currentWorld.requiredStars;
  const worldLevels = LEVELS.filter((l) => l.worldId === selectedWorldId);

  // Compute total stars in current world
  let worldEarnedStars = 0;
  worldLevels.forEach((lvl) => {
    const p = saveData.levels[lvl.id];
    if (p) worldEarnedStars += p.stars || 0;
  });

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col max-w-[440px] mx-auto w-full h-full text-slate-100 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur">
        <button
          id="level-select-back-btn"
          onClick={() => {
            sound.playTap();
            onBack();
          }}
          className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-200 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-xl font-bold font-fredoka text-slate-100">Select Level</h1>

        {/* Total Stars Counter */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-amber-300 font-bold font-fredoka text-sm">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{saveData.totalStars}</span>
        </div>
      </div>

      {/* World Tabs Horizontal Carousel */}
      <div className="flex space-x-2.5 p-4 overflow-x-auto no-scrollbar border-b border-slate-800/60 bg-slate-900/30">
        {WORLDS.map((w) => {
          const isUnlocked = saveData.totalStars >= w.requiredStars;
          const isSelected = w.id === selectedWorldId;

          return (
            <button
              key={w.id}
              onClick={() => {
                sound.playTap();
                setSelectedWorldId(w.id);
              }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-2xl border flex items-center space-x-2 transition-all active:scale-95 ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-950/40'
                  : isUnlocked
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-slate-950/60 border-slate-900 text-slate-600 opacity-60'
              }`}
            >
              <span className="text-lg">{w.icon}</span>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold font-fredoka leading-tight">World {w.id}</span>
                <span className="text-[10px] text-slate-400 font-outfit truncate max-w-[85px]">
                  {w.name}
                </span>
              </div>
              {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-500 ml-1" />}
            </button>
          );
        })}
      </div>

      {/* World Details Banner */}
      <div className="px-5 py-3 flex items-center justify-between bg-slate-900/40 border-b border-slate-800/40">
        <div>
          <h2 className="text-base font-bold font-fredoka text-slate-100 flex items-center space-x-2">
            <span>{currentWorld.icon}</span>
            <span>{currentWorld.name}</span>
          </h2>
          <p className="text-xs text-slate-400 font-outfit">{currentWorld.subtitle}</p>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold font-fredoka text-amber-400 flex items-center space-x-1 justify-end">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>
              {worldEarnedStars} / {worldLevels.length * 3}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-outfit">World Stars</span>
        </div>
      </div>

      {/* Level Grid */}
      <div className="flex-1 p-5 overflow-y-auto">
        {!isWorldUnlocked ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 rounded-3xl border border-slate-800">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold font-fredoka text-slate-200 mb-1">World Locked</h3>
            <p className="text-xs text-slate-400 mb-4 font-outfit max-w-xs">
              Collect {currentWorld.requiredStars} total stars to unlock this world.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-950/60 border border-amber-500/40 rounded-full text-amber-300 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>
                Need {Math.max(0, currentWorld.requiredStars - saveData.totalStars)} more stars
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3.5 pb-6">
            {worldLevels.map((level) => {
              const progress = saveData.levels[level.id];
              // Level 1 is always unlocked, or if previous level completed or explicitly saved
              const isUnlocked = level.id === 1 || Boolean(progress) || Boolean(saveData.levels[level.id - 1]?.completed);
              const stars = progress?.stars || 0;
              const isCompleted = progress?.completed || false;

              return (
                <button
                  key={level.id}
                  id={`level-card-${level.id}`}
                  disabled={!isUnlocked}
                  onClick={() => {
                    sound.playTap();
                    onSelectLevel(level.id);
                  }}
                  className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all active:scale-95 ${
                    isUnlocked
                      ? isCompleted
                        ? 'bg-slate-900/90 border-slate-700/80 hover:border-amber-500/60 shadow-md'
                        : 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-950/30'
                      : 'bg-slate-950/40 border-slate-900/80 text-slate-600 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Top Level Number */}
                  <span
                    className={`text-xl font-bold font-fredoka mb-1 ${
                      isUnlocked ? 'text-slate-100' : 'text-slate-600'
                    }`}
                  >
                    {level.id}
                  </span>

                  {/* Stars / Lock status */}
                  {isUnlocked ? (
                    <div className="flex items-center space-x-0.5 mt-1">
                      {[1, 2, 3].map((starNum) => (
                        <Star
                          key={starNum}
                          className={`w-3.5 h-3.5 ${
                            stars >= starNum
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700 fill-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-600 mt-1" />
                  )}

                  {/* Level title label */}
                  <span className="text-[10px] text-slate-400 font-outfit mt-1.5 truncate max-w-full text-center">
                    {level.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
