# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 `daemon.pretty.js`。

共 472 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.3。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `gR` | `resolveRegistryStatusPath` | inferred | 32877 |
| `Du` | `updateRegistryStatus` | inferred | 32919 |
| `Cut` | `daemonRestartReasonPath` | inferred | 65780 |
| `zbe` | `claimDaemonRestartReason` | inferred | 65783 |
| `Ube` | `setPendingRestartReason` | inferred | 65809 |
| `qbe` | `getPendingRestartReason` | inferred | 65813 |
| `d6` | `resolveRuntimeWriterLockPath` | inferred | 88831 |
| `qut` | `isProcessAliveByPid` | inferred | 88835 |
| `But` | `computeHostBootId` | inferred | 88845 |
| `eve` | `getCachedHostBootId` | inferred | 88862 |
| `Vut` | `isRuntimeWriterLockStale` | inferred | 88866 |
| `p6` | `acquireRuntimeWriterLock` | inferred | 88878 |
| `C0e` | `readEnvIntegerOrFallback` | inferred | 89082 |
| `kyt` | `deliverDaemonRestartWakes` | __export | 89682 |
| `Lyt` | `createDaemon` | __export | 90469 |
| `Fyt` | `main` | __export | 91500 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Bi` | `stringifyJsonlRecord` | inferred | 31829 |
| `G9e` | `enqueuePartitionAppend` | inferred | 31988 |
| `Sm` | `formatEventPartitionName` | inferred | 31997 |
| `rn` | `createSpineEvent` | inferred | 32001 |
| `X9e` | `appendEventToPartition` | inferred | 32008 |
| `tb` | `resolveEventIdIndexPath` | inferred | 32031 |
| `Q9e` | `appendEventIdIndexEntry` | inferred | 32034 |
| `on` | `atomicAppendEvent` | inferred | 32043 |
| `Md` | `readEventById` | inferred | 32052 |
| `e5e` | `readEventAtIndexedOffset` | inferred | 32060 |
| `t5e` | `scanPartitionsForEventId` | inferred | 32078 |
| `nb` | `lookupEventIdIndexEntry` | inferred | 32095 |
| `n5e` | `getOrCreateEventIdIndexCache` | inferred | 32109 |
| `r5e` | `isUsableEventIndexEntry` | inferred | 32119 |
| `i5e` | `loadEventIdIndex` | inferred | 32122 |
| `ise` | `findEventInPartitionFile` | inferred | 32159 |
| `C5e` | `resolveConsumerOffsetPath` | inferred | 32852 |
| `$5e` | `writeConsumerOffsetFile` | inferred | 32855 |
| `Nu` | `advanceConsumerWatermark` | inferred | 32858 |
| `mR` | `spineEventDedupStore` | inferred | 86847 |
| `wse` | `computeDedupKey` | inferred | 86907 |
| `MXe` | `loadRegistryDedupStore` | inferred | 87069 |
| `m6` | `readPartitionByteRange` | inferred | 88945 |
| `Jut` | `iteratePartitionLinesBackward` | inferred | 88957 |
| `Zut` | `resolveTailCursorEndOffset` | inferred | 88969 |
| `nve` | `readPartitionTail` | inferred | 88984 |
| `rve` | `readSpineTail` | inferred | 89023 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `eb` | `isJsonRpcRequest` | inferred | 31516 |
| `I0` | `isDaemonRuntimeInfo` | inferred | 31541 |
| `Goe` | `initChannelProtocolModule` | inferred | 31661 |
| `J0` | `isJobCreateParams` | inferred | 31671 |
| `sXe` | `generateOutboxRecordId` | inferred | 35910 |
| `Tb` | `resolveOutboxRecordPath` | inferred | 35914 |
| `La` | `readOutboxRecord` | inferred | 35964 |
| `qm` | `findOutboxRecordByEventId` | inferred | 36021 |
| `Xd` | `recordOutboxDeliveryAttempt` | inferred | 36029 |
| `tU` | `resolveOutboxByEventIndexPath` | inferred | 36053 |
| `hle` | `resolveOutboxSentIdsPath` | inferred | 36057 |
| `cXe` | `loadOutboxByEventIndex` | inferred | 36070 |
| `Bm` | `recordOutboxSentId` | inferred | 36117 |
| `MR` | `resolveOutboxReplayDir` | inferred | 36123 |
| `nU` | `resolveOutboxByIdIndexPath` | inferred | 36142 |
| `ta` | `lookupOutboxByIdIndexEntry` | inferred | 36194 |
| `yXe` | `ensureOutboxRecordInReplay` | inferred | 36247 |
| `jR` | `backfillOutboxByIdIndexFromReplay` | inferred | 36419 |
| `Jl` | `resolveOutboxPendingQueuePath` | inferred | 36455 |
| `vXe` | `hasUnqueuedPendingOutboxRecords` | inferred | 36505 |
| `gs` | `initOutboxStoreModule` | inferred | 36592 |
| `Ps` | `deliverRouteEventToSession` | inferred | 64355 |
| `v_e` | `updateDeliveryCursorFile` | inferred | 64495 |
| `k_e` | `readDeliveryCursorFile` | inferred | 64528 |
| `zV` | `advanceOptimisticDeliveryCursor` | inferred | 64571 |
| `Pw` | `readOutboxRecordsPastCursor` | inferred | 64671 |
| `R_e` | `replayOutboxBacklogToSubscriber` | inferred | 64729 |
| `cO` | `DAEMON_TOKEN_ENV_KEY` | __export | 68920 |
| `Cle` | `lookupInjectionPrompt` | inferred | 87037 |
| `qle` | `readRoutingTarget` | inferred | 87075 |
| `Jle` | `canonicalizeGatewayCommand` | inferred | 87088 |
| `dU` | `parseInjectionPromptCommand` | inferred | 87101 |
| `fU` | `classifyGatewayCommandIntent` | inferred | 87142 |
| `jXe` | `resolveRoutingTarget` | inferred | 87155 |
| `Gle` | `ingestChannelMessage` | inferred | 87161 |
| `$b` | `ingestChannelCommand` | inferred | 87186 |
| `Kle` | `appendBeforeExecuteGateway` | inferred | 87214 |
| `Yle` | `probeEventsAppendable` | inferred | 87347 |
| `LXe` | `replyToGatewayCommandEvent` | inferred | 87362 |
| `BXe` | `executeGatewayCommand` | inferred | 87485 |
| `VXe` | `writeIngressSnapshot` | inferred | 87787 |
| `l6` | `createSessionSubscriptionRegistry` | inferred | 88639 |
| `bJ` | `normalizeReturnMask` | inferred | 89199 |
| `fyt` | `normalizeChannelCapabilityDeclarations` | inferred | 89229 |
| `pyt` | `recordChannelCapabilityDeclaration` | inferred | 89239 |
| `_yt` | `describeChannelInstance` | inferred | 89363 |
| `Kf` | `resolveSessionByKeyOrAlias` | inferred | 89512 |
| `Syt` | `scheduleSessionWakeRecord` | inferred | 89541 |
| `A0e` | `deliverExternalSessionNotify` | inferred | 89595 |
| `xyt` | `readOrSetSessionModel` | inferred | 89707 |
| `Eyt` | `readOrSetSessionEffort` | inferred | 89737 |
| `Ryt` | `enqueueSessionCompactCommand` | inferred | 89767 |
| `Ayt` | `upsertChannelSpawnDescriptor` | inferred | 90345 |
| `Myt` | `isLoopbackBindHost` | __export | 90436 |
| `jyt` | `resolveRemoteListenerConfig` | __export | 90443 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Oo` | `hashSessionKey` | inferred | 32257 |
| `Jn` | `resolveSessionDir` | inferred | 32261 |
| `u5e` | `resolveSessionsArchiveRoot` | inferred | 32265 |
| `km` | `resolveArchivedSessionDir` | inferred | 32269 |
| `Ks` | `isSessionArchived` | inferred | 32273 |
| `dse` | `rehydrateSessionState` | inferred | 32340 |
| `Vi` | `runWithSessionMutex` | inferred | 32410 |
| `lR` | `tryMarkSessionArchiving` | inferred | 32423 |
| `cR` | `clearSessionArchiving` | inferred | 32427 |
| `or` | `isSessionArchiving` | inferred | 32431 |
| `zl` | `assertSessionNotArchiving` | inferred | 32435 |
| `Da` | `initSessionLockAndArchivingModule` | inferred | 32438 |
| `Xs` | `enqueueSessionInboxLine` | inferred | 32547 |
| `fR` | `mergeInboxIntoMailbox` | inferred | 32558 |
| `lb` | `listMailboxPendingItems` | inferred | 32617 |
| `pR` | `renderSessionMailboxFile` | inferred | 32705 |
| `OR` | `ensureSessionDescriptorAndStateFiles` | inferred | 35474 |
| `ole` | `updateSessionDisplayName` | inferred | 35514 |
| `et` | `patchSessionRuntimeState` | inferred | 35564 |
| `Kd` | `mutateSessionRuntimeState` | inferred | 35601 |
| `ea` | `clearSessionRuntimeStateField` | inferred | 35637 |
| `uU` | `readAllSessionSummaries` | __export | 36855 |
| `lr` | `classifySessionKeyKind` | inferred | 64073 |
| `DV` | `isUserVisibleSessionKey` | inferred | 64077 |
| `p_e` | `createEmptySessionIndex` | inferred | 64090 |
| `m_e` | `buildSessionIndexEntry` | inferred | 64094 |
| `h_e` | `createMapBackedSessionIndex` | inferred | 64118 |
| `g_e` | `formatViewSessionsListLine` | inferred | 64225 |
| `xw` | `initViewSessionsToolModule` | inferred | 64274 |
| `Kbe` | `archiveSessionDirUnlessAlreadyArchiving` | inferred | 65866 |
| `Ybe` | `archiveSessionAndArtifacts` | inferred | 65882 |
| `Jbe` | `readStateSourceChannelId` | inferred | 66023 |
| `Gbe` | `listArchivedCopiesNewestFirst` | inferred | 66044 |
| `iSe` | `archiveLegacyRegistrySessionsDir` | __export | 69371 |
| `KSe` | `drainSessionMailbox` | inferred | 70371 |
| `to` | `classifySessionKeyOrUnknown` | inferred | 71444 |
| `Ig` | `buildSessionInfoFromState` | inferred | 72332 |
| `Oft` | `classifySessionPlane` | inferred | 72377 |
| `mEe` | `stringifyExecutionToolInput` | inferred | 80186 |
| `gEe` | `buildSessionExecutionPayload` | inferred | 80200 |
| `vEe` | `classifySessionPoolKind` | inferred | 80259 |
| `Qg` | `SESSION_SCHEMA_VERSION` | __export | 80271 |
| `SEe` | `createJobSessionFinalizer` | inferred | 80276 |
| `LS` | `computeInstructionsFingerprint` | __export | 82348 |
| `cJ` | `computeNonBoardInstructionsFingerprint` | __export | 82357 |
| `$A` | `diffStreamingConfigSignature` | __export | 82364 |
| `YEe` | `computeMissionFingerprint` | __export | 82397 |
| `OA` | `runInstructionsFingerprintGuard` | __export | 82402 |
| `XEe` | `collectInstructionsInputs` | inferred | 82549 |
| `FS` | `initInstructionsFingerprintModule` | inferred | 82584 |
| `dJ` | `narrowToModelSettableAdapter` | inferred | 82597 |
| `fJ` | `computeStreamingConfigSignature` | inferred | 82601 |
| `pJ` | `isLiveStreamRebuildRequired` | inferred | 82629 |
| `e0e` | `createModelCommandResolvers` | inferred | 82653 |
| `jA` | `interruptActorQuery` | inferred | 82836 |
| `mJ` | `triggerDeferredPreempt` | inferred | 82840 |
| `zS` | `requestBoundaryAwarePreempt` | inferred | 82849 |
| `o0e` | `snapshotInflightEventIds` | inferred | 82858 |
| `Zf` | `teardownStreamingSession` | inferred | 82863 |
| `hJ` | `waitForWakeOrIdleTimeout` | inferred | 82878 |
| `LA` | `shutdownActorRuntimeAdapter` | inferred | 82892 |
| `u0e` | `memoizeAvailabilityProbeUntilOk` | inferred | 83644 |
| `Agt` | `createSessionManager` | __export | 83651 |
| `Wgt` | `createMetaSession` | __export | 85819 |
| `Jgt` | `sweepTombstonedSessionRecords` | __export | 86403 |
| `Xbe` | `createIdleCompactSweeper` | inferred | 88480 |
| `kJ` | `resolvePreemptFromCommandText` | inferred | 89211 |
| `hyt` | `classifySessionPlaneByKey` | inferred | 89267 |
| `O0e` | `resolveIsolatedPlaneKind` | inferred | 89537 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Xv` | `resolveMetaPromptText` | __export | 55069 |
| `Ahe` | `renderJobMissionBlock` | __export | 55086 |
| `Nhe` | `renderPromptLayers` | __export | 55093 |
| `Jh` | `buildSystemPromptForChannelConfig` | __export | 55120 |
| `Uye` | `extractSystemPromptAppend` | __export | 61925 |
| `Bbe` | `decideRestartHintInjection` | inferred | 65821 |
| `Vbe` | `renderDaemonRestartHint` | inferred | 65850 |
| `ZSe` | `projectJobPromptContext` | inferred | 70237 |
| `Jdt` | `renderJobCompleteReceiptGuidance` | inferred | 71448 |
| `RO` | `renderMailboxEventPrompt` | inferred | 71491 |
| `Kdt` | `renderSkipRewindBlock` | inferred | 71574 |
| `QSe` | `computeTimeGapContext` | inferred | 71631 |
| `eke` | `buildTransientUserBlocks` | inferred | 71668 |
| `WEe` | `transcludeBroadcastBoard` | inferred | 82197 |
| `hgt` | `renderTranscludedFiles` | inferred | 82205 |
| `JEe` | `resolveBoardIncludes` | inferred | 82212 |
| `ygt` | `realpathOrSelf` | inferred | 82246 |
| `qEe` | `normalizeIncludePathKey` | inferred | 82254 |
| `ZEe` | `initBoardTransclusionModule` | inferred | 82337 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `aU` | `detectInProcessBreak` | __export | 36733 |
| `za` | `drainRecordPath` | __export | 36745 |
| `Qd` | `appendDrainRecord` | __export | 36748 |
| `Vm` | `readDrainRecords` | __export | 36767 |
| `Lle` | `accumulateDrainRecordIntoSummary` | inferred | 36833 |
| `Cb` | `summarizeDrainRecords` | __export | 36845 |
| `lU` | `readGlobalUsageTotals` | __export | 36872 |
| `AXe` | `readRecentDrainRecords` | __export | 36889 |
| `Mle` | `IN_PROCESS_BREAK_HIT_RATIO_FLOOR` | __export | 36906 |
| `cC` | `runSkipTool` | inferred | 54687 |
| `Bu` | `initSkipToolModule` | inferred | 54711 |
| `Wh` | `isAbortLikeError` | __export | 54968 |
| `sg` | `normalizeTurnAbortReason` | inferred | 61784 |
| `zye` | `computeCodexTurnUsage` | __export | 61901 |
| `Eo` | `runTimedDrainPhase` | inferred | 70202 |
| `ASe` | `resolveTurnModelWithLayer` | inferred | 70247 |
| `NSe` | `resolveTurnEffortWithLayer` | inferred | 70260 |
| `MSe` | `extractServedModelFromUsage` | inferred | 70276 |
| `SH` | `prepareDrainTurnContext` | inferred | 70284 |
| `GSe` | `buildTurnSdkRunConfig` | inferred | 70336 |
| `FSe` | `markTurnSkippedFromSkipRecord` | inferred | 71797 |
| `xH` | `readPendingOutboundAttachments` | inferred | 71803 |
| `EH` | `batchDrainItems` | inferred | 71807 |
| `zSe` | `parseEventTimestampMs` | inferred | 71856 |
| `cft` | `isMergeableDrainBatch` | inferred | 71862 |
| `dft` | `isMergeableChannelMessageBatch` | inferred | 71866 |
| `nke` | `hasUniformDrainCoalesceKey` | inferred | 71874 |
| `rke` | `isWorkerTaskNotifyDelivery` | inferred | 71880 |
| `ike` | `extractJobCompletePayload` | inferred | 71888 |
| `oke` | `extractJobCompletionJobId` | inferred | 71894 |
| `USe` | `classifyDrainBatchClass` | inferred | 71901 |
| `pft` | `computeDrainCoalesceKey` | inferred | 71909 |
| `mft` | `resolveEventSourceChannelId` | inferred | 71917 |
| `gft` | `collectJobCompletionReceipts` | inferred | 71943 |
| `xft` | `runHistoryControlCommand` | inferred | 72119 |
| `Eft` | `renderDrainErrorRuntimeHint` | inferred | 72210 |
| `Xw` | `handleDrainError` | inferred | 72237 |
| `Rft` | `clearModelOverrideOnRuntimeFlip` | inferred | 72293 |
| `Ift` | `resolvePendingModelFork` | inferred | 72310 |
| `Cft` | `renderRuntimeUnavailableGuidance` | inferred | 72358 |
| `$ft` | `renderRuntimeMismatchGuidance` | inferred | 72366 |
| `HSe` | `runDrainQueryAndCollectOutboundAttachments` | inferred | 72392 |
| `Qw` | `initMailboxDrainRunnerModule` | inferred | 72615 |
| `rS` | `initQueueOutboundAttachmentModule` | inferred | 73306 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `grt` | `selectDominantModelByInputTokens` | inferred | 54855 |
| `Vh` | `mapClaudeResultToDrainUsage` | inferred | 54880 |
| `The` | `findDeadAllowedToolEntries` | __export | 54945 |
| `Phe` | `splitDisallowedToolsForClaude` | __export | 54950 |
| `Gv` | `isAgentSdkTurnInterruptedError` | __export | 54960 |
| `Kv` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 54964 |
| `Zv` | `normalizeOptionalEnvString` | inferred | 54981 |
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
| `wo` | `initAgentSdkAdapterModule` | inferred | 55516 |
| `lut` | `buildClaudeSettingsEnvOverrides` | inferred | 65353 |
| `Dw` | `initMaterializedClaudeSettingsModule` | inferred | 65429 |
| `rbe` | `mergeClaudeToolLists` | inferred | 65452 |
| `KV` | `applyJobSdkConfigOverride` | inferred | 65582 |
| `Owe` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 68851 |
| `G6` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 68920 |
| `aSe` | `buildProfiledExternalRequirement` | inferred | 69670 |
| `lH` | `classifyModelContextRequirement` | inferred | 69700 |
| `OSe` | `resolveAdditionalDirClaudeMdAutoload` | inferred | 70231 |
| `Yg` | `createAladuoMcpServer` | inferred | 79918 |
| `r0e` | `initAbortableAsyncQueueModule` | inferred | 82753 |
| `s0e` | `createClaudeStreamingSessionFactory` | inferred | 82911 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `kV` | `buildCodexDirectOnlyToolConfig` | inferred | 61824 |
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
| `Df` | `initCodexAppServerModule` | inferred | 62719 |
| `gdt` | `generatePartitionCodexAgents` | __export | 69245 |
| `eSe` | `parseAgentMarkdown` | __export | 69319 |
| `tSe` | `renderAgentToml` | __export | 69334 |
| `wA` | `buildCodexDynamicTools` | inferred | 80065 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `mB` | `PARTITION_CORE_TOOLS` | __export | 55516 |
| `dw` | `parseScheduleDurationMs` | inferred | 60989 |
| `gV` | `assertScheduleDurationRepresentable` | inferred | 61000 |
| `Rye` | `validateJobScheduleExpression` | inferred | 61008 |
| `Nye` | `parseJobFileFrontmatter` | inferred | 61236 |
| `Sst` | `renderJobFileMarkdown` | inferred | 61257 |
| `Ju` | `initJobManagerModule` | inferred | 61321 |
| `cat` | `renderJobPromptModeDescription` | inferred | 63750 |
| `dat` | `renderJobExtraToolsDescription` | inferred | 63757 |
| `c_e` | `buildJobPromptModeExtraToolsSchema` | inferred | 63761 |
| `hat` | `listSelectableJobRuntimes` | inferred | 63768 |
| `f_e` | `buildJobRuntimeSchemaField` | inferred | 63777 |
| `cg` | `runManageJobTool` | inferred | 63802 |
| `Sw` | `initManageJobToolModule` | inferred | 63939 |
| `Rw` | `initRemindDuoduoToolModule` | inferred | 64327 |
| `A_e` | `classifyConsumerStaleness` | inferred | 64840 |
| `VV` | `resolveNotifyUnconsumedHours` | inferred | 64853 |
| `HV` | `initNotifyConsumerStalenessModule` | inferred | 64859 |
| `P$` | `evaluateNotifyConsumerRefusal` | inferred | 64867 |
| `Wat` | `listSessionsWithRecentConsumer` | inferred | 64890 |
| `C$` | `renderNotifyRefusalMessage` | inferred | 64916 |
| `Z_e` | `isOrphanJobSessionKey` | inferred | 65034 |
| `rut` | `resolveNotifyTargetSessionKey` | inferred | 65179 |
| `V_e` | `renderNotifyDeliveryReport` | inferred | 65212 |
| `Aw` | `initNotifyToolModule` | inferred | 65324 |
| `Bw` | `loadSubconsciousPartitions` | inferred | 66190 |
| `Xut` | `parsePartitionDefinition` | inferred | 66214 |
| `_g` | `readPlaylistRound` | inferred | 66255 |
| `Qut` | `parsePlaylistCurrentRound` | inferred | 66273 |
| `H$` | `markPlaylistItemExecuted` | inferred | 66292 |
| `ave` | `rebuildPlaylistRound` | inferred | 66310 |
| `W$` | `initSubconsciousPlaylistModule` | inferred | 66397 |
| `jf` | `readPartitionRunState` | inferred | 66420 |
| `y6` | `writePartitionRunState` | inferred | 66443 |
| `_6` | `isPartitionBackedOff` | inferred | 66447 |
| `b6` | `computePartitionBackoffUntil` | inferred | 66451 |
| `J$` | `initPartitionRunStateModule` | inferred | 66463 |
| `kwe` | `resolveCadenceIntervalMs` | __export | 68552 |
| `sdt` | `computeLegacyJobSessionKey` | inferred | 69044 |
| `adt` | `rewriteSessionKeyInStateAndMeta` | inferred | 69065 |
| `Gwe` | `retireListedPartitions` | inferred | 69151 |
| `fdt` | `retirePartitionOnce` | inferred | 69164 |
| `Kwe` | `initPartitionRetirementModule` | inferred | 69216 |
| `Lgt` | `stringifyPartitionToolInput` | inferred | 85702 |
| `zgt` | `detectEmptyRequiredPartitionOutput` | inferred | 85712 |
| `qgt` | `hashActivityFingerprint` | inferred | 85754 |
| `Bgt` | `readLatestExternalEventId` | inferred | 85757 |
| `Vgt` | `renderPartitionRuntimeContext` | inferred | 85802 |
| `Hgt` | `renderPartitionInboxSection` | inferred | 85809 |
| `Zgt` | `runCadenceTick` | __export | 86463 |
| `yJ` | `scanAndSpawnDueJobs` | __export | 86494 |
| `Ygt` | `createJobScheduler` | __export | 86655 |
| `v0e` | `initJobSchedulerModule` | inferred | 86711 |
| `Qgt` | `createOutboxDeliveryManager` | __export | 86726 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `qw` | `partitionInboxDir` | __export | 66175 |
| `Rc` | `partitionInboxDirFromVar` | __export | 66179 |
| `Ai` | `resolveMemoryDirs` | inferred | 66479 |
| `Lf` | `scanWikiLinkOccurrences` | inferred | 66493 |
| `Ff` | `resolveMemoryLinkTargets` | inferred | 66518 |
| `xo` | `recordUnreadableMemoryPath` | inferred | 66557 |
| `hve` | `normalizeSignalKindVersion` | inferred | 66613 |
| `Vo` | `initMemorySignalKindsModule` | inferred | 66617 |
| `yve` | `collectBoardLintReport` | inferred | 66768 |
| `ylt` | `runBoardLint` | inferred | 66832 |
| `Tc` | `createMemorySlugReader` | inferred | 66866 |
| `Pc` | `walkReachableMemory` | inferred | 66881 |
| `vlt` | `renderEntityConvergeSignalBody` | inferred | 66924 |
| `Sve` | `runEntityLint` | inferred | 66932 |
| `kve` | `initEntityLintModule` | inferred | 66972 |
| `Slt` | `isAllowedNodeSection` | inferred | 66982 |
| `xlt` | `renderNodeConvergeSignalBody` | inferred | 66997 |
| `xve` | `runNodeLint` | inferred | 67009 |
| `P6` | `initGapSpanModule` | inferred | 67186 |
| `Jw` | `readPartitionContract` | inferred | 67193 |
| `nO` | `getCachedPartitionContract` | inferred | 67284 |
| `rO` | `postMemorySignalsToInboxes` | inferred | 67290 |
| `iO` | `enforceContractGate` | inferred | 67343 |
| `Mve` | `reconcileMemorySignalInboxes` | inferred | 67374 |
| `jve` | `hasAnyMemorySignalConsumer` | inferred | 67417 |
| `Lve` | `isOrphanWarningDeliverable` | inferred | 67426 |
| `O6` | `initMemorySignalDeliveryModule` | inferred | 67429 |
| `Uve` | `readGapLintDayEvents` | inferred | 67583 |
| `Bve` | `mergeContiguousHourRanges` | inferred | 67624 |
| `Jlt` | `renderScanGapSignalBody` | inferred | 67643 |
| `Zlt` | `buildScanGapSignal` | inferred | 67649 |
| `Glt` | `runGapLint` | inferred | 67676 |
| `Zve` | `deliverScanGapSignal` | inferred | 67712 |
| `Qve` | `runBroadcastBudgetLint` | inferred | 67830 |
| `D6` | `initBroadcastBudgetLintModule` | inferred | 67869 |
| `cct` | `listEventPartitionDates` | inferred | 67882 |
| `gct` | `renderActivationReportBody` | inferred | 68008 |
| `rwe` | `runActivationLint` | inferred | 68014 |
| `U6` | `initActivationLintModule` | inferred | 68113 |
| `awe` | `readIntuitionWeaverLastFinishedMs` | inferred | 68123 |
| `yct` | `findNewestFragmentMtimeMs` | inferred | 68129 |
| `_ct` | `renderFoldGapBody` | inferred | 68159 |
| `uwe` | `runFoldGapLint` | inferred | 68165 |
| `lwe` | `initFoldGapLintModule` | inferred | 68182 |
| `Sct` | `extractBoardSlugLinks` | inferred | 68191 |
| `Ect` | `formatSlugLinkLocations` | inferred | 68214 |
| `cwe` | `runBroadcastLinkLint` | inferred | 68228 |
| `dwe` | `initBroadcastLinkLintModule` | inferred | 68249 |
| `Oct` | `findBoardHeadingLines` | inferred | 68256 |
| `fwe` | `runBroadcastFlattenLint` | inferred | 68281 |
| `pwe` | `initBroadcastFlattenLintModule` | inferred | 68302 |
| `Dct` | `computeOrphanTopicNodes` | inferred | 68320 |
| `gwe` | `detectOrphanMemory` | inferred | 68369 |
| `ywe` | `buildOrphanNewbornSignals` | inferred | 68392 |
| `_we` | `forgetMemoryEntry` | inferred | 68401 |
| `jct` | `renderOrphanIslandsBody` | inferred | 68451 |
| `bwe` | `filterOrphanIslands` | inferred | 68465 |
| `vwe` | `buildOrphanIslandsSignal` | inferred | 68469 |
| `Lct` | `computeMemoryLinkIndegree` | inferred | 68478 |
| `Fct` | `listMemorySlugReferrers` | inferred | 68489 |
| `q6` | `routeContractDecision` | inferred | 68506 |
| `Uct` | `formatForgetCommitMessage` | inferred | 68518 |
| `wwe` | `initOrphanMemoryModule` | inferred | 68521 |
| `W6` | `resolveMemoryCheckFlags` | __export | 68543 |
| `J6` | `buildMemoryCheckStatus` | __export | 68559 |
| `qct` | `runMemoryCheckTick` | __export | 68573 |
| `H6` | `runMemoryCheckSubStep` | inferred | 68689 |
| `ua` | `runReadAuditedMemoryCheckStep` | inferred | 68697 |
| `Bct` | `evaluatePredicateOrFalse` | inferred | 68704 |
| `Z6` | `initMemoryCheckTickModule` | inferred | 68711 |
| `lJ` | `computeBoardLayerHash` | __export | 82353 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Ei` | `isEffortLevel` | inferred | 31533 |
| `F0` | `isRuntimeKind` | inferred | 31611 |
| `Aa` | `isSupportedRuntime` | inferred | 31729 |
| `Co` | `resolveDefaultRuntime` | inferred | 31733 |
| `wm` | `parseEnvBooleanFlag` | inferred | 31909 |
| `wb` | `normalizePromptMode` | inferred | 35036 |
| `CR` | `parseChannelConfigFields` | inferred | 35388 |
| `z$` | `foldConfigLayersByKey` | inferred | 65456 |
| `sbe` | `mergeRuntimeModelLayers` | inferred | 65485 |
| `abe` | `mergeRuntimeEffortLayers` | inferred | 65495 |
| `Mw` | `readRuntimeModelSetting` | inferred | 65505 |
| `jw` | `readRuntimeEffortSetting` | inferred | 65509 |
| `GV` | `overlayConfigEntriesByKey` | inferred | 65559 |
| `lbe` | `appendPiConfigIssues` | inferred | 65603 |
| `cbe` | `buildEffectiveChannelConfig` | inferred | 65607 |
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
| `IH` | `encodePiWorkerFrame` | inferred | 72662 |
| `eS` | `resolvePiWorkerCommand` | inferred | 72731 |
| `xke` | `parsePiToolResultDetails` | inferred | 73349 |
| `Eke` | `handlePiToolEndObservation` | inferred | 73355 |
| `t6` | `CHANNEL_CONFIG_KEY_TYPES` | inferred | 87923 |
| `kut` | `validateConfigValue` | inferred | 87961 |
| `Lbe` | `writeInstanceModelAlias` | inferred | 88456 |
| `Xct` | `isClaudeAuthSource` | inferred | 89053 |
| `Q6` | `readClaudeAuthSourceEnv` | inferred | 89057 |
| `uyt` | `buildSdkConfigReport` | inferred | 89131 |
| `lyt` | `buildSystemConfigReport` | inferred | 89149 |
| `T0e` | `formatLayerModelAliases` | inferred | 90076 |
| `SJ` | `formatModelConfigIssues` | inferred | 90099 |
| `ty` | `appendConfigChangedEvent` | inferred | 90314 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `OV` | `isGrokAvailable` | __export | 62958 |
| `Fst` | `grokUnavailableReason` | __export | 62962 |
| `zst` | `primeGrokAvailability` | __export | 62965 |
| `Ust` | `__setGrokAvailabilityForTests` | __export | 62970 |
| `kc` | `checkGrokAvailability` | __export | 62973 |
| `bw` | `grokAcpExtMethod` | __export | 62994 |
| `s_e` | `collectGrokToolCallNames` | inferred | 63046 |
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
| `lg` | `initGrokAcpRuntimeModule` | inferred | 63676 |
