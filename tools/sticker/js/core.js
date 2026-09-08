globalThis.Sticker = globalThis.Sticker || {};
Sticker.createCore = function createCore() {
"use strict";
// Portable pixel operations. No DOM, native filters, or file-system dependencies.
const VERSION = "sticker-1";
const DEFAULTS = Object.freeze({ version: VERSION, finish: "ink", border: 4, displayWidth: 80, scale: 4, recolor: null });
function recipe(value = {}) {
  const p = { ...DEFAULTS, ...value };
  if (p.version !== VERSION || !["flat", "ink", "blind", "pastel"].includes(p.finish) || ![3, 4, 5].includes(p.border) || ![1, 2, 4].includes(p.scale) || !Number.isInteger(p.displayWidth) || p.displayWidth < 40 || p.displayWidth > 320 || (p.recolor !== null && p.recolor !== 90)) throw new Error("不支持的配方或参数。");
  return { version: VERSION, finish: p.finish, border: p.border, displayWidth: p.displayWidth, scale: p.scale, recolor: p.recolor };
}
// Bilinear resampling in premultiplied alpha prevents dark transparent fringes.
function resize(data, w, h, nw, nh) {
  const out = new Uint8ClampedArray(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    const sy = Math.max(0, Math.min(h - 1, (y + 0.5) * h / nh - 0.5));
    const y0 = Math.floor(sy), fy = sy - y0;
    for (let x = 0; x < nw; x++) {
      const sx = Math.max(0, Math.min(w - 1, (x + 0.5) * w / nw - 0.5));
      const x0 = Math.floor(sx), fx = sx - x0;
      const sum = [0, 0, 0, 0];
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const i = (Math.min(h - 1, y0 + dy) * w + Math.min(w - 1, x0 + dx)) * 4;
        const weight = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy);
        const a = data[i + 3] * weight;
        sum[3] += a;
        for (let c = 0; c < 3; c++) sum[c] += data[i + c] * a;
      }
      const i = (y * nw + x) * 4;
      for (let c = 0; c < 3; c++) out[i + c] = sum[3] ? sum[c] / sum[3] : 0;
      out[i + 3] = sum[3];
    }
  }
  return out;
}
// Exact squared Euclidean distance transform: linear work per image axis.
function distance(mask, w, h, target) {
  const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n);
  const v = new Int32Array(n), z = new Float64Array(n + 1);
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  function line(length) {
    let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
    for (let q = 1; q < length; q++) {
      let s;
      do {
        const r = v[k]; s = ((f[q] + q * q) - (f[r] + r * r)) / (2 * (q - r));
        if (s > z[k]) break;
        k--;
      } while (k >= 0);
      k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < length; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) ** 2 + f[v[k]]; }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = Boolean(mask[y * w + x]) === target ? 0 : 1e12;
    line(w); for (let x = 0; x < w; x++) tmp[y * w + x] = d[x];
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = tmp[y * w + x];
    line(h); for (let y = 0; y < h; y++) out[y * w + x] = d[y];
  }
  return out;
}
function morph(mask, w, h, radius, dilate) {
  const d = distance(mask, w, h, dilate);
  return Uint8Array.from(d, (value) => dilate ? +(value <= radius * radius) : +(value > radius * radius));
}
function close(mask, w, h, r) { return morph(morph(mask, w, h, r, true), w, h, r, false); }
function blur(data, w, h, sigma) {
  const r = Math.ceil(sigma * 3), kernel = [];
  let total = 0;
  for (let i = -r; i <= r; i++) { const v = Math.exp(-i * i / (2 * sigma * sigma)); kernel.push(v); total += v; }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= total;
  const tmp = new Float32Array(data.length), out = new Float32Array(data.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let k = -r; k <= r; k++) v += data[y * w + Math.max(0, Math.min(w - 1, x + k))] * kernel[k + r];
    tmp[y * w + x] = v;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let k = -r; k <= r; k++) v += tmp[Math.max(0, Math.min(h - 1, y + k)) * w + x] * kernel[k + r];
    out[y * w + x] = v;
  }
  return out;
}
function prepare({ data, width, height }, options) {
  const p = recipe(options);
  if (!width || !height || width * height > 16000000 || data.length !== width * height * 4) throw new Error("图片尺寸无效或超过 1600 万像素。");
  const aw = p.displayWidth * 4, ah = Math.max(1, Math.round(height * aw / width));
  const w = aw + 80, h = ah + 80;
  if (w * h > 2000000) throw new Error("此长宽比在当前尺寸下过大，请降低图案显示宽度。");
  const scaled = resize(data, width, height, aw, ah), art = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < ah; y++) art.set(scaled.subarray(y * aw * 4, (y + 1) * aw * 4), ((y + 40) * w + 40) * 4);
  if (p.recolor !== null) for (let i = 0; i < art.length; i += 4) art[i] = art[i + 1] = art[i + 2] = p.recolor;
  let mask = Uint8Array.from({ length: w * h }, (_, i) => +(art[i * 4 + 3] >= 128));
  mask = close(mask, w, h, 8);
  mask = morph(mask, w, h, p.border * 4, true);
  mask = close(mask, w, h, 8);
  mask = morph(morph(mask, w, h, 4, false), w, h, 4, true);
  // 8× smoothing followed by a Triangle downsample leaves antialiased edges.
  const up = new Float32Array(w * h * 4);
  for (let y = 0; y < h * 2; y++) for (let x = 0; x < w * 2; x++) up[y * w * 2 + x] = mask[Math.floor(y / 2) * w + Math.floor(x / 2)];
  const smooth = blur(up, w * 2, h * 2, 6), alpha = new Uint8ClampedArray(w * h);
  const coverage = new Float32Array(w * h), printed = new Uint8ClampedArray(art.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x, i = k * 4;
    let count = 0;
    const weights = [1, 3, 3, 1];
    for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 2; dx++) {
      const yy = Math.max(0, Math.min(h * 2 - 1, y * 2 + dy));
      const xx = Math.max(0, Math.min(w * 2 - 1, x * 2 + dx));
      count += +(smooth[yy * w * 2 + xx] >= 0.5) * weights[dy + 1] * weights[dx + 1];
    }
    // Preserve isolated translucent detail too; never erase source alpha.
    alpha[k] = Math.max(count * 255 / 64, art[i + 3]);
    const a = art[i + 3] / 255;
    for (let c = 0; c < 3; c++) printed[i + c] = 255 + (art[i + c] - 255) * a;
    printed[i + 3] = alpha[k];
    const lum = (0.2126 * art[i] + 0.7152 * art[i + 1] + 0.0722 * art[i + 2]) / 255;
    coverage[k] = a * Math.min(1, (1 - lum) * 1.6);
  }
  const fine = blur(coverage, w, h, 1.4), broad = blur(coverage, w, h, 5);
  const heights = Float32Array.from(fine, (v, i) => v * 0.65 + broad[i] * 0.35);
  const sample = (x, y) => heights[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  const light = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const dx = (sample(x + 1, y) - sample(x - 1, y)) * 1.8, dy = (sample(x, y + 1) - sample(x, y - 1)) * 1.8;
    light[i] = ((dx * 0.45 + dy * 0.55 + 0.705) / Math.sqrt(1 + dx * dx + dy * dy) - 0.705) * 82 - Math.max(0, broad[i] - fine[i]) * 15 - Math.max(0, sample(x - 2, y - 2) - sample(x, y)) * 9;
  }
  return { width: w, height: h, art, alpha, printed, light };
}
function finish(prepared, options) {
  const p = recipe(options), { width, height, printed, light } = prepared;
  const data = new Uint8ClampedArray(printed);
  if (p.finish !== "flat") for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) {
    const base = p.finish === "ink" ? printed[i + c] : [247, 246, 241][c] + (printed[i + c] - 255) * (p.finish === "pastel" ? 0.32 : 0);
    data[i + c] = base + light[i / 4] * (p.finish === "ink" ? 0.75 : 1);
  }
  const w = Math.round(width * p.scale / 4), h = Math.max(1, Math.round(height * p.scale / 4));
  return { data: p.scale === 4 ? data : resize(data, width, height, w, h), width: w, height: h };
}

return { VERSION, DEFAULTS, recipe, prepare, finish, resize };
};
Sticker.core = Sticker.createCore();
