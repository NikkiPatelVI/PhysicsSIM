/* ============================================================
   momentum-sims.js  —  Matter.js simulations for Unit 4
   Collision Lab | Explosion | 2D Collision | Impulse
   ============================================================ */

'use strict';

/* ── helpers ── */
function fmt1(x)  { return x.toFixed(1); }
function fmt2(x)  { return x.toFixed(2); }
function fmtP(x)  { return (x >= 0 ? '+' : '') + x.toFixed(2); }

/* ============================================================
   SIM 1 — 1D Collision Lab (Matter.js engine + custom canvas renderer)
   ============================================================ */
function initCollisionLab() {
  const canvas  = document.getElementById('canvas-collision');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  /* --- controls --- */
  const slM1  = document.getElementById('collision-m1');
  const slM2  = document.getElementById('collision-m2');
  const slV1  = document.getElementById('collision-v1');
  const chkEl = document.getElementById('collision-elastic');
  const btnLaunch = document.getElementById('collision-launch');
  const btnReset  = document.getElementById('collision-reset');
  const valM1 = document.getElementById('collision-m1-val');
  const valM2 = document.getElementById('collision-m2-val');
  const valV1 = document.getElementById('collision-v1-val');

  /* live label updates */
  slM1.addEventListener('input', () => { valM1.textContent = parseFloat(slM1.value).toFixed(1); });
  slM2.addEventListener('input', () => { valM2.textContent = parseFloat(slM2.value).toFixed(1); });
  slV1.addEventListener('input', () => { valV1.textContent = parseFloat(slV1.value).toFixed(1); });

  /* --- state --- */
  const SCALE = 50; // pixels per kg (visual size)
  const TRACK_Y = H - 40;
  const GROUND  = H - 10;
  const SPEED_SCALE = 30; // px/s per m/s

  let m1, m2, v1, v2, elastic;
  let cartAx, cartBx;
  let cartAv, cartBv;
  let collided = false;
  let running  = false;
  let rafId    = null;
  let p0total  = 0;
  let ke0total = 0;
  let phase = 'idle'; // idle | moving | done

  function readControls() {
    m1 = parseFloat(slM1.value);
    m2 = parseFloat(slM2.value);
    v1 = parseFloat(slV1.value);
    v2 = 0;
    elastic = chkEl.checked;
  }

  function reset() {
    readControls();
    phase = 'idle';
    collided = false;
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    cartAx = 60;
    cartBx = W / 2 + 30;
    cartAv = 0;
    cartBv = 0;

    p0total  = m1 * v1 + m2 * 0;
    ke0total = 0.5 * m1 * v1 * v1;

    updateReadout();
    draw();
  }

  function launch() {
    if (phase !== 'idle') return;
    readControls();
    cartAv = v1 * SPEED_SCALE;
    cartBv = 0;
    p0total  = m1 * v1;
    ke0total = 0.5 * m1 * v1 * v1;
    phase = 'moving';
    running = true;
    rafId = requestAnimationFrame(tick);
  }

  function cartWidth(m) { return 20 + m * 10; }

  function doCollision() {
    /* convert pixel/s back to real velocity */
    const va = cartAv / SPEED_SCALE;
    const vb = cartBv / SPEED_SCALE;
    let vaf, vbf;
    if (elastic) {
      vaf = ((m1 - m2) * va + 2 * m2 * vb) / (m1 + m2);
      vbf = ((m2 - m1) * vb + 2 * m1 * va) / (m1 + m2);
    } else {
      const vfInelastic = (m1 * va + m2 * vb) / (m1 + m2);
      vaf = vfInelastic;
      vbf = vfInelastic;
    }
    cartAv = vaf * SPEED_SCALE;
    cartBv = vbf * SPEED_SCALE;
  }

  let lastT = null;
  function tick(ts) {
    if (!running) return;
    if (!lastT) lastT = ts;
    const dt = Math.min((ts - lastT) / 1000, 0.05); // seconds, capped
    lastT = ts;

    const wA = cartWidth(m1), wB = cartWidth(m2);

    /* --- collision check --- */
    if (!collided && cartAx + wA >= cartBx) {
      collided = true;
      cartAx = cartBx - wA; // snap so they touch
      doCollision();
    }

    /* --- move carts --- */
    cartAx += cartAv * dt;
    cartBx += cartBv * dt;

    /* --- wall bounce at edges (optional, keeps carts on screen) --- */
    if (cartAx < 0) { cartAx = 0; cartAv = Math.abs(cartAv); }
    if (cartBx + wB > W) { cartBx = W - wB; cartBv = -Math.abs(cartBv); }

    /* stop when both slow down and off screen or nearly stopped */
    const speed = Math.abs(cartAv) + Math.abs(cartBv);
    if (collided && speed < 0.5) { running = false; phase = 'done'; }

    updateReadout();
    draw();
    if (running) rafId = requestAnimationFrame(tick);
  }

  function updateReadout() {
    const va = cartAv / SPEED_SCALE;
    const vb = cartBv / SPEED_SCALE;
    const pa = m1 * va, pb = m2 * vb;
    const ptot = pa + pb;
    const kea = 0.5 * m1 * va * va;
    const keb = 0.5 * m2 * vb * vb;
    const ketot = kea + keb;

    document.getElementById('r-coll-pa').textContent    = fmtP(pa)   + ' kg·m/s';
    document.getElementById('r-coll-pb').textContent    = fmtP(pb)   + ' kg·m/s';
    document.getElementById('r-coll-ptot').textContent  = fmtP(ptot) + ' kg·m/s';
    document.getElementById('r-coll-kea').textContent   = fmt2(kea)  + ' J';
    document.getElementById('r-coll-keb').textContent   = fmt2(keb)  + ' J';
    document.getElementById('r-coll-ketot').textContent = fmt2(ketot) + ' J';

    const statusEl = document.getElementById('r-coll-status');
    if (phase === 'idle') {
      statusEl.textContent = 'Ready — press Launch';
      statusEl.style.color = 'var(--text-muted)';
    } else if (phase === 'moving' && !collided) {
      statusEl.textContent = 'Approaching…';
      statusEl.style.color = 'var(--accent)';
    } else if (phase === 'moving' && collided) {
      statusEl.textContent = 'COLLISION!';
      statusEl.style.color = '#dc2626';
    } else {
      const pConserved = Math.abs(ptot - p0total) < 0.05;
      const keStr = elastic
        ? (Math.abs(ketot - ke0total) < 0.1 ? ' | KE conserved ✓' : ' | KE lost (check elastic setting)')
        : ' | KE lost (inelastic ✓)';
      statusEl.textContent = (pConserved ? 'p conserved ✓' : 'p NOT conserved') + keStr;
      statusEl.style.color = pConserved ? '#16a34a' : '#dc2626';
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* track */
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, TRACK_Y + 1); ctx.lineTo(W, TRACK_Y + 1); ctx.stroke();

    /* Cart A (blue) */
    const wA = cartWidth(m1), wB = cartWidth(m2);
    const cartH = 30;
    const yTop = TRACK_Y - cartH;

    /* wheel radius */
    const wr = 7;

    function drawCart(x, w, color, label, vel) {
      /* body */
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, yTop, w, cartH, 4);
      ctx.fill();

      /* label */
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, yTop + cartH / 2);

      /* wheels */
      ctx.fillStyle = '#475569';
      for (const wx of [x + wr + 2, x + w - wr - 2]) {
        ctx.beginPath();
        ctx.arc(wx, TRACK_Y + 1, wr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      /* velocity arrow */
      if (Math.abs(vel) > 0.5) {
        const arrowLen = Math.min(Math.abs(vel) * 2, 60);
        const dir = vel > 0 ? 1 : -1;
        const ax = vel > 0 ? x + w : x;
        const ay = yTop + cartH / 2 - 15;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + dir * arrowLen, ay);
        ctx.stroke();
        /* arrowhead */
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(ax + dir * arrowLen, ay);
        ctx.lineTo(ax + dir * arrowLen - dir * 8, ay - 4);
        ctx.lineTo(ax + dir * arrowLen - dir * 8, ay + 4);
        ctx.closePath();
        ctx.fill();
        /* speed label */
        ctx.fillStyle = '#92400e';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fmt1(Math.abs(vel / SPEED_SCALE)) + ' m/s', ax + dir * (arrowLen / 2), ay - 10);
      }
    }

    drawCart(cartAx, wA, '#2563eb', 'A ' + fmt1(m1) + 'kg', cartAv);
    drawCart(cartBx, wB, '#dc2626', 'B ' + fmt1(m2) + 'kg', cartBv);

    /* collision flash */
    if (phase === 'moving' && collided && Math.abs(cartAv - cartBv) < 2) {
      ctx.fillStyle = 'rgba(251,191,36,0.25)';
      ctx.fillRect(cartBx - 5, yTop - 5, wA + wB + 10, cartH + 10);
    }
  }

  btnLaunch.addEventListener('click', launch);
  btnReset.addEventListener('click', () => { lastT = null; reset(); });

  reset();
  draw();
}

/* ============================================================
   SIM 2 — Explosion / Recoil (canvas-based, no engine needed)
   ============================================================ */
function initExplosion() {
  const canvas = document.getElementById('canvas-explosion');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const slM1      = document.getElementById('explode-m1');
  const slM2      = document.getElementById('explode-m2');
  const slImpulse = document.getElementById('explode-impulse');
  const valM1     = document.getElementById('explode-m1-val');
  const valM2     = document.getElementById('explode-m2-val');
  const valImp    = document.getElementById('explode-impulse-val');
  const btnFire   = document.getElementById('explode-fire');
  const btnReset  = document.getElementById('explode-reset');

  slM1.addEventListener('input', () => valM1.textContent = parseFloat(slM1.value).toFixed(1));
  slM2.addEventListener('input', () => valM2.textContent = parseFloat(slM2.value).toFixed(1));
  slImpulse.addEventListener('input', () => valImp.textContent = slImpulse.value);

  const CY = H / 2 + 10;
  const SPEED_SCALE = 20;
  let m1, m2, J;
  let x1, x2, v1px, v2px;
  let phase = 'idle'; // idle | exploding | moving
  let rafId = null;
  let lastT = null;
  let flashFrames = 0;

  function reset() {
    m1 = parseFloat(slM1.value);
    m2 = parseFloat(slM2.value);
    J  = parseFloat(slImpulse.value);
    x1 = W / 2 - 15;
    x2 = W / 2 + 15;
    v1px = 0; v2px = 0;
    phase = 'idle';
    flashFrames = 0;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    updateReadout(0, 0);
    draw();
  }

  function fire() {
    if (phase !== 'idle') return;
    m1 = parseFloat(slM1.value);
    m2 = parseFloat(slM2.value);
    J  = parseFloat(slImpulse.value);
    /* 0 = m1*v1f + m2*v2f,  J = m1*|v1f| (impulse split) */
    const v1r = -J / (m1 + m2) * m2 / m1 * (m1 + m2) / m2; // simplifies:
    /* Proper: v2f = J/(m1+m2)*(m1/m2)... let's just use conservation:
       0 = m1*v1f + m2*v2f  and  J_net = m2*v2f - m1*(-v1f) = (m1+m2)*v2f... actually:
       By momentum conservation from 0: m2*v2f = -m1*v1f
       By energy input: ½m1*v1f² + ½m2*v2f² = KE_added = J (treat J as energy here for realism)
       ...
       Simpler: treat J as impulse on system split by mass:
       impulse on m2 = J * m1/(m1+m2) ... no, let's just keep it simple:
       v2f = J / m2 (all impulse goes right), v1f = -J/m1 (reaction) — this is the gun model */
    const v2r =  J / m2;
    const v1r2 = -J / m1;
    v2px = v2r * SPEED_SCALE;
    v1px = v1r2 * SPEED_SCALE;
    phase = 'moving';
    flashFrames = 8;
    lastT = null;
    rafId = requestAnimationFrame(tick);
  }

  function updateReadout(v1real, v2real) {
    const p1 = m1 * v1real, p2 = m2 * v2real;
    const ke1 = 0.5 * m1 * v1real * v1real;
    const ke2 = 0.5 * m2 * v2real * v2real;
    document.getElementById('r-exp-v1').textContent    = fmtP(v1real) + ' m/s';
    document.getElementById('r-exp-v2').textContent    = fmtP(v2real) + ' m/s';
    document.getElementById('r-exp-ptot').textContent  = fmtP(p1 + p2) + ' kg·m/s';
    document.getElementById('r-exp-ke1').textContent   = fmt2(ke1) + ' J';
    document.getElementById('r-exp-ke2').textContent   = fmt2(ke2) + ' J';
    document.getElementById('r-exp-ketot').textContent = fmt2(ke1 + ke2) + ' J';
  }

  function tick(ts) {
    if (!lastT) lastT = ts;
    const dt = Math.min((ts - lastT) / 1000, 0.05);
    lastT = ts;

    if (flashFrames > 0) flashFrames--;

    x1 += v1px * dt;
    x2 += v2px * dt;

    const v1r = v1px / SPEED_SCALE;
    const v2r = v2px / SPEED_SCALE;
    updateReadout(v1r, v2r);
    draw();

    /* keep going until both off-screen */
    if (x2 < W + 80 || x1 > -80) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function blockW(m) { return 20 + m * 8; }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* ground line */
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, CY + 20); ctx.lineTo(W, CY + 20); ctx.stroke();

    /* explosion flash */
    if (flashFrames > 0) {
      const alpha = flashFrames / 8;
      ctx.fillStyle = `rgba(251,191,36,${alpha * 0.5})`;
      ctx.beginPath(); ctx.arc(W / 2, CY, 30 + (8 - flashFrames) * 4, 0, Math.PI * 2); ctx.fill();
      /* bang text */
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BOOM!', W / 2, CY - 40);
    }

    if (phase === 'idle') {
      /* draw fused object in center */
      const totalW = blockW(m1) + blockW(m2);
      const startX = W / 2 - totalW / 2;
      /* left piece */
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath(); ctx.roundRect(startX, CY - 15, blockW(m1), 30, [4,0,0,4]); ctx.fill();
      /* right piece */
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.roundRect(startX + blockW(m1), CY - 15, blockW(m2), 30, [0,4,4,0]); ctx.fill();
      /* dashed seam */
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(startX + blockW(m1), CY - 15); ctx.lineTo(startX + blockW(m1), CY + 15); ctx.stroke();
      ctx.setLineDash([]);
      /* labels */
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(fmt1(m1) + 'kg', startX + blockW(m1) / 2, CY);
      ctx.fillText(fmt1(m2) + 'kg', startX + blockW(m1) + blockW(m2) / 2, CY);

      ctx.fillStyle = '#475569'; ctx.font = '12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('v = 0  (p_total = 0)', W / 2, CY - 22);
    } else {
      /* draw separated pieces */
      function drawPiece(x, w, color, label, vel) {
        if (x + w < -10 || x > W + 10) return;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(x, CY - 15, w, 30, 4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, CY);
        /* velocity arrow */
        const arrowLen = Math.min(Math.abs(vel) * 1.5, 70);
        const dir = vel > 0 ? 1 : -1;
        const ax = vel > 0 ? x + w + 4 : x - 4;
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax, CY - 20); ctx.lineTo(ax + dir * arrowLen, CY - 20); ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(ax + dir * arrowLen, CY - 20);
        ctx.lineTo(ax + dir * arrowLen - dir * 7, CY - 24);
        ctx.lineTo(ax + dir * arrowLen - dir * 7, CY - 16);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#78350f'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
        ctx.fillText(fmt1(Math.abs(vel / SPEED_SCALE)) + ' m/s', ax + dir * arrowLen / 2, CY - 32);
      }
      drawPiece(x1, blockW(m1), '#7c3aed', fmt1(m1) + 'kg', v1px);
      drawPiece(x2, blockW(m2), '#dc2626', fmt1(m2) + 'kg', v2px);
    }
  }

  btnFire.addEventListener('click', fire);
  btnReset.addEventListener('click', reset);

  m1 = parseFloat(slM1.value);
  m2 = parseFloat(slM2.value);
  J  = parseFloat(slImpulse.value);
  reset();
}

/* ============================================================
   SIM 3 — 2D Collision using Matter.js engine
   ============================================================ */
function init2DCollision() {
  const canvas = document.getElementById('canvas-2d');
  if (!canvas) return;

  const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

  const slM1     = document.getElementById('twod-m1');
  const slM2     = document.getElementById('twod-m2');
  const slOffset = document.getElementById('twod-offset');
  const valM1    = document.getElementById('twod-m1-val');
  const valM2    = document.getElementById('twod-m2-val');
  const valOff   = document.getElementById('twod-offset-val');
  const btnLaunch = document.getElementById('twod-launch');
  const btnReset  = document.getElementById('twod-reset');

  slM1.addEventListener('input', () => valM1.textContent = parseFloat(slM1.value).toFixed(1));
  slM2.addEventListener('input', () => valM2.textContent = parseFloat(slM2.value).toFixed(1));
  slOffset.addEventListener('input', () => valOff.textContent = slOffset.value);

  let engine, runner, render;
  let puckA, puckB;
  let collisionOccurred = false;
  let pxBefore, pyBefore;
  let launched = false;

  const W = canvas.width, H = canvas.height;
  const PUCK_SPEED = 5; // m/s in simulation units

  function radiusForMass(m) { return 12 + m * 4; }

  function setupEngine() {
    if (engine) {
      Runner.stop(runner);
      Render.stop(render);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    }

    const m1 = parseFloat(slM1.value);
    const m2 = parseFloat(slM2.value);
    const offset = parseInt(slOffset.value);

    engine = Engine.create({ gravity: { x: 0, y: 0 } });
    render = Render.create({
      canvas,
      engine,
      options: {
        width: W,
        height: H,
        background: 'transparent',
        wireframes: false,
        pixelRatio: 1
      }
    });

    const r1 = radiusForMass(m1);
    const r2 = radiusForMass(m2);

    puckA = Bodies.circle(60, H / 2, r1, {
      restitution: 1,
      frictionAir: 0,
      friction: 0,
      label: 'A',
      render: { fillStyle: '#2563eb', strokeStyle: '#1d4ed8', lineWidth: 2 }
    });
    Body.setMass(puckA, m1);

    puckB = Bodies.circle(W / 2 + 20, H / 2 + offset, r2, {
      restitution: 1,
      frictionAir: 0,
      friction: 0,
      label: 'B',
      render: { fillStyle: '#dc2626', strokeStyle: '#b91c1c', lineWidth: 2 }
    });
    Body.setMass(puckB, m2);

    Composite.add(engine.world, [puckA, puckB]);
    Runner.stop(runner);
    runner = Runner.create();

    collisionOccurred = false;
    launched = false;
    pxBefore = null; pyBefore = null;

    /* record momentum before collision */
    Events.on(engine, 'collisionStart', () => {
      if (!collisionOccurred) {
        collisionOccurred = true;
        const vA = puckA.velocity, vB = puckB.velocity;
        const mA = puckA.mass, mB = puckB.mass;
        pxBefore = mA * vA.x + mB * vB.x;
        pyBefore = mA * vA.y + mB * vB.y;
        document.getElementById('r-2d-px-i').textContent = fmtP(pxBefore);
        document.getElementById('r-2d-py-i').textContent = fmtP(pyBefore);
      }
    });

    Events.on(engine, 'afterUpdate', () => {
      if (collisionOccurred) {
        const vA = puckA.velocity, vB = puckB.velocity;
        const mA = puckA.mass, mB = puckB.mass;
        const pxAfter = mA * vA.x + mB * vB.x;
        const pyAfter = mA * vA.y + mB * vB.y;
        document.getElementById('r-2d-px-f').textContent = fmtP(pxAfter);
        document.getElementById('r-2d-py-f').textContent = fmtP(pyAfter);

        const pxOk = Math.abs(pxAfter - pxBefore) < 0.15;
        const pyOk = Math.abs(pyAfter - pyBefore) < 0.15;
        document.getElementById('r-2d-px-status').textContent = pxOk ? 'conserved ✓' : 'Δ = ' + fmtP(pxAfter - pxBefore);
        document.getElementById('r-2d-px-status').style.color = pxOk ? '#16a34a' : '#dc2626';
        document.getElementById('r-2d-py-status').textContent = pyOk ? 'conserved ✓' : 'Δ = ' + fmtP(pyAfter - pyBefore);
        document.getElementById('r-2d-py-status').style.color = pyOk ? '#16a34a' : '#dc2626';
      }

      /* labels on canvas (rendered via afterRender) */
    });

    /* draw mass labels after each render frame */
    Events.on(render, 'afterRender', () => {
      const ctx2d = render.context;
      function labelPuck(puck, label) {
        const p = puck.position;
        ctx2d.fillStyle = '#fff';
        ctx2d.font = 'bold 11px Inter, sans-serif';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.fillText(label, p.x, p.y);
      }
      labelPuck(puckA, 'A');
      labelPuck(puckB, 'B');
    });

    Render.run(render);
  }

  function launch() {
    if (launched) return;
    launched = true;
    Body.setVelocity(puckA, { x: PUCK_SPEED, y: 0 });
    Runner.run(runner, engine);

    document.getElementById('r-2d-px-i').textContent = fmtP(puckA.mass * PUCK_SPEED);
    document.getElementById('r-2d-py-i').textContent = fmtP(0);
  }

  function resetSim() {
    Runner.stop(runner);
    Render.stop(render);
    document.getElementById('r-2d-px-i').textContent = '—';
    document.getElementById('r-2d-px-f').textContent = '—';
    document.getElementById('r-2d-py-i').textContent = '—';
    document.getElementById('r-2d-py-f').textContent = '—';
    document.getElementById('r-2d-px-status').textContent = '—';
    document.getElementById('r-2d-py-status').textContent = '—';
    setupEngine();
  }

  btnLaunch.addEventListener('click', launch);
  btnReset.addEventListener('click', resetSim);

  setupEngine();
}

/* ============================================================
   SIM 4 — Impulse Visualizer (canvas-based)
   ============================================================ */
function initImpulse() {
  const canvas = document.getElementById('canvas-impulse');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const slMass     = document.getElementById('impulse-mass');
  const slForce    = document.getElementById('impulse-force');
  const slDuration = document.getElementById('impulse-duration');
  const valMass    = document.getElementById('impulse-mass-val');
  const valForce   = document.getElementById('impulse-force-val');
  const valDur     = document.getElementById('impulse-duration-val');
  const btnApply   = document.getElementById('impulse-apply');
  const btnReset   = document.getElementById('impulse-reset');

  slMass.addEventListener('input', ()     => valMass.textContent     = parseFloat(slMass.value).toFixed(1));
  slForce.addEventListener('input', ()    => valForce.textContent    = slForce.value);
  slDuration.addEventListener('input', () => valDur.textContent      = parseFloat(slDuration.value).toFixed(1));

  /* layout */
  const GRAPH_X = 20, GRAPH_Y = 10, GRAPH_W = 300, GRAPH_H = 130;
  const BLOCK_LANE_Y = H - 60;
  const BLOCK_H = 36, BLOCK_W = 60;

  let mass, Fpeak, duration;
  let phase = 'idle';
  let t = 0;
  let blockX = 30;
  let velocity = 0;
  let rafId = null;
  let lastTs = null;

  /* impulse profile: trapezoidal ramp up and down */
  function forceAtTime(time) {
    if (time < 0 || time > duration) return 0;
    const ramp = duration * 0.2;
    if (time < ramp) return Fpeak * (time / ramp);
    if (time > duration - ramp) return Fpeak * ((duration - time) / ramp);
    return Fpeak;
  }

  function readControls() {
    mass     = parseFloat(slMass.value);
    Fpeak    = parseFloat(slForce.value);
    duration = parseFloat(slDuration.value);
  }

  function reset() {
    readControls();
    phase = 'idle';
    t = 0;
    blockX = 30;
    velocity = 0;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    lastTs = null;
    updateReadout(0, 0, 0);
    draw(0);
  }

  function applyImpulse() {
    if (phase !== 'idle') return;
    readControls();
    phase = 'running';
    lastTs = null;
    rafId = requestAnimationFrame(tick);
  }

  function updateReadout(J, dp, vf) {
    document.getElementById('r-imp-j').textContent  = fmt2(J)  + ' N·s';
    document.getElementById('r-imp-dp').textContent = fmt2(dp) + ' kg·m/s';
    document.getElementById('r-imp-vf').textContent = fmt2(vf) + ' m/s';
  }

  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.033);
    lastTs = ts;

    if (phase === 'running') {
      if (t <= duration) {
        const F = forceAtTime(t);
        const a = F / mass;
        velocity += a * dt;
        blockX   += velocity * 18 * dt; // scale for visual
        t        += dt;
      } else {
        phase = 'done';
      }
    }

    /* numerical impulse (area under curve, trapezoidal) */
    const J  = 0.5 * Fpeak * duration; // triangle approximation for display
    const dp = mass * velocity;
    updateReadout(J, dp, velocity);
    draw(t);

    if (phase === 'running' || (phase === 'done' && blockX < W - BLOCK_W - 10)) {
      if (phase === 'done') blockX += velocity * 18 * dt;
      rafId = requestAnimationFrame(tick);
    }
  }

  function draw(currentT) {
    ctx.clearRect(0, 0, W, H);

    /* ---- F-t graph ---- */
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.rect(GRAPH_X, GRAPH_Y, GRAPH_W, GRAPH_H); ctx.fill(); ctx.stroke();

    /* axes */
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(GRAPH_X, GRAPH_Y + GRAPH_H);
    ctx.lineTo(GRAPH_X + GRAPH_W, GRAPH_Y + GRAPH_H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(GRAPH_X, GRAPH_Y);
    ctx.lineTo(GRAPH_X, GRAPH_Y + GRAPH_H);
    ctx.stroke();

    /* axis labels */
    ctx.fillStyle = '#475569'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Time (s)', GRAPH_X + GRAPH_W / 2, GRAPH_Y + GRAPH_H + 16);
    ctx.save(); ctx.translate(GRAPH_X - 14, GRAPH_Y + GRAPH_H / 2);
    ctx.rotate(-Math.PI / 2); ctx.fillText('F (N)', 0, 0); ctx.restore();

    const tScale = (GRAPH_W - 10) / Math.max(duration, 0.1);
    const fScale = (GRAPH_H - 10) / Math.max(Fpeak, 1);

    /* filled area (impulse) up to currentT */
    const fillT = Math.min(currentT, duration);
    if (fillT > 0) {
      ctx.fillStyle = 'rgba(37,99,235,0.15)';
      ctx.beginPath();
      ctx.moveTo(GRAPH_X + 5, GRAPH_Y + GRAPH_H);
      for (let ti = 0; ti <= fillT; ti += 0.01) {
        const F = forceAtTime(ti);
        ctx.lineTo(GRAPH_X + 5 + ti * tScale, GRAPH_Y + GRAPH_H - F * fScale);
      }
      ctx.lineTo(GRAPH_X + 5 + fillT * tScale, GRAPH_Y + GRAPH_H);
      ctx.closePath(); ctx.fill();
    }

    /* full force curve (dashed preview) */
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.setLineDash([4,3]);
    ctx.beginPath();
    for (let ti = 0; ti <= duration; ti += 0.01) {
      const F = forceAtTime(ti);
      const px = GRAPH_X + 5 + ti * tScale;
      const py = GRAPH_Y + GRAPH_H - F * fScale;
      ti === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.setLineDash([]);

    /* current force cursor */
    if (phase === 'running' && currentT <= duration) {
      const F = forceAtTime(currentT);
      const px = GRAPH_X + 5 + currentT * tScale;
      const py = GRAPH_Y + GRAPH_H - F * fScale;
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(GRAPH_X + 5, GRAPH_Y + GRAPH_H);
      for (let ti = 0; ti <= currentT; ti += 0.01) {
        const Fi = forceAtTime(ti);
        ctx.lineTo(GRAPH_X + 5 + ti * tScale, GRAPH_Y + GRAPH_H - Fi * fScale);
      }
      ctx.stroke();

      /* dot at cursor */
      ctx.fillStyle = '#2563eb';
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    }

    /* graph title */
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
    ctx.fillText('F–t Graph  (shaded area = Impulse J)', GRAPH_X + 4, GRAPH_Y + 13);

    /* impulse annotation */
    if (phase === 'done') {
      const J = 0.5 * Fpeak * duration;
      ctx.fillStyle = '#1d4ed8'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
      ctx.fillText('J = ' + fmt2(J) + ' N·s', GRAPH_X + GRAPH_W / 2, GRAPH_Y + GRAPH_H / 2);
    }

    /* ---- Block on track ---- */
    const trackY = BLOCK_LANE_Y + BLOCK_H;
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, trackY); ctx.lineTo(W, trackY); ctx.stroke();

    const bx = Math.min(blockX, W - BLOCK_W - 5);
    ctx.fillStyle = '#2563eb';
    ctx.beginPath(); ctx.roundRect(bx, BLOCK_LANE_Y, BLOCK_W, BLOCK_H, 4); ctx.fill();

    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(fmt1(mass) + ' kg', bx + BLOCK_W / 2, BLOCK_LANE_Y + BLOCK_H / 2);

    /* velocity arrow */
    if (velocity > 0.05) {
      const arrowLen = Math.min(velocity * 30, 80);
      const ax = bx + BLOCK_W;
      const ay = BLOCK_LANE_Y + BLOCK_H / 2 - 14;
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + arrowLen, ay); ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(ax + arrowLen, ay);
      ctx.lineTo(ax + arrowLen - 8, ay - 4);
      ctx.lineTo(ax + arrowLen - 8, ay + 4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#92400e'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
      ctx.fillText(fmt2(velocity) + ' m/s', ax + arrowLen / 2, ay - 10);
    }

    /* force arrow during push */
    if (phase === 'running' && currentT <= duration) {
      const F = forceAtTime(currentT);
      const fArrowLen = (F / Fpeak) * 60;
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, BLOCK_LANE_Y + BLOCK_H / 2); ctx.lineTo(bx - fArrowLen, BLOCK_LANE_Y + BLOCK_H / 2); ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(bx, BLOCK_LANE_Y + BLOCK_H / 2);
      ctx.lineTo(bx - 8, BLOCK_LANE_Y + BLOCK_H / 2 - 4);
      ctx.lineTo(bx - 8, BLOCK_LANE_Y + BLOCK_H / 2 + 4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#991b1b'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
      ctx.fillText('F = ' + fmt1(F) + ' N', bx - fArrowLen / 2, BLOCK_LANE_Y + BLOCK_H / 2 - 12);
    }

    if (phase === 'idle') {
      ctx.fillStyle = '#94a3b8'; ctx.font = '12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('Press "Apply Impulse" to start', W / 2, BLOCK_LANE_Y - 6);
    }
  }

  btnApply.addEventListener('click', applyImpulse);
  btnReset.addEventListener('click', reset);

  reset();
}

/* ============================================================
   ENTRY POINT — called by section-loader.js after fragment loads
   ============================================================ */
function initMomentumSims() {
  initCollisionLab();
  initExplosion();
  init2DCollision();
  initImpulse();
}
