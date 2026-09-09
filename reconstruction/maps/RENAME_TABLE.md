# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `daemon.pretty.js`。

共 133 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.1。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `rnt` | `daemonRestartReasonPath` | inferred | 59923 |
| `Rhe` | `claimDaemonRestartReason` | inferred | 59926 |
| `The` | `setPendingRestartReason` | inferred | 59952 |
| `Ihe` | `getPendingRestartReason` | inferred | 59956 |
| `Yct` | `deliverDaemonRestartWakes` | __export | 83736 |
| `fdt` | `createDaemon` | __export | 84498 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Yt` | `createSpineEvent` | inferred | 31924 |
| `FGe` | `atomicWriteFileSync` | inferred | 31931 |
| `Xt` | `atomicAppendEvent` | inferred | 31966 |
| `qGe` | `readEventByIdSeek` | inferred | 32001 |
| `hl` | `advanceConsumerWatermark` | inferred | 32773 |
| `qre` | `computeDedupKey` | inferred | 80811 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `eC` | `DAEMON_TOKEN_ENV_KEY` | __export | 63065 |
| `hae` | `appendBeforeExecuteGateway` | inferred | 81119 |
| `cdt` | `isLoopbackBindHost` | __export | 84465 |
| `ddt` | `resolveRemoteListenerConfig` | __export | 84472 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Ore` | `rehydrateSessionState` | inferred | 32255 |
| `QL` | `readAllSessionSummaries` | __export | 36757 |
| `e_e` | `archiveLegacyRegistrySessionsDir` | __export | 63516 |
| `W_e` | `drainSessionMailbox` | inferred | 64516 |
| `Xh` | `SESSION_SCHEMA_VERSION` | __export | 74297 |
| `bw` | `computeInstructionsFingerprint` | __export | 76374 |
| `P6` | `computeNonBoardInstructionsFingerprint` | __export | 76383 |
| `Wwe` | `computeMissionFingerprint` | __export | 76423 |
| `SO` | `runInstructionsFingerprintGuard` | __export | 76428 |
| `act` | `createSessionManager` | __export | 77628 |
| `vct` | `createMetaSession` | __export | 79799 |
| `wct` | `sweepTombstonedSessionRecords` | __export | 80383 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `jb` | `resolveMetaPromptText` | __export | 49943 |
| `jde` | `renderJobMissionBlock` | __export | 49960 |
| `Lde` | `renderPromptLayers` | __export | 49967 |
| `eh` | `buildSystemPromptForChannelConfig` | __export | 49994 |
| `Hpe` | `extractSystemPromptAppend` | __export | 56681 |
| `Che` | `renderDaemonRestartHint` | inferred | 59993 |
| `K_e` | `buildTransientUserBlocks` | inferred | 65787 |
| `Uwe` | `transcludeBroadcastBoard` | inferred | 76223 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `xa` | `drainRecordPath` | __export | 36661 |
| `Od` | `appendDrainRecord` | __export | 36664 |
| `Ru` | `readDrainRecords` | __export | 36671 |
| `Cd` | `summarizeDrainRecords` | __export | 36686 |
| `eF` | `readGlobalUsageTotals` | __export | 36774 |
| `y5e` | `readRecentDrainRecords` | __export | 36792 |
| `Qm` | `isAbortLikeError` | __export | 49842 |
| `Bpe` | `computeCodexTurnUsage` | __export | 56657 |
| `HB` | `batchDrainItems` | inferred | 65926 |
| `$v` | `handleDrainError` | inferred | 66356 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Ade` | `splitDisallowedToolsForClaude` | __export | 49824 |
| `Nb` | `isAgentSdkTurnInterruptedError` | __export | 49834 |
| `Db` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 49838 |
| `Dde` | `probeClaudeAvailability` | __export | 49864 |
| `Lq` | `isClaudeAvailable` | __export | 49894 |
| `Mb` | `claudeUnavailableReason` | __export | 49898 |
| `u7e` | `primeClaudeAvailability` | __export | 49901 |
| `c7e` | `__resetClaudeProbeCacheForTest` | __export | 49905 |
| `d7e` | `__setClaudeVerifierForTest` | __export | 49909 |
| `Mde` | `verifyClaudeCodeRuntimeAvailable` | __export | 49913 |
| `Dq` | `parsePositiveMsEnv` | __export | 50070 |
| `Gd` | `createAgentSdkAdapter` | __export | 50087 |
| `wr` | `AgentSdkPromptNotAcceptedAbortError` | __export | 50390 |
| `Cr` | `AgentSdkTurnInterruptedError` | __export | 50390 |
| `Xm` | `CLAUDE_CORE_TOOLS` | __export | 50390 |
| `Fme` | `mergeClaudeToolLists` | inferred | 59490 |
| `u4` | `applyJobSdkConfigOverride` | inferred | 59620 |
| `Iye` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 62994 |
| `mB` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 63065 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `of` | `isCodexAvailable` | __export | 56586 |
| `_et` | `codexUnavailableReason` | __export | 56590 |
| `bet` | `primeCodexAvailability` | __export | 56593 |
| `vet` | `__setCodexAvailabilityForTests` | __export | 56598 |
| `fh` | `resolveCodexSandbox` | __export | 56602 |
| `Xu` | `checkCodexAvailability` | __export | 56606 |
| `K2` | `ensureAgentsMdSymlink` | __export | 56643 |
| `qpe` | `codexNotificationFilterDecision` | __export | 56653 |
| `Vpe` | `buildBaseInstructions` | __export | 56685 |
| `Wpe` | `buildDeveloperInstructions` | __export | 56703 |
| `J2` | `buildCodexTurnInput` | __export | 56717 |
| `ev` | `createCodexAppServerAdapter` | __export | 56730 |
| `Gpe` | `hasImageGenerationRecord` | __export | 57198 |
| `Zpe` | `extractCodexGeneratedImageAttachment` | __export | 57214 |
| `cP` | `ALADUO_TOOL_NAMESPACE` | __export | 57457 |
| `Wit` | `generatePartitionCodexAgents` | __export | 63390 |
| `Kye` | `parseAgentMarkdown` | __export | 63464 |
| `Yye` | `renderAgentToml` | __export | 63479 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Mq` | `PARTITION_CORE_TOOLS` | __export | 50390 |
| `bye` | `resolveCadenceIntervalMs` | __export | 62695 |
| `Sct` | `runCadenceTick` | __export | 80443 |
| `M6` | `scanAndSpawnDueJobs` | __export | 80474 |
| `xct` | `createJobScheduler` | __export | 80579 |
| `Rct` | `createOutboxDeliveryManager` | __export | 80647 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Sv` | `partitionInboxDir` | __export | 60318 |
| `nc` | `partitionInboxDirFromVar` | __export | 60322 |
| `Ti` | `resolveMemoryDirs` | inferred | 60622 |
| `cf` | `resolveMemoryLinkTargets` | inferred | 60661 |
| `Jnt` | `runBoardLint` | inferred | 60975 |
| `ic` | `collectMemoryLinks` | inferred | 61009 |
| `oc` | `walkReachableMemory` | inferred | 61024 |
| `GP` | `enforceContractGate` | inferred | 61486 |
| `Ert` | `runGapLint` | inferred | 61819 |
| `fye` | `detectOrphanMemory` | inferred | 62512 |
| `mye` | `forgetMemoryEntry` | inferred | 62544 |
| `aB` | `routeContractDecision` | inferred | 62649 |
| `dB` | `resolveMemoryCheckFlags` | __export | 62686 |
| `fB` | `buildMemoryCheckStatus` | __export | 62702 |
| `_it` | `runMemoryCheckTick` | __export | 62716 |
| `I6` | `computeBoardLayerHash` | __export | 76379 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Tnt` | `resolveRuntimePaths` | __export | 60233 |
| `tC` | `parseDotEnv` | __export | 62897 |
| `Il` | `hostDotEnvPath` | __export | 62912 |
| `gB` | `clearHostModelEnvVars` | __export | 62975 |
| `Rye` | `applyHostModelEnvVars` | __export | 62979 |
| `Tye` | `writeHostModelEnvConfig` | __export | 62982 |
| `Pye` | `clearHostModelEnvConfig` | __export | 63007 |
| `Eit` | `readHostDaemonToken` | __export | 63018 |
| `Rit` | `writeHostDaemonToken` | __export | 63030 |
| `Cye` | `readHostDotEnvFile` | __export | 63043 |
| `Tit` | `loadHostDotEnv` | __export | 63052 |
| `hB` | `HOST_MODEL_ENV_KEYS` | __export | 63065 |
| `not` | `initializeRuntime` | __export | 63688 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `t4` | `isGrokAvailable` | __export | 57695 |
| `Iet` | `grokUnavailableReason` | __export | 57699 |
| `Pet` | `primeGrokAvailability` | __export | 57702 |
| `Cet` | `__setGrokAvailabilityForTests` | __export | 57707 |
| `Qu` | `checkGrokAvailability` | __export | 57710 |
| `rv` | `grokAcpExtMethod` | __export | 57731 |
| `iv` | `createGrokAcpAdapter` | __export | 57852 |
| `ome` | `GROK_ACP_COMPACT` | __export | 58398 |
| `rme` | `GROK_ACP_EXT_PREFIX` | __export | 58398 |
| `ime` | `GROK_ACP_SDK_CALL` | __export | 58398 |
| `nme` | `GROK_AGENT_PROFILE` | __export | 58398 |
| `tme` | `GROK_DISALLOWED_TOOLS` | __export | 58398 |
| `sme` | `GROK_MCP_SDK_META` | __export | 58398 |
| `ame` | `GROK_MCP_SERVERS_META` | __export | 58398 |
| `lme` | `GROK_MCP_SERVER_NAME` | __export | 58398 |
