/* Kinematics simulations — 4 canvases
   Called by initKinematicsSims() after the simulation tab loads.
   Also attempts init on DOMContentLoaded (no-ops if canvases absent). */

const G = 9.8;

// ── Shared helpers ────────────────────────────────────────────────────────────

function getCtx(id) {
  const c = document.getElementById(id);
  return c ? c.getContext('2d') : null;
}

function labelSlider(sliderId, labelId, fmt) {
  const s = document.getElementById(sliderId);
  const l = document.getElementById(labelId);
  if (!s || !l) return;
  l.textContent = fmt(Number(s.value));
  s.addEventListener('input', () => { l.textContent = fmt(Number(s.value)); });
}

function setOut(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function drawGrid(ctx, w, h, color = '#e5e7eb') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

// ── SIM 1: Projectile Motion ──────────────────────────────────────────────────

function initProjectile() {
  const ctx = getCtx('sim-projectile');
  if (!ctx) return;
  const W = 500, H = 280;
  let rafId = null;
  let animT = 0, animPlaying = false, totalT = 0;
  const trail = [];

  labelSlider('proj-angle', 'proj-angle-label', v => v + '°');
  labelSlider('proj-speed', 'proj-speed-label', v => v + ' m/s');

  function getParams() {
    const angle = Number(document.getElementById('proj-angle').value) * Math.PI / 180;
    const v0    = Number(document.getElementById('proj-speed').value);
    const vx    = v0 * Math.cos(angle);
    const vy0   = v0 * Math.sin(angle);
    const tFlight = 2 * vy0 / G;
    const range   = vx * tFlight;
    const hMax    = vy0 * vy0 / (2 * G);
    return { angle, v0, vx, vy0, tFlight, range, hMax };
  }

  function draw() {
    const p = getParams();
    ctx.clearRect(0, 0, W, H);

    // Scale: fit range + some padding
    const margin = { l:30, r:20, t:20, b:30 };
    const plotW = W - margin.l - margin.r;
    const plotH = H - margin.t - margin.b;
    const scaleX = plotW / Math.max(p.range * 1.05, 1);
    const scaleY = plotH / Math.max(p.hMax * 1.4, 1);

    function toCanvas(rx, ry) {
      return [margin.l + rx * scaleX, H - margin.b - ry * scaleY];
    }

    // Ground
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin.l, H - margin.b);
    ctx.lineTo(W - margin.r, H - margin.b);
    ctx.stroke();

    // Full path (ghost)
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * p.tFlight;
      const rx = p.vx * t;
      const ry = p.vy0 * t - 0.5 * G * t * t;
      const [cx, cy] = toCanvas(rx, ry);
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Range arrow
    const [x0, y0] = toCanvas(0, 0);
    const [xR, yR] = toCanvas(p.range, 0);
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y0 + 12); ctx.lineTo(xR, yR + 12); ctx.stroke();
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('R = ' + p.range.toFixed(1) + ' m', (x0 + xR) / 2, y0 + 24);

    // Height arrow
    const [xH, yH] = toCanvas(p.vx * p.tFlight / 2, p.hMax);
    ctx.strokeStyle = '#6b7280';
    ctx.beginPath(); ctx.moveTo(xH + 10, y0); ctx.lineTo(xH + 10, yH); ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillText('h = ' + p.hMax.toFixed(1) + ' m', xH + 14, (y0 + yH) / 2 + 4);

    // Animated ball
    const t = animT;
    const rx = p.vx * t;
    const ry = p.vy0 * t - 0.5 * G * t * t;
    const [bx, by] = toCanvas(rx, Math.max(ry, 0));

    // Trail
    trail.push([bx, by]);
    if (trail.length > 40) trail.shift();
    for (let i = 1; i < trail.length; i++) {
      const alpha = i / trail.length;
      ctx.strokeStyle = `rgba(59,130,246,${alpha * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1][0], trail[i - 1][1]);
      ctx.lineTo(trail[i][0], trail[i][1]);
      ctx.stroke();
    }

    // Velocity vectors at ball position
    const vx_ = p.vx;
    const vy_ = p.vy0 - G * t;
    const scale = 3;
    ctx.lineWidth = 2;
    // vx arrow (blue)
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + vx_ * scale, by); ctx.stroke();
    // vy arrow (green/red)
    ctx.strokeStyle = vy_ >= 0 ? '#22c55e' : '#ef4444';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - vy_ * scale); ctx.stroke();

    // Ball
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();

    // Launch point dot
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath(); ctx.arc(x0, y0, 4, 0, Math.PI * 2); ctx.fill();
  }

  function tick() {
    animT += 0.04;
    if (animT >= totalT) { animT = 0; trail.length = 0; }
    draw();
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    const p = getParams();
    totalT = p.tFlight;
    animT = 0;
    trail.length = 0;
    setOut('proj-out-range',  p.range.toFixed(1) + ' m');
    setOut('proj-out-height', p.hMax.toFixed(1) + ' m');
    setOut('proj-out-time',   p.tFlight.toFixed(2) + ' s');
    if (!animPlaying) { animPlaying = true; tick(); }
  }

  ['proj-angle', 'proj-speed'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', reset);
  });

  reset();
}

// ── SIM 2: 1D Motion Graphs ───────────────────────────────────────────────────

function initMotionGraphs() {
  const ctx = getCtx('sim-graphs');
  if (!ctx) return;
  const W = 500, H = 280;
  const T_MAX = 5;

  labelSlider('graph-v0', 'graph-v0-label', v => v + ' m/s');
  labelSlider('graph-a',  'graph-a-label',  v => v + ' m/s²');

  function draw() {
    const v0 = Number(document.getElementById('graph-v0').value);
    const a  = Number(document.getElementById('graph-a').value);

    ctx.clearRect(0, 0, W, H);

    // 3 graphs stacked: x-t (top), v-t (mid), a-t (bottom)
    const ROW = H / 3;
    const ML = 48, MR = 12, MT = 8, MB = 8;
    const gW = W - ML - MR;
    const gH = ROW - MT - MB;

    const colors = { x: '#3b82f6', v: '#22c55e', a: '#f59e0b' };
    const labels = ['x (m)', 'v (m/s)', 'a (m/s²)'];

    // Determine y ranges
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
        const cx = ML + (t / T_MAX) * gW;
        const cy = top + gH - ((y - yMin) / (yMax - yMin)) * gH;
        return [cx, cy];
      }

      // Background
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(ML, top, gW, gH);

      // Zero line
      const [, zy] = toC(0, 0);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ML, zy); ctx.lineTo(ML + gW, zy); ctx.stroke();

      // Axes
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ML, top); ctx.lineTo(ML, top + gH);
      ctx.moveTo(ML, top + gH); ctx.lineTo(ML + gW, top + gH);
      ctx.stroke();

      // Y label
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(labels[row], ML - 4, top + gH / 2 + 4);

      // Plot
      ctx.strokeStyle = [colors.x, colors.v, colors.a][row];
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = (i / 80) * T_MAX;
        let y;
        if (row === 0) y = v0 * t + 0.5 * a * t * t;
        else if (row === 1) y = v0 + a * t;
        else y = a;
        const [cx, cy] = toC(t, y);
        i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // t axis tick labels
      if (row === 2) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        for (let t = 0; t <= T_MAX; t++) {
          const [cx] = toC(t, yMin);
          ctx.fillText(t + 's', cx, top + gH + 12);
        }
      }
    });

    // Computed outputs
    const tZero = a !== 0 ? -v0 / a : null;
    const dx5   = v0 * T_MAX + 0.5 * a * T_MAX * T_MAX;
    setOut('graph-out-tzero', tZero !== null && tZero >= 0 && tZero <= T_MAX
      ? tZero.toFixed(2) + ' s' : 'none in 0–5 s');
    setOut('graph-out-dx', dx5.toFixed(1) + ' m');
  }

  ['graph-v0', 'graph-a'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', draw);
  });

  draw();
}

// ── SIM 3: Free Fall / Vertical Throw ────────────────────────────────────────

function initFreeFall() {
  const ctx = getCtx('sim-freefall');
  if (!ctx) return;
  const W = 500, H = 280;
  let animT = 0, totalT = 0, rafId = null;

  labelSlider('ff-h',  'ff-h-label',  v => v + ' m');
  labelSlider('ff-v0', 'ff-v0-label', v => (v >= 0 ? '+' : '') + v + ' m/s');

  function getParams() {
    const h0 = Number(document.getElementById('ff-h').value);
    const v0 = Number(document.getElementById('ff-v0').value);
    // Solve h0 + v0*t - ½g*t² = 0 for t > 0
    // ½g*t² - v0*t - h0 = 0
    const disc = v0 * v0 + 2 * G * h0;
    const tGround = (v0 + Math.sqrt(disc)) / G;
    const hMax = v0 >= 0 ? h0 + v0 * v0 / (2 * G) : h0;
    const vImpact = Math.sqrt(2 * G * h0 + v0 * v0);
    return { h0, v0, tGround, hMax, vImpact };
  }

  function draw() {
    const p = getParams();
    ctx.clearRect(0, 0, W, H);

    const ML = 60, MR = 20, MT = 20, MB = 30;
    const plotH = H - MT - MB;
    const midX = W / 2;

    // Scale: fit hMax with padding
    const scaleY = plotH / Math.max(p.hMax * 1.1, 1);

    function toY(h) { return H - MB - h * scaleY; }

    // Ground line
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ML, H - MB); ctx.lineTo(W - MR, H - MB); ctx.stroke();

    // Height scale on left
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    const hStep = p.hMax > 40 ? 20 : 10;
    for (let h = 0; h <= p.hMax * 1.05; h += hStep) {
      const y = toY(h);
      ctx.fillText(h + ' m', ML - 4, y + 4);
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W - MR, y); ctx.stroke();
    }

    // Trajectory path (ghost line)
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * p.tGround;
      const h = Math.max(p.h0 + p.v0 * t - 0.5 * G * t * t, 0);
      const y = toY(h);
      i === 0 ? ctx.moveTo(midX, y) : ctx.lineTo(midX, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Ball at animT
    const t = Math.min(animT, p.tGround);
    const h = Math.max(p.h0 + p.v0 * t - 0.5 * G * t * t, 0);
    const bx = midX, by = toY(h);

    // Velocity arrow
    const vy = p.v0 - G * t;
    const arrowScale = 4;
    ctx.strokeStyle = vy >= 0 ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - vy * arrowScale); ctx.stroke();

    // Arrowhead
    const ay = by - vy * arrowScale;
    ctx.fillStyle = vy >= 0 ? '#22c55e' : '#ef4444';
    const dir = vy >= 0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(bx, ay + dir * 8);
    ctx.lineTo(bx - 4, ay + dir * 14);
    ctx.lineTo(bx + 4, ay + dir * 14);
    ctx.closePath(); ctx.fill();

    // Velocity label
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#374151';
    ctx.fillText('v = ' + vy.toFixed(1) + ' m/s', bx + 14, by + 4);
    ctx.fillText('h = ' + h.toFixed(1) + ' m', bx + 14, by + 16);

    // Ball
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill();

    // t label bottom
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    ctx.fillText('t = ' + t.toFixed(2) + ' s', midX, H - 6);
  }

  function tick() {
    animT += 0.05;
    if (animT > totalT + 0.5) animT = 0;
    draw();
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    const p = getParams();
    totalT = p.tGround;
    setOut('ff-out-hmax', p.hMax.toFixed(1) + ' m');
    setOut('ff-out-t',    p.tGround.toFixed(2) + ' s');
    setOut('ff-out-v',    p.vImpact.toFixed(1) + ' m/s');
    if (!rafId) tick();
  }

  ['ff-h', 'ff-v0'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { animT = 0; reset(); });
  });

  reset();
}

// ── SIM 4: Horizontal Cliff Launch ───────────────────────────────────────────

function initCliff() {
  const ctx = getCtx('sim-cliff');
  if (!ctx) return;
  const W = 500, H = 280;
  let animT = 0, totalT = 0, rafId = null;
  const trail = [];

  labelSlider('cliff-h',  'cliff-h-label',  v => v + ' m');
  labelSlider('cliff-vx', 'cliff-vx-label', v => v + ' m/s');

  function getParams() {
    const h  = Number(document.getElementById('cliff-h').value);
    const vx = Number(document.getElementById('cliff-vx').value);
    const t  = Math.sqrt(2 * h / G);
    const range = vx * t;
    const vy = G * t;
    const vImpact = Math.sqrt(vx * vx + vy * vy);
    return { h, vx, t, range, vy, vImpact };
  }

  function draw() {
    const p = getParams();
    ctx.clearRect(0, 0, W, H);

    const ML = 20, MR = 20, MT = 20, MB = 30;
    const plotW = W - ML - MR;
    const plotH = H - MT - MB;
    const cliffX = ML + 60;

    const scaleX = (plotW - 60) / Math.max(p.range * 1.1, 1);
    const scaleY = plotH / Math.max(p.h * 1.1, 1);

    function toCanvas(x, y) {
      return [cliffX + x * scaleX, H - MB - y * scaleY];
    }

    // Ground
    ctx.fillStyle = '#d1fae5';
    ctx.fillRect(cliffX, H - MB, W - MR - cliffX, 4);
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ML, H - MB); ctx.lineTo(W - MR, H - MB); ctx.stroke();

    // Cliff face
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(ML, H - MB - p.h * scaleY, cliffX - ML, p.h * scaleY);
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5;
    ctx.strokeRect(ML, H - MB - p.h * scaleY, cliffX - ML, p.h * scaleY);

    // Cliff height label
    const [cx0, cy0] = toCanvas(0, p.h);
    ctx.fillStyle = '#6b7280'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('h = ' + p.h + ' m', ML + 4, (cy0 + H - MB) / 2 + 4);

    // Ghost path
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * p.t;
      const x = p.vx * t;
      const y = p.h - 0.5 * G * t * t;
      const [cx, cy] = toCanvas(x, y);
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Range arrow
    const [xLand, yLand] = toCanvas(p.range, 0);
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cliffX, H - MB + 10); ctx.lineTo(xLand, H - MB + 10); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#6b7280';
    ctx.fillText('x = ' + p.range.toFixed(1) + ' m', (cliffX + xLand) / 2, H - MB + 22);

    // Animated ball + trail
    const t = Math.min(animT, p.t);
    const bx = p.vx * t;
    const by = p.h - 0.5 * G * t * t;
    const [bcx, bcy] = toCanvas(bx, Math.max(by, 0));

    trail.push([bcx, bcy]);
    if (trail.length > 40) trail.shift();
    for (let i = 1; i < trail.length; i++) {
      ctx.strokeStyle = `rgba(59,130,246,${(i / trail.length) * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1][0], trail[i - 1][1]);
      ctx.lineTo(trail[i][0], trail[i][1]);
      ctx.stroke();
    }

    // Velocity vectors
    const scale = 3;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath(); ctx.moveTo(bcx, bcy); ctx.lineTo(bcx + p.vx * scale, bcy); ctx.stroke();
    ctx.strokeStyle = '#ef4444';
    const vyNow = G * t;
    ctx.beginPath(); ctx.moveTo(bcx, bcy); ctx.lineTo(bcx, bcy + vyNow * scale); ctx.stroke();

    // Ball
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(bcx, bcy, 6, 0, Math.PI * 2); ctx.fill();
  }

  function tick() {
    animT += 0.04;
    if (animT > totalT + 0.4) { animT = 0; trail.length = 0; }
    draw();
    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    const p = getParams();
    totalT = p.t;
    animT = 0; trail.length = 0;
    setOut('cliff-out-t', p.t.toFixed(2) + ' s');
    setOut('cliff-out-x', p.range.toFixed(1) + ' m');
    setOut('cliff-out-v', p.vImpact.toFixed(1) + ' m/s');
    if (!rafId) tick();
  }

  ['cliff-h', 'cliff-vx'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', reset);
  });

  reset();
}

// ── Entry points ──────────────────────────────────────────────────────────────

function initKinematicsSims() {
  initProjectile();
  initMotionGraphs();
  initFreeFall();
  initCliff();
}

// Also try on DOMContentLoaded (no-op when canvases aren't in DOM yet)
document.addEventListener('DOMContentLoaded', initKinematicsSims);
