/* dynamics-sims.js — Force & Translational Dynamics simulations */

const G = 9.8;

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

function label(ctx, text, x, y, color = '#e2e8f0', size = 13) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px Inter, sans-serif`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function fmt(v, decimals = 2) {
  return v.toFixed(decimals) + (decimals === 0 ? '' : '');
}

/* ═══════════════════════════════════════════════════
   SIM 1 — Block on Surface with FBD
═══════════════════════════════════════════════════ */
function initBlockSurface() {
  const canvas = document.getElementById('sim-block');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderF  = document.getElementById('blk-f');
  const sliderM  = document.getElementById('blk-m');
  const sliderMu = document.getElementById('blk-mu');
  const lblF  = document.getElementById('blk-f-label');
  const lblM  = document.getElementById('blk-m-label');
  const lblMu = document.getElementById('blk-mu-label');
  const outN  = document.getElementById('blk-out-n');
  const outF  = document.getElementById('blk-out-f');
  const outA  = document.getElementById('blk-out-a');

  let blockX = 120;
  let vel = 0;
  let lastT = null;
  let rafId = null;

  function physics() {
    const F    = +sliderF.value;
    const m    = +sliderM.value;
    const muS  = +sliderMu.value;
    const muK  = muS * 0.75;
    const N    = m * G;
    const fsMax = muS * N;
    const fk    = muK * N;

    let friction, accel;
    if (F <= fsMax) {
      friction = F;
      accel = 0;
    } else {
      friction = fk;
      accel = (F - fk) / m;
    }

    const sliding = F > fsMax;
    return { F, m, N, friction, accel, muS, muK, sliding };
  }

  function draw(ts) {
    const { F, m, N, friction, accel, sliding } = physics();

    if (lastT !== null) {
      const dt = Math.min((ts - lastT) / 1000, 0.05);
      if (sliding) {
        vel += accel * dt;
        blockX += vel * 30 * dt;
        if (blockX > canvas.width - 60) { blockX = 60; vel = 0; }
      } else {
        vel = 0;
      }
    }
    lastT = ts;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // background
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);

    // ground
    const groundY = H - 55;
    ctx.fillStyle = '#1e2533';
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

    // block
    const bw = 60, bh = 50;
    const bx = blockX - bw / 2, by = groundY - bh;
    const cx = blockX, cy = groundY - bh / 2;

    ctx.fillStyle = sliding ? '#2563eb' : '#1d4ed8';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 5);
    ctx.fill();
    ctx.stroke();

    // mass label on block
    label(ctx, `${m} kg`, cx - 14, cy + 5, '#e2e8f0', 13);

    // FBD arrows — scale relative to a base of 50 N / 60 px
    const scale = 60 / 50;
    const arrowBase = 90;

    // Normal (up)
    arrow(ctx, cx, by, cx, by - N * scale * 0.6, '#34d399', 2.5);
    label(ctx, 'N', cx + 6, by - N * scale * 0.6 - 5, '#34d399');

    // Weight (down)
    arrow(ctx, cx, groundY - bh, cx, groundY - bh + m * G * scale * 0.6, '#f87171', 2.5);
    label(ctx, 'mg', cx + 6, groundY - bh + m * G * scale * 0.6 + 14, '#f87171');

    // Applied force (right)
    const fArrowLen = Math.max(10, F * scale);
    arrow(ctx, bx - 10, cy, bx - 10 + fArrowLen, cy, '#60a5fa', 2.5);
    label(ctx, `F=${F}N`, bx - 10 + fArrowLen + 4, cy + 4, '#60a5fa');

    // Friction (left)
    const frArrowLen = Math.max(6, friction * scale);
    if (friction > 0) {
      arrow(ctx, bx + bw + 10, cy, bx + bw + 10 - frArrowLen, cy, '#fb923c', 2.5);
      label(ctx, sliding ? 'f_k' : 'f_s', bx + bw + 14 - frArrowLen, cy - 8, '#fb923c');
    }

    // state badge
    const badge = sliding ? 'SLIDING' : 'STATIC';
    const badgeColor = sliding ? '#2563eb' : '#16a34a';
    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    ctx.roundRect(W - 90, 12, 78, 26, 6);
    ctx.fill();
    label(ctx, badge, W - 84, 30, '#fff', 12);

    // update readouts
    outN.textContent = fmt(N) + ' N';
    outF.textContent = fmt(friction) + ' N';
    outA.textContent = fmt(accel) + ' m/s²';

    rafId = requestAnimationFrame(draw);
  }

  function restart() {
    blockX = 120; vel = 0; lastT = null;
    const { sliding } = physics();
    if (!sliding) { blockX = 120; }
  }

  [sliderF, sliderM, sliderMu].forEach(s => {
    s.addEventListener('input', () => {
      lblF.textContent  = sliderF.value + ' N';
      lblM.textContent  = sliderM.value + ' kg';
      const mu = +sliderMu.value;
      lblMu.textContent = mu.toFixed(2) + ' / ' + (mu * 0.75).toFixed(2);
      restart();
    });
  });

  // init labels
  lblF.textContent  = sliderF.value + ' N';
  lblM.textContent  = sliderM.value + ' kg';
  const mu0 = +sliderMu.value;
  lblMu.textContent = mu0.toFixed(2) + ' / ' + (mu0 * 0.75).toFixed(2);

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════
   SIM 2 — Inclined Plane
═══════════════════════════════════════════════════ */
function initInclinedPlane() {
  const canvas = document.getElementById('sim-incline');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

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

  // block position along slope (0 = top, increases downward)
  let sPos = 0.3;
  let vel = 0;
  let lastT = null;
  let rafId = null;

  function physics() {
    const theta = +sliderTheta.value * Math.PI / 180;
    const m     = +sliderM.value;
    const muK   = +sliderMu.value;
    const muS   = muK + 0.10;

    const para = m * G * Math.sin(theta);
    const N    = m * G * Math.cos(theta);
    const fk   = muK * N;
    const fsMax = muS * N;

    const sliding = para > fsMax;
    const accel   = sliding ? (para - fk) / m : 0;

    return { theta, m, muK, para, N, fk, accel, sliding };
  }

  function draw(ts) {
    const { theta, m, para, N, fk, accel, sliding } = physics();

    if (lastT !== null) {
      const dt = Math.min((ts - lastT) / 1000, 0.05);
      if (sliding) {
        vel += accel * dt;
        sPos += vel * dt * 0.12;
        if (sPos > 0.85) { sPos = 0.15; vel = 0; }
      } else {
        vel = 0;
      }
    }
    lastT = ts;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);

    // slope geometry
    const ox = 40, oy = H - 40;
    const slopeLen = W - 80;
    const ex = ox + slopeLen * Math.cos(theta);
    const ey = oy - slopeLen * Math.sin(theta);

    // filled slope triangle
    ctx.fillStyle = '#1e2533';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(ex, oy);
    ctx.closePath();
    ctx.fill();

    // slope surface line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, oy); ctx.stroke();

    // angle arc
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ex, oy, 35, -Math.PI, -Math.PI + theta, false);
    ctx.stroke();
    label(ctx, (+sliderTheta.value) + '°', ex - 48, oy - 8, '#94a3b8', 12);

    // block on slope
    const blockLen = 36, blockH = 24;
    const bCenterT = sPos * slopeLen;
    const bcx = ox + bCenterT * Math.cos(theta);
    const bcy = oy - bCenterT * Math.sin(theta);

    ctx.save();
    ctx.translate(bcx, bcy);
    ctx.rotate(-theta);
    ctx.fillStyle = sliding ? '#2563eb' : '#1d4ed8';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-blockLen / 2, -blockH, blockLen, blockH, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // FBD vectors from block center
    const vcx = bcx;
    const vcy = bcy - blockH / 2 * Math.cos(theta);
    const scale = 55 / (m * G);

    // Weight (straight down)
    const wLen = m * G * scale;
    arrow(ctx, vcx, vcy, vcx, vcy + wLen, '#f87171', 2.5);
    label(ctx, 'mg', vcx + 5, vcy + wLen + 14, '#f87171');

    // Normal (perpendicular to slope = rotated by theta from vertical)
    const nLen = N * scale;
    const nx = vcx - nLen * Math.sin(theta);
    const ny = vcy - nLen * Math.cos(theta);
    arrow(ctx, vcx, vcy, nx, ny, '#34d399', 2.5);
    label(ctx, 'N', nx - 18, ny - 6, '#34d399');

    // Parallel component (down slope)
    const paraLen = para * scale;
    const px = vcx + paraLen * Math.cos(theta);
    const py = vcy + paraLen * Math.sin(theta);  // "down slope" direction
    // actually down the slope: +cos(theta) in x, -sin(theta) in y ... wait
    // slope direction down: (cos theta, sin theta) for a slope rising to left
    // our slope rises from right to left: base at ox,oy; tip at ex,ey
    // direction down-slope from block: towards ox,oy → direction (-cos theta, +sin theta)
    const pxD = vcx - paraLen * Math.cos(theta);
    const pyD = vcy + paraLen * Math.sin(theta);
    arrow(ctx, vcx, vcy, pxD, pyD, '#fbbf24', 2.5);
    label(ctx, 'mg sinθ', pxD - 10, pyD + 14, '#fbbf24', 11);

    // Friction up the slope (if sliding)
    if (sliding && fk > 0) {
      const fkLen = fk * scale;
      const fkx = vcx + fkLen * Math.cos(theta);
      const fky = vcy - fkLen * Math.sin(theta);
      arrow(ctx, vcx, vcy, fkx, fky, '#fb923c', 2.5);
      label(ctx, 'f_k', fkx + 4, fky - 4, '#fb923c');
    }

    // state badge
    const badge = sliding ? 'SLIDING' : 'STATIC';
    ctx.fillStyle = sliding ? '#2563eb' : '#16a34a';
    ctx.beginPath(); ctx.roundRect(W - 90, 12, 78, 26, 6); ctx.fill();
    label(ctx, badge, W - 84, 30, '#fff', 12);

    // readouts
    outPara.textContent = fmt(para) + ' N';
    outN.textContent    = fmt(N) + ' N';
    outFk.textContent   = fmt(fk) + ' N';
    outA.textContent    = fmt(accel) + ' m/s²';

    rafId = requestAnimationFrame(draw);
  }

  [sliderTheta, sliderM, sliderMu].forEach(s => {
    s.addEventListener('input', () => {
      lblTheta.textContent = sliderTheta.value + '°';
      lblM.textContent     = sliderM.value + ' kg';
      lblMu.textContent    = (+sliderMu.value).toFixed(2);
      sPos = 0.3; vel = 0; lastT = null;
    });
  });

  lblTheta.textContent = sliderTheta.value + '°';
  lblM.textContent     = sliderM.value + ' kg';
  lblMu.textContent    = (+sliderMu.value).toFixed(2);

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════
   SIM 3 — Atwood Machine
═══════════════════════════════════════════════════ */
function initAtwood() {
  const canvas = document.getElementById('sim-atwood');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderM1 = document.getElementById('atw-m1');
  const sliderM2 = document.getElementById('atw-m2');
  const lblM1 = document.getElementById('atw-m1-label');
  const lblM2 = document.getElementById('atw-m2-label');
  const outA  = document.getElementById('atw-out-a');
  const outT  = document.getElementById('atw-out-t');
  const outW1 = document.getElementById('atw-out-w1');
  const outW2 = document.getElementById('atw-out-w2');

  // y displacement: positive = m2 descends, m1 ascends
  let disp = 0;
  let vel  = 0;
  let lastT = null;
  let rafId = null;

  function physics() {
    const m1 = +sliderM1.value;
    const m2 = +sliderM2.value;
    const a  = (m2 - m1) * G / (m1 + m2);
    const T  = 2 * m1 * m2 * G / (m1 + m2);
    return { m1, m2, a, T };
  }

  function draw(ts) {
    const { m1, m2, a, T } = physics();

    if (lastT !== null) {
      const dt = Math.min((ts - lastT) / 1000, 0.05);
      vel  += a * dt;
      disp += vel * dt * 40;
      const limit = 55;
      if (Math.abs(disp) > limit) {
        disp = Math.sign(disp) * limit;
        vel  = 0;
      }
    }
    lastT = ts;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);

    // pulley
    const px = W / 2, py = 38, pr = 20;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth   = 3;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1e2533';
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();

    // string positions
    const ropeTopY = py + pr;
    const x1 = px - pr, x2 = px + pr;

    // mass sizes scale slightly with mass for visual
    const bw = 44, bh = 32;
    const m1BaseY = H / 2 - 20;
    const m2BaseY = H / 2 - 20;

    const y1 = m1BaseY - disp;
    const y2 = m2BaseY + disp;

    // clamp visually
    const topClamp = ropeTopY + 10, btmClamp = H - 20;
    const yCl1 = Math.max(topClamp, Math.min(btmClamp - bh, y1));
    const yCl2 = Math.max(topClamp, Math.min(btmClamp - bh, y2));

    // ropes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(x1, ropeTopY); ctx.lineTo(x1, yCl1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, ropeTopY); ctx.lineTo(x2, yCl2); ctx.stroke();

    // mass 1 (left — lighter side: if m2>m1 this goes up)
    ctx.fillStyle = '#1d4ed8';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x1 - bw / 2, yCl1, bw, bh, 5); ctx.fill(); ctx.stroke();
    label(ctx, 'm₁', x1 - 7, yCl1 + 14, '#e2e8f0', 12);
    label(ctx, m1 + ' kg', x1 - 14, yCl1 + 28, '#93c5fd', 11);

    // mass 2 (right — heavier side descends)
    ctx.fillStyle = '#7c3aed';
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x2 - bw / 2, yCl2, bw, bh, 5); ctx.fill(); ctx.stroke();
    label(ctx, 'm₂', x2 - 7, yCl2 + 14, '#e2e8f0', 12);
    label(ctx, m2 + ' kg', x2 - 14, yCl2 + 28, '#c4b5fd', 11);

    // acceleration arrows on masses
    const aAbs = Math.abs(a);
    if (aAbs > 0.05) {
      const arrowLen = Math.min(35, aAbs * 8);
      const dir = a > 0 ? 1 : -1; // m2 descends if a>0
      // m2 arrow (downward if a>0)
      arrow(ctx, x2, yCl2 + bh + 6, x2, yCl2 + bh + 6 + arrowLen * dir, '#fbbf24', 2);
      // m1 arrow (upward if a>0)
      arrow(ctx, x1, yCl1 - 6, x1, yCl1 - 6 - arrowLen * dir, '#fbbf24', 2);
    }

    // equilibrium label
    if (aAbs < 0.05) {
      label(ctx, 'equilibrium', px - 38, H - 12, '#4ade80', 12);
    }

    // readouts
    outA.textContent  = fmt(aAbs) + ' m/s²';
    outT.textContent  = fmt(T) + ' N';
    outW1.textContent = fmt(m1 * G) + ' N';
    outW2.textContent = fmt(m2 * G) + ' N';

    rafId = requestAnimationFrame(draw);
  }

  [sliderM1, sliderM2].forEach(s => {
    s.addEventListener('input', () => {
      lblM1.textContent = sliderM1.value + ' kg';
      lblM2.textContent = sliderM2.value + ' kg';
      disp = 0; vel = 0; lastT = null;
    });
  });

  lblM1.textContent = sliderM1.value + ' kg';
  lblM2.textContent = sliderM2.value + ' kg';

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════════════════
   SIM 4 — Block on Table + Hanging Mass
═══════════════════════════════════════════════════ */
function initTableHanging() {
  const canvas = document.getElementById('sim-table');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderMt = document.getElementById('tbl-mt');
  const sliderMh = document.getElementById('tbl-mh');
  const sliderMu = document.getElementById('tbl-mu');
  const lblMt = document.getElementById('tbl-mt-label');
  const lblMh = document.getElementById('tbl-mh-label');
  const lblMu = document.getElementById('tbl-mu-label');
  const outA  = document.getElementById('tbl-out-a');
  const outT  = document.getElementById('tbl-out-t');

  let tblX = 130;  // table block x position
  let hangY = 90;  // hanging block top y (px below pulley attachment)
  let vel   = 0;
  let lastT = null;
  let rafId = null;

  function physics() {
    const mt  = +sliderMt.value;
    const mh  = +sliderMh.value;
    const muK = +sliderMu.value;

    const fk = muK * mt * G;
    const a  = Math.max(0, (mh * G - fk) / (mt + mh));
    const T  = mt * (a + muK * G);

    return { mt, mh, muK, a, T, fk };
  }

  function draw(ts) {
    const { mt, mh, a, T } = physics();

    if (lastT !== null) {
      const dt = Math.min((ts - lastT) / 1000, 0.05);
      vel  += a * dt;
      tblX += vel * dt * 40;
      hangY += vel * dt * 40;

      const maxTblX = canvas.width - 100;
      if (tblX > maxTblX) {
        tblX = 80;
        hangY = 90;
        vel = 0;
      }
    }
    lastT = ts;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, W, H);

    // table surface
    const tableY = H / 2 - 10;
    ctx.fillStyle = '#1e2533';
    ctx.fillRect(0, tableY, W - 60, 14);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, tableY); ctx.lineTo(W - 60, tableY); ctx.stroke();

    // table edge (right side) — pulley location
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W - 60, tableY); ctx.lineTo(W - 60, tableY + 14); ctx.stroke();

    // pulley
    const pulleyX = W - 42, pulleyY = tableY;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1e2533'; ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, 4, 0, Math.PI * 2); ctx.fill();

    // table block
    const bw = 52, bh = 38;
    const by = tableY - bh;
    ctx.fillStyle = '#1d4ed8';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(tblX - bw / 2, by, bw, bh, 5); ctx.fill(); ctx.stroke();
    label(ctx, 'm_t', tblX - 10, by + 16, '#e2e8f0', 12);
    label(ctx, mt + ' kg', tblX - 14, by + 30, '#93c5fd', 11);

    // horizontal rope from block to pulley
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tblX + bw / 2, tableY - bh / 2);
    ctx.lineTo(pulleyX, pulleyY);
    ctx.stroke();

    // hanging mass
    const hwx = pulleyX, hwy = pulleyY + 14 + hangY;
    const hmw = 44, hmh = 36;
    const cappedHwy = Math.min(hwy, H - hmh - 10);
    ctx.fillStyle = '#7c3aed';
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(hwx - hmw / 2, cappedHwy, hmw, hmh, 5); ctx.fill(); ctx.stroke();
    label(ctx, 'm_h', hwx - 10, cappedHwy + 16, '#e2e8f0', 12);
    label(ctx, mh + ' kg', hwx - 14, cappedHwy + 30, '#c4b5fd', 11);

    // vertical rope
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pulleyX, pulleyY + 14);
    ctx.lineTo(hwx, cappedHwy);
    ctx.stroke();

    // acceleration arrows if moving
    if (a > 0.05) {
      const aLen = Math.min(30, a * 10);
      arrow(ctx, tblX + bw / 2 + 8, tableY - bh / 2, tblX + bw / 2 + 8 + aLen, tableY - bh / 2, '#fbbf24', 2);
      arrow(ctx, hwx, cappedHwy + hmh + 6, hwx, cappedHwy + hmh + 6 + aLen, '#fbbf24', 2);
    }

    // readouts
    outA.textContent = fmt(a) + ' m/s²';
    outT.textContent = fmt(T) + ' N';

    rafId = requestAnimationFrame(draw);
  }

  [sliderMt, sliderMh, sliderMu].forEach(s => {
    s.addEventListener('input', () => {
      lblMt.textContent = sliderMt.value + ' kg';
      lblMh.textContent = sliderMh.value + ' kg';
      lblMu.textContent = (+sliderMu.value).toFixed(2);
      tblX = 130; hangY = 90; vel = 0; lastT = null;
    });
  });

  lblMt.textContent = sliderMt.value + ' kg';
  lblMh.textContent = sliderMh.value + ' kg';
  lblMu.textContent = (+sliderMu.value).toFixed(2);

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(draw);
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
