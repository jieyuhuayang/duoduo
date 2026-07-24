# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `daemon.pretty.js`。

共 105 个一等公民符号，覆盖 11 个子系统。基于 `@openduo/duoduo` v0.6.1。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Wet` | `createDaemon` | __export | 78027 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `nn` | `createSpineEvent` | inferred | 30659 |
| `d2e` | `atomicWriteFileSync` | inferred | 30666 |
| `rn` | `atomicAppendEvent` | inferred | 30701 |
| `ml` | `readEventByIdSeek` | inferred | 30733 |
| `Oa` | `advanceConsumerWatermark` | inferred | 31524 |
| `hX` | `computeDedupKey` | inferred | 75173 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Cne` | `appendBeforeExecuteGateway` | inferred | 75471 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `nX` | `rehydrateSessionState` | inferred | 31020 |
| `Y1` | `readAllSessionSummaries` | __export | 35026 |
| `rde` | `archiveLegacyRegistrySessionsDir` | __export | 58623 |
| `Vde` | `drainSessionMailbox` | inferred | 59612 |
| `GI` | `computeInstructionsFingerprint` | __export | 71259 |
| `Fme` | `computeNonBoardInstructionsFingerprint` | __export | 71268 |
| `zXe` | `computeMissionFingerprint` | __export | 71308 |
| `O2` | `runInstructionsFingerprintGuard` | __export | 71313 |
| `FXe` | `runMissionFingerprintGuard` | __export | 71437 |
| `HXe` | `createSessionManager` | __export | 71491 |
| `JI` | `SESSION_SCHEMA_VERSION` | __export | 73972 |
| `oet` | `createMetaSession` | __export | 74214 |
| `aet` | `sweepTombstonedSessionRecords` | __export | 74649 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `w_` | `resolveMetaPromptText` | __export | 48217 |
| `Xoe` | `renderJobMissionBlock` | __export | 48228 |
| `ZE` | `buildSystemPromptForChannelConfig` | __export | 48234 |
| `Cle` | `extractSystemPromptAppend` | __export | 57356 |
| `Gde` | `buildTransientUserBlocks` | inferred | 60926 |
| `Pme` | `transcludeBroadcastBoard` | inferred | 70978 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `K1` | `drainRecordPath` | __export | 34936 |
| `Pl` | `appendDrainRecord` | __export | 34939 |
| `Mu` | `readDrainRecords` | __export | 34946 |
| `Il` | `summarizeDrainRecords` | __export | 34967 |
| `Q1` | `readGlobalUsageTotals` | __export | 35043 |
| `HHe` | `readRecentDrainRecords` | __export | 35061 |
| `Ole` | `computeCodexTurnUsage` | __export | 57332 |
| `KU` | `batchDrainItems` | inferred | 61067 |
| `gm` | `handleDrainError` | inferred | 61467 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Goe` | `splitDisallowedToolsForClaude` | __export | 48098 |
| `__` | `isAgentSdkTurnInterruptedError` | __export | 48108 |
| `b_` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 48112 |
| `Yoe` | `probeClaudeAvailability` | __export | 48138 |
| `jz` | `isClaudeAvailable` | __export | 48168 |
| `v_` | `claudeUnavailableReason` | __export | 48172 |
| `MWe` | `primeClaudeAvailability` | __export | 48175 |
| `zWe` | `__resetClaudeProbeCacheForTest` | __export | 48179 |
| `FWe` | `__setClaudeVerifierForTest` | __export | 48183 |
| `Qoe` | `verifyClaudeCodeRuntimeAvailable` | __export | 48187 |
| `Az` | `parsePositiveMsEnv` | __export | 48333 |
| `tc` | `createAgentSdkAdapter` | __export | 48339 |
| `Ui` | `AgentSdkPromptNotAcceptedAbortError` | __export | 48752 |
| `Xo` | `AgentSdkTurnInterruptedError` | __export | 48752 |
| `Fp` | `CLAUDE_CORE_TOOLS` | __export | 48752 |
| `xle` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 57181 |
| `SU` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 57227 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `H_` | `isCodexAvailable` | __export | 57261 |
| `qKe` | `codexUnavailableReason` | __export | 57265 |
| `BKe` | `primeCodexAvailability` | __export | 57268 |
| `HKe` | `__setCodexAvailabilityForTests` | __export | 57273 |
| `lm` | `resolveCodexSandbox` | __export | 57277 |
| `hc` | `checkCodexAvailability` | __export | 57281 |
| `OU` | `ensureAgentsMdSymlink` | __export | 57318 |
| `$le` | `codexNotificationFilterDecision` | __export | 57328 |
| `Ale` | `buildBaseInstructions` | __export | 57360 |
| `Nle` | `buildDeveloperInstructions` | __export | 57378 |
| `V_` | `createCodexAppServerAdapter` | __export | 57391 |
| `jle` | `hasImageGenerationRecord` | __export | 57906 |
| `Lle` | `extractCodexGeneratedImageAttachment` | __export | 57922 |
| `n5e` | `generatePartitionCodexAgents` | __export | 58499 |
| `Xle` | `parseAgentMarkdown` | __export | 58573 |
| `ede` | `renderAgentToml` | __export | 58588 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Nz` | `PARTITION_CORE_TOOLS` | __export | 48752 |
| `uet` | `enqueueCadenceItem` | __export | 74715 |
| `the` | `mergeCadenceInbox` | __export | 74722 |
| `nhe` | `parseCadenceQueue` | __export | 74754 |
| `cet` | `markCadenceItemsDone` | __export | 74763 |
| `det` | `runCadenceTick` | __export | 74771 |
| `j2` | `scanAndSpawnDueJobs` | __export | 74809 |
| `het` | `createJobScheduler` | __export | 74951 |
| `yet` | `createOutboxDeliveryManager` | __export | 75014 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `ed` | `partitionInboxDir` | __export | 55591 |
| `aR` | `partitionInboxDirFromVar` | __export | 55595 |
| `dc` | `resolveMemoryDirs` | inferred | 55835 |
| `td` | `resolveMemoryLinkTargets` | inferred | 55874 |
| `eKe` | `runBoardLint` | inferred | 56177 |
| `am` | `collectMemoryLinks` | inferred | 56219 |
| `um` | `walkReachableMemory` | inferred | 56234 |
| `Xce` | `runGapLint` | inferred | 56517 |
| `rle` | `detectOrphanMemory` | inferred | 56612 |
| `sle` | `forgetMemoryEntry` | inferred | 56644 |
| `dU` | `routeContractDecision` | inferred | 56747 |
| `gU` | `enforceContractGate` | inferred | 56904 |
| `bU` | `resolveMemoryCheckFlags` | __export | 56950 |
| `vU` | `buildMemoryCheckStatus` | __export | 56959 |
| `$Ke` | `runMemoryCheckTick` | __export | 56973 |
| `zme` | `computeBoardLayerHash` | __export | 71264 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `M9e` | `resolveRuntimePaths` | __export | 55503 |
| `xU` | `parseDotEnv` | __export | 57087 |
| `rd` | `hostDotEnvPath` | __export | 57102 |
| `TU` | `clearHostModelEnvVars` | __export | 57162 |
| `Sle` | `applyHostModelEnvVars` | __export | 57166 |
| `kle` | `writeHostModelEnvConfig` | __export | 57169 |
| `Ele` | `clearHostModelEnvConfig` | __export | 57194 |
| `Tle` | `readHostDotEnvFile` | __export | 57205 |
| `MKe` | `loadHostDotEnv` | __export | 57214 |
| `kU` | `HOST_MODEL_ENV_KEYS` | __export | 57227 |
| `m5e` | `initializeRuntime` | __export | 58795 |
