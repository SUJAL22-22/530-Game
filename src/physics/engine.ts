import {
  LevelConfig,
  RuntimeRope,
  RopeNode,
  Vector2,
  Particle,
  SwipePoint,
  CollectibleToken,
  BreakablePlatform,
  Portal,
  Fan,
  Obstacle,
  SpikeHazard,
} from '../types';
import { sound } from '../services/audio';
import { haptics } from '../services/haptics';

export interface PhysicsState {
  payload: {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
    vx: number;
    vy: number;
    radius: number;
    rotation: number;
    angularVelocity: number;
    isDead: boolean;
    isWon: boolean;
    inBubble: boolean;
  };
  ropes: RuntimeRope[];
  obstacles: Obstacle[];
  hazards: SpikeHazard[];
  fans: Fan[];
  breakables: BreakablePlatform[];
  portals: Portal[];
  collectibles: CollectibleToken[];
  particles: Particle[];
  cutsCount: number;
  timeElapsed: number;
  status: 'active' | 'success' | 'failure';
  failureReason?: string;
  portalCooldown: number;
}

// Line intersection helper (p1->p2 with p3->p4)
export function lineIntersection(
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  p4: Vector2
): Vector2 | null {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 0.0001) return null;

  const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

  if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    return {
      x: p1.x + u * (p2.x - p1.x),
      y: p1.y + u * (p2.y - p1.y),
    };
  }
  return null;
}

export function dist(p1: Vector2, p2: Vector2): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distPointToSegment(p: Vector2, a: Vector2, b: Vector2): number {
  const l2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
  if (l2 === 0) return dist(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}

export class PhysicsEngine {
  public state: PhysicsState;
  public config: LevelConfig;
  private gravity: number = 850; // px/s²
  private airFriction: number = 0.994;

  constructor(config: LevelConfig) {
    this.config = config;
    this.state = this.initPhysicsState(config);
  }

  public initPhysicsState(config: LevelConfig): PhysicsState {
    const payloadRadius = config.payloadRadius || 20;
    const px = config.payloadStart.x;
    const py = config.payloadStart.y;

    // Initialize runtime ropes with Verlet chains
    const ropes: RuntimeRope[] = config.ropes.map((r) => {
      const segCount = r.segmentsCount || 10;
      const target = r.attachedToPayload ? { x: px, y: py } : r.targetPoint || { x: px, y: py };
      const totalLen = r.length || dist(r.anchor, target);
      const segLen = totalLen / segCount;

      const nodes: RopeNode[] = [];
      for (let i = 0; i <= segCount; i++) {
        const ratio = i / segCount;
        const nx = r.anchor.x + (target.x - r.anchor.x) * ratio;
        const ny = r.anchor.y + (target.y - r.anchor.y) * ratio;
        nodes.push({
          x: nx,
          y: ny,
          oldX: nx,
          oldY: ny,
          isPinned: i === 0,
        });
      }

      return {
        id: r.id,
        anchor: { ...r.anchor },
        currentAnchor: { ...r.anchor },
        movingAnchor: r.movingAnchor ? { ...r.movingAnchor } : undefined,
        nodes,
        segmentLength: segLen,
        isCut: false,
        attachedToPayload: r.attachedToPayload ?? true,
        color: r.color || '#e2e8f0',
      };
    });

    return {
      payload: {
        x: px,
        y: py,
        oldX: px,
        oldY: py,
        vx: 0,
        vy: 0,
        radius: payloadRadius,
        rotation: 0,
        angularVelocity: 0,
        isDead: false,
        isWon: false,
        inBubble: false,
      },
      ropes,
      obstacles: (config.obstacles || []).map((o) => ({ ...o })),
      hazards: (config.hazards || []).map((h) => ({ ...h })),
      fans: (config.fans || []).map((f) => ({ ...f, active: true })),
      breakables: (config.breakables || []).map((b) => ({ ...b, isBroken: false })),
      portals: (config.portals || []).map((p) => ({ ...p, cooldown: 0 })),
      collectibles: config.collectibles.map((c) => ({ ...c, collected: false })),
      particles: [],
      cutsCount: 0,
      timeElapsed: 0,
      status: 'active',
      portalCooldown: 0,
    };
  }

  // Handle Swipe Cut Gesture (supports line intersection and proximity tolerance)
  public checkSwipeCut(p1: SwipePoint, p2: SwipePoint): boolean {
    if (this.state.status !== 'active') return false;

    let didCut = false;
    const cutLimit = this.config.cutLimit;

    for (const rope of this.state.ropes) {
      if (rope.isCut) continue;

      if (cutLimit && this.state.cutsCount >= cutLimit) {
        break;
      }

      for (let i = 0; i < rope.nodes.length - 1; i++) {
        const nodeA = rope.nodes[i];
        const nodeB = rope.nodes[i + 1];

        const hit = lineIntersection(p1, p2, nodeA, nodeB);
        const nearP1 = distPointToSegment(p1, nodeA, nodeB) < 14;
        const nearP2 = distPointToSegment(p2, nodeA, nodeB) < 14;

        if (hit || nearP1 || nearP2) {
          const cutX = hit ? hit.x : (nodeA.x + nodeB.x) / 2;
          const cutY = hit ? hit.y : (nodeA.y + nodeB.y) / 2;

          // Cut this rope!
          rope.isCut = true;
          rope.cutIndex = i;
          rope.cutTime = this.state.timeElapsed;
          this.state.cutsCount++;
          didCut = true;

          // Sound & Haptics
          sound.playRopeCut();
          haptics.medium();

          // Spawn rope cut particles
          this.spawnRopeParticles(cutX, cutY, rope.color);

          // Impulse kick on payload
          const impulseAngle = Math.atan2(nodeB.y - nodeA.y, nodeB.x - nodeA.x) + Math.PI / 2;
          this.state.payload.vx += Math.cos(impulseAngle) * 30;
          this.state.payload.vy += Math.sin(impulseAngle) * 30;

          break; // Stop checking this rope once cut
        }
      }
    }

    return didCut;
  }

  private spawnRopeParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        color: i % 2 === 0 ? color : '#fbbf24',
        size: 2 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
        shape: 'fiber',
      });
    }
  }

  // Primary Physics Step (called 60 times per second with delta dt)
  public step(dt: number) {
    if (this.state.status !== 'active') {
      this.updateParticles(dt);
      return;
    }

    // Clamp dt for stability
    const clampedDt = Math.min(dt, 0.033);
    this.state.timeElapsed += clampedDt;

    // Sub-stepping for smooth, tunneling-free physics
    const subSteps = 6;
    const subDt = clampedDt / subSteps;

    for (let step = 0; step < subSteps; step++) {
      this.subStep(subDt);
    }

    this.updateParticles(clampedDt);
    this.checkGameConditions();
  }

  private subStep(dt: number) {
    const { payload, ropes } = this.state;
    const t = this.state.timeElapsed;

    // 1. Update moving obstacles and moving rope anchors
    this.updateMovingEntities(t);

    // 2. Apply Forces on Payload
    if (!payload.isDead && !payload.isWon) {
      if (payload.inBubble) {
        // Bubble buoyancy (float upward smoothly)
        payload.vy -= 180 * dt;
        payload.vx *= 0.98;
        payload.vy *= 0.98;
      } else {
        // Standard gravity
        payload.vy += this.gravity * dt;
      }

      // Air resistance
      payload.vx *= this.airFriction;
      payload.vy *= this.airFriction;

      // Fan Forces
      for (const fan of this.state.fans) {
        if (!fan.active) continue;
        this.applyFanForce(fan, dt);
      }

      // Verlet / Euler integrate payload position
      payload.x += payload.vx * dt;
      payload.y += payload.vy * dt;

      // Update rotation
      payload.rotation += payload.angularVelocity * dt;
      payload.angularVelocity *= 0.98;
    }

    // 3. Update Rope Nodes (Verlet Integration)
    for (const rope of ropes) {
      // Update pinned anchor if moving
      if (rope.movingAnchor) {
        const ma = rope.movingAnchor;
        const offset = ma.offset || 0;
        if (ma.axis === 'x') {
          rope.currentAnchor.x = rope.anchor.x + Math.sin(t * ma.speed + offset) * ma.range;
        } else {
          rope.currentAnchor.y = rope.anchor.y + Math.sin(t * ma.speed + offset) * ma.range;
        }
      }

      const count = rope.nodes.length;
      for (let i = 0; i < count; i++) {
        const node = rope.nodes[i];
        if (i === 0) {
          node.x = rope.currentAnchor.x;
          node.y = rope.currentAnchor.y;
          node.oldX = node.x;
          node.oldY = node.y;
          continue;
        }

        // If not pinned, integrate Verlet
        const vx = (node.x - node.oldX) * 0.99;
        const vy = (node.y - node.oldY) * 0.99 + this.gravity * 0.5 * dt * dt;

        node.oldX = node.x;
        node.oldY = node.y;
        node.x += vx;
        node.y += vy;
      }

      // If uncut and attached to payload, tether last node to payload
      if (!rope.isCut && rope.attachedToPayload && !payload.isDead) {
        const lastNode = rope.nodes[count - 1];
        lastNode.x = payload.x;
        lastNode.y = payload.y;
      }
    }

    // 4. Relax Constraints (Rope distance constraints & payload tension)
    const iterations = 6;
    for (let iter = 0; iter < iterations; iter++) {
      for (const rope of ropes) {
        const count = rope.nodes.length;

        // If cut, only solve constraints for the segments on either side
        if (rope.isCut && rope.cutIndex !== undefined) {
          // Upper section (anchor to cutIndex)
          for (let i = 0; i < rope.cutIndex; i++) {
            this.relaxSegment(rope.nodes[i], rope.nodes[i + 1], rope.segmentLength);
          }
          // Lower section (cutIndex+1 to end)
          for (let i = rope.cutIndex + 1; i < count - 1; i++) {
            this.relaxSegment(rope.nodes[i], rope.nodes[i + 1], rope.segmentLength);
          }
        } else {
          // Uncut rope
          for (let i = 0; i < count - 1; i++) {
            this.relaxSegment(rope.nodes[i], rope.nodes[i + 1], rope.segmentLength);
          }

          // Anchor & Payload connection relaxation
          if (rope.attachedToPayload && !payload.isDead) {
            const lastNode = rope.nodes[count - 1];
            const dx = payload.x - lastNode.x;
            const dy = payload.y - lastNode.y;
            payload.x = lastNode.x;
            payload.y = lastNode.y;
            payload.vx -= dx / dt;
            payload.vy -= dy / dt;
          }
        }
      }
    }

    // 5. Check Collisions: Payload vs Obstacles, Breakables, Portals, Hazards
    this.handleCollisions();
  }

  private relaxSegment(n1: RopeNode, n2: RopeNode, targetDist: number) {
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const currentDist = Math.sqrt(dx * dx + dy * dy);
    if (currentDist === 0) return;

    const diff = (targetDist - currentDist) / currentDist;
    const offsetX = dx * diff * 0.5;
    const offsetY = dy * diff * 0.5;

    if (!n1.isPinned) {
      n1.x -= offsetX;
      n1.y -= offsetY;
    }
    if (!n2.isPinned) {
      n2.x += offsetX;
      n2.y += offsetY;
    }
  }

  private updateMovingEntities(t: number) {
    // Moving obstacles
    for (const obs of this.state.obstacles) {
      if (!obs.isMoving || !obs.movement) continue;
      const m = obs.movement;
      const offset = m.offset || 0;
      if (m.axis === 'x') {
        obs.x += Math.cos(t * m.speed + offset) * (m.range * 0.05);
      } else if (m.axis === 'y') {
        obs.y += Math.cos(t * m.speed + offset) * (m.range * 0.05);
      } else if (m.axis === 'rotate') {
        obs.rotation = (obs.rotation || 0) + m.speed * 0.02;
      }
    }

    // Moving hazards
    for (const haz of this.state.hazards) {
      if (!haz.isMoving || !haz.movement) continue;
      const m = haz.movement;
      const offset = m.offset || 0;
      if (m.axis === 'x') {
        haz.x += Math.cos(t * m.speed + offset) * (m.range * 0.05);
      } else if (m.axis === 'y') {
        haz.y += Math.cos(t * m.speed + offset) * (m.range * 0.05);
      }
    }
  }

  private applyFanForce(fan: Fan, dt: number) {
    const { payload } = this.state;
    let inStream = false;
    let distToFan = 0;

    if (fan.direction === 'right') {
      if (payload.x >= fan.x && payload.x <= fan.x + fan.range && Math.abs(payload.y - fan.y) <= fan.width / 2) {
        inStream = true;
        distToFan = payload.x - fan.x;
        const force = fan.force * 60 * (1 - distToFan / fan.range);
        payload.vx += force * dt;
      }
    } else if (fan.direction === 'left') {
      if (payload.x <= fan.x && payload.x >= fan.x - fan.range && Math.abs(payload.y - fan.y) <= fan.width / 2) {
        inStream = true;
        distToFan = fan.x - payload.x;
        const force = fan.force * 60 * (1 - distToFan / fan.range);
        payload.vx -= force * dt;
      }
    } else if (fan.direction === 'up') {
      if (payload.y <= fan.y && payload.y >= fan.y - fan.range && Math.abs(payload.x - fan.x) <= fan.width / 2) {
        inStream = true;
        distToFan = fan.y - payload.y;
        const force = fan.force * 75 * (1 - distToFan / fan.range);
        payload.vy -= force * dt;
      }
    }

    if (inStream && Math.random() < 0.2) {
      // Wind puff particle
      this.state.particles.push({
        x: fan.x + (fan.direction === 'right' ? 10 : fan.direction === 'left' ? -10 : 0),
        y: fan.y + (Math.random() - 0.5) * fan.width * 0.8,
        vx: fan.direction === 'right' ? 150 : fan.direction === 'left' ? -150 : (Math.random() - 0.5) * 20,
        vy: fan.direction === 'up' ? -180 : (Math.random() - 0.5) * 20,
        color: '#bae6fd',
        size: 2 + Math.random() * 3,
        alpha: 0.6,
        life: 0,
        maxLife: 0.5,
        shape: 'circle',
      });
    }
  }

  private handleCollisions() {
    const { payload } = this.state;
    if (payload.isDead || payload.isWon) return;

    // 1. Collectible Tokens
    for (const token of this.state.collectibles) {
      if (!token.collected) {
        const d = dist(payload, token);
        if (d < payload.radius + token.radius + 6) {
          token.collected = true;
          const collectedCount = this.state.collectibles.filter((c) => c.collected).length;
          sound.playStarCollect(collectedCount - 1);
          haptics.light();
          this.spawnStarParticles(token.x, token.y);
        }
      }
    }

    // 2. Obstacles (Circle-Box and Circle-Circle)
    for (const obs of this.state.obstacles) {
      if (obs.type === 'circle' && obs.radius) {
        const d = dist(payload, obs);
        const minDist = payload.radius + obs.radius;
        if (d < minDist && d > 0) {
          const nx = (payload.x - obs.x) / d;
          const ny = (payload.y - obs.y) / d;
          const overlap = minDist - d;

          payload.x += nx * overlap;
          payload.y += ny * overlap;

          // Reflect velocity with restitution
          const rest = obs.restitution || 0.7;
          const dot = payload.vx * nx + payload.vy * ny;
          if (dot < 0) {
            payload.vx -= (1 + rest) * dot * nx;
            payload.vy -= (1 + rest) * dot * ny;
            payload.angularVelocity += (payload.vx * ny - payload.vy * nx) * 0.05;
            sound.playBounce(Math.min(1, Math.abs(dot) / 300));
            haptics.light();
          }
        }
      } else if (obs.type === 'box' && obs.width && obs.height) {
        this.handleCircleBoxCollision(obs);
      }
    }

    // 3. Breakable Platforms
    for (const breakable of this.state.breakables) {
      if (breakable.isBroken) continue;
      const halfW = breakable.width / 2;
      const halfH = breakable.height / 2;

      // Simple AABB vs Circle
      const closestX = Math.max(breakable.x - halfW, Math.min(payload.x, breakable.x + halfW));
      const closestY = Math.max(breakable.y - halfH, Math.min(payload.y, breakable.y + halfH));
      const dx = payload.x - closestX;
      const dy = payload.y - closestY;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < payload.radius) {
        const speed = Math.sqrt(payload.vx * payload.vx + payload.vy * payload.vy);
        // Break on impact!
        breakable.isBroken = true;
        sound.playShatter();
        haptics.heavy();
        this.spawnBreakableDebris(breakable);

        // Slow down slightly on breaking
        payload.vx *= 0.6;
        payload.vy *= 0.6;
      }
    }

    // 4. Portals
    if (this.state.portalCooldown > 0) {
      this.state.portalCooldown -= 0.016;
    } else {
      for (const portal of this.state.portals) {
        const d = dist(payload, portal.entry);
        if (d < portal.radius + payload.radius) {
          // Teleport!
          payload.x = portal.exit.x;
          payload.y = portal.exit.y;
          this.state.portalCooldown = 0.6;
          sound.playPortalWarp();
          haptics.medium();
          this.spawnPortalParticles(portal.entry.x, portal.entry.y, portal.color || '#38bdf8');
          this.spawnPortalParticles(portal.exit.x, portal.exit.y, '#f59e0b');
          break;
        }
      }
    }

    // 5. Spike Hazards
    for (const haz of this.state.hazards) {
      if (haz.type === 'saw' && haz.radius) {
        const d = dist(payload, haz);
        if (d < payload.radius + haz.radius - 4) {
          this.triggerDefeat('Hit moving saw blade');
          return;
        }
      } else if (haz.type === 'spikes_bar' && haz.width && haz.height) {
        const halfW = haz.width / 2;
        const halfH = haz.height / 2;
        const closestX = Math.max(haz.x - halfW, Math.min(payload.x, haz.x + halfW));
        const closestY = Math.max(haz.y - halfH, Math.min(payload.y, haz.y + halfH));
        const d = dist(payload, { x: closestX, y: closestY });
        if (d < payload.radius - 2) {
          this.triggerDefeat('Hit sharp spikes');
          return;
        }
      }
    }

    // 6. Target Zone (Goal Catch)
    const target = this.config.target;
    const dTarget = dist(payload, target);
    if (dTarget < target.radius + payload.radius * 0.4) {
      // Suction into target center
      const speed = Math.sqrt(payload.vx * payload.vx + payload.vy * payload.vy);
      if (speed < 700) {
        payload.isWon = true;
        payload.x = target.x;
        payload.y = target.y;
        payload.vx = 0;
        payload.vy = 0;
        this.triggerVictory();
        return;
      }
    }
  }

  private handleCircleBoxCollision(obs: Obstacle) {
    const { payload } = this.state;
    const w = obs.width || 100;
    const h = obs.height || 20;
    const rot = obs.rotation || 0;

    // Transform circle into box's local coordinate space
    const cos = Math.cos(-rot);
    const sin = Math.sin(-rot);
    const relX = payload.x - obs.x;
    const relY = payload.y - obs.y;

    const localX = cos * relX - sin * relY;
    const localY = sin * relX + cos * relY;

    // Closest point in local box
    const halfW = w / 2;
    const halfH = h / 2;
    const clampedX = Math.max(-halfW, Math.min(localX, halfW));
    const clampedY = Math.max(-halfH, Math.min(localY, halfH));

    const dx = localX - clampedX;
    const dy = localY - clampedY;
    const distSq = dx * dx + dy * dy;

    if (distSq < payload.radius * payload.radius) {
      const localDist = Math.sqrt(distSq);
      let normalX = 0;
      let normalY = 0;
      let depth = payload.radius;

      if (localDist === 0) {
        // Center is inside box - push to closest edge
        const distLeft = localX + halfW;
        const distRight = halfW - localX;
        const distTop = localY + halfH;
        const distBottom = halfH - localY;
        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

        if (minDist === distLeft) normalX = -1;
        else if (minDist === distRight) normalX = 1;
        else if (minDist === distTop) normalY = -1;
        else normalY = 1;

        depth = minDist + payload.radius;
      } else {
        normalX = dx / localDist;
        normalY = dy / localDist;
        depth = payload.radius - localDist;
      }

      // Transform normal and position back to world space
      const worldNormX = Math.cos(rot) * normalX - Math.sin(rot) * normalY;
      const worldNormY = Math.sin(rot) * normalX + Math.cos(rot) * normalY;

      payload.x += worldNormX * depth;
      payload.y += worldNormY * depth;

      // Velocity reflection
      const rest = obs.restitution || 0.75;
      const dot = payload.vx * worldNormX + payload.vy * worldNormY;
      if (dot < 0) {
        payload.vx -= (1 + rest) * dot * worldNormX;
        payload.vy -= (1 + rest) * dot * worldNormY;
        sound.playBounce(Math.min(1, Math.abs(dot) / 250));
        haptics.light();
      }
    }
  }

  private checkGameConditions() {
    const { payload } = this.state;
    if (this.state.status !== 'active') return;

    // Out of bounds check (fell off bottom or sides)
    if (payload.y > 660 || payload.x < -40 || payload.x > 440) {
      this.triggerDefeat('Dropped out of bounds');
    }
  }

  private triggerVictory() {
    this.state.status = 'success';
    sound.playVictory();
    haptics.success();
    this.spawnVictoryConfetti(this.config.target.x, this.config.target.y);
  }

  private triggerDefeat(reason: string) {
    this.state.status = 'failure';
    this.state.failureReason = reason;
    this.state.payload.isDead = true;
    sound.playFailure();
    haptics.failure();
    this.spawnDefeatParticles(this.state.payload.x, this.state.payload.y);
  }

  private spawnStarParticles(x: number, y: number) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 100;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? '#fbbf24' : '#fef08a',
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        shape: 'star',
      });
    }
  }

  private spawnPortalParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 3,
        alpha: 0.9,
        life: 0,
        maxLife: 0.4,
        shape: 'circle',
      });
    }
  }

  private spawnBreakableDebris(b: BreakablePlatform) {
    for (let i = 0; i < 12; i++) {
      this.state.particles.push({
        x: b.x + (Math.random() - 0.5) * b.width,
        y: b.y + (Math.random() - 0.5) * b.height,
        vx: (Math.random() - 0.5) * 160,
        vy: -40 - Math.random() * 120,
        color: '#92400e',
        size: 4 + Math.random() * 5,
        alpha: 1,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        shape: 'rect',
      });
    }
  }

  private spawnDefeatParticles(x: number, y: number) {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? '#ef4444' : '#fb923c',
        size: 4 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 0.6,
        shape: 'circle',
      });
    }
  }

  private spawnVictoryConfetti(x: number, y: number) {
    const colors = ['#fbbf24', '#38bdf8', '#4ade80', '#f472b6', '#a78bfa'];
    for (let i = 0; i < 35; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 120 + Math.random() * 220;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        size: 4 + Math.random() * 5,
        alpha: 1,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.5,
        shape: i % 2 === 0 ? 'rect' : 'star',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.state.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // Particle gravity
      p.alpha = 1 - p.life / p.maxLife;
      if (p.rotSpeed && p.rotation !== undefined) {
        p.rotation += p.rotSpeed * dt;
      }
    }
  }
}
