# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `daemon.pretty.js`。

共 133 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.0。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `xet` | `daemonRestartReasonPath` | inferred | 59309 |
| `$me` | `claimDaemonRestartReason` | inferred | 59312 |
| `Ame` | `setPendingRestartReason` | inferred | 59338 |
| `Nme` | `getPendingRestartReason` | inferred | 59342 |
| `_ut` | `deliverDaemonRestartWakes` | __export | 82782 |
| `Aut` | `createDaemon` | __export | 83506 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Qt` | `createSpineEvent` | inferred | 31432 |
| `pJe` | `atomicWriteFileSync` | inferred | 31439 |
| `en` | `atomicAppendEvent` | inferred | 31474 |
| `gJe` | `readEventByIdSeek` | inferred | 31509 |
| `il` | `advanceConsumerWatermark` | inferred | 32281 |
| `Xne` | `computeDedupKey` | inferred | 79985 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `DP` | `DAEMON_TOKEN_ENV_KEY` | __export | 62478 |
| `xse` | `appendBeforeExecuteGateway` | inferred | 80293 |
| `Out` | `isLoopbackBindHost` | __export | 83473 |
| `$ut` | `resolveRemoteListenerConfig` | __export | 83480 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Une` | `rehydrateSessionState` | inferred | 31763 |
| `SL` | `readAllSessionSummaries` | __export | 36210 |
| `sye` | `archiveLegacyRegistrySessionsDir` | __export | 62929 |
| `Gye` | `drainSessionMailbox` | inferred | 63874 |
| `zh` | `SESSION_SCHEMA_VERSION` | __export | 73539 |
| `tw` | `computeInstructionsFingerprint` | __export | 75616 |
| `YH` | `computeNonBoardInstructionsFingerprint` | __export | 75625 |
| `Wve` | `computeMissionFingerprint` | __export | 75665 |
| `rO` | `runInstructionsFingerprintGuard` | __export | 75670 |
| `Ilt` | `createSessionManager` | __export | 76852 |
| `Ult` | `createMetaSession` | __export | 78994 |
| `qlt` | `sweepTombstonedSessionRecords` | __export | 79557 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Sb` | `resolveMetaPromptText` | __export | 49396 |
| `Wce` | `renderJobMissionBlock` | __export | 49413 |
| `Jce` | `renderPromptLayers` | __export | 49420 |
| `Um` | `buildSystemPromptForChannelConfig` | __export | 49447 |
| `Qfe` | `extractSystemPromptAppend` | __export | 56157 |
| `Mme` | `renderDaemonRestartHint` | inferred | 59379 |
| `Xye` | `buildTransientUserBlocks` | inferred | 65062 |
| `Uve` | `transcludeBroadcastBoard` | inferred | 75465 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `ga` | `drainRecordPath` | __export | 36114 |
| `_d` | `appendDrainRecord` | __export | 36117 |
| `hu` | `readDrainRecords` | __export | 36124 |
| `yd` | `summarizeDrainRecords` | __export | 36139 |
| `kL` | `readGlobalUsageTotals` | __export | 36227 |
| `B3e` | `readRecentDrainRecords` | __export | 36245 |
| `zm` | `isAbortLikeError` | __export | 49295 |
| `Xfe` | `computeCodexTurnUsage` | __export | 56133 |
| `fB` | `batchDrainItems` | inferred | 65194 |
| `mv` | `handleDrainError` | inferred | 65618 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `qce` | `splitDisallowedToolsForClaude` | __export | 49277 |
| `bb` | `isAgentSdkTurnInterruptedError` | __export | 49287 |
| `vb` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 49291 |
| `Hce` | `probeClaudeAvailability` | __export | 49317 |
| `aq` | `isClaudeAvailable` | __export | 49347 |
| `wb` | `claudeUnavailableReason` | __export | 49351 |
| `D8e` | `primeClaudeAvailability` | __export | 49354 |
| `M8e` | `__resetClaudeProbeCacheForTest` | __export | 49358 |
| `j8e` | `__setClaudeVerifierForTest` | __export | 49362 |
| `Vce` | `verifyClaudeCodeRuntimeAvailable` | __export | 49366 |
| `iq` | `parsePositiveMsEnv` | __export | 49523 |
| `Dd` | `createAgentSdkAdapter` | __export | 49529 |
| `Ii` | `AgentSdkPromptNotAcceptedAbortError` | __export | 49832 |
| `Vn` | `AgentSdkTurnInterruptedError` | __export | 49832 |
| `Fm` | `CLAUDE_CORE_TOOLS` | __export | 49832 |
| `Gpe` | `mergeClaudeToolLists` | inferred | 58934 |
| `$2` | `applyJobSdkConfigOverride` | inferred | 59028 |
| `Nge` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 62407 |
| `M4` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 62478 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Hd` | `isCodexAvailable` | __export | 56062 |
| `qXe` | `codexUnavailableReason` | __export | 56066 |
| `BXe` | `primeCodexAvailability` | __export | 56069 |
| `HXe` | `__setCodexAvailabilityForTests` | __export | 56074 |
| `Qm` | `resolveCodexSandbox` | __export | 56078 |
| `Uu` | `checkCodexAvailability` | __export | 56082 |
| `b2` | `ensureAgentsMdSymlink` | __export | 56119 |
| `Yfe` | `codexNotificationFilterDecision` | __export | 56129 |
| `epe` | `buildBaseInstructions` | __export | 56161 |
| `tpe` | `buildDeveloperInstructions` | __export | 56179 |
| `g2` | `buildCodexTurnInput` | __export | 56193 |
| `Fb` | `createCodexAppServerAdapter` | __export | 56206 |
| `rpe` | `hasImageGenerationRecord` | __export | 56662 |
| `ipe` | `extractCodexGeneratedImageAttachment` | __export | 56678 |
| `JI` | `ALADUO_TOOL_NAMESPACE` | __export | 56917 |
| `prt` | `generatePartitionCodexAgents` | __export | 62803 |
| `nye` | `parseAgentMarkdown` | __export | 62877 |
| `rye` | `renderAgentToml` | __export | 62892 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `oq` | `PARTITION_CORE_TOOLS` | __export | 49832 |
| `Ege` | `resolveCadenceIntervalMs` | __export | 62108 |
| `Blt` | `runCadenceTick` | __export | 79617 |
| `i6` | `scanAndSpawnDueJobs` | __export | 79648 |
| `Vlt` | `createJobScheduler` | __export | 79753 |
| `Jlt` | `createOutboxDeliveryManager` | __export | 79821 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `iv` | `partitionInboxDir` | __export | 59704 |
| `Wu` | `partitionInboxDirFromVar` | __export | 59708 |
| `mi` | `resolveMemoryDirs` | inferred | 60035 |
| `Kd` | `resolveMemoryLinkTargets` | inferred | 60074 |
| `mtt` | `runBoardLint` | inferred | 60388 |
| `Gu` | `collectMemoryLinks` | inferred | 60422 |
| `Zu` | `walkReachableMemory` | inferred | 60437 |
| `PP` | `enforceContractGate` | inferred | 60899 |
| `b4` | `runGapLint` | inferred | 60985 |
| `_ge` | `detectOrphanMemory` | inferred | 61925 |
| `vge` | `forgetMemoryEntry` | inferred | 61957 |
| `P4` | `routeContractDecision` | inferred | 62062 |
| `A4` | `resolveMemoryCheckFlags` | __export | 62099 |
| `N4` | `buildMemoryCheckStatus` | __export | 62115 |
| `Fnt` | `runMemoryCheckTick` | __export | 62129 |
| `KH` | `computeBoardLayerHash` | __export | 75621 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Get` | `resolveRuntimePaths` | __export | 59619 |
| `MP` | `parseDotEnv` | __export | 62310 |
| `gl` | `hostDotEnvPath` | __export | 62325 |
| `L4` | `clearHostModelEnvVars` | __export | 62388 |
| `$ge` | `applyHostModelEnvVars` | __export | 62392 |
| `Age` | `writeHostModelEnvConfig` | __export | 62395 |
| `Dge` | `clearHostModelEnvConfig` | __export | 62420 |
| `Wnt` | `readHostDaemonToken` | __export | 62431 |
| `Jnt` | `writeHostDaemonToken` | __export | 62443 |
| `Mge` | `readHostDotEnvFile` | __export | 62456 |
| `Gnt` | `loadHostDotEnv` | __export | 62465 |
| `j4` | `HOST_MODEL_ENV_KEYS` | __export | 62478 |
| `krt` | `initializeRuntime` | __export | 63101 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `x2` | `isGrokAvailable` | __export | 57155 |
| `YXe` | `grokUnavailableReason` | __export | 57159 |
| `XXe` | `primeGrokAvailability` | __export | 57162 |
| `QXe` | `__setGrokAvailabilityForTests` | __export | 57167 |
| `qu` | `checkGrokAvailability` | __export | 57170 |
| `qb` | `grokAcpExtMethod` | __export | 57191 |
| `Bb` | `createGrokAcpAdapter` | __export | 57312 |
| `mpe` | `GROK_ACP_COMPACT` | __export | 57858 |
| `fpe` | `GROK_ACP_EXT_PREFIX` | __export | 57858 |
| `ppe` | `GROK_ACP_SDK_CALL` | __export | 57858 |
| `dpe` | `GROK_AGENT_PROFILE` | __export | 57858 |
| `cpe` | `GROK_DISALLOWED_TOOLS` | __export | 57858 |
| `hpe` | `GROK_MCP_SDK_META` | __export | 57858 |
| `gpe` | `GROK_MCP_SERVERS_META` | __export | 57858 |
| `ype` | `GROK_MCP_SERVER_NAME` | __export | 57858 |
