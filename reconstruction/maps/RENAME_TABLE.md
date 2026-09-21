# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `daemon.pretty.js`。

共 150 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.2。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Rut` | `daemonRestartReasonPath` | inferred | 65783 |
| `Fbe` | `claimDaemonRestartReason` | inferred | 65786 |
| `zbe` | `setPendingRestartReason` | inferred | 65812 |
| `Ube` | `getPendingRestartReason` | inferred | 65816 |
| `_yt` | `deliverDaemonRestartWakes` | __export | 89658 |
| `Ayt` | `createDaemon` | __export | 90421 |
| `Nyt` | `main` | __export | 91451 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `on` | `createSpineEvent` | inferred | 32001 |
| `Z9e` | `atomicWriteFileSync` | inferred | 32008 |
| `sn` | `atomicAppendEvent` | inferred | 32043 |
| `Y9e` | `readEventByIdSeek` | inferred | 32078 |
| `Q9e` | `isUsableEventIndexEntry` | inferred | 32119 |
| `Nu` | `advanceConsumerWatermark` | inferred | 32858 |
| `vse` | `computeDedupKey` | inferred | 86887 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `cO` | `DAEMON_TOKEN_ENV_KEY` | __export | 68923 |
| `Gle` | `appendBeforeExecuteGateway` | inferred | 87194 |
| `$yt` | `isLoopbackBindHost` | __export | 90388 |
| `Oyt` | `resolveRemoteListenerConfig` | __export | 90395 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `cse` | `rehydrateSessionState` | inferred | 32340 |
| `aU` | `readAllSessionSummaries` | __export | 36855 |
| `rSe` | `archiveLegacyRegistrySessionsDir` | __export | 69374 |
| `GSe` | `drainSessionMailbox` | inferred | 70374 |
| `Xg` | `SESSION_SCHEMA_VERSION` | __export | 80253 |
| `LS` | `computeInstructionsFingerprint` | __export | 82330 |
| `lJ` | `computeNonBoardInstructionsFingerprint` | __export | 82339 |
| `$A` | `diffStreamingConfigSignature` | __export | 82346 |
| `KEe` | `computeMissionFingerprint` | __export | 82379 |
| `OA` | `runInstructionsFingerprintGuard` | __export | 82384 |
| `Tgt` | `createSessionManager` | __export | 83621 |
| `Ugt` | `createMetaSession` | __export | 85799 |
| `qgt` | `sweepTombstonedSessionRecords` | __export | 86383 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Xv` | `resolveMetaPromptText` | __export | 55069 |
| `Ohe` | `renderJobMissionBlock` | __export | 55086 |
| `Ahe` | `renderPromptLayers` | __export | 55093 |
| `Wh` | `buildSystemPromptForChannelConfig` | __export | 55120 |
| `zye` | `extractSystemPromptAppend` | __export | 61925 |
| `Bbe` | `renderDaemonRestartHint` | inferred | 65853 |
| `QSe` | `buildTransientUserBlocks` | inferred | 71662 |
| `HEe` | `transcludeBroadcastBoard` | inferred | 82179 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `sU` | `detectInProcessBreak` | __export | 36733 |
| `za` | `drainRecordPath` | __export | 36745 |
| `Qd` | `appendDrainRecord` | __export | 36748 |
| `Bm` | `readDrainRecords` | __export | 36767 |
| `Cb` | `summarizeDrainRecords` | __export | 36845 |
| `uU` | `readGlobalUsageTotals` | __export | 36872 |
| `PXe` | `readRecentDrainRecords` | __export | 36889 |
| `Dle` | `IN_PROCESS_BREAK_HIT_RATIO_FLOOR` | __export | 36906 |
| `Hh` | `isAbortLikeError` | __export | 54968 |
| `Fye` | `computeCodexTurnUsage` | __export | 61901 |
| `xH` | `batchDrainItems` | inferred | 71801 |
| `Xw` | `handleDrainError` | inferred | 72231 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Ihe` | `findDeadAllowedToolEntries` | __export | 54945 |
| `The` | `splitDisallowedToolsForClaude` | __export | 54950 |
| `Gv` | `isAgentSdkTurnInterruptedError` | __export | 54960 |
| `Kv` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 54964 |
| `Che` | `probeClaudeAvailability` | __export | 54990 |
| `hB` | `isClaudeAvailable` | __export | 55020 |
| `Yv` | `claudeUnavailableReason` | __export | 55024 |
| `yrt` | `primeClaudeAvailability` | __export | 55027 |
| `_rt` | `__resetClaudeProbeCacheForTest` | __export | 55031 |
| `brt` | `__setClaudeVerifierForTest` | __export | 55035 |
| `$he` | `verifyClaudeCodeRuntimeAvailable` | __export | 55039 |
| `gB` | `eventToMessageGenerator` | __export | 55158 |
| `_C` | `stringToMessageGenerator` | __export | 55186 |
| `fB` | `parsePositiveMsEnv` | __export | 55196 |
| `Ef` | `createAgentSdkAdapter` | __export | 55213 |
| `Ir` | `AgentSdkPromptNotAcceptedAbortError` | __export | 55516 |
| `Ur` | `AgentSdkTurnInterruptedError` | __export | 55516 |
| `Vh` | `CLAUDE_CORE_TOOLS` | __export | 55516 |
| `nbe` | `mergeClaudeToolLists` | inferred | 65455 |
| `GV` | `applyJobSdkConfigOverride` | inferred | 65585 |
| `$we` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 68854 |
| `Z6` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 68923 |
| `uH` | `classifyModelContextRequirement` | inferred | 69703 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Nf` | `isCodexAvailable` | __export | 61830 |
| `Rst` | `codexUnavailableReason` | __export | 61834 |
| `Ist` | `primeCodexAvailability` | __export | 61837 |
| `Tst` | `__setCodexAvailabilityForTests` | __export | 61842 |
| `sg` | `resolveCodexSandbox` | __export | 61846 |
| `Sc` | `checkCodexAvailability` | __export | 61850 |
| `RV` | `ensureAgentsMdSymlink` | __export | 61887 |
| `Lye` | `codexNotificationFilterDecision` | __export | 61897 |
| `Uye` | `buildBaseInstructions` | __export | 61929 |
| `qye` | `buildDeveloperInstructions` | __export | 61947 |
| `kV` | `buildCodexTurnInput` | __export | 61961 |
| `yw` | `createCodexAppServerAdapter` | __export | 61974 |
| `Vye` | `hasImageGenerationRecord` | __export | 62460 |
| `Hye` | `extractCodexGeneratedImageAttachment` | __export | 62476 |
| `Zye` | `mapItemStartedToExecEvent` | __export | 62535 |
| `Gye` | `mapItemCompletedToExecEvent` | __export | 62646 |
| `u$` | `ALADUO_TOOL_NAMESPACE` | __export | 62719 |
| `fdt` | `generatePartitionCodexAgents` | __export | 69248 |
| `Qwe` | `parseAgentMarkdown` | __export | 69322 |
| `eSe` | `renderAgentToml` | __export | 69337 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `pB` | `PARTITION_CORE_TOOLS` | __export | 55516 |
| `O_e` | `classifyConsumerStaleness` | inferred | 64843 |
| `BV` | `resolveNotifyUnconsumedHours` | inferred | 64856 |
| `P$` | `evaluateNotifyConsumerRefusal` | inferred | 64870 |
| `qat` | `listSessionsWithRecentConsumer` | inferred | 64893 |
| `C$` | `renderNotifyRefusalMessage` | inferred | 64919 |
| `Swe` | `resolveCadenceIntervalMs` | __export | 68555 |
| `Bgt` | `runCadenceTick` | __export | 86443 |
| `gJ` | `scanAndSpawnDueJobs` | __export | 86474 |
| `Wgt` | `createJobScheduler` | __export | 86635 |
| `Zgt` | `createOutboxDeliveryManager` | __export | 86706 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `qw` | `partitionInboxDir` | __export | 66178 |
| `Rc` | `partitionInboxDirFromVar` | __export | 66182 |
| `Di` | `resolveMemoryDirs` | inferred | 66482 |
| `Ff` | `resolveMemoryLinkTargets` | inferred | 66521 |
| `plt` | `runBoardLint` | inferred | 66835 |
| `Tc` | `collectMemoryLinks` | inferred | 66869 |
| `Pc` | `walkReachableMemory` | inferred | 66884 |
| `iO` | `enforceContractGate` | inferred | 67346 |
| `Hlt` | `runGapLint` | inferred | 67679 |
| `hwe` | `detectOrphanMemory` | inferred | 68372 |
| `ywe` | `forgetMemoryEntry` | inferred | 68404 |
| `U6` | `routeContractDecision` | inferred | 68509 |
| `H6` | `resolveMemoryCheckFlags` | __export | 68546 |
| `W6` | `buildMemoryCheckStatus` | __export | 68562 |
| `Lct` | `runMemoryCheckTick` | __export | 68576 |
| `uJ` | `computeBoardLayerHash` | __export | 82335 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Jut` | `resolveRuntimePaths` | __export | 66093 |
| `dO` | `parseDotEnv` | __export | 68757 |
| `Ku` | `hostDotEnvPath` | __export | 68772 |
| `K6` | `clearHostModelEnvVars` | __export | 68835 |
| `Pwe` | `applyHostModelEnvVars` | __export | 68839 |
| `Cwe` | `writeHostModelEnvConfig` | __export | 68842 |
| `Owe` | `clearHostModelEnvConfig` | __export | 68867 |
| `Hct` | `readHostDaemonToken` | __export | 68878 |
| `Wct` | `writeHostDaemonToken` | __export | 68890 |
| `Awe` | `readHostDotEnvFile` | __export | 68901 |
| `Jct` | `loadHostDotEnv` | __export | 68910 |
| `G6` | `HOST_MODEL_ENV_KEYS` | __export | 68923 |
| `Sdt` | `initializeRuntime` | __export | 69546 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `$V` | `isGrokAvailable` | __export | 62958 |
| `Dst` | `grokUnavailableReason` | __export | 62962 |
| `Mst` | `primeGrokAvailability` | __export | 62965 |
| `jst` | `__setGrokAvailabilityForTests` | __export | 62970 |
| `kc` | `checkGrokAvailability` | __export | 62973 |
| `bw` | `grokAcpExtMethod` | __export | 62994 |
| `Vst` | `mapGrokUsageToDrainUsage` | inferred | 63059 |
| `vw` | `createGrokAcpAdapter` | __export | 63118 |
| `t_e` | `GROK_ACP_COMPACT` | __export | 63676 |
| `Qye` | `GROK_ACP_EXT_PREFIX` | __export | 63676 |
| `e_e` | `GROK_ACP_SDK_CALL` | __export | 63676 |
| `Xye` | `GROK_AGENT_PROFILE` | __export | 63676 |
| `Yye` | `GROK_DISALLOWED_TOOLS` | __export | 63676 |
| `n_e` | `GROK_MCP_SDK_META` | __export | 63676 |
| `r_e` | `GROK_MCP_SERVERS_META` | __export | 63676 |
| `i_e` | `GROK_MCP_SERVER_NAME` | __export | 63676 |
