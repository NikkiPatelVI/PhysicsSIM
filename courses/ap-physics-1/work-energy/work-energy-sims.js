/* work-energy-sims.js — Work, Energy & Power simulations */

const G = 9.8;

/* ── shared helpers ── */
function label(ctx, text, x, y, color = '#e2e8f0', size = 13) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px Inter, sans-serif`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function fmt(v, dp = 1) { return v.toFixed(dp); }

/* draw a vertical energy bar at (x, baseY) with given height and color */
function energyBar(ctx, x, baseY, barH, color, maxH, barW = 28) {
  const clampedH = Math.min(Math.max(barH, 0), maxH);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - barW / 2, baseY - clampedH, barW, clampedH, [4, 4, 0, 0]);
  ctx.fill();
}

/* ═══════════════════════════════════════════════════
   SIM 1 — Conservation on a Ramp
═══════════════════════════════════════════════════ */
function initRampConservation() {
  const canvas = document.getElementById('sim-ramp');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const slH  = document.getElementById('ramp-h');
  const slM  = document.getElementById('ramp-m');
  const slMu = document.getElementById('ramp-mu');
  const lblH  = document.getElementById('ramp-h-label');
  const lblM  = document.getElementById('ramp-m-label');
  const lblMu = document.getElementById('ramp-mu-label');
  const outKE  = document.getElementById('ramp-out-ke');
  const outPE  = document.getElementById('ramp-out-pe');
  const outETh = document.getElementById('ramp-out-eth');
  const outV   = document.getElementById('ramp-out-v');

  // t in [0,1]: fraction down the ramp
  let t = 0;
  let vel = 0;
  let lastTs = null;
  let rafId = null;

  function draw(ts) {
    const h  = +slH.value;
    const m  = +slM.value;
    const mu = +slMu.value;

    const W  = canvas.width, H = canvas.height;
    const totalE = m * G * h;

    // ramp geometry
    const ox = 30, oy = H - 45;
    const rx = W - 130, ry = oy - (h / 8) * 100;  // scale height visually (max 8m → 100px)
    const visualH = oy - ry;
    const rampLen = Math.sqrt((rx - ox) ** 2 + (oy - ry) ** 2);
    const cosTheta = (rx - ox) / rampLen;
    const sinTheta = (oy - ry) / rampLen;

    // animate ball position
    if (lastTs !== null) {
      const dt = Math.min((ts - lastTs) / 1000, 0.04);
      const currH = h * (1 - t);
      const N     = m * G * cosTheta;
      const fk    = mu * N;
      const netF  = m * G * sinTheta - fk;
      const a     = netF / m;
      vel = Math.max(0, vel + a * dt);
      t   = Math.min(1, t + (vel * dt) / (rampLen / 50));
      if (t >= 1) { t = 0; vel = 0; }
    }
    lastTs = ts;

    const currHeight = h * (1 - t);
    const etherm = Math.max(0, totalE - (0.5 * m * vel ** 2 + m * G * currHeight));

    const ke = totalE - m * G * currHeight - etherm;
    const pe = m * G * currHeight;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);

    // ground
    ctx.fillStyle = '#1e2533';
    ctx.fillRect(0, oy, W - 120, H);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W - 120, oy); ctx.stroke();

    // ramp surface
    ctx.fillStyle = '#1e2533';
    ctx.beginPath();
    ctx.moveTo(ox, oy); ctx.lineTo(rx, ry); ctx.lineTo(rx, oy); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(rx, ry); ctx.stroke();

    // ball on ramp
    const bx = ox + (rx - ox) * t;
    const by = oy - (oy - ry) * t;
    ctx.fillStyle = '#2563eb';
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx, by - 8, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // height annotation
    if (currHeight > 0.3) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(bx, by - 8); ctx.lineTo(bx, oy); ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, fmt(currHeight, 1) + ' m', bx + 5, (by - 8 + oy) / 2, '#64748b', 11);
    }

    // energy bar chart (right side)
    const barBaseY = oy - 5;
    const maxBarH  = visualH + 30;
    const barScale = maxBarH / totalE;
    const bx1 = W - 100, bx2 = W - 65, bx3 = W - 30;

    energyBar(ctx, bx1, barBaseY, ke * barScale, '#60a5fa', maxBarH);
    energyBar(ctx, bx2, barBaseY, pe * barScale, '#4ade80', maxBarH);
    energyBar(ctx, bx3, barBaseY, etherm * barScale, '#f87171', maxBarH);

    // bar labels
    label(ctx, 'KE', bx1 - 7, barBaseY + 14, '#60a5fa', 11);
    label(ctx, 'PE', bx2 - 7, barBaseY + 14, '#4ade80', 11);
    label(ctx, 'Q', bx3 - 5, barBaseY + 14, '#f87171', 11);

    // total line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(W - 120, barBaseY - totalE * barScale);
    ctx.lineTo(W, barBaseY - totalE * barScale);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, 'E_total', W - 116, barBaseY - totalE * barScale - 4, '#94a3b8', 10);

    // readouts
    outKE.textContent  = fmt(ke) + ' J';
    outPE.textContent  = fmt(pe) + ' J';
    outETh.textContent = fmt(etherm) + ' J';
    outV.textContent   = fmt(vel) + ' m/s';

    rafId = requestAnimationFrame(draw);
  }

  [slH, slM, slMu].forEach(s => s.addEventListener('input', () => {
    lblH.textContent  = (+slH.value).toFixed(1) + ' m';
    lblM.textContent  = slM.value + ' kg';
    lblMu.textContent = (+slMu.value).toFixed(2);
    t = 0; vel = 0; lastTs = null;
  }));

  lblH.textContent  = (+slH.value).toFixed(1) + ' m';
  lblM.textContent  = slM.value + ' kg';
  lblMu.textContent = (+slMu.value).toFixed(2);

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════
   SIM 2 — Work-Energy Theorem
═══════════════════════════════════════════════════ */
function initWorkEnergyTheorem() {
  const canvas = document.getElementById('sim-wet');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const slF  = document.getElementById('wet-f');
  const slM  = document.getElementById('wet-m');
  const slD  = document.getElementById('wet-d');
  const slMu = document.getElementById('wet-mu');
  const lblF  = document.getElementById('wet-f-label');
  const lblM  = document.getElementById('wet-m-label');
  const lblD  = document.getElementById('wet-d-label');
  const lblMu = document.getElementById('wet-mu-label');
  const outWa   = document.getElementById('wet-out-wa');
  const outWf   = document.getElementById('wet-out-wf');
  const outWnet = document.getElementById('wet-out-wnet');
  const outV    = document.getElementById('wet-out-v');

  let progress = 0; // 0 to 1 across distance d
  let lastTs = null;
  let rafId = null;

  function draw(ts) {
    const F  = +slF.value;
    const m  = +slM.value;
    const d  = +slD.value;
    const mu = +slMu.value;

    const fk   = mu * m * G;
    const Wapp = F * d;
    const Wfric = fk * d;
    const Wnet = Math.max(0, Wapp - Wfric);
    const vFinal = Math.sqrt(2 * Wnet / m);

    if (lastTs !== null) {
      const dt = Math.min((ts - lastTs) / 1000, 0.04);
      const a  = (F - fk) / m;
      if (a > 0) {
        progress = Math.min(1, progress + dt * 0.4);
      }
      if (progress >= 1) { setTimeout(() => { progress = 0; lastTs = null; }, 600); }
    }
    lastTs = ts;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);

    const groundY = H - 50;
    const startX  = 50;
    const endX    = W - 50;
    const trackW  = endX - startX;

    // ground
    ctx.fillStyle = '#1e2533';
    ctx.fillRect(startX - 10, groundY, trackW + 20, H);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(startX - 10, groundY); ctx.lineTo(endX + 10, groundY); ctx.stroke();

    // distance tick marks every ~meter
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
    for (let i = 0; i <= d; i++) {
      const tx = startX + (i / d) * trackW;
      ctx.beginPath(); ctx.moveTo(tx, groundY); ctx.lineTo(tx, groundY + 8); ctx.stroke();
      label(ctx, i + 'm', tx - 5, groundY + 20, '#475569', 10);
    }

    // block
    const bw = 44, bh = 36;
    const bx = startX + progress * trackW;
    ctx.fillStyle = '#1d4ed8';
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx - bw / 2, groundY - bh, bw, bh, 5);
    ctx.fill(); ctx.stroke();
    label(ctx, m + ' kg', bx - 14, groundY - bh / 2 + 5, '#e2e8f0', 12);

    // force arrow
    const arrowLen = Math.min(60, F * 1.5);
    ctx.fillStyle = '#60a5fa';
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx - bw / 2 - 8, groundY - bh / 2);
    ctx.lineTo(bx - bw / 2 - 8 - arrowLen, groundY - bh / 2);
    ctx.stroke();
    // arrowhead
    ctx.beginPath();
    ctx.moveTo(bx - bw / 2 - 6, groundY - bh / 2);
    ctx.lineTo(bx - bw / 2 - 14, groundY - bh / 2 - 5);
    ctx.lineTo(bx - bw / 2 - 14, groundY - bh / 2 + 5);
    ctx.closePath(); ctx.fill();
    label(ctx, 'F=' + F + 'N', bx - bw / 2 - 8 - arrowLen - 4, groundY - bh / 2 + 4, '#60a5fa', 11);

    // progress bar (work done so far)
    const doneX = startX + progress * trackW;
    ctx.fillStyle = 'rgba(96,165,250,0.15)';
    ctx.fillRect(startX, groundY - bh - 18, doneX - startX, 6);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(startX, groundY - bh - 18, doneX - startX, 6);
    label(ctx, 'work done →', startX, groundY - bh - 22, '#475569', 10);

    // energy bars
    const barBaseY = groundY - 5;
    const maxBarH  = 80;
    const maxE     = Math.max(Wapp, 1);
    const bx1 = W - 110, bx2 = W - 75, bx3 = W - 40;

    energyBar(ctx, bx1, barBaseY, (Wapp * progress / maxE) * maxBarH, '#60a5fa', maxBarH);
    energyBar(ctx, bx2, barBaseY, (Wfric * progress / maxE) * maxBarH, '#f87171', maxBarH);
    energyBar(ctx, bx3, barBaseY, (Wnet * progress / maxE) * maxBarH, '#4ade80', maxBarH);

    label(ctx, 'W_app', bx1 - 14, barBaseY + 14, '#60a5fa', 10);
    label(ctx, 'W_f', bx2 - 8, barBaseY + 14, '#f87171', 10);
    label(ctx, 'ΔKE', bx3 - 9, barBaseY + 14, '#4ade80', 10);

    // readouts
    outWa.textContent   = fmt(Wapp) + ' J';
    outWf.textContent   = '−' + fmt(Wfric) + ' J';
    outWnet.textContent = fmt(Wnet) + ' J';
    outV.textContent    = fmt(vFinal) + ' m/s';

    rafId = requestAnimationFrame(draw);
  }

  [slF, slM, slD, slMu].forEach(s => s.addEventListener('input', () => {
    lblF.textContent  = slF.value + ' N';
    lblM.textContent  = slM.value + ' kg';
    lblD.textContent  = slD.value + ' m';
    lblMu.textContent = (+slMu.value).toFixed(2);
    progress = 0; lastTs = null;
  }));

  lblF.textContent  = slF.value + ' N';
  lblM.textContent  = slM.value + ' kg';
  lblD.textContent  = slD.value + ' m';
  lblMu.textContent = (+slMu.value).toFixed(2);

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════
   SIM 3 — Spring Launch
═══════════════════════════════════════════════════ */
function initSpringLaunch() {
  const canvas = document.getElementById('sim-spring');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const slK = document.getElementById('spr-k');
  const slX = document.getElementById('spr-x');
  const slM = document.getElementById('spr-m');
  const lblK = document.getElementById('spr-k-label');
  const lblX = document.getElementById('spr-x-label');
  const lblM = document.getElementById('spr-m-label');
  const outPE = document.getElementById('spr-out-pe');
  const outKE = document.getElementById('spr-out-ke');
  const outV  = document.getElementById('spr-out-v');

  // phase: 0=compressed, 1=launching, 2=flying
  let phase = 0;
  let blockX = 0;
  let t = 0;
  let lastTs = null;
  let rafId = null;

  function draw(ts) {
    const k = +slK.value;
    const x = +slX.value;
    const m = +slM.value;

    const peSpring = 0.5 * k * x * x;
    const vLaunch  = Math.sqrt(2 * peSpring / m);

    const W = canvas.width, H = canvas.height;
    const groundY = H - 50;
    const wallX   = 55;
    const naturalLen = 80;
    const compLen = naturalLen - x * 160; // scale x to pixels

    if (lastTs !== null) {
      const dt = Math.min((ts - lastTs) / 1000, 0.04);
      t += dt;
      if (phase === 0 && t > 1.2) { phase = 1; t = 0; }
      if (phase === 1 && blockX > W - 80) { phase = 2; t = 0; }
      if (phase === 2 && t > 1.0) { phase = 0; t = 0; blockX = 0; }
      if (phase === 1) { blockX = Math.min(W - 80, (wallX + compLen + 22) + vLaunch * t * 40); }
    }
    lastTs = ts;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);

    // ground
    ctx.fillStyle = '#1e2533';
    ctx.fillRect(0, groundY, W, H);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

    // wall
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, groundY - 80, wallX, 80);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wallX, groundY - 80); ctx.lineTo(wallX, groundY); ctx.stroke();

    const blockW = 40, blockH = 34;
    const springRightX = wallX + (phase === 0 ? compLen : naturalLen);
    const blockDrawX   = phase === 0 ? (wallX + compLen) : blockX;

    // spring coils
    const springStart = wallX;
    const springEnd   = springRightX;
    const coils = 7;
    const coilAmp = 8;
    ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(springStart, groundY - blockH / 2);
    for (let i = 0; i <= coils * 2; i++) {
      const sx = springStart + (i / (coils * 2)) * (springEnd - springStart);
      const sy = (groundY - blockH / 2) + (i % 2 === 0 ? coilAmp : -coilAmp);
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.lineTo(springEnd, groundY - blockH / 2);
    ctx.stroke();

    // spring PE label
    const compression = x * 160;
    if (phase === 0) {
      ctx.fillStyle = 'rgba(251,146,60,0.15)';
      ctx.fillRect(wallX, groundY - blockH - 10, compLen, blockH + 10);
      label(ctx, `x=${x.toFixed(2)}m`, wallX + 4, groundY - blockH - 14, '#fb923c', 11);
    }

    // block
    if (phase < 2) {
      ctx.fillStyle = '#1d4ed8';
      ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(blockDrawX, groundY - blockH, blockW, blockH, 5);
      ctx.fill(); ctx.stroke();
      label(ctx, m + ' kg', blockDrawX + 4, groundY - blockH / 2 + 5, '#e2e8f0', 11);
    }

    // energy bars
    const barBaseY = groundY - 5;
    const maxBarH  = 90;
    const maxE     = Math.max(peSpring, 0.1);

    let currentPE = (phase === 0) ? peSpring : 0;
    let currentKE = (phase === 1) ? Math.min(peSpring, 0.5 * m * vLaunch * vLaunch) : 0;

    const bx1 = W - 80, bx2 = W - 40;
    energyBar(ctx, bx1, barBaseY, (currentPE / maxE) * maxBarH, '#fb923c', maxBarH);
    energyBar(ctx, bx2, barBaseY, (currentKE / maxE) * maxBarH, '#60a5fa', maxBarH);
    label(ctx, 'PE_s', bx1 - 12, barBaseY + 14, '#fb923c', 10);
    label(ctx, 'KE', bx2 - 8, barBaseY + 14, '#60a5fa', 10);

    // launch speed annotation
    if (phase === 1) {
      label(ctx, 'v = ' + fmt(vLaunch) + ' m/s →', blockDrawX + blockW + 8, groundY - blockH / 2 + 4, '#fbbf24', 12);
    }

    outPE.textContent = fmt(peSpring) + ' J';
    outKE.textContent = fmt(peSpring) + ' J';
    outV.textContent  = fmt(vLaunch) + ' m/s';

    rafId = requestAnimationFrame(draw);
  }

  [slK, slX, slM].forEach(s => s.addEventListener('input', () => {
    lblK.textContent = slK.value + ' N/m';
    lblX.textContent = (+slX.value).toFixed(2) + ' m';
    lblM.textContent = (+slM.value).toFixed(1) + ' kg';
    phase = 0; blockX = 0; t = 0; lastTs = null;
  }));

  lblK.textContent = slK.value + ' N/m';
  lblX.textContent = (+slX.value).toFixed(2) + ' m';
  lblM.textContent = (+slM.value).toFixed(1) + ' kg';

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════
   SIM 4 — Power (motor lifting a mass)
═══════════════════════════════════════════════════ */
function initPower() {
  const canvas = document.getElementById('sim-power');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const slM = document.getElementById('pwr-m');
  const slV = document.getElementById('pwr-v');
  const slH = document.getElementById('pwr-h');
  const lblM = document.getElementById('pwr-m-label');
  const lblV = document.getElementById('pwr-v-label');
  const lblH = document.getElementById('pwr-h-label');
  const outF = document.getElementById('pwr-out-f');
  const outW = document.getElementById('pwr-out-w');
  const outT = document.getElementById('pwr-out-t');
  const outP = document.getElementById('pwr-out-p');

  let massY = 0; // 0 = bottom, 1 = top
  let lastTs = null;
  let rafId = null;

  function draw(ts) {
    const m = +slM.value;
    const v = +slV.value;
    const h = +slH.value;

    const F = m * G;
    const W_work = m * G * h;
    const time   = h / v;
    const power  = F * v;

    if (lastTs !== null) {
      const dt = Math.min((ts - lastTs) / 1000, 0.04);
      massY = Math.min(1, massY + (v / h) * dt * 0.6);
      if (massY >= 1) { setTimeout(() => { massY = 0; lastTs = null; }, 800); }
    }
    lastTs = ts;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);

    const craneX = 90;
    const bottomY = H - 50;
    const topY    = H - 50 - Math.min(160, h * 20);

    // crane structure
    ctx.fillStyle = '#334155';
    ctx.fillRect(craneX - 6, topY - 20, 12, bottomY - topY + 20);
    ctx.fillRect(craneX - 6, topY - 20, 50, 10);

    // rope
    const massSize = 38;
    const massDrawY = bottomY - massY * (bottomY - topY) - massSize;
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(craneX + 44, topY - 15);
    ctx.lineTo(craneX + 44, massDrawY);
    ctx.stroke();

    // mass block
    ctx.fillStyle = '#7c3aed';
    ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(craneX + 25, massDrawY, massSize, massSize, 5);
    ctx.fill(); ctx.stroke();
    label(ctx, m + ' kg', craneX + 27, massDrawY + massSize / 2 + 5, '#e2e8f0', 11);

    // height line
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(craneX + 80, topY);
    ctx.lineTo(craneX + 80, bottomY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(craneX + 78, massDrawY + massSize / 2);
    ctx.lineTo(craneX + 78, bottomY);
    ctx.stroke();
    const currentH = (1 - massY) * 0; // not shown inline
    label(ctx, 'h = ' + fmt(h, 0) + ' m', craneX + 85, (topY + bottomY) / 2, '#4ade80', 12);

    // power readout dial (right side)
    const dialX = W - 100, dialY = H / 2 - 10, dialR = 60;
    ctx.strokeStyle = '#1e2533'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(dialX, dialY, dialR, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();

    const maxPower = 5000;
    const pFrac = Math.min(1, power / maxPower);
    const startAngle = Math.PI * 0.75;
    const endAngle   = startAngle + pFrac * Math.PI * 1.5;
    const dialColor  = power < 1000 ? '#4ade80' : power < 3000 ? '#fbbf24' : '#f87171';
    ctx.strokeStyle = dialColor; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(dialX, dialY, dialR, startAngle, endAngle); ctx.stroke();

    // needle
    const needleAngle = startAngle + pFrac * Math.PI * 1.5;
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dialX, dialY);
    ctx.lineTo(dialX + (dialR - 12) * Math.cos(needleAngle), dialY + (dialR - 12) * Math.sin(needleAngle));
    ctx.stroke();

    label(ctx, fmt(power, 0) + ' W', dialX - 22, dialY + 10, dialColor, 16);
    label(ctx, 'POWER', dialX - 20, dialY + 26, '#94a3b8', 11);

    if (power >= 1000) {
      label(ctx, fmt(power / 1000, 2) + ' kW', dialX - 22, dialY - 14, '#64748b', 11);
    }

    // progress bar
    ctx.fillStyle = '#1e2533';
    ctx.beginPath(); ctx.roundRect(craneX + 25, bottomY + 10, 100, 8, 4); ctx.fill();
    ctx.fillStyle = '#4ade80';
    ctx.beginPath(); ctx.roundRect(craneX + 25, bottomY + 10, 100 * massY, 8, 4); ctx.fill();
    label(ctx, fmt(massY * time, 1) + 's / ' + fmt(time, 1) + 's', craneX + 25, bottomY + 28, '#64748b', 11);

    outF.textContent = fmt(F, 1) + ' N';
    outW.textContent = fmt(W_work, 1) + ' J';
    outT.textContent = fmt(time, 2) + ' s';
    outP.textContent = fmt(power, 1) + ' W';

    rafId = requestAnimationFrame(draw);
  }

  [slM, slV, slH].forEach(s => s.addEventListener('input', () => {
    lblM.textContent = slM.value + ' kg';
    lblV.textContent = (+slV.value).toFixed(1) + ' m/s';
    lblH.textContent = slH.value + ' m';
    massY = 0; lastTs = null;
  }));

  lblM.textContent = slM.value + ' kg';
  lblV.textContent = (+slV.value).toFixed(1) + ' m/s';
  lblH.textContent = slH.value + ' m';

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
}

/* ── entry point ── */
function initWorkEnergySims() {
  initRampConservation();
  initWorkEnergyTheorem();
  initSpringLaunch();
  initPower();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sim-ramp')) initWorkEnergySims();
});
