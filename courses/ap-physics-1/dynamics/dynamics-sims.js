/* dynamics-sims.js — Force & Translational Dynamics
   Matter.js engine (physics) + Canvas 2D API (rendering) */

'use strict';

const G        = 9.8;
const FRAME_DT = 1000 / 60; // fixed physics step ms ≈ 16.67

/* ── drawing helpers (unchanged) ── */
function arrow(ctx, x1, y1, x2, y2, color, width = 2.5) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return;
  const ux = dx / len, uy = dy / len;
  const hw = Math.max(6, width * 2.5), hl = Math.max(10, width * 4);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw);
  ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function label(ctx, text, x, y, color = '#e2e8f0', size = 13) {
  ctx.save();
  ctx.fillStyle = color; ctx.font = `${size}px Inter, sans-serif`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function fmt(v, decimals = 2) { return (+v).toFixed(decimals); }

function matterError(canvas) {
  const c = canvas.getContext('2d');
  c.fillStyle = '#94a3b8'; c.font = '13px Inter, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('Matter.js failed to load — check network.', canvas.width / 2, canvas.height / 2);
}

/* ═══════════════════════════════════════════════════
   SIM 1 — Block on Surface with FBD
═══════════════════════════════════════════════════ */
function initBlockSurface() {
  const canvas = document.getElementById('sim-block');
  if (!canvas) return;
  if (typeof Matter === 'undefined') { matterError(canvas); return; }

  const { Engine, Bodies, Body, Composite } = Matter;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sliderF  = document.getElementById('blk-f');
  const sliderM  = document.getElementById('blk-m');
  const sliderMu = document.getElementById('blk-mu');
  const lblF  = document.getElementById('blk-f-label');
  const lblM  = document.getElementById('blk-m-label');
  const lblMu = document.getElementById('blk-mu-label');
  const outN  = document.getElementById('blk-out-n');
  const outF  = document.getElementById('blk-out-f');
  const outA  = document.getElementById('blk-out-a');

  const VIS_SCALE = 30; // px/s visual speed (matches original vel*30*dt)
  const START_X   = 120;
  let engine, block, vel = 0, rafId = null;

  function physics() {
    const F   = +sliderF.value;
    const m   = +sliderM.value;
    const muS = +sliderMu.value;
    const muK = muS * 0.75;
    const N   = m * G;
    const fsMax = muS * N, fk = muK * N;
    const sliding = F > fsMax;
    const friction = sliding ? fk : F;
    const accel    = sliding ? (F - fk) / m : 0;
    return { F, m, N, friction, accel, muS, muK, sliding };
  }

  function buildSim() {
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine = Engine.create({ gravity: { x: 0, y: 0 } });
    block  = Bodies.rectangle(START_X, 0, 60, 50, { frictionAir: 0, friction: 0, restitution: 0 });
    Body.setMass(block, 1);
    Composite.add(engine.world, block);
    vel = 0;
  }

  function draw(p) {
    const blockX  = block.position.x;
    const groundY = H - 55;
    const bw = 60, bh = 50;
    const bx = blockX - bw / 2, by = groundY - bh;
    const cx = blockX, cy = groundY - bh / 2;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117'; ctx.fillRect(0, 0, W, H);

    // ground
    ctx.fillStyle = '#1e2533'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

    // block
    ctx.fillStyle   = p.sliding ? '#2563eb' : '#1d4ed8';
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 5); ctx.fill(); ctx.stroke();
    label(ctx, `${p.m} kg`, cx - 14, cy + 5, '#e2e8f0', 13);

    // FBD arrows
    const scale = 60 / 50;
    arrow(ctx, cx, by, cx, by - p.N * scale * 0.6, '#34d399', 2.5);
    label(ctx, 'N', cx + 6, by - p.N * scale * 0.6 - 5, '#34d399');
    arrow(ctx, cx, groundY - bh, cx, groundY - bh + p.m * G * scale * 0.6, '#f87171', 2.5);
    label(ctx, 'mg', cx + 6, groundY - bh + p.m * G * scale * 0.6 + 14, '#f87171');
    const fArrowLen = Math.max(10, p.F * scale);
    arrow(ctx, bx - 10, cy, bx - 10 + fArrowLen, cy, '#60a5fa', 2.5);
    label(ctx, `F=${p.F}N`, bx - 10 + fArrowLen + 4, cy + 4, '#60a5fa');
    if (p.friction > 0) {
      const frLen = Math.max(6, p.friction * scale);
      arrow(ctx, bx + bw + 10, cy, bx + bw + 10 - frLen, cy, '#fb923c', 2.5);
      label(ctx, p.sliding ? 'f_k' : 'f_s', bx + bw + 14 - frLen, cy - 8, '#fb923c');
    }

    // badge
    ctx.fillStyle = p.sliding ? '#2563eb' : '#16a34a';
    ctx.beginPath(); ctx.roundRect(W - 90, 12, 78, 26, 6); ctx.fill();
    label(ctx, p.sliding ? 'SLIDING' : 'STATIC', W - 84, 30, '#fff', 12);

    outN.textContent = fmt(p.N) + ' N';
    outF.textContent = fmt(p.friction) + ' N';
    outA.textContent = fmt(p.accel) + ' m/s²';
  }

  function tick() {
    const p = physics();
    if (p.sliding) vel += p.accel * (FRAME_DT / 1000);
    else vel = 0;

    Body.setVelocity(block, { x: vel * VIS_SCALE * (FRAME_DT / 1000), y: 0 });
    Engine.update(engine, FRAME_DT);

    if (block.position.x > W - 60) {
      Body.setPosition(block, { x: START_X, y: 0 });
      vel = 0;
    }

    draw(p);
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    Body.setPosition(block, { x: START_X, y: 0 });
    Body.setVelocity(block, { x: 0, y: 0 });
    vel = 0;
  }

  [sliderF, sliderM, sliderMu].forEach(s => {
    s.addEventListener('input', () => {
      lblF.textContent  = sliderF.value + ' N';
      lblM.textContent  = sliderM.value + ' kg';
      const mu = +sliderMu.value;
      lblMu.textContent = mu.toFixed(2) + ' / ' + (mu * 0.75).toFixed(2);
      reset();
    });
  });

  lblF.textContent  = sliderF.value + ' N';
  lblM.textContent  = sliderM.value + ' kg';
  const mu0 = +sliderMu.value;
  lblMu.textContent = mu0.toFixed(2) + ' / ' + (mu0 * 0.75).toFixed(2);

  buildSim();
  rafId = requestAnimationFrame(tick);
}

/* ═══════════════════════════════════════════════════
   SIM 2 — Inclined Plane
═══════════════════════════════════════════════════ */
function initInclinedPlane() {
  const canvas = document.getElementById('sim-incline');
  if (!canvas) return;
  if (typeof Matter === 'undefined') { matterError(canvas); return; }

  const { Engine, Bodies, Body, Composite } = Matter;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sliderTheta = document.getElementById('inc-theta');
  const sliderM     = document.getElementById('inc-m');
  const sliderMu    = document.getElementById('inc-mu');
  const lblTheta = document.getElementById('inc-theta-label');
  const lblM     = document.getElementById('inc-m-label');
  const lblMu    = document.getElementById('inc-mu-label');
  const outPara  = document.getElementById('inc-out-para');
  const outN     = document.getElementById('inc-out-n');
  const outFk    = document.getElementById('inc-out-fk');
  const outA     = document.getElementById('inc-out-a');

  const ox = 40, oy = H - 40;
  const slopeLen = W - 80; // canvas pixels

  // block1d tracks position along slope (px from base of slope)
  let engine, block1d, vel = 0, rafId = null;
  const START_SPOS = 0.3;

  function physics() {
    const theta = +sliderTheta.value * Math.PI / 180;
    const m     = +sliderM.value;
    const muK   = +sliderMu.value;
    const muS   = muK + 0.10;
    const para  = m * G * Math.sin(theta);
    const N     = m * G * Math.cos(theta);
    const fk    = muK * N;
    const fsMax = muS * N;
    const sliding = para > fsMax;
    const accel   = sliding ? (para - fk) / m : 0;
    return { theta, m, muK, para, N, fk, accel, sliding };
  }

  function buildSim() {
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine = Engine.create({ gravity: { x: 0, y: 0 } });
    block1d = Bodies.rectangle(START_SPOS * slopeLen, 0, 1, 1, { frictionAir: 0, friction: 0, restitution: 0 });
    Body.setMass(block1d, 1);
    Composite.add(engine.world, block1d);
    vel = 0;
  }

  function draw(p) {
    const sPos = block1d.position.x / slopeLen;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117'; ctx.fillRect(0, 0, W, H);

    // slope geometry
    const ex = ox + slopeLen * Math.cos(p.theta);
    const ey = oy - slopeLen * Math.sin(p.theta);

    ctx.fillStyle = '#1e2533';
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.lineTo(ex, oy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, oy); ctx.stroke();

    // angle arc
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ex, oy, 35, -Math.PI, -Math.PI + p.theta, false); ctx.stroke();
    label(ctx, (+sliderTheta.value) + '°', ex - 48, oy - 8, '#94a3b8', 12);

    // block on slope
    const blockLen = 36, blockH = 24;
    const bCenterT = sPos * slopeLen;
    const bcx = ox + bCenterT * Math.cos(p.theta);
    const bcy = oy - bCenterT * Math.sin(p.theta);

    ctx.save();
    ctx.translate(bcx, bcy); ctx.rotate(-p.theta);
    ctx.fillStyle   = p.sliding ? '#2563eb' : '#1d4ed8';
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-blockLen / 2, -blockH, blockLen, blockH, 4); ctx.fill(); ctx.stroke();
    ctx.restore();

    // FBD vectors
    const vcx = bcx, vcy = bcy - blockH / 2 * Math.cos(p.theta);
    const scale = 55 / (p.m * G);
    const wLen  = p.m * G * scale;
    arrow(ctx, vcx, vcy, vcx, vcy + wLen, '#f87171', 2.5);
    label(ctx, 'mg', vcx + 5, vcy + wLen + 14, '#f87171');

    const nLen = p.N * scale;
    arrow(ctx, vcx, vcy, vcx - nLen * Math.sin(p.theta), vcy - nLen * Math.cos(p.theta), '#34d399', 2.5);
    label(ctx, 'N', vcx - nLen * Math.sin(p.theta) - 18, vcy - nLen * Math.cos(p.theta) - 6, '#34d399');

    const paraLen = p.para * scale;
    arrow(ctx, vcx, vcy, vcx - paraLen * Math.cos(p.theta), vcy + paraLen * Math.sin(p.theta), '#fbbf24', 2.5);
    label(ctx, 'mg sinθ', vcx - paraLen * Math.cos(p.theta) - 10, vcy + paraLen * Math.sin(p.theta) + 14, '#fbbf24', 11);

    if (p.sliding && p.fk > 0) {
      const fkLen = p.fk * scale;
      arrow(ctx, vcx, vcy, vcx + fkLen * Math.cos(p.theta), vcy - fkLen * Math.sin(p.theta), '#fb923c', 2.5);
      label(ctx, 'f_k', vcx + fkLen * Math.cos(p.theta) + 4, vcy - fkLen * Math.sin(p.theta) - 4, '#fb923c');
    }

    // badge
    ctx.fillStyle = p.sliding ? '#2563eb' : '#16a34a';
    ctx.beginPath(); ctx.roundRect(W - 90, 12, 78, 26, 6); ctx.fill();
    label(ctx, p.sliding ? 'SLIDING' : 'STATIC', W - 84, 30, '#fff', 12);

    outPara.textContent = fmt(p.para) + ' N';
    outN.textContent    = fmt(p.N) + ' N';
    outFk.textContent   = fmt(p.fk) + ' N';
    outA.textContent    = fmt(p.accel) + ' m/s²';
  }

  function tick() {
    const p = physics();
    if (p.sliding) vel += p.accel * (FRAME_DT / 1000);
    else vel = 0;

    // vel in m/s → position change along slope in canvas px per step
    // 0.12 matches the original visual speed scale
    Body.setVelocity(block1d, { x: vel * 0.12 * slopeLen * (FRAME_DT / 1000), y: 0 });
    Engine.update(engine, FRAME_DT);

    if (block1d.position.x > 0.85 * slopeLen) {
      Body.setPosition(block1d, { x: START_SPOS * slopeLen, y: 0 });
      vel = 0;
    }

    draw(p);
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    Body.setPosition(block1d, { x: START_SPOS * slopeLen, y: 0 });
    Body.setVelocity(block1d, { x: 0, y: 0 });
    vel = 0;
  }

  [sliderTheta, sliderM, sliderMu].forEach(s => {
    s.addEventListener('input', () => {
      lblTheta.textContent = sliderTheta.value + '°';
      lblM.textContent     = sliderM.value + ' kg';
      lblMu.textContent    = (+sliderMu.value).toFixed(2);
      reset();
    });
  });

  lblTheta.textContent = sliderTheta.value + '°';
  lblM.textContent     = sliderM.value + ' kg';
  lblMu.textContent    = (+sliderMu.value).toFixed(2);

  buildSim();
  rafId = requestAnimationFrame(tick);
}

/* ═══════════════════════════════════════════════════
   SIM 3 — Atwood Machine
═══════════════════════════════════════════════════ */
function initAtwood() {
  const canvas = document.getElementById('sim-atwood');
  if (!canvas) return;
  if (typeof Matter === 'undefined') { matterError(canvas); return; }

  const { Engine, Bodies, Body, Composite } = Matter;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sliderM1 = document.getElementById('atw-m1');
  const sliderM2 = document.getElementById('atw-m2');
  const lblM1 = document.getElementById('atw-m1-label');
  const lblM2 = document.getElementById('atw-m2-label');
  const outA  = document.getElementById('atw-out-a');
  const outT  = document.getElementById('atw-out-t');
  const outW1 = document.getElementById('atw-out-w1');
  const outW2 = document.getElementById('atw-out-w2');

  // dispBody.position.y tracks displacement (positive = m2 descends)
  const VIS_SCALE = 40;
  const LIMIT     = 55; // max disp in canvas px
  let engine, dispBody, vel = 0, rafId = null;

  function physics() {
    const m1 = +sliderM1.value, m2 = +sliderM2.value;
    const a  = (m2 - m1) * G / (m1 + m2);
    const T  = 2 * m1 * m2 * G / (m1 + m2);
    return { m1, m2, a, T };
  }

  function buildSim() {
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine   = Engine.create({ gravity: { x: 0, y: 0 } });
    dispBody = Bodies.rectangle(0, 0, 1, 1, { frictionAir: 0, friction: 0, restitution: 0 });
    Body.setMass(dispBody, 1);
    Composite.add(engine.world, dispBody);
    vel = 0;
  }

  function draw(p) {
    const disp = dispBody.position.y / VIS_SCALE;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117'; ctx.fillRect(0, 0, W, H);

    // pulley
    const px = W / 2, py = 38, pr = 20;
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1e2533'; ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();

    const ropeTopY = py + pr;
    const x1 = px - pr, x2 = px + pr;
    const bw = 44, bh = 32;
    const baseY = H / 2 - 20;

    const y1 = baseY - disp, y2 = baseY + disp;
    const topC = ropeTopY + 10, btmC = H - 20;
    const yC1  = Math.max(topC, Math.min(btmC - bh, y1));
    const yC2  = Math.max(topC, Math.min(btmC - bh, y2));

    // ropes
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, ropeTopY); ctx.lineTo(x1, yC1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, ropeTopY); ctx.lineTo(x2, yC2); ctx.stroke();

    // m1
    ctx.fillStyle = '#1d4ed8'; ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x1 - bw / 2, yC1, bw, bh, 5); ctx.fill(); ctx.stroke();
    label(ctx, 'm₁', x1 - 7, yC1 + 14, '#e2e8f0', 12);
    label(ctx, p.m1 + ' kg', x1 - 14, yC1 + 28, '#93c5fd', 11);

    // m2
    ctx.fillStyle = '#7c3aed'; ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x2 - bw / 2, yC2, bw, bh, 5); ctx.fill(); ctx.stroke();
    label(ctx, 'm₂', x2 - 7, yC2 + 14, '#e2e8f0', 12);
    label(ctx, p.m2 + ' kg', x2 - 14, yC2 + 28, '#c4b5fd', 11);

    // acceleration arrows
    const aAbs = Math.abs(p.a);
    if (aAbs > 0.05) {
      const arrowLen = Math.min(35, aAbs * 8);
      const dir = p.a > 0 ? 1 : -1;
      arrow(ctx, x2, yC2 + bh + 6, x2, yC2 + bh + 6 + arrowLen * dir, '#fbbf24', 2);
      arrow(ctx, x1, yC1 - 6, x1, yC1 - 6 - arrowLen * dir, '#fbbf24', 2);
    }

    if (aAbs < 0.05) label(ctx, 'equilibrium', px - 38, H - 12, '#4ade80', 12);

    outA.textContent  = fmt(aAbs) + ' m/s²';
    outT.textContent  = fmt(p.T) + ' N';
    outW1.textContent = fmt(p.m1 * G) + ' N';
    outW2.textContent = fmt(p.m2 * G) + ' N';
  }

  function tick() {
    const p = physics();
    vel += p.a * (FRAME_DT / 1000);

    // dispBody.position.y = disp * VIS_SCALE
    Body.setVelocity(dispBody, { x: 0, y: vel * VIS_SCALE * (FRAME_DT / 1000) });
    Engine.update(engine, FRAME_DT);

    if (Math.abs(dispBody.position.y) > LIMIT) {
      Body.setPosition(dispBody, { x: 0, y: 0 });
      vel = 0;
    }

    draw(p);
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    Body.setPosition(dispBody, { x: 0, y: 0 });
    Body.setVelocity(dispBody, { x: 0, y: 0 });
    vel = 0;
  }

  [sliderM1, sliderM2].forEach(s => {
    s.addEventListener('input', () => {
      lblM1.textContent = sliderM1.value + ' kg';
      lblM2.textContent = sliderM2.value + ' kg';
      reset();
    });
  });

  lblM1.textContent = sliderM1.value + ' kg';
  lblM2.textContent = sliderM2.value + ' kg';

  buildSim();
  rafId = requestAnimationFrame(tick);
}

/* ═══════════════════════════════════════════════════
   SIM 4 — Block on Table + Hanging Mass
═══════════════════════════════════════════════════ */
function initTableHanging() {
  const canvas = document.getElementById('sim-table');
  if (!canvas) return;
  if (typeof Matter === 'undefined') { matterError(canvas); return; }

  const { Engine, Bodies, Body, Composite } = Matter;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sliderMt = document.getElementById('tbl-mt');
  const sliderMh = document.getElementById('tbl-mh');
  const sliderMu = document.getElementById('tbl-mu');
  const lblMt = document.getElementById('tbl-mt-label');
  const lblMh = document.getElementById('tbl-mh-label');
  const lblMu = document.getElementById('tbl-mu-label');
  const outA  = document.getElementById('tbl-out-a');
  const outT  = document.getElementById('tbl-out-t');

  // progBody tracks system progress in canvas px (progBody.x = tblX-START_TBLX = hangY-START_HANGY)
  const VIS_SCALE  = 40;
  const START_TBLX = 130;
  const START_HANG = 90;
  let engine, progBody, vel = 0, rafId = null;

  function physics() {
    const mt  = +sliderMt.value;
    const mh  = +sliderMh.value;
    const muK = +sliderMu.value;
    const fk  = muK * mt * G;
    const a   = Math.max(0, (mh * G - fk) / (mt + mh));
    const T   = mt * (a + muK * G);
    return { mt, mh, muK, a, T, fk };
  }

  function buildSim() {
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine   = Engine.create({ gravity: { x: 0, y: 0 } });
    progBody = Bodies.rectangle(0, 0, 1, 1, { frictionAir: 0, friction: 0, restitution: 0 });
    Body.setMass(progBody, 1);
    Composite.add(engine.world, progBody);
    vel = 0;
  }

  function draw(p) {
    const prog = progBody.position.x; // canvas px offset
    const tblX = START_TBLX + prog;
    const hangY = START_HANG + prog;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117'; ctx.fillRect(0, 0, W, H);

    // table surface
    const tableY = H / 2 - 10;
    ctx.fillStyle = '#1e2533'; ctx.fillRect(0, tableY, W - 60, 14);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, tableY); ctx.lineTo(W - 60, tableY); ctx.stroke();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W - 60, tableY); ctx.lineTo(W - 60, tableY + 14); ctx.stroke();

    // pulley
    const pulleyX = W - 42, pulleyY = tableY;
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1e2533'; ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, 4, 0, Math.PI * 2); ctx.fill();

    // table block
    const bw = 52, bh = 38;
    const by = tableY - bh;
    ctx.fillStyle = '#1d4ed8'; ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(tblX - bw / 2, by, bw, bh, 5); ctx.fill(); ctx.stroke();
    label(ctx, 'm_t', tblX - 10, by + 16, '#e2e8f0', 12);
    label(ctx, p.mt + ' kg', tblX - 14, by + 30, '#93c5fd', 11);

    // horizontal rope
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tblX + bw / 2, tableY - bh / 2); ctx.lineTo(pulleyX, pulleyY); ctx.stroke();

    // hanging mass
    const hwy = pulleyY + 14 + hangY;
    const hmw = 44, hmh = 36;
    const cappedHwy = Math.min(hwy, H - hmh - 10);
    ctx.fillStyle = '#7c3aed'; ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(pulleyX - hmw / 2, cappedHwy, hmw, hmh, 5); ctx.fill(); ctx.stroke();
    label(ctx, 'm_h', pulleyX - 10, cappedHwy + 16, '#e2e8f0', 12);
    label(ctx, p.mh + ' kg', pulleyX - 14, cappedHwy + 30, '#c4b5fd', 11);

    // vertical rope
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pulleyX, pulleyY + 14); ctx.lineTo(pulleyX, cappedHwy); ctx.stroke();

    // acceleration arrows
    if (p.a > 0.05) {
      const aLen = Math.min(30, p.a * 10);
      arrow(ctx, tblX + bw / 2 + 8, tableY - bh / 2, tblX + bw / 2 + 8 + aLen, tableY - bh / 2, '#fbbf24', 2);
      arrow(ctx, pulleyX, cappedHwy + hmh + 6, pulleyX, cappedHwy + hmh + 6 + aLen, '#fbbf24', 2);
    }

    outA.textContent = fmt(p.a) + ' m/s²';
    outT.textContent = fmt(p.T) + ' N';
  }

  function tick() {
    const p = physics();
    vel += p.a * (FRAME_DT / 1000);

    Body.setVelocity(progBody, { x: vel * VIS_SCALE * (FRAME_DT / 1000), y: 0 });
    Engine.update(engine, FRAME_DT);

    const maxProg = W - 100 - START_TBLX;
    if (progBody.position.x > maxProg) {
      Body.setPosition(progBody, { x: 0, y: 0 });
      vel = 0;
    }

    draw(p);
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    Body.setPosition(progBody, { x: 0, y: 0 });
    Body.setVelocity(progBody, { x: 0, y: 0 });
    vel = 0;
  }

  [sliderMt, sliderMh, sliderMu].forEach(s => {
    s.addEventListener('input', () => {
      lblMt.textContent = sliderMt.value + ' kg';
      lblMh.textContent = sliderMh.value + ' kg';
      lblMu.textContent = (+sliderMu.value).toFixed(2);
      reset();
    });
  });

  lblMt.textContent = sliderMt.value + ' kg';
  lblMh.textContent = sliderMh.value + ' kg';
  lblMu.textContent = (+sliderMu.value).toFixed(2);

  buildSim();
  rafId = requestAnimationFrame(tick);
}

/* ── entry point ── */
function initDynamicsSims() {
  initBlockSurface();
  initInclinedPlane();
  initAtwood();
  initTableHanging();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sim-block')) initDynamicsSims();
});
