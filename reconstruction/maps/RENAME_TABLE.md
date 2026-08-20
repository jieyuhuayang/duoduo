# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `daemon.pretty.js`。

共 139 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.7.1。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `i5e` | `daemonRestartReasonPath` | inferred | 50233 |
| `Ece` | `claimDaemonRestartReason` | inferred | 50236 |
| `Tce` | `setPendingRestartReason` | inferred | 50260 |
| `Ice` | `getPendingRestartReason` | inferred | 50264 |
| `Sst` | `createDaemon` | __export | 81955 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `dn` | `createSpineEvent` | inferred | 31240 |
| `Z6e` | `atomicWriteFileSync` | inferred | 31247 |
| `fn` | `atomicAppendEvent` | inferred | 31282 |
| `zc` | `readEventByIdSeek` | inferred | 31314 |
| `Ya` | `advanceConsumerWatermark` | inferred | 32105 |
| `Lte` | `computeDedupKey` | inferred | 78532 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `MI` | `DAEMON_TOKEN_ENV_KEY` | __export | 58687 |
| `coe` | `appendBeforeExecuteGateway` | inferred | 78864 |
| `vst` | `isLoopbackBindHost` | __export | 81922 |
| `wst` | `resolveRemoteListenerConfig` | __export | 81929 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Ete` | `rehydrateSessionState` | inferred | 31601 |
| `j1` | `readAllSessionSummaries` | __export | 36006 |
| `Lme` | `archiveLegacyRegistrySessionsDir` | __export | 61003 |
| `Nhe` | `drainSessionMailbox` | inferred | 62309 |
| `SC` | `computeInstructionsFingerprint` | __export | 74084 |
| `A_e` | `computeNonBoardInstructionsFingerprint` | __export | 74093 |
| `aot` | `computeMissionFingerprint` | __export | 74133 |
| `LB` | `runInstructionsFingerprintGuard` | __export | 74138 |
| `lot` | `runMissionFingerprintGuard` | __export | 74285 |
| `fot` | `createSessionManager` | __export | 74339 |
| `wC` | `SESSION_SCHEMA_VERSION` | __export | 77286 |
| `Iot` | `createMetaSession` | __export | 77533 |
| `Pot` | `sweepTombstonedSessionRecords` | __export | 78008 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `mb` | `resolveMetaPromptText` | __export | 49198 |
| `$ue` | `renderJobMissionBlock` | __export | 49209 |
| `Aue` | `renderPromptLayers` | __export | 49215 |
| `Pm` | `buildSystemPromptForChannelConfig` | __export | 49241 |
| `Xpe` | `extractSystemPromptAppend` | __export | 58829 |
| `yhe` | `renderDaemonRestartHint` | inferred | 62102 |
| `Lhe` | `buildTransientUserBlocks` | inferred | 63657 |
| `S_e` | `transcludeBroadcastBoard` | inferred | 73802 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `M1` | `drainRecordPath` | __export | 35910 |
| `od` | `appendDrainRecord` | __export | 35913 |
| `su` | `readDrainRecords` | __export | 35920 |
| `id` | `summarizeDrainRecords` | __export | 35941 |
| `L1` | `readGlobalUsageTotals` | __export | 36023 |
| `PGe` | `readRecentDrainRecords` | __export | 36041 |
| `Ype` | `computeCodexTurnUsage` | __export | 58805 |
| `r4` | `batchDrainItems` | inferred | 63798 |
| `zd` | `handleDrainError` | inferred | 64203 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Iue` | `splitDisallowedToolsForClaude` | __export | 49079 |
| `db` | `isAgentSdkTurnInterruptedError` | __export | 49089 |
| `fb` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 49093 |
| `Cue` | `probeClaudeAvailability` | __export | 49119 |
| `SU` | `isClaudeAvailable` | __export | 49149 |
| `pb` | `claudeUnavailableReason` | __export | 49153 |
| `E9e` | `primeClaudeAvailability` | __export | 49156 |
| `R9e` | `__resetClaudeProbeCacheForTest` | __export | 49160 |
| `T9e` | `__setClaudeVerifierForTest` | __export | 49164 |
| `Oue` | `verifyClaudeCodeRuntimeAvailable` | __export | 49168 |
| `bU` | `parsePositiveMsEnv` | __export | 49317 |
| `Su` | `createAgentSdkAdapter` | __export | 49323 |
| `oo` | `AgentSdkPromptNotAcceptedAbortError` | __export | 49739 |
| `ii` | `AgentSdkTurnInterruptedError` | __export | 49739 |
| `Im` | `CLAUDE_CORE_TOOLS` | __export | 49739 |
| `que` | `mergeClaudeToolLists` | inferred | 49873 |
| `RU` | `applyJobSdkConfigOverride` | inferred | 49967 |
| `Hpe` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 58616 |
| `b2` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 58687 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Mb` | `isCodexAvailable` | __export | 58734 |
| `NXe` | `codexUnavailableReason` | __export | 58738 |
| `DXe` | `primeCodexAvailability` | __export | 58741 |
| `MXe` | `__setCodexAvailabilityForTests` | __export | 58746 |
| `th` | `resolveCodexSandbox` | __export | 58750 |
| `Mu` | `checkCodexAvailability` | __export | 58754 |
| `I2` | `ensureAgentsMdSymlink` | __export | 58791 |
| `Kpe` | `codexNotificationFilterDecision` | __export | 58801 |
| `Qpe` | `buildBaseInstructions` | __export | 58833 |
| `eme` | `buildDeveloperInstructions` | __export | 58851 |
| `E2` | `buildCodexTurnInput` | __export | 58865 |
| `jb` | `createCodexAppServerAdapter` | __export | 58878 |
| `nme` | `hasImageGenerationRecord` | __export | 59394 |
| `rme` | `extractCodexGeneratedImageAttachment` | __export | 59410 |
| `zI` | `ALADUO_TOOL_NAMESPACE` | __export | 59649 |
| `cQe` | `generatePartitionCodexAgents` | __export | 60877 |
| `Nme` | `parseAgentMarkdown` | __export | 60951 |
| `Dme` | `renderAgentToml` | __export | 60966 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `vU` | `PARTITION_CORE_TOOLS` | __export | 49739 |
| `Cot` | `enqueueCadenceItem` | __export | 78074 |
| `Z_e` | `mergeCadenceInbox` | __export | 78081 |
| `G_e` | `parseCadenceQueue` | __export | 78113 |
| `Oot` | `markCadenceItemsDone` | __export | 78122 |
| `$ot` | `runCadenceTick` | __export | 78130 |
| `BB` | `scanAndSpawnDueJobs` | __export | 78168 |
| `Mot` | `createJobScheduler` | __export | 78310 |
| `Lot` | `createOutboxDeliveryManager` | __export | 78373 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Dd` | `partitionInboxDir` | __export | 56928 |
| `Wm` | `partitionInboxDirFromVar` | __export | 56932 |
| `$u` | `resolveMemoryDirs` | inferred | 57174 |
| `Md` | `resolveMemoryLinkTargets` | inferred | 57213 |
| `q7e` | `runBoardLint` | inferred | 57529 |
| `Km` | `collectMemoryLinks` | inferred | 57571 |
| `Ym` | `walkReachableMemory` | inferred | 57586 |
| `hpe` | `runGapLint` | inferred | 57869 |
| `bpe` | `detectOrphanMemory` | inferred | 57965 |
| `wpe` | `forgetMemoryEntry` | inferred | 57997 |
| `u2` | `routeContractDecision` | inferred | 58100 |
| `DI` | `enforceContractGate` | inferred | 58258 |
| `g2` | `resolveMemoryCheckFlags` | __export | 58360 |
| `y2` | `buildMemoryCheckStatus` | __export | 58369 |
| `_Xe` | `runMemoryCheckTick` | __export | 58383 |
| `$_e` | `computeBoardLayerHash` | __export | 74089 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `R7e` | `resolveRuntimePaths` | __export | 56839 |
| `jI` | `parseDotEnv` | __export | 58519 |
| `dl` | `hostDotEnvPath` | __export | 58534 |
| `w2` | `clearHostModelEnvVars` | __export | 58597 |
| `qpe` | `applyHostModelEnvVars` | __export | 58601 |
| `Bpe` | `writeHostModelEnvConfig` | __export | 58604 |
| `Vpe` | `clearHostModelEnvConfig` | __export | 58629 |
| `EXe` | `readHostDaemonToken` | __export | 58640 |
| `RXe` | `writeHostDaemonToken` | __export | 58652 |
| `Wpe` | `readHostDotEnvFile` | __export | 58665 |
| `TXe` | `loadHostDotEnv` | __export | 58674 |
| `v2` | `HOST_MODEL_ENV_KEYS` | __export | 58687 |
| `SQe` | `initializeRuntime` | __export | 61175 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `BI` | `isGrokAvailable` | __export | 59898 |
| `HXe` | `grokUnavailableReason` | __export | 59902 |
| `VXe` | `primeGrokAvailability` | __export | 59905 |
| `WXe` | `__setGrokAvailabilityForTests` | __export | 59910 |
| `ju` | `checkGrokAvailability` | __export | 59913 |
| `Lu` | `grokAcpExtMethod` | __export | 59955 |
| `vme` | `pickGrokRewindPromptIndex` | __export | 59960 |
| `wme` | `parseGrokRewindPoints` | __export | 59967 |
| `zb` | `createGrokAcpAdapter` | __export | 60104 |
| `mme` | `GROK_ACP_COMPACT` | __export | 60700 |
| `fme` | `GROK_ACP_EXT_PREFIX` | __export | 60700 |
| `gme` | `GROK_ACP_REWIND_EXECUTE` | __export | 60700 |
| `hme` | `GROK_ACP_REWIND_POINTS` | __export | 60700 |
| `pme` | `GROK_ACP_SDK_CALL` | __export | 60700 |
| `dme` | `GROK_AGENT_PROFILE` | __export | 60700 |
| `cme` | `GROK_DISALLOWED_TOOLS` | __export | 60700 |
| `yme` | `GROK_MCP_SDK_META` | __export | 60700 |
| `_me` | `GROK_MCP_SERVERS_META` | __export | 60700 |
| `bme` | `GROK_MCP_SERVER_NAME` | __export | 60700 |
