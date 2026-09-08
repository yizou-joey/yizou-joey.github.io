# 贴纸工具入口已迁移

独立工具位于 [tools/sticker](../tools/sticker/README.md)，双击其中的 `index.html` 使用。无需主站 Vite、构建、Node 或安装依赖。旧根目录入口已经移除。

历史研究见 [研究记录](sticker-study-history.md)；完整冻结档案继续保存在 `.local/`，不随主站部署。

## 正式网站素材

`npm run optimize:images` 复用 `tools/sticker/js/core.js` 的默认配方（ink、4px 白边、80px 原图画布、4×），生成三张无损 WebP 到 `public/files/generated/logos/`。VR 水獭和字标使用工具内的透明原图；MMSys 使用现有透明原图，并保留中性灰 `recolor: 90`。不再压缩历史烘焙贴纸作为正式素材，也不在网页运行生成算法。

News 的每一行包含正文 article 和同级 sticker。桌面正文最长 264px，贴纸位于正文右边界至顶部 About 右边界之间；窄屏保留独立右栏并缩小贴纸。滚动区域没有负边距外溢。

桌面内部滚动时，贴纸显示在独立固定图层。100ms 旧图淡出后，新图使用一段 250ms easeOutBack 轨迹（`cubic-bezier(0.34, 1.56, 0.64, 1)`，来源 easings.net / postcss-easings）进入、轻微过冲并归位，不设旧第三级峰值，也不拼接独立回落。125ms 淡入与回弹并行。总计约 350ms，属于低频、非阻塞装饰反馈；正文与按钮立即响应。

只有静止和链接关联两种持续状态。链接关联保留 1.08 倍与轻微抬升；换贴途中关联变化从当前姿态重定向，快速切换仅保留最终目标。贴纸本身不响应 hover。键盘换图与焦点关联直接呈现；减少动态效果仅淡变。阴影固定，动画只改变 transform / opacity。移动端和无需内部滚动时保留逐条静态贴纸。
