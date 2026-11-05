# 源码还原效率调研：可借鉴的思路、方法与工具

**调研对象是本仓库 `reconstruction/` 的两个痛点：源码无法精确还原（大量内部符号、局部变量和内层闭包只有推断名或短名，TypeScript 类型丢失），以及上游每次发版都要重新锚定推断名、重新定位文档引用。结论是：互联网上没有一个现成工具能同时解决这两个痛点，但五个方向各有可以直接搬进现有流水线的部件。最值得做的三件事依次是：把推断名的主键从 mangled 短名改为内容派生的持久 ID（Quilt Hashed Mojmap 与 Hex-Rays Lumina 的做法），让升级时只对齐改动过的声明；把再锚定的候选打分改成"从已接受匹配出发沿调用图迭代传播、按引用稀有度加权、双阈值接受否则弃权"（BinDiff、Ghidra Version Tracking、FabricMC Matcher 共有的做法）；把 LLM 命名限定为"只提名字、按作用域分组、沿调用图传播、以作者自有词表约束"，并先建一套以已知真名为 ground truth 的命名评测。向上游请求随 npm 包发布不含源码的 source map 或开启 `keepNames`，是唯一能从根本上消除痛点二的途径，但它是协作问题而不是技术问题，应与上面三件事并行。**

调研分两轮：第一轮由多 agent 的 deep-research workflow 完成（5 个搜索角度，抓取 20 个来源，抽取 100 条主张，对其中 25 条做三票对抗核实，17 条存活、8 条被否决）；第二轮针对第一轮未覆盖的方向四、方向五和若干具体工具做了三路补充调研。每条结论都标注核实状态：**多源核实**指两个以上独立来源一致、或直接读了一手源码、论文或专利；**单源**指只有项目自述或单篇来源；**被否决**指第一轮三票核实中被否决、本文不采用的数字。本文是调研记录，不描述 duoduo 运行时的机制，因此不含代码引用；提到本仓库工具时写文件名。调研日期为 2026-11-04，各工具的版本与活跃度以当日为准。

## 0 结论

五个方向的结论各一句：

1. **JS 反压缩与 LLM 辅助命名工具**（第 2 节）：humanify、wakaru、webcrack、JSNice 都不能恢复 esbuild 重新 mangle 的顶层符号名；humanify 的"LLM 只提名字、AST 工具做 scope-safe 改名"与本仓库的 `rename.mjs` 加 `ast_equiv.mjs` 完全同构，可借鉴的是它和后继项目的提示设计、分组请求与收敛循环，不是它的产物。
2. **跨版本声明匹配**（第 3 节）：二进制 diffing 工具（BinDiff、Diaphora、Ghidra Version Tracking、QBinDiff）与 Java 混淆映射工具（FabricMC Matcher）解决的是同一类问题，它们共有而本仓库尚缺的三个部件是：从已接受匹配出发沿调用图迭代传播；按引用稀有度加权的候选打分；绝对阈值加相对领先阈值的接受规则，不满足即弃权并禁止多对一。
3. **社区长期维护映射的范式**（第 4 节）：Minecraft 模组社区用了七年的 intermediary 层证明"名字挂在持久 ID 上、ID 到混淆名的映射每版重算"可以长期运转；Quilt 的 Hashed Mojmap 进一步证明持久 ID 可以从内容派生而不必靠匹配链。追踪闭源 minified JS 产品的社区仓库（ChatGPT、Claude Code、Discord）在跨版本身份上都比本仓库弱，没有可借的机制。
4. **名字与类型恢复研究**（第 5 节）：训练于 minified JS 的模型只命名局部变量，且准确率严重依赖名字在训练语料中出现过；对单一作者的私有命名，这类模型的价值主要是评测基线。可迁移的是三个思想：沿调用图传播名字（GenNm）、以属性名和字符串为主证据（DeMinify）、用 TypeScript checker 把姊妹包的类型挂到 bundle 上作为命名上下文。
5. **文档联动与引用校验**（第 6 节）：现有商业与开源的"文档随代码变化"系统没有一个比本仓库的引用检查更严格；可借的是 Swimm 专利中的非连续片段匹配与双阈值、docsync 的"确认记录绑定句子加块哈希"、cog 的生成区校验，以及 DocPrism 的教训（裸 LLM 判定文档不一致的误报率极高，必须先把问题局部化）。

第 7 节记录 esbuild 的相关事实，包括在本仓库 v0.8.7 的出厂 bundle 上做的一次本地核实；第 8 节是按预期收益排序的建议清单；第 9 节列出核实状态、被否决的数字与调研空白；附录列出全部来源。

## 1 问题界定：两个痛点在现有流水线中的位置

现有流水线已经处在二进制 diffing 工具与反混淆社区所达到的同一水平，缺的不是方向而是几个具体部件。本节先摆出现状，后面各节的"与现有流水线的结合"都以此为参照。

痛点一的现状：真名只来自 esbuild 的 `__export` 块，v0.8.7 的 daemon bundle 里约 890 个顶层符号有真名，约 2500 个顶层声明中另有数百个被第一方代码使用的声明没有名字（`symbol_card.mjs unnamed` 列出）；`maps/inferred_daemon.json` 登记了 773 个推断名，`maps/locals_daemon.json` 登记了 761 条 LLM 提出的局部变量名；内层闭包没有真名，只有阅读用的名字。顶层声明的命名靠 `name_symbol.mjs` 逐个登记，批量命名靠 `name_toplevel.mjs tasks` 生成任务再由人或 LLM 填写；与同作者公开的 `@openduo/protocol` TypeScript 源码和旧版本导出表的配对分别由 `match_published_source.mjs` 与 `match_historical_exports.mjs` 完成。

痛点二的现状：`bump.sh` 已经实现三层配对（`release_pairing.mjs`：结构指纹相同且唯一；位置配对；特征相似度，按属性名、字符串、数字与全局名的加权 Jaccard，要求达到下限且领先次优一个差距），再用 `align_releases.mjs` 按语句顺序对齐承接孪生体，用 `anchor_candidates.mjs` 按调用方、被调用方与字符串字面量三项重合度给失去锚点的名字排候选，用 `confirm_reanchor.mjs` 以只在旧函数体里出现的字符串字面量作"证人"核对，最后由人 `--accept`。过去几次升级约 95% 的推断名自动承接，其余需要人读两侧函数体。文档引用的迁移由 `retarget_symbols.mjs`、`retarget_snippets.mjs` 与 `verify_citations.mjs --fix` 完成，`impact_report.mjs` 把每处引用按需要重读的程度分档。

两个痛点的共同根源在 esbuild 的改名器（第 7 节）：短名由符号的使用次数名次与整个 bundle 的字符频率决定，上游任何改动都会使大量短名换位，所以以短名为键的任何表每版都必须重建。

## 2 方向一：JS 反压缩与 LLM 辅助命名工具

结论：这些工具没有一个能恢复顶层符号的原名，它们的价值在于命名环节的工程做法。下表按与本仓库的相关性排列。

| 工具 | 核心做法 | 能否恢复 mangled 顶层名 | 可借鉴点 | 成熟度 | 核实状态 |
|---|---|---|---|---|---|
| humanify（jehna/humanify，v3 为 Rust 加 oxc 重写） | LLM 只提出标识符名，改名由 oxc 在 AST 层按 SymbolId 做 scope-safe rename；每个 binding 一次 LLM 调用，默认 500 字符上下文窗口；碰撞加前缀去重 | 否：一个文件进一个文件出，没有 rename map 导入导出，没有跨版本机制；唯一相关的未合并 PR 只是按上下文哈希缓存 LLM 响应，而上下文含被重新 mangle 的短名，缓存必然失效 | 提示设计（周围代码到单个描述性名字）、碰撞处理；不做改名后的等价校验，这一步仍由 `ast_equiv.mjs` 承担 | 活跃，有 e2e CI，没有任何准确率评测 | 多源核实（README 与源码） |
| humanify-skill（ajsb85，Claude Code skill） | 脚本管正确性（Babel 的 scope rename，按 binding 字节偏移键控），模型管命名；最大作用域优先；约 1500 字符上下文；webpack 每模块独立命名可并行；收敛循环直到一轮新名少于 5 个 | 否 | 最大作用域优先与收敛循环；自述 TypeScript 编译的 bundle 覆盖率在 60% 到 70% 封顶 | 单作者 | 单源 |
| FlowName（123wwwa/FlowName） | 静态解析 lexical binding，按关系与同作用域分组成预算化请求，一次要多个名字；只命名不解包 | 否 | 分组请求：自述比 humanify 少 77% 到 84% 的 API 调用、少 29% 到 37% 的 token，LLM 裁判偏好 512 比 274；作者自认裁判未校准 | 单作者 | 单源 |
| wakaru（pionxzh/wakaru，已重写为 Rust crate） | 拆分 webpack、esbuild、Browserify、Metro 等 bundle 为模块；从 Babel、TypeScript、SWC 转译输出恢复现代语法；`smart-rename` 按解构键、属性访问链、React 约定做启发式改名 | 否：README 明言短名保持短名除非有 source map，推断名只是阅读辅助 | 规则命名的清单（解构键取键名、`useState` 配对、属性访问链） | 活跃，1.16.0 发布于 2026-11-02 | 多源核实 |
| webcrack（j4k0xb/webcrack） | obfuscator.io 反混淆、unminify（约 23 个纯语法的 scope-aware 重写：`!0` 到 `true`、`void 0` 到 `undefined`、逗号表达式拆分、De Morgan 等）、webpack 与 browserify 解包 | 否：没有任何变换改标识符名；不支持 esbuild bundle；LLM 改名只列在计划中 | 语法还原变换清单可提高 `recon/` 可读性，但每个变换都改 AST，不能进入 provably-equivalent 链，只能作为阅读副本 | 活跃，约 3000 star | 多源核实 |
| JSNice 与 UnuglifyJS（ETH SRI） | CRF 结构化预测：程序转为 dependency network，未知名字与已知元素（常量、属性名、API 名）相连，MAP 推断做联合赋值并施加作用域约束 | 否：只给局部变量命名，常量、属性名、方法名与全局变量视为已知；UnuglifyJS 基于 UglifyJS v2 的 ES5 parser，不能解析 ESM bundle；只预测训练词表内的名字 | 联合推断的思想：先定顶层名再传播到 locals，用 xref 的调用关系作依赖网络 | 2015 年模型，可运行 | 多源核实（POPL 2015 论文与 UnuglifyJS 源码） |
| JSimplifier（2025 论文） | 在 HumanifyJS 的 AST 改名之上加多 provider 与上下文管理；名字先校验不与现有 binding 冲突，失败保留原名 | 否 | 100 个样本的人工检查：12% 偏离真值，17 个语义不一致，作者归因主要是 LLM 改名；典型失败是过度冗长 | 研究原型 | 单源 |
| CASCADE（Google，2025） | Gemini 只负责识别混淆器的 prelude 函数，确定性变换由 JSIR（MLIR 上的 JS IR）完成；论文明言刻意不让 LLM 直接生成反混淆代码 | 不做标识符改名 | 佐证"LLM 只判断、不改写"的分工 | JSIR 开源，CASCADE 本体未发布 | 多源核实 |
| restringer、obfuscator-io-deobfuscator、javascript-deobfuscator、synchrony、de4js、debundle、shapesecurity/unminify | AST 级反混淆（字符串、控制流），不做语义命名；de4js 是文本与模式级；debundle 与 shapesecurity/unminify 已停止维护 | 否 | 无 | 各异 | 多源核实 |

两条补充事实。其一，关于 LLM 整体改写代码是否安全，第一轮引用的 JsDeObsBench 数字（97% 语法有效、61% 语义一致）被三票否决，本文不采用；但 ReSym（CCS 2024）的人工检查给出同向证据：让微调模型端到端重写整个函数时，100 个样本中 68% 改变了语义，这支持"LLM 只提名字、AST 工具改名、等价证明兜底"的分工（多源核实，直接读论文）。其二，Terser 的 `nameCache` 与 esbuild 的 `--mangle-cache` 都只对运行 minifier 的生产方有效，输出的 bundle 不携带缓存；esbuild 的 mangle cache 更只覆盖 `mangleProps` 的属性名，不覆盖标识符，而上游并未 mangle 属性（本仓库的结构指纹保留属性名即是证明），所以不必向上游索要 mangle cache（多源核实，Terser 与 esbuild 官方文档）。

## 3 方向二：跨版本声明匹配

结论：二进制 diffing 与 Java 混淆映射工具的算法可以逐条映射到 AST 上，它们共有的三个部件（调用图传播、引用稀有度加权、双阈值接受否则弃权）正是本仓库 `anchor_candidates.mjs` 与 `confirm_reanchor.mjs` 所缺的。本节先讲这些工具，再讲 AST 与代码相似度方法，最后讲全局配对算法。

### 3.1 二进制 diffing 工具的算法与可迁移部分

**BinDiff**（Google，2023 年开源，Apache-2.0）的函数匹配按顺序应用十三种算法：hash、name hash、flow graph 边的 MD index、call graph 边的 MD index、flow graph 的 MD index、prime signature（每个助记符一个小素数，函数取乘积）、call graph 的 MD index、proximity MD index、relaxed MD index、address sequence、string references、loop count、call sequence。关键是传播机制：先做一次全局 pass，每种属性在整个二进制上只接受唯一匹配，有歧义就"drill down"到下一种属性；然后是邻居 pass，文档原文是对每个新匹配考虑其 callers 与 callees，在这个小得多的候选集里再 drill down；再对剩余未匹配函数用下一种属性重启整个过程，直到没有新匹配。置信度是各算法置信度经 sigmoid 压缩后的加权平均；函数相似度是 25% 匹配到的 flow graph 边比例、15% 匹配基本块比例、10% 匹配指令比例、50% MD index 差，再乘以置信度。各算法的置信度常数文档未给出。名字无关的信号有 MD index、prime signature、string references、loop count 与 call graph 边。（多源核实：concepts.md 直接读取。第一轮中"BinDiff 以符号移植为主要长期维护流程"的说法被否决；README 只把 port symbols and comments 列为用例之一。）

**Diaphora**（joxeankoret）的每个启发式是一条 SQL JOIN，分 Best、Partial、Unreliable 三组按可靠度顺序执行；Best 组如 Function Hash、Bytes hash、Same cleaned pseudo-code；Partial 组如 Same KOKA hash and constants、Same rare KOKA hash（hash 两侧至多出现 2 次才接受）、Same rare constant、Same rare MD Index、Pseudo-code fuzzy AST hash、Same nodes edges loops and strongly connected components、Loop count，多数带 0.35 到 0.6 的最低比率。传播有三种：Callgraph matches 递归检查已找到的 Best 与 Partial 匹配的 callers 与 callees；`find_matches_diffing_internal` 对每个已匹配对做 unified diff，把 removed 与 added 行中按位置成对出现的函数名当作新候选对，至多三轮；Local affinity 在地址上相邻的两个已匹配对之间的"洞"里暴力匹配。相似度 `check_ratio` 在 bytes hash 相等时为 1.0，否则取清理后伪代码、汇编、AST primes、微码四种比率的最大值；`deep_ratio` 再按共享源文件、相同出入度、共享常量加千分之一到千分之三的小分。（多源核实：直接读 `diaphora_heuristics.py` 与 `diaphora.py`。KOKA hash 的精确定义出自 SANER 2018 论文，PDF 未能读到，单源。）

**Ghidra Version Tracking** 的相关器分三类。精确类：Exact Function Bytes、Exact Function Instructions（屏蔽操作数后比较，相当于本仓库的 identifier-normalized 对齐）、Exact Function Mnemonics；Duplicate 版本允许非一对一匹配，置信度用 10 除以匹配总数再取对数，低于 0.7 不自动接受。相似类：Similar Symbol Name 用 trigram LSH，Similar Data 用 4-gram LSH。引用类（传播的核心）：Data Reference、Function Reference、Combined Function and Data Reference，流程是为每个未匹配函数建特征向量，特征是它引用的已接受匹配，**权重按该已接受匹配在函数中出现的概率，越罕见越重**，每个未匹配引用加一个概率 0.5 的独特特征，用向量夹角给源目标对打分，可选 Refine Results 去掉没有明显赢家的匹配；引用相关器没有已接受匹配时不返回任何结果，所以工作流必须先跑精确相关器并接受。Implied Match 不是算法而是结果类别：接受一个函数匹配后，按两函数中对应指令的操作数引用自动生成被引用函数与数据的 implied match，用户仍需手动接受。文档明确不同相关器之间的分数与置信度不可比较。（多源核实：官方 VT_Correlators 与 VT_Workflow 页面直接读取；Implied Matches 帮助页 404，votes 列的规则只有社区指南描述，单源。）

**QBinDiff**（Quarkslab）把 diffing 建模为 Network Alignment Quadratic Problem，输入是节点相似度矩阵加两个 call graph 的拓扑相似度，用 belief propagation 近似求解；`--tradeoff` 默认 0.8 偏内容，`--sparsity-ratio` 默认 0.6 剪掉最不可能的候选；特征如基本块数、圈复杂度、常量、助记符类型，均不依赖名字，可自定义特征并强制已知匹配；README 说超过约一万个函数会内存溢出，并说同一框架可用于任何图对齐。它是现成的"全局一致性求解器"，2500 个声明远低于上限，但 README 自述 experimental，是否输出逐对置信度未在文档中确认。（多源核实：README 与文档。）

**FabricMC Matcher**（sfPlayer1/Matcher，GPL-3.0，2026-04 仍有提交）是与本仓库问题最接近的成熟系统：同一上游每几周换一次混淆名，社区靠一个 GUI、自动匹配与人工确认维护映射。直接读源码得到的要点：ClassClassifier 有 24 个分类器，MethodClassifier 有 17 个，**没有一个比较标识符名**；分类器按四级 ClassifierLevel（Initial、Intermediate、Full、Extra）逐级放开更昂贵的信号，例如 class type check 权重 20、similar methods 10、string constants 8、numeric constants 6、in 与 out references 各 6、members full 10（Full 级起）、method code 12（Full 级起，对字节码做 Levenshtein，替换代价按 SIMILAR、POSSIBLE、DISTINCT 三级，操作数中的引用按"是否已匹配或潜在相等"比较）、in refs by bytecode index 6（Extra 级）。打分是加权和经 `(raw / max)` 的平方归一化。**接受规则 `checkRank`**：首位的归一化分至少 0.85，且次优低于首位乘以（1 减 0.085）；`sanitizeMatches` 丢弃被多个源元素同时选中的目标，禁止多对一。**传播**：`compareIdentitySets` 比较引用集合时，已匹配的元素只有当其匹配恰在对侧集合中才算相等，未匹配元素用 `checkPotentialEquality` 配对；`autoMatchAll` 先在 Initial 级匹配类，再对 Intermediate、Full、Extra 各级循环匹配方法与字段直到不动点，最后循环匹配参数与局部变量；方法只在已匹配类的对侧成员中找候选。`.match` 文件是行式文本，正文除匹配对外还有 `cu`、`mu`、`fu` 行显式记录"不可匹配"的弃权。（多源核实：源码与 wiki 直接读取；FieldClassifier 的权重未读。）

**签名与库识别类工具**给出两个可借的规则。Hex-Rays Lumina 以函数 MD5（掩掉重定位位）为键存元数据，push 时若 hash 已存在则比较新旧元数据的质量分，高者覆盖，是"内容 hash 作为持久键"的工业实现（多源核实）。Ghidra FunctionID 库里的 force-relation 旗标表示"full hash 命中只有在父或子也命中时才算"，即 hash 碰撞用调用图邻居消歧（旗标多源核实，specific hash 的定义单源）。Ghidra BSim 从反编译器规范化后的 P-code 生成特征向量，常量、寄存器与类型刻意不进特征，Quarkslab 的分析指出其算法等价于对数据流图与控制流图各做一维 Weisfeiler-Lehman 哈希，比较用余弦（多源核实）。radare2 的 zignatures 由多种度量各自投票，名字只是其中一种（多源核实）。FLIRT 以函数前 32 字节的掩码模式加后续字节 CRC16 做前缀 trie，是一个很便宜的第一层（单源）。

### 3.2 AST 与代码相似度方法

**astdiff**（shcv/astdiff，Rust 加 tree-sitter，MIT）是第一轮找到的与痛点二最直接对应的工具：对每个声明计算结构哈希与 MinHash 签名筛候选，可选 `--fingerprints` 抽取字符串、常量与 API 调用作匹配证据；`lineage` 子命令在 identifier-erased 结构上下文中用有界候选索引、首位与次优之间的双边 margin 与显式弃权做跨版本匹配，`--export-mappings` 输出旧到新的声明映射；`names` 子命令（export、set、approve、validate、propagate、render）只让人工 approve 的名字经已接受的一对一匹配传播，每次编辑追加审计事件并用 expected revision 拒绝过期写入，validate 拒绝作用域冲突。这与本仓库"推断表加 `confirm_reanchor.mjs --accept`"的形状相同，多出审计、revision 校验与 agent 或 human 的 origin 区分。局限：9 个 star、无 release、单作者；其文档自述置信度是未校准的确定性分级而非概率；没有人在 esbuild mangle 的 2500 级声明 bundle 上评估过它。适合作为参照实现，不适合作为依赖。（第一轮三票核实均通过，但全部来自其自身 README 与文档，故降为单源。）

**GumTree**（ASE 2014，支持 JavaScript）两阶段匹配：top-down 按哈希匹配同构子树（大的优先），bottom-up 对未匹配节点按"共同已匹配后代占比"（Dice 系数，默认阈值 0.5）匹配容器节点，再在不超过大小上限的子树里做最优恢复，最后用 Chawathe 算法推导含 move 的编辑脚本；带 move 的最优问题是 NP-hard，GumTree 是平方复杂度的启发式。超参数研究发现最优 Dice 阈值可低至 0.1 到 0.2。它的 bottom-up 阶段正是本仓库缺的部件：两个声明的已配对 callee、字符串与子结构占比超过阈值就配对，这是对"函数体被改了一半但调用关系不变"的标准解法。但它依赖节点标签（标识符名），esbuild 重新 mangle 恰好抹掉这一信号，需要先做标识符归一化再喂入；一项 Java 研究报告超过 55% 的 move 与 update 动作不准确；第一轮中"GumTree 能把改名或移动的函数识别为匹配而非删加"的强说法被三票否决。（能力描述多源核实；原论文的默认参数未能一手核实，只核实了超参数论文给出的实现默认值。）

**Mergiraf**（结构化三方合并工具）用 tree-sitter 解析三方，两两用 GumTree classic 匹配，但对 base 到 left 与 base 到 right 用较宽松的参数并以树编辑距离补匹配，对 left 到 right 用严格参数，理由是"任何假阳性对合并结果危害很大"。这个"按用途选严格度"直接可用：写入 `maps/` 的再锚定用严格阈值，`impact.md` 的分档用宽松阈值。（多源核实：官方架构页、LWN 与论文。）

**difftastic** 把 diff 看作两个语法树位置对构成的有向无环图上的最短路径，用 Dijkstra 求最低代价路径，图惰性生成；字符串字面量保持扁平；不做改名等价，不检测 move，对改动多的大文件内存大。它只适合作 `diff_decls.mjs` 的可选渲染器，不提供跨声明配对，而 `diff_decls.mjs` 把局部变量写成 `_` 的做法是它做不到的。（多源核实。）

**代码克隆检测家族**是多对多相似而不是一对一对齐，可借的是归一化与候选筛选。SourcererCC（ICSE 2016）有意不做标识符归一化，依赖真实标识符作为稀有且有区分度的 token，稀有 token 构成前缀过滤；这对本仓库是一个适配警告：esbuild 每版重新 mangle 全部标识符，这些 token 跨版本没有信号，若要移植 token 袋匹配必须把袋限制在跨版本稳定的 token（字符串、属性名、关键字、数字、`__export` 真名），本仓库的 xref 已索引这些，不需要新解析（多源核实；第一轮中其 overlap 公式与前缀过滤的细节未通过核实，不作依据）。NiCad 在 parse tree 层做 blind renaming 再用行级 LCS 算相异度阈值；CCFinder 把所有标识符替换为同一个 token；Deckard 用 AST 特征向量加 LSH；jscpd 在 token 流上用滚动哈希检测 Type-2（重命名标识符）克隆，并有 `--baseline` 只对新增重复失败（多源核实）。Dolos 式 winnowing（tree-sitter 掩名后对固定长度 k-gram 哈希、每窗口只留最小值）可作为大段代码整体搬迁的廉价预筛（多源核实）。

**Weisfeiler-Lehman 图哈希**对 CFG 或 AST 节点先打标签，迭代 k 轮把邻居标签的多重集压缩进节点标签，线性时间，一函数一次；Riverloop 的评价是做签名识别足够好、做 diffing 式比较图编辑距离可能更好（多源核实）。它是本仓库结构指纹从"精确哈希"走向"近似相似度"的标准路径，用于函数体有改动的声明。代码嵌入（InferCode、code2vec）需要模型与训练设施且不产生弃权语义，价值低于 WL 与 MinHash，列为备选。

### 3.3 全局配对算法

本仓库的三层配对按 bundle 顺序逐个解决，一个旧声明可能被两个新声明争抢。两个现成范式能消除这类错配。**git range-diff** 对两个 commit 范围建代价矩阵，代价是两个 patch 的"diff of diffs"行数，加入固定代价的 dummy 行列表示整体增删，用 Jonker-Volgenant 算法解最小代价指派，`--creation-factor` 默认 60% 决定"配对"与"一删一增"之间的偏好（单源，官方文档）。git 自身的 rename detection 先精确匹配，再做源目标二次方配对，`-M` 默认相似度 50%，`-B` 把整体重写拆成删加（默认 60% 与 50%）；相似度由 diffcore-delta 计算：文件切成"遇换行或满 64 字节"的 chunk，哈希后按多重集求复制字节数，每对线性时间（多源核实：官方文档与源码）。前者给出"指纹相似度代价矩阵加指派算法加 dummy 代价"的全局最优一对一配对；后者给出一个比 patience diff 便宜一个量级的预筛，以及"整体重写不算同一声明"的下限。QBinDiff（3.1 节）是同一问题带调用图约束的版本。

## 4 方向三：社区长期维护映射的范式

结论：持久 ID 层是经过长期验证的范式，内容派生的持久 ID 是它的改进版；追踪闭源 minified JS 产品的社区仓库没有可借的身份机制；反编译社区的"匹配"与本仓库的 AST 等价证明同构，但他们不做版本间自动函数对齐。

### 4.1 Minecraft 模组社区：intermediary、Matcher、Hashed Mojmap

FabricMC 的跨版本工作流把稳定的中间命名层 intermediary 与人类可读名 Yarn 分离。Matcher 在版本 A 与 B 的 jar 之间生成 match 文件（自动匹配加人工确认）；Stitch 的 `updateIntermediary` 读取 A 与 B 的映射和 match 文件，把 intermediary 名沿匹配向前携带，新成员从全局计数器领号，计数器用于避免从同一基线分叉的两个版本编号冲突；Yarn 名只挂在 intermediary 上，Loom 与 Tiny-Remapper 在两层间重映射；教程注明 Matcher 的误报为个位数、上游合并方法时的重复映射要人工择一。这是本轮最成熟、运行最久（2018 到 2025）的跨版本符号迁移范式。现状：Stitch 与 intermediary 仓库于 2025-01 归档，Minecraft 自 26.1 起不再混淆，所以它是已验证的历史范式而不是活跃项目。（多源核实：wiki 教程、intermediary README、FabricMC 2025-10 公告。）

Quilt 的 **Hashed Mojmap**（RFC 19 与 mappings-hasher）是 intermediary 的改进：RFC 的动机原文大意是匹配 intermediary 是更新到快照版本时花时间最多的环节，想要一个永远可用、去中心化、无需维护一条匹配链的方案。规则：类用简单名，仅在不唯一时才带包名；字段与方法的 hash 输入是"类名、成员名、描述符"，**名字在类内唯一时描述符置空**，RFC 说这大幅提高稳定性；override 组取所有顶层方法原名的字典序最大者应用到整组；SHA-256 取低 8 位 base-26；碰撞分析按 5000 类与 40000 成员、千分之一的碰撞概率算出需要 7.3 到 7.6 位。RFC 承认的缺点：被 hash 的输入一变 ID 就变，变动率约为 intermediary 的两倍；约一半的类重命名只是搬包，被"去包名"规则吸收；lambda 名在前面插入 lambda 时会变。（多源核实：RFC 与 README 直接读取。）对本仓库的意义：这是"内容派生的持久 ID 取代按匹配链递增的计数器"的完整先例，连"去掉可去的区分符以提高稳定性"的技巧都有；区别是 Quilt 的输入是上游发布的真名，本仓库没有真名，只能 hash 结构指纹，所以 ID 在函数体改动时必然变，持久 ID 只能覆盖未改动的那部分，改动部分仍需对齐。

其他相关实践：Mojang 自 1.14 起随每个版本发布 ProGuard 混淆日志，是"上游直接发布 name map"的先例，而且上游自己也受益于可读的 stack trace（多源核实）；Enigma 是 GUI 映射编辑器，更新版本时用它的 Replace 把 A 的名字按 intermediary 迁到 B（多源核实）；Parchment 只补 Mojmap 缺的参数名与 Javadoc，是"上游名加社区补充层"的分层做法（多源核实）；jadx 能读写多种映射格式并持久化自动生成的名字，但跨 apk 版本迁移名字的机制看起来不存在（多源核实）。

### 4.2 追踪闭源 minified JS 产品的社区仓库

这些仓库的跨版本身份策略都比本仓库弱。0xdevalias/chatgpt-source-watch 的做法是下载 chunk、去掉文件名里的 hash、用 Biome 反复格式化到不变、把格式化后的文件提交进 git，然后 `git diff` 两个 build，CHANGELOG 手写；其作者在 gist 与 wakaru 的 issue 里讨论的"对叶子模块做内容寻址哈希、局部变量用 De Bruijn 索引归一化、以 `Symbol()` 描述、`displayName`、静态字符串数组作锚"都是研究笔记而不是实现，issue 至今 open（多源核实）。追踪 Claude Code 的仓库中，Piebald-AI 的 claude-code-system-prompts 公开脚本只做"已提取的 prompt JSON 到 Markdown"的同步，跨版本身份靠文件路径、frontmatter 名字、正文全等三级回退，提取器本身不在公开仓库；badlogic/cchistory 不做静态提取，而是拦截一次模型请求取 system prompt；tweakcc 的补丁是对 minified `cli.js` 的结构化正则，以定界符开头、用捕获组保留 minified 名字再回填，是 `locate_by_anchor.mjs` 的手工版本（多源核实）。Discord-Datamining 只 diff 入口 JS，每个有实质变化的 commit 由人加评论，自述变量重命名带来大量噪声（多源核实）。唯一值得对照的是 Piebald 的 `identifierMap`：把模板字符串按插值切片存储，使"prompt 文本变了但插值变量没变"可识别，与本仓库证人处理模板字面量的方式可对照。

### 4.3 反编译社区与补丁栈

游戏反编译社区（decomp.me、asm-differ、objdiff、decomp-permuter、ido-static-recomp）的"matching"是"我写的源编译后与原二进制逐字节一致"，与本仓库 AST 等价证明的思路同构；他们处理多个 ROM 版本靠条件编译加每版本独立 baseline，没有找到在版本之间自动检测"哪些函数变了"的工具；可借的只有"把 baseline 快照与每单元完成度作为数据提交"的习惯，本仓库的 `pipeline_report.json` 与 `history_daemon.json` 已经如此（多源核实）。Debian 的 quilt 补丁栈与 Firefox 的 vendoring 把手工改动表示为相对上游的增量、由机器 rebase、人工只处理冲突；本仓库的手工层是 `maps/` 而不是源码补丁，补丁栈模型只在"改动用相对上游的增量表达"这一点上有启发，等价于第 8 节建议 1（多源核实）。

## 5 方向四：名字与类型恢复研究

结论：训练于 minified JS 的模型只命名局部变量，准确率严重依赖名字在训练语料中出现过，对单一作者的私有命名其价值主要是评测基线；可迁移的是沿调用图传播、以属性名与字符串为主证据、用 TypeScript checker 做类型播种三个思想，以及二进制侧已经成形的评测方法。

### 5.1 模型与方法

| 工作 | 方法 | 训练数据 | 命名范围 | 可用性 | 对本仓库的意义 | 核实状态 |
|---|---|---|---|---|---|---|
| JSNice（POPL 2015） | CRF 联合预测名字与 JSDoc 类型 | minified JS，10517 个 GitHub 项目 | 局部变量 | Nice2Predict 与 UnuglifyJS 开源 | 联合推断；自述 63.4% 精确恢复的数字在第一轮被否决，本文不作依据 | 方法多源核实 |
| JSNaughty（FSE 2017） | Moses 统计机器翻译加 JSNice | UglifyJS minified JS | 局部 | 代码未查到 | 无 | 多源核实 |
| Context2Name（2018） | RNN autoencoder 编码使用上下文 | minified JS | 变量与函数名 | 代码未查到 | 两版论文的准确率相差 13 个百分点，说明对数据集敏感 | 单源 |
| JSNeat（ICSE 2019） | 信息检索：以属性与方法名、变量间关系、函数用途三种上下文在语料中检索名字 | 322k JS 文件 | 局部 | Java 项目开源 | 检索式方法在同作者语料上的效果来自命名习惯匹配 | 多源核实 |
| DeMinify（ESEC/FSE 2023） | 图卷积网络，名字与类型 dual-task；**核心观察：字段与方法名在 minify 后不变，模型主要靠它们** | JSNeat 的 322k 文件再 minify | 局部变量 | 论文中的仓库 URL 被截断，未验证 | 属性名与字符串应作为主证据 | 多源核实（直接读 PDF） |
| DIRE（ASE 2019）、DIRTY（USENIX Security 2022）、VarBERT（IEEE S&P 2024） | 词法加结构的神经模型；Transformer 联合预测名与类型；BERT 微调 | 反编译的 C 二进制 | 变量 | 开源 | 不适用于 JS；VarBERT 在"训练未见名"设定下约 50% | 多源核实 |
| VarCLR（ICSE 2022） | 对比学习得到变量名语义向量 | GitHub 重命名编辑 | 不命名，用于打分 | 开源 | 可作命名评测的相似度指标 | 多源核实 |
| ReSym（CCS 2024） | 两个微调 LLM 分别恢复局部变量与结构体字段，Prolog 推理聚合多次查询 | C 二进制 | 局部变量与数据结构 | 数据与脚本开源 | 端到端重写 68% 改变语义；在训练未见的函数上名字准确率 37.5% | 多源核实（直接读论文） |
| GenNm（NDSS 2025） | 生成式 LLM 微调；**按调用图迭代把名字在 caller 与 callee 间传播**，数据流校验加多数投票 | C 二进制 | 变量 | 开源，需 24 GB 显存 | 传播思想可直接映射到 xref；训练未见名字的设定只有 17.3% 到 22.8%；微调的领域模型胜过零样本的黑盒 LLM | 多源核实 |
| LmPa（2023） | LLM 加程序分析：窗口内得到的好名字传播到窗口外 | C | 变量 | 未查到 | 同上 | 单源 |
| Nero（OOPSLA 2020）、SymLM（CCS 2022） | 函数名预测；SymLM 引入 CodeWordNet 子词语义匹配评测 | 二进制 | 函数名 | 开源 | 函数名评测方法可迁移：开发者给同一函数起同名的概率只有 6.9%，exact match 失真 | 多源核实 |
| DeepTyper（FSE 2018）、LambdaNet（ICLR 2020）、OpenTau（2023） | JS 与 TS 的类型推断：双向 RNN；类型依赖图加 GNN；fill-in-the-type 微调加 tsc 验证 | JS 与 TS | 类型 | 开源 | LambdaNet 只接受 .ts 输入且为 Scala 实现；OpenTau 不改已有类型；都比 TypeScript checker 重得多 | 多源核实 |

### 5.2 用类型与接口信息恢复名字

TypeScript 自身对 .js 文件的推断规则（`allowJs` 加 `checkJs`）是最便宜的"类型播种"工具：类属性从构造函数赋值推断，对象字面量开放，CommonJS 的 `require` 与 `module.exports` 视为 import 与 export；限制是 JS 函数的未注解参数一律可选且多为 `any`，未指定泛型为 `any`。Compiler API 的 `getTypeAtLocation` 与 `typeToString` 可程序化取推断类型。`dts-gen` 用运行时反射生成 .d.ts，参数与返回值大量 `any`；`ts-migrate` 只插 `any` 不做用法推断；用 `--declaration` 从 JS 直接生成 .d.ts 主要靠 JSDoc。调研没有找到"用 .d.ts 签名（参数个数、属性访问集合）匹配 bundle 函数以迁移名字"的现成工具，本仓库的 `match_published_source.mjs` 已是这个方向。（多源核实：TypeScript 官方手册；负面结论单源。）

Chrome DevTools 的变量名解析纯靠 source map 的 Scopes 信息（ECMA-426 的 Scopes 提案，2025-03 起用 `@chrome-devtools/source-map-scopes-codec`），没有基于 AI 的名字推断；Firefox 同样没有（多源核实）。这意味着浏览器侧没有可借的推断能力，但 Scopes 格式可以作为本仓库 rename map 的一种导出格式，让调试上游原始 bundle 时直接看到恢复的名字。

### 5.3 评测方法

JS 侧没有任何基准衡量名字恢复：JsDeObsBench（CCS 2025）的指标是语法有效、测试用例执行、Halstead 简化率与 CodeBLEU，不考虑改名后的标识符，webcrack 作者在 humanify 的 issue 里也指出这一点（多源核实）。现有 LLM 命名工具的效果全部是自述（humanify 无评测、FlowName 的裁判未校准、JSimplifier 只有 100 个样本的人工检查）。二进制侧已经形成可借用的评测设计：REFORGE（2026）在七个模型上测函数命名，Token F1 只有 0.18 到 0.29、exact match 1.9% 到 7.1%，用 bge-small 余弦相似度重打分的 AUC 0.78 优于 CodeBERT 的 0.64，Token F1 为零的预测中约七分之一其实语义正确，并提出 top-K oracle 指标（多源核实，直接读 PDF）；REBENCH（2026）指出 exact match 与 partial credit 混用的问题，采用 SymLM 的 CodeWordNet 子词分解加同义词映射算 P、R、F1（多源核实）。两个硬设定的数字对单作者私有词汇最有参考价值：GenNm 在训练未见名字上 22.8%，VarBERT 50.7%。

## 6 方向五：文档联动与引用校验

结论：没有一个现成系统比本仓库的引用检查更严格，可借的是四个具体做法：非连续片段匹配加双阈值（Swimm）、确认记录绑定句子加块哈希并带稳定性策略（docsync、codocia）、生成区校验（cog）、LLM 只放在已定位的段落上（DocPrism 的教训）。

### 6.1 文档随代码变化的系统

**Swimm** 的 Auto-sync 把 snippet、token（函数名与变量名）、path 三类对象绑到代码上，博客明言不用语言知识（无类型、无语法），而是对每个 snippet 评估一组有优先级的信号：行标记、行号、token 引用、改动大小、VCS 文件历史；代码只是移动则静默标为 verified，代码消失则交给人，证据不足就建任务让人重选。其专利（US 11847444 与 2025 年的公开申请）给出算法：先对旧片段的第一行在新文件里找候选行（去掉分号、逗号与空白后的 Levenshtein 距离，按较长行长度归一化），每个候选向后生长成**非连续**片段（旧行按顺序匹配到后面的新行，中间未匹配的新行并入），按匹配行数、未匹配数与行相似度打分取最高，新片段行数不超过旧的一到十倍；更新分两档阈值，高于上限自动更新，高于下限要人确认；token 的 verified 阈值 90%、outdated 阈值 40%。（专利部分多源核实：两份专利文本与博客一致；示例数值单源。）

**docsync**（ubgo/docsync，Go，v0.1.x）在源码里写指令注释 `ds:def id=<标签>-<8 字符后缀>`，后缀才是身份，标签只是提示，所以 id 能跟着移动与改名走；文档用链接引用 id；变更检测是对 tree-sitter token 流的哈希，格式化不触发；`ds check` 报 ok、moved、changed、moved-unmarked、rewritten、deleted、new；修复靠 `ds ack`，**ack 绑定到一句话加块哈希，改句子要重新 ack**；`stability=api` 忽略函数体改动、`frozen` 任何改动都报；`ds mcp` 把 check、ack、impact、context 暴露给 agent，payload 放在 `data:` 分隔符后防止被当作指令，agent 的 ack 必须带 `delegated_by`，破坏性命令不暴露；自述局限是不能发现"文本没变但语义变了"。（多源核实：README 与 pkg.go.dev。）**codocia**（Rust，0.2.0）同类，note 以路径加行范围、commit、PR 或 issue 引用来源，行范围钉到内容哈希，`accept` 前显示改动前后并**拒绝一个现在覆盖了不同代码的范围**（单源）。snippetdrift 是最小化的"行范围加哈希加 accept"（单源）。

商业产品 Mintlify Autopilot、Dosu、DocuWriter、DeepDocs 都是"push 触发、agent 读 diff、判断哪些页面要改、产出 PR"，没有任何文档说明它们如何把文档段落绑到代码，无可借的绑定机制（Mintlify 多源核实，其余单源）。Doc Detective 是"文档对产品行为"的测试（页面元素、API 响应），对应本仓库的 `scenarios/`，不是"文档对代码"的绑定（多源核实）。

### 6.2 按符号名绑定且构建失败的先例

rustdoc 的 intra-doc links 按路径解析，`broken_intra_doc_links` lint 可设为错误，是"按名字引用、名字消失则构建失败"的教科书案例，与本仓库 `真名 (短名)` 的校验同构（多源核实）。Sphinx 的 `literalinclude` 有 `:pyobject:` 选项按符号名截取 Python 源码，另有按字符串锚的 `:start-after:` 与 `:end-before:`（多源核实）。embedme 与 embedm 按路径加行号嵌入代码块，`--verify` 在 CI 里检查是否会改变，绑定脆弱（多源核实）。cog 在 `[[[cog ]]]` 标记内生成内容，`--check` 验证再跑一遍不会改文件，`-c` 在结束标记上加校验和，人手改了生成区就拒绝覆盖（单源，官方文档）。本仓库的片段写法已经是可执行的文档断言；cog 的校验和加 check 模式可用于 INTERNALS 附录 B 这类本应由 xref 生成的表。

调研排查了 SCIP、Kythe、TSDoc 的 declaration references、api-extractor、cargo-public-api、cargo-semver-checks、japicmp、ts-api-guardian：**没有一个主流 API diff 或代码智能工具把内容哈希当身份**，它们全部依赖名字路径；Kythe 的 TypeScript indexer 文档明说输出对相同输入一致但不必跨输入版本稳定。真正内容派生的身份只出现在 diff 与合并工具（GumTree 的子树哈希、diffcore-delta 的 chunk 多重集、jscpd 的 token 哈希、Swimm 的行相似度）和二进制逆向工具里（多源核实）。本仓库的方案已经与这一类处于同一水平，下一步是分层启发式与全局指派，而不是换身份方案。

### 6.3 LLM 判定文档不一致的教训

DocPrism（2025）用不微调的 LLM 检测"文档说错了"类不一致，裸 LLM 的标记率 98%，加过滤后降到 14%，F1 从 0.22 升到 0.77（单源，arXiv）。RepoAgent 在 pre-commit 时只重生成受影响对象的文档，被引用对象变了不触发；RepoDoc（2026）用仓库知识图谱做增量更新（多源核实）。ICSME 2023 的研究发现 GitHub 前 1000 个热门项目中超过四分之一至少有一处对已不存在的代码元素的引用（多源核实）。这些支持本仓库 `impact_report.mjs` 的分层设计：LLM 只放在第 1 档与第 2 档已定位的段落上，校验 agent 的输入应是"该段落引用的每个声明的 diff"而不是整节文本，产出按引用逐条判定。

## 7 esbuild 的事实

结论：短名由使用频次名次与整个 bundle 的字符频率决定，天生不可持久；上游若开启 `keepNames` 或发布不含源码的 source map，函数与类的原名会直接出现在产物里；mangle cache 与 metafile 对本仓库无用。

直接读 esbuild 的 `internal/renamer/renamer.go` 与 `internal/ast/ast.go` 得到的机制（多源核实）：`AccumulateSymbolUseCounts` 累计每个符号的使用计数；嵌套作用域的符号按 slot 计数，兄弟作用域共用同一批 slot 编号以提升 gzip 压缩率；顶层符号延后串行处理，`AllocateTopLevelSymbolSlots` 按计数降序、源文件 DFS 序、文件内序号排序分配 slot；`AssignNamesByFrequency` 对每个命名空间把 slot 按计数降序排序，第 N 个 slot 得到 `NumberToMinifiedName` 的第 N 个名字（前 54 个是单字符，之后按 64 进制加长，跳过保留名）。此外 `ShuffleByCharFreq` 在 minify 时按输入文本的字符频率重排字母表。结论：一个声明的短名同时取决于它在全 bundle 中的使用次数名次和全 bundle 的字符频率，上游任何改动都会改变很多符号的名次和字母表，这就是本仓库观察到的"每版几乎全部重 mangle"的机制。相同输入给出相同输出是设计目标，所以对同一 npm 版本重跑不会得到新信息。一个弱信号可以利用：同一作用域内名字的相对顺序近似使用频率顺序，两个候选指纹相近时，把 mangled 名解码回 slot 序号与旧版更接近者优先，可作 `anchor_candidates.mjs` 的 tie-breaker（单源推论，需在一次升级上实测）。

`keepNames`（多源核实：`runtime.go`、issue 2149、文档）：运行时定义 `__name` 为对目标设置 `name` 属性的 helper，开启后被重命名的函数与类声明会包在 `__name(fn, "原名")` 里；若上游开启，每个被 mangle 的具名函数与类的原名会以字符串字面量直接出现在 bundle 里，命名问题对函数与类声明即告解决，对非函数的常量与匿名箭头函数不解决。**本地核实**：在 v0.8.7 的 `daemon.pretty.js` 与 `cli.pretty.js` 里，没有任何 `__name` helper 的调用模式，`Object.defineProperty` 设置 `"name"` 的只有 vendored zod 的两处，所以上游当前没有开启 `keepNames`。source map（多源核实，文档）：`sourcemap` 取 `external` 并关闭 `sourcesContent` 时，.map 文件只含源文件路径与每个标识符的原名，不泄露源码。`--mangle-cache` 只覆盖 `mangleProps` 的属性名，且属性名只在同一次 API 调用内一致（多源核实，文档）。`--metafile` 只有输入输出的字节数、imports 与 exports，没有标识符，但对 `modules_daemon.json` 的"哪个 `__export` 块属于哪个源模块"有帮助（多源核实，文档）。

## 8 建议清单

按预期收益排序，每条给出做法、依据、与现有工具的结合点和验证方式。前三条针对痛点二，第四到第六条针对痛点一，后面是文档联动与协作路径。各工具的能力描述已核实，组合后的收益是推论，第 9 节单列。

**建议 1：把推断名与局部变量名的主键从 mangled 短名改为内容派生的持久 ID，短名映射降为每版本生成的缓存。** 做法：ID 取现有 `structural_signature.mjs` 的 identifier-normalized 结构指纹的哈希，按 Quilt 的"区分符能省则省"原则，指纹唯一时只 hash 指纹，不唯一时追加最少的区分符（最稀有的字符串证人，其次被引用的已命名 callee 集合，最后位置序号，位置最不稳定所以放最后）；`inferred_daemon.json`、`locals_daemon.json`、`history_daemon.json`、`changelog_daemon.json` 与文档引用都挂在 ID 上；`bump.sh` 只处理 ID 变了的声明。依据：Quilt RFC 19 把匹配 intermediary 认定为更新耗时最大的一环并用内容 hash 消灭了它；Lumina 以函数 hash 为键存元数据；esbuild 的短名机制（第 7 节）说明短名天生不可持久；FabricMC 七年的运行证明"名字挂在持久层上"可长期维护。结合点：`verify_inferred.mjs` 的 shape 基线比较照旧；`confirm_reanchor.mjs` 只对 ID 变了的声明工作；`committedInSync` 与 `inferredNames` 两个 gate 需要改为按 ID 比较。预期：过去升级中约 95% 自动承接的声明多数函数体未变，这部分在新方案下不需要任何再锚定步骤，工作量与上游改动量成正比；RFC 也明确了代价，被 hash 的输入一变 ID 就变，所以这是把对齐问题缩小到改动集，不是消灭它。验证：用过去几次升级的已核实推断表回放，统计 ID 不变的比例与误配数。

**建议 2：再锚定的候选打分改为"从已接受匹配出发沿调用图迭代传播，按引用稀有度加权"。** 做法：`anchor_candidates.mjs` 对顶层符号的引用从"位置占位符"升级为"若该符号已匹配则是同一 token，否则是未知 token"；候选集先限制在已接受对的 callers 与 callees 的并集，迭代到不动点；对引用做 IDF 式加权，被几百处调用的工具函数几乎不提供证据，只被两处调用的符号提供很强证据；未匹配引用按 Ghidra 的做法当作概率 0.5 的特征。依据：BinDiff 的邻居 pass、Ghidra 的三个 reference correlator（权重按出现概率、Refine Results 去掉无明显赢家的匹配）、Diaphora 的 Callgraph matches 与"对已匹配对做 diff 取位置对应的函数名作候选"、Matcher 的 `compareIdentitySets`、GenNm 的调用图传播、FunctionID 的 force-relation。结合点：xref 已有 callers 与 callees；Diaphora 的 diff 法可直接用现有的 identifier-normalized patience diff 实现。验证：同建议 1 的回放，比较 `CLOSE` 候选的数量与人工读函数体的次数。

**建议 3：接受规则形式化为 Matcher 的双阈值并禁止多对一，弃权原因写成数据；配对改为全局最小代价指派。** 做法：首位归一化分至少达到绝对阈值且次优低于首位乘以（1 减相对阈值），否则弃权并在 `impact.json` 记录原因（次优太近、分数太低、多对一）；写入 `maps/` 的再锚定用严格阈值，`impact.md` 的分档用宽松阈值；对"旧版改动或消失的声明乘以新版未匹配的声明"构建代价矩阵，dummy 代价为声明大小乘以因子，用指派算法一次性解出。依据：Matcher 的 `checkRank`（0.85 与 0.085、平方归一化、`sanitizeMatches`）；astdiff 的双边 margin 加显式弃权；Mergiraf 按用途选严格度；git range-diff 的 Jonker-Volgenant 指派加 creation factor；Ghidra 文档警告不同相关器的分数不可比，所以层号即置信度。结合点：`release_pairing.mjs` 的三层改为"每层只接受全局唯一的匹配再 drill down"的 BinDiff 顺序：精确指纹、唯一证人、持久 ID、邻居传播、relaxed 指纹（Weisfeiler-Lehman 哈希或 NiCad 式归一化后的 LCS 比率，给第 1 档与第 2 档的人工重读一个排序分和"改了多少"的数字）、人工；每次升级的接受与弃权决定像 Matcher 的 `.match` 文件一样提交，使下一次升级能把人工决定当作已接受匹配参与传播。验证：回放并比较误配数与弃权数。

**建议 4：先建以已知真名为 ground truth 的命名评测，再决定任何 LLM 命名方案。** 做法：从旧版本的 `__export` 表、`@openduo/protocol` 的 TypeScript 源与 `published_daemon.json`、`historical_daemon.json` 取出已确认的真名，对名字做 hold-out（把这些符号当作未命名喂给候选方案），用三层指标打分：小写去分隔符后的 exact match、子词集合的 Token F1、bge-small 余弦相似度，可选 VarCLR 相似度；同时报 top-K oracle，让 LLM 给三个候选而不是一个，衡量"人从候选里挑"的上限；用 UnuglifyJS 跑一个非 LLM 基线。依据：JS 侧没有任何名字恢复基准，现有工具的效果都是自述；REFORGE 与 REBENCH 给出可直接借用的评测设计；SymLM 指出 exact match 对函数名失真。结合点：`name_toplevel.mjs tasks` 与 `name_locals.mjs tasks` 的输出就是评测输入。验证：评测本身就是验证。

**建议 5：LLM 命名改为"按作用域分组、最大作用域优先、沿调用图传播、迭代收敛"，并在 LLM 之前加一轮确定性规则命名、以作者自有词表约束。** 做法：先命名叶子函数（其 callee 多为已有真名或字符串丰富），再把已定名字作为上下文给 caller；`name_locals.mjs tasks` 按整个函数而不是单个局部变量出题；在规则层加解构形参直接取键名、`const a = obj.prop` 取 `prop`、`useState` 式配对，只把规则覆盖不了的交给 LLM；prompt 先要求一句功能描述再给名字，限制名字长度，拒绝与同作用域已有 binding 冲突；把同作者的已知真名（按子系统分组）、CHANGELOG 用词、protocol 包的类型与字段名作为词表约束。依据：GenNm 与 LmPa 的传播、FlowName 的分组、humanify-skill 的最大作用域优先与收敛循环、DeMinify 与 JSNeat 以属性名为主证据、wakaru 的规则命名清单、JSimplifier 的失败模式（过度冗长、偏离真值）、"投毒标识符"研究显示模型会照抄代码里现成的误导性名字而"先描述再命名"能压低传播、GenNm 在训练未见名字上只有约 23% 说明通用模型不适合私有词汇、JSNice 的联合推断。结合点：xref 的调用关系与证人就是分组与传播的依据；`name_symbol.mjs` 的"unused anywhere"检查在 locals 层也应做；规则得出的名字跨版本稳定，因为属性名跨版本不变。验证：建议 4 的评测。

**建议 6：用 TypeScript checker 做类型播种，把 `@openduo/protocol` 的 .d.ts 类型挂到 `recon/daemon.recon.js` 上，把类型字符串作为命名上下文。** 做法：在 `.build` 里以 `allowJs` 加 `checkJs` 对还原 bundle 建 program，把 protocol 包的 .d.ts 放进去；凡调用了 protocol 导出函数的位置，checker 已能给出参数与返回类型；对 locals 任务附上 `typeToString` 的结果；把推出的类型作为 `match_published_source.mjs` 的额外匹配特征。依据：TypeScript 官方的 JS 推断规则；DeMinify 的 dual-task 消融显示类型信息提高名字准确率；LambdaNet 与 OpenTau 存在但要求 .ts 输入和重型设施。限制：JS 未注解参数一律可选且多为 `any`，只对流经 protocol 类型的值有效；不要指望 `--declaration` 直接给出好的 .d.ts。验证：统计 locals 任务中拿到非 `any` 类型的比例。

**建议 7：引用确认记录绑定"句子加声明哈希加版本"，并引入稳定性策略；片段重定位允许非连续匹配并增加自动改写档。** 做法：对 `confirmed` 的段落记录它确认时所引声明的 token 流哈希，使下次升级能机械判断该确认是否仍有效；对"函数体内改动但签名、callee 集合、字符串集合不变"的声明自动归第 3 档；`retarget_snippets.mjs` 对"旧片段的 token 在新声明里按序出现、中间只插入少量 token"的情况直接改写并标 `respelled`，低于 git `-B` 式的整体重写下限才留给人重读。依据：docsync 的 ack 与 stability 策略、codocia 的 accept 规则、Swimm 专利的非连续片段生长与双阈值、git 的 `-B` 阈值。结合点：`impact_report.mjs` 的分档与 `retarget_snippets.mjs` 的报告。验证：回放一次升级，比较第 1 档与第 2 档的条目数。

**建议 8：`upgrade-docs` workflow 的校验 agent 改为"逐引用局部判定"；INTERNALS 附录 B 这类本应生成的表改为生成区并在 CI 用 check 模式比对。** 依据：DocPrism 的误报教训、RepoAgent 只更新受影响对象、cog 的 `--check` 与校验和。结合点：xref 已有事件类型与 RPC 方法索引。验证：一次升级中附录 B 的人工改动次数降为零。

**建议 9：向上游提一个具体、低成本的请求，优先级依次为随 npm 包发布 `external` 且关闭 `sourcesContent` 的 source map、开启 `keepNames`、发布 metafile；不索要 mangle cache。** 依据：第 7 节的事实与本地核实；Mojang 自 1.14 起发布 ProGuard mapping 的先例说明上游发布 name map 对其自身也有可读 stack trace 的直接好处，这是提请求时的理由。请求是否成功不可控，所以它与建议 1 到 3 并行而不是替代。可直接提交的 issue 文本在 `reconstruction/UPSTREAM_REQUEST.md`；它没有被提交，是否提交由仓库所有者决定。

**低优先级两项**：把 rename map 额外导出为 ECMA-426 Scopes 格式的 source map，让调试上游原始 bundle 时直接看到恢复的名字，只是展示层，不影响证明链；若要做全局一致性求解，QBinDiff 可直接用于本仓库的相似度矩阵加调用图，但它是实验性工具且需调参，放在建议 2 之后再考虑。webcrack 的语法还原变换可用于生成一份更易读的阅读副本，但不能进入 provably-equivalent 链。

## 9 核实状态、被否决的数字与调研空白

多源核实的部分：humanify、wakaru、webcrack、JSNice、Terser 与 esbuild 的能力边界；astdiff 的设计（但只有自身来源）；BinDiff、Diaphora、Ghidra Version Tracking、QBinDiff、Matcher、Lumina、BSim、FunctionID 的算法；FabricMC intermediary、Quilt Hashed Mojmap、Mojang mappings 的流程；GumTree、Mergiraf、difftastic、git rename detection 与 range-diff 的机制；GenNm、ReSym、DeMinify、JSNeat、REFORGE、REBENCH 的方法与数字；Swimm 专利、docsync、rustdoc intra-doc links 的机制；esbuild 改名器与 `keepNames` 的实现；本地核实 v0.8.7 没有 `__name` helper。

第一轮三票核实中被否决、本文不采用的数字：JsDeObsBench 关于 LLM 反混淆 97% 语法有效、61% 语义一致、不同混淆类型的分数、长输入退化的三条；JSNice 63% 名字恢复与 81.6% 类型精度（本文只用其方法）；"GumTree 能识别改名与移动的元素"的强说法；"BinDiff 以符号移植为主要工作流"；SourcererCC 的 overlap 公式与前缀过滤细节。

单源、需要验证的部分：astdiff 的匹配精度；Matcher 的 FieldClassifier 权重；Diaphora KOKA hash 的定义；Ghidra Implied Match 的 votes 规则；Stitch 计数器的内部格式；GumTree 原论文的默认参数；humanify-skill、FlowName、JSimplifier、codocia、snippetdrift、Context2Name、LmPa 的自述数字；Swimm 专利中的示例阈值；esbuild 频率序作 tie-breaker 的推论；humanify 作者给出的成本估算。

调研空白：decomp 社区在 ROM 版本之间自动找"哪些函数变了"的工具（mm 项目的文档所在主机不在本会话允许的网络域内）；jadx 跨 apk 版本迁移名字的机制（看起来不存在）；Chromium 的 vendoring 约定一手页面；QBinDiff 是否输出逐对置信度；Piebald 的实际提取器；Sourcegraph Cody 与 GitHub Copilot 的文档漂移功能（无公开资料）；用 .d.ts 签名匹配 bundle 函数的现成工具（未找到）；JS 侧针对原名的 LLM exact-match 数字（不存在，最接近的是二进制侧的 REFORGE 与 JSimplifier 的 100 个样本）。

尚未回答、需要在本仓库上实测的问题：astdiff 的 lineage 匹配相对 `pair_releases.mjs` 加 `confirm_reanchor.mjs` 的命中率与误报率；把 `inferred_daemon.json` 的键改为持久 ID 后，`locals_daemon.json`、`history_daemon.json`、`changelog_daemon.json` 与文档引用的迁移工具链需要多大改动，`committedInSync` 与 `inferredNames` 两个 gate 如何调整；上游是否愿意发布 source map 或开启 `keepNames`。

## 附录 来源

方向一：humanify https://github.com/jehna/humanify 与其 PR 765 https://github.com/jehna/humanify/pull/765 、作者博客 https://thejunkland.com/blog/using-llms-to-reverse-javascript-minification.html ；humanify-skill https://github.com/ajsb85/humanify-skill ；FlowName https://github.com/123wwwa/FlowName ；wakaru https://github.com/pionxzh/wakaru 、支持的输入 https://wakarujs.com/docs/reference/supported-inputs ；webcrack https://github.com/j4k0xb/webcrack 、unminify 概念页 https://webcrack.netlify.app/docs/concepts/unminify.html ；JSNice 论文 https://files.sri.inf.ethz.ch/website/papers/jsnice15.pdf 、CACM 2019 https://cacm.acm.org/magazines/2019/3/234932-predicting-program-properties-from-big-code/fulltext 、UnuglifyJS https://github.com/eth-sri/UnuglifyJS ；JSimplifier https://arxiv.org/html/2512.14070v1 ；CASCADE https://arxiv.org/abs/2507.17691 、JSIR https://github.com/google/jsir ；restringer https://github.com/PerimeterX/restringer ；obfuscator-io-deobfuscator https://github.com/ben-sb/obfuscator-io-deobfuscator ；synchrony https://github.com/uwu/synchrony ；de4js https://github.com/lelinhtinh/de4js ；shapesecurity/unminify https://github.com/shapesecurity/unminify ；投毒标识符研究 https://arxiv.org/abs/2604.04289 ；Terser API https://terser.org/docs/api-reference/ 。

方向二：BinDiff https://github.com/google/bindiff/blob/main/docs/concepts.md ；Diaphora https://github.com/joxeankoret/diaphora/blob/master/diaphora_heuristics.py 、wiki https://github.com/joxeankoret/diaphora/wiki/Heuristics-and-their-explanation 与 https://github.com/joxeankoret/diaphora/wiki/Matching-Strategy ；Ghidra Version Tracking https://ghidradocs.com/11.1_PUBLIC/help/VersionTracking/help/topics/VersionTrackingPlugin/VT_Correlators.html 与 VT_Workflow.html ；QBinDiff https://github.com/quarkslab/qbindiff ；Lumina https://docs.hex-rays.com/add-ons/lumina/overview ；BSim https://blog.quarkslab.com/bsim-explained-once-and-for-all.html ；FunctionID https://www.github.com/NationalSecurityAgency/ghidra/blob/master/Ghidra/Features/FunctionID/data/building_fid.txt ；radare2 zignatures https://book.rada.re/signatures/zignatures.html ；astdiff https://github.com/shcv/astdiff 与 https://github.com/shcv/astdiff/blob/master/docs/lineage.org ；GumTree https://github.com/GumTreeDiff/gumtree 、超参数研究 https://ar5iv.labs.arxiv.org/html/2011.10268 ；Mergiraf https://mergiraf.org/architecture.html ；difftastic https://difftastic.wilfred.me.uk/diffing.html ；SourcererCC https://arxiv.org/pdf/1512.06448.pdf ；NiCad https://www.cs.usask.ca/~croy/papers/2008/RC_ICPC08_NICAD.pdf ；jscpd https://github.com/kucherenko/jscpd ；Weisfeiler-Lehman https://blog.quarkslab.com/weisfeiler-lehman-graph-kernel-for-binary-function-analysis.html 与 https://riverloopsecurity.com/blog/2019/11/binary-hashing-intro/ ；InferCode https://arxiv.org/pdf/2012.07023 ；git diffcore https://git-scm.com/docs/gitdiffcore 、diffcore-delta 源码 https://raw.githubusercontent.com/git/git/master/diffcore-delta.c 、range-diff https://git-scm.com/docs/git-range-diff ；0xdevalias 指纹笔记 https://gist.github.com/0xdevalias/d8b743efb82c0e9406fc69da0d6c6581 与 https://gist.github.com/0xdevalias/31c6574891db3e36f15069b859065267 、wakaru issue 74 https://github.com/pionxzh/wakaru/issues/74 。

方向三：FabricMC 更新 Yarn 教程 https://wiki.fabricmc.net/tutorial:updating_yarn ；intermediary https://github.com/FabricMC/intermediary ；Matcher 源码 https://github.com/sfPlayer1/Matcher （matcher-core 的 Matcher.java 与 MatchesIo.java，matcher-model 的 ClassClassifier.java、MethodClassifier.java、ClassifierUtil.java、ClassifierLevel.java）；FabricMC 2025-10 公告 https://fabricmc.net/2025/10/31/obfuscation.html ；Quilt RFC 19 https://raw.githubusercontent.com/QuiltMC/rfcs/main/rfc/0019-hashed-mojmap.md 、mappings-hasher https://github.com/QuiltMC/mappings-hasher ；Mojang mappings 说明 https://neoforged.net/personal/sciwhiz12/what-are-mappings/ ；Enigma https://wiki.fabricmc.net/documentation:enigma ；Parchment https://parchmentmc.org/faq ；jadx https://github.com/skylot/jadx ；asm-differ https://github.com/simonlindholm/asm-differ ；objdiff https://github.com/encounter/objdiff ；ido-static-recomp https://wiki.decomp.dev/compilers/ido ；chatgpt-source-watch https://github.com/0xdevalias/chatgpt-source-watch ；claude-code-system-prompts https://github.com/Piebald-AI/claude-code-system-prompts ；cchistory https://github.com/badlogic/cchistory ；claude-code-changelog https://github.com/marckrenn/claude-code-changelog ；tweakcc 的 patch-creation skill https://github.com/Piebald-AI/tweakcc ；Discord-Datamining https://github.com/Discord-Datamining/Discord-Datamining ；Debian maint-guide https://www.debian.org/doc/manuals/maint-guide/update.en.html ；Firefox vendoring https://firefox-source-docs.mozilla.org/mozbuild/vendor/index.html 。

方向四：JSNaughty https://www.cs.ucdavis.edu/~devanbu/jsnaughty.pdf ；Context2Name https://arxiv.org/abs/1809.05193 ；JSNeat https://arxiv.org/abs/1906.03488 与 https://github.com/saodem74/RecoverJSName-JSNeat ；DeMinify https://aashishyadavally.github.io/assets/pdf/pub-esecfse2023-(1).pdf ；DIRE https://github.com/CMUSTRUDEL/DIRE ；DIRTY https://github.com/CMUSTRUDEL/DIRTY ；VarBERT https://github.com/sefcom/VarBERT ；VarCLR https://github.com/squaresLab/VarCLR ；ReSym https://www.cs.purdue.edu/homes/lintan/publications/resym-ccs24.pdf 与 https://github.com/lt-asset/resym ；GenNm https://cs.purdue.edu/homes/lintan/publications/gennm-ndss25.pdf 与 https://github.com/XZ-X/gennm-ndss-ae ；LmPa https://arxiv.org/abs/2306.02546v1 ；Nero https://github.com/tech-srl/nero ；SymLM https://zhiqlin.github.io/file/CCS22d.pdf ；DeepTyper https://discovery-pp.ucl.ac.uk/id/eprint/10066386/1/Barr_fse2018-j2t.pdf ；LambdaNet https://github.com/MrVPlusOne/lambdanet ；OpenTau https://github.com/GammaTauAI/opentau ；TypeScript 对 JS 的类型检查 https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html 、从 JS 生成 .d.ts https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html ；dts-gen https://www.npmjs.com/package/dts-gen ；ts-migrate https://github.com/airbnb/ts-migrate ；source map Scopes 提案 https://github.com/tc39/source-map-rfc/pull/53/files 、Chrome 的解码库 https://jsr.io/@chrome-devtools/source-map-scopes-codec/1.0.0/README.md 、DevTools RFC https://github.com/ChromeDevTools/rfcs/discussions/9 ；JsDeObsBench https://arxiv.org/html/2506.20170 与 https://github.com/Ch3nYe/JsDeObsBench 、humanify issue 539 https://github.com/jehna/humanify/issues/539 ；REFORGE https://arxiv.org/pdf/2607.07738 ；REBENCH https://arxiv.org/pdf/2604.27319 。

方向五：Swimm Auto-sync https://docs.swimm.io/features/keep-docs-updated-with-auto-sync/ 、博客 https://swimm.io/blog/how-does-swimm-s-auto-sync-feature-work 、专利 https://patents.google.com/patent/US11847444B2/en 与 https://patents.google.com/patent/US20250138817A1/en ；docsync https://github.com/ubgo/docsync ；codocia https://docs.rs/crate/codocia/latest/source/README.md ；snippetdrift https://pypi.org/project/snippetdrift/ ；Mintlify Autopilot https://www.mintlify.com/blog/docs-on-autopilot ；Doc Detective https://github.com/doc-detective/doc-detective ；rustdoc intra-doc links https://doc.rust-lang.org/rustdoc/write-documentation/linking-to-items-by-name.html ；Sphinx literalinclude https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html ；embedme https://www.npmjs.com/package/embedme ；cog https://cog.readthedocs.io/en/latest/running.html ；DocPrism https://arxiv.org/abs/2511.00215 ；RepoAgent https://arxiv.org/pdf/2402.16667 ；RepoDoc https://arxiv.org/abs/2604.26523 ；ICSME 2023 过期文档研究 https://arxiv.org/abs/2307.04291 ；SCIP https://github.com/sourcegraph/scip/blob/main/docs/scip.md ；Kythe https://kythe.io/docs/kythe-storage.html ；api-extractor declaration references https://api-extractor.com/pages/tsdoc/declaration_references/ ；cargo-public-api https://github.com/cargo-public-api/cargo-public-api ；japicmp https://github.com/siom79/japicmp 。

esbuild：API 文档 https://esbuild.github.io/api/ ；renamer 源码 https://raw.githubusercontent.com/evanw/esbuild/main/internal/renamer/renamer.go ；ast.go https://raw.githubusercontent.com/evanw/esbuild/main/internal/ast/ast.go ；runtime.go https://raw.githubusercontent.com/evanw/esbuild/main/internal/runtime/runtime.go ；issue 543 https://github.com/evanw/esbuild/issues/543 、issue 1846 https://github.com/evanw/esbuild/issues/1846 、issue 2149 https://github.com/evanw/esbuild/issues/2149 。
