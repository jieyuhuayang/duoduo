# 给上游的请求草稿：随 npm 包发布 source map 或开启 keepNames

这是 `docs/RECONSTRUCTION_EFFICIENCY_RESEARCH.md` 第 8 节建议 9 的落实：一份可以直接提交到 `openduo/duoduo` 的 issue 文本。它没有被提交；是否提交、以谁的名义提交由仓库所有者决定。请求的依据在调研报告第 7 节：esbuild 的短名由使用频次名次与整个 bundle 的字符频率决定，每次发版几乎全部重排；`keepNames` 会在产物里留下每个具名函数与类的原名；`sourcemap` 取 `external` 并关闭 `sourcesContent` 时，`.map` 文件只含文件路径与标识符原名，不含源码；mangle cache 只覆盖属性名，对下游无用，所以不索要。本仓库在 v0.8.7 的出厂 bundle 上核实过：没有 `keepNames` 的 helper。

以下为 issue 正文（英文，上游仓库的语言）。

---

**Title:** Ship an external source map (names only) or build with `keepNames`, so the published bundle stays analysable across releases

**Body:**

The license deliberately allows users and their agents to de-minify, debug and patch the published bundle (`LICENSE.agents.yaml`). In practice that work is much harder than it needs to be, for one reason: esbuild re-mangles every identifier on every build. Minified names are assigned by use-count rank and the alphabet is reshuffled by character frequency, so any change anywhere in the bundle renames most top-level declarations. A reader who has worked out what a function does in one release has to re-locate it in the next one by structure and string literals; our reconstruction tooling automates about 95% of that, but the remaining names cost a manual pass on each release, and local variable names are lost entirely.

Two build-side options would remove that cost without exposing source code. Either one is enough; the first is the more complete.

1. **Publish an external source map without source content.** `sourcemap: "external"` plus `sourcesContent: false` writes a `.map` file that carries only the original file paths and the `names` array (the original identifier for every mangled one), not a single line of source. Shipping it next to `daemon.js` and `cli.js` in `dist/release` (or as a separate `*.map` artifact of the release) gives readable stack traces in bug reports, lets DevTools show original names, and makes every release diffable by name. If the file paths are considered sensitive, a map with `sources` rewritten to opaque ids is still useful.

2. **Build with `keepNames: true`.** esbuild then wraps each renamed function and class declaration in its `__name` helper, which sets the `name` property to the original identifier. The original name of every named function and class becomes a string literal in the bundle; `Function.prototype.name` and error stack frames report the real names at run time, which also helps anyone reading a crash log. The cost is one `defineProperty` per declaration at module load and a small size increase; constants and anonymous arrows are not covered.

What we are not asking for: `--mangle-cache` (it only covers property names, which the current build does not mangle) and the source itself.

For context, Mojang has published obfuscation mappings for every Minecraft release since 1.14 for the same reasons: readable crash reports and a third-party ecosystem that does not break on every build. A names-only source map is the JavaScript equivalent and costs nothing at run time.

Happy to send a PR for the build config if that helps; the change is a few lines in the esbuild options.
