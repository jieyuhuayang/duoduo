# duoduo 分析文档

对 `@openduo/duoduo` 的深度逆向分析（2026-07-01 起，持续更新）。证据基础：本机实际部署 + minified 运行时**还原为可证明等价的源码**（见 [`../reconstruction/`](../reconstruction/)）+ 活体 daemon 观测，三路交叉印证。

> **各文档的对齐版本不一致，看行号锚点前先看这里**（2026-09-07 核实）：
>
> | 文档 | 对齐版本 | 行号锚点状态 |
> |---|---|---|
> | [`AGENT_INTERNALS_ANALYSIS.md`](./AGENT_INTERNALS_ANALYSIS.md) | **v0.8.2** | 已重定向；`真名 (短名)` 式引用经 `verify_citations.mjs` 全绿 |
> | [`ARCHITECTURE_ANALYSIS.md`](./ARCHITECTURE_ANALYSIS.md) | **v0.8.2**（部分复核，范围见其头部） | 已重定向 |
> | [`DUODUO_FRAMEWORK_GUIDE.md`](./DUODUO_FRAMEWORK_GUIDE.md) | **v0.8.2** | **不含行号锚点，设计如此**：面向产品经理的入门指南，每节的证据经其附录 C 指向 `AGENT_INTERNALS_ANALYSIS.md` 的对应小节 |
> | [`AGENT_FRAMEWORKS_COMPARISON.md`](./AGENT_FRAMEWORKS_COMPARISON.md) | v0.7.1（机制叙述）/ v0.8.2（锚点） | 短名与行号随 v0.8.2 一并重定向；**机制结论本身仍停在 v0.7.1，未逐条重新验证** |
>
> 锚点为什么必须每版重定向：esbuild 每次构建重新 mangle，短名与行号都不跨版本存活；机制叙述则通常跨版本成立。两者的失效节奏不同，所以「对齐版本」这一列对同一份文档可能有两个答案。
>
> **现在由什么来保证。**文档里的每个行号都必须属于三种可校验写法之一（定义在 `reconstruction/tools/anchor_forms.mjs`），每种由一个检查器负责，三者都会失败构建：`真名 (短名)`（行号）由 `verify_citations.mjs` 按符号身份核对，符号消失或短名对不上即失败，行号漂移用 `--fix` 重生成；`短名`（行号）由 `check_doc_anchors.mjs --resolve` 核对短名在该行或包住该行；`代码片段`（行号）由 `check_bare_anchors.mjs` 核对片段里的字面量或标识符在该行，片段调用的短名也必须在该行。三个检查器在拿到与符号索引不一致的 bundle 时一律拒绝运行，它们自身由 `mutate_anchor_checks.mjs` 做变异测试。
>
> **三种写法之外的裸行号不允许出现。**v0.8.2 这一轮把存量的裸行号逐条对照代码改成了上述写法：多数行号停留在更早的版本、指向无关函数，其中二十余处区间首尾颠倒，全部已重新定位；找不到对应代码的（例如 v0.8.0 已移除的 `/undo`）删去行号。`check_bare_anchors.mjs` 按 `reconstruction/maps/bare_anchor_baseline.json` 统计每份文档的裸行号，只允许减少。仍未覆盖的是 fenced 代码块内的行号引用（如 `name:12345` 注释），它们不在任何检查器的扫描范围内。

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
