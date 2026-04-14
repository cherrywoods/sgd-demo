// ============================================================
// Shared utilities for gradient descent demos
// ============================================================

// --- Ackley function ---
// f(x,y) = -20*exp(-0.2*sqrt(0.5*(x²+y²))) - exp(0.5*(cos(2πx)+cos(2πy))) + e + 20
// Domain: [-5, 5] x [-5, 5]
// Global min: f(0, 0) = 0

function ackley(x, y) {
  const a = 20, b = 0.2, c = 2 * Math.PI;
  return -a * Math.exp(-b * Math.sqrt(0.5 * (x * x + y * y)))
         - Math.exp(0.5 * (Math.cos(c * x) + Math.cos(c * y)))
         + a + Math.E;
}

function ackleyGradient(x, y, eps = 1e-7) {
  const fxp = ackley(x + eps, y);
  const fxm = ackley(x - eps, y);
  const fyp = ackley(x, y + eps);
  const fym = ackley(x, y - eps);
  return [(fxp - fxm) / (2 * eps), (fyp - fym) / (2 * eps)];
}

// --- Eggholder function ---
// f(x,y) = -(y+47)*sin(sqrt(|x/2 + y + 47|)) - x*sin(sqrt(|x - (y+47)|))
// Domain: [-512, 512] x [-512, 512]
// Global min: f(512, 404.2318) ≈ -959.6407

function eggholder(x, y) {
  const a = y + 47;
  return -a * Math.sin(Math.sqrt(Math.abs(x / 2 + a))) -
         x * Math.sin(Math.sqrt(Math.abs(x - a)));
}

function eggholderGradient(x, y, eps = 1e-5) {
  const fxp = eggholder(x + eps, y);
  const fxm = eggholder(x - eps, y);
  const fyp = eggholder(x, y + eps);
  const fym = eggholder(x, y - eps);
  return [(fxp - fxm) / (2 * eps), (fyp - fym) / (2 * eps)];
}

// ============================================================
// Function profiles — change ACTIVE_FN to switch
// ============================================================
const FUNCTIONS = {
  ackley: {
    fn: ackley,
    gradient: ackleyGradient,
    domain: [-10, 10],
    zoomFactor: 10,       // VIEW_SIZE = 10/10 = 1.0
    compassMaxGrad: 7.5,
    noiseSigma: 20,
    startCenter: [2.1, 2.75],
  },
  eggholder: {
    fn: eggholder,
    gradient: eggholderGradient,
    domain: [-512, 512],
    zoomFactor: 10,       // VIEW_SIZE = 1024/10 ≈ 102.4
    compassMaxGrad: 300,
    noiseSigma: 80,
    startCenter: [0, 0],
  },
};

const ACTIVE_FN = "ackley"; // ← change to "eggholder" to switch

const FN = FUNCTIONS[ACTIVE_FN];
const DOMAIN_MIN = FN.domain[0];
const DOMAIN_MAX = FN.domain[1];
const DOMAIN_SIZE = DOMAIN_MAX - DOMAIN_MIN;
const VIEW_SIZE = DOMAIN_SIZE / FN.zoomFactor;

// --- Color mapping (viridis-inspired) ---
function valueToColor(val, vmin, vmax) {
  let t = (val - vmin) / (vmax - vmin);
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * Math.max(0, Math.min(1, -1.4 * t * t + 1.2 * t + 0.28)));
  const g = Math.round(255 * Math.max(0, Math.min(1, -0.6 * t * t + 1.4 * t + 0.1)));
  const b = Math.round(255 * Math.max(0, Math.min(1, 0.7 * t * t - 1.2 * t + 0.95)));
  return [r, g, b];
}

// --- Heatmap rendering ---
function renderHeatmap(canvas) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const values = new Float64Array(W * H);
  let vmin = Infinity, vmax = -Infinity;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const x = DOMAIN_MIN + (px / (W - 1)) * DOMAIN_SIZE;
      const y = DOMAIN_MIN + (py / (H - 1)) * DOMAIN_SIZE;
      const v = FN.fn(x, y);
      values[py * W + px] = v;
      if (v < vmin) vmin = v;
      if (v > vmax) vmax = v;
    }
  }

  const imgData = ctx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const [r, g, b] = valueToColor(values[i], vmin, vmax);
    imgData.data[i * 4] = r;
    imgData.data[i * 4 + 1] = g;
    imgData.data[i * 4 + 2] = b;
    imgData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return { vmin, vmax };
}

// --- Legacy coordinate conversions (full-domain view) ---
function canvasToWorld(px, py, W, H) {
  const x = DOMAIN_MIN + (px / (W - 1)) * DOMAIN_SIZE;
  const y = DOMAIN_MIN + (py / (H - 1)) * DOMAIN_SIZE;
  return [x, y];
}

function worldToCanvas(x, y, W, H) {
  const px = ((x - DOMAIN_MIN) / DOMAIN_SIZE) * (W - 1);
  const py = ((y - DOMAIN_MIN) / DOMAIN_SIZE) * (H - 1);
  return [px, py];
}

// --- Viewport-based coordinate conversions ---
// vcx, vcy: world coordinates at the center of the canvas
function canvasToWorldView(px, py, W, H, vcx, vcy) {
  return [vcx + (px / W - 0.5) * VIEW_SIZE, vcy + (py / H - 0.5) * VIEW_SIZE];
}

function worldToCanvasView(x, y, W, H, vcx, vcy) {
  return [((x - vcx) / VIEW_SIZE + 0.5) * W, ((y - vcy) / VIEW_SIZE + 0.5) * H];
}

// --- Draw a marker ---
function drawMarker(ctx, px, py, color = "#222", radius = 6) {
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// --- Draw blank canvas with viewport ---
function drawBlankCanvasView(ctx, W, H, vcx, vcy) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);

  // Visible world range
  const halfView = VIEW_SIZE / 2;
  const wLeft = vcx - halfView, wRight = vcx + halfView;
  const wTop = vcy - halfView, wBottom = vcy + halfView;

  // Minor grid lines (DOMAIN_SIZE / 100)
  const minorSpacing = DOMAIN_SIZE / 100;
  ctx.strokeStyle = "#f0f0f0";
  ctx.lineWidth = 1;
  let first = Math.ceil(wLeft / minorSpacing) * minorSpacing;
  for (let w = first; w <= wRight; w += minorSpacing) {
    const [px] = worldToCanvasView(w, 0, W, H, vcx, vcy);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
  }
  first = Math.ceil(wTop / minorSpacing) * minorSpacing;
  for (let w = first; w <= wBottom; w += minorSpacing) {
    const [, py] = worldToCanvasView(0, w, W, H, vcx, vcy);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
  }

  // Major grid lines (DOMAIN_SIZE / 10)
  const majorSpacing = DOMAIN_SIZE / 10;
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1;
  first = Math.ceil(wLeft / majorSpacing) * majorSpacing;
  for (let w = first; w <= wRight; w += majorSpacing) {
    const [px] = worldToCanvasView(w, 0, W, H, vcx, vcy);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
  }
  first = Math.ceil(wTop / majorSpacing) * majorSpacing;
  for (let w = first; w <= wBottom; w += majorSpacing) {
    const [, py] = worldToCanvasView(0, w, W, H, vcx, vcy);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
  }

  // Shade out-of-domain areas
  const [dlx, dly] = worldToCanvasView(DOMAIN_MIN, DOMAIN_MIN, W, H, vcx, vcy);
  const [drx, dry] = worldToCanvasView(DOMAIN_MAX, DOMAIN_MAX, W, H, vcx, vcy);
  ctx.fillStyle = "rgba(0,0,0,0.04)";
  if (dlx > 0) ctx.fillRect(0, 0, Math.min(dlx, W), H);
  if (drx < W) ctx.fillRect(Math.max(0, drx), 0, W - Math.max(0, drx), H);
  const xl = Math.max(0, dlx), xr = Math.min(W, drx);
  if (xr > xl) {
    if (dly > 0) ctx.fillRect(xl, 0, xr - xl, Math.min(dly, H));
    if (dry < H) ctx.fillRect(xl, Math.max(0, dry), xr - xl, H - Math.max(0, dry));
  }

  // Domain boundary (dashed)
  const bVisible = dlx > -W && dly > -H && drx < 2 * W && dry < 2 * H;
  if (bVisible) {
    ctx.save();
    ctx.strokeStyle = "#bbb";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(dlx, dly, drx - dlx, dry - dly);
    ctx.restore();
  }
}

// --- Center crosshair (target indicator) ---
function drawCenterCrosshair(ctx, W, H) {
  const cx = W / 2, cy = H / 2;
  const inner = 10, outer = 22;
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - outer, cy); ctx.lineTo(cx - inner, cy);
  ctx.moveTo(cx + inner, cy); ctx.lineTo(cx + outer, cy);
  ctx.moveTo(cx, cy - outer); ctx.lineTo(cx, cy - inner);
  ctx.moveTo(cx, cy + inner); ctx.lineTo(cx, cy + outer);
  ctx.stroke();
  ctx.restore();
}

// --- Compass: gradient direction in a circle ---
function drawCompass(compassCanvas, gx, gy, { color = "#d33", maxGrad = FN.compassMaxGrad, label = "−∇f" } = {}) {
  const ctx = compassCanvas.getContext("2d");
  const S = compassCanvas.width;
  const cx = S / 2;
  const cy = S / 2;
  const R = S / 2 - 10;

  ctx.clearRect(0, 0, compassCanvas.width, compassCanvas.height);

  // Outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(250,250,250,0.9)";
  ctx.fill();
  ctx.strokeStyle = "#bbb";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tick marks (N/S/E/W)
  const tickLen = 7;
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1.5;
  for (let a = 0; a < 4; a++) {
    const angle = (a * Math.PI) / 2;
    const ox = Math.cos(angle);
    const oy = Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx + ox * (R - tickLen), cy + oy * (R - tickLen));
    ctx.lineTo(cx + ox * R, cy + oy * R);
    ctx.stroke();
  }

  // Small tick marks
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  for (let a = 0; a < 8; a++) {
    const angle = (a * Math.PI) / 4;
    if (a % 2 === 0) continue;
    const ox = Math.cos(angle);
    const oy = Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx + ox * (R - tickLen / 2), cy + oy * (R - tickLen / 2));
    ctx.lineTo(cx + ox * R, cy + oy * R);
    ctx.stroke();
  }

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI);
  ctx.fillStyle = "#999";
  ctx.fill();

  // Negative gradient arrow
  const ngx = -gx;
  const ngy = -gy;
  const len = Math.sqrt(ngx * ngx + ngy * ngy);
  if (len < 1e-10) return;

  const arrowLen = Math.min(R - 4, (len / maxGrad) * (R - 4));
  const dx = (ngx / len) * arrowLen;
  const dy = (ngy / len) * arrowLen;

  const ex = cx + dx;
  const ey = cy + dy;
  const headLen = Math.min(9, arrowLen * 0.4);
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - headLen * Math.cos(angle - 0.4), ey - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(ex - headLen * Math.cos(angle + 0.4), ey - headLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Label
  ctx.fillStyle = color;
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, compassCanvas.height - 2);
}

// --- Animation helper (easeOutCubic) ---
function animateView(fromX, fromY, toX, toY, duration, onFrame, onDone) {
  const startTime = performance.now();
  function step(now) {
    let t = Math.min(1, (now - startTime) / duration);
    t = 1 - Math.pow(1 - t, 3);
    onFrame(fromX + (toX - fromX) * t, fromY + (toY - fromY) * t);
    if (t < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
}

// --- Gaussian random (Box-Muller) ---
function gaussianRandom(mean = 0, std = 1) {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// --- Info panel helper ---
function updateInfo(elementId, text) {
  document.getElementById(elementId).textContent = text;
}
