/* oscillations-sims.js — Simple Harmonic Motion simulations */

/* ── helpers ── */
function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a2236';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function lbl(ctx, text, x, y, color = '#e2e8f0', size = 12, align = 'center') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px Inter, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCoil(ctx, x1, x2, y, coils, color = '#94a3b8') {
  const seg = (x2 - x1) / (coils * 2 + 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 + seg, y);
  for (let i = 0; i < coils; i++) {
    ctx.lineTo(x1 + seg + i * 2 * seg + seg * 0.5, y - 12);
    ctx.lineTo(x1 + seg + i * 2 * seg + seg * 1.5, y + 12);
  }
  ctx.lineTo(x2 - seg, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function bar(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3);
  ctx.fill();
}

/* ═══════════════════════════════════════════════════
   SIM 1 — Mass-Spring Oscillator
═══════════════════════════════════════════════════ */
function initSpring() {
  const canvas = document.getElementById('sim-spring');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sliderM = document.getElementById('sp-m');
  const sliderK = document.getElementById('sp-k');
  const sliderA = document.getElementById('sp-a');
  const lblM = document.getElementById('sp-m-label');
  const lblK = document.getElementById('sp-k-label');
  const lblA = document.getElementById('sp-a-label');
  const outT    = document.getElementById('sp-T');
  const outF    = document.getElementById('sp-f');
  const outVmax = document.getElementById('sp-vmax');
  const outV    = document.getElementById('sp-v');

  const wallX = 30;
  const eqX = W / 2 + 20;   // equilibrium position of mass centre
  const massY = H / 2;
  const PX_PER_M = 400;      // 1 m = 400 px (amplitude of 0.18 m → 72 px)

  let phase = 0;
  let lastTime = null;

  function draw(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    const m = parseFloat(sliderM.value);
    const k = parseFloat(sliderK.value);
    const A = parseFloat(sliderA.value);

    lblM.textContent = m.toFixed(1);
    lblK.textContent = k.toFixed(0);
    lblA.textContent = A.toFixed(2);

    const omega = Math.sqrt(k / m);
    const T = 2 * Math.PI / omega;
    const f = 1 / T;
    const vmax = A * omega;

    phase += omega * dt;

    const x = A * Math.cos(phase);           // displacement (m)
    const v = -A * omega * Math.sin(phase);  // velocity (m/s)

    outT.textContent    = T.toFixed(3);
    outF.textContent    = f.toFixed(3);
    outVmax.textContent = vmax.toFixed(3);
    outV.textContent    = Math.abs(v).toFixed(3);

    clearCanvas(ctx, canvas);

    const massCX = eqX + x * PX_PER_M;
    const massW = 40, massH = 36;

    // Wall
    ctx.fillStyle = '#374151';
    ctx.fillRect(wallX - 8, massY - 50, 8, 100);
    ctx.fillStyle = '#4b5563';
    for (let i = -50; i <= 50; i += 10) {
      ctx.beginPath();
      ctx.moveTo(wallX - 8, massY + i);
      ctx.lineTo(wallX - 18, massY + i + 10);
      ctx.stroke();
    }

    // Spring
    const springEndX = massCX - massW / 2;
    drawCoil(ctx, wallX, springEndX, massY, 8);

    // Track line
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(wallX, massY + massH / 2 + 2);
    ctx.lineTo(W - 20, massY + massH / 2 + 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Equilibrium marker
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(eqX, massY - 30);
    ctx.lineTo(eqX, massY + 30);
    ctx.stroke();
    lbl(ctx, 'eq', eqX, massY + 44, '#6b7280', 10);

    // Amplitude markers
    const apx = eqX + A * PX_PER_M;
    const anx = eqX - A * PX_PER_M;
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(apx, massY - 24); ctx.lineTo(apx, massY + 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(anx, massY - 24); ctx.lineTo(anx, massY + 24); ctx.stroke();
    ctx.setLineDash([]);
    lbl(ctx, '+A', apx, massY + 38, '#1e40af', 10);
    lbl(ctx, '−A', anx, massY + 38, '#1e40af', 10);

    // Mass block
    const speed = Math.abs(v);
    const hotness = speed / vmax;
    const r = Math.round(96 + hotness * 159);
    const g2 = Math.round(165 - hotness * 100);
    const b = Math.round(250 - hotness * 220);
    ctx.fillStyle = `rgb(${r},${g2},${b})`;
    ctx.beginPath();
    ctx.roundRect(massCX - massW / 2, massY - massH / 2, massW, massH, 5);
    ctx.fill();
    lbl(ctx, m.toFixed(1) + 'kg', massCX, massY + 5, '#fff', 11);

    // Velocity arrow
    if (Math.abs(v) > 0.01) {
      const arrowLen = Math.min(60, Math.abs(v) / vmax * 60);
      const dir = v > 0 ? 1 : -1;
      const ax1 = massCX + dir * (massW / 2 + 4);
      const ax2 = ax1 + dir * arrowLen;
      ctx.strokeStyle = '#4ade80';
      ctx.fillStyle = '#4ade80';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(ax1, massY); ctx.lineTo(ax2 - dir * 10, massY); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax2, massY);
      ctx.lineTo(ax2 - dir * 10, massY - 5);
      ctx.lineTo(ax2 - dir * 10, massY + 5);
      ctx.closePath(); ctx.fill();
    }

    // x label
    lbl(ctx, 'x = ' + x.toFixed(3) + ' m', eqX, H - 12, '#9ca3af', 11);

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════
   SIM 2 — Simple Pendulum
═══════════════════════════════════════════════════ */
function initPendulum() {
  const canvas = document.getElementById('sim-pendulum');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sliderL   = document.getElementById('pen-L');
  const sliderG   = document.getElementById('pen-g');
  const sliderAng = document.getElementById('pen-ang');
  const lblL   = document.getElementById('pen-L-label');
  const lblG   = document.getElementById('pen-g-label');
  const lblAng = document.getElementById('pen-ang-label');
  const outT    = document.getElementById('pen-T');
  const outF    = document.getElementById('pen-f');
  const outH    = document.getElementById('pen-h');
  const outVmax = document.getElementById('pen-vmax');

  const pivotX = W / 2, pivotY = 30;
  const MAX_PX_LEN = H - 60;

  let phase = 0;
  let lastTime = null;

  function draw(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    const L   = parseFloat(sliderL.value);
    const g   = parseFloat(sliderG.value);
    const ang = parseFloat(sliderAng.value) * Math.PI / 180;

    lblL.textContent   = L.toFixed(2);
    lblG.textContent   = g.toFixed(1);
    lblAng.textContent = Math.round(sliderAng.value);

    const omega = Math.sqrt(g / L);
    const T = 2 * Math.PI / omega;
    const f = 1 / T;
    const h = L * (1 - Math.cos(ang));
    const vmax = Math.sqrt(2 * g * h);

    phase += omega * dt;
    const theta = ang * Math.cos(phase);

    outT.textContent    = T.toFixed(3);
    outF.textContent    = f.toFixed(3);
    outH.textContent    = h.toFixed(4);
    outVmax.textContent = vmax.toFixed(3);

    clearCanvas(ctx, canvas);

    // Scale pendulum length to canvas
    const scale = Math.min(MAX_PX_LEN / 2.5, MAX_PX_LEN / L);
    const pxLen = L * scale;

    const bobX = pivotX + Math.sin(theta) * pxLen;
    const bobY = pivotY + Math.cos(theta) * pxLen;
    const bobR = 16;

    // Pivot mount
    ctx.fillStyle = '#374151';
    ctx.fillRect(pivotX - 20, pivotY - 10, 40, 10);

    // Ghost arc (amplitude range)
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, pxLen, Math.PI / 2 - ang, Math.PI / 2 + ang);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vertical reference line
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + pxLen + bobR + 4);
    ctx.stroke();

    // String
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Pivot dot
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Bob — colour by speed (slowest at endpoints, fastest at bottom)
    const speed = Math.abs(-ang * omega * Math.sin(phase));
    const hotness = vmax > 0 ? speed / (ang * omega) : 0;
    const rr = Math.round(96 + hotness * 159);
    const gg = Math.round(165 - hotness * 100);
    const bb = Math.round(250 - hotness * 220);
    ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
    ctx.beginPath();
    ctx.arc(bobX, bobY, bobR, 0, Math.PI * 2);
    ctx.fill();

    // Height indicator
    const bottomY = pivotY + pxLen;
    if (h * scale > 3) {
      ctx.strokeStyle = '#f59e0b44';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(bobX, bobY + bobR);
      ctx.lineTo(bobX, bottomY);
      ctx.stroke();
      ctx.setLineDash([]);
      lbl(ctx, 'h', bobX + 10, (bobY + bobR + bottomY) / 2, '#f59e0b', 11, 'left');
    }

    // Labels
    lbl(ctx, 'T = ' + T.toFixed(2) + ' s', W - 70, H - 12, '#e2e8f0', 12);

    // g label
    const gLabel = g < 2 ? 'Moon' : g > 20 ? 'Jupiter' : 'Earth';
    lbl(ctx, gLabel, 50, H - 12, '#9ca3af', 11);

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════
   SIM 3 — Energy Distribution
═══════════════════════════════════════════════════ */
function initEnergy() {
  const canvas = document.getElementById('sim-energy');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sliderM = document.getElementById('en-m');
  const sliderK = document.getElementById('en-k');
  const sliderA = document.getElementById('en-a');
  const lblM = document.getElementById('en-m-label');
  const lblK = document.getElementById('en-k-label');
  const lblA = document.getElementById('en-a-label');
  const outE  = document.getElementById('en-E');
  const outKE = document.getElementById('en-KE');
  const outPE = document.getElementById('en-PE');
  const outX  = document.getElementById('en-x');

  const trackY = H / 2 + 20;
  const eqX = W / 2;
  const PX_PER_M = 400;

  // Energy bar layout
  const barX = 20, barY = 20, barW = 160, barH = 14, barGap = 22;

  let phase = 0;
  let lastTime = null;

  function draw(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    const m = parseFloat(sliderM.value);
    const k = parseFloat(sliderK.value);
    const A = parseFloat(sliderA.value);

    lblM.textContent = m.toFixed(1);
    lblK.textContent = k.toFixed(0);
    lblA.textContent = A.toFixed(2);

    const omega = Math.sqrt(k / m);
    phase += omega * dt;

    const x   = A * Math.cos(phase);
    const v   = -A * omega * Math.sin(phase);
    const E   = 0.5 * k * A * A;
    const PE  = 0.5 * k * x * x;
    const KE  = 0.5 * m * v * v;

    outE.textContent  = E.toFixed(4);
    outKE.textContent = KE.toFixed(4);
    outPE.textContent = PE.toFixed(4);
    outX.textContent  = x.toFixed(4);

    clearCanvas(ctx, canvas);

    // ── Energy bars ──
    const maxE = E;

    // Total E line
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(barX, barY + 2);
    ctx.lineTo(barX + barW, barY + 2);
    ctx.stroke();
    ctx.setLineDash([]);
    lbl(ctx, 'E total', barX + barW + 6, barY + 6, '#60a5fa', 11, 'left');

    // KE bar
    ctx.fillStyle = '#1e2d45';
    ctx.beginPath(); ctx.roundRect(barX, barY + barGap, barW, barH, 3); ctx.fill();
    bar(ctx, barX, barY + barGap, barW * (KE / maxE), barH, '#4ade80');
    lbl(ctx, 'KE', barX + barW + 6, barY + barGap + barH - 2, '#4ade80', 11, 'left');

    // PE bar
    ctx.fillStyle = '#1e2d45';
    ctx.beginPath(); ctx.roundRect(barX, barY + barGap * 2, barW, barH, 3); ctx.fill();
    bar(ctx, barX, barY + barGap * 2, barW * (PE / maxE), barH, '#f87171');
    lbl(ctx, 'Spring PE', barX + barW + 6, barY + barGap * 2 + barH - 2, '#f87171', 11, 'left');

    // ── Oscillator diagram ──
    const wallX = 30;
    const massCX = eqX + x * PX_PER_M;
    const massW = 38, massH = 32;

    // Wall
    ctx.fillStyle = '#374151';
    ctx.fillRect(wallX - 8, trackY - 44, 8, 88);

    // Spring
    drawCoil(ctx, wallX, massCX - massW / 2, trackY, 8);

    // Track
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(wallX, trackY + massH / 2 + 2); ctx.lineTo(W - 20, trackY + massH / 2 + 2); ctx.stroke();
    ctx.setLineDash([]);

    // Amplitude markers
    [eqX + A * PX_PER_M, eqX - A * PX_PER_M].forEach(px => {
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(px, trackY - 22); ctx.lineTo(px, trackY + 22); ctx.stroke();
      ctx.setLineDash([]);
    });

    // Equilibrium marker
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(eqX, trackY - 18); ctx.lineTo(eqX, trackY + 18); ctx.stroke();

    // Mass — colour encodes KE fraction
    const keFraction = E > 0 ? KE / E : 0;
    const mr = Math.round(96 + keFraction * 159);
    const mg2 = Math.round(165 - keFraction * 100);
    const mb = Math.round(250 - keFraction * 220);
    ctx.fillStyle = `rgb(${mr},${mg2},${mb})`;
    ctx.beginPath();
    ctx.roundRect(massCX - massW / 2, trackY - massH / 2, massW, massH, 5);
    ctx.fill();

    // PE region fill (spring compression area)
    ctx.fillStyle = 'rgba(248,113,113,0.08)';
    ctx.fillRect(massCX - massW / 2, trackY - massH / 2, (eqX - massCX), massH);

    lbl(ctx, 'KE: ' + (keFraction * 100).toFixed(0) + '%', massCX, trackY + massH / 2 + 16, '#4ade80', 10);
    lbl(ctx, 'PE: ' + ((1 - keFraction) * 100).toFixed(0) + '%', massCX, trackY + massH / 2 + 28, '#f87171', 10);

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

/* ── Called by section-loader.js after the simulation fragment is injected ── */
function initOscillationsSims() {
  initSpring();
  initPendulum();
  initEnergy();
}
