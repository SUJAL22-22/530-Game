import React, { useState, useEffect, useCallback } from 'react';
import { GameState, UserSaveData, LevelConfig } from './types';
import { StorageService } from './services/storage';
import { sound } from './services/audio';
import { haptics } from './services/haptics';
import { analytics } from './services/analytics';
import { LEVELS, getLevelById } from './data/levels';

// Components
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/HomeScreen';
import { GameCanvas } from './components/GameCanvas';
import { GameplayHUD } from './components/GameplayHUD';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { FailureModal } from './components/FailureModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { SkinShopModal } from './components/SkinShopModal';
import { HowToPlayModal } from './components/HowToPlayModal';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('SPLASH');
  const [saveData, setSaveData] = useState<UserSaveData>(() => StorageService.load());
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [levelKey, setLevelKey] = useState<number>(0); // key to force re-mounting physics engine on retry
  const [showHint, setShowHint] = useState<boolean>(false);
  const [starsCollected, setStarsCollected] = useState<number>(0);
  const [cutsCount, setCutsCount] = useState<number>(0);

  // Victory / Defeat Modal Data
  const [victoryData, setVictoryData] = useState<{
    stars: number;
    cuts: number;
    timeSec: number;
    isNewRecord: boolean;
  } | null>(null);
  const [failureReason, setFailureReason] = useState<string>('');

  const currentLevel: LevelConfig = getLevelById(currentLevelId);

  // Initialize Sound and Haptics from Save Data
  useEffect(() => {
    sound.setSoundEnabled(saveData.soundEnabled);
    sound.setMusicEnabled(saveData.musicEnabled);
    haptics.setEnabled(saveData.hapticsEnabled);
  }, [saveData.soundEnabled, saveData.musicEnabled, saveData.hapticsEnabled]);

  // Handle Tab / App Backgrounding
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === 'GAMEPLAY') {
        setGameState('PAUSED');
        analytics.logEvent('pause', { reason: 'app_backgrounded', level: currentLevelId });
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gameState, currentLevelId]);

  // Start Playing a Level
  const startLevel = useCallback((levelId: number) => {
    setCurrentLevelId(levelId);
    setLevelKey((prev) => prev + 1);
    setShowHint(false);
    setStarsCollected(0);
    setCutsCount(0);
    setVictoryData(null);
    setFailureReason('');
    setGameState('GAMEPLAY');
    analytics.logEvent('game_start', { level: levelId });
  }, []);

  // Level Victory Callback
  const handleVictory = useCallback(
    (stars: number, cuts: number, timeSec: number) => {
      const existing = saveData.levels[currentLevelId];
      const previousBestScore = existing?.bestScore || 0;

      // Base score calculation
      const totalScore = 1000 + stars * 500 + Math.max(0, 300 - timeSec * 10) + Math.max(0, 200 - cuts * 20);
      const isNewRecord = totalScore > previousBestScore;

      // Persist Result
      const updatedSave = StorageService.saveLevelResult(
        currentLevelId,
        stars,
        totalScore,
        timeSec,
        stars
      );
      setSaveData(updatedSave);

      setVictoryData({
        stars,
        cuts,
        timeSec,
        isNewRecord,
      });

      setGameState('SUCCESS');
      analytics.logEvent('level_complete', {
        level: currentLevelId,
        stars,
        cuts,
        time: timeSec,
        score: totalScore,
      });
    },
    [currentLevelId, saveData]
  );

  // Level Defeat Callback
  const handleDefeat = useCallback(
    (reason: string) => {
      setFailureReason(reason);
      setGameState('FAILURE');
      analytics.logEvent('level_fail', { level: currentLevelId, reason });
    },
    [currentLevelId]
  );

  // Update Settings
  const handleUpdateSettings = (partial: Partial<UserSaveData>) => {
    const updated = { ...saveData, ...partial };
    StorageService.save(updated);
    setSaveData(updated);
  };

  // Reset Progress
  const handleResetProgress = () => {
    const fresh = StorageService.resetProgress();
    setSaveData(fresh);
    setCurrentLevelId(1);
    setGameState('HOME');
  };

  return (
    <main
      id="rope-cut-game-root"
      className="relative w-screen h-screen max-w-[440px] max-h-[100dvh] mx-auto overflow-hidden bg-slate-950 flex flex-col justify-center items-center shadow-2xl font-outfit"
    >
      {/* 1. Splash Screen */}
      {gameState === 'SPLASH' && (
        <SplashScreen
          onStart={() => {
            // First time tutorial check
            if (!saveData.tutorialCompleted) {
              setGameState('HOW_TO_PLAY');
            } else {
              setGameState('HOME');
            }
          }}
        />
      )}

      {/* 2. Home Screen */}
      {gameState === 'HOME' && (
        <HomeScreen
          saveData={saveData}
          onPlay={(lvlId) => startLevel(lvlId)}
          onOpenLevels={() => setGameState('LEVEL_SELECT')}
          onOpenSkins={() => setGameState('SKINS')}
          onOpenSettings={() => setGameState('SETTINGS')}
          onOpenTutorial={() => setGameState('HOW_TO_PLAY')}
        />
      )}

      {/* 3. Level Selection */}
      {gameState === 'LEVEL_SELECT' && (
        <LevelSelectModal
          saveData={saveData}
          onSelectLevel={(lvlId) => startLevel(lvlId)}
          onBack={() => setGameState('HOME')}
        />
      )}

      {/* 4. Active Gameplay View & HUD */}
      {(gameState === 'GAMEPLAY' ||
        gameState === 'PAUSED' ||
        gameState === 'SUCCESS' ||
        gameState === 'FAILURE') && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <GameplayHUD
            level={currentLevel}
            starsCollected={starsCollected}
            cutsCount={cutsCount}
            cutLimit={currentLevel.cutLimit}
            showHint={showHint}
            onPause={() => {
              setGameState('PAUSED');
              analytics.logEvent('pause', { level: currentLevelId });
            }}
            onRestart={() => startLevel(currentLevelId)}
            onToggleHint={() => setShowHint((prev) => !prev)}
          />

          <GameCanvas
            key={levelKey}
            level={currentLevel}
            skinId={saveData.selectedSkinId}
            isPaused={gameState === 'PAUSED' || gameState === 'SUCCESS' || gameState === 'FAILURE'}
            showHint={showHint}
            onVictory={handleVictory}
            onDefeat={handleDefeat}
            onCutsChange={(cuts) => setCutsCount(cuts)}
            onStarsChange={(stars) => setStarsCollected(stars)}
          />
        </div>
      )}

      {/* 5. Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => {
            setGameState('GAMEPLAY');
            analytics.logEvent('resume', { level: currentLevelId });
          }}
          onRestart={() => startLevel(currentLevelId)}
          onLevelSelect={() => setGameState('LEVEL_SELECT')}
          soundEnabled={saveData.soundEnabled}
          musicEnabled={saveData.musicEnabled}
          onToggleSound={() => {
            const next = !saveData.soundEnabled;
            handleUpdateSettings({ soundEnabled: next });
            sound.setSoundEnabled(next);
          }}
          onToggleMusic={() => {
            const next = !saveData.musicEnabled;
            handleUpdateSettings({ musicEnabled: next });
            sound.setMusicEnabled(next);
          }}
        />
      )}

      {/* 6. Victory Modal */}
      {gameState === 'SUCCESS' && victoryData && (
        <VictoryModal
          levelId={currentLevelId}
          levelTitle={currentLevel.title}
          starsEarned={victoryData.stars}
          cutsUsed={victoryData.cuts}
          timeSec={victoryData.timeSec}
          bestScore={saveData.levels[currentLevelId]?.bestScore || 0}
          isNewRecord={victoryData.isNewRecord}
          hasNextLevel={currentLevelId < LEVELS.length}
          onNextLevel={() => startLevel(currentLevelId + 1)}
          onReplay={() => startLevel(currentLevelId)}
          onHome={() => setGameState('HOME')}
        />
      )}

      {/* 7. Failure Modal */}
      {gameState === 'FAILURE' && (
        <FailureModal
          levelId={currentLevelId}
          reason={failureReason}
          hintText={currentLevel.hint?.text}
          onRetry={() => startLevel(currentLevelId)}
          onLevelSelect={() => setGameState('LEVEL_SELECT')}
          onShowHint={() => {
            setShowHint(true);
            startLevel(currentLevelId);
          }}
        />
      )}

      {/* 8. Settings Modal */}
      {gameState === 'SETTINGS' && (
        <SettingsModal
          saveData={saveData}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleResetProgress}
          onOpenTutorial={() => setGameState('HOW_TO_PLAY')}
          onBack={() => setGameState('HOME')}
        />
      )}

      {/* 9. Skin Shop Locker */}
      {gameState === 'SKINS' && (
        <SkinShopModal
          saveData={saveData}
          onSelectSkin={(skinId) => {
            handleUpdateSettings({ selectedSkinId: skinId });
            analytics.logEvent('skin_change', { skinId });
          }}
          onBack={() => setGameState('HOME')}
        />
      )}

      {/* 10. How To Play Modal */}
      {gameState === 'HOW_TO_PLAY' && (
        <HowToPlayModal
          onClose={() => {
            if (!saveData.tutorialCompleted) {
              handleUpdateSettings({ tutorialCompleted: true });
              analytics.logEvent('tutorial_complete', {});
            }
            setGameState('HOME');
          }}
        />
      )}
    </main>
  );
}
