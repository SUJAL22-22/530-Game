import React from 'react';
import { ChevronLeft, Star, Lock, Check } from 'lucide-react';
import { SKINS } from '../data/skins';
import { UserSaveData } from '../types';
import { sound } from '../services/audio';

interface SkinShopModalProps {
  saveData: UserSaveData;
  onSelectSkin: (skinId: string) => void;
  onBack: () => void;
}

export const SkinShopModal: React.FC<SkinShopModalProps> = ({
  saveData,
  onSelectSkin,
  onBack,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col max-w-[440px] mx-auto w-full h-full text-slate-100 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur">
        <button
          id="skin-back-btn"
          onClick={() => {
            sound.playTap();
            onBack();
          }}
          className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-200 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-xl font-bold font-fredoka text-slate-100">Skin Locker</h1>

        {/* Total Stars */}
        <div className="flex items-center space-x-1 px-3 py-1.5 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-amber-300 font-bold font-fredoka text-sm">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{saveData.totalStars}</span>
        </div>
      </div>

      {/* Grid of Skins */}
      <div className="flex-1 p-5 overflow-y-auto">
        <p className="text-xs text-slate-400 mb-4 font-outfit text-center">
          Collect stars across levels to unlock special payload styles and swipe trails!
        </p>

        <div className="grid grid-cols-2 gap-4 pb-6">
          {SKINS.map((skin) => {
            const isUnlocked =
              saveData.totalStars >= skin.unlockStars ||
              saveData.unlockedSkinIds.includes(skin.id);
            const isSelected = saveData.selectedSkinId === skin.id;

            return (
              <button
                key={skin.id}
                id={`skin-card-${skin.id}`}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    sound.playTap();
                    onSelectSkin(skin.id);
                  }
                }}
                className={`relative flex flex-col items-center p-4 rounded-3xl border transition-all text-center ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 shadow-xl shadow-amber-950/40 ring-2 ring-amber-400/40 scale-102'
                    : isUnlocked
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 active:scale-98'
                    : 'bg-slate-950/60 border-slate-900 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Visual Avatar Sphere */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-inner mb-3 relative"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, #ffffff, ${skin.primaryColor} 40%, ${skin.secondaryColor} 90%)`,
                  }}
                >
                  <span className="drop-shadow-md">{skin.emoji}</span>

                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-bold font-fredoka text-slate-100 mb-1">{skin.name}</h3>
                <p className="text-[10px] text-slate-400 font-outfit leading-tight mb-2 h-6 flex items-center justify-center">
                  {skin.description}
                </p>

                {/* Unlock Status / Star Req */}
                {isUnlocked ? (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Equipped' : 'Select'}
                  </span>
                ) : (
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-slate-400 text-xs font-semibold">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>{skin.unlockStars} Stars</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
