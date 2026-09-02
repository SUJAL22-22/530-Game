import React, { useEffect, useState } from 'react';
import { Star, RotateCcw, ArrowRight, Home, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../services/audio';

interface VictoryModalProps {
  levelId: number;
  levelTitle: string;
  starsEarned: number; // 0 to 3
  cutsUsed: number;
  timeSec: number;
  bestScore: number;
  isNewRecord: boolean;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelId,
  levelTitle,
  starsEarned,
  cutsUsed,
  timeSec,
  bestScore,
  isNewRecord,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onHome,
}) => {
  const [animatedStars, setAnimatedStars] = useState<number>(0);

  // Computed total score
  const baseScore = 1000;
  const starScore = starsEarned * 500;
  const timeBonus = Math.max(0, 300 - timeSec * 10);
  const cutBonus = Math.max(0, 200 - cutsUsed * 20);
  const totalScore = baseScore + starScore + timeBonus + cutBonus;

  useEffect(() => {
    // Fire festive celebration confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#38bdf8', '#4ade80', '#f472b6', '#a78bfa'],
    });

    // Staggered star reveal with chimes
    const t1 = setTimeout(() => {
      if (starsEarned >= 1) {
        setAnimatedStars(1);
        sound.playStarCollect(0);
      }
    }, 400);

    const t2 = setTimeout(() => {
      if (starsEarned >= 2) {
        setAnimatedStars(2);
        sound.playStarCollect(1);
      }
    }, 850);

    const t3 = setTimeout(() => {
      if (starsEarned >= 3) {
        setAnimatedStars(3);
        sound.playStarCollect(2);
        // Extra confetti for 3 stars!
        confetti({
          particleCount: 50,
          spread: 90,
          origin: { y: 0.5 },
        });
      }
    }, 1300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [starsEarned]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow Header Background */}
        <div className="absolute -top-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Level Tag */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Level {levelId} Cleared!</span>
        </div>

        <h2 className="text-2xl font-bold font-fredoka text-slate-100 mb-4">{levelTitle}</h2>

        {/* Animated Stars Rating */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          {[1, 2, 3].map((starNum) => {
            const isEarned = animatedStars >= starNum;
            return (
              <div
                key={starNum}
                className={`transition-all duration-500 transform ${
                  isEarned
                    ? 'scale-125 text-amber-400 glow-gold'
                    : 'scale-90 text-slate-700 opacity-60'
                }`}
              >
                <Star
                  className={`w-12 h-12 ${
                    isEarned ? 'fill-amber-400' : 'fill-slate-800'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Score Breakdown Card */}
        <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Stars Bonus</span>
            <span className="font-semibold text-slate-200">+{starScore}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Time Bonus ({timeSec}s)</span>
            <span className="font-semibold text-slate-200">+{timeBonus}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Cuts Efficiency ({cutsUsed} cuts)</span>
            <span className="font-semibold text-slate-200">+{cutBonus}</span>
          </div>

          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-300 font-outfit">Total Score</span>
            <span className="text-xl font-bold font-fredoka text-emerald-400">
              {totalScore.toLocaleString()}
            </span>
          </div>

          {isNewRecord && (
            <div className="mt-2 text-center text-xs font-semibold text-amber-300 flex items-center justify-center space-x-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>New High Score!</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="w-full flex flex-col space-y-3">
          {hasNextLevel ? (
            <button
              id="victory-next-btn"
              onClick={() => {
                sound.playTap();
                onNextLevel();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold font-fredoka text-lg rounded-2xl shadow-lg shadow-amber-950/50 flex items-center justify-center space-x-2 active:scale-98 transition-all"
            >
              <span>Next Level</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="text-sm font-semibold text-emerald-400 mb-1">
              🎉 Congratulations! You have mastered all levels!
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              id="victory-replay-btn"
              onClick={() => {
                sound.playTap();
                onReplay();
              }}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold font-outfit text-sm rounded-2xl border border-slate-700/60 flex items-center justify-center space-x-2 active:scale-98 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Replay</span>
            </button>

            <button
              id="victory-home-btn"
              onClick={() => {
                sound.playTap();
                onHome();
              }}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold font-outfit text-sm rounded-2xl border border-slate-700/60 flex items-center justify-center space-x-2 active:scale-98 transition-all"
            >
              <Home className="w-4 h-4 text-sky-400" />
              <span>Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
