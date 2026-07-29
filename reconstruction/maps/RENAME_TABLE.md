# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `daemon.pretty.js`。

共 112 个一等公民符号，覆盖 11 个子系统。基于 `@openduo/duoduo` v0.6.2。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `IWe` | `daemonRestartReasonPath` | inferred | 49058 |
| `wae` | `claimDaemonRestartReason` | inferred | 49061 |
| `kae` | `setPendingRestartReason` | inferred | 49085 |
| `xae` | `getPendingRestartReason` | inferred | 49089 |
| `utt` | `createDaemon` | __export | 78206 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `en` | `createSpineEvent` | inferred | 30679 |
| `E2e` | `atomicWriteFileSync` | inferred | 30686 |
| `tn` | `atomicAppendEvent` | inferred | 30721 |
| `ml` | `readEventByIdSeek` | inferred | 30753 |
| `Ca` | `advanceConsumerWatermark` | inferred | 31544 |
| `bX` | `computeDedupKey` | inferred | 75351 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Dne` | `appendBeforeExecuteGateway` | inferred | 75649 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `oX` | `rehydrateSessionState` | inferred | 31040 |
| `X1` | `readAllSessionSummaries` | __export | 35046 |
| `pde` | `archiveLegacyRegistrySessionsDir` | __export | 58745 |
| `tfe` | `drainSessionMailbox` | inferred | 59735 |
| `GI` | `computeInstructionsFingerprint` | __export | 71441 |
| `ehe` | `computeNonBoardInstructionsFingerprint` | __export | 71450 |
| `tet` | `computeMissionFingerprint` | __export | 71490 |
| `D2` | `runInstructionsFingerprintGuard` | __export | 71495 |
| `net` | `runMissionFingerprintGuard` | __export | 71619 |
| `oet` | `createSessionManager` | __export | 71673 |
| `WI` | `SESSION_SCHEMA_VERSION` | __export | 74150 |
| `xet` | `createMetaSession` | __export | 74392 |
| `Eet` | `sweepTombstonedSessionRecords` | __export | 74827 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `w_` | `resolveMetaPromptText` | __export | 48237 |
| `nae` | `renderJobMissionBlock` | __export | 48248 |
| `JE` | `buildSystemPromptForChannelConfig` | __export | 48254 |
| `qle` | `extractSystemPromptAppend` | __export | 57478 |
| `Mde` | `renderDaemonRestartHint` | inferred | 59574 |
| `sfe` | `buildTransientUserBlocks` | inferred | 61049 |
| `Bme` | `transcludeBroadcastBoard` | inferred | 71160 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Q1` | `drainRecordPath` | __export | 34956 |
| `Pl` | `appendDrainRecord` | __export | 34959 |
| `Mc` | `readDrainRecords` | __export | 34966 |
| `Il` | `summarizeDrainRecords` | __export | 34987 |
| `ej` | `readGlobalUsageTotals` | __export | 35063 |
| `nVe` | `readRecentDrainRecords` | __export | 35081 |
| `Ule` | `computeCodexTurnUsage` | __export | 57454 |
| `eq` | `batchDrainItems` | inferred | 61190 |
| `bm` | `handleDrainError` | inferred | 61590 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Qoe` | `splitDisallowedToolsForClaude` | __export | 48118 |
| `__` | `isAgentSdkTurnInterruptedError` | __export | 48128 |
| `b_` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 48132 |
| `eae` | `probeClaudeAvailability` | __export | 48158 |
| `Mz` | `isClaudeAvailable` | __export | 48188 |
| `v_` | `claudeUnavailableReason` | __export | 48192 |
| `KJe` | `primeClaudeAvailability` | __export | 48195 |
| `YJe` | `__resetClaudeProbeCacheForTest` | __export | 48199 |
| `QJe` | `__setClaudeVerifierForTest` | __export | 48203 |
| `tae` | `verifyClaudeCodeRuntimeAvailable` | __export | 48207 |
| `Dz` | `parsePositiveMsEnv` | __export | 48353 |
| `tu` | `createAgentSdkAdapter` | __export | 48359 |
| `Fi` | `AgentSdkPromptNotAcceptedAbortError` | __export | 48775 |
| `ea` | `AgentSdkTurnInterruptedError` | __export | 48775 |
| `Bp` | `CLAUDE_CORE_TOOLS` | __export | 48775 |
| `aae` | `mergeClaudeToolLists` | inferred | 48843 |
| `Fz` | `applyJobSdkConfigOverride` | inferred | 48847 |
| `Nle` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 57303 |
| `TU` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 57349 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `H_` | `isCodexAvailable` | __export | 57383 |
| `n5e` | `codexUnavailableReason` | __export | 57387 |
| `r5e` | `primeCodexAvailability` | __export | 57390 |
| `i5e` | `__setCodexAvailabilityForTests` | __export | 57395 |
| `pm` | `resolveCodexSandbox` | __export | 57399 |
| `hu` | `checkCodexAvailability` | __export | 57403 |
| `DU` | `ensureAgentsMdSymlink` | __export | 57440 |
| `Fle` | `codexNotificationFilterDecision` | __export | 57450 |
| `Ble` | `buildBaseInstructions` | __export | 57482 |
| `Hle` | `buildDeveloperInstructions` | __export | 57500 |
| `V_` | `createCodexAppServerAdapter` | __export | 57513 |
| `Zle` | `hasImageGenerationRecord` | __export | 58028 |
| `Jle` | `extractCodexGeneratedImageAttachment` | __export | 58044 |
| `g5e` | `generatePartitionCodexAgents` | __export | 58621 |
| `ude` | `parseAgentMarkdown` | __export | 58695 |
| `lde` | `renderAgentToml` | __export | 58710 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `jz` | `PARTITION_CORE_TOOLS` | __export | 48775 |
| `Tet` | `enqueueCadenceItem` | __export | 74893 |
| `hhe` | `mergeCadenceInbox` | __export | 74900 |
| `ghe` | `parseCadenceQueue` | __export | 74932 |
| `Ret` | `markCadenceItemsDone` | __export | 74941 |
| `Iet` | `runCadenceTick` | __export | 74949 |
| `F2` | `scanAndSpawnDueJobs` | __export | 74987 |
| `Cet` | `createJobScheduler` | __export | 75129 |
| `Net` | `createOutboxDeliveryManager` | __export | 75192 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `ed` | `partitionInboxDir` | __export | 55713 |
| `cR` | `partitionInboxDirFromVar` | __export | 55717 |
| `du` | `resolveMemoryDirs` | inferred | 55957 |
| `td` | `resolveMemoryLinkTargets` | inferred | 55996 |
| `mKe` | `runBoardLint` | inferred | 56299 |
| `lm` | `collectMemoryLinks` | inferred | 56341 |
| `dm` | `walkReachableMemory` | inferred | 56356 |
| `ule` | `runGapLint` | inferred | 56639 |
| `ple` | `detectOrphanMemory` | inferred | 56734 |
| `hle` | `forgetMemoryEntry` | inferred | 56766 |
| `hU` | `routeContractDecision` | inferred | 56869 |
| `vU` | `enforceContractGate` | inferred | 57026 |
| `kU` | `resolveMemoryCheckFlags` | __export | 57072 |
| `xU` | `buildMemoryCheckStatus` | __export | 57081 |
| `HKe` | `runMemoryCheckTick` | __export | 57095 |
| `Xme` | `computeBoardLayerHash` | __export | 71446 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Q9e` | `resolveRuntimePaths` | __export | 55625 |
| `IU` | `parseDotEnv` | __export | 57209 |
| `rd` | `hostDotEnvPath` | __export | 57224 |
| `$U` | `clearHostModelEnvVars` | __export | 57284 |
| `Cle` | `applyHostModelEnvVars` | __export | 57288 |
| `Ale` | `writeHostModelEnvConfig` | __export | 57291 |
| `Dle` | `clearHostModelEnvConfig` | __export | 57316 |
| `jle` | `readHostDotEnvFile` | __export | 57327 |
| `QKe` | `loadHostDotEnv` | __export | 57336 |
| `RU` | `HOST_MODEL_ENV_KEYS` | __export | 57349 |
| `I5e` | `initializeRuntime` | __export | 58917 |
