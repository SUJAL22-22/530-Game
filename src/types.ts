export type GameState =
  | 'SPLASH'
  | 'HOME'
  | 'LEVEL_SELECT'
  | 'GAMEPLAY'
  | 'PAUSED'
  | 'SUCCESS'
  | 'FAILURE'
  | 'HOW_TO_PLAY'
  | 'SETTINGS'
  | 'SKINS';

export interface Vector2 {
  x: number;
  y: number;
}

export interface RopeNode {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  isPinned?: boolean;
}

export interface RopeConfig {
  id: string;
  anchor: Vector2;
  // If moving anchor
  movingAnchor?: {
    axis: 'x' | 'y';
    range: number;
    speed: number;
    offset?: number;
  };
  attachedToPayload?: boolean;
  targetPoint?: Vector2; // Custom target if not attached to payload
  segmentsCount?: number;
  length?: number;
  stiffness?: number;
  color?: string;
}

export interface RuntimeRope {
  id: string;
  anchor: Vector2;
  currentAnchor: Vector2;
  movingAnchor?: {
    axis: 'x' | 'y';
    range: number;
    speed: number;
    offset?: number;
  };
  nodes: RopeNode[];
  segmentLength: number;
  isCut: boolean;
  cutIndex?: number;
  attachedToPayload: boolean;
  color: string;
  cutTime?: number;
}

export interface Obstacle {
  id: string;
  type: 'box' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number; // In radians
  restitution?: number; // Bounciness (0.2 - 0.8)
  friction?: number;
  isMoving?: boolean;
  movement?: {
    axis: 'x' | 'y' | 'rotate';
    range: number;
    speed: number;
    offset?: number;
  };
  color?: string;
}

export interface SpikeHazard {
  id: string;
  type: 'spikes_bar' | 'saw' | 'laser';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  angle?: number;
  isMoving?: boolean;
  movement?: {
    axis: 'x' | 'y';
    range: number;
    speed: number;
    offset?: number;
  };
}

export interface Fan {
  id: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  range: number;
  width: number;
  force: number;
  active?: boolean;
}

export interface BreakablePlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  durability: number; // e.g. 1 hit to break
  isBroken: boolean;
}

export interface Portal {
  id: string;
  entry: Vector2;
  exit: Vector2;
  entryAngle?: number; // in radians
  exitAngle?: number;
  radius: number;
  color?: string;
  cooldown?: number; // prevents immediate re-entry loop
}

export interface CollectibleToken {
  id: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export interface TargetZone {
  x: number;
  y: number;
  radius: number;
  color?: string;
  label?: string;
}

export interface BubbleEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  hasPayload: boolean;
  isPopped: boolean;
}

export interface LevelConfig {
  id: number;
  worldId: number;
  worldName: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Master';
  payloadStart: Vector2;
  payloadRadius?: number;
  payloadMass?: number;
  target: TargetZone;
  ropes: RopeConfig[];
  obstacles?: Obstacle[];
  hazards?: SpikeHazard[];
  fans?: Fan[];
  breakables?: BreakablePlatform[];
  portals?: Portal[];
  collectibles: CollectibleToken[];
  bubbles?: BubbleEntity[];
  cutLimit?: number;
  timeTargetSec?: number;
  hint?: {
    text: string;
    cutRopeIds?: string[];
    suggestedPath?: Vector2[];
  };
}

export interface WorldInfo {
  id: number;
  name: string;
  subtitle: string;
  theme: 'forest' | 'desert' | 'industrial' | 'frost' | 'cosmic';
  icon: string;
  bgGradient: string;
  levelsCount: number;
  requiredStars: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  rotation?: number;
  rotSpeed?: number;
  shape?: 'circle' | 'rect' | 'star' | 'fiber';
}

export interface SwipePoint {
  x: number;
  y: number;
  time: number;
}

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  stars: number;
  bestScore: number;
  bestTime: number;
  tokensCollected: number;
}

export interface UserSaveData {
  version: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  tutorialCompleted: boolean;
  selectedSkinId: string;
  unlockedSkinIds: string[];
  totalStars: number;
  currentWorld: number;
  levels: Record<number, LevelProgress>;
}

export interface Skin {
  id: string;
  name: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
  unlockStars: number;
  description: string;
  trailColor: string;
}
