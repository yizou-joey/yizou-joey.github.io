# 响应式排版参考基准

核对日期：2026-10-28。本文规定本站的设计画布和可重复测试视口，供排版分析、Figma 设计和浏览器验证使用。具体样式仍以 `css/styles.css` 为准；视觉意图仍见 `DESIGN.md`。

## 主基准

采用 2025 年的常规手机、11 英寸平板和 13 英寸笔记本作为稳定参考。选择这些型号是为了覆盖三种阅读空间，不代表访客设备占比，也不要求随每次新品发布更新基准。手机优先设计，再验证平板和桌面；极端窄屏不作为本轮设计目标。

所有尺寸均按宽 × 高排列。下表的“参考画布”用于 Figma；浏览器回归时可将相同数值设置为 CSS 视口，但这不表示真机浏览器有同样的可用高度。

| 用途 | 具体参考型号 | 参考画布 | 物理屏幕像素 | Figma 设置 |
| --- | --- | --- | --- | --- |
| 手机主基准 | iPhone 17，2025 | **402 × 874** | 1206 × 2622 | Phone → `iPhone 17` |
| 平板主基准 | iPad Air 11 英寸，M3，2025 | **820 × 1180** | 1640 × 2360 | 自定义画布；本次内置 Tablet 列表没有此项 |
| 桌面主基准 | MacBook Air 13 英寸，M4，2025；实际屏幕 13.6 英寸 | **1280 × 832** | 2560 × 1664 | Desktop → `MacBook Air` |

物理分辨率分别来自 Apple 的 [iPhone 17](https://www.apple.com/iphone-17/specs/)、[iPad Air M3](https://support.apple.com/en-us/122241) 和 [MacBook Air M4](https://support.apple.com/en-au/122209) 规格。手机和 Mac 的画布数值已在 Figma Desktop 的 Frame 菜单中直接核对。

iPad 的 820 × 1180 采用 iPad Air 的逻辑尺寸参考，与 M3 面板的 2× 配对一致。[Chromium 的 iPad Air 设备定义](https://chromium.googlesource.com/devtools/devtools-frontend/+/d86bfdc7c2178324e2717afe5b19d2ba1cd8744d%5E!/)也使用 820 × 1180、DPR 2。DPR 是设备像素比，用于表示一个 CSS 像素对应的设备像素倍率。该定义早于 M3，只作为尺寸与模拟参数的交叉证据，不作为 M3 真机实测记录。

桌面优先采用较紧凑的 1280px 宽度，以检查本站双栏布局是否仍有足够阅读空间。1280 × 832 是 Figma 画布标准，**不是对 Mac 默认显示缩放或 Safari 窗口尺寸的断言**。macOS 允许用户调整显示分辨率，浏览器窗口也可以独立调整。[Apple 显示分辨率说明](https://support.apple.com/en-gb/guide/mac-help/mchl86d72b76/mac)

## 补充验证尺寸

主基准决定布局，补充尺寸用于发现换行、横屏和容器宽度问题。不要为每个型号各写一套媒体查询。

| 验证目的 | 型号或场景 | CSS 测试视口 | Figma 对应项 |
| --- | --- | --- | --- |
| 较窄的常规手机 | iPhone 16，2024 | 393 × 852 | Phone → `iPhone 16` |
| 大屏手机 | iPhone 17 Pro Max，2025 | 440 × 956 | Phone → `iPhone 16 & 17 Pro Max` |
| 平板横屏 | 同一台 iPad Air M3 | 1180 × 820 | 将自定义画布宽高互换 |
| 较宽桌面 | MacBook Pro 14 英寸，M4，2024 | 1512 × 982 | Desktop → `MacBook Pro 14"` |

这些手机和桌面画布值已在 Figma 内置列表中核对。对应硬件规格见 [iPhone 16](https://support.apple.com/en-us/121029)、[iPhone 17 Pro Max](https://support.apple.com/en-us/125091) 和 [MacBook Pro 14 M4](https://support.apple.com/en-au/121552)。设备的年份用于固定参考对象，不用于判断布局是否进入“桌面模式”。

原先讨论的 390 × 844 可保留为 iPhone 13／14 的旧尺寸检查，但不再作为主基准。1440 × 900 不再代表当前 Mac 主基准。

## Figma 预设的适用范围

以下是 2026-10-28 在 Figma Desktop 中读取的相关预设。它是当日菜单记录，不是完整设备目录，也不是 Apple 的硬件规格表。Figma 的预设入口和使用方式见其[官方说明](https://help.figma.com/hc/en-us/articles/30974070391191-FD4B-Create-a-frame-using-frame-presets)。

| 分类 | 菜单名称 | 画布尺寸 | 本仓库的使用方式 |
| --- | --- | --- | --- |
| Phone | iPhone 17 | 402 × 874 | 主基准 |
| Phone | iPhone 16 | 393 × 852 | 常规较窄手机验证 |
| Phone | iPhone 16 & 17 Pro Max | 440 × 956 | 大屏手机验证 |
| Phone | iPhone 13 & 14 | 390 × 844 | 可选旧尺寸检查 |
| Tablet | iPad mini 8.3 | 744 × 1133 | 可选小平板检查 |
| Tablet | iPad Pro 11" | 834 × 1194 | 保留的旧款尺寸，不替代 Air M3 |
| Tablet | iPad Pro 12.9" | 1024 × 1366 | 大平板参考，不是手机布局基准 |
| Desktop | MacBook Air | 1280 × 832 | 主基准 |
| Desktop | MacBook Pro 14" | 1512 × 982 | 较宽桌面验证 |
| Desktop | MacBook Pro 16" | 1728 × 1117 | 可选大桌面检查 |
| Desktop | Desktop | 1440 × 1024 | 通用画布，不对应一个确定 Mac 型号 |
| Archive | MacBook Pro | 1440 × 900 | 归档预设，不作为当前主基准 |

**预设名称不保证对应最新一代硬件。** 例如菜单中的 iPad Pro 11" 为 834 × 1194；Apple 的 [11 英寸 iPad Pro M4](https://support.apple.com/en-au/119892) 面板是 1668 × 2420，其 2× 参考画布为 834 × 1210。需要该型号时应自定义尺寸，不能直接沿用旧预设。

## 首页布局约定

2026-10-29 确认的首页排版按 CSS 视口宽度切换，不按设备名称切换：

- **宽度不超过 899px：** 三个姓名纵向等距排列，头像与联系信息分别位于右侧两列。地址、Email、GitHub 和 Scholar 各占一行，四行等距，图标与文字保持同行。地址只显示 `Guangzhou`。
- **宽度达到 900px：** 保留桌面双栏布局。右侧头像在上，完整地址 `Guangzhou, China` 居中，三个社交链接横排在下方。
- **正文：** “Hi there :)” 与介绍正文保留原有段落结构，在移动布局中位于姓名、头像和联系信息的下方。

600px 处调整头像、姓名字号、列间距和容器宽度；地址仍显示城市名。具体数值以 `css/styles.css` 为准。

## 尺寸与验证规则

1. **区分物理像素、画布尺寸和 CSS 视口。** 物理像素用于识别硬件与资源清晰度；画布尺寸用于构图；CSS 视口用于浏览器布局。不要把高分辨率截图的像素宽度直接用作媒体查询宽度。
2. **固定浏览器测试条件。** 使用上述视口，页面缩放设为 100%。手机模拟 DPR 3，平板模拟 DPR 2；Mac 可用 DPR 2 检查资源清晰度，但不得据此反推真实桌面宽度。记录浏览器版本、视口和输入方式。
3. **单独验证真实首屏。** Figma 设备画布包含的高度不等于网页可见高度。真机需检查浏览器栏展开与收起后的状态。记录 `window.innerWidth`、`window.innerHeight` 和 `window.visualViewport` 的宽高及缩放；不要统一扣除一个猜测的工具栏高度。布局视口与可视视口的区别见 [MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)。
4. **按可用宽度决定布局。** iPad 横屏可能进入桌面式双栏，但仍是触摸输入。检查触控入口，不以屏幕宽度推断存在鼠标悬停。分屏或窗口化使用其实际视口宽度。
5. **检查断点两侧。** 修改某个断点时，至少验证断点前后各 1px。当前首页在 900px 切换布局，`js/news-scroll.js` 也使用这个值；调整时必须同步评估。设备参考尺寸不是必须采用的断点。
6. **覆盖页面与状态。** 排版改动需检查首页、项目页和 404；共享样式影响保留页面时，也检查 `publications.html` 与 `cv.html`。在主基准下检查浅色、深色及减少动态效果状态，确认没有横向溢出、文字裁切或操作入口遮挡。

更新基准时，应重新核对 Figma 菜单和具体型号规格，并记录日期。仅芯片或型号名称变化、参考尺寸不变时，无需增加重复测试项。
