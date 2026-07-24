# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `daemon.pretty.js`。

共 101 个一等公民符号，覆盖 11 个子系统。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `tet` | `createDaemon` | __export | 78107 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Xt` | `createSpineEvent` | inferred | 30946 |
| `Tqe` | `atomicWriteFileSync` | inferred | 30954 |
| `Qt` | `atomicAppendEvent` | inferred | 30991 |
| `nl` | `readEventByIdSeek` | inferred | 31023 |
| `ma` | `advanceConsumerWatermark` | inferred | 31851 |
| `YX` | `computeDedupKey` | inferred | 75649 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Sne` | `appendBeforeExecuteGateway` | inferred | 76019 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `MX` | `rehydrateSessionState` | inferred | 31306 |
| `C1` | `readAllSessionSummaries` | __export | 35405 |
| `Tle` | `archiveLegacyRegistrySessionsDir` | __export | 58974 |
| `cde` | `drainSessionMailbox` | inferred | 60019 |
| `u2` | `computeInstructionsFingerprint` | __export | 71881 |
| `YXe` | `computeMissionFingerprint` | __export | 71888 |
| `l2` | `runInstructionsFingerprintGuard` | __export | 71894 |
| `XXe` | `runMissionFingerprintGuard` | __export | 71988 |
| `nQe` | `createSessionManager` | __export | 72045 |
| `PI` | `SESSION_SCHEMA_VERSION` | __export | 74408 |
| `_Qe` | `createMetaSession` | __export | 74659 |
| `vQe` | `sweepTombstonedSessionRecords` | __export | 75105 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `b_` | `resolveMetaPromptText` | __export | 57166 |
| `tle` | `renderJobMissionBlock` | __export | 57178 |
| `WT` | `buildSystemPromptForChannelConfig` | __export | 57184 |
| `ole` | `extractSystemPromptAppend` | __export | 57844 |
| `fde` | `buildTransientUserBlocks` | inferred | 61154 |
| `Ype` | `transcludeBroadcastBoard` | inferred | 71600 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `O1` | `drainRecordPath` | __export | 35314 |
| `_l` | `appendDrainRecord` | __export | 35318 |
| `Mf` | `readDrainRecords` | __export | 35325 |
| `yl` | `summarizeDrainRecords` | __export | 35345 |
| `A1` | `readGlobalUsageTotals` | __export | 35423 |
| `lHe` | `readRecentDrainRecords` | __export | 35442 |
| `ile` | `computeCodexTurnUsage` | __export | 57820 |
| `IU` | `batchDrainItems` | inferred | 61297 |
| `oR` | `handleDrainError` | inferred | 61621 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `wo` | `AgentSdkPromptNotAcceptedAbortError` | __export | ? |
| `Fs` | `AgentSdkTurnInterruptedError` | __export | ? |
| `vL` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | ? |
| `Doe` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 43895 |
| `y_` | `isAgentSdkTurnInterruptedError` | __export | 57055 |
| `__` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 57059 |
| `Que` | `probeClaudeAvailability` | __export | 57086 |
| `oU` | `isClaudeAvailable` | __export | 57115 |
| `v_` | `claudeUnavailableReason` | __export | 57119 |
| `W9e` | `primeClaudeAvailability` | __export | 57123 |
| `J9e` | `__resetClaudeProbeCacheForTest` | __export | 57127 |
| `G9e` | `__setClaudeVerifierForTest` | __export | 57131 |
| `ele` | `verifyClaudeCodeRuntimeAvailable` | __export | 57135 |
| `rU` | `parsePositiveMsEnv` | __export | 57289 |
| `Xc` | `createAgentSdkAdapter` | __export | 57295 |
| `g_` | `DEFAULT_DISALLOWED_TOOLS` | __export | 57700 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `w_` | `isCodexAvailable` | __export | 57746 |
| `nKe` | `codexUnavailableReason` | __export | 57750 |
| `rKe` | `primeCodexAvailability` | __export | 57754 |
| `iKe` | `__setCodexAvailabilityForTests` | __export | 57758 |
| `Gp` | `resolveCodexSandbox` | __export | 57762 |
| `eu` | `checkCodexAvailability` | __export | 57768 |
| `cU` | `ensureAgentsMdSymlink` | __export | 57807 |
| `rle` | `codexNotificationFilterDecision` | __export | 57816 |
| `sle` | `buildBaseInstructions` | __export | 57848 |
| `ale` | `buildDeveloperInstructions` | __export | 57867 |
| `S_` | `createCodexAppServerAdapter` | __export | 57880 |
| `ule` | `hasImageGenerationRecord` | __export | 58390 |
| `lle` | `extractCodexGeneratedImageAttachment` | __export | 58406 |
| `yKe` | `generatePartitionCodexAgents` | __export | 58834 |
| `Sle` | `parseAgentMarkdown` | __export | 58915 |
| `kle` | `renderAgentToml` | __export | 58933 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `bQe` | `enqueueCadenceItem` | __export | 75171 |
| `_me` | `mergeCadenceInbox` | __export | 75178 |
| `vme` | `parseCadenceQueue` | __export | 75215 |
| `wQe` | `markCadenceItemsDone` | __export | 75226 |
| `SQe` | `runCadenceTick` | __export | 75238 |
| `h2` | `scanAndSpawnDueJobs` | __export | 75278 |
| `TQe` | `createJobScheduler` | __export | 75422 |
| `IQe` | `createOutboxDeliveryManager` | __export | 75485 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Il` | `partitionInboxDir` | __export | 42275 |
| `Lx` | `partitionInboxDirFromVar` | __export | 42279 |
| `Ac` | `resolveMemoryDirs` | inferred | 42520 |
| `Pl` | `resolveMemoryLinkTargets` | inferred | 42559 |
| `dJe` | `runBoardLint` | inferred | 42865 |
| `ip` | `collectMemoryLinks` | inferred | 42910 |
| `op` | `walkReachableMemory` | inferred | 42925 |
| `loe` | `runGapLint` | inferred | 43213 |
| `moe` | `detectOrphanMemory` | inferred | 43309 |
| `goe` | `forgetMemoryEntry` | inferred | 43343 |
| `cL` | `routeContractDecision` | inferred | 43449 |
| `pL` | `enforceContractGate` | inferred | 43607 |
| `gL` | `resolveMemoryCheckFlags` | __export | 43654 |
| `yL` | `buildMemoryCheckStatus` | __export | 43663 |
| `UJe` | `runMemoryCheckTick` | __export | 43678 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `GWe` | `resolveRuntimePaths` | __export | 42185 |
| `wL` | `parseDotEnv` | __export | 43795 |
| `Ol` | `hostDotEnvPath` | __export | 43812 |
| `kL` | `clearHostModelEnvVars` | __export | 43875 |
| `Aoe` | `applyHostModelEnvVars` | __export | 43879 |
| `Noe` | `writeHostModelEnvConfig` | __export | 43883 |
| `joe` | `clearHostModelEnvConfig` | __export | 43908 |
| `Loe` | `readHostDotEnvFile` | __export | 43919 |
| `sGe` | `loadHostDotEnv` | __export | 43928 |
| `bL` | `HOST_MODEL_ENV_KEYS` | __export | 43942 |
| `AKe` | `initializeRuntime` | __export | 59220 |

