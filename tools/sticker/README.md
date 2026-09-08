# 独立贴纸工具

双击 `index.html`，选择或拖入静态 PNG、WebP、JPEG 即可生成。将本目录整体复制到其他位置也可使用。无需 Vite、Node、依赖安装或构建；没有远程脚本、字体或图片服务。

## 使用

默认原色浮雕、4px 白边、80px 图案画布宽度、4× PNG。支持平面、盲压凸、淡彩；3/4/5px 白边；40–320px 显示宽度；1/2/4× 导出。PNG/WebP 图片与参数 JSON 均由浏览器下载。背景、2× 检视、接触阴影不进入导出。

双击（file 协议）及 HTTP 模式均可点击示例直接生成。`js/examples.js` 保存两张原图的 Base64 字节，点击后转成 Blob 并复用上传流程，不 fetch 磁盘、不请求权限、不跳转页面。所有效果仍即时计算，HTML 不内嵌图片。`examples/` 保留可查看的原始 PNG；独立数据脚本是它们的离线副本，测试逐字节核对一致性。

输入限制仍为 20MB、1600 万像素；SVG、动画、批量暂不支持。保留源图透明留空，不自动去白、抠图、移除已有白边或重着色。无透明背景会得到矩形底形。

原图显示宽度不等于成品画布宽度：左右各保留 10px，所以 80px 图案的成品应显示为 100px；4× 导出宽度为 400px。

后台运算使用 Blob Worker。若浏览器阻止 Worker，会显示“使用兼容模式”；选择后在主线程用同一算法运算，大图可能使页面暂时卡顿。编码使用页面 Canvas，无需 OffscreenCanvas；浏览器不支持所选编码时会提示切换 PNG。

## 文件与接口

- `js/core.js`：唯一的纯像素算法工厂 `Sticker.createCore()`；`Sticker.core` 提供 `recipe`、`prepare`、`finish`。无 DOM、文件操作或素材依赖。
- `js/input.js`：输入类型校验；`js/processor.js`：各效果及过程图组合。
- `js/app.js`：读取文件、Blob Worker、显式兼容模式、Canvas 编码、交互与下载。
- `styles.css`：仅工具样式与基础变量，不加载主站 CSS。
- `notes.html`：轻量研究说明；历史图片不在本目录。

`sticker-1` 配方及算法保持原样。Worker 将同一份工厂函数序列化，Node 适配器在独立 VM 中加载同一脚本，不维护另一份算法。预览直接显示编码后的下载 Blob。

## 可选维护命令

以下命令在仓库根目录执行，使用已有 Node/Sharp，普通使用者不需要：

```sh
npm run check:stickers
npm run preview:stickers -- input.png recipe.json output.png
npm run preview:stickers -- input.png recipe.json output.webp
```

无参数导出命令只显示用法。测试图片在临时目录生成并自动清理。主站 `npm run check` 不执行贴纸测试；Vite 不构建或部署此目录。浏览器 WebP quality=0.95，CLI WebP 为无损编码，文件字节不要求相同。

## 原图与历史

两张原图来自 Figma「IEEE VR 2026 Materials」（oGMMFTLlcVp0yggE4grSiK）：水獭节点 55:2，字标节点 102:68。PNG 与离线示例脚本保存相同原图字节，不含后加的贴纸底层。

MMSys 不作为本工具必需素材。仓库原图为 `public/files/logos/MMSys 26 Logo.png`，可以手动上传；此前中性灰版本属于特定研究试样，不是上传默认效果。离线回归测试会在仓库中使用该原图。

完整冻结档案留在仓库 `.local/sticker-study-archive/`，可用 `npm run archive:stickers` 查看。它不参与发布，本地保存不等于异地备份。

## 本轮验证与限制

主站 `npm run check` 与独立 `npm run check:stickers` 通过。独立测试含序列化 Worker 工厂与兼容处理器像素一致性、原图保持、参数重放、PNG/WebP 编码，以及 HTML 相对资源检查。普通 Python 静态服务器下的子目录访问、Blob Worker、PNG/WebP、快速切换与下载按钮已验证；桌面和 390px 视口无横向溢出。

浏览器自动化安全策略禁止访问 `file://`，所以本轮不能自动完成双击打开及该模式下的原生文件选择/拖放端到端验证；没有以其他浏览器或命令绕过此限制。示例在所有模式下均不执行 fetch，普通脚本和相对路径已检查。兼容模式计算与 Worker 一致性通过测试，未人工触发浏览器阻止 Worker 的场景。
