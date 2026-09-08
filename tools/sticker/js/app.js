(() => {
"use strict";
const { recipe } = Sticker.core;
const { inspectInput } = Sticker;
const $ = (id) => document.getElementById(id);
const names = { flat: "平面贴纸", ink: "原色浮雕", blind: "同色盲压凸", pastel: "淡彩压花" };
for (const [name, title] of Object.entries(names)) {
  const figure = document.createElement("figure"), image = document.createElement("img"), caption = document.createElement("figcaption");
  image.id = `variant-${name}`; image.hidden = true; image.width = 100; image.alt = title;
  caption.textContent = title; figure.append(image, caption); $("sticker-comparison").append(figure);
}
for (const [i, title] of ["透明原图", "平滑白底", "图案起伏", "最终成品"].entries()) {
  const figure = document.createElement("figure"), image = document.createElement("img"), caption = document.createElement("figcaption");
  image.id = `stage-${i}`; image.hidden = true; image.width = 100; image.alt = title;
  caption.textContent = `0${i + 1} / ${title}`; figure.append(image, caption); $("workshop-stages").append(figure);
}
let source, sourceId = 0, currentId = 0, loadingId = 0, busy = false, queued, outputBlob, currentRecipe, sourceName = "sticker", recolor = null;
let objectUrls = [];
let worker, workerUrl, compatible = false;
const processLocally = Sticker.createProcessor(Sticker.core);
function workerFailed() {
  if (worker) worker.terminate();
  worker = null; busy = false;
  invalidate();
  $("compatibility").hidden = false;
  $("workshop-status").textContent = "无法启动后台计算。可选择兼容模式；大图计算期间页面可能暂时卡顿。";
}
function bootstrap(coreFactory, processorFactory) {
  const process = processorFactory(coreFactory());
  self.onmessage = ({ data: job }) => {
    try { self.postMessage(process(job)); }
    catch (error) { self.postMessage({ id: job.id, error: error.message }); }
  };
}
try {
  workerUrl = URL.createObjectURL(new Blob([`(${bootstrap.toString()})(${Sticker.createCore.toString()}, ${Sticker.createProcessor.toString()});`], { type: "text/javascript" }));
  worker = new Worker(workerUrl);
  worker.onmessage = ({ data }) => receive(data);
  worker.onerror = workerFailed;
} catch { workerFailed(); }
$("compatibility").addEventListener("click", () => {
  compatible = true; $("compatibility").hidden = true; schedule();
});
window.addEventListener("pagehide", (event) => { if (event.persisted) return; if (worker) worker.terminate(); if (workerUrl) URL.revokeObjectURL(workerUrl); objectUrls.forEach((url) => URL.revokeObjectURL(url)); });

function invalidate() {
  currentId++;
  $("download-image").disabled = true; $("download-recipe").disabled = true;
  outputBlob = null;
}
function settings() { return recipe({ finish: $("finish").value, border: Number($("border").value), displayWidth: Number($("display-width").value), scale: Number($("export-scale").value), recolor }); }
function schedule() {
  invalidate(); queued = null;
  if (!source) return;
  try {
    queued = { id: currentId, source, sourceId, options: settings(), format: $("format").value };
    $("workshop-status").textContent = "正在生成… 完成后即可下载最新结果。";
    dispatch();
  } catch (error) { $("workshop-status").textContent = error.message; }
}
function dispatch() {
  if (busy || !queued) return;
  if (!worker && !compatible) { workerFailed(); return; }
  const job = queued; queued = null; busy = true;
  currentRecipe = job.options;
  if (compatible) {
    $("workshop-status").textContent = "兼容模式计算中… 大图可能使页面暂时卡顿。";
    setTimeout(() => {
      if (job.id !== currentId) { busy = false; dispatch(); return; }
      try { receive(processLocally(job)); } catch (error) { receive({ id: job.id, error: error.message }); }
    }, 30);
  } else {
    try { worker.postMessage(job); } catch { workerFailed(); }
  }
}
async function receive(data) {
  if (data.id !== currentId) { busy = false; dispatch(); return; }
  try {
    if (!data.error) {
      const type = $("format").value;
      const encode = (pixels) => new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas"); canvas.width = pixels.width; canvas.height = pixels.height;
        canvas.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height), 0, 0);
        canvas.toBlob((blob) => {
          if (!blob || blob.type !== type) reject(new Error("此浏览器不支持所选编码，请选择 PNG。"));
          else resolve(blob);
        }, type, 0.95);
      });
      for (const name of Object.keys(data.variants)) data.variants[name] = await encode(data.variants[name]);
      data.stages = await Promise.all(data.stages.map(encode));
    }
  } catch (error) { data.error = error.message; }
  busy = false;
  if (data.id !== currentId) { dispatch(); return; }
  if (data.error) { $("workshop-status").textContent = data.error; return; }
  for (const url of objectUrls) URL.revokeObjectURL(url);
  objectUrls = [];
  const urlFor = (blob) => { const url = URL.createObjectURL(blob); objectUrls.push(url); return url; };
  const urls = Object.fromEntries(Object.entries(data.variants).map(([key, blob]) => [key, urlFor(blob)]));
  const width = currentRecipe.displayWidth + 20;
  const show = (id, url) => { const image = $(id); image.src = url; image.width = width; image.hidden = false; };
  for (const key of Object.keys(names)) show(`variant-${key}`, urls[key]);
  data.stages.forEach((blob, i) => show(`stage-${i}`, urlFor(blob)));
  show("original-image", $("stage-0").src);
  show("result-image", urls[currentRecipe.finish]); show("context-image", urls[currentRecipe.finish]); show("stage-3", urls[currentRecipe.finish]);
  outputBlob = data.variants[currentRecipe.finish];
  $("output-details").textContent = `${data.width} × ${data.height}px · ${(outputBlob.size / 1024).toFixed(1)}KB · 显示宽度 ${width}px · 不含页面阴影`;
  $("workshop-status").textContent = "已生成。预览与下载使用同一份编码图片。";
  $("download-image").disabled = false; $("download-recipe").disabled = false;
}
async function load(blob, name, color = null) {
  const id = ++loadingId; source = null; queued = null; invalidate();
  $("workshop-status").textContent = "正在读取图片…";
  try {
    if (blob.size > 20 * 1024 * 1024) throw new Error("图片超过 20MB，请使用较小的原图。");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const type = inspectInput(bytes);
    const bitmap = await createImageBitmap(new Blob([bytes], { type }));
    try {
      if (bitmap.width * bitmap.height > 16000000) throw new Error("图片超过 1600 万像素，请先缩小。");
      const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true }); context.drawImage(bitmap, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      if (id !== loadingId) return;
      source = { data, width: canvas.width, height: canvas.height }; sourceId++; sourceName = name.replace(/\.[^.]+$/, ""); recolor = color;
      let transparent = false; for (let i = 3; i < data.length; i += 4) if (data[i] < 255) { transparent = true; break; }
      $("source-details").textContent = `${name} · ${canvas.width} × ${canvas.height}px。${transparent ? "保留原始透明区域；不自动去除已有白边。" : "未检测到透明背景，将按矩形底形生成；不会自动抠图。"}${color !== null ? " 此内置示例明确使用中性灰重着色。" : " 保留原图配色。"}`;
      schedule();
    } finally { bitmap.close(); }
  } catch (error) { if (id === loadingId) $("workshop-status").textContent = error.message || "图片读取失败，请重新选择。"; }
}
$("file-input").addEventListener("change", (event) => { if (event.target.files[0]) load(event.target.files[0], event.target.files[0].name); event.target.value = ""; });
const drop = $("drop-zone");
for (const name of ["dragenter", "dragover"]) drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add("is-dragging"); });
for (const name of ["dragleave", "drop"]) drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.remove("is-dragging"); });
drop.addEventListener("drop", (event) => { if (event.dataTransfer.files.length !== 1) { $("workshop-status").textContent = "请一次选择一张图片。"; return; } const file = event.dataTransfer.files[0]; load(file, file.name); });
document.querySelectorAll("[data-example]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.example;
    try {
      const bytes = Uint8Array.from(atob(Sticker.examples[id]), (character) => character.charCodeAt(0));
      load(new Blob([bytes], { type: "image/png" }), `${id}.png`);
    } catch {
      loadingId++; source = null; queued = null; invalidate();
      $("workshop-status").textContent = "示例读取失败，请选择本地图片。";
    }
  });
});
$("workshop-controls").addEventListener("submit", (event) => event.preventDefault());
$("workshop-controls").addEventListener("input", schedule);
for (const [id, key] of [["background", "background"], ["view-scale", "scale"], ["contact-shadow", "shadow"]]) $(id).addEventListener("change", () => {
  $("workshop-board").dataset[key] = id === "contact-shadow" ? ($("contact-shadow").checked ? "on" : "off") : $(id).value;
});
function download(blob, filename) {
  const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("download-image").addEventListener("click", () => { if (outputBlob) download(outputBlob, `${sourceName}-${currentRecipe.finish}-${currentRecipe.border}px.${outputBlob.type === "image/webp" ? "webp" : "png"}`); });
$("download-recipe").addEventListener("click", () => { if (outputBlob) download(new Blob([JSON.stringify(currentRecipe, null, 2) + "\n"], { type: "application/json" }), `${sourceName}-recipe.json`); });

})();
