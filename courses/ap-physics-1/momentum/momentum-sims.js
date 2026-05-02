/* ============================================================
   momentum-sims.js  —  Unit 4 Linear Momentum
   Matter.js engine (physics) + Canvas 2D API (rendering)
   ============================================================ */

'use strict';

/* ── tiny helpers ── */
function fmt1(x)  { return (+x).toFixed(1); }
function fmt2(x)  { return (+x).toFixed(2); }
function fmtP(x)  { return (x >= 0 ? '+' : '') + (+x).toFixed(2); }
function el(id)   { return document.getElementById(id); }

/* ============================================================
   SIM 1 — 1D Collision Lab
   ============================================================ */
function initCollisionLab() {
  const canvas = el('sim-collision');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  /* controls */
  const slM1  = el('sl-coll-m1');
  const slM2  = el('sl-coll-m2');
  const slV1  = el('sl-coll-v1');
  const chkEl = el('chk-coll-elastic');

  slM1.addEventListener('input', () => el('lbl-coll-m1').textContent = fmt1(slM1.value) + ' kg');
  slM2.addEventListener('input', () => el('lbl-coll-m2').textContent = fmt1(slM2.value) + ' kg');
  slV1.addEventListener('input', () => el('lbl-coll-v1').textContent = fmt1(slV1.value) + ' m/s');

  /* physics state */
  const TRACK_Y = H - 45;
  const SPEED_PX = 40;   // pixels per (m/s) per second
  let m1, m2, v0;
  let ax, bx, av, bv;
  let collided, running, phase;
  let p0, ke0, rafId, lastTs;

  function cartW(m) { return 18 + m * 8; }

  function reset() {
    if (rafId) cancelAnimationFrame(rafId);
    m1 = +slM1.value; m2 = +slM2.value; v0 = +slV1.value;
    ax = 40; bx = W / 2 + 20;
    av = 0;  bv = 0;
    collided = false; running = false; phase = 'idle'; rafId = null; lastTs = null;
    p0  = m1 * v0;
    ke0 = 0.5 * m1 * v0 * v0;
    updateHUD(); draw();
  }

  function launch() {
    if (phase !== 'idle') return;
    m1 = +slM1.value; m2 = +slM2.value; v0 = +slV1.value;
    p0  = m1 * v0;
    ke0 = 0.5 * m1 * v0 * v0;
    av = v0 * SPEED_PX; bv = 0;
    phase = 'moving'; running = true; lastTs = null;
    rafId = requestAnimationFrame(tick);
  }

  function collide() {
    const va = av / SPEED_PX, vb = bv / SPEED_PX;
    let vaf, vbf;
    if (chkEl.checked) {
      vaf = ((m1 - m2) * va + 2 * m2 * vb) / (m1 + m2);
      vbf = ((m2 - m1) * vb + 2 * m1 * va) / (m1 + m2);
    } else {
      const vf = (m1 * va + m2 * vb) / (m1 + m2);
      vaf = vbf = vf;
    }
    av = vaf * SPEED_PX; bv = vbf * SPEED_PX;
  }

  function tick(ts) {
    if (!running) return;
    if (!lastTs) { lastTs = ts; rafId = requestAnimationFrame(tick); return; }
    const dt = Math.min((ts - lastTs) / 1000, 0.04);
    lastTs = ts;

    const wA = cartW(m1), wB = cartW(m2);
    if (!collided && ax + wA >= bx) {
      ax = bx - wA; collided = true; collide();
    }
    ax += av * dt; bx += bv * dt;

    /* walls */
    if (ax < 0) { ax = 0; av = Math.abs(av); }
    if (bx + wB > W) { bx = W - wB; bv = -Math.abs(bv); }

    if (collided && Math.abs(av) + Math.abs(bv) < 0.5) { running = false; phase = 'done'; }

    updateHUD(); draw();
    if (running) rafId = requestAnimationFrame(tick);
  }

  function updateHUD() {
    const va = av / SPEED_PX, vb = bv / SPEED_PX;
    const pa = m1 * va, pb = m2 * vb, ptot = pa + pb;
    const ke = 0.5 * m1 * va * va + 0.5 * m2 * vb * vb;
    el('r-coll-pa').textContent   = fmtP(pa)   + ' kg·m/s';
    el('r-coll-pb').textContent   = fmtP(pb)   + ' kg·m/s';
    el('r-coll-ptot').textContent = fmtP(ptot) + ' kg·m/s';
    el('r-coll-ketot').textContent = fmt2(ke)  + ' J';

    const s = el('r-coll-status');
    if (phase === 'idle')                  { s.textContent = 'Ready — press Launch'; s.style.color = 'var(--text-muted)'; }
    else if (phase === 'moving' && !collided) { s.textContent = 'Approaching…'; s.style.color = 'var(--accent)'; }
    else if (phase === 'moving' && collided)  { s.textContent = 'COLLISION!'; s.style.color = '#dc2626'; }
    else {
      const pOk = Math.abs(ptot - p0) < 0.05;
      const keNote = chkEl.checked
        ? (Math.abs(ke - ke0) < 0.15 ? '  KE conserved ✓' : '  KE loss (check elastic)')
        : '  KE lost (inelastic ✓)';
      s.textContent = (pOk ? 'p conserved ✓' : 'p error!') + keNote;
      s.style.color = pOk ? '#16a34a' : '#dc2626';
    }
  }

  function drawArrow(x, y, len, dir, color, label) {
    if (Math.abs(len) < 1) return;
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dir * len, y); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + dir * len, y);
    ctx.lineTo(x + dir * len - dir * 7, y - 4);
    ctx.lineTo(x + dir * len - dir * 7, y + 4);
    ctx.closePath(); ctx.fill();
    if (label) {
      ctx.fillStyle = '#78350f'; ctx.font = '9px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(label, x + dir * len / 2, y - 10);
    }
  }

  function drawCart(x, w, color, label) {
    const H_CART = 28, y = TRACK_Y - H_CART, r = 6;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(x, y, w, H_CART, 3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + H_CART / 2);
    /* wheels */
    ctx.fillStyle = '#334155';
    for (const wx of [x + r + 2, x + w - r - 2]) {
      ctx.beginPath(); ctx.arc(wx, TRACK_Y + 1, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    /* track */
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, TRACK_Y + 1); ctx.lineTo(W, TRACK_Y + 1); ctx.stroke();

    const wA = cartW(m1), wB = cartW(m2);
    drawCart(ax, wA, '#2563eb', 'A ' + fmt1(m1) + 'kg');
    drawCart(bx, wB, '#dc2626', 'B ' + fmt1(m2) + 'kg');

    /* velocity arrows */
    const arrowY = TRACK_Y - 28 - 18;
    if (Math.abs(av) > 0.5) drawArrow(av > 0 ? ax + wA : ax, arrowY, Math.min(Math.abs(av) * 1.5, 65), av > 0 ? 1 : -1, '#f59e0b', fmt1(Math.abs(av / SPEED_PX)) + 'm/s');
    if (Math.abs(bv) > 0.5) drawArrow(bv > 0 ? bx + wB : bx, arrowY, Math.min(Math.abs(bv) * 1.5, 65), bv > 0 ? 1 : -1, '#f59e0b', fmt1(Math.abs(bv / SPEED_PX)) + 'm/s');

    if (phase === 'idle') {
      ctx.fillStyle = '#94a3b8'; ctx.font = '12px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('Press Launch to start', W / 2, 8);
    }
  }

  el('btn-coll-launch').addEventListener('click', launch);
  el('btn-coll-reset').addEventListener('click', reset);
  reset();
}

/* ============================================================
   SIM 2 — Explosion / Recoil
   ============================================================ */
function initExplosion() {
  const canvas = el('sim-explosion');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const slM1 = el('sl-exp-m1');
  const slM2 = el('sl-exp-m2');
  const slJ  = el('sl-exp-j');

  slM1.addEventListener('input', () => el('lbl-exp-m1').textContent = fmt1(slM1.value) + ' kg');
  slM2.addEventListener('input', () => el('lbl-exp-m2').textContent = fmt1(slM2.value) + ' kg');
  slJ.addEventListener('input',  () => el('lbl-exp-j').textContent  = slJ.value + ' N·s');

  const CY = H / 2 + 5;
  const SPEED_PX = 25;
  let m1, m2, J;
  let x1, x2, v1px, v2px;
  let phase = 'idle', rafId = null, lastTs = null, flash = 0;

  function blockW(m) { return 18 + m * 8; }

  function reset() {
    if (rafId) cancelAnimationFrame(rafId);
    m1 = +slM1.value; m2 = +slM2.value; J = +slJ.value;
    x1 = W / 2 - blockW(m1) - 2;
    x2 = W / 2 + 2;
    v1px = 0; v2px = 0; phase = 'idle'; flash = 0; lastTs = null; rafId = null;
    updateHUD(0, 0);
    draw();
  }

  function fire() {
    if (phase !== 'idle') return;
    m1 = +slM1.value; m2 = +slM2.value; J = +slJ.value;
    /* conservation: m1*v1 + m2*v2 = 0  →  v1 = -J/m1, v2 = +J/m2 (gun model) */
    v1px = -(J / m1) * SPEED_PX;
    v2px =  (J / m2) * SPEED_PX;
    phase = 'moving'; flash = 10; lastTs = null;
    rafId = requestAnimationFrame(tick);
  }

  function updateHUD(v1r, v2r) {
    const ke1 = 0.5 * m1 * v1r * v1r, ke2 = 0.5 * m2 * v2r * v2r;
    el('r-exp-v1').textContent  = fmtP(v1r) + ' m/s';
    el('r-exp-v2').textContent  = fmtP(v2r) + ' m/s';
    el('r-exp-ptot').textContent = fmtP(m1 * v1r + m2 * v2r) + ' kg·m/s';
    el('r-exp-ke').textContent  = fmt2(ke1 + ke2) + ' J';
  }

  function tick(ts) {
    if (!lastTs) { lastTs = ts; rafId = requestAnimationFrame(tick); return; }
    const dt = Math.min((ts - lastTs) / 1000, 0.04); lastTs = ts;
    if (flash > 0) flash--;
    x1 += v1px * dt; x2 += v2px * dt;
    updateHUD(v1px / SPEED_PX, v2px / SPEED_PX);
    draw();
    if (x2 < W + 100 || x1 > -100) rafId = requestAnimationFrame(tick);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, CY + 18); ctx.lineTo(W, CY + 18); ctx.stroke();

    if (flash > 0) {
      ctx.fillStyle = `rgba(251,191,36,${flash / 10 * 0.4})`;
      ctx.beginPath(); ctx.arc(W / 2, CY, 25 + (10 - flash) * 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d97706'; ctx.font = 'bold 16px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('BOOM!', W / 2, CY - 38);
    }

    const w1 = blockW(m1), w2 = blockW(m2);

    if (phase === 'idle') {
      /* fused object */
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath(); ctx.roundRect(W/2 - w1, CY - 15, w1, 30, [4,0,0,4]); ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.roundRect(W/2, CY - 15, w2, 30, [0,4,4,0]); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(W/2, CY - 15); ctx.lineTo(W/2, CY + 15); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(fmt1(m1) + 'kg', W/2 - w1/2, CY);
      ctx.fillText(fmt1(m2) + 'kg', W/2 + w2/2, CY);
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter,sans-serif'; ctx.textBaseline = 'bottom';
      ctx.fillText('v = 0,  p_total = 0', W / 2, CY - 20);
    } else {
      /* left piece */
      if (x1 + w1 > -5 && x1 < W + 5) {
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath(); ctx.roundRect(x1, CY - 15, w1, 30, 4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(fmt1(m1) + 'kg', x1 + w1 / 2, CY);
        if (Math.abs(v1px) > 0.5) {
          const al = Math.min(Math.abs(v1px) * 1.2, 55);
          drawArrow2(x1, CY - 25, al, v1px < 0 ? -1 : 1, '#f59e0b', fmt1(Math.abs(v1px / SPEED_PX)) + 'm/s');
        }
      }
      /* right piece */
      if (x2 + w2 > -5 && x2 < W + 5) {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.roundRect(x2, CY - 15, w2, 30, 4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(fmt1(m2) + 'kg', x2 + w2 / 2, CY);
        if (Math.abs(v2px) > 0.5) {
          const al = Math.min(Math.abs(v2px) * 1.2, 55);
          drawArrow2(x2 + w2, CY - 25, al, v2px > 0 ? 1 : -1, '#f59e0b', fmt1(Math.abs(v2px / SPEED_PX)) + 'm/s');
        }
      }
    }
  }

  function drawArrow2(x, y, len, dir, color, label) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dir * len, y); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + dir * len, y);
    ctx.lineTo(x + dir * len - dir * 7, y - 4);
    ctx.lineTo(x + dir * len - dir * 7, y + 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#78350f'; ctx.font = '9px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + dir * len / 2, y - 10);
  }

  el('btn-exp-fire').addEventListener('click', fire);
  el('btn-exp-reset').addEventListener('click', reset);
  reset();
}

/* ============================================================
   SIM 3 — 2D Collision (Matter.js engine, manual Canvas 2D renderer)
   ============================================================ */
function init2DCollision() {
  const canvas = el('sim-twod');
  if (!canvas) return;

  /* Matter.js must be loaded (from index.html CDN tag) */
  if (typeof Matter === 'undefined') {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#94a3b8'; ctx.font = '13px Inter,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Matter.js failed to load — check network.', canvas.width / 2, canvas.height / 2);
    return;
  }

  const { Engine, Runner, Bodies, Composite, Events, Body, Vector } = Matter;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const slM1  = el('sl-2d-m1');
  const slM2  = el('sl-2d-m2');
  const slOff = el('sl-2d-off');
  slM1.addEventListener('input',  () => el('lbl-2d-m1').textContent  = fmt1(slM1.value)  + ' kg');
  slM2.addEventListener('input',  () => el('lbl-2d-m2').textContent  = fmt1(slM2.value)  + ' kg');
  slOff.addEventListener('input', () => el('lbl-2d-off').textContent = slOff.value + ' px');

  let engine, runner, puckA, puckB;
  let launched = false, collisionRecorded = false;
  let pxBefore = null, pyBefore = null;
  let rafId = null;
  const SPEED = 4; // m/s in sim units

  function radiusFor(m) { return 10 + m * 4; }

  function buildEngine() {
    if (engine) {
      Runner.stop(runner);
      Events.off(engine);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    }
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    const m1  = +slM1.value, m2 = +slM2.value;
    const off = +slOff.value;
    const r1  = radiusFor(m1), r2 = radiusFor(m2);

    engine = Engine.create({ gravity: { x: 0, y: 0 } });
    runner = Runner.create();

    puckA = Bodies.circle(r1 + 10, H / 2, r1, {
      restitution: 1, frictionAir: 0, friction: 0, label: 'A'
    });
    Body.setMass(puckA, m1);

    puckB = Bodies.circle(W / 2 + 20, H / 2 + off, r2, {
      restitution: 1, frictionAir: 0, friction: 0, label: 'B'
    });
    Body.setMass(puckB, m2);

    Composite.add(engine.world, [puckA, puckB]);

    launched = false; collisionRecorded = false;
    pxBefore = null; pyBefore = null;

    Events.on(engine, 'collisionStart', () => {
      if (!collisionRecorded) {
        collisionRecorded = true;
        const va = puckA.velocity, vb = puckB.velocity;
        pxBefore = puckA.mass * va.x + puckB.mass * vb.x;
        pyBefore = puckA.mass * va.y + puckB.mass * vb.y;
        el('r-2d-pxi').textContent = fmtP(pxBefore);
        el('r-2d-pyi').textContent = fmtP(pyBefore);
      }
    });

    Events.on(engine, 'afterUpdate', () => {
      if (collisionRecorded) {
        const va = puckA.velocity, vb = puckB.velocity;
        const pxA = puckA.mass * va.x + puckB.mass * vb.x;
        const pyA = puckA.mass * va.y + puckB.mass * vb.y;
        el('r-2d-pxf').textContent = fmtP(pxA);
        el('r-2d-pyf').textContent = fmtP(pyA);
      }
    });

    /* render loop */
    rafId = requestAnimationFrame(renderLoop);
    draw2D();
  }

  function renderLoop() {
    if (launched) Runner.tick(runner, engine, 1000 / 60);
    draw2D();
    rafId = requestAnimationFrame(renderLoop);
  }

  function draw2D() {
    ctx.clearRect(0, 0, W, H);

    /* background */
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, W, H);

    /* grid lines */
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    function drawPuck(puck, color, label) {
      const p = puck.position, r = puck.circleRadius;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      /* velocity arrow */
      const v = puck.velocity;
      const spd = Math.sqrt(v.x * v.x + v.y * v.y);
      if (spd > 0.1) {
        const scale = 18;
        const ex = p.x + v.x * scale, ey = p.y + v.y * scale;
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        const angle = Math.atan2(v.y, v.x);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 8 * Math.cos(angle - 0.4), ey - 8 * Math.sin(angle - 0.4));
        ctx.lineTo(ex - 8 * Math.cos(angle + 0.4), ey - 8 * Math.sin(angle + 0.4));
        ctx.closePath(); ctx.fill();
      }

      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, p.x, p.y);
    }

    drawPuck(puckA, '#2563eb', 'A');
    drawPuck(puckB, '#dc2626', 'B');

    if (!launched) {
      ctx.fillStyle = '#64748b'; ctx.font = '12px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('Press Launch — puck A will glide right and glance puck B', W / 2, 8);
    }
  }

  function launch() {
    if (launched) return;
    launched = true;
    Body.setVelocity(puckA, { x: SPEED, y: 0 });
    el('r-2d-pxi').textContent = fmtP(puckA.mass * SPEED);
    el('r-2d-pyi').textContent = fmtP(0);
  }

  function resetSim() {
    el('r-2d-pxi').textContent = '—'; el('r-2d-pxf').textContent = '—';
    el('r-2d-pyi').textContent = '—'; el('r-2d-pyf').textContent = '—';
    buildEngine();
  }

  el('btn-2d-launch').addEventListener('click', launch);
  el('btn-2d-reset').addEventListener('click', resetSim);

  buildEngine();
}

/* ============================================================
   SIM 4 — Impulse Visualizer
   ============================================================ */
function initImpulse() {
  const canvas = el('sim-impulse');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const slMass  = el('sl-imp-mass');
  const slForce = el('sl-imp-force');
  const slDur   = el('sl-imp-dur');

  slMass.addEventListener('input',  () => el('lbl-imp-mass').textContent  = fmt1(slMass.value)  + ' kg');
  slForce.addEventListener('input', () => el('lbl-imp-force').textContent = slForce.value       + ' N');
  slDur.addEventListener('input',   () => el('lbl-imp-dur').textContent   = fmt1(slDur.value)   + ' s');

  /* layout */
  const GX = 15, GY = 10, GW = 280, GH = 120;
  const BLOCK_Y = H - 58, BH = 36, BW = 56;
  const SPEED_PX = 30;

  let mass, Fpeak, dur;
  let phase = 'idle', t = 0, blockX = 20, vel = 0, rafId = null, lastTs = null;

  function forceAt(ti) {
    if (ti <= 0 || ti >= dur) return 0;
    const r = dur * 0.2;
    if (ti < r)       return Fpeak * (ti / r);
    if (ti > dur - r) return Fpeak * ((dur - ti) / r);
    return Fpeak;
  }

  function reset() {
    if (rafId) cancelAnimationFrame(rafId);
    mass = +slMass.value; Fpeak = +slForce.value; dur = +slDur.value;
    phase = 'idle'; t = 0; blockX = 20; vel = 0; rafId = null; lastTs = null;
    el('r-imp-j').textContent  = '0 N·s';
    el('r-imp-dp').textContent = '0 kg·m/s';
    el('r-imp-vf').textContent = '0 m/s';
    draw(0);
  }

  function applyImpulse() {
    if (phase !== 'idle') return;
    mass = +slMass.value; Fpeak = +slForce.value; dur = +slDur.value;
    phase = 'running'; lastTs = null;
    rafId = requestAnimationFrame(tick);
  }

  function tick(ts) {
    if (!lastTs) { lastTs = ts; rafId = requestAnimationFrame(tick); return; }
    const dt = Math.min((ts - lastTs) / 1000, 0.033); lastTs = ts;

    if (phase === 'running') {
      if (t <= dur) {
        const F = forceAt(t);
        vel     += (F / mass) * dt;
        blockX  += vel * SPEED_PX * dt;
        t       += dt;
      } else { phase = 'done'; }
    }
    if (phase === 'done') blockX += vel * SPEED_PX * dt;

    /* impulse = area of trapezoid = 0.5 * Fpeak * dur (approximately) */
    const J  = 0.5 * Fpeak * dur;
    const dp = mass * vel;
    el('r-imp-j').textContent  = fmt2(J)  + ' N·s';
    el('r-imp-dp').textContent = fmt2(dp) + ' kg·m/s';
    el('r-imp-vf').textContent = fmt2(vel) + ' m/s';

    draw(t);
    if (blockX < W - BW - 5) rafId = requestAnimationFrame(tick);
  }

  function draw(curT) {
    ctx.clearRect(0, 0, W, H);

    /* ── F-t graph ── */
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.rect(GX, GY, GW, GH); ctx.fill(); ctx.stroke();

    /* axes */
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(GX, GY + GH); ctx.lineTo(GX + GW, GY + GH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GX, GY); ctx.lineTo(GX, GY + GH); ctx.stroke();

    ctx.fillStyle = '#64748b'; ctx.font = '10px Inter,sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('t (s)', GX + GW / 2, GY + GH + 14);
    ctx.save(); ctx.translate(GX - 12, GY + GH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('F (N)', 0, 0); ctx.restore();

    const tSc = (GW - 8) / Math.max(dur, 0.01);
    const fSc = (GH - 8) / Math.max(Fpeak, 1);

    /* shaded area up to curT */
    const fillT = Math.min(curT, dur);
    if (fillT > 0) {
      ctx.fillStyle = 'rgba(37,99,235,0.15)';
      ctx.beginPath(); ctx.moveTo(GX + 4, GY + GH);
      for (let ti = 0; ti <= fillT; ti += 0.02) {
        ctx.lineTo(GX + 4 + ti * tSc, GY + GH - forceAt(ti) * fSc);
      }
      ctx.lineTo(GX + 4 + fillT * tSc, GY + GH); ctx.closePath(); ctx.fill();
    }

    /* full curve (dashed preview) */
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.setLineDash([4,3]);
    ctx.beginPath();
    for (let ti = 0; ti <= dur; ti += 0.02) {
      const px = GX + 4 + ti * tSc, py = GY + GH - forceAt(ti) * fSc;
      ti === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.setLineDash([]);

    /* live curve */
    if (phase === 'running' || phase === 'done') {
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let ti = 0; ti <= Math.min(curT, dur); ti += 0.02) {
        const px = GX + 4 + ti * tSc, py = GY + GH - forceAt(ti) * fSc;
        ti === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    /* title */
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 10px Inter,sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('F–t graph (shaded = Impulse J)', GX + 4, GY + 4);

    /* impulse label when done */
    if (phase === 'done') {
      const J = 0.5 * Fpeak * dur;
      ctx.fillStyle = '#1d4ed8'; ctx.font = 'bold 12px Inter,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('J = ' + fmt2(J) + ' N·s', GX + GW / 2, GY + GH / 2 + 10);
    }

    /* ── Block on track ── */
    const trackY = BLOCK_Y + BH;
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, trackY); ctx.lineTo(W, trackY); ctx.stroke();

    const bx = Math.min(blockX, W - BW - 3);
    ctx.fillStyle = '#2563eb';
    ctx.beginPath(); ctx.roundRect(bx, BLOCK_Y, BW, BH, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(fmt1(mass) + ' kg', bx + BW / 2, BLOCK_Y + BH / 2);

    /* velocity arrow */
    if (vel > 0.05) {
      const al = Math.min(vel * 22, 75);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx + BW, BLOCK_Y + BH / 2 - 14);
      ctx.lineTo(bx + BW + al, BLOCK_Y + BH / 2 - 14); ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(bx + BW + al, BLOCK_Y + BH / 2 - 14);
      ctx.lineTo(bx + BW + al - 7, BLOCK_Y + BH / 2 - 18);
      ctx.lineTo(bx + BW + al - 7, BLOCK_Y + BH / 2 - 10);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#92400e'; ctx.font = '9px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fmt2(vel) + ' m/s', bx + BW + al / 2, BLOCK_Y + BH / 2 - 26);
    }

    /* force arrow during push */
    if (phase === 'running' && curT <= dur) {
      const F = forceAt(curT);
      const fal = (F / Fpeak) * 55;
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, BLOCK_Y + BH / 2);
      ctx.lineTo(bx - fal, BLOCK_Y + BH / 2); ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(bx, BLOCK_Y + BH / 2);
      ctx.lineTo(bx - 7, BLOCK_Y + BH / 2 - 4);
      ctx.lineTo(bx - 7, BLOCK_Y + BH / 2 + 4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#991b1b'; ctx.font = '9px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fmt1(F) + ' N', bx - fal / 2, BLOCK_Y + BH / 2 - 12);
    }

    if (phase === 'idle') {
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter,sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('← Press "Apply Impulse"', W - 8, BLOCK_Y + BH / 2);
    }
  }

  el('btn-imp-apply').addEventListener('click', applyImpulse);
  el('btn-imp-reset').addEventListener('click', reset);
  reset();
}

/* ============================================================
   ENTRY POINT — called by section-loader.js after tab activates
   ============================================================ */
function initMomentumSims() {
  initCollisionLab();
  initExplosion();
  init2DCollision();
  initImpulse();
}
