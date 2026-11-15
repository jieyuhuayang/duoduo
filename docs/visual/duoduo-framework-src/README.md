# duoduo 运作原理（可视化页面）源码

`../duoduo-framework.html` 是由这个目录构建出的单文件页面，内容依据 `docs/DUODUO_FRAMEWORK_GUIDE.md`，对齐 v0.8.8。不要直接修改 `../duoduo-framework.html`：修改 `src/` 后重新构建。

## 构建

```bash
npm ci
npm run build      # vite build，然后 assemble.mjs 把 CSS 和 JS 内联进 ../duoduo-framework.html
```

`assemble.mjs` 输出的是 HTML 片段，没有 `<!doctype>`、`<html>`、`<head>`、`<body>`，Artifact 工具在发布时补上这些标签。本地预览用 `npm run dev`，或者运行 `node assemble.mjs ../duoduo-framework.html preview.html` 生成带完整外壳的 `preview.html`。

## 文件

| 文件 | 内容 |
|---|---|
| `src/App.tsx` | 目录和全部章节正文；数组 `D` 定义六个推导 |
| `src/figs.tsx` | 8 张内联 SVG 图 |
| `src/widgets.tsx` | 交互部件（引擎对照、消息六步、提示词装配、心跳模拟、纠正变成记忆、术语表） |
| `src/ui.tsx` | 各章共用的版式组件（推导条、对照表、代码/模型分工、代价、可展开细节、步进器） |
| `src/index.css` | 全部样式和主题 token（浅色、深色、跟随系统三种状态） |

## 颜色含义

蓝色表示代码做的确定性工作，琥珀色表示模型做的判断，绿色表示磁盘上的文件，红色表示缺口和代价。全文的图和表都按这个含义使用颜色。
