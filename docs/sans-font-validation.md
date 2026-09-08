# Sans-serif 字体适配验证

## 实现

Apple 原生字体优先；其他平台通过 `Site Inter` 加载官方 Inter 4.1 直立体可变 WOFF2。资源来源、许可证与 SHA-256 位于 `public/files/fonts/inter-v4.1/`。保留现有 sans 字号、字重、行高，仅调整方案指定字距。

`--font-sans` 与 Tailwind 的变量同名，因此在 CSS 入口固定原有 `--default-font-family` 值，避免改变未显式指定字体的文字。

## 已验证

- `npm run check`：通过，包含生产构建、静态内容和本地引用检查。
- `git diff --check`：通过。
- 源文件与 dist 中的 WOFF2 SHA-256 一致。
- Mac Chrome：首页、404、开发环境 publications 在 1440、390、320 CSS px 宽度检查；文档宽度均不超出视口。
- 浏览器 200% 缩放：三页已检查；首页与 404 文档宽度不超出视口。
- DevTools Rendered Fonts：404 分类文字原生路径为 `.SF NS`，14 个字符来自本地字体。正常路径的 Inter 资源请求为空，字体状态为 unloaded。
- 仅在 DevTools 临时将 sans 变量改为 Inter 后：字体加载成功，Rendered Fonts 为 `Inter Variable` / `InterVariable-SemiBold`，14 个字符来自 Network resource。重新加载页面后覆盖已移除。这是 Mac 本机对照，不是其他平台验证。
- DevTools 模拟 reduced motion：404 分类动画时长为 0s；三页文字显示已检查。
- 默认字体隔离后，根元素计算字体仍为原来的 `ui-sans-serif, system-ui, sans-serif` 及原有 emoji 后备。
- 修改前首页桌面截图、修改后三页不同宽度截图及字体对照证据记录在本次任务的浏览器工具输出中；未新增生产截图页面。

## 限制与待验证

- macOS Safari、iOS Safari、Windows Chrome/Edge/Firefox、Android Chrome、Linux Chrome 未实测；不以 Mac 模拟视口替代这些测试。
- 尚未完成受控慢速字体请求、字体请求失败及冷/热缓存对照。`font-display: swap` 与后备字体栈已实现，但这些加载场景不计作已验收。
- 尚未形成各页面 SF/Inter 的完整行数与换行对照矩阵。
- publications 当前开发页面只有框架，没有论文列表内容；只验证可见导航和栏目文字。生产构建仍仅包含首页与 404。

## 复验方法

在对应操作系统打开页面，以 Rendered Fonts 确认真实字体；检查 Network 中版本固定的同源字体请求。非 Apple 平台阻断字体请求时文字应持续可读，恢复请求后应使用 Inter。使用相同内容及宽度对比换行，允许自然换行差异，但不允许重叠、裁切或横向溢出。
