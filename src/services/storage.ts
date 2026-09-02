import { UserSaveData, LevelProgress } from '../types';

const SAVE_KEY = 'rope_cut_save_v1';

export const DEFAULT_SAVE_DATA: UserSaveData = {
  version: 1,
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  reducedMotion: false,
  tutorialCompleted: false,
  selectedSkinId: 'candy',
  unlockedSkinIds: ['candy', 'star_ball'],
  totalStars: 0,
  currentWorld: 1,
  levels: {
    1: {
      levelId: 1,
      completed: false,
      stars: 0,
      bestScore: 0,
      bestTime: 0,
      tokensCollected: 0,
    },
  },
};

export class StorageService {
  public static load(): UserSaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return { ...DEFAULT_SAVE_DATA };
      }
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') {
        return { ...DEFAULT_SAVE_DATA };
      }

      // Merge defaults to guarantee all fields exist
      const merged: UserSaveData = {
        ...DEFAULT_SAVE_DATA,
        ...data,
        levels: {
          ...DEFAULT_SAVE_DATA.levels,
          ...(data.levels || {}),
        },
      };

      // Recalculate total stars from levels
      let stars = 0;
      (Object.values(merged.levels) as LevelProgress[]).forEach((lvl) => {
        stars += lvl?.stars || 0;
      });
      merged.totalStars = stars;

      return merged;
    } catch (err) {
      console.warn('Failed to load save data from localStorage, using defaults', err);
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  public static save(data: UserSaveData): void {
    try {
      // Calculate total stars
      let stars = 0;
      (Object.values(data.levels) as LevelProgress[]).forEach((lvl) => {
        stars += lvl?.stars || 0;
      });
      data.totalStars = stars;

      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save data to localStorage', err);
    }
  }

  public static saveLevelResult(
    levelId: number,
    stars: number,
    score: number,
    timeSec: number,
    tokens: number
  ): UserSaveData {
    const current = this.load();
    const existing = current.levels[levelId] || {
      levelId,
      completed: false,
      stars: 0,
      bestScore: 0,
      bestTime: 999999,
      tokensCollected: 0,
    };

    current.levels[levelId] = {
      levelId,
      completed: true,
      stars: Math.max(existing.stars, stars),
      bestScore: Math.max(existing.bestScore, score),
      bestTime: existing.bestTime === 0 ? timeSec : Math.min(existing.bestTime, timeSec),
      tokensCollected: Math.max(existing.tokensCollected, tokens),
    };

    // Unlock next level automatically
    const nextLevelId = levelId + 1;
    if (nextLevelId <= 30 && !current.levels[nextLevelId]) {
      current.levels[nextLevelId] = {
        levelId: nextLevelId,
        completed: false,
        stars: 0,
        bestScore: 0,
        bestTime: 0,
        tokensCollected: 0,
      };
    }

    this.save(current);
    return current;
  }

  public static resetProgress(): UserSaveData {
    const fresh = { ...DEFAULT_SAVE_DATA };
    this.save(fresh);
    return fresh;
  }
}
