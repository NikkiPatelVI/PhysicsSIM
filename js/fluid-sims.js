// Interactive simulations for Fluid Dynamics (AP Physics 1, Unit 8)
// Each scenario maps to a "must-know" entry in the study guide.

const G = 9.8;
const RHO_WATER = 1000;
const P_ATM = 101325;

const COLORS = {
  water: '#3b82f6',
  waterLight: '#93c5fd',
  metal: '#475569',
  wood: '#a16207',
  border: '#1f2937',
  pipe: '#cbd5e1',
  arrow: '#dc2626',
  arrowGreen: '#16a34a',
};

function $(id) { return document.getElementById(id); }

function drawArrow(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 8;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function label(ctx, text, x, y, color = '#1a1917', size = 12, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${size}px Inter, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}


// ══════════════════════════════════════════
// 1. HYDRAULIC LIFT
// ══════════════════════════════════════════
function initHydraulic() {
  const canvas = $('sim-hydraulic');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const f1 = $('hyd-f1');
  const ratio = $('hyd-ratio');

  function draw() {
    const F1 = +f1.value;
    const R = +ratio.value;
    const F2 = F1 * R;
    $('hyd-f1-label').textContent = F1 + ' N';
    $('hyd-ratio-label').textContent = R.toFixed(1) + '×';
    $('hyd-out-f2').textContent = F2.toFixed(0) + ' N';
    $('hyd-out-d').textContent = R.toFixed(1) + '×';

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Geometry: small cylinder on left, large on right, connected at bottom
    const baseY = H - 40;
    const x1 = 90, x2 = W - 130;
    const r1 = 18;
    const r2 = r1 * Math.sqrt(R); // visual area scaling
    const tubeY = baseY;

    // Connection tube
    ctx.fillStyle = COLORS.water;
    ctx.fillRect(x1, baseY - 8, x2 - x1, 16);

    // Small cylinder (left)
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(x1 - r1, baseY - 100, r1 * 2, 100);
    ctx.fillStyle = COLORS.water;
    ctx.fillRect(x1 - r1, baseY - 60, r1 * 2, 60);
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(x1 - r1, baseY - 100, r1 * 2, 100);
    // Small piston
    ctx.fillStyle = COLORS.metal;
    ctx.fillRect(x1 - r1 - 2, baseY - 65, r1 * 2 + 4, 8);

    // Large cylinder (right)
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(x2 - r2, baseY - 100, r2 * 2, 100);
    ctx.fillStyle = COLORS.water;
    ctx.fillRect(x2 - r2, baseY - 30, r2 * 2, 30);
    ctx.strokeStyle = COLORS.border;
    ctx.strokeRect(x2 - r2, baseY - 100, r2 * 2, 100);
    // Large piston
    ctx.fillStyle = COLORS.metal;
    ctx.fillRect(x2 - r2 - 2, baseY - 35, r2 * 2 + 4, 8);

    // Force arrows
    drawArrow(ctx, x1, baseY - 110, x1, baseY - 75, COLORS.arrow, 3);
    label(ctx, `F₁ = ${F1} N`, x1, baseY - 115, COLORS.arrow, 12);

    drawArrow(ctx, x2, baseY - 70, x2, baseY - 45, COLORS.arrowGreen, 3);
    label(ctx, `F₂ = ${F2.toFixed(0)} N`, x2, baseY - 75, COLORS.arrowGreen, 12);

    label(ctx, 'A₁', x1, baseY + 20, '#6b6966', 11);
    label(ctx, `A₂ = ${R.toFixed(1)}·A₁`, x2, baseY + 20, '#6b6966', 11);
  }

  f1.addEventListener('input', draw);
  ratio.addEventListener('input', draw);
  draw();
}


// ══════════════════════════════════════════
// 2. VENTURI EFFECT
// ══════════════════════════════════════════
function initVenturi() {
  const canvas = $('sim-venturi');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const v1Inp = $('ven-v1');
  const ratioInp = $('ven-ratio');

  // Particles flow through the pipe
  const particles = Array.from({ length: 30 }, () => ({
    x: Math.random() * canvas.width,
    y: 0,
    vx: 1,
  }));

  function pipeRadius(x, W, H, r) {
    // Returns half-height of pipe at position x. Constriction in the middle.
    const h1 = H * 0.18;
    const h2 = h1 * r; // r = A2/A1, so radius scales with sqrt
    const cx = W / 2;
    const halfWidth = 80;
    if (x < cx - halfWidth || x > cx + halfWidth) return h1;
    if (x > cx - 30 && x < cx + 30) return h2;
    // smooth taper
    const t = (Math.abs(x - cx) - 30) / 50;
    return h2 + (h1 - h2) * Math.max(0, Math.min(1, t));
  }

  function update() {
    const v1 = +v1Inp.value;
    const r = +ratioInp.value; // A2/A1, < 1 means narrower
    const v2 = v1 / r; // continuity: v2 = v1 * (A1/A2)
    const dP = 0.5 * RHO_WATER * (v2 * v2 - v1 * v1); // P1 - P2

    $('ven-v1-label').textContent = v1.toFixed(1) + ' m/s';
    $('ven-ratio-label').textContent = r.toFixed(2);
    $('ven-out-v2').textContent = v2.toFixed(1) + ' m/s';
    $('ven-out-dp').textContent = (dP / 1000).toFixed(2) + ' kPa';
  }

  function draw() {
    const v1 = +v1Inp.value;
    const r = +ratioInp.value;
    const W = canvas.width, H = canvas.height;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Pipe outline
    ctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const dy = pipeRadius(x, W, H, r);
      if (x === 0) ctx.moveTo(x, cy - dy);
      else ctx.lineTo(x, cy - dy);
    }
    for (let x = W; x >= 0; x -= 2) {
      const dy = pipeRadius(x, W, H, r);
      ctx.lineTo(x, cy + dy);
    }
    ctx.closePath();
    ctx.fillStyle = COLORS.waterLight;
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Particles
    ctx.fillStyle = COLORS.water;
    particles.forEach(p => {
      const dy = pipeRadius(p.x, W, H, r);
      const localR = dy;
      const baseR = H * 0.18;
      const speed = v1 * (baseR / localR); // by continuity, narrow → faster
      p.x += speed * 0.6;
      if (p.x > W) {
        p.x = 0;
        p.y = (Math.random() - 0.5) * 0.6;
      }
      const py = cy + p.y * dy;
      ctx.beginPath();
      ctx.arc(p.x, py, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pressure indicators
    const v2 = v1 / r;
    label(ctx, `v₁ = ${v1.toFixed(1)} m/s`, 60, 22, '#1a1917', 11);
    label(ctx, `v₂ = ${v2.toFixed(1)} m/s`, W / 2, 22, COLORS.arrow, 11);
    label(ctx, `v₁ = ${v1.toFixed(1)} m/s`, W - 60, 22, '#1a1917', 11);

    label(ctx, 'P₁', 60, H - 12, '#1a1917', 11);
    label(ctx, 'P₂ < P₁', W / 2, H - 12, COLORS.arrow, 11);
    label(ctx, 'P₁', W - 60, H - 12, '#1a1917', 11);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  v1Inp.addEventListener('input', update);
  ratioInp.addEventListener('input', update);
  loop();
}


// ══════════════════════════════════════════
// 3. TORRICELLI / TANK DRAIN
// ══════════════════════════════════════════
function initTorricelli() {
  const canvas = $('sim-torricelli');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hInp = $('tor-h');

  let dropX = 0;

  function loop() {
    const h = +hInp.value;
    const v = Math.sqrt(2 * G * h);
    $('tor-h-label').textContent = h.toFixed(2) + ' m';
    $('tor-out-v').textContent = v.toFixed(2) + ' m/s';

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Tank
    const tankX = 60, tankW = 180, tankBottom = H - 40, tankTop = 30;
    const fullHeight = tankBottom - tankTop;
    const holeY = tankBottom - 20; // hole near bottom
    const waterTopY = holeY - (h / 2.0) * (fullHeight - 30); // h scaled to canvas

    // Tank walls
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tankX, tankTop);
    ctx.lineTo(tankX, tankBottom);
    ctx.lineTo(tankX + tankW, tankBottom);
    ctx.lineTo(tankX + tankW, holeY + 8);
    ctx.moveTo(tankX + tankW, holeY - 8);
    ctx.lineTo(tankX + tankW, tankTop);
    ctx.stroke();

    // Water inside
    ctx.fillStyle = COLORS.waterLight;
    ctx.fillRect(tankX + 1, waterTopY, tankW - 2, tankBottom - waterTopY - 1);

    // Height indicator
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(tankX - 15, waterTopY);
    ctx.lineTo(tankX - 15, holeY);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, `h = ${h.toFixed(2)} m`, tankX - 18, (waterTopY + holeY) / 2, '#475569', 11, 'right');

    // Water stream — projectile from hole
    const exitX = tankX + tankW;
    const v_pixels = v * 18; // visual scaling
    ctx.strokeStyle = COLORS.water;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = 0; t < 1.2; t += 0.02) {
      const px = exitX + v_pixels * t;
      const py = holeY + 0.5 * 200 * t * t; // visual gravity
      if (px > W) break;
      if (py > tankBottom + 5) break;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Animated drop
    dropX = (dropX + v * 0.3) % (v_pixels * 1.0);
    const t = dropX / v_pixels;
    const dpx = exitX + v_pixels * t;
    const dpy = holeY + 0.5 * 200 * t * t;
    if (dpx < W && dpy < tankBottom + 5) {
      ctx.fillStyle = COLORS.water;
      ctx.beginPath();
      ctx.arc(dpx, dpy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(0, tankBottom, W, 4);

    // Labels
    label(ctx, 'P_atm (open top)', tankX + tankW / 2, tankTop - 8, '#475569', 10);
    drawArrow(ctx, exitX + 6, holeY, exitX + 36, holeY, COLORS.arrow, 2);
    label(ctx, `v = √(2gh) = ${v.toFixed(2)} m/s`, exitX + 50, holeY + 4, COLORS.arrow, 11, 'left');

    requestAnimationFrame(loop);
  }

  hInp.addEventListener('input', () => {});
  loop();
}


// ══════════════════════════════════════════
// 4. APPARENT WEIGHT IN FLUID
// ══════════════════════════════════════════
function initApparent() {
  const canvas = $('sim-apparent');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rhoInp = $('app-rho');
  const subInp = $('app-sub');

  function draw() {
    const rhoObj = +rhoInp.value;
    const submerged = +subInp.value / 100; // 0..1
    const V = 0.001; // 1 L volume
    const m = rhoObj * V;
    const W = m * G;
    const Fb = RHO_WATER * V * submerged * G;
    const Wapp = Math.max(0, W - Fb);

    $('app-rho-label').textContent = rhoObj + ' kg/m³';
    $('app-sub-label').textContent = (submerged * 100).toFixed(0) + '%';
    $('app-out-w').textContent = W.toFixed(2) + ' N';
    $('app-out-fb').textContent = Fb.toFixed(2) + ' N';
    $('app-out-wapp').textContent = Wapp.toFixed(2) + ' N';

    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    // Container with water
    const tankX = 80, tankW = 180, tankTop = 60, tankBottom = ch - 30;
    const waterTop = tankTop + 30;
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tankX, tankTop);
    ctx.lineTo(tankX, tankBottom);
    ctx.lineTo(tankX + tankW, tankBottom);
    ctx.lineTo(tankX + tankW, tankTop);
    ctx.stroke();
    ctx.fillStyle = COLORS.waterLight;
    ctx.fillRect(tankX + 1, waterTop, tankW - 2, tankBottom - waterTop - 1);

    // Object: cube hanging from a "scale spring"
    const objSize = 50;
    const objCenterX = tankX + tankW / 2;
    const objTopY = waterTop - objSize * (1 - submerged);
    const objColor = rhoObj < RHO_WATER ? COLORS.wood : COLORS.metal;
    ctx.fillStyle = objColor;
    ctx.fillRect(objCenterX - objSize / 2, objTopY, objSize, objSize);
    ctx.strokeStyle = COLORS.border;
    ctx.strokeRect(objCenterX - objSize / 2, objTopY, objSize, objSize);

    // Spring/scale up top
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let sy = 15;
    for (let i = 0; i < 10; i++) {
      const dx = (i % 2 === 0) ? -5 : 5;
      ctx.lineTo(objCenterX + dx, sy);
      sy += 3;
    }
    ctx.lineTo(objCenterX, objTopY);
    ctx.stroke();

    // Scale top
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(objCenterX - 30, 5, 60, 10);
    label(ctx, `Scale: ${Wapp.toFixed(2)} N`, objCenterX, 28, '#fff', 11);
    ctx.fillStyle = '#fff';
    ctx.fillRect(objCenterX - 30, 22, 60, 1);

    // Force arrows on object
    const objCenterY = objTopY + objSize / 2;
    drawArrow(ctx, objCenterX - 80, objCenterY, objCenterX - 80, objCenterY + 30, COLORS.arrow, 2);
    label(ctx, `W = ${W.toFixed(2)} N`, objCenterX - 80, objCenterY + 45, COLORS.arrow, 11);

    if (Fb > 0.01) {
      drawArrow(ctx, objCenterX + 80, objCenterY + 20, objCenterX + 80, objCenterY - 10, COLORS.arrowGreen, 2);
      label(ctx, `F_b = ${Fb.toFixed(2)} N`, objCenterX + 80, objCenterY + 35, COLORS.arrowGreen, 11);
    }
  }

  rhoInp.addEventListener('input', draw);
  subInp.addEventListener('input', draw);
  draw();
}


// ══════════════════════════════════════════
// 5. SUBMERGED CYLINDER ON A STRING
// ══════════════════════════════════════════
function initString() {
  const canvas = $('sim-string');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rhoInp = $('str-rho');
  const volInp = $('str-vol');

  function draw() {
    const rhoObj = +rhoInp.value;
    const V = +volInp.value / 1000; // L to m³
    const m = rhoObj * V;
    const W = m * G;
    const Fb = RHO_WATER * V * G; // fully submerged
    const T = Math.max(0, W - Fb);
    const sinks = W > Fb;

    $('str-rho-label').textContent = rhoObj + ' kg/m³';
    $('str-vol-label').textContent = (+volInp.value).toFixed(1) + ' L';
    $('str-out-w').textContent = W.toFixed(2) + ' N';
    $('str-out-fb').textContent = Fb.toFixed(2) + ' N';
    $('str-out-t').textContent = T.toFixed(2) + ' N';

    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    // Tank with water
    const tankX = 60, tankW = 220, tankTop = 50, tankBottom = ch - 30;
    const waterTop = tankTop + 25;
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tankX, tankTop);
    ctx.lineTo(tankX, tankBottom);
    ctx.lineTo(tankX + tankW, tankBottom);
    ctx.lineTo(tankX + tankW, tankTop);
    ctx.stroke();
    ctx.fillStyle = COLORS.waterLight;
    ctx.fillRect(tankX + 1, waterTop, tankW - 2, tankBottom - waterTop - 1);

    // Hanging point
    const hookX = tankX + tankW / 2;
    const hookY = tankTop - 10;
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(hookX - 15, hookY - 5, 30, 5);

    // Cylinder (centered in tank, fully submerged)
    const cylSize = 50;
    const cylY = (waterTop + tankBottom) / 2;
    const objColor = sinks ? COLORS.metal : COLORS.wood;

    // String
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hookX, hookY);
    ctx.lineTo(hookX, cylY - cylSize / 2);
    ctx.stroke();

    // Cylinder
    ctx.fillStyle = objColor;
    ctx.fillRect(hookX - cylSize / 2, cylY - cylSize / 2, cylSize, cylSize);
    ctx.strokeStyle = COLORS.border;
    ctx.strokeRect(hookX - cylSize / 2, cylY - cylSize / 2, cylSize, cylSize);
    label(ctx, `${rhoObj} kg/m³`, hookX, cylY + 4, '#fff', 11);

    // Free body diagram on right
    const fbX = cw - 90;
    const fbY = ch / 2;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(fbX - 50, fbY - 70, 100, 140);
    ctx.strokeStyle = COLORS.border;
    ctx.strokeRect(fbX - 50, fbY - 70, 100, 140);
    label(ctx, 'Free Body', fbX, fbY - 55, '#475569', 10);

    // Object dot in FBD
    ctx.fillStyle = objColor;
    ctx.fillRect(fbX - 12, fbY - 12, 24, 24);

    // T arrow up
    drawArrow(ctx, fbX, fbY - 12, fbX, fbY - 45, '#0ea5e9', 2);
    label(ctx, `T=${T.toFixed(1)}`, fbX, fbY - 50, '#0ea5e9', 10);

    // Fb arrow up (offset)
    drawArrow(ctx, fbX - 25, fbY, fbX - 25, fbY - 30, COLORS.arrowGreen, 2);
    label(ctx, `Fb=${Fb.toFixed(1)}`, fbX - 25, fbY - 35, COLORS.arrowGreen, 10);

    // Weight arrow down
    drawArrow(ctx, fbX + 18, fbY + 12, fbX + 18, fbY + 50, COLORS.arrow, 2);
    label(ctx, `W=${W.toFixed(1)}`, fbX + 18, fbY + 62, COLORS.arrow, 10);

    if (!sinks && T < 0.01) {
      label(ctx, 'String slack — object floats!', cw / 2, ch - 10, '#dc2626', 11);
    }
  }

  rhoInp.addEventListener('input', draw);
  volInp.addEventListener('input', draw);
  draw();
}


// ══════════════════════════════════════════
// 6. PRESSURIZED TANK FOUNTAIN
// ══════════════════════════════════════════
function initFountain() {
  const canvas = $('sim-fountain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const pInp = $('fnt-p');

  let drops = [];
  let frame = 0;

  function loop() {
    const Pg = +pInp.value * 1000; // kPa to Pa
    const v = Math.sqrt(2 * Pg / RHO_WATER);
    const h = v * v / (2 * G);

    $('fnt-p-label').textContent = (+pInp.value).toFixed(0) + ' kPa';
    $('fnt-out-v').textContent = v.toFixed(2) + ' m/s';
    $('fnt-out-h').textContent = h.toFixed(2) + ' m';

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = '#86efac';
    ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(0, H - 30, W, 30);

    // Underground tank
    const nozzleX = W / 2;
    const groundY = H - 60;
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.fillStyle = COLORS.waterLight;
    ctx.fillRect(nozzleX - 60, H - 25, 120, 20);
    ctx.strokeRect(nozzleX - 60, H - 25, 120, 20);
    label(ctx, `P_gauge = ${(+pInp.value).toFixed(0)} kPa`, nozzleX, H - 8, '#475569', 10);

    // Pipe up to nozzle
    ctx.fillStyle = COLORS.pipe;
    ctx.fillRect(nozzleX - 6, groundY, 12, 25);
    ctx.strokeRect(nozzleX - 6, groundY, 12, 25);
    // Nozzle tip
    ctx.fillStyle = '#475569';
    ctx.fillRect(nozzleX - 8, groundY - 4, 16, 4);

    // Spawn drops
    if (frame % 3 === 0) {
      drops.push({ x: nozzleX, y: groundY - 4, vy: -v * 4, vx: (Math.random() - 0.5) * 0.5 });
    }

    // Update + draw drops
    drops = drops.filter(d => d.y < H + 10);
    drops.forEach(d => {
      d.vy += 0.25; // visual gravity
      d.y += d.vy * 0.4;
      d.x += d.vx;
      ctx.fillStyle = COLORS.water;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Height marker
    const visualH = Math.min(h * 25, groundY - 20);
    const peakY = groundY - 4 - visualH;
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(nozzleX + 50, groundY - 4);
    ctx.lineTo(nozzleX + 50, peakY);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, `h = ${h.toFixed(2)} m`, nozzleX + 90, (groundY + peakY) / 2, '#475569', 11);
    label(ctx, `v_exit = ${v.toFixed(2)} m/s`, nozzleX - 90, groundY - 25, COLORS.arrow, 11, 'right');

    frame++;
    requestAnimationFrame(loop);
  }

  loop();
}


// ── INIT ALL ──
document.addEventListener('DOMContentLoaded', () => {
  initHydraulic();
  initVenturi();
  initTorricelli();
  initApparent();
  initString();
  initFountain();
});
