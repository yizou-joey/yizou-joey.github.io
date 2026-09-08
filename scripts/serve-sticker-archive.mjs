import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve(".local/sticker-study-archive");
try { await fs.access(path.join(root, "index.html")); }
catch { console.error("本地档案不存在：.local/sticker-study-archive/。正常开发与构建不需要此档案。"); process.exit(1); }
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".md": "text/plain; charset=utf-8" };
const server = http.createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const requested = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = await fs.realpath(path.resolve(root, `.${requested === "/" ? "/index.html" : requested}`));
    if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403); res.end(); return; }
    const bytes = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch { res.writeHead(404); res.end("Not found"); }
});
server.on("error", (error) => { console.error(`档案服务无法启动：${error.message}`); process.exitCode = 1; });
server.listen(5175, "127.0.0.1", () => console.log("本地研究档案：http://127.0.0.1:5175（不会部署或上传）"));
