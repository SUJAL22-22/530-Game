import React, { useRef, useEffect, useCallback } from 'react';
import { LevelConfig, Skin, SwipePoint, Vector2 } from '../types';
import { PhysicsEngine } from '../physics/engine';
import { getSkinById } from '../data/skins';

interface GameCanvasProps {
  level: LevelConfig;
  skinId: string;
  isPaused: boolean;
  showHint: boolean;
  onVictory: (stars: number, cuts: number, timeSec: number) => void;
  onDefeat: (reason: string) => void;
  onCutsChange?: (cuts: number) => void;
  onStarsChange?: (stars: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  skinId,
  isPaused,
  showHint,
  onVictory,
  onDefeat,
  onCutsChange,
  onStarsChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const swipeTrailRef = useRef<SwipePoint[]>([]);
  const isSwipingRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const reportedStatusRef = useRef<string | null>(null);

  const skin: Skin = getSkinById(skinId);

  // Initialize Physics Engine on Level Change
  useEffect(() => {
    engineRef.current = new PhysicsEngine(level);
    swipeTrailRef.current = [];
    isSwipingRef.current = false;
    reportedStatusRef.current = null;
    lastTimeRef.current = performance.now();
  }, [level]);

  // Coordinate Conversion (from DOM pixel to 400x650 virtual coordinate)
  const getVirtualCoords = useCallback((clientX: number, clientY: number): Vector2 => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: clientX, y: clientY };

    const rect = canvas.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 650 / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Pointer Event Handlers for Responsive Swipe Cutting
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPaused) return;
    const canvas = canvasRef.current;
    if (canvas) canvas.setPointerCapture(e.pointerId);

    isSwipingRef.current = true;
    const pos = getVirtualCoords(e.clientX, e.clientY);
    swipeTrailRef.current = [{ ...pos, time: performance.now() }];

    // Also check instant tap-cut on rope
    if (engineRef.current) {
      const didCut = engineRef.current.checkSwipeCut(pos, { x: pos.x + 0.1, y: pos.y + 0.1, time: performance.now() });
      if (didCut && onCutsChange) {
        onCutsChange(engineRef.current.state.cutsCount);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSwipingRef.current || isPaused) return;

    const pos = getVirtualCoords(e.clientX, e.clientY);
    const now = performance.now();
    const trail = swipeTrailRef.current;
    const prevPos = trail.length > 0 ? trail[trail.length - 1] : pos;

    trail.push({ ...pos, time: now });

    // Keep trail to recent points (~150ms)
    while (trail.length > 0 && now - trail[0].time > 150) {
      trail.shift();
    }

    // Check cut intersection
    if (engineRef.current) {
      const didCut = engineRef.current.checkSwipeCut(prevPos, pos);
      if (didCut && onCutsChange) {
        onCutsChange(engineRef.current.state.cutsCount);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
    isSwipingRef.current = false;
  };

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const loop = (time: number) => {
      if (!running) return;

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      const engine = engineRef.current;
      if (engine) {
        if (!isPaused) {
          engine.step(dt);

          // Track collected stars
          const starsCollected = engine.state.collectibles.filter((c) => c.collected).length;
          if (onStarsChange) {
            onStarsChange(starsCollected);
          }

          // Check for status change
          if (engine.state.status === 'success' && reportedStatusRef.current !== 'success') {
            reportedStatusRef.current = 'success';
            onVictory(starsCollected, engine.state.cutsCount, Math.round(engine.state.timeElapsed));
          } else if (engine.state.status === 'failure' && reportedStatusRef.current !== 'failure') {
            reportedStatusRef.current = 'failure';
            onDefeat(engine.state.failureReason || 'Failed');
          }
        }

        // Render Frame
        renderGame(ctx, engine, skin, swipeTrailRef.current, showHint, level);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused, skin, showHint, level, onVictory, onDefeat, onStarsChange]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        width={400}
        height={650}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full max-w-[440px] max-h-[750px] object-contain cursor-crosshair touch-none select-none rounded-2xl shadow-2xl"
      />
    </div>
  );
};

// Canvas Rendering Functions
function renderGame(
  ctx: CanvasRenderingContext2D,
  engine: PhysicsEngine,
  skin: Skin,
  trail: SwipePoint[],
  showHint: boolean,
  level: LevelConfig
) {
  const { state } = engine;
  const time = state.timeElapsed;

  // Clear Canvas
  ctx.clearRect(0, 0, 400, 650);

  // Background Gradient & Subtle Grid
  renderBackground(ctx, level.worldId);

  // Render Fans and Wind Streams
  renderFans(ctx, state.fans, time);

  // Render Portals
  renderPortals(ctx, state.portals, time);

  // Render Breakable Platforms
  renderBreakables(ctx, state.breakables);

  // Render Obstacles
  renderObstacles(ctx, state.obstacles);

  // Render Spike Hazards
  renderHazards(ctx, state.hazards, time);

  // Render Target Zone
  renderTarget(ctx, level.target, state.payload, time);

  // Render Collectible Stars
  renderCollectibles(ctx, state.collectibles, time);

  // Render Ropes & Anchors
  renderRopes(ctx, state.ropes, time);

  // Render Payload Object
  if (!state.payload.isDead) {
    renderPayload(ctx, state.payload, skin);
  }

  // Render Particles
  renderParticles(ctx, state.particles);

  // Render Dynamic Visual Tutorial and Guidance
  renderTutorialAndGuidance(ctx, level, state, time, showHint);

  // Render Swipe Slash Trail
  renderSwipeTrail(ctx, trail, skin.trailColor);
}

function renderBackground(ctx: CanvasRenderingContext2D, worldId: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, 650);
  if (worldId === 1) {
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#022c22');
  } else if (worldId === 2) {
    grad.addColorStop(0, '#78350f');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#451a03');
  } else if (worldId === 3) {
    grad.addColorStop(0, '#881337');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#4c0519');
  } else if (worldId === 4) {
    grad.addColorStop(0, '#0c4a6e');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#082f49');
  } else {
    grad.addColorStop(0, '#581c87');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#3b0764');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 650);

  // Subtle striped wallpaper or texture lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 20; x < 400; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 650);
    ctx.stroke();
  }
}

function renderRopes(ctx: CanvasRenderingContext2D, ropes: PhysicsEngine['state']['ropes'], _time: number) {
  for (const rope of ropes) {
    const nodes = rope.nodes;
    if (nodes.length < 2) continue;

    // Draw Anchor Pin / Rail
    ctx.save();
    if (rope.movingAnchor) {
      // Draw track rail
      const ma = rope.movingAnchor;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (ma.axis === 'x') {
        ctx.moveTo(rope.anchor.x - ma.range, rope.anchor.y);
        ctx.lineTo(rope.anchor.x + ma.range, rope.anchor.y);
      } else {
        ctx.moveTo(rope.anchor.x, rope.anchor.y - ma.range);
        ctx.lineTo(rope.anchor.x, rope.anchor.y + ma.range);
      }
      ctx.stroke();
    }

    // Anchor head pin
    const anchor = rope.currentAnchor;
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Rope Segments (Upper and Lower if cut)
    if (rope.isCut && rope.cutIndex !== undefined) {
      // Section 1: 0 to cutIndex
      drawRopeSegmentPath(ctx, nodes.slice(0, rope.cutIndex + 1), rope.color);
      // Section 2: cutIndex+1 to end
      drawRopeSegmentPath(ctx, nodes.slice(rope.cutIndex + 1), rope.color);
    } else {
      // Full intact rope
      drawRopeSegmentPath(ctx, nodes, rope.color);
    }
  }
}

function drawRopeSegmentPath(ctx: CanvasRenderingContext2D, nodes: PhysicsEngine['state']['ropes'][0]['nodes'], color: string) {
  if (nodes.length < 2) return;

  ctx.save();
  // Shadow
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(nodes[0].x + 2, nodes[0].y + 3);
  for (let i = 1; i < nodes.length; i++) {
    ctx.lineTo(nodes[i].x + 2, nodes[i].y + 3);
  }
  ctx.stroke();

  // Outer rope strand
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  for (let i = 1; i < nodes.length; i++) {
    ctx.lineTo(nodes[i].x, nodes[i].y);
  }
  ctx.stroke();

  // Inner rope highlights / braid
  ctx.strokeStyle = color || '#fde047';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  for (let i = 1; i < nodes.length; i++) {
    ctx.lineTo(nodes[i].x, nodes[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function renderPayload(ctx: CanvasRenderingContext2D, payload: PhysicsEngine['state']['payload'], skin: Skin) {
  ctx.save();
  ctx.translate(payload.x, payload.y);
  ctx.rotate(payload.rotation);

  const r = payload.radius;

  // Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.arc(3, 4, r, 0, Math.PI * 2);
  ctx.fill();

  // Base Sphere
  const sphereGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  sphereGrad.addColorStop(0, '#ffffff');
  sphereGrad.addColorStop(0.3, skin.primaryColor);
  sphereGrad.addColorStop(1, skin.secondaryColor);

  ctx.fillStyle = sphereGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Skin Specific Custom Details
  if (skin.id === 'candy') {
    // Candy Spiral Stripes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0, Math.PI * 1.5);
    ctx.stroke();
  } else if (skin.id === 'watermelon') {
    // Green rind & black seeds
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (r * 0.45), Math.sin(a) * (r * 0.45), 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (skin.id === 'eight_ball') {
    // White center circle with '8'
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('8', 0, 1);
  } else if (skin.id === 'star_ball') {
    // Golden star inside
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x1 = Math.cos(a) * (r * 0.6);
      const y1 = Math.sin(a) * (r * 0.6);
      const aInner = a + Math.PI / 5;
      const x2 = Math.cos(aInner) * (r * 0.28);
      const y2 = Math.sin(aInner) * (r * 0.28);
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Gloss Specular Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderCollectibles(ctx: CanvasRenderingContext2D, tokens: PhysicsEngine['state']['collectibles'], time: number) {
  for (const token of tokens) {
    if (token.collected) continue;

    const bob = Math.sin(time * 3 + token.x) * 3;
    const y = token.y + bob;

    ctx.save();
    ctx.translate(token.x, y);

    // Glowing Aura
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
    aura.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
    aura.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Star Shape
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const rOuter = token.radius;
    const rInner = token.radius * 0.45;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x1 = Math.cos(a) * rOuter;
      const y1 = Math.sin(a) * rOuter;
      const aInner = a + Math.PI / 5;
      const x2 = Math.cos(aInner) * rInner;
      const y2 = Math.sin(aInner) * rInner;
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sparkle Highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-2, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function renderTarget(
  ctx: CanvasRenderingContext2D,
  target: LevelConfig['target'],
  payload: PhysicsEngine['state']['payload'],
  time: number
) {
  const d = Math.hypot(payload.x - target.x, payload.y - target.y);
  const isNear = d < 90;

  ctx.save();
  ctx.translate(target.x, target.y);

  // Pulse effect when payload approaches
  const pulse = isNear ? Math.sin(time * 12) * 4 : Math.sin(time * 3) * 2;
  const rad = target.radius + pulse;

  // 1. Glowing Catch Beacon
  const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, rad * 1.5);
  aura.addColorStop(0, isNear ? 'rgba(74, 222, 128, 0.4)' : 'rgba(56, 189, 248, 0.25)');
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, rad * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 2. Outer Rotating Catch Ring
  ctx.strokeStyle = isNear ? '#4ade80' : '#38bdf8';
  ctx.lineWidth = 3.5;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, rad + 7, time * 2, time * 2 + Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Goal Monster / Jar Body
  const bowlGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, rad);
  bowlGrad.addColorStop(0, isNear ? '#166534' : '#0369a1');
  bowlGrad.addColorStop(0.7, '#0f172a');
  bowlGrad.addColorStop(1, '#020617');

  ctx.fillStyle = bowlGrad;
  ctx.beginPath();
  ctx.arc(0, 0, rad, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isNear ? '#22c55e' : '#38bdf8';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 4. Open Mouth / Catch Opening
  ctx.fillStyle = isNear ? '#86efac' : '#7dd3fc';
  ctx.beginPath();
  ctx.arc(0, 4, rad * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // 5. Cute Eyes Tracking the Payload
  const angleToPayload = Math.atan2(payload.y - target.y, payload.x - target.x);
  const eyeOffset = 2.5;
  const pupilX = Math.cos(angleToPayload) * eyeOffset;
  const pupilY = Math.sin(angleToPayload) * eyeOffset;

  // Left Eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-rad * 0.35, -rad * 0.35, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-rad * 0.35 + pupilX, -rad * 0.35 + pupilY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Right Eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(rad * 0.35, -rad * 0.35, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(rad * 0.35 + pupilX, -rad * 0.35 + pupilY, 3, 0, Math.PI * 2);
  ctx.fill();

  // 6. Floating Bouncing "GOAL" Tag
  const bounceY = -rad - 18 + Math.sin(time * 4) * 3;
  ctx.fillStyle = isNear ? '#22c55e' : '#0ea5e9';
  ctx.beginPath();
  ctx.roundRect(-36, bounceY, 72, 18, 9);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎯 GOAL', 0, bounceY + 9);

  ctx.restore();
}

function renderObstacles(ctx: CanvasRenderingContext2D, obstacles: PhysicsEngine['state']['obstacles']) {
  for (const obs of obstacles) {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    if (obs.rotation) {
      ctx.rotate(obs.rotation);
    }

    if (obs.type === 'circle' && obs.radius) {
      // Circle Bumper
      const grad = ctx.createRadialGradient(-obs.radius * 0.3, -obs.radius * 0.3, 2, 0, 0, obs.radius);
      grad.addColorStop(0, '#fde047');
      grad.addColorStop(1, obs.color || '#b45309');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (obs.type === 'box' && obs.width && obs.height) {
      const w = obs.width;
      const h = obs.height;

      // Rounded Box Obstacle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(-w / 2 + 2, -h / 2 + 4, w, h);

      ctx.fillStyle = obs.color || '#059669';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 8);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function renderHazards(ctx: CanvasRenderingContext2D, hazards: PhysicsEngine['state']['hazards'], time: number) {
  for (const haz of hazards) {
    ctx.save();
    ctx.translate(haz.x, haz.y);

    if (haz.type === 'saw' && haz.radius) {
      // Spinning Circular Saw
      ctx.rotate(time * 8);
      const r = haz.radius;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      const teeth = 8;
      for (let i = 0; i < teeth; i++) {
        const a1 = (i * Math.PI * 2) / teeth;
        const a2 = a1 + Math.PI / teeth;
        const x1 = Math.cos(a1) * r;
        const y1 = Math.sin(a1) * r;
        const x2 = Math.cos(a2) * (r * 0.65);
        const y2 = Math.sin(a2) * (r * 0.65);
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (haz.type === 'spikes_bar' && haz.width && haz.height) {
      // Spikes Bar with sharp metal triangular teeth
      const w = haz.width;
      const h = haz.height;

      // Base bar
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-w / 2, 0, w, h / 2);

      // Spike teeth
      ctx.fillStyle = '#ef4444';
      const teethCount = Math.floor(w / 14);
      const toothW = w / teethCount;
      for (let i = 0; i < teethCount; i++) {
        const xLeft = -w / 2 + i * toothW;
        const xMid = xLeft + toothW / 2;
        const xRight = xLeft + toothW;
        ctx.beginPath();
        ctx.moveTo(xLeft, 0);
        ctx.lineTo(xMid, -h / 2);
        ctx.lineTo(xRight, 0);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

function renderFans(ctx: CanvasRenderingContext2D, fans: PhysicsEngine['state']['fans'], time: number) {
  for (const fan of fans) {
    if (!fan.active) continue;
    ctx.save();
    ctx.translate(fan.x, fan.y);

    // Fan Housing
    ctx.fillStyle = '#334155';
    ctx.fillRect(-14, -fan.width / 2, 28, fan.width);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -fan.width / 2, 28, fan.width);

    // Spinning Blades
    ctx.save();
    ctx.rotate(time * 12);
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-3, -fan.width * 0.38, 6, fan.width * 0.38);
    }
    ctx.restore();

    // Air current visual cone
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.beginPath();
    if (fan.direction === 'right') {
      ctx.moveTo(14, -fan.width / 2);
      ctx.lineTo(fan.range, -fan.width * 0.7);
      ctx.lineTo(fan.range, fan.width * 0.7);
      ctx.lineTo(14, fan.width / 2);
    } else if (fan.direction === 'left') {
      ctx.moveTo(-14, -fan.width / 2);
      ctx.lineTo(-fan.range, -fan.width * 0.7);
      ctx.lineTo(-fan.range, fan.width * 0.7);
      ctx.lineTo(-14, fan.width / 2);
    } else if (fan.direction === 'up') {
      ctx.moveTo(-fan.width / 2, -14);
      ctx.lineTo(-fan.width * 0.7, -fan.range);
      ctx.lineTo(fan.width * 0.7, -fan.range);
      ctx.lineTo(fan.width / 2, -14);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

function renderBreakables(ctx: CanvasRenderingContext2D, breakables: PhysicsEngine['state']['breakables']) {
  for (const b of breakables) {
    if (b.isBroken) continue;
    ctx.save();
    ctx.translate(b.x, b.y);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);

    // Wood Plank Planks lines
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);

    // Crack lines indicating fragility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(-b.width * 0.2, -b.height / 2);
    ctx.lineTo(0, 0);
    ctx.lineTo(b.width * 0.2, b.height / 2);
    ctx.stroke();

    ctx.restore();
  }
}

function renderPortals(ctx: CanvasRenderingContext2D, portals: PhysicsEngine['state']['portals'], time: number) {
  for (const portal of portals) {
    // Entry Portal (e.g. Cyan/Blue)
    drawPortalDisc(ctx, portal.entry.x, portal.entry.y, portal.radius, portal.color || '#38bdf8', time);
    // Exit Portal (Orange/Amber)
    drawPortalDisc(ctx, portal.exit.x, portal.exit.y, portal.radius, '#f59e0b', -time);
  }
}

function drawPortalDisc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Outer Aura
  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 1.3);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Swirling Vortex Ring
  ctx.rotate(time * 3);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Center Void
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: PhysicsEngine['state']['particles']) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;

    if (p.shape === 'star') {
      ctx.translate(p.x, p.y);
      if (p.rotation) ctx.rotate(p.rotation);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI * 2) / 4;
        ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
        const aInner = a + Math.PI / 4;
        ctx.lineTo(Math.cos(aInner) * (p.size * 0.35), Math.sin(aInner) * (p.size * 0.35));
      }
      ctx.closePath();
      ctx.fill();
    } else if (p.shape === 'rect') {
      ctx.translate(p.x, p.y);
      if (p.rotation) ctx.rotate(p.rotation);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    } else if (p.shape === 'fiber') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function renderTutorialAndGuidance(
  ctx: CanvasRenderingContext2D,
  level: LevelConfig,
  state: PhysicsEngine['state'],
  time: number,
  showHint: boolean
) {
  const isLevelOne = level.id === 1;
  const isLevelTwo = level.id === 2;
  const isEarlyTutorial = (isLevelOne || isLevelTwo) && state.cutsCount === 0;
  const shouldShowGuide = showHint || isEarlyTutorial;

  if (!shouldShowGuide) return;

  ctx.save();

  // 1. Draw dashed physics trajectory guide from payload to target
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(state.payload.x, state.payload.y);
  ctx.quadraticCurveTo(200, 350, level.target.x, level.target.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Animated Swipe Finger Gesture across the uncut rope
  const uncutRopes = state.ropes.filter((r) => !r.isCut);
  if (uncutRopes.length > 0) {
    const targetRope = uncutRopes[0];
    const midIdx = Math.floor(targetRope.nodes.length / 2);
    const midNode = targetRope.nodes[midIdx] || targetRope.anchor;

    // Gesture animation cycle (0 to 1 back and forth)
    const gesturePhase = (time * 1.6) % 1;
    const swipeOffset = (gesturePhase - 0.5) * 80;
    const handX = midNode.x + swipeOffset;
    const handY = midNode.y;

    // Glowing cut path line
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(midNode.x - 45, midNode.y);
    ctx.lineTo(midNode.x + 45, midNode.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing cut slash arc
    if (gesturePhase > 0.15 && gesturePhase < 0.85) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(midNode.x - 40, midNode.y);
      ctx.lineTo(handX, handY);
      ctx.stroke();
    }

    // Animated Finger Cursor
    ctx.save();
    ctx.translate(handX, handY);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👆', 0, 1);
    ctx.restore();

    // Floating Instruction Badge above rope
    const badgeY = Math.max(30, midNode.y - 42);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(50, badgeY, 300, 28, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      isLevelOne
        ? '✂️ SWIPE ACROSS ROPE TO CUT & DROP!'
        : isLevelTwo
        ? '✂️ CUT BOTH ROPES TO RELEASE CANDY!'
        : '💡 SWIPE TO CUT THE HIGHLIGHTED ROPE!',
      200,
      badgeY + 14
    );
  }

  // 3. Floating Guidance Badge for Stars & Goal
  if (isLevelOne && state.cutsCount === 0) {
    // Star indicator
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(70, 340, 260, 24, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐ Catch stars on your way down!', 200, 352);
  }

  ctx.restore();
}

function renderSwipeTrail(ctx: CanvasRenderingContext2D, trail: SwipePoint[], trailColor: string) {
  if (trail.length < 2) return;

  const now = performance.now();
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < trail.length - 1; i++) {
    const p1 = trail[i];
    const p2 = trail[i + 1];
    const age = now - p2.time;
    const progress = Math.max(0, 1 - age / 160);
    if (progress <= 0) continue;

    ctx.strokeStyle = trailColor || '#38bdf8';
    ctx.lineWidth = 8 * progress;
    ctx.globalAlpha = progress * 0.9;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Bright White Core Blade
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * progress;
    ctx.globalAlpha = progress;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.restore();
}
