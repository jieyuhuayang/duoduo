# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `daemon.pretty.js`。

共 151 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.3。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Cut` | `daemonRestartReasonPath` | inferred | 65780 |
| `zbe` | `claimDaemonRestartReason` | inferred | 65783 |
| `Ube` | `setPendingRestartReason` | inferred | 65809 |
| `qbe` | `getPendingRestartReason` | inferred | 65813 |
| `kyt` | `deliverDaemonRestartWakes` | __export | 89682 |
| `Lyt` | `createDaemon` | __export | 90469 |
| `Fyt` | `main` | __export | 91500 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `rn` | `createSpineEvent` | inferred | 32001 |
| `X9e` | `appendEventToPartition` | inferred | 32008 |
| `on` | `atomicAppendEvent` | inferred | 32043 |
| `Md` | `readEventById` | inferred | 32052 |
| `t5e` | `scanPartitionsForEventId` | inferred | 32078 |
| `r5e` | `isUsableEventIndexEntry` | inferred | 32119 |
| `Nu` | `advanceConsumerWatermark` | inferred | 32858 |
| `wse` | `computeDedupKey` | inferred | 86907 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `cO` | `DAEMON_TOKEN_ENV_KEY` | __export | 68920 |
| `Kle` | `appendBeforeExecuteGateway` | inferred | 87214 |
| `Myt` | `isLoopbackBindHost` | __export | 90436 |
| `jyt` | `resolveRemoteListenerConfig` | __export | 90443 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `dse` | `rehydrateSessionState` | inferred | 32340 |
| `uU` | `readAllSessionSummaries` | __export | 36855 |
| `iSe` | `archiveLegacyRegistrySessionsDir` | __export | 69371 |
| `KSe` | `drainSessionMailbox` | inferred | 70371 |
| `Qg` | `SESSION_SCHEMA_VERSION` | __export | 80271 |
| `LS` | `computeInstructionsFingerprint` | __export | 82348 |
| `cJ` | `computeNonBoardInstructionsFingerprint` | __export | 82357 |
| `$A` | `diffStreamingConfigSignature` | __export | 82364 |
| `YEe` | `computeMissionFingerprint` | __export | 82397 |
| `OA` | `runInstructionsFingerprintGuard` | __export | 82402 |
| `Agt` | `createSessionManager` | __export | 83651 |
| `Wgt` | `createMetaSession` | __export | 85819 |
| `Jgt` | `sweepTombstonedSessionRecords` | __export | 86403 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Xv` | `resolveMetaPromptText` | __export | 55069 |
| `Ahe` | `renderJobMissionBlock` | __export | 55086 |
| `Nhe` | `renderPromptLayers` | __export | 55093 |
| `Jh` | `buildSystemPromptForChannelConfig` | __export | 55120 |
| `Uye` | `extractSystemPromptAppend` | __export | 61925 |
| `Vbe` | `renderDaemonRestartHint` | inferred | 65850 |
| `eke` | `buildTransientUserBlocks` | inferred | 71668 |
| `WEe` | `transcludeBroadcastBoard` | inferred | 82197 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `aU` | `detectInProcessBreak` | __export | 36733 |
| `za` | `drainRecordPath` | __export | 36745 |
| `Qd` | `appendDrainRecord` | __export | 36748 |
| `Vm` | `readDrainRecords` | __export | 36767 |
| `Cb` | `summarizeDrainRecords` | __export | 36845 |
| `lU` | `readGlobalUsageTotals` | __export | 36872 |
| `AXe` | `readRecentDrainRecords` | __export | 36889 |
| `Mle` | `IN_PROCESS_BREAK_HIT_RATIO_FLOOR` | __export | 36906 |
| `Wh` | `isAbortLikeError` | __export | 54968 |
| `zye` | `computeCodexTurnUsage` | __export | 61901 |
| `EH` | `batchDrainItems` | inferred | 71807 |
| `Xw` | `handleDrainError` | inferred | 72237 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `The` | `findDeadAllowedToolEntries` | __export | 54945 |
| `Phe` | `splitDisallowedToolsForClaude` | __export | 54950 |
| `Gv` | `isAgentSdkTurnInterruptedError` | __export | 54960 |
| `Kv` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 54964 |
| `$he` | `probeClaudeAvailability` | __export | 54990 |
| `gB` | `isClaudeAvailable` | __export | 55020 |
| `Yv` | `claudeUnavailableReason` | __export | 55024 |
| `wrt` | `primeClaudeAvailability` | __export | 55027 |
| `Srt` | `__resetClaudeProbeCacheForTest` | __export | 55031 |
| `krt` | `__setClaudeVerifierForTest` | __export | 55035 |
| `Ohe` | `verifyClaudeCodeRuntimeAvailable` | __export | 55039 |
| `yB` | `eventToMessageGenerator` | __export | 55158 |
| `_C` | `stringToMessageGenerator` | __export | 55186 |
| `pB` | `parsePositiveMsEnv` | __export | 55196 |
| `Ef` | `createAgentSdkAdapter` | __export | 55213 |
| `Rr` | `AgentSdkPromptNotAcceptedAbortError` | __export | 55516 |
| `Fr` | `AgentSdkTurnInterruptedError` | __export | 55516 |
| `Hh` | `CLAUDE_CORE_TOOLS` | __export | 55516 |
| `rbe` | `mergeClaudeToolLists` | inferred | 65452 |
| `KV` | `applyJobSdkConfigOverride` | inferred | 65582 |
| `Owe` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 68851 |
| `G6` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 68920 |
| `lH` | `classifyModelContextRequirement` | inferred | 69700 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Nf` | `isCodexAvailable` | __export | 61830 |
| `Cst` | `codexUnavailableReason` | __export | 61834 |
| `$st` | `primeCodexAvailability` | __export | 61837 |
| `Ost` | `__setCodexAvailabilityForTests` | __export | 61842 |
| `ag` | `resolveCodexSandbox` | __export | 61846 |
| `Sc` | `checkCodexAvailability` | __export | 61850 |
| `IV` | `ensureAgentsMdSymlink` | __export | 61887 |
| `Fye` | `codexNotificationFilterDecision` | __export | 61897 |
| `qye` | `buildBaseInstructions` | __export | 61929 |
| `Bye` | `buildDeveloperInstructions` | __export | 61947 |
| `xV` | `buildCodexTurnInput` | __export | 61961 |
| `yw` | `createCodexAppServerAdapter` | __export | 61974 |
| `Hye` | `hasImageGenerationRecord` | __export | 62460 |
| `Wye` | `extractCodexGeneratedImageAttachment` | __export | 62476 |
| `Gye` | `mapItemStartedToExecEvent` | __export | 62535 |
| `Kye` | `mapItemCompletedToExecEvent` | __export | 62646 |
| `u$` | `ALADUO_TOOL_NAMESPACE` | __export | 62719 |
| `gdt` | `generatePartitionCodexAgents` | __export | 69245 |
| `eSe` | `parseAgentMarkdown` | __export | 69319 |
| `tSe` | `renderAgentToml` | __export | 69334 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `mB` | `PARTITION_CORE_TOOLS` | __export | 55516 |
| `A_e` | `classifyConsumerStaleness` | inferred | 64840 |
| `VV` | `resolveNotifyUnconsumedHours` | inferred | 64853 |
| `P$` | `evaluateNotifyConsumerRefusal` | inferred | 64867 |
| `Wat` | `listSessionsWithRecentConsumer` | inferred | 64890 |
| `C$` | `renderNotifyRefusalMessage` | inferred | 64916 |
| `kwe` | `resolveCadenceIntervalMs` | __export | 68552 |
| `Zgt` | `runCadenceTick` | __export | 86463 |
| `yJ` | `scanAndSpawnDueJobs` | __export | 86494 |
| `Ygt` | `createJobScheduler` | __export | 86655 |
| `Qgt` | `createOutboxDeliveryManager` | __export | 86726 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `qw` | `partitionInboxDir` | __export | 66175 |
| `Rc` | `partitionInboxDirFromVar` | __export | 66179 |
| `Ai` | `resolveMemoryDirs` | inferred | 66479 |
| `Ff` | `resolveMemoryLinkTargets` | inferred | 66518 |
| `ylt` | `runBoardLint` | inferred | 66832 |
| `Tc` | `createMemorySlugReader` | inferred | 66866 |
| `Pc` | `walkReachableMemory` | inferred | 66881 |
| `iO` | `enforceContractGate` | inferred | 67343 |
| `Glt` | `runGapLint` | inferred | 67676 |
| `gwe` | `detectOrphanMemory` | inferred | 68369 |
| `_we` | `forgetMemoryEntry` | inferred | 68401 |
| `q6` | `routeContractDecision` | inferred | 68506 |
| `W6` | `resolveMemoryCheckFlags` | __export | 68543 |
| `J6` | `buildMemoryCheckStatus` | __export | 68559 |
| `qct` | `runMemoryCheckTick` | __export | 68573 |
| `lJ` | `computeBoardLayerHash` | __export | 82353 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Yut` | `resolveRuntimePaths` | __export | 66090 |
| `dO` | `parseDotEnv` | __export | 68754 |
| `Ku` | `hostDotEnvPath` | __export | 68769 |
| `Y6` | `clearHostModelEnvVars` | __export | 68832 |
| `Cwe` | `applyHostModelEnvVars` | __export | 68836 |
| `$we` | `writeHostModelEnvConfig` | __export | 68839 |
| `Awe` | `clearHostModelEnvConfig` | __export | 68864 |
| `Gct` | `readHostDaemonToken` | __export | 68875 |
| `Kct` | `writeHostDaemonToken` | __export | 68887 |
| `Nwe` | `readHostDotEnvFile` | __export | 68898 |
| `Yct` | `loadHostDotEnv` | __export | 68907 |
| `K6` | `HOST_MODEL_ENV_KEYS` | __export | 68920 |
| `Rdt` | `initializeRuntime` | __export | 69543 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `OV` | `isGrokAvailable` | __export | 62958 |
| `Fst` | `grokUnavailableReason` | __export | 62962 |
| `zst` | `primeGrokAvailability` | __export | 62965 |
| `Ust` | `__setGrokAvailabilityForTests` | __export | 62970 |
| `kc` | `checkGrokAvailability` | __export | 62973 |
| `bw` | `grokAcpExtMethod` | __export | 62994 |
| `Zst` | `mapGrokUsageToDrainUsage` | inferred | 63059 |
| `vw` | `createGrokAcpAdapter` | __export | 63118 |
| `n_e` | `GROK_ACP_COMPACT` | __export | 63676 |
| `e_e` | `GROK_ACP_EXT_PREFIX` | __export | 63676 |
| `t_e` | `GROK_ACP_SDK_CALL` | __export | 63676 |
| `Qye` | `GROK_AGENT_PROFILE` | __export | 63676 |
| `Xye` | `GROK_DISALLOWED_TOOLS` | __export | 63676 |
| `r_e` | `GROK_MCP_SDK_META` | __export | 63676 |
| `i_e` | `GROK_MCP_SERVERS_META` | __export | 63676 |
| `o_e` | `GROK_MCP_SERVER_NAME` | __export | 63676 |
