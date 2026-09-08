(() => {
"use strict";
function animated(bytes, type) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (start, n) => String.fromCharCode(...bytes.subarray(start, start + n));
  if (type === "image/png") {
    for (let p = 8; p + 12 <= bytes.length;) {
      if (text(p + 4, 4) === "acTL") return true;
      const n = view.getUint32(p); p += n + 12;
    }
  }
  if (type === "image/webp") {
    for (let p = 12; p + 8 <= bytes.length;) {
      if (["ANIM", "ANMF"].includes(text(p, 4))) return true;
      const n = view.getUint32(p + 4, true); p += 8 + n + (n % 2);
    }
  }
  return false;
}
function inspectInput(bytes) {
  if (bytes.length > 20 * 1024 * 1024) throw new Error("图片超过 20MB，请使用较小的原图。");
  const sig = (...values) => values.every((v, i) => bytes[i] === v);
  const type = sig(137, 80, 78, 71, 13, 10, 26, 10) ? "image/png" : sig(255, 216, 255) ? "image/jpeg" : sig(82, 73, 70, 70) && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP" ? "image/webp" : "";
  if (!type) throw new Error("请选择静态 PNG、WebP 或 JPEG 图片。SVG 与其他格式暂不支持。");
  if (animated(bytes, type)) throw new Error("暂不支持动画图片，请导出单帧后重试。");
  return type;
}

Sticker.inspectInput = inspectInput;
})();
