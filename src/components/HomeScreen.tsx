import React from 'react';
import { Play, LayoutGrid, Sparkles, Settings, HelpCircle, Star, Trophy, Palette, ChevronRight } from 'lucide-react';
import { UserSaveData, LevelProgress } from '../types';
import { WORLDS, LEVELS } from '../data/levels';
import { getSkinById } from '../data/skins';
import { sound } from '../services/audio';

interface HomeScreenProps {
  saveData: UserSaveData;
  onPlay: (levelId: number) => void;
  onOpenLevels: () => void;
  onOpenSkins: () => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  saveData,
  onPlay,
  onOpenLevels,
  onOpenSkins,
  onOpenSettings,
  onOpenTutorial,
}) => {
  // Find highest unlocked uncompleted level or level 1
  let nextLevelId = 1;
  for (let i = 1; i <= LEVELS.length; i++) {
    const p = saveData.levels[i];
    if (!p || !p.completed) {
      nextLevelId = i;
      break;
    }
  }
  if (nextLevelId > LEVELS.length) nextLevelId = LEVELS.length;

  const activeLevel = LEVELS.find((l) => l.id === nextLevelId) || LEVELS[0];
  const activeWorld = WORLDS.find((w) => w.id === activeLevel.worldId) || WORLDS[0];
  const equippedSkin = getSkinById(saveData.selectedSkinId);

  // Total completed levels count
  const completedCount = (Object.values(saveData.levels) as LevelProgress[]).filter((l) => l?.completed).length;

  return (
    <div className="relative z-10 flex flex-col justify-between max-w-[440px] mx-auto w-full h-full p-5 text-slate-100 select-none overflow-y-auto">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        {/* Star Badges */}
        <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-md">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400 glow-gold" />
          <span className="font-bold font-fredoka text-base text-amber-300">
            {saveData.totalStars}{' '}
            <span className="text-xs text-slate-500 font-normal">/ {LEVELS.length * 3}</span>
          </span>
        </div>

        {/* Top Right Utility Buttons */}
        <div className="flex items-center space-x-2">
          <button
            id="home-skins-btn"
            onClick={() => {
              sound.playTap();
              onOpenSkins();
            }}
            aria-label="Open skin locker"
            className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:border-amber-500/50 active:scale-95 transition-all"
          >
            <Palette className="w-5 h-5 text-pink-400" />
          </button>

          <button
            id="home-tutorial-btn"
            onClick={() => {
              sound.playTap();
              onOpenTutorial();
            }}
            aria-label="How to play tutorial"
            className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:border-amber-500/50 active:scale-95 transition-all"
          >
            <HelpCircle className="w-5 h-5 text-amber-400" />
          </button>

          <button
            id="home-settings-btn"
            onClick={() => {
              sound.playTap();
              onOpenSettings();
            }}
            aria-label="Settings"
            className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:border-amber-500/50 active:scale-95 transition-all"
          >
            <Settings className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Main Title & Hero Banner */}
      <div className="flex flex-col items-center my-auto py-6 text-center">
        {/* Animated Hanging Visual */}
        <div className="relative mb-6">
          <div className="w-1 h-16 bg-amber-700 mx-auto rounded-full" />
          <div
            className="w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-4xl border-2 border-white/20 -mt-1 transform hover:rotate-12 transition-transform cursor-pointer"
            onClick={() => {
              sound.playTap();
              onOpenSkins();
            }}
            style={{
              background: `radial-gradient(circle at 35% 35%, #ffffff, ${equippedSkin.primaryColor} 40%, ${equippedSkin.secondaryColor} 90%)`,
            }}
          >
            <span className="drop-shadow-md">{equippedSkin.emoji}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold mt-2 block">
            {equippedSkin.name}
          </span>
        </div>

        <h1 className="text-4xl font-extrabold font-fredoka tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-teal-400">
          Rope Cut
        </h1>
        <p className="text-xs text-slate-400 font-outfit mt-1">30 Puzzles across 5 Themed Worlds</p>

        {/* Current Mission Progress Card */}
        <div
          onClick={() => {
            sound.playTap();
            onOpenLevels();
          }}
          className="mt-6 w-full max-w-xs bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 rounded-3xl p-4 shadow-xl flex items-center justify-between cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{activeWorld.icon}</span>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-outfit">
                World {activeWorld.id} • {activeWorld.name}
              </span>
              <h3 className="text-sm font-bold font-fredoka text-slate-100">
                Level {activeLevel.id}: {activeLevel.title}
              </h3>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="w-full space-y-3 pb-4">
        {/* Play Current Button */}
        <button
          id="home-play-btn"
          onClick={() => {
            sound.playTap();
            onPlay(nextLevelId);
          }}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-teal-500 hover:from-amber-300 hover:to-teal-400 text-slate-950 font-extrabold font-fredoka text-xl rounded-2xl shadow-xl shadow-amber-950/50 flex items-center justify-center space-x-3 active:scale-98 transition-all"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>Play Level {nextLevelId}</span>
        </button>

        {/* Level Select & Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="home-level-select-btn"
            onClick={() => {
              sound.playTap();
              onOpenLevels();
            }}
            className="py-3 px-4 bg-slate-900/80 hover:bg-slate-800/80 text-slate-200 font-bold font-fredoka text-sm rounded-2xl border border-slate-800 flex items-center justify-center space-x-2 active:scale-98 transition-all shadow-md"
          >
            <LayoutGrid className="w-4 h-4 text-sky-400" />
            <span>All Levels</span>
          </button>

          <div className="py-3 px-4 bg-slate-900/80 text-slate-200 font-semibold font-outfit text-xs rounded-2xl border border-slate-800 flex items-center justify-center space-x-2 shadow-md">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>
              {completedCount} / {LEVELS.length} Cleared
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
