/* torque-sims.js — Torque & Rotation simulations */

const g = 10;

/* ── helpers ── */
function arrow(ctx, x1, y1, x2, y2, color, width = 2.5) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return;
  const ux = dx / len, uy = dy / len;
  const hw = Math.max(6, width * 2.5), hl = Math.max(10, width * 4);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * hl, y2 - uy * hl);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw);
  ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function lbl(ctx, text, x, y, color = '#e2e8f0', size = 12, align = 'center') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px Inter, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a2236';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/* ═══════════════════════════════════════════════════
   SIM 1 — Torque Balance (beam pivoted at center)
═══════════════════════════════════════════════════ */
function initBalance() {
  const canvas = document.getElementById('sim-balance');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const W = canvas.width, H = canvas.height;
  const pivotX = W / 2, pivotY = H / 2 - 20;
  const beamHalfLen = 180; // px, represents 4 m → scale = 45 px/m

  const sliders = {
    ml: document.getElementById('bal-ml'),
    xl: document.getElementById('bal-xl'),
    mr: document.getElementById('bal-mr'),
    xr: document.getElementById('bal-xr'),
  };
  const labels = {
    ml: document.getElementById('bal-ml-label'),
    xl: document.getElementById('bal-xl-label'),
    mr: document.getElementById('bal-mr-label'),
    xr: document.getElementById('bal-xr-label'),
  };
  const outs = {
    tl: document.getElementById('bal-tl'),
    tr: document.getElementById('bal-tr'),
    tnet: document.getElementById('bal-tnet'),
    status: document.getElementById('bal-status'),
  };

  const PX_PER_M = beamHalfLen / 4; // 4 m max arm

  let angle = 0; // current tilt angle (rad)

  function getVals() {
    return {
      ml: parseFloat(sliders.ml.value),
      xl: parseFloat(sliders.xl.value),
      mr: parseFloat(sliders.mr.value),
      xr: parseFloat(sliders.xr.value),
    };
  }

  function draw() {
    const { ml, xl, mr, xr } = getVals();

    // Torques (ccw positive, cw negative — left side lifts = ccw when right is heavier)
    const tl = ml * g * xl;  // clockwise (left side pulls down left of pivot)
    const tr = mr * g * xr;  // counterclockwise
    const tnet = tr - tl;    // positive = right heavier → beam tilts right side down

    // Target angle: tilt proportional to net torque, clamped
    const targetAngle = Math.max(-0.35, Math.min(0.35, tnet / 400));
    angle += (targetAngle - angle) * 0.15; // smooth

    // Update labels
    labels.ml.textContent = ml.toFixed(1);
    labels.xl.textContent = xl.toFixed(1);
    labels.mr.textContent = mr.toFixed(1);
    labels.xr.textContent = xr.toFixed(1);

    outs.tl.textContent = tl.toFixed(1);
    outs.tr.textContent = tr.toFixed(1);
    outs.tnet.textContent = (tr - tl).toFixed(1);
    const balanced = Math.abs(tr - tl) < 5;
    outs.status.textContent = balanced ? '⚖️ Balanced' : tl > tr ? '↙ Tips left' : '↘ Tips right';
    outs.status.style.color = balanced ? '#4ade80' : '#f87171';

    clearCanvas(ctx, canvas);

    // Draw support triangle
    ctx.save();
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX - 14, pivotY + 28);
    ctx.lineTo(pivotX + 14, pivotY + 28);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw beam (rotated)
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);

    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(-beamHalfLen, -8, beamHalfLen * 2, 16);

    // Left mass
    const lxPx = -xl * PX_PER_M;
    const massHPx = Math.min(60, ml * 6);
    ctx.fillStyle = '#f87171';
    ctx.fillRect(lxPx - 14, 8, 28, massHPx);
    lbl(ctx, ml.toFixed(1) + ' kg', lxPx, 8 + massHPx + 14, '#fca5a5', 11);

    // Right mass
    const rxPx = xr * PX_PER_M;
    const massHPxR = Math.min(60, mr * 6);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(rxPx - 14, 8, 28, massHPxR);
    lbl(ctx, mr.toFixed(1) + ' kg', rxPx, 8 + massHPxR + 14, '#6ee7b7', 11);

    // Pivot dot
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Scale ticks below beam
    ctx.save();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let m = -4; m <= 4; m++) {
      const px = pivotX + m * PX_PER_M;
      ctx.beginPath();
      ctx.moveTo(px, pivotY + 32);
      ctx.lineTo(px, pivotY + 40);
      ctx.stroke();
      if (m !== 0) lbl(ctx, Math.abs(m) + 'm', px, pivotY + 52, '#6b7280', 10);
    }
    ctx.restore();

    lbl(ctx, 'Pivot', pivotX, pivotY + 70, '#9ca3af', 11);

    requestAnimationFrame(draw);
  }

  Object.values(sliders).forEach(s => s.addEventListener('input', () => {}));
  draw();
}

/* ═══════════════════════════════════════════════════
   SIM 2 — Angular Momentum Conservation (skater)
═══════════════════════════════════════════════════ */
function initSkater() {
  const canvas = document.getElementById('sim-skater');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sliderR = document.getElementById('sk-r');
  const sliderM = document.getElementById('sk-m');
  const lblR = document.getElementById('sk-r-label');
  const lblM = document.getElementById('sk-m-label');
  const outI  = document.getElementById('sk-I');
  const outW  = document.getElementById('sk-w');
  const outL  = document.getElementById('sk-L');
  const outKE = document.getElementById('sk-KE');

  // Fixed body parameters
  const I_body = 2.0; // kg·m² (torso + legs, doesn't change)
  const L_conserved = 12.0; // fixed angular momentum (kg·m²/s)

  let angle = 0;

  function draw() {
    const r = parseFloat(sliderR.value);
    const mArm = parseFloat(sliderM.value);

    lblR.textContent = r.toFixed(2);
    lblM.textContent = mArm.toFixed(1);

    // I = body + 2 arms (each arm as point mass at radius r)
    const I_arms = 2 * mArm * r * r;
    const I_total = I_body + I_arms;
    const omega = L_conserved / I_total;
    const KE = 0.5 * I_total * omega * omega;

    outI.textContent  = I_total.toFixed(2);
    outW.textContent  = omega.toFixed(2);
    outL.textContent  = (I_total * omega).toFixed(2);
    outKE.textContent = KE.toFixed(1);

    angle += omega * 0.016; // ~60fps frame step

    clearCanvas(ctx, canvas);

    const cx = W / 2, cy = H / 2 + 10;
    const ARM_PX = r * 80; // scale arms

    // Draw spinning figure
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Torso
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.lineTo(-ARM_PX, -5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, -5);
    ctx.lineTo(ARM_PX, -5);
    ctx.stroke();

    // Hands
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-ARM_PX, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ARM_PX, -5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, -36, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Labels
    lbl(ctx, 'ω = ' + omega.toFixed(2) + ' rad/s', cx, cy + 80, '#e2e8f0', 13);
    lbl(ctx, 'Arms: r = ' + r.toFixed(2) + ' m', cx, cy + 96, '#9ca3af', 11);

    // KE bar
    const maxKE = 0.5 * L_conserved * L_conserved / I_body; // KE when arms in
    const barW = 160, barH = 10;
    const barX = W - barW - 20, barY = H - 40;
    ctx.fillStyle = '#374151';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(barX, barY, barW * Math.min(1, KE / maxKE), barH);
    lbl(ctx, 'KE', barX - 20, barY + 9, '#9ca3af', 11, 'right');
    lbl(ctx, KE.toFixed(1) + ' J', barX + barW + 8, barY + 9, '#fbbf24', 11, 'left');

    requestAnimationFrame(draw);
  }

  draw();
}

/* ═══════════════════════════════════════════════════
   SIM 3 — Circular Motion / Centripetal Force
═══════════════════════════════════════════════════ */
function initCircular() {
  const canvas = document.getElementById('sim-circular');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const sliderV  = document.getElementById('circ-v');
  const sliderR  = document.getElementById('circ-r');
  const sliderMu = document.getElementById('circ-mu');
  const lblV  = document.getElementById('circ-v-label');
  const lblR  = document.getElementById('circ-r-label');
  const lblMu = document.getElementById('circ-mu-label');
  const outAc     = document.getElementById('circ-ac');
  const outMuReq  = document.getElementById('circ-mu-req');
  const outVmax   = document.getElementById('circ-vmax');
  const outStatus = document.getElementById('circ-status');

  let carAngle = 0;

  function draw() {
    const v  = parseFloat(sliderV.value);
    const r  = parseFloat(sliderR.value);
    const mu = parseFloat(sliderMu.value);

    lblV.textContent  = v.toFixed(0);
    lblR.textContent  = r.toFixed(0);
    lblMu.textContent = mu.toFixed(2);

    const ac = v * v / r;
    const muReq = ac / g;
    const vmax = Math.sqrt(mu * g * r);
    const safe = v <= vmax;

    outAc.textContent    = ac.toFixed(2);
    outMuReq.textContent = muReq.toFixed(3);
    outVmax.textContent  = vmax.toFixed(1);
    outStatus.textContent = safe ? '✅ On track' : '⚠️ Skidding!';
    outStatus.style.color = safe ? '#4ade80' : '#f87171';

    carAngle += v / r * 0.016;

    clearCanvas(ctx, canvas);

    // Draw track circle
    const trackR = Math.min(90, Math.max(40, r * 0.7));
    const cx = W / 2, cy = H / 2;

    ctx.strokeStyle = safe ? '#374151' : '#7f1d1d';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(cx, cy, trackR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = safe ? '#4b5563' : '#991b1b';
    ctx.lineWidth = 18;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, trackR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Car position
    const carX = cx + trackR * Math.cos(carAngle);
    const carY = cy + trackR * Math.sin(carAngle);

    // Centripetal arrow (inward)
    const inwardLen = Math.min(55, ac * 4);
    const inX = cx + (trackR - inwardLen) * Math.cos(carAngle);
    const inY = cy + (trackR - inwardLen) * Math.sin(carAngle);
    arrow(ctx, carX, carY, inX, inY, '#60a5fa', 2.5);
    lbl(ctx, 'F_c', inX - 10 * Math.cos(carAngle + Math.PI / 2), inY - 10 * Math.sin(carAngle + Math.PI / 2), '#93c5fd', 11);

    // Velocity arrow (tangential)
    const tanVX = -Math.sin(carAngle);
    const tanVY = Math.cos(carAngle);
    const velLen = Math.min(50, v * 2);
    arrow(ctx, carX, carY, carX + tanVX * velLen, carY + tanVY * velLen, '#4ade80', 2.5);

    // Car body
    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(carAngle + Math.PI / 2);
    ctx.fillStyle = safe ? '#f59e0b' : '#ef4444';
    ctx.beginPath();
    ctx.roundRect(-8, -12, 16, 24, 4);
    ctx.fill();
    ctx.restore();

    // Skid marks if not safe
    if (!safe) {
      ctx.strokeStyle = 'rgba(239,68,68,0.25)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, trackR + 10, carAngle - 0.5, carAngle);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, trackR - 10, carAngle - 0.5, carAngle);
      ctx.stroke();
    }

    // Labels
    lbl(ctx, 'v = ' + v + ' m/s', cx, H - 20, '#e2e8f0', 12);
    lbl(ctx, 'r = ' + r + ' m', cx + 90, H - 20, '#9ca3af', 12);

    requestAnimationFrame(draw);
  }

  draw();
}

/* ── Called by section-loader.js after the simulation fragment is injected ── */
function initTorqueSims() {
  initBalance();
  initSkater();
  initCircular();
}
