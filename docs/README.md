# duoduo 分析文档

对 `@openduo/duoduo` v0.5.8 的深度逆向分析（2026-07-01 起，持续更新）。证据基础：本机实际部署 + minified 运行时**还原为可证明等价的源码**（见 [`../reconstruction/`](../reconstruction/)）+ 活体 daemon 观测，三路交叉印证。

## 先看这张阅读地图

| 你是谁 / 你想知道什么 | 从这里开始 |
|---|---|
| **第一次接触 duoduo**，想快速建立全貌 | [FRAMEWORK_GUIDE](./DUODUO_FRAMEWORK_GUIDE.md) 的"一句话结论 + 一页总览"（15 分钟） |
| **产品经理 / 架构师**，想吃透设计思路（自我迭代、双大脑、渠道打通） | [FRAMEWORK_GUIDE](./DUODUO_FRAMEWORK_GUIDE.md) 全文（1 小时） |
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
| [DUODUO_FRAMEWORK_GUIDE.md](./DUODUO_FRAMEWORK_GUIDE.md) | 框架与思路全解（PM 深度指南） | 按四个设计问题组织：**借脑**（如何租用 Claude Code / Codex）、**立身**（一条消息的一生 + 渠道/飞书打通）、**成长**（自我迭代闭环，本文核心）、**守护**（软硬边界/失败语义/成本）；每节"结论+类比"先行，锚点后置，附十二条可搬走的设计 | 550 行 · 07-09（渠道实包核验） |
| [AGENT_INTERNALS_ANALYSIS.md](./AGENT_INTERNALS_ANALYSIS.md) | Agent 内部逻辑（逐行证据） | 8 个子系统（认知装配 / Turn-Drain / Session Actor / Spine-WAL / Gateway / Cadence-潜意识 / 记忆 / 双后端抽象）的机制主张全集，每条带 `file:line` + `confirmed/未证实推测` 置信标注，经还原源码复核与对抗验证 | 1180 行 · 07-08 复核 |
| [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) | 系统 / 部署级 | 项目定位、六大创新的实测印证、进程与文件系统模型、崩溃恢复实证、可观测性、可复现的本机部署记录与验证清单 | 343 行 · 07-01（07-09 复核更新） |
| [AGENT_FRAMEWORKS_COMPARISON.md](./AGENT_FRAMEWORKS_COMPARISON.md) | 跨项目对比调研 | duoduo vs hermes-agent vs pi：设计哲学、十维度对比、优劣总评，及面向"贝叶斯 + 自我迭代 + long-horizon 金融预测 agent"的融合架构与落地路线 | 325 行 · 07-03 |
| [SOURCE_RECONSTRUCTION.md](./SOURCE_RECONSTRUCTION.md) | 源码还原方法论 | 反混淆 → 字节无损拆包 → 从 esbuild `__export` 恢复 702 个真名 → 作用域安全改名 → 47 万节点 AST 全等 + 隔离实启双重证明；方法可迁移到任何 esbuild 产物 | 72 行 · 07-02 |

## 关键结论一句话

duoduo 是一个"薄运行时 + 基础模型"的长驻自治 Agent：运行时只拥有模型拥不住的东西——**持久化、生命周期、调度、并发**，推理全部委派给租来的 agentic harness（Claude Code / Codex）。其"智能可持久、会成长"由三件事兑现：**append-before-execute 的文件 WAL**（一切状态可信可重建）、**双注入面提示词装配**（稳定认知吃缓存、易变状态进瞬时块）、**cadence 潜意识把经验蒸馏回广播板**（成长的每一步都是 kernel git 仓库里可回滚的 commit）。

## 证据与可信度约定（全部文档通用）

- 行号锚点默认指 `daemon.pretty.js`（与还原源码 `reconstruction/recon/daemon.recon.js` 行号一致，偶有 ±2 漂移）；`cli:`/`stdio:` 前缀者指对应 bundle。
- 机制主张分 `confirmed`（源码/活体可证）与 `未证实推测`（显式标注）两档；各文档随每轮复核**直接更新为当前正确内容**（最近一轮：2026-07-02 还原源码逐节复核 + 2026-07-09 全库整理）。
- 提示词类结论引用磁盘原文路径；部署类结论以活体 daemon 实测为准。
