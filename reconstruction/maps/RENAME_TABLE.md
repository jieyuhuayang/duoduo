# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*；其中标注 *published source* 的名字是上游在同作者的公开源码包里的拼写，由 `maps/published_daemon.json` 记录）。“原行号”指反混淆后的 `daemon.pretty.js`。“首见版本”是 npm 上最早含有该声明的发行版（`maps/history_daemon.json`，由 `tools/history.sh` 逐版本配对得出）。

共 795 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.4。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `KR` | `resolveRegistryStatusPath` | inferred | 32980 | v0.2.0 |
| `wU` | `buildInitialRegistryStatus` | inferred | 32984 | v0.2.0 |
| `SU` | `writeRegistryStatusFile` | inferred | 33011 | v0.2.0 |
| `Mb` | `readRegistryStatusFile` | inferred | 33014 | v0.2.0 |
| `Vu` | `updateRegistryStatus` | inferred | 33022 | v0.2.0 |
| `tde` | `createVoidAwareAttachmentCallbacks` | inferred | 36957 | v0.8.4 |
| `Ect` | `daemonRestartReasonPath` | inferred | 66052 | v0.6.2 |
| `iwe` | `claimDaemonRestartReason` | inferred | 66055 | v0.6.2 |
| `owe` | `setPendingRestartReason` | inferred | 66081 |  |
| `swe` | `getPendingRestartReason` | inferred | 66085 | v0.8.0 |
| `lwe` | `renderRestartWakeMessage` | inferred | 66127 | v0.8.0 |
| `cH` | `resolveRuntimeWriterLockPath` | inferred | 89212 | v0.2.0 |
| `jct` | `isProcessAliveByPid` | inferred | 89216 | v0.2.0 |
| `Lct` | `computeHostBootId` | inferred | 89226 | v0.3.0 |
| `_we` | `getCachedHostBootId` | inferred | 89243 |  |
| `Fct` | `isRuntimeWriterLockStale` | inferred | 89247 | v0.3.0 |
| `fH` | `acquireRuntimeWriterLock` | inferred | 89259 | v0.2.0 |
| `EO` | `releaseRuntimeWriterLock` | inferred | 89312 | v0.2.0 |
| `wIe` | `readEnvIntegerOrFallback` | inferred | 90501 | v0.2.0 |
| `avt` | `deliverDaemonRestartWakes` | __export | 91202 | v0.8.0 |
| `Svt` | `createDaemon` | __export | 92035 | v0.2.0 |
| `kvt` | `main` | __export | 93073 | v0.2.0 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `gs` | `iterateStreamLines` | inferred | 31898 | v0.8.0 |
| `Bi` | `stringifyJsonlRecord` | inferred | 31932 | v0.8.0 |
| `zu` | `memoizeIndexLoad` | inferred | 31939 | v0.8.0 |
| `Uu` | `isIndexLoadStillCurrent` | inferred | 31944 | v0.8.0 |
| `Dt` | `writeFileAtomic` | inferred | 31956 | v0.2.0 |
| `Bt` | `writeJsonFileAtomic` | inferred | 31972 | v0.2.0 |
| `Ne` | `ensureDirectoryExists` | inferred | 31985 | v0.2.0 |
| `B8e` | `enqueuePartitionAppend` | inferred | 32091 | v0.2.0 |
| `V8e` | `generateSpineEventId` | inferred | 32096 | v0.2.0 |
| `zm` | `formatEventPartitionName` | inferred | 32100 | v0.2.0 |
| `en` | `createSpineEvent` | inferred | 32104 | v0.2.0 |
| `W8e` | `appendEventToPartition` | inferred | 32111 | v0.2.0 |
| `Rb` | `resolveEventIdIndexPath` | inferred | 32134 | v0.2.0 |
| `J8e` | `appendEventIdIndexEntry` | inferred | 32137 | v0.2.0 |
| `tn` | `atomicAppendEvent` | inferred | 32146 | v0.2.0 |
| `Oo` | `readEventById` | inferred | 32155 | v0.3.1 |
| `G8e` | `readEventAtIndexedOffset` | inferred | 32163 | v0.3.1 |
| `Z8e` | `scanPartitionsForEventId` | inferred | 32181 | v0.2.0 |
| `Ib` | `lookupEventIdIndexEntry` | inferred | 32198 | v0.2.0 |
| `K8e` | `getOrCreateEventIdIndexCache` | inferred | 32212 | v0.2.0 |
| `Y8e` | `isUsableEventIndexEntry` | inferred | 32222 | v0.8.2 |
| `X8e` | `loadEventIdIndex` | inferred | 32225 | v0.2.0 |
| `wae` | `findEventInPartitionFile` | inferred | 32262 |  |
| `Sae` | `readSpineIndexRetentionDays` | inferred | 32276 | v0.8.0 |
| `kae` | `pruneEventIdIndexByRetention` | inferred | 32282 | v0.8.0 |
| `Ao` | `initSpineEventLogModule` | inferred | 32324 | v0.8.0 |
| `xYe` | `resolveConsumerOffsetPath` | inferred | 32955 | v0.2.0 |
| `EYe` | `writeConsumerOffsetFile` | inferred | 32958 | v0.2.0 |
| `Bu` | `advanceConsumerWatermark` | inferred | 32961 | v0.2.0 |
| `JR` | `spineEventDedupStore` | inferred | 87200 | v0.2.0 |
| `GR` | `computeDedupKey` | inferred | 87260 | v0.2.0 |
| `nv` | `loadRegistryDedupStore` | inferred | 87423 | v0.2.0 |
| `pH` | `readPartitionByteRange` | inferred | 89326 | v0.8.2 |
| `qct` | `iteratePartitionLinesBackward` | inferred | 89338 | v0.8.2 |
| `Bct` | `resolveTailCursorEndOffset` | inferred | 89350 | v0.8.2 |
| `vwe` | `readPartitionTail` | inferred | 89365 | v0.8.2 |
| `wwe` | `readSpineTail` | inferred | 89404 | v0.3.2 |
| `Apt` | `shouldKeepRouteDeliverEvent` | inferred | 90355 | v0.8.4 |
| `Ske` | `stripSpineEventToEnvelope` | inferred | 90359 | v0.8.4 |
| `Npt` | `redactSpineEventForExternal` | inferred | 90373 | v0.8.4 |
| `Dpt` | `checkReservedRecordSource` | inferred | 90418 | v0.8.4 |
| `Eke` | `recordExternalSpineEvent` | inferred | 90429 | v0.8.4 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Sb` | `isJsonRpcRequest` | inferred | 31516 | v0.2.0 |
| `at` | `isRecord` | inferred, published source (@openduo/protocol@0.8.4 rpc.ts) | 31522 | v0.2.0 |
| `Ri` | `isOptionalString` | inferred, published source (@openduo/protocol@0.8.4 rpc.ts) | 31526 | v0.2.0 |
| `Qz` | `initProtocolEffortModule` | inferred, published source (@openduo/protocol@0.8.4 effort.ts) | 31536 | v0.8.0 |
| `nR` | `isSystemRuntimeInfo` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31541 | v0.2.0 |
| `rR` | `isRuntimeInfoParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31545 | v0.2.0 |
| `iR` | `isSessionArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31552 | v0.5.0 |
| `eU` | `isSessionListKind` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31556 | v0.5.4 |
| `oR` | `isSessionListParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31560 | v0.5.4 |
| `sR` | `isSessionSetAliasParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31564 | v0.5.4 |
| `aR` | `isSessionWakeParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31568 | v0.8.2 |
| `uR` | `isSessionNotifyParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31572 | v0.5.4 |
| `lR` | `isSessionModelParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31576 | v0.8.0 |
| `cR` | `isSessionEffortParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31580 | v0.8.0 |
| `dR` | `isSessionCompactParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31584 | v0.5.8 |
| `fR` | `isSessionConfigParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31588 | v0.5.10 |
| `$8e` | `isNonEmptyText` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31600 | v0.8.4 |
| `tU` | `unknownKeyProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31604 | v0.8.4 |
| `lae` | `textKeysProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31609 | v0.8.4 |
| `Dm` | `renderParamsProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31617 | v0.8.4 |
| `cae` | `describeConversationProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31624 |  |
| `nU` | `describeMemoryReadProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31628 |  |
| `rU` | `describeSpineCatProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31632 | v0.8.4 |
| `iU` | `describeSpineRecordProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31644 | v0.8.4 |
| `oU` | `initProtocolSystemModule` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31647 | v0.7.1 |
| `sU` | `isModelRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31673 |  |
| `yR` | `isChannelIngressParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31677 | v0.2.0 |
| `_R` | `isChannelFileUploadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31681 | v0.2.0 |
| `bR` | `isChannelFileDownloadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31685 | v0.2.0 |
| `Mm` | `isChannelPullParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31689 | v0.2.0 |
| `vR` | `isChannelCommandParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31693 | v0.2.0 |
| `wR` | `isChannelAckParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31697 | v0.2.0 |
| `SR` | `isChannelDescribeParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31701 | v0.5.0 |
| `kR` | `isChannelSpawnParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31705 | v0.5.0 |
| `O8e` | `isAttachmentArray` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31709 | v0.2.0 |
| `A8e` | `isChannelCapabilities` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31713 | v0.2.0 |
| `N8e` | `isMimePattern` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31720 | v0.2.0 |
| `dae` | `initChannelProtocolModule` | inferred | 31723 |  |
| `xR` | `isJobCreateParams` | inferred | 31734 | v0.2.0 |
| `ER` | `isJobGetParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31738 | v0.2.0 |
| `RR` | `isJobListParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31742 | v0.2.0 |
| `IR` | `isJobArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31746 |  |
| `TR` | `isJobRescheduleParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31750 | v0.8.2 |
| `PR` | `isJobInterruptParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31754 | v0.8.2 |
| `pae` | `initProtocolJobModule` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31757 | v0.7.1 |
| `$R` | `isSystemStatusParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 31766 |  |
| `CR` | `isSystemConfigParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 31770 |  |
| `OR` | `isSpineTailParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 31774 | v0.3.2 |
| `sh` | `isValidChannelId` | inferred | 35805 | v0.2.0 |
| `ah` | `assertValidChannelId` | inferred | 35809 | v0.2.0 |
| `vs` | `readChannelDescriptor` | inferred | 35849 | v0.2.0 |
| `QQe` | `generateOutboxRecordId` | inferred | 36036 | v0.2.0 |
| `Xb` | `resolveOutboxRecordPath` | inferred | 36040 | v0.2.0 |
| `Ba` | `createOutboxRecord` | inferred | 36044 | v0.2.0 |
| `Va` | `persistOutboxRecord` | inferred | 36076 | v0.2.0 |
| `Ha` | `readOutboxRecord` | inferred | 36090 | v0.2.0 |
| `Qb` | `listAllOutboxRecords` | inferred | 36115 | v0.2.0 |
| `lh` | `findOutboxRecordByEventId` | inferred | 36147 | v0.2.0 |
| `df` | `recordOutboxDeliveryAttempt` | inferred | 36155 | v0.2.0 |
| `nq` | `resolveOutboxByEventIndexPath` | inferred | 36179 | v0.2.0 |
| `Cce` | `resolveOutboxSentIdsPath` | inferred | 36183 | v0.2.0 |
| `ret` | `loadOutboxByEventIndex` | inferred | 36196 | v0.2.0 |
| `ch` | `recordOutboxSentId` | inferred | 36243 | v0.2.0 |
| `mI` | `resolveOutboxReplayDir` | inferred | 36249 | v0.3.0 |
| `ws` | `resolveOutboxReplayFilePath` | inferred | 36257 |  |
| `rq` | `resolveOutboxByIdIndexPath` | inferred | 36268 | v0.3.0 |
| `ia` | `lookupOutboxByIdIndexEntry` | inferred | 36320 |  |
| `det` | `ensureOutboxRecordInReplay` | inferred | 36373 | v0.3.0 |
| `hI` | `backfillOutboxByIdIndexFromReplay` | inferred | 36545 | v0.3.0 |
| `ic` | `resolveOutboxPendingQueuePath` | inferred | 36581 | v0.3.1 |
| `met` | `hasUnqueuedPendingOutboxRecords` | inferred | 36631 | v0.3.1 |
| `Bce` | `listRetryableOutboxRecords` | inferred | 36700 | v0.3.1 |
| `jo` | `initOutboxStoreModule` | inferred | 36718 | v0.3.1 |
| `nde` | `listVoidChannelSessions` | inferred | 36969 | v0.8.4 |
| `wI` | `writeVoidSessionOutboxRecord` | inferred | 36981 | v0.8.4 |
| `Dbe` | `updateDeliveryCursorFile` | inferred | 64398 | v0.5.6 |
| `jbe` | `resolveDeliveryCursorPath` | inferred | 64419 | v0.2.0 |
| `Lbe` | `readDeliveryCursorFile` | inferred | 64431 | v0.2.0 |
| `j6` | `advanceOptimisticDeliveryCursor` | inferred | 64474 | v0.3.0 |
| `Yw` | `readOutboxRecordsPastCursor` | inferred | 64574 | v0.2.0 |
| `Ube` | `replayOutboxBacklogToSubscriber` | inferred | 64632 | v0.2.0 |
| `tO` | `readLatestDeliveryCursorUpdate` | inferred | 64718 |  |
| `Zf` | `hasNonEmptyDisplayName` | inferred | 64850 | v0.5.4 |
| `Olt` | `filterDeliverableSessions` | inferred | 64885 | v0.8.4 |
| `As` | `deliverRouteEventToSession` | inferred | 65038 | v0.8.0 |
| `JO` | `DAEMON_TOKEN_ENV_KEY` | __export | 69211 |  |
| `Wce` | `lookupInjectionPrompt` | inferred | 87390 | v0.5.7 |
| `lde` | `readRoutingTarget` | inferred | 87429 | v0.2.0 |
| `mde` | `canonicalizeGatewayCommand` | inferred | 87442 | v0.2.0 |
| `xI` | `parseInjectionPromptCommand` | inferred | 87455 | v0.5.7 |
| `hde` | `expandInjectionPromptCommand` | inferred | 87471 | v0.5.7 |
| `tv` | `parseGatewayCommandText` | inferred | 87480 | v0.2.0 |
| `mq` | `classifyGatewayCommandIntent` | inferred | 87496 | v0.2.0 |
| `Aet` | `resolveRoutingTarget` | inferred | 87509 | v0.2.0 |
| `gde` | `ingestChannelMessage` | inferred | 87515 | v0.2.0 |
| `rv` | `ingestChannelCommand` | inferred | 87540 | v0.2.0 |
| `yde` | `appendBeforeExecuteGateway` | inferred | 87568 | v0.2.0 |
| `_de` | `probeEventsAppendable` | inferred | 87719 | v0.2.0 |
| `Net` | `replyToGatewayCommandEvent` | inferred | 87734 | v0.2.0 |
| `Fet` | `executeGatewayCommand` | inferred | 87857 | v0.2.0 |
| `zet` | `writeIngressSnapshot` | inferred | 88165 | v0.2.0 |
| `uH` | `createSessionSubscriptionRegistry` | inferred | 89020 | v0.2.0 |
| `Uc` | `MemoryReadRpcError` | inferred | 89447 |  |
| `QSe` | `readMemoryFileForRpc` | inferred | 89453 | v0.8.4 |
| `tp` | `SpineRpcParamsError` | inferred | 90350 |  |
| `xke` | `runSpineCatRpc` | inferred | 90393 | v0.8.4 |
| `Tt` | `JsonRpcInvalidParamsError` | inferred | 90474 | v0.2.0 |
| `pIe` | `bindSessionSourceChannel` | inferred | 90477 |  |
| `mIe` | `assertWsChannelIdentityParams` | inferred | 90486 | v0.2.0 |
| `CG` | `normalizeReturnMask` | inferred | 90618 | v0.2.0 |
| `Kbt` | `normalizeChannelCapabilityDeclarations` | inferred | 90648 | v0.3.3 |
| `Ybt` | `recordChannelCapabilityDeclaration` | inferred | 90658 | v0.2.0 |
| `dp` | `resolveExistingDirRealpath` | inferred | 90693 | v0.2.0 |
| `SIe` | `ensureAbsoluteWorkspaceDir` | inferred | 90703 | v0.2.0 |
| `hIe` | `resolveIngressWorkspace` | inferred | 90710 | v0.2.0 |
| `tvt` | `describeChannelInstance` | inferred | 90778 | v0.5.0 |
| `nvt` | `archiveSessionIfQuiescent` | inferred | 90842 | v0.5.0 |
| `kIe` | `refreshSessionIndexEntry` | inferred | 90915 |  |
| `rvt` | `setSessionAliasAndReindex` | inferred | 90919 | v0.5.4 |
| `ivt` | `resolveSessionByExactKey` | inferred | 90936 | v0.8.4 |
| `fp` | `resolveSessionByKeyOrAlias` | inferred | 90948 | v0.5.4 |
| `ovt` | `scheduleSessionWakeRecord` | inferred | 90977 | v0.8.2 |
| `EIe` | `deliverExternalSessionNotify` | inferred | 91037 | v0.5.4 |
| `svt` | `replayIdempotentSessionNotify` | inferred | 91177 | v0.8.4 |
| `uvt` | `readOrSetSessionModel` | inferred | 91227 | v0.8.0 |
| `lvt` | `readOrSetSessionEffort` | inferred | 91257 | v0.8.0 |
| `cvt` | `enqueueSessionCompactCommand` | inferred | 91287 | v0.5.8 |
| `RIe` | `checkChannelRuntimeRebindConflict` | inferred | 91398 | v0.8.3 |
| `fvt` | `applySessionConfigVerb` | inferred | 91407 | v0.5.10 |
| `yvt` | `upsertChannelSpawnDescriptor` | inferred | 91873 | v0.5.0 |
| `vvt` | `isLoopbackBindHost` | __export | 92002 | v0.7.0 |
| `wvt` | `resolveRemoteListenerConfig` | __export | 92009 | v0.7.0 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Gd` | `moveFileIntoDirectory` | inferred | 32340 | v0.5.6 |
| `Do` | `hashSessionKey` | inferred | 32360 | v0.2.0 |
| `Yn` | `resolveSessionDir` | inferred | 32364 | v0.2.0 |
| `nYe` | `resolveSessionsArchiveRoot` | inferred | 32368 | v0.4.5 |
| `Um` | `resolveArchivedSessionDir` | inferred | 32372 |  |
| `Qs` | `isSessionArchived` | inferred | 32376 |  |
| `Tb` | `resolveSessionInboxDir` | inferred | 32380 | v0.2.0 |
| `zR` | `resolveSessionMailboxMarkdownPath` | inferred | 32384 | v0.2.0 |
| `Iae` | `resolveSessionMailboxDir` | inferred | 32388 |  |
| `Zd` | `resolveSessionMailboxPendingDir` | inferred | 32392 | v0.3.1 |
| `Pb` | `resolveSessionMailboxNotesPath` | inferred | 32396 | v0.3.1 |
| `La` | `resolveSessionMetaPath` | inferred | 32400 | v0.2.0 |
| `ys` | `resolveSessionStatePath` | inferred | 32404 | v0.2.0 |
| `$b` | `listPendingInboxFiles` | inferred | 32414 | v0.5.6 |
| `Cb` | `probeSessionPendingWork` | inferred | 32429 | v0.6.0 |
| `Tae` | `rehydrateSessionState` | inferred | 32443 | v0.4.0 |
| `Ob` | `moveSessionDirToArchive` | inferred | 32483 | v0.4.5 |
| `Vi` | `runWithSessionMutex` | inferred | 32513 | v0.5.0 |
| `qR` | `tryMarkSessionArchiving` | inferred | 32526 | v0.5.0 |
| `BR` | `clearSessionArchiving` | inferred | 32530 |  |
| `dr` | `isSessionArchiving` | inferred | 32534 |  |
| `ec` | `assertSessionNotArchiving` | inferred | 32538 |  |
| `Fa` | `initSessionLockAndArchivingModule` | inferred | 32541 | v0.5.0 |
| `bU` | `ensureSessionMailboxPendingDir` | inferred | 32647 |  |
| `ta` | `enqueueSessionInboxLine` | inferred | 32650 | v0.2.0 |
| `HR` | `mergeInboxIntoMailbox` | inferred | 32661 | v0.2.0 |
| `Nb` | `listMailboxPendingItems` | inferred | 32720 | v0.3.1 |
| `Mo` | `deleteMailboxPendingItemsByEventIds` | inferred | 32742 | v0.3.1 |
| `Db` | `appendSessionMailboxNote` | inferred | 32798 | v0.3.1 |
| `WR` | `renderSessionMailboxFile` | inferred | 32808 | v0.3.1 |
| `th` | `notifySessionFileChanged` | inferred | 35572 |  |
| `af` | `stripUndefinedFieldsDeep` | inferred | 35592 | v0.2.0 |
| `nh` | `ensureSessionDescriptorAndStateFiles` | inferred | 35600 | v0.2.0 |
| `na` | `readSessionMetaFile` | inferred | 35631 | v0.5.4 |
| `wce` | `updateSessionDisplayName` | inferred | 35640 | v0.2.0 |
| `rt` | `readSessionRuntimeState` | inferred | 35664 | v0.2.0 |
| `rh` | `readAllSessionStateFiles` | inferred | 35672 | v0.4.0 |
| `et` | `patchSessionRuntimeState` | inferred | 35690 | v0.2.0 |
| `uf` | `mutateSessionRuntimeState` | inferred | 35727 | v0.5.0 |
| `ra` | `clearSessionRuntimeStateField` | inferred | 35763 | v0.5.0 |
| `_n` | `classifySessionKeyKind` | inferred | 36840 | v0.5.0 |
| `uq` | `isUserVisibleSessionKey` | inferred | 36844 |  |
| `dh` | `buildSessionIndexFromDisk` | inferred | 36847 | v0.5.0 |
| `Xce` | `createEmptySessionIndex` | inferred | 36857 |  |
| `Qce` | `buildSessionIndexEntry` | inferred | 36861 | v0.5.0 |
| `ede` | `createMapBackedSessionIndex` | inferred | 36885 | v0.5.0 |
| `fh` | `resolveSessionChannelRuntime` | inferred | 36944 | v0.8.4 |
| `Gu` | `isVoidRuntimeSession` | inferred | 36952 | v0.8.4 |
| `ff` | `initVoidRuntimeModule` | inferred | 36998 |  |
| `dq` | `readAllSessionSummaries` | __export | 37150 | v0.2.0 |
| `V$` | `initCallerSessionEnvModule` | inferred | 55016 |  |
| `oC` | `issueWorkerToolContextToken` | inferred | 55858 | v0.8.0 |
| `oO` | `listSessionIndexSummaries` | inferred | 64866 | v0.5.4 |
| `Kbe` | `formatViewSessionsListLine` | inferred | 64904 | v0.8.2 |
| `Dg` | `runViewSessionsTool` | inferred | 64941 | v0.8.2 |
| `eS` | `initViewSessionsToolModule` | inferred | 64953 | v0.8.2 |
| `mwe` | `archiveSessionDirUnlessAlreadyArchiving` | inferred | 66138 | v0.5.6 |
| `hwe` | `archiveSessionAndArtifacts` | inferred | 66154 | v0.5.0 |
| `dwe` | `readStateSourceChannelId` | inferred | 66295 | v0.5.0 |
| `pwe` | `listArchivedCopiesNewestFirst` | inferred | 66316 | v0.5.0 |
| `Gke` | `archiveLegacyRegistrySessionsDir` | __export | 69662 | v0.5.0 |
| `sxe` | `acquireSessionDrainLock` | inferred | 70162 | v0.2.0 |
| `axe` | `refreshSessionDrainLockHeartbeat` | inferred | 70185 | v0.2.0 |
| `uxe` | `releaseSessionDrainLock` | inferred | 70190 | v0.2.0 |
| `xW` | `resolveSessionDrainLockPath` | inferred | 70202 | v0.2.0 |
| `lxe` | `readDrainLockFile` | inferred | 70205 | v0.2.0 |
| `zxe` | `drainSessionMailbox` | inferred | 70662 | v0.2.0 |
| `no` | `classifySessionKeyOrUnknown` | inferred | 71746 | v0.3.0 |
| `Zg` | `buildSessionInfoFromState` | inferred | 72634 | v0.2.0 |
| `hht` | `classifySessionPlane` | inferred | 72679 | v0.2.0 |
| `CS` | `resolvePiAgentDir` | inferred | 73448 | v0.8.0 |
| `OS` | `readPiAgentSettings` | inferred | 73452 | v0.8.0 |
| `iRe` | `stringifyExecutionToolInput` | inferred | 80488 | v0.2.0 |
| `sRe` | `buildSessionExecutionPayload` | inferred | 80502 | v0.2.0 |
| `uk` | `channelKindFromSessionKey` | inferred | 80532 | v0.2.0 |
| `aG` | `inferActorOriginFromSessionKey` | inferred | 80549 | v0.4.0 |
| `cRe` | `classifySessionPoolKind` | inferred | 80561 | v0.2.0 |
| `wy` | `SESSION_SCHEMA_VERSION` | __export | 80573 |  |
| `fRe` | `createJobSessionFinalizer` | inferred | 80578 | v0.8.0 |
| `mk` | `computeInstructionsFingerprint` | __export | 82650 | v0.4.5 |
| `SG` | `computeNonBoardInstructionsFingerprint` | __export | 82659 |  |
| `kN` | `diffStreamingConfigSignature` | __export | 82666 | v0.5.10 |
| `URe` | `computeMissionFingerprint` | __export | 82699 |  |
| `xN` | `runInstructionsFingerprintGuard` | __export | 82704 | v0.4.5 |
| `qRe` | `collectInstructionsInputs` | inferred | 82851 | v0.5.1 |
| `hk` | `initInstructionsFingerprintModule` | inferred | 82886 |  |
| `kG` | `narrowToModelSettableAdapter` | inferred | 82899 | v0.8.0 |
| `xG` | `computeStreamingConfigSignature` | inferred | 82903 | v0.8.0 |
| `EN` | `readLiveStreamContextToken` | inferred | 82921 | v0.8.0 |
| `EG` | `isLiveStreamRebuildRequired` | inferred | 82931 | v0.8.0 |
| `RN` | `flagStreamRecreationOnModelReject` | inferred | 82937 | v0.8.0 |
| `VRe` | `createModelCommandResolvers` | inferred | 82955 | v0.8.0 |
| `ubt` | `recordPendingInterruptMarker` | inferred | 83093 | v0.8.2 |
| `GRe` | `prependPendingInterruptMarker` | inferred | 83115 | v0.8.2 |
| `PN` | `interruptActorQuery` | inferred | 83136 | v0.8.0 |
| `RG` | `triggerDeferredPreempt` | inferred | 83140 | v0.8.0 |
| `gk` | `requestBoundaryAwarePreempt` | inferred | 83149 | v0.8.0 |
| `ZRe` | `snapshotInflightEventIds` | inferred | 83158 | v0.8.0 |
| `cp` | `teardownStreamingSession` | inferred | 83163 | v0.8.0 |
| `IG` | `waitForWakeOrIdleTimeout` | inferred | 83178 | v0.8.0 |
| `$N` | `shutdownActorRuntimeAdapter` | inferred | 83192 | v0.8.0 |
| `XRe` | `memoizeAvailabilityProbeUntilOk` | inferred | 83957 |  |
| `gbt` | `createSessionManager` | __export | 83964 | v0.2.0 |
| `Pbt` | `createMetaSession` | __export | 86170 | v0.2.0 |
| `$bt` | `sweepTombstonedSessionRecords` | __export | 86756 | v0.5.6 |
| `gwe` | `createIdleCompactSweeper` | inferred | 88861 | v0.5.10 |
| `DG` | `resolvePreemptFromCommandText` | inferred | 90630 | v0.2.0 |
| `Qbt` | `classifySessionPlaneByKey` | inferred | 90686 | v0.2.0 |
| `xIe` | `resolveIsolatedPlaneKind` | inferred | 90973 |  |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `xw` | `resolveMetaPromptText` | __export | 55385 | v0.2.0 |
| `_ot` | `renderJobAcceptanceBlock` | inferred | 55396 | v0.8.0 |
| `eye` | `renderJobMissionBlock` | __export | 55402 | v0.4.5 |
| `tye` | `renderPromptLayers` | __export | 55409 | v0.7.1 |
| `gg` | `buildSystemPromptForChannelConfig` | __export | 55436 | v0.2.0 |
| `ube` | `extractSystemPromptAppend` | __export | 62244 | v0.4.4 |
| `awe` | `decideRestartHintInjection` | inferred | 66093 | v0.5.2 |
| `uwe` | `renderDaemonRestartHint` | inferred | 66122 |  |
| `hA` | `formatLocalTimestampWithZone` | inferred | 70426 | v0.5.0 |
| `_xe` | `decideBoardUpdatedInjection` | inferred | 70449 | v0.5.10 |
| `bxe` | `renderBoardUpdatedHint` | inferred | 70473 |  |
| `Lxe` | `projectJobPromptContext` | inferred | 70528 | v0.8.0 |
| `Ut` | `escapeXmlText` | inferred | 71727 | v0.2.0 |
| `$mt` | `renderJobCompleteReceiptGuidance` | inferred | 71750 | v0.4.0 |
| `_A` | `renderMailboxEventPrompt` | inferred | 71793 | v0.2.0 |
| `Amt` | `renderSkipRewindBlock` | inferred | 71876 | v0.2.0 |
| `Dmt` | `resolvePendingCompactNotice` | inferred | 71890 | v0.5.10 |
| `Mmt` | `renderSmartCompactNoticeBlock` | inferred | 71913 | v0.5.10 |
| `qxe` | `formatElapsedDuration` | inferred | 71922 | v0.3.0 |
| `Bxe` | `computeTimeGapContext` | inferred | 71933 | v0.8.0 |
| `jmt` | `renderTimeGapContextBlock` | inferred | 71942 | v0.3.0 |
| `Fmt` | `renderJobTickBlock` | inferred | 71956 | v0.4.5 |
| `Vxe` | `buildTransientUserBlocks` | inferred | 71970 | v0.2.0 |
| `MRe` | `transcludeBroadcastBoard` | inferred | 82499 | v0.5.2 |
| `X_t` | `renderTranscludedFiles` | inferred | 82507 | v0.5.2 |
| `jRe` | `resolveBoardIncludes` | inferred | 82514 | v0.5.2 |
| `ebt` | `realpathOrSelf` | inferred | 82548 |  |
| `ORe` | `normalizeIncludePathKey` | inferred | 82556 | v0.5.2 |
| `tbt` | `stripBoardIncludeFrontmatter` | inferred | 82561 | v0.5.2 |
| `nbt` | `parseBoardFileContent` | inferred | 82569 | v0.5.2 |
| `rbt` | `stripBoardHtmlComments` | inferred | 82580 | v0.5.2 |
| `ibt` | `collectBoardIncludePaths` | inferred | 82597 | v0.5.2 |
| `obt` | `normalizeBoardIncludeToken` | inferred | 82626 |  |
| `sbt` | `isBoardIncludePathCandidate` | inferred | 82632 | v0.5.2 |
| `abt` | `resolveBoardIncludePath` | inferred | 82636 | v0.5.2 |
| `LRe` | `initBoardTransclusionModule` | inferred | 82639 | v0.5.2 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `cq` | `detectInProcessBreak` | __export | 37028 | v0.5.10 |
| `Za` | `drainRecordPath` | __export | 37040 | v0.2.0 |
| `pf` | `appendDrainRecord` | __export | 37043 | v0.2.0 |
| `ph` | `readDrainRecords` | __export | 37062 |  |
| `kI` | `createEmptyUsageSummary` | inferred | 37068 | v0.8.2 |
| `ode` | `accumulateDrainRecordIntoSummary` | inferred | 37128 | v0.2.0 |
| `ev` | `summarizeDrainRecords` | __export | 37140 |  |
| `sde` | `aggregateSessionDrainSummary` | inferred | 37145 |  |
| `fq` | `readGlobalUsageTotals` | __export | 37167 | v0.4.4 |
| `$et` | `readRecentDrainRecords` | __export | 37184 | v0.2.0 |
| `rde` | `IN_PROCESS_BREAK_HIT_RATIO_FLOOR` | __export | 37201 |  |
| `B$` | `runSkipTool` | inferred | 54982 | v0.2.0 |
| `el` | `initSkipToolModule` | inferred | 55006 | v0.2.0 |
| `hg` | `isAbortLikeError` | __export | 55284 | v0.2.0 |
| `Tg` | `selectInterruptMarkerText` | inferred | 62099 |  |
| `Pg` | `normalizeTurnAbortReason` | inferred | 62103 | v0.8.2 |
| `Uw` | `initInterruptMarkerTextModule` | inferred | 62106 |  |
| `abe` | `computeCodexTurnUsage` | __export | 62220 | v0.5.6 |
| `pxe` | `normalizeInputTokenTotals` | inferred | 70389 | v0.5.6 |
| `PW` | `addToNumericField` | inferred | 70485 |  |
| `Io` | `runTimedDrainPhase` | inferred | 70493 |  |
| `kxe` | `resolveTurnModelWithLayer` | inferred | 70538 | v0.8.1 |
| `xxe` | `resolveTurnEffortWithLayer` | inferred | 70551 | v0.8.1 |
| `Rxe` | `extractServedModelFromUsage` | inferred | 70567 | v0.8.1 |
| `yA` | `isChannelMessageEvent` | inferred | 70572 | v0.8.1 |
| `NW` | `prepareDrainTurnContext` | inferred | 70575 | v0.3.7 |
| `Fxe` | `buildTurnSdkRunConfig` | inferred | 70627 | v0.2.0 |
| `Ixe` | `resolveDrainContextProfileOrRefuse` | inferred | 70643 | v0.7.0 |
| `to` | `isNonNullObject` | inferred | 71661 | v0.2.0 |
| `on` | `readStringProperty` | inferred | 71665 | v0.2.0 |
| `DW` | `extractPayloadMediaRefs` | inferred | 71676 | v0.2.0 |
| `Hmt` | `hasSkipRewindRecordSince` | inferred | 72093 | v0.5.6 |
| `Pxe` | `markTurnSkippedFromSkipRecord` | inferred | 72099 | v0.8.0 |
| `gA` | `clearPendingOutboundAttachments` | inferred | 72102 | v0.2.0 |
| `MW` | `readPendingOutboundAttachments` | inferred | 72105 | v0.2.0 |
| `jW` | `batchDrainItems` | inferred | 72109 | v0.2.0 |
| `Hxe` | `loadDrainItemEventCached` | inferred | 72146 | v0.2.0 |
| `$xe` | `parseEventTimestampMs` | inferred | 72158 | v0.2.0 |
| `Jmt` | `isMergeableDrainBatch` | inferred | 72164 | v0.8.1 |
| `Gmt` | `isMergeableChannelMessageBatch` | inferred | 72168 | v0.2.0 |
| `Wxe` | `hasUniformDrainCoalesceKey` | inferred | 72176 | v0.5.5 |
| `Jxe` | `isWorkerTaskNotifyDelivery` | inferred | 72182 | v0.5.5 |
| `Gxe` | `extractJobCompletePayload` | inferred | 72190 | v0.8.0 |
| `Zxe` | `extractJobCompletionJobId` | inferred | 72196 | v0.8.0 |
| `Cxe` | `classifyDrainBatchClass` | inferred | 72203 |  |
| `Kmt` | `computeDrainCoalesceKey` | inferred | 72211 | v0.2.0 |
| `Ymt` | `resolveEventSourceChannelId` | inferred | 72219 | v0.2.0 |
| `Qmt` | `collectJobCompletionReceipts` | inferred | 72245 | v0.8.1 |
| `eht` | `renderCoalescedDrainPrompt` | inferred | 72273 | v0.8.1 |
| `Yxe` | `createDrainExecutionEventRecorder` | inferred | 72285 | v0.2.0 |
| `aht` | `runHistoryControlCommand` | inferred | 72421 | v0.5.2 |
| `Xxe` | `resolveReplyTargetSessionKeys` | inferred | 72443 | v0.2.0 |
| `Bc` | `emitDrainOutputRecords` | inferred | 72455 | v0.2.0 |
| `uht` | `renderDrainErrorRuntimeHint` | inferred | 72512 | v0.5.6 |
| `TS` | `handleDrainError` | inferred | 72539 | v0.5.0 |
| `lht` | `clearModelOverrideOnRuntimeFlip` | inferred | 72595 | v0.5.6 |
| `cht` | `resolvePendingModelFork` | inferred | 72612 | v0.5.6 |
| `pht` | `renderRuntimeUnavailableGuidance` | inferred | 72660 | v0.5.4 |
| `mht` | `renderRuntimeMismatchGuidance` | inferred | 72668 | v0.8.3 |
| `Dxe` | `runDrainQueryAndCollectOutboundAttachments` | inferred | 72694 | v0.5.0 |
| `Qxe` | `mergeOutboundAttachmentLists` | inferred | 72775 | v0.5.0 |
| `vht` | `runDrainTurnWithResumeFallback` | inferred | 72785 | v0.2.0 |
| `PS` | `initMailboxDrainRunnerModule` | inferred | 72917 | v0.2.0 |
| `Yg` | `runQueueOutboundAttachmentTool` | inferred | 73577 | v0.2.0 |
| `AS` | `initQueueOutboundAttachmentModule` | inferred | 73608 | v0.2.0 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Mf` | `hasParentToolUseId` | inferred | 55021 | v0.5.7 |
| `fg` | `createAbortErrorWithCause` | inferred | 55027 | v0.2.0 |
| `H$` | `extractSdkMessageTextChunks` | inferred | 55032 | v0.3.0 |
| `W$` | `extractStreamTextDeltas` | inferred | 55065 | v0.3.0 |
| `J$` | `extractStreamThinkingText` | inferred | 55093 | v0.3.0 |
| `G$` | `parseToolUseBlockStart` | inferred | 55115 | v0.3.2 |
| `Z$` | `parseInputJsonDelta` | inferred | 55130 | v0.3.2 |
| `K$` | `stringifyToolResultContent` | inferred | 55143 | v0.3.0 |
| `cot` | `selectDominantModelByInputTokens` | inferred | 55154 | v0.5.6 |
| `pg` | `mapClaudeResultToDrainUsage` | inferred | 55179 | v0.3.0 |
| `Y$` | `resolveClaudeCostBaseline` | inferred | 55202 | v0.8.4 |
| `X$` | `buildClaudeCostBaseline` | inferred | 55211 | v0.8.4 |
| `Zge` | `findDeadAllowedToolEntries` | __export | 55261 | v0.5.10 |
| `Kge` | `splitDisallowedToolsForClaude` | __export | 55266 | v0.5.10 |
| `ww` | `isAgentSdkTurnInterruptedError` | __export | 55276 |  |
| `Sw` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 55280 |  |
| `vw` | `normalizeOptionalEnvString` | inferred | 55297 | v0.8.0 |
| `Xge` | `probeClaudeAvailability` | __export | 55306 | v0.5.3 |
| `_V` | `isClaudeAvailable` | __export | 55336 |  |
| `kw` | `claudeUnavailableReason` | __export | 55340 | v0.5.3 |
| `hot` | `primeClaudeAvailability` | __export | 55343 |  |
| `got` | `__resetClaudeProbeCacheForTest` | __export | 55347 |  |
| `yot` | `__setClaudeVerifierForTest` | __export | 55351 |  |
| `Qge` | `verifyClaudeCodeRuntimeAvailable` | __export | 55355 | v0.5.0 |
| `bV` | `eventToMessageGenerator` | __export | 55474 | v0.2.0 |
| `eC` | `stringToMessageGenerator` | __export | 55502 | v0.2.0 |
| `hV` | `parsePositiveMsEnv` | __export | 55512 | v0.5.8 |
| `kot` | `disableSystemPromptSnapshot` | inferred | 55518 | v0.8.1 |
| `Lf` | `createAgentSdkAdapter` | __export | 55529 | v0.5.10 |
| `Cr` | `AgentSdkPromptNotAcceptedAbortError` | __export | 55834 |  |
| `Ur` | `AgentSdkTurnInterruptedError` | __export | 55834 |  |
| `mg` | `CLAUDE_CORE_TOOLS` | __export | 55834 |  |
| `ko` | `initAgentSdkAdapterModule` | inferred | 55834 | v0.5.10 |
| `rct` | `buildClaudeSettingsEnvOverrides` | inferred | 65615 | v0.7.0 |
| `yve` | `materializeClaudeSettingsFile` | inferred | 65668 | v0.7.0 |
| `sS` | `computeContextProfileSignature` | inferred | 65679 | v0.7.0 |
| `aS` | `initMaterializedClaudeSettingsModule` | inferred | 65691 | v0.7.0 |
| `wve` | `mergeClaudeToolLists` | inferred | 65723 |  |
| `Z6` | `applyJobSdkConfigOverride` | inferred | 65853 | v0.6.2 |
| `GSe` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 69142 | v0.5.1 |
| `ZH` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 69211 |  |
| `np` | `resolveContextCapToken` | inferred | 69897 | v0.7.0 |
| `aA` | `describeContextProfileSource` | inferred | 69907 | v0.7.0 |
| `uA` | `extractProfiledEndpointFields` | inferred | 69921 | v0.7.0 |
| `lA` | `listSortedAliasKeys` | inferred | 69952 | v0.7.0 |
| `Yke` | `buildProfiledExternalRequirement` | inferred | 69961 | v0.7.0 |
| `wW` | `classifyModelContextRequirement` | inferred | 69991 | v0.7.0 |
| `Wg` | `selectProfileIssuesForModel` | inferred | 70017 | v0.7.0 |
| `Jg` | `resolveClaudeContextRequirement` | inferred | 70133 | v0.7.0 |
| `IS` | `isClaudeRuntimeOrDefault` | inferred | 70227 |  |
| `fA` | `prepareClaudeContextProfile` | inferred | 70230 | v0.7.0 |
| `Sxe` | `resolveAdditionalDirClaudeMdAutoload` | inferred | 70522 | v0.5.2 |
| `by` | `createAladuoMcpServer` | inferred | 80220 | v0.2.0 |
| `JRe` | `initAbortableAsyncQueueModule` | inferred | 83053 | v0.3.0 |
| `KRe` | `createClaudeStreamingSessionFactory` | inferred | 83211 | v0.8.0 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `E6` | `buildCodexDirectOnlyToolConfig` | inferred | 62143 |  |
| `Jf` | `isCodexAvailable` | __export | 62149 |  |
| `xut` | `codexUnavailableReason` | __export | 62153 | v0.2.0 |
| `Eut` | `primeCodexAvailability` | __export | 62156 | v0.5.0 |
| `Rut` | `__setCodexAvailabilityForTests` | __export | 62161 |  |
| `$g` | `resolveCodexSandbox` | __export | 62165 | v0.4.4 |
| `Ac` | `checkCodexAvailability` | __export | 62169 | v0.4.4 |
| `P6` | `ensureAgentsMdSymlink` | __export | 62206 | v0.4.4 |
| `sbe` | `codexNotificationFilterDecision` | __export | 62216 | v0.5.4 |
| `lbe` | `buildBaseInstructions` | __export | 62248 | v0.4.4 |
| `cbe` | `buildDeveloperInstructions` | __export | 62266 | v0.4.4 |
| `R6` | `buildCodexTurnInput` | __export | 62280 | v0.7.0 |
| `Bw` | `createCodexAppServerAdapter` | __export | 62293 | v0.4.4 |
| `Tut` | `resolveCodexSandboxForPermissionMode` | inferred | 62755 | v0.4.4 |
| `qw` | `isCodexPlainObject` | inferred | 62768 | v0.5.0 |
| `dbe` | `isImageGenerationItemType` | inferred | 62772 | v0.5.0 |
| `fbe` | `hasImageGenerationRecord` | __export | 62779 | v0.5.7 |
| `pbe` | `extractCodexGeneratedImageAttachment` | __export | 62795 | v0.5.0 |
| `mbe` | `capitalizeFirstChar` | inferred | 62823 | v0.6.0 |
| `hbe` | `warnUnmappedCodexItemOnce` | inferred | 62846 | v0.6.0 |
| `gbe` | `mapItemStartedToExecEvent` | __export | 62854 | v0.4.4 |
| `ybe` | `mapItemCompletedToExecEvent` | __export | 62965 | v0.4.4 |
| `VC` | `ALADUO_TOOL_NAMESPACE` | __export | 63038 |  |
| `Gf` | `initCodexAppServerModule` | inferred | 63038 | v0.5.3 |
| `Qpt` | `generatePartitionCodexAgents` | __export | 69536 | v0.5.3 |
| `Vke` | `parseAgentMarkdown` | __export | 69610 | v0.5.3 |
| `Hke` | `renderAgentToml` | __export | 69625 | v0.5.3 |
| `cmt` | `generateAllPartitionCodexAgents` | inferred | 69844 | v0.5.3 |
| `vy` | `buildCodexStringInputSchema` | inferred | 80347 | v0.4.4 |
| `pN` | `buildCodexDynamicTools` | inferred | 80367 | v0.4.4 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `_I` | `containsWhitespaceChar` | inferred | 36824 |  |
| `bI` | `isProviderQualifiedModelId` | inferred | 36828 | v0.8.0 |
| `gV` | `PARTITION_CORE_TOOLS` | __export | 55834 |  |
| `jw` | `parseScheduleDurationMs` | inferred | 61308 | v0.6.1 |
| `_6` | `assertScheduleDurationRepresentable` | inferred | 61319 | v0.6.1 |
| `FC` | `isOneShotJobSchedule` | inferred | 61323 | v0.4.5 |
| `J_e` | `validateJobScheduleExpression` | inferred | 61327 | v0.6.1 |
| `Lw` | `parseJobRearmTime` | inferred | 61344 | v0.5.6 |
| `G_e` | `isJobScheduleDue` | inferred | 61356 | v0.5.6 |
| `Cc` | `buildJobSessionKey` | inferred | 61533 | v0.2.0 |
| `tbe` | `parseJobFileFrontmatter` | inferred | 61555 | v0.2.0 |
| `gut` | `renderJobFileMarkdown` | inferred | 61576 | v0.2.0 |
| `ol` | `initJobManagerModule` | inferred | 61640 | v0.2.0 |
| `Wf` | `redactJobModelProfileTokens` | inferred | 62079 |  |
| `JC` | `renderManageJobToolDescription` | inferred | 64051 |  |
| `GC` | `renderJobSessionToolDescription` | inferred | 64058 |  |
| `ilt` | `renderJobPromptModeDescription` | inferred | 64069 | v0.8.0 |
| `olt` | `renderJobExtraToolsDescription` | inferred | 64076 | v0.8.0 |
| `Cbe` | `buildJobPromptModeExtraToolsSchema` | inferred | 64080 | v0.8.0 |
| `llt` | `listSelectableJobRuntimes` | inferred | 64087 | v0.5.4 |
| `Abe` | `buildJobRuntimeSchemaField` | inferred | 64096 | v0.5.4 |
| `ZC` | `buildManageJobInputSchema` | inferred | 64104 |  |
| `KC` | `buildJobSessionInputSchema` | inferred | 64113 |  |
| `Ag` | `runManageJobTool` | inferred | 64121 | v0.2.0 |
| `Gw` | `initManageJobToolModule` | inferred | 64260 | v0.8.0 |
| `Gbe` | `classifyConsumerStaleness` | inferred | 64743 | v0.8.2 |
| `U6` | `resolveNotifyUnconsumedHours` | inferred | 64756 | v0.8.2 |
| `q6` | `initNotifyConsumerStalenessModule` | inferred | 64762 | v0.8.2 |
| `Ng` | `evaluateNotifyConsumerRefusal` | inferred | 64770 | v0.8.2 |
| `$lt` | `listSessionsWithRecentConsumer` | inferred | 64793 | v0.8.2 |
| `rO` | `renderNotifyRefusalMessage` | inferred | 64819 | v0.8.2 |
| `Mg` | `runRemindDuoduoTool` | inferred | 64973 | v0.8.2 |
| `nS` | `initRemindDuoduoToolModule` | inferred | 65006 | v0.8.2 |
| `fO` | `normalizeNotifyChannelTarget` | inferred | 65019 | v0.8.0 |
| `dve` | `isJobSessionKeyKind` | inferred | 65213 | v0.2.0 |
| `hO` | `renderNotifyToolDescription` | inferred | 65247 | v0.2.0 |
| `gO` | `buildNotifyInputSchema` | inferred | 65266 | v0.2.0 |
| `fve` | `isOrphanJobSessionKey` | inferred | 65292 | v0.6.2 |
| `Jlt` | `computeBoundedEditDistance` | inferred | 65329 | v0.5.0 |
| `Glt` | `matchNearMissSessionKey` | inferred | 65348 | v0.5.0 |
| `sve` | `groupNotifyTargetCandidates` | inferred | 65390 | v0.5.0 |
| `ave` | `renderNotifyTargetCandidateLines` | inferred | 65408 | v0.5.0 |
| `Klt` | `resolveJobOwnerNotifyTarget` | inferred | 65428 | v0.2.0 |
| `Ylt` | `resolveNotifyTargetSessionKey` | inferred | 65437 | v0.2.0 |
| `uve` | `renderNotifyDeliveryReport` | inferred | 65470 | v0.2.0 |
| `Lg` | `runNotifyTool` | inferred | 65484 | v0.2.0 |
| `oS` | `initNotifyToolModule` | inferred | 65586 | v0.2.0 |
| `hS` | `loadSubconsciousPartitions` | inferred | 66462 | v0.2.0 |
| `Wct` | `parsePartitionDefinition` | inferred | 66486 | v0.2.0 |
| `Fg` | `readPlaylistRound` | inferred | 66527 | v0.2.0 |
| `Jct` | `parsePlaylistCurrentRound` | inferred | 66545 | v0.2.0 |
| `IO` | `markPlaylistItemExecuted` | inferred | 66564 | v0.2.0 |
| `Rwe` | `rebuildPlaylistRound` | inferred | 66582 | v0.2.0 |
| `Iwe` | `readPartitionInboxEntries` | inferred | 66626 | v0.2.0 |
| `TO` | `initSubconsciousPlaylistModule` | inferred | 66669 | v0.2.0 |
| `Pwe` | `resolvePartitionStatePath` | inferred | 66689 | v0.3.1 |
| `Xf` | `readPartitionRunState` | inferred | 66692 | v0.3.1 |
| `gH` | `writePartitionRunState` | inferred | 66715 |  |
| `yH` | `isPartitionBackedOff` | inferred | 66719 | v0.3.1 |
| `_H` | `computePartitionBackoffUntil` | inferred | 66723 | v0.3.1 |
| `PO` | `initPartitionRunStateModule` | inferred | 66735 | v0.3.1 |
| `FSe` | `resolveCadenceIntervalMs` | __export | 68843 | v0.8.0 |
| `Bpt` | `computeLegacyJobSessionKey` | inferred | 69335 | v0.8.0 |
| `Vpt` | `rewriteSessionKeyInStateAndMeta` | inferred | 69356 | v0.8.0 |
| `Dke` | `migrateLegacyJobSessionKeys` | inferred | 69390 | v0.8.0 |
| `Fke` | `retireListedPartitions` | inferred | 69442 | v0.8.0 |
| `Zpt` | `retirePartitionOnce` | inferred | 69455 | v0.8.0 |
| `zke` | `initPartitionRetirementModule` | inferred | 69507 | v0.8.0 |
| `uRe` | `isAutoArchivedJobSchedule` | inferred | 80537 | v0.4.0 |
| `lk` | `classifyJobScheduleType` | inferred | 80541 |  |
| `tIe` | `normalizePartitionOutputText` | inferred | 86048 | v0.2.0 |
| `wbt` | `stringifyPartitionToolInput` | inferred | 86053 | v0.2.0 |
| `kbt` | `detectEmptyRequiredPartitionOutput` | inferred | 86063 | v0.2.0 |
| `xbt` | `appendPartitionToolEvent` | inferred | 86066 | v0.2.0 |
| `Ebt` | `hashActivityFingerprint` | inferred | 86105 | v0.2.0 |
| `Rbt` | `readLatestExternalEventId` | inferred | 86108 | v0.5.3 |
| `CN` | `readNewestMtimeRecursive` | inferred | 86127 | v0.5.3 |
| `Ibt` | `renderPartitionRuntimeContext` | inferred | 86153 | v0.2.0 |
| `Tbt` | `renderPartitionInboxSection` | inferred | 86160 | v0.5.3 |
| `rIe` | `initMetaSessionModule` | inferred | 86721 | v0.8.0 |
| `Cbt` | `runCadenceTick` | __export | 86816 | v0.2.0 |
| `PG` | `scanAndSpawnDueJobs` | __export | 86847 | v0.2.0 |
| `Obt` | `fireDueWakeRecords` | inferred | 86938 | v0.8.2 |
| `Nbt` | `createJobScheduler` | __export | 87008 | v0.2.0 |
| `cIe` | `initJobSchedulerModule` | inferred | 87064 | v0.2.0 |
| `Dbt` | `isJobOrMetaOutboxRecord` | inferred | 87075 | v0.2.0 |
| `Mbt` | `createOutboxDeliveryManager` | __export | 87079 | v0.2.0 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `mS` | `partitionInboxDir` | __export | 66447 |  |
| `Mc` | `partitionInboxDirFromVar` | __export | 66451 | v0.5.3 |
| `Ni` | `resolveMemoryDirs` | inferred | 66751 | v0.5.5 |
| `OO` | `bytesToKibCeil` | inferred | 66761 | v0.5.5 |
| `Qf` | `scanWikiLinkOccurrences` | inferred | 66765 | v0.5.5 |
| `ep` | `resolveMemoryLinkTargets` | inferred | 66790 | v0.5.5 |
| `Ar` | `compareStringsAscending` | inferred | 66796 |  |
| `$we` | `countDatedStampLines` | inferred | 66800 |  |
| `AO` | `countNewlineChars` | inferred | 66807 |  |
| `Jo` | `splitLinesDropTrailingEmpty` | inferred | 66814 | v0.5.5 |
| `Ro` | `recordUnreadableMemoryPath` | inferred | 66829 | v0.7.1 |
| `Tn` | `readMemoryFileSyncOrNull` | inferred | 66841 |  |
| `jc` | `isMemoryPathFile` | inferred | 66849 | v0.5.5 |
| `Ug` | `isMemoryPathDirectory` | inferred | 66857 | v0.5.5 |
| `ou` | `listMarkdownSlugsSync` | inferred | 66865 | v0.5.5 |
| `NO` | `measureUtf8ByteLength` | inferred | 66877 | v0.5.5 |
| `Nwe` | `normalizeSignalKindVersion` | inferred | 66885 | v0.5.6 |
| `Go` | `initMemorySignalKindsModule` | inferred | 66889 | v0.5.6 |
| `edt` | `parseEffectivenessTrajectory` | inferred | 66908 | v0.5.5 |
| `tdt` | `parseEffectivenessCounts` | inferred | 66918 | v0.5.5 |
| `ndt` | `parseUpdaterGuidanceVerdict` | inferred | 66937 | v0.5.5 |
| `rdt` | `classifyTopicNodeFormat` | inferred | 66957 | v0.5.5 |
| `idt` | `classifyTopicNodeType` | inferred | 66965 | v0.5.5 |
| `Dwe` | `rankEffectivenessTrajectory` | inferred | 66976 | v0.5.5 |
| `odt` | `compareBoardLintTargets` | inferred | 66989 | v0.5.5 |
| `Mwe` | `collectBoardLintReport` | inferred | 67040 | v0.5.5 |
| `cdt` | `buildBoardLintTarget` | inferred | 67073 | v0.5.5 |
| `ddt` | `runBoardLint` | inferred | 67104 | v0.5.5 |
| `jwe` | `initBoardLintModule` | inferred | 67126 | v0.5.5 |
| `kH` | `isSafeMemorySlug` | inferred | 67134 | v0.5.5 |
| `Lc` | `createMemorySlugReader` | inferred | 67138 | v0.5.5 |
| `Fc` | `walkReachableMemory` | inferred | 67153 | v0.5.5 |
| `mdt` | `renderEntityConvergeSignalBody` | inferred | 67196 | v0.5.5 |
| `Uwe` | `runEntityLint` | inferred | 67204 | v0.5.5 |
| `qwe` | `initEntityLintModule` | inferred | 67244 | v0.5.5 |
| `gdt` | `isAllowedNodeSection` | inferred | 67254 | v0.5.5 |
| `_dt` | `renderNodeConvergeSignalBody` | inferred | 67269 | v0.5.5 |
| `Bwe` | `runNodeLint` | inferred | 67281 | v0.5.5 |
| `DO` | `buildNodeSignalKey` | inferred | 67330 |  |
| `Vwe` | `initNodeLintModule` | inferred | 67340 |  |
| `bS` | `initGapSpanModule` | inferred | 67476 | v0.8.4 |
| `vS` | `readPartitionContract` | inferred | 67484 | v0.5.6 |
| `FO` | `getCachedPartitionContract` | inferred | 67575 | v0.5.6 |
| `zO` | `postMemorySignalsToInboxes` | inferred | 67581 | v0.5.6 |
| `UO` | `enforceContractGate` | inferred | 67634 | v0.5.6 |
| `Xwe` | `reconcileMemorySignalInboxes` | inferred | 67665 | v0.7.1 |
| `Qwe` | `hasAnyMemorySignalConsumer` | inferred | 67708 | v0.5.6 |
| `eSe` | `isOrphanWarningDeliverable` | inferred | 67717 |  |
| `OH` | `initMemorySignalDeliveryModule` | inferred | 67720 |  |
| `VO` | `recordUnreadableUnlessMissing` | inferred | 67742 |  |
| `Mdt` | `listMemoryFragmentDates` | inferred | 67767 | v0.8.0 |
| `zdt` | `readOrSeedGapHandedDays` | inferred | 67824 | v0.8.0 |
| `nSe` | `appendGapHandedSpan` | inferred | 67866 | v0.8.0 |
| `rSe` | `readGapLintDayEvents` | inferred | 67874 | v0.8.0 |
| `oSe` | `mergeContiguousHourRanges` | inferred | 67915 | v0.5.8 |
| `qdt` | `renderScanGapSignalBody` | inferred | 67934 | v0.5.8 |
| `Bdt` | `buildScanGapSignal` | inferred | 67940 | v0.8.0 |
| `BO` | `buildGapReadFaultResult` | inferred | 67949 | v0.8.0 |
| `Vdt` | `runGapLint` | inferred | 67967 | v0.8.0 |
| `cSe` | `deliverScanGapSignal` | inferred | 68003 | v0.8.0 |
| `dSe` | `initGapLintModule` | inferred | 68047 | v0.8.0 |
| `NH` | `readMemoryMaxLinesLimit` | inferred | 68111 |  |
| `hSe` | `runBroadcastBudgetLint` | inferred | 68121 | v0.8.0 |
| `DH` | `initBroadcastBudgetLintModule` | inferred | 68160 | v0.5.3 |
| `oft` | `listEventPartitionDates` | inferred | 68173 | v0.8.0 |
| `aft` | `scanActivationWindowTouches` | inferred | 68200 | v0.8.0 |
| `uft` | `renderActivationReportHeader` | inferred | 68277 | v0.8.0 |
| `lft` | `renderBoardTemperatureSection` | inferred | 68282 | v0.8.0 |
| `cft` | `renderHotOrphansSection` | inferred | 68292 | v0.8.0 |
| `dft` | `renderActivationReportBody` | inferred | 68299 |  |
| `bSe` | `runActivationLint` | inferred | 68305 | v0.8.0 |
| `UH` | `initActivationLintModule` | inferred | 68404 | v0.8.0 |
| `kSe` | `readIntuitionWeaverLastFinishedMs` | inferred | 68414 | v0.8.0 |
| `fft` | `findNewestFragmentMtimeMs` | inferred | 68420 | v0.8.0 |
| `pft` | `renderFoldGapBody` | inferred | 68450 | v0.8.0 |
| `xSe` | `runFoldGapLint` | inferred | 68456 | v0.8.0 |
| `ESe` | `initFoldGapLintModule` | inferred | 68473 |  |
| `yft` | `extractBoardSlugLinks` | inferred | 68482 | v0.5.3 |
| `vft` | `formatSlugLinkLocations` | inferred | 68505 | v0.5.3 |
| `RSe` | `runBroadcastLinkLint` | inferred | 68519 | v0.8.0 |
| `ISe` | `initBroadcastLinkLintModule` | inferred | 68540 |  |
| `Ift` | `findBoardHeadingLines` | inferred | 68547 | v0.8.0 |
| `TSe` | `runBroadcastFlattenLint` | inferred | 68572 | v0.8.0 |
| `PSe` | `initBroadcastFlattenLintModule` | inferred | 68593 |  |
| `$ft` | `computeOrphanTopicNodes` | inferred | 68611 | v0.5.5 |
| `OSe` | `detectOrphanMemory` | inferred | 68660 | v0.5.5 |
| `ASe` | `buildOrphanNewbornSignals` | inferred | 68683 | v0.5.5 |
| `NSe` | `forgetMemoryEntry` | inferred | 68692 | v0.5.5 |
| `Cft` | `resolveGitToplevelSync` | inferred | 68728 | v0.5.5 |
| `Oft` | `renderOrphanIslandsBody` | inferred | 68742 | v0.5.5 |
| `DSe` | `filterOrphanIslands` | inferred | 68756 | v0.5.5 |
| `MSe` | `buildOrphanIslandsSignal` | inferred | 68760 | v0.5.5 |
| `Aft` | `computeMemoryLinkIndegree` | inferred | 68769 | v0.5.5 |
| `Nft` | `listMemorySlugReferrers` | inferred | 68780 | v0.5.5 |
| `qH` | `routeContractDecision` | inferred | 68797 | v0.5.5 |
| `Mft` | `formatForgetCommitMessage` | inferred | 68809 | v0.5.5 |
| `jSe` | `initOrphanMemoryModule` | inferred | 68812 | v0.5.5 |
| `VH` | `isTruthyEnvFlag` | inferred | 68829 | v0.5.5 |
| `WH` | `resolveMemoryCheckFlags` | __export | 68834 | v0.5.5 |
| `JH` | `buildMemoryCheckStatus` | __export | 68850 | v0.5.6 |
| `jft` | `runMemoryCheckTick` | __export | 68864 | v0.5.5 |
| `HH` | `runMemoryCheckSubStep` | inferred | 68980 | v0.7.1 |
| `fa` | `runReadAuditedMemoryCheckStep` | inferred | 68988 | v0.7.1 |
| `Lft` | `evaluatePredicateOrFalse` | inferred | 68995 |  |
| `GH` | `initMemoryCheckTickModule` | inferred | 69002 |  |
| `pW` | `runKernelGitCommand` | inferred | 69240 | v0.2.0 |
| `Pke` | `buildKernelGitEnv` | inferred | 69258 | v0.2.0 |
| `$ke` | `buildSafeDirectoryGitArgs` | inferred | 69270 |  |
| `Upt` | `isKernelGitToplevel` | inferred | 69273 | v0.2.0 |
| `Cke` | `ensureKernelGitRepo` | inferred | 69286 | v0.2.0 |
| `qpt` | `mergeKernelGitignoreEntries` | inferred | 69295 | v0.2.0 |
| `Oke` | `initKernelGitModule` | inferred | 69314 | v0.2.0 |
| `wG` | `computeBoardLayerHash` | __export | 82655 | v0.5.10 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Ii` | `isEffortLevel` | inferred | 31533 |  |
| `gR` | `isAgentRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31669 |  |
| `NR` | `isKnownRuntimeValue` | inferred | 31793 |  |
| `Eb` | `isSupportedRuntime` | inferred | 31797 |  |
| `uU` | `validateKnownRuntimeValue` | inferred | 31801 | v0.8.4 |
| `Wd` | `validateRunnableRuntimeValue` | inferred | 31814 | v0.8.4 |
| `ho` | `resolveDefaultRuntime` | inferred | 31828 | v0.7.1 |
| `Fu` | `initRuntimeValidationModule` | inferred | 31837 | v0.8.4 |
| `Xl` | `attachStreamLineReader` | inferred | 31880 | v0.8.0 |
| `Fm` | `parseEnvBooleanFlag` | inferred | 32012 | v0.2.0 |
| `Ue` | `logErrorMessage` | inferred | 32041 | v0.2.0 |
| `Z` | `logWarnMessage` | inferred | 32045 | v0.2.0 |
| `ee` | `logInfoMessage` | inferred | 32049 | v0.2.0 |
| `ke` | `logDebugMessage` | inferred | 32053 | v0.2.0 |
| `vt` | `logAlwaysAtLevel` | inferred | 32069 | v0.2.0 |
| `yYe` | `appendTelemetryRecord` | inferred | 32914 | v0.3.0 |
| `_Ye` | `isTelemetryEnabled` | inferred | 32919 | v0.4.5 |
| `go` | `logLatencyStageTelemetry` | inferred | 32927 | v0.2.0 |
| `_s` | `recordTelemetryMetric` | inferred | 32935 | v0.3.0 |
| `Wi` | `formatYamlErrorMessage` | inferred | 35089 | v0.7.0 |
| `Wb` | `normalizePromptMode` | inferred | 35135 | v0.2.0 |
| `Jb` | `parseClaudeFrontmatterBlock` | inferred | 35336 | v0.5.10 |
| `eh` | `listFrontmatterKeyAliases` | inferred | 35450 |  |
| `HU` | `parseSdkConfigFrontmatter` | inferred | 35454 | v0.2.0 |
| `WQe` | `parseChannelRuntimeField` | inferred | 35468 | v0.8.4 |
| `Ua` | `resolveLayeredChannelRuntime` | inferred | 35477 | v0.8.4 |
| `cI` | `parseChannelConfigFields` | inferred | 35514 | v0.2.0 |
| `li` | `loadGlobalRuntimeConfig` | inferred | 36772 | v0.7.0 |
| `Wa` | `loadChannelKindConfig` | inferred | 36800 | v0.7.0 |
| `Ja` | `initChannelConfigLoaderModule` | inferred | 36816 |  |
| `fct` | `buildEffectiveRuntimeFields` | inferred | 65708 | v0.8.4 |
| `SO` | `foldConfigLayersByKey` | inferred | 65727 | v0.7.0 |
| `xve` | `mergeRuntimeModelLayers` | inferred | 65756 | v0.8.1 |
| `Eve` | `mergeRuntimeEffortLayers` | inferred | 65766 | v0.8.1 |
| `uS` | `readRuntimeModelSetting` | inferred | 65776 |  |
| `lS` | `readRuntimeEffortSetting` | inferred | 65780 |  |
| `nu` | `mergeGlobalModelConfigLayers` | inferred | 65794 | v0.7.0 |
| `G6` | `overlayConfigEntriesByKey` | inferred | 65830 |  |
| `Ive` | `appendPiConfigIssues` | inferred | 65874 |  |
| `Tve` | `buildEffectiveChannelConfig` | inferred | 65878 | v0.2.0 |
| `ru` | `resolveEffectiveChannelConfig` | inferred | 65973 | v0.2.0 |
| `cS` | `isBusinessSourceKind` | inferred | 65988 |  |
| `K6` | `resolveEffectiveChannelConfigForEvent` | inferred | 66001 | v0.2.0 |
| `iu` | `resolveChannelConfigBySession` | inferred | 66018 | v0.5.10 |
| `kwe` | `resolveRuntimePaths` | __export | 66362 | v0.4.3 |
| `GO` | `parseDotEnv` | __export | 69045 | v0.3.3 |
| `ll` | `hostDotEnvPath` | __export | 69060 | v0.4.3 |
| `VSe` | `removeHostModelEnvLines` | inferred | 69080 |  |
| `HSe` | `removeDotEnvKeyLines` | inferred | 69087 | v0.5.1 |
| `ZO` | `writeHostDotEnvLines` | inferred | 69099 | v0.4.3 |
| `YH` | `clearHostModelEnvVars` | __export | 69123 |  |
| `WSe` | `applyHostModelEnvVars` | __export | 69127 | v0.4.3 |
| `JSe` | `writeHostModelEnvConfig` | __export | 69130 | v0.4.3 |
| `ZSe` | `clearHostModelEnvConfig` | __export | 69155 | v0.4.3 |
| `Vft` | `readHostDaemonToken` | __export | 69166 | v0.7.0 |
| `Hft` | `writeHostDaemonToken` | __export | 69178 | v0.7.0 |
| `KSe` | `readHostDotEnvFile` | __export | 69189 | v0.4.3 |
| `Wft` | `loadHostDotEnv` | __export | 69198 | v0.4.3 |
| `KH` | `HOST_MODEL_ENV_KEYS` | __export | 69211 |  |
| `Ds` | `pathExistsAsync` | inferred | 69219 | v0.2.0 |
| `omt` | `isDirEmptyOrMissing` | inferred | 69751 | v0.2.0 |
| `_W` | `copyDirTreeOverwrite` | inferred | 69759 | v0.2.0 |
| `bW` | `copyDirTreeMissingOnly` | inferred | 69770 | v0.2.0 |
| `amt` | `refreshBootstrapDuoduoMdFiles` | inferred | 69781 | v0.2.0 |
| `umt` | `copyBootstrapIntoKernel` | inferred | 69796 | v0.2.0 |
| `lmt` | `initializeRuntime` | __export | 69834 | v0.2.0 |
| `Kke` | `initRuntimeInitializationModule` | inferred | 69867 | v0.2.0 |
| `FW` | `encodePiWorkerFrame` | inferred | 72964 |  |
| `$S` | `resolvePiWorkerCommand` | inferred | 73033 | v0.8.0 |
| `Eht` | `buildPiSystemPromptSpec` | inferred | 73045 | v0.8.0 |
| `vA` | `createPiWorkerAdapter` | inferred | 73070 | v0.8.0 |
| `mEe` | `parsePiToolResultDetails` | inferred | 73651 | v0.8.0 |
| `hEe` | `handlePiToolEndObservation` | inferred | 73657 | v0.8.0 |
| `eH` | `CHANNEL_CONFIG_KEY_TYPES` | inferred | 88302 |  |
| `_ct` | `validateConfigValue` | inferred | 88340 | v0.5.10 |
| `nwe` | `writeInstanceModelAlias` | inferred | 88835 |  |
| `Jft` | `isClaudeAuthSource` | inferred | 89434 | v0.4.3 |
| `QH` | `readClaudeAuthSourceEnv` | inferred | 89438 | v0.4.3 |
| `Hn` | `resolveEnvConfigEntry` | inferred | 90519 | v0.3.3 |
| `Wbt` | `buildSdkConfigReport` | inferred | 90550 | v0.4.3 |
| `Jbt` | `buildSystemConfigReport` | inferred | 90568 | v0.3.3 |
| `bIe` | `formatLayerModelAliases` | inferred | 91604 | v0.7.0 |
| `NG` | `formatModelConfigIssues` | inferred | 91627 | v0.7.0 |
| `ky` | `appendConfigChangedEvent` | inferred | 91842 | v0.5.10 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `N6` | `isGrokAvailable` | __export | 63277 |  |
| `Aut` | `grokUnavailableReason` | __export | 63281 |  |
| `Nut` | `primeGrokAvailability` | __export | 63284 | v0.7.1 |
| `Dut` | `__setGrokAvailabilityForTests` | __export | 63289 |  |
| `Nc` | `checkGrokAvailability` | __export | 63292 | v0.7.1 |
| `Hw` | `grokAcpExtMethod` | __export | 63313 |  |
| `Oi` | `coerceToPlainObject` | inferred | 63322 | v0.7.1 |
| `Ibe` | `collectGrokToolCallNames` | inferred | 63365 | v0.7.1 |
| `Uut` | `isGrokSkipToolCall` | inferred | 63374 |  |
| `qut` | `mapGrokUsageToDrainUsage` | inferred | 63378 | v0.7.1 |
| `Ww` | `createGrokAcpAdapter` | __export | 63437 | v0.7.1 |
| `kbe` | `GROK_ACP_COMPACT` | __export | 63995 |  |
| `wbe` | `GROK_ACP_EXT_PREFIX` | __export | 63995 |  |
| `Sbe` | `GROK_ACP_SDK_CALL` | __export | 63995 |  |
| `vbe` | `GROK_AGENT_PROFILE` | __export | 63995 |  |
| `bbe` | `GROK_DISALLOWED_TOOLS` | __export | 63995 |  |
| `xbe` | `GROK_MCP_SDK_META` | __export | 63995 |  |
| `Ebe` | `GROK_MCP_SERVERS_META` | __export | 63995 |  |
| `Rbe` | `GROK_MCP_SERVER_NAME` | __export | 63995 |  |
| `Og` | `initGrokAcpRuntimeModule` | inferred | 63995 | v0.7.1 |
