# duoduo 分析文档

对 `@openduo/duoduo` 的深度逆向分析（2026-07-01 起，持续更新）。证据基础：本机实际部署 + minified 运行时**还原为可证明等价的源码**（见 [`../reconstruction/`](../reconstruction/)）+ 活体 daemon 观测，三路交叉印证。

> **各文档的对齐版本**（2026-09-24 核实）：
>
> | 文档 | 对齐版本 | 引用状态 |
> |---|---|---|
> | [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md) | **v0.8.3** | 已重定向，所有检查全绿；仍带存量行号，逐步改为按名引用 |
> | [`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md) | **v0.8.3**（部分复核，范围见其头部） | 已重定向 |
> | [`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md) | **v0.8.3** | **不含代码引用，设计如此**：面向产品经理的入门指南，每节的证据经其附录 C 指向 `AGENT_INTERNALS_ANALYSIS.md` 的对应小节 |
> | [`AGENT_FRAMEWORKS_COMPARISON.md`](./AGENT_FRAMEWORKS_COMPARISON.md) | v0.7.1（机制叙述）/ v0.8.3（引用） | 短名随版本重定向；**机制结论本身仍停在 v0.7.1，未逐条重新验证** |
>
> **引用按名字写，不写行号。**esbuild 每次构建重新 mangle、格式化器重新断行，行号几乎每版都整体移动：v0.8.3 这一轮有约两百处行号无法重新定位，只能删掉。真名来自 esbuild 的 `__export` 表，跨版本不变；它在哪一行由符号索引 `reconstruction/maps/symbols_*.json` 和 `reconstruction/first-party/` 给出，文档不用重复。两种写法，都由构建检查（定义在 `reconstruction/tools/anchor_forms.mjs`）：
>
> - `` `真名 (短名)` ``，不带行号：`verify_citations.mjs` 核对真名仍存在、短名仍是它的 mangled 名，任一不成立即失败。短名保留是为了方便在 pretty bundle 里搜索，升级时由 `retarget_symbols.mjs` 更新。
> - `` `代码片段`（`真名`） ``：表示"这句代码就是证据"。`check_bare_anchors.mjs` 要求片段里有辨识度的字面量或标识符、以及片段调用的每个短名，都落在该真名当前的函数体内。优先引用字符串字面量，它们跨版本基本不变。
>
> 没有真名的函数，先在 `reconstruction/maps/inferred_daemon.json` 登记一个推断名，再按第一种写法引用；只写裸短名无法被任何检查核对，而且下一版可能指向完全不同的函数（v0.8.3 就把 `AXe`、`UEe`、`WEe` 复用给了别的代码）。
>
> **存量行号只减不增。**旧的 `真名 (短名)`（行号）、`短名`（行号）、`代码片段`（行号）三种写法在删掉之前仍逐条检查；三种写法之外的裸行号一律不允许。`reconstruction/maps/bare_anchor_baseline.json` 给每份文档记两个上限：全部行号的数量（`lineNumbers`）和裸行号的数量（`unbound`，保持为 0）。任何新增行号——包括写法正确的——都会让构建失败。改到带行号的段落时，顺手改成上面两种写法，并用 `check_bare_anchors.mjs --write-baseline` 把上限调低；该命令拒绝调高上限。

## 先看这张阅读地图

| 你是谁 / 你想知道什么 | 从这里开始 |
|---|---|
| **第一次接触 duoduo**，想快速建立全貌 | [FRAMEWORK_GUIDE](./DUODUO_FRAMEWORK_GUIDE.md) 第 0 节（一句话结论、"模型缺什么运行时补什么"、术语表）加各部分开头的关键句（15 分钟） |
| **产品经理 / 架构师**，想吃透设计思路（自我迭代、四个推理引擎、渠道打通） | [FRAMEWORK_GUIDE](./DUODUO_FRAMEWORK_GUIDE.md) 全文（1 小时） |
| **工程师**，要逐机制核对证据（行号、字面量、置信度） | [AGENT_INTERNALS_ANALYSIS](./AGENT_INTERNALS_ANALYSIS.md)（8 子系统证据文档） |
| **要实际部署 / 运维**它 | [ARCHITECTURE_ANALYSIS](./ARCHITECTURE_ANALYSIS.md)（含可复现部署记录与坑） |
| **做技术选型**，比较 duoduo / hermes-agent / pi | [AGENT_FRAMEWORKS_COMPARISON](./AGENT_FRAMEWORKS_COMPARISON.md)（含融合架构建议） |
| 想知道**闭源 minified 代码怎么被还原成可信源码** | [SOURCE_RECONSTRUCTION](./SOURCE_RECONSTRUCTION.md)（方法论，可迁移） |

## 五篇文档的关系

```
                     SOURCE_RECONSTRUCTION（方法论：minified → 可证明等价的可读源码）
                                    │ 提供证据基础
            ┌───────────────────────┼────────────────────────┐
            ▼                       ▼                        ▼
  FRAMEWORK_GUIDE          AGENT_INTERNALS           ARCHITECTURE
  按设计问题组织的入门+深钻   按子系统组织的逐行证据文档    系统/部署级视角 + 活体实测
  （PM 友好，结论先行）  ◀──互为详略──▶（工程师复核用）      （怎么装、怎么运维）
            └───────────────────────┬────────────────────────┘
                                    ▼ 三篇共同支撑
                     FRAMEWORKS_COMPARISON（跨项目对比与选型 / 融合架构建议）
```

## 文档清单

| 文档 | 视角 | 一句话 | 规模/鲜度 |
|------|------|--------|----------|
| [DUODUO_FRAMEWORK_GUIDE.md](./DUODUO_FRAMEWORK_GUIDE.md) | 框架指南（写给产品经理） | 从"模型缺什么、运行时补什么"出发，按四个问题组织：**推理引擎**（Claude Code / Codex / Grok / pi 怎么接、怎么共用一份提示词）、**消息处理**（一条消息的处理流程 + 渠道 + 定时任务）、**自我迭代**（记忆流水线、边界、升级解耦，本文核心）、**边界、成本与失败**（硬边界清单、成本控制、失败语义表）；结论先行、不写行号、不用比喻，附十二条可复用的设计与 v0.7.1→v0.8.1 变化表 | 873 行 · 2026-09-10 重写，对齐 v0.8.1 |
| [AGENT_INTERNALS_ANALYSIS.md](./AGENT_INTERNALS_ANALYSIS.md) | Agent 内部逻辑（逐行证据） | 8 个子系统（认知装配 / Turn-Drain / Session Actor / Spine-WAL / Gateway / Cadence-潜意识 / 记忆 / 双后端抽象）的机制主张全集，每条带 `file:line` + `confirmed/未证实推测` 置信标注，经还原源码复核与对抗验证 | 1221 行 · 07-29 对齐 v0.6.2 |
| [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) | 系统 / 部署级 | 项目定位、六大创新的实测印证、进程与文件系统模型、崩溃恢复实证、可观测性、可复现的本机部署记录与验证清单 | 356 行 · 07-01（07-29 复核更新） |
| [AGENT_FRAMEWORKS_COMPARISON.md](./AGENT_FRAMEWORKS_COMPARISON.md) | 跨项目对比调研 | duoduo vs hermes-agent vs pi：设计哲学、十维度对比、优劣总评，及面向"贝叶斯 + 自我迭代 + long-horizon 金融预测 agent"的融合架构与落地路线 | 325 行 · 07-03 |
| [SOURCE_RECONSTRUCTION.md](./SOURCE_RECONSTRUCTION.md) | 源码还原方法论 | 反混淆 → 字节无损拆包 → 按 `__export` 块恢复真名并逐模块判定归属 → 作用域安全改名 → AST 全等 + 隔离实启双重证明 → 建符号索引让文档引用按身份而非行号自我维护；外加跨版本身份承接（跟随上游发版）；方法可迁移到任何 esbuild 产物 | 2026-09-10 随流水线重构更新 |

## 关键结论一句话

duoduo 是一个"薄运行时 + 基础模型"的长驻自治 Agent：运行时只拥有模型拥不住的东西——**持久化、生命周期、调度、并发**，推理全部委派给租来的 agentic harness（Claude Code / Codex / Grok / pi）。其"智能可持久、会成长"由三件事兑现：**append-before-execute 的文件 WAL**（一切状态可信可重建）、**双注入面提示词装配**（稳定认知吃缓存、易变状态进瞬时块）、**cadence 潜意识把经验蒸馏回广播板**（成长的每一步都是 kernel git 仓库里可回滚的 commit）。

## 证据与可信度约定（全部文档通用）

- 行号锚点默认指 `daemon.pretty.js`（与还原源码 `reconstruction/recon/daemon.recon.js` 行号一致，偶有 ±2 漂移）；`cli:`/`stdio:` 前缀者指对应 bundle。**锚点与短名都随上游每次发版整体漂移**——esbuild 每次构建重新 mangle，同一个短名在相邻两版可能指向完全不同的函数（实例见 SOURCE_RECONSTRUCTION 论点四）。因此引用本库结论时务必确认文档头部标注的版本，跨版本的短名一律不可直接沿用。
- 机制主张分 `confirmed`（源码/活体可证）与 `未证实推测`（显式标注）两档；各文档随每轮复核**直接更新为当前正确内容**，不留修订史（最近一轮：2026-07-29 随上游 v0.6.2 全库锚点迁移 + 逐条复核）。
- 提示词类结论引用磁盘原文路径；部署类结论以活体 daemon 实测为准。
