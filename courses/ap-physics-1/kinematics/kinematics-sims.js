/* kinematics-sims.js  —  Unit 1 Kinematics
   Matter.js engine (physics) + Canvas 2D API (rendering)
   Sims 1, 3, 4 use Matter.js.  Sim 2 (motion graphs) is pure canvas. */

'use strict';

const G         = 9.8;
const SIM_SCALE = 100;         // sim-world pixels per real metre
const FRAME_DT  = 1000 / 60;  // fixed physics step ≈ 16.67 ms
const GROUND_Y  = 35000;       // sim-world y of the ground plane

// Default Matter.js gravity (y:1, scale:0.001) ≈ G at SIM_SCALE=100:
//   gravity per step = 0.001 × 16.67² ≈ 0.278 sim-px/step
//   real G at scale  : 9.8 × 100 × (16.67/1000)² ≈ 0.272 sim-px/step  (< 2 % error)

// Unit converters — Matter.js Verlet stores velocity as displacement per step
function toStep(v)  { return v  * SIM_SCALE * (FRAME_DT / 1000); }
function toMps(vs)  { return vs / SIM_SCALE / (FRAME_DT / 1000); }

// ── Shared helpers ────────────────────────────────────────────────────────────

function getEl(id)  { return document.getElementById(id); }

function labelSlider(sId, lId, fmt) {
  const s = getEl(sId), l = getEl(lId);
  if (!s || !l) return;
  l.textContent = fmt(+s.value);
  s.addEventListener('input', () => { l.textContent = fmt(+s.value); });
}

function setOut(id, text) {
  const e = getEl(id);
  if (e) e.textContent = text;
}

function matterError(canvas) {
  const c = canvas.getContext('2d');
  c.fillStyle = '#94a3b8'; c.font = '13px Inter, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('Matter.js failed to load — check network.', canvas.width / 2, canvas.height / 2);
}

// ── SIM 1: Projectile Motion ──────────────────────────────────────────────────

function initProjectile() {
  const canvas = getEl('sim-projectile');
  if (!canvas) return;
  if (typeof Matter === 'undefined') { matterError(canvas); return; }

  const { Engine, Bodies, Body, Composite } = Matter;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let engine, ball;
  let rafId = null;
  const trail = [];

  labelSlider('proj-angle', 'proj-angle-label', v => v + '°');
  labelSlider('proj-speed', 'proj-speed-label', v => v + ' m/s');

  function getParams() {
    const deg = +getEl('proj-angle').value;
    const v0  = +getEl('proj-speed').value;
    const a   = deg * Math.PI / 180;
    const vx  = v0 * Math.cos(a);
    const vy0 = v0 * Math.sin(a);
    return {
      vx, vy0,
      tFlight : 2 * vy0 / G,
      range   : vx * 2 * vy0 / G,
      hMax    : vy0 * vy0 / (2 * G),
    };
  }

  function buildSim(p) {
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.001 } });
    ball   = Bodies.circle(0, GROUND_Y, 6, { frictionAir: 0, friction: 0, restitution: 0 });
    Body.setMass(ball, 1);
    Composite.add(engine.world, ball);
    relaunch(p);
  }

  function relaunch(p) {
    Body.setPosition(ball, { x: 0, y: GROUND_Y });
    Body.setVelocity(ball, { x: toStep(p.vx), y: -toStep(p.vy0) });
    trail.length = 0;
  }

  function drawGhostPath(p, toC) {
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * p.tFlight;
      const [cx, cy] = toC(p.vx * t, p.vy0 * t - 0.5 * G * t * t);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw(p) {
    ctx.clearRect(0, 0, W, H);
    const ml = 30, mr = 20, mt = 20, mb = 30;
    const sX  = (W - ml - mr) / Math.max(p.range * 1.05, 1);
    const sY  = (H - mt - mb) / Math.max(p.hMax * 1.4, 1);
    const toC = (xm, ym) => [ml + xm * sX, H - mb - ym * sY];

    // ground
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ml, H - mb); ctx.lineTo(W - mr, H - mb); ctx.stroke();

    // ghost path (analytical)
    drawGhostPath(p, toC);

    // range / height annotations
    const [x0, y0] = toC(0, 0);
    const [xR]     = toC(p.range, 0);
    const [xH, yH] = toC(p.vx * p.tFlight / 2, p.hMax);
    ctx.strokeStyle = '#6b7280'; ctx.fillStyle = '#6b7280';
    ctx.lineWidth = 1; ctx.font = '10px Inter, sans-serif';
    ctx.beginPath(); ctx.moveTo(x0, y0 + 12); ctx.lineTo(xR, y0 + 12); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillText('R = ' + p.range.toFixed(1) + ' m', (x0 + xR) / 2, y0 + 24);
    ctx.beginPath(); ctx.moveTo(xH + 10, y0); ctx.lineTo(xH + 10, yH); ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillText('h = ' + p.hMax.toFixed(1) + ' m', xH + 14, (y0 + yH) / 2 + 4);

    // ball from Matter.js engine
    const bxm = ball.position.x / SIM_SCALE;
    const bym = (GROUND_Y - ball.position.y) / SIM_SCALE;
    const [bx, by] = toC(bxm, Math.max(bym, 0));

    // trail
    trail.push([bx, by]);
    if (trail.length > 40) trail.shift();
    for (let i = 1; i < trail.length; i++) {
      ctx.strokeStyle = `rgba(59,130,246,${(i / trail.length) * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(trail[i-1][0], trail[i-1][1]); ctx.lineTo(trail[i][0], trail[i][1]); ctx.stroke();
    }

    // velocity vectors
    const vxN = toMps(ball.velocity.x);
    const vyN = -toMps(ball.velocity.y); // flip: positive = up
    const vs  = 3;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + vxN * vs, by); ctx.stroke();
    ctx.strokeStyle = vyN >= 0 ? '#22c55e' : '#ef4444';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - vyN * vs); ctx.stroke();

    // ball dot + launch dot
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath(); ctx.arc(x0, y0, 4, 0, Math.PI * 2); ctx.fill();
  }

  function tick() {
    const p = getParams();
    Engine.update(engine, FRAME_DT);
    if (ball.position.y >= GROUND_Y) relaunch(p);
    draw(p);
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    const p = getParams();
    setOut('proj-out-range',  p.range.toFixed(1) + ' m');
    setOut('proj-out-height', p.hMax.toFixed(1) + ' m');
    setOut('proj-out-time',   p.tFlight.toFixed(2) + ' s');
    if (rafId) cancelAnimationFrame(rafId);
    buildSim(p);
    rafId = requestAnimationFrame(tick);
  }

  ['proj-angle', 'proj-speed'].forEach(id => {
    const e = getEl(id);
    if (e) e.addEventListener('input', reset);
  });
  reset();
}

// ── SIM 2: 1D Motion Graphs ───────────────────────────────────────────────────

function initMotionGraphs() {
  const canvas = getEl('sim-graphs');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const T_MAX = 5;

  labelSlider('graph-v0', 'graph-v0-label', v => v + ' m/s');
  labelSlider('graph-a',  'graph-a-label',  v => v + ' m/s²');

  function draw() {
    const v0 = +getEl('graph-v0').value;
    const a  = +getEl('graph-a').value;

    ctx.clearRect(0, 0, W, H);

    const ROW = H / 3;
    const ML = 48, MR = 12, MT = 8, MB = 8;
    const gW = W - ML - MR;
    const gH = ROW - MT - MB;

    const colors = { x: '#3b82f6', v: '#22c55e', a: '#f59e0b' };
    const labels = ['x (m)', 'v (m/s)', 'a (m/s²)'];

    const xVals = [], vVals = [];
    for (let i = 0; i <= 50; i++) {
      const t = (i / 50) * T_MAX;
      xVals.push(v0 * t + 0.5 * a * t * t);
      vVals.push(v0 + a * t);
    }
    const xMin = Math.min(0, ...xVals), xMax = Math.max(0, ...xVals);
    const vMin = Math.min(0, ...vVals), vMax = Math.max(0, ...vVals);
    const aMin = Math.min(0, a),        aMax = Math.max(0, a);

    function pad(mn, mx) {
      const span = Math.max(Math.abs(mx - mn), 1);
      return [mn - span * 0.15, mx + span * 0.15];
    }

    const ranges = [pad(xMin, xMax), pad(vMin, vMax), pad(aMin, aMax)];

    [0, 1, 2].forEach(row => {
      const top = row * ROW + MT;
      const [yMin, yMax] = ranges[row];

      function toC(t, y) {
        return [
          ML + (t / T_MAX) * gW,
          top + gH - ((y - yMin) / (yMax - yMin)) * gH,
        ];
      }

      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(ML, top, gW, gH);

      const [, zy] = toC(0, 0);
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ML, zy); ctx.lineTo(ML + gW, zy); ctx.stroke();

      ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ML, top); ctx.lineTo(ML, top + gH);
      ctx.moveTo(ML, top + gH); ctx.lineTo(ML + gW, top + gH);
      ctx.stroke();

      ctx.fillStyle = '#6b7280'; ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(labels[row], ML - 4, top + gH / 2 + 4);

      ctx.strokeStyle = [colors.x, colors.v, colors.a][row];
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = (i / 80) * T_MAX;
        const y = row === 0 ? v0 * t + 0.5 * a * t * t
                : row === 1 ? v0 + a * t
                : a;
        const [cx, cy] = toC(t, y);
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      if (row === 2) {
        ctx.fillStyle = '#6b7280'; ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        for (let t = 0; t <= T_MAX; t++) {
          const [cx] = toC(t, yMin);
          ctx.fillText(t + 's', cx, top + gH + 12);
        }
      }
    });

    const tZero = a !== 0 ? -v0 / a : null;
    const dx5   = v0 * T_MAX + 0.5 * a * T_MAX * T_MAX;
    setOut('graph-out-tzero', tZero !== null && tZero >= 0 && tZero <= T_MAX
      ? tZero.toFixed(2) + ' s' : 'none in 0–5 s');
    setOut('graph-out-dx', dx5.toFixed(1) + ' m');
  }

  ['graph-v0', 'graph-a'].forEach(id => {
    const e = getEl(id);
    if (e) e.addEventListener('input', draw);
  });
  draw();
}

// ── SIM 3: Free Fall / Vertical Throw ────────────────────────────────────────

function initFreeFall() {
  const canvas = getEl('sim-freefall');
  if (!canvas) return;
  if (typeof Matter === 'undefined') { matterError(canvas); return; }

  const { Engine, Bodies, Body, Composite } = Matter;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let engine, ball;
  let rafId = null, pauseAt = 0;

  labelSlider('ff-h',  'ff-h-label',  v => v + ' m');
  labelSlider('ff-v0', 'ff-v0-label', v => (v >= 0 ? '+' : '') + v + ' m/s');

  function getParams() {
    const h0 = +getEl('ff-h').value;
    const v0 = +getEl('ff-v0').value;
    const disc    = v0 * v0 + 2 * G * h0;
    const tGround = (v0 + Math.sqrt(disc)) / G;
    const hMax    = v0 >= 0 ? h0 + v0 * v0 / (2 * G) : h0;
    const vImpact = Math.sqrt(2 * G * h0 + v0 * v0);
    return { h0, v0, tGround, hMax, vImpact };
  }

  function buildSim(p) {
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.001 } });
    ball   = Bodies.circle(0, GROUND_Y - p.h0 * SIM_SCALE, 7, { frictionAir: 0, friction: 0, restitution: 0 });
    Body.setMass(ball, 1);
    Composite.add(engine.world, ball);
    relaunch(p);
  }

  function relaunch(p) {
    Body.setPosition(ball, { x: 0, y: GROUND_Y - p.h0 * SIM_SCALE });
    Body.setVelocity(ball, { x: 0, y: -toStep(p.v0) }); // negative y = up
    pauseAt = 0;
  }

  function draw(p) {
    ctx.clearRect(0, 0, W, H);
    const ML = 60, MR = 20, MT = 20, MB = 30;
    const plotH = H - MT - MB;
    const midX  = W / 2;
    const scaleY = plotH / Math.max(p.hMax * 1.1, 1);
    const toY    = h => H - MB - h * scaleY;

    // ground line
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ML, H - MB); ctx.lineTo(W - MR, H - MB); ctx.stroke();

    // height scale
    ctx.fillStyle = '#9ca3af'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'right';
    const hStep = p.hMax > 40 ? 20 : 10;
    for (let h = 0; h <= p.hMax * 1.05; h += hStep) {
      const y = toY(h);
      ctx.fillText(h + ' m', ML - 4, y + 4);
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W - MR, y); ctx.stroke();
    }

    // ghost path (analytical)
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * p.tGround;
      const h = Math.max(p.h0 + p.v0 * t - 0.5 * G * t * t, 0);
      i === 0 ? ctx.moveTo(midX, toY(h)) : ctx.lineTo(midX, toY(h));
    }
    ctx.stroke(); ctx.setLineDash([]);

    // ball from engine
    const h_m = Math.max((GROUND_Y - ball.position.y) / SIM_SCALE, 0);
    const by  = toY(h_m);

    // velocity arrow
    const vy       = -toMps(ball.velocity.y); // positive = up
    const arrowLen = vy * 4;
    ctx.strokeStyle = vy >= 0 ? '#22c55e' : '#ef4444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(midX, by); ctx.lineTo(midX, by - arrowLen); ctx.stroke();
    const dir = vy >= 0 ? -1 : 1;
    const ay  = by - arrowLen;
    ctx.fillStyle = vy >= 0 ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(midX, ay + dir * 8);
    ctx.lineTo(midX - 4, ay + dir * 14);
    ctx.lineTo(midX + 4, ay + dir * 14);
    ctx.closePath(); ctx.fill();

    // labels
    ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#374151';
    ctx.fillText('v = ' + vy.toFixed(1) + ' m/s', midX + 14, by + 4);
    ctx.fillText('h = ' + h_m.toFixed(1) + ' m',  midX + 14, by + 16);

    // ball
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(midX, by, 7, 0, Math.PI * 2); ctx.fill();
  }

  function tick() {
    const p = getParams();

    if (ball.position.y >= GROUND_Y) {
      // freeze ball at ground, pause ~0.5 s then relaunch
      Body.setPosition(ball, { x: 0, y: GROUND_Y });
      Body.setVelocity(ball, { x: 0, y: 0 });
      if (++pauseAt > 30) relaunch(p);
    } else {
      Engine.update(engine, FRAME_DT);
    }

    draw(p);
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    const p = getParams();
    setOut('ff-out-hmax', p.hMax.toFixed(1) + ' m');
    setOut('ff-out-t',    p.tGround.toFixed(2) + ' s');
    setOut('ff-out-v',    p.vImpact.toFixed(1) + ' m/s');
    if (rafId) cancelAnimationFrame(rafId);
    buildSim(p);
    rafId = requestAnimationFrame(tick);
  }

  ['ff-h', 'ff-v0'].forEach(id => {
    const e = getEl(id);
    if (e) e.addEventListener('input', reset);
  });
  reset();
}

// ── SIM 4: Horizontal Cliff Launch ───────────────────────────────────────────

function initCliff() {
  const canvas = getEl('sim-cliff');
  if (!canvas) return;
  if (typeof Matter === 'undefined') { matterError(canvas); return; }

  const { Engine, Bodies, Body, Composite } = Matter;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let engine, ball;
  let rafId = null, pauseAt = 0;
  const trail = [];

  labelSlider('cliff-h',  'cliff-h-label',  v => v + ' m');
  labelSlider('cliff-vx', 'cliff-vx-label', v => v + ' m/s');

  function getParams() {
    const h  = +getEl('cliff-h').value;
    const vx = +getEl('cliff-vx').value;
    const t      = Math.sqrt(2 * h / G);
    const range  = vx * t;
    const vy     = G * t;
    const vImpact = Math.sqrt(vx * vx + vy * vy);
    return { h, vx, t, range, vy, vImpact };
  }

  function buildSim(p) {
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.001 } });
    ball   = Bodies.circle(0, GROUND_Y - p.h * SIM_SCALE, 6, { frictionAir: 0, friction: 0, restitution: 0 });
    Body.setMass(ball, 1);
    Composite.add(engine.world, ball);
    relaunch(p);
  }

  function relaunch(p) {
    Body.setPosition(ball, { x: 0, y: GROUND_Y - p.h * SIM_SCALE });
    Body.setVelocity(ball, { x: toStep(p.vx), y: 0 });
    trail.length = 0;
    pauseAt = 0;
  }

  function draw(p) {
    ctx.clearRect(0, 0, W, H);
    const ML = 20, MR = 20, MT = 20, MB = 30;
    const plotW    = W - ML - MR;
    const plotH    = H - MT - MB;
    const cliffX   = ML + 60;
    const scaleX   = (plotW - 60) / Math.max(p.range * 1.1, 1);
    const scaleY   = plotH / Math.max(p.h * 1.1, 1);

    const toC = (x, y) => [cliffX + x * scaleX, H - MB - y * scaleY];

    // ground
    ctx.fillStyle = '#d1fae5';
    ctx.fillRect(cliffX, H - MB, W - MR - cliffX, 4);
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ML, H - MB); ctx.lineTo(W - MR, H - MB); ctx.stroke();

    // cliff face
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(ML, H - MB - p.h * scaleY, cliffX - ML, p.h * scaleY);
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5;
    ctx.strokeRect(ML, H - MB - p.h * scaleY, cliffX - ML, p.h * scaleY);
    ctx.fillStyle = '#6b7280'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('h = ' + p.h + ' m', ML + 4, (H - MB - p.h * scaleY / 2));

    // ghost path (analytical)
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * p.t;
      const [cx, cy] = toC(p.vx * t, p.h - 0.5 * G * t * t);
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    }
    ctx.stroke(); ctx.setLineDash([]);

    // range arrow
    const [xLand] = toC(p.range, 0);
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cliffX, H - MB + 10); ctx.lineTo(xLand, H - MB + 10); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#6b7280';
    ctx.fillText('x = ' + p.range.toFixed(1) + ' m', (cliffX + xLand) / 2, H - MB + 22);

    // ball from engine
    const bxm = ball.position.x / SIM_SCALE;
    const bym = (GROUND_Y - ball.position.y) / SIM_SCALE;
    const [bcx, bcy] = toC(bxm, Math.max(bym, 0));

    trail.push([bcx, bcy]);
    if (trail.length > 40) trail.shift();
    for (let i = 1; i < trail.length; i++) {
      ctx.strokeStyle = `rgba(59,130,246,${(i / trail.length) * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(trail[i-1][0], trail[i-1][1]); ctx.lineTo(trail[i][0], trail[i][1]); ctx.stroke();
    }

    // velocity vectors
    const vxN  = toMps(ball.velocity.x);
    const vyDn = toMps(ball.velocity.y); // positive = down (falling)
    const vs   = 3;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath(); ctx.moveTo(bcx, bcy); ctx.lineTo(bcx + vxN * vs, bcy); ctx.stroke();
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(bcx, bcy); ctx.lineTo(bcx, bcy + vyDn * vs); ctx.stroke();

    // ball
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(bcx, bcy, 6, 0, Math.PI * 2); ctx.fill();
  }

  function tick() {
    const p = getParams();

    if (ball.position.y >= GROUND_Y) {
      Body.setPosition(ball, { x: ball.position.x, y: GROUND_Y });
      Body.setVelocity(ball, { x: 0, y: 0 });
      if (++pauseAt > 20) relaunch(p);
    } else {
      Engine.update(engine, FRAME_DT);
    }

    draw(p);
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    const p = getParams();
    setOut('cliff-out-t', p.t.toFixed(2) + ' s');
    setOut('cliff-out-x', p.range.toFixed(1) + ' m');
    setOut('cliff-out-v', p.vImpact.toFixed(1) + ' m/s');
    if (rafId) cancelAnimationFrame(rafId);
    buildSim(p);
    rafId = requestAnimationFrame(tick);
  }

  ['cliff-h', 'cliff-vx'].forEach(id => {
    const e = getEl(id);
    if (e) e.addEventListener('input', reset);
  });
  reset();
}

// ── Entry point ───────────────────────────────────────────────────────────────

function initKinematicsSims() {
  initProjectile();
  initMotionGraphs();
  initFreeFall();
  initCliff();
}

document.addEventListener('DOMContentLoaded', initKinematicsSims);
