# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*；其中标注 *published source* 的名字是上游在同作者的公开源码包里的拼写，由 `maps/published_daemon.json` 记录）。“原行号”指反混淆后的 `daemon.pretty.js`。

共 795 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.4。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `KR` | `resolveRegistryStatusPath` | inferred | 32980 |
| `wU` | `buildInitialRegistryStatus` | inferred | 32984 |
| `SU` | `writeRegistryStatusFile` | inferred | 33011 |
| `Mb` | `readRegistryStatusFile` | inferred | 33014 |
| `Vu` | `updateRegistryStatus` | inferred | 33022 |
| `tde` | `createVoidAwareAttachmentCallbacks` | inferred | 36957 |
| `Ect` | `daemonRestartReasonPath` | inferred | 66052 |
| `iwe` | `claimDaemonRestartReason` | inferred | 66055 |
| `owe` | `setPendingRestartReason` | inferred | 66081 |
| `swe` | `getPendingRestartReason` | inferred | 66085 |
| `lwe` | `renderRestartWakeMessage` | inferred | 66127 |
| `cH` | `resolveRuntimeWriterLockPath` | inferred | 89212 |
| `jct` | `isProcessAliveByPid` | inferred | 89216 |
| `Lct` | `computeHostBootId` | inferred | 89226 |
| `_we` | `getCachedHostBootId` | inferred | 89243 |
| `Fct` | `isRuntimeWriterLockStale` | inferred | 89247 |
| `fH` | `acquireRuntimeWriterLock` | inferred | 89259 |
| `EO` | `releaseRuntimeWriterLock` | inferred | 89312 |
| `wIe` | `readEnvIntegerOrFallback` | inferred | 90501 |
| `avt` | `deliverDaemonRestartWakes` | __export | 91202 |
| `Svt` | `createDaemon` | __export | 92035 |
| `kvt` | `main` | __export | 93073 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `gs` | `iterateStreamLines` | inferred | 31898 |
| `Bi` | `stringifyJsonlRecord` | inferred | 31932 |
| `zu` | `memoizeIndexLoad` | inferred | 31939 |
| `Uu` | `isIndexLoadStillCurrent` | inferred | 31944 |
| `Dt` | `writeFileAtomic` | inferred | 31956 |
| `Bt` | `writeJsonFileAtomic` | inferred | 31972 |
| `Ne` | `ensureDirectoryExists` | inferred | 31985 |
| `B8e` | `enqueuePartitionAppend` | inferred | 32091 |
| `V8e` | `generateSpineEventId` | inferred | 32096 |
| `zm` | `formatEventPartitionName` | inferred | 32100 |
| `en` | `createSpineEvent` | inferred | 32104 |
| `W8e` | `appendEventToPartition` | inferred | 32111 |
| `Rb` | `resolveEventIdIndexPath` | inferred | 32134 |
| `J8e` | `appendEventIdIndexEntry` | inferred | 32137 |
| `tn` | `atomicAppendEvent` | inferred | 32146 |
| `Oo` | `readEventById` | inferred | 32155 |
| `G8e` | `readEventAtIndexedOffset` | inferred | 32163 |
| `Z8e` | `scanPartitionsForEventId` | inferred | 32181 |
| `Ib` | `lookupEventIdIndexEntry` | inferred | 32198 |
| `K8e` | `getOrCreateEventIdIndexCache` | inferred | 32212 |
| `Y8e` | `isUsableEventIndexEntry` | inferred | 32222 |
| `X8e` | `loadEventIdIndex` | inferred | 32225 |
| `wae` | `findEventInPartitionFile` | inferred | 32262 |
| `Sae` | `readSpineIndexRetentionDays` | inferred | 32276 |
| `kae` | `pruneEventIdIndexByRetention` | inferred | 32282 |
| `Ao` | `initSpineEventLogModule` | inferred | 32324 |
| `xYe` | `resolveConsumerOffsetPath` | inferred | 32955 |
| `EYe` | `writeConsumerOffsetFile` | inferred | 32958 |
| `Bu` | `advanceConsumerWatermark` | inferred | 32961 |
| `JR` | `spineEventDedupStore` | inferred | 87200 |
| `GR` | `computeDedupKey` | inferred | 87260 |
| `nv` | `loadRegistryDedupStore` | inferred | 87423 |
| `pH` | `readPartitionByteRange` | inferred | 89326 |
| `qct` | `iteratePartitionLinesBackward` | inferred | 89338 |
| `Bct` | `resolveTailCursorEndOffset` | inferred | 89350 |
| `vwe` | `readPartitionTail` | inferred | 89365 |
| `wwe` | `readSpineTail` | inferred | 89404 |
| `Apt` | `shouldKeepRouteDeliverEvent` | inferred | 90355 |
| `Ske` | `stripSpineEventToEnvelope` | inferred | 90359 |
| `Npt` | `redactSpineEventForExternal` | inferred | 90373 |
| `Dpt` | `checkReservedRecordSource` | inferred | 90418 |
| `Eke` | `recordExternalSpineEvent` | inferred | 90429 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Sb` | `isJsonRpcRequest` | inferred | 31516 |
| `at` | `isRecord` | inferred, published source (@openduo/protocol@0.8.4 rpc.ts) | 31522 |
| `Ri` | `isOptionalString` | inferred, published source (@openduo/protocol@0.8.4 rpc.ts) | 31526 |
| `Qz` | `initProtocolEffortModule` | inferred, published source (@openduo/protocol@0.8.4 effort.ts) | 31536 |
| `nR` | `isSystemRuntimeInfo` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31541 |
| `rR` | `isRuntimeInfoParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31545 |
| `iR` | `isSessionArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31552 |
| `eU` | `isSessionListKind` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31556 |
| `oR` | `isSessionListParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31560 |
| `sR` | `isSessionSetAliasParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31564 |
| `aR` | `isSessionWakeParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31568 |
| `uR` | `isSessionNotifyParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31572 |
| `lR` | `isSessionModelParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31576 |
| `cR` | `isSessionEffortParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31580 |
| `dR` | `isSessionCompactParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31584 |
| `fR` | `isSessionConfigParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31588 |
| `$8e` | `isNonEmptyText` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31600 |
| `tU` | `unknownKeyProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31604 |
| `lae` | `textKeysProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31609 |
| `Dm` | `renderParamsProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31617 |
| `cae` | `describeConversationProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31624 |
| `nU` | `describeMemoryReadProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31628 |
| `rU` | `describeSpineCatProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31632 |
| `iU` | `describeSpineRecordProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31644 |
| `oU` | `initProtocolSystemModule` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31647 |
| `sU` | `isModelRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31673 |
| `yR` | `isChannelIngressParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31677 |
| `_R` | `isChannelFileUploadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31681 |
| `bR` | `isChannelFileDownloadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31685 |
| `Mm` | `isChannelPullParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31689 |
| `vR` | `isChannelCommandParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31693 |
| `wR` | `isChannelAckParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31697 |
| `SR` | `isChannelDescribeParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31701 |
| `kR` | `isChannelSpawnParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31705 |
| `O8e` | `isAttachmentArray` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31709 |
| `A8e` | `isChannelCapabilities` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31713 |
| `N8e` | `isMimePattern` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31720 |
| `dae` | `initChannelProtocolModule` | inferred | 31723 |
| `xR` | `isJobCreateParams` | inferred | 31734 |
| `ER` | `isJobGetParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31738 |
| `RR` | `isJobListParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31742 |
| `IR` | `isJobArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31746 |
| `TR` | `isJobRescheduleParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31750 |
| `PR` | `isJobInterruptParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31754 |
| `pae` | `initProtocolJobModule` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31757 |
| `$R` | `isSystemStatusParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 31766 |
| `CR` | `isSystemConfigParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 31770 |
| `OR` | `isSpineTailParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 31774 |
| `sh` | `isValidChannelId` | inferred | 35805 |
| `ah` | `assertValidChannelId` | inferred | 35809 |
| `vs` | `readChannelDescriptor` | inferred | 35849 |
| `QQe` | `generateOutboxRecordId` | inferred | 36036 |
| `Xb` | `resolveOutboxRecordPath` | inferred | 36040 |
| `Ba` | `createOutboxRecord` | inferred | 36044 |
| `Va` | `persistOutboxRecord` | inferred | 36076 |
| `Ha` | `readOutboxRecord` | inferred | 36090 |
| `Qb` | `listAllOutboxRecords` | inferred | 36115 |
| `lh` | `findOutboxRecordByEventId` | inferred | 36147 |
| `df` | `recordOutboxDeliveryAttempt` | inferred | 36155 |
| `nq` | `resolveOutboxByEventIndexPath` | inferred | 36179 |
| `Cce` | `resolveOutboxSentIdsPath` | inferred | 36183 |
| `ret` | `loadOutboxByEventIndex` | inferred | 36196 |
| `ch` | `recordOutboxSentId` | inferred | 36243 |
| `mI` | `resolveOutboxReplayDir` | inferred | 36249 |
| `ws` | `resolveOutboxReplayFilePath` | inferred | 36257 |
| `rq` | `resolveOutboxByIdIndexPath` | inferred | 36268 |
| `ia` | `lookupOutboxByIdIndexEntry` | inferred | 36320 |
| `det` | `ensureOutboxRecordInReplay` | inferred | 36373 |
| `hI` | `backfillOutboxByIdIndexFromReplay` | inferred | 36545 |
| `ic` | `resolveOutboxPendingQueuePath` | inferred | 36581 |
| `met` | `hasUnqueuedPendingOutboxRecords` | inferred | 36631 |
| `Bce` | `listRetryableOutboxRecords` | inferred | 36700 |
| `jo` | `initOutboxStoreModule` | inferred | 36718 |
| `nde` | `listVoidChannelSessions` | inferred | 36969 |
| `wI` | `writeVoidSessionOutboxRecord` | inferred | 36981 |
| `Dbe` | `updateDeliveryCursorFile` | inferred | 64398 |
| `jbe` | `resolveDeliveryCursorPath` | inferred | 64419 |
| `Lbe` | `readDeliveryCursorFile` | inferred | 64431 |
| `j6` | `advanceOptimisticDeliveryCursor` | inferred | 64474 |
| `Yw` | `readOutboxRecordsPastCursor` | inferred | 64574 |
| `Ube` | `replayOutboxBacklogToSubscriber` | inferred | 64632 |
| `tO` | `readLatestDeliveryCursorUpdate` | inferred | 64718 |
| `Zf` | `hasNonEmptyDisplayName` | inferred | 64850 |
| `Olt` | `filterDeliverableSessions` | inferred | 64885 |
| `As` | `deliverRouteEventToSession` | inferred | 65038 |
| `JO` | `DAEMON_TOKEN_ENV_KEY` | __export | 69211 |
| `Wce` | `lookupInjectionPrompt` | inferred | 87390 |
| `lde` | `readRoutingTarget` | inferred | 87429 |
| `mde` | `canonicalizeGatewayCommand` | inferred | 87442 |
| `xI` | `parseInjectionPromptCommand` | inferred | 87455 |
| `hde` | `expandInjectionPromptCommand` | inferred | 87471 |
| `tv` | `parseGatewayCommandText` | inferred | 87480 |
| `mq` | `classifyGatewayCommandIntent` | inferred | 87496 |
| `Aet` | `resolveRoutingTarget` | inferred | 87509 |
| `gde` | `ingestChannelMessage` | inferred | 87515 |
| `rv` | `ingestChannelCommand` | inferred | 87540 |
| `yde` | `appendBeforeExecuteGateway` | inferred | 87568 |
| `_de` | `probeEventsAppendable` | inferred | 87719 |
| `Net` | `replyToGatewayCommandEvent` | inferred | 87734 |
| `Fet` | `executeGatewayCommand` | inferred | 87857 |
| `zet` | `writeIngressSnapshot` | inferred | 88165 |
| `uH` | `createSessionSubscriptionRegistry` | inferred | 89020 |
| `Uc` | `MemoryReadRpcError` | inferred | 89447 |
| `QSe` | `readMemoryFileForRpc` | inferred | 89453 |
| `tp` | `SpineRpcParamsError` | inferred | 90350 |
| `xke` | `runSpineCatRpc` | inferred | 90393 |
| `Tt` | `JsonRpcInvalidParamsError` | inferred | 90474 |
| `pIe` | `bindSessionSourceChannel` | inferred | 90477 |
| `mIe` | `assertWsChannelIdentityParams` | inferred | 90486 |
| `CG` | `normalizeReturnMask` | inferred | 90618 |
| `Kbt` | `normalizeChannelCapabilityDeclarations` | inferred | 90648 |
| `Ybt` | `recordChannelCapabilityDeclaration` | inferred | 90658 |
| `dp` | `resolveExistingDirRealpath` | inferred | 90693 |
| `SIe` | `ensureAbsoluteWorkspaceDir` | inferred | 90703 |
| `hIe` | `resolveIngressWorkspace` | inferred | 90710 |
| `tvt` | `describeChannelInstance` | inferred | 90778 |
| `nvt` | `archiveSessionIfQuiescent` | inferred | 90842 |
| `kIe` | `refreshSessionIndexEntry` | inferred | 90915 |
| `rvt` | `setSessionAliasAndReindex` | inferred | 90919 |
| `ivt` | `resolveSessionByExactKey` | inferred | 90936 |
| `fp` | `resolveSessionByKeyOrAlias` | inferred | 90948 |
| `ovt` | `scheduleSessionWakeRecord` | inferred | 90977 |
| `EIe` | `deliverExternalSessionNotify` | inferred | 91037 |
| `svt` | `replayIdempotentSessionNotify` | inferred | 91177 |
| `uvt` | `readOrSetSessionModel` | inferred | 91227 |
| `lvt` | `readOrSetSessionEffort` | inferred | 91257 |
| `cvt` | `enqueueSessionCompactCommand` | inferred | 91287 |
| `RIe` | `checkChannelRuntimeRebindConflict` | inferred | 91398 |
| `fvt` | `applySessionConfigVerb` | inferred | 91407 |
| `yvt` | `upsertChannelSpawnDescriptor` | inferred | 91873 |
| `vvt` | `isLoopbackBindHost` | __export | 92002 |
| `wvt` | `resolveRemoteListenerConfig` | __export | 92009 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Gd` | `moveFileIntoDirectory` | inferred | 32340 |
| `Do` | `hashSessionKey` | inferred | 32360 |
| `Yn` | `resolveSessionDir` | inferred | 32364 |
| `nYe` | `resolveSessionsArchiveRoot` | inferred | 32368 |
| `Um` | `resolveArchivedSessionDir` | inferred | 32372 |
| `Qs` | `isSessionArchived` | inferred | 32376 |
| `Tb` | `resolveSessionInboxDir` | inferred | 32380 |
| `zR` | `resolveSessionMailboxMarkdownPath` | inferred | 32384 |
| `Iae` | `resolveSessionMailboxDir` | inferred | 32388 |
| `Zd` | `resolveSessionMailboxPendingDir` | inferred | 32392 |
| `Pb` | `resolveSessionMailboxNotesPath` | inferred | 32396 |
| `La` | `resolveSessionMetaPath` | inferred | 32400 |
| `ys` | `resolveSessionStatePath` | inferred | 32404 |
| `$b` | `listPendingInboxFiles` | inferred | 32414 |
| `Cb` | `probeSessionPendingWork` | inferred | 32429 |
| `Tae` | `rehydrateSessionState` | inferred | 32443 |
| `Ob` | `moveSessionDirToArchive` | inferred | 32483 |
| `Vi` | `runWithSessionMutex` | inferred | 32513 |
| `qR` | `tryMarkSessionArchiving` | inferred | 32526 |
| `BR` | `clearSessionArchiving` | inferred | 32530 |
| `dr` | `isSessionArchiving` | inferred | 32534 |
| `ec` | `assertSessionNotArchiving` | inferred | 32538 |
| `Fa` | `initSessionLockAndArchivingModule` | inferred | 32541 |
| `bU` | `ensureSessionMailboxPendingDir` | inferred | 32647 |
| `ta` | `enqueueSessionInboxLine` | inferred | 32650 |
| `HR` | `mergeInboxIntoMailbox` | inferred | 32661 |
| `Nb` | `listMailboxPendingItems` | inferred | 32720 |
| `Mo` | `deleteMailboxPendingItemsByEventIds` | inferred | 32742 |
| `Db` | `appendSessionMailboxNote` | inferred | 32798 |
| `WR` | `renderSessionMailboxFile` | inferred | 32808 |
| `th` | `notifySessionFileChanged` | inferred | 35572 |
| `af` | `stripUndefinedFieldsDeep` | inferred | 35592 |
| `nh` | `ensureSessionDescriptorAndStateFiles` | inferred | 35600 |
| `na` | `readSessionMetaFile` | inferred | 35631 |
| `wce` | `updateSessionDisplayName` | inferred | 35640 |
| `rt` | `readSessionRuntimeState` | inferred | 35664 |
| `rh` | `readAllSessionStateFiles` | inferred | 35672 |
| `et` | `patchSessionRuntimeState` | inferred | 35690 |
| `uf` | `mutateSessionRuntimeState` | inferred | 35727 |
| `ra` | `clearSessionRuntimeStateField` | inferred | 35763 |
| `_n` | `classifySessionKeyKind` | inferred | 36840 |
| `uq` | `isUserVisibleSessionKey` | inferred | 36844 |
| `dh` | `buildSessionIndexFromDisk` | inferred | 36847 |
| `Xce` | `createEmptySessionIndex` | inferred | 36857 |
| `Qce` | `buildSessionIndexEntry` | inferred | 36861 |
| `ede` | `createMapBackedSessionIndex` | inferred | 36885 |
| `fh` | `resolveSessionChannelRuntime` | inferred | 36944 |
| `Gu` | `isVoidRuntimeSession` | inferred | 36952 |
| `ff` | `initVoidRuntimeModule` | inferred | 36998 |
| `dq` | `readAllSessionSummaries` | __export | 37150 |
| `V$` | `initCallerSessionEnvModule` | inferred | 55016 |
| `oC` | `issueWorkerToolContextToken` | inferred | 55858 |
| `oO` | `listSessionIndexSummaries` | inferred | 64866 |
| `Kbe` | `formatViewSessionsListLine` | inferred | 64904 |
| `Dg` | `runViewSessionsTool` | inferred | 64941 |
| `eS` | `initViewSessionsToolModule` | inferred | 64953 |
| `mwe` | `archiveSessionDirUnlessAlreadyArchiving` | inferred | 66138 |
| `hwe` | `archiveSessionAndArtifacts` | inferred | 66154 |
| `dwe` | `readStateSourceChannelId` | inferred | 66295 |
| `pwe` | `listArchivedCopiesNewestFirst` | inferred | 66316 |
| `Gke` | `archiveLegacyRegistrySessionsDir` | __export | 69662 |
| `sxe` | `acquireSessionDrainLock` | inferred | 70162 |
| `axe` | `refreshSessionDrainLockHeartbeat` | inferred | 70185 |
| `uxe` | `releaseSessionDrainLock` | inferred | 70190 |
| `xW` | `resolveSessionDrainLockPath` | inferred | 70202 |
| `lxe` | `readDrainLockFile` | inferred | 70205 |
| `zxe` | `drainSessionMailbox` | inferred | 70662 |
| `no` | `classifySessionKeyOrUnknown` | inferred | 71746 |
| `Zg` | `buildSessionInfoFromState` | inferred | 72634 |
| `hht` | `classifySessionPlane` | inferred | 72679 |
| `CS` | `resolvePiAgentDir` | inferred | 73448 |
| `OS` | `readPiAgentSettings` | inferred | 73452 |
| `iRe` | `stringifyExecutionToolInput` | inferred | 80488 |
| `sRe` | `buildSessionExecutionPayload` | inferred | 80502 |
| `uk` | `channelKindFromSessionKey` | inferred | 80532 |
| `aG` | `inferActorOriginFromSessionKey` | inferred | 80549 |
| `cRe` | `classifySessionPoolKind` | inferred | 80561 |
| `wy` | `SESSION_SCHEMA_VERSION` | __export | 80573 |
| `fRe` | `createJobSessionFinalizer` | inferred | 80578 |
| `mk` | `computeInstructionsFingerprint` | __export | 82650 |
| `SG` | `computeNonBoardInstructionsFingerprint` | __export | 82659 |
| `kN` | `diffStreamingConfigSignature` | __export | 82666 |
| `URe` | `computeMissionFingerprint` | __export | 82699 |
| `xN` | `runInstructionsFingerprintGuard` | __export | 82704 |
| `qRe` | `collectInstructionsInputs` | inferred | 82851 |
| `hk` | `initInstructionsFingerprintModule` | inferred | 82886 |
| `kG` | `narrowToModelSettableAdapter` | inferred | 82899 |
| `xG` | `computeStreamingConfigSignature` | inferred | 82903 |
| `EN` | `readLiveStreamContextToken` | inferred | 82921 |
| `EG` | `isLiveStreamRebuildRequired` | inferred | 82931 |
| `RN` | `flagStreamRecreationOnModelReject` | inferred | 82937 |
| `VRe` | `createModelCommandResolvers` | inferred | 82955 |
| `ubt` | `recordPendingInterruptMarker` | inferred | 83093 |
| `GRe` | `prependPendingInterruptMarker` | inferred | 83115 |
| `PN` | `interruptActorQuery` | inferred | 83136 |
| `RG` | `triggerDeferredPreempt` | inferred | 83140 |
| `gk` | `requestBoundaryAwarePreempt` | inferred | 83149 |
| `ZRe` | `snapshotInflightEventIds` | inferred | 83158 |
| `cp` | `teardownStreamingSession` | inferred | 83163 |
| `IG` | `waitForWakeOrIdleTimeout` | inferred | 83178 |
| `$N` | `shutdownActorRuntimeAdapter` | inferred | 83192 |
| `XRe` | `memoizeAvailabilityProbeUntilOk` | inferred | 83957 |
| `gbt` | `createSessionManager` | __export | 83964 |
| `Pbt` | `createMetaSession` | __export | 86170 |
| `$bt` | `sweepTombstonedSessionRecords` | __export | 86756 |
| `gwe` | `createIdleCompactSweeper` | inferred | 88861 |
| `DG` | `resolvePreemptFromCommandText` | inferred | 90630 |
| `Qbt` | `classifySessionPlaneByKey` | inferred | 90686 |
| `xIe` | `resolveIsolatedPlaneKind` | inferred | 90973 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `xw` | `resolveMetaPromptText` | __export | 55385 |
| `_ot` | `renderJobAcceptanceBlock` | inferred | 55396 |
| `eye` | `renderJobMissionBlock` | __export | 55402 |
| `tye` | `renderPromptLayers` | __export | 55409 |
| `gg` | `buildSystemPromptForChannelConfig` | __export | 55436 |
| `ube` | `extractSystemPromptAppend` | __export | 62244 |
| `awe` | `decideRestartHintInjection` | inferred | 66093 |
| `uwe` | `renderDaemonRestartHint` | inferred | 66122 |
| `hA` | `formatLocalTimestampWithZone` | inferred | 70426 |
| `_xe` | `decideBoardUpdatedInjection` | inferred | 70449 |
| `bxe` | `renderBoardUpdatedHint` | inferred | 70473 |
| `Lxe` | `projectJobPromptContext` | inferred | 70528 |
| `Ut` | `escapeXmlText` | inferred | 71727 |
| `$mt` | `renderJobCompleteReceiptGuidance` | inferred | 71750 |
| `_A` | `renderMailboxEventPrompt` | inferred | 71793 |
| `Amt` | `renderSkipRewindBlock` | inferred | 71876 |
| `Dmt` | `resolvePendingCompactNotice` | inferred | 71890 |
| `Mmt` | `renderSmartCompactNoticeBlock` | inferred | 71913 |
| `qxe` | `formatElapsedDuration` | inferred | 71922 |
| `Bxe` | `computeTimeGapContext` | inferred | 71933 |
| `jmt` | `renderTimeGapContextBlock` | inferred | 71942 |
| `Fmt` | `renderJobTickBlock` | inferred | 71956 |
| `Vxe` | `buildTransientUserBlocks` | inferred | 71970 |
| `MRe` | `transcludeBroadcastBoard` | inferred | 82499 |
| `X_t` | `renderTranscludedFiles` | inferred | 82507 |
| `jRe` | `resolveBoardIncludes` | inferred | 82514 |
| `ebt` | `realpathOrSelf` | inferred | 82548 |
| `ORe` | `normalizeIncludePathKey` | inferred | 82556 |
| `tbt` | `stripBoardIncludeFrontmatter` | inferred | 82561 |
| `nbt` | `parseBoardFileContent` | inferred | 82569 |
| `rbt` | `stripBoardHtmlComments` | inferred | 82580 |
| `ibt` | `collectBoardIncludePaths` | inferred | 82597 |
| `obt` | `normalizeBoardIncludeToken` | inferred | 82626 |
| `sbt` | `isBoardIncludePathCandidate` | inferred | 82632 |
| `abt` | `resolveBoardIncludePath` | inferred | 82636 |
| `LRe` | `initBoardTransclusionModule` | inferred | 82639 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `cq` | `detectInProcessBreak` | __export | 37028 |
| `Za` | `drainRecordPath` | __export | 37040 |
| `pf` | `appendDrainRecord` | __export | 37043 |
| `ph` | `readDrainRecords` | __export | 37062 |
| `kI` | `createEmptyUsageSummary` | inferred | 37068 |
| `ode` | `accumulateDrainRecordIntoSummary` | inferred | 37128 |
| `ev` | `summarizeDrainRecords` | __export | 37140 |
| `sde` | `aggregateSessionDrainSummary` | inferred | 37145 |
| `fq` | `readGlobalUsageTotals` | __export | 37167 |
| `$et` | `readRecentDrainRecords` | __export | 37184 |
| `rde` | `IN_PROCESS_BREAK_HIT_RATIO_FLOOR` | __export | 37201 |
| `B$` | `runSkipTool` | inferred | 54982 |
| `el` | `initSkipToolModule` | inferred | 55006 |
| `hg` | `isAbortLikeError` | __export | 55284 |
| `Tg` | `selectInterruptMarkerText` | inferred | 62099 |
| `Pg` | `normalizeTurnAbortReason` | inferred | 62103 |
| `Uw` | `initInterruptMarkerTextModule` | inferred | 62106 |
| `abe` | `computeCodexTurnUsage` | __export | 62220 |
| `pxe` | `normalizeInputTokenTotals` | inferred | 70389 |
| `PW` | `addToNumericField` | inferred | 70485 |
| `Io` | `runTimedDrainPhase` | inferred | 70493 |
| `kxe` | `resolveTurnModelWithLayer` | inferred | 70538 |
| `xxe` | `resolveTurnEffortWithLayer` | inferred | 70551 |
| `Rxe` | `extractServedModelFromUsage` | inferred | 70567 |
| `yA` | `isChannelMessageEvent` | inferred | 70572 |
| `NW` | `prepareDrainTurnContext` | inferred | 70575 |
| `Fxe` | `buildTurnSdkRunConfig` | inferred | 70627 |
| `Ixe` | `resolveDrainContextProfileOrRefuse` | inferred | 70643 |
| `to` | `isNonNullObject` | inferred | 71661 |
| `on` | `readStringProperty` | inferred | 71665 |
| `DW` | `extractPayloadMediaRefs` | inferred | 71676 |
| `Hmt` | `hasSkipRewindRecordSince` | inferred | 72093 |
| `Pxe` | `markTurnSkippedFromSkipRecord` | inferred | 72099 |
| `gA` | `clearPendingOutboundAttachments` | inferred | 72102 |
| `MW` | `readPendingOutboundAttachments` | inferred | 72105 |
| `jW` | `batchDrainItems` | inferred | 72109 |
| `Hxe` | `loadDrainItemEventCached` | inferred | 72146 |
| `$xe` | `parseEventTimestampMs` | inferred | 72158 |
| `Jmt` | `isMergeableDrainBatch` | inferred | 72164 |
| `Gmt` | `isMergeableChannelMessageBatch` | inferred | 72168 |
| `Wxe` | `hasUniformDrainCoalesceKey` | inferred | 72176 |
| `Jxe` | `isWorkerTaskNotifyDelivery` | inferred | 72182 |
| `Gxe` | `extractJobCompletePayload` | inferred | 72190 |
| `Zxe` | `extractJobCompletionJobId` | inferred | 72196 |
| `Cxe` | `classifyDrainBatchClass` | inferred | 72203 |
| `Kmt` | `computeDrainCoalesceKey` | inferred | 72211 |
| `Ymt` | `resolveEventSourceChannelId` | inferred | 72219 |
| `Qmt` | `collectJobCompletionReceipts` | inferred | 72245 |
| `eht` | `renderCoalescedDrainPrompt` | inferred | 72273 |
| `Yxe` | `createDrainExecutionEventRecorder` | inferred | 72285 |
| `aht` | `runHistoryControlCommand` | inferred | 72421 |
| `Xxe` | `resolveReplyTargetSessionKeys` | inferred | 72443 |
| `Bc` | `emitDrainOutputRecords` | inferred | 72455 |
| `uht` | `renderDrainErrorRuntimeHint` | inferred | 72512 |
| `TS` | `handleDrainError` | inferred | 72539 |
| `lht` | `clearModelOverrideOnRuntimeFlip` | inferred | 72595 |
| `cht` | `resolvePendingModelFork` | inferred | 72612 |
| `pht` | `renderRuntimeUnavailableGuidance` | inferred | 72660 |
| `mht` | `renderRuntimeMismatchGuidance` | inferred | 72668 |
| `Dxe` | `runDrainQueryAndCollectOutboundAttachments` | inferred | 72694 |
| `Qxe` | `mergeOutboundAttachmentLists` | inferred | 72775 |
| `vht` | `runDrainTurnWithResumeFallback` | inferred | 72785 |
| `PS` | `initMailboxDrainRunnerModule` | inferred | 72917 |
| `Yg` | `runQueueOutboundAttachmentTool` | inferred | 73577 |
| `AS` | `initQueueOutboundAttachmentModule` | inferred | 73608 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Mf` | `hasParentToolUseId` | inferred | 55021 |
| `fg` | `createAbortErrorWithCause` | inferred | 55027 |
| `H$` | `extractSdkMessageTextChunks` | inferred | 55032 |
| `W$` | `extractStreamTextDeltas` | inferred | 55065 |
| `J$` | `extractStreamThinkingText` | inferred | 55093 |
| `G$` | `parseToolUseBlockStart` | inferred | 55115 |
| `Z$` | `parseInputJsonDelta` | inferred | 55130 |
| `K$` | `stringifyToolResultContent` | inferred | 55143 |
| `cot` | `selectDominantModelByInputTokens` | inferred | 55154 |
| `pg` | `mapClaudeResultToDrainUsage` | inferred | 55179 |
| `Y$` | `resolveClaudeCostBaseline` | inferred | 55202 |
| `X$` | `buildClaudeCostBaseline` | inferred | 55211 |
| `Zge` | `findDeadAllowedToolEntries` | __export | 55261 |
| `Kge` | `splitDisallowedToolsForClaude` | __export | 55266 |
| `ww` | `isAgentSdkTurnInterruptedError` | __export | 55276 |
| `Sw` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 55280 |
| `vw` | `normalizeOptionalEnvString` | inferred | 55297 |
| `Xge` | `probeClaudeAvailability` | __export | 55306 |
| `_V` | `isClaudeAvailable` | __export | 55336 |
| `kw` | `claudeUnavailableReason` | __export | 55340 |
| `hot` | `primeClaudeAvailability` | __export | 55343 |
| `got` | `__resetClaudeProbeCacheForTest` | __export | 55347 |
| `yot` | `__setClaudeVerifierForTest` | __export | 55351 |
| `Qge` | `verifyClaudeCodeRuntimeAvailable` | __export | 55355 |
| `bV` | `eventToMessageGenerator` | __export | 55474 |
| `eC` | `stringToMessageGenerator` | __export | 55502 |
| `hV` | `parsePositiveMsEnv` | __export | 55512 |
| `kot` | `disableSystemPromptSnapshot` | inferred | 55518 |
| `Lf` | `createAgentSdkAdapter` | __export | 55529 |
| `Cr` | `AgentSdkPromptNotAcceptedAbortError` | __export | 55834 |
| `Ur` | `AgentSdkTurnInterruptedError` | __export | 55834 |
| `mg` | `CLAUDE_CORE_TOOLS` | __export | 55834 |
| `ko` | `initAgentSdkAdapterModule` | inferred | 55834 |
| `rct` | `buildClaudeSettingsEnvOverrides` | inferred | 65615 |
| `yve` | `materializeClaudeSettingsFile` | inferred | 65668 |
| `sS` | `computeContextProfileSignature` | inferred | 65679 |
| `aS` | `initMaterializedClaudeSettingsModule` | inferred | 65691 |
| `wve` | `mergeClaudeToolLists` | inferred | 65723 |
| `Z6` | `applyJobSdkConfigOverride` | inferred | 65853 |
| `GSe` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 69142 |
| `ZH` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 69211 |
| `np` | `resolveContextCapToken` | inferred | 69897 |
| `aA` | `describeContextProfileSource` | inferred | 69907 |
| `uA` | `extractProfiledEndpointFields` | inferred | 69921 |
| `lA` | `listSortedAliasKeys` | inferred | 69952 |
| `Yke` | `buildProfiledExternalRequirement` | inferred | 69961 |
| `wW` | `classifyModelContextRequirement` | inferred | 69991 |
| `Wg` | `selectProfileIssuesForModel` | inferred | 70017 |
| `Jg` | `resolveClaudeContextRequirement` | inferred | 70133 |
| `IS` | `isClaudeRuntimeOrDefault` | inferred | 70227 |
| `fA` | `prepareClaudeContextProfile` | inferred | 70230 |
| `Sxe` | `resolveAdditionalDirClaudeMdAutoload` | inferred | 70522 |
| `by` | `createAladuoMcpServer` | inferred | 80220 |
| `JRe` | `initAbortableAsyncQueueModule` | inferred | 83053 |
| `KRe` | `createClaudeStreamingSessionFactory` | inferred | 83211 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `E6` | `buildCodexDirectOnlyToolConfig` | inferred | 62143 |
| `Jf` | `isCodexAvailable` | __export | 62149 |
| `xut` | `codexUnavailableReason` | __export | 62153 |
| `Eut` | `primeCodexAvailability` | __export | 62156 |
| `Rut` | `__setCodexAvailabilityForTests` | __export | 62161 |
| `$g` | `resolveCodexSandbox` | __export | 62165 |
| `Ac` | `checkCodexAvailability` | __export | 62169 |
| `P6` | `ensureAgentsMdSymlink` | __export | 62206 |
| `sbe` | `codexNotificationFilterDecision` | __export | 62216 |
| `lbe` | `buildBaseInstructions` | __export | 62248 |
| `cbe` | `buildDeveloperInstructions` | __export | 62266 |
| `R6` | `buildCodexTurnInput` | __export | 62280 |
| `Bw` | `createCodexAppServerAdapter` | __export | 62293 |
| `Tut` | `resolveCodexSandboxForPermissionMode` | inferred | 62755 |
| `qw` | `isCodexPlainObject` | inferred | 62768 |
| `dbe` | `isImageGenerationItemType` | inferred | 62772 |
| `fbe` | `hasImageGenerationRecord` | __export | 62779 |
| `pbe` | `extractCodexGeneratedImageAttachment` | __export | 62795 |
| `mbe` | `capitalizeFirstChar` | inferred | 62823 |
| `hbe` | `warnUnmappedCodexItemOnce` | inferred | 62846 |
| `gbe` | `mapItemStartedToExecEvent` | __export | 62854 |
| `ybe` | `mapItemCompletedToExecEvent` | __export | 62965 |
| `VC` | `ALADUO_TOOL_NAMESPACE` | __export | 63038 |
| `Gf` | `initCodexAppServerModule` | inferred | 63038 |
| `Qpt` | `generatePartitionCodexAgents` | __export | 69536 |
| `Vke` | `parseAgentMarkdown` | __export | 69610 |
| `Hke` | `renderAgentToml` | __export | 69625 |
| `cmt` | `generateAllPartitionCodexAgents` | inferred | 69844 |
| `vy` | `buildCodexStringInputSchema` | inferred | 80347 |
| `pN` | `buildCodexDynamicTools` | inferred | 80367 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `_I` | `containsWhitespaceChar` | inferred | 36824 |
| `bI` | `isProviderQualifiedModelId` | inferred | 36828 |
| `gV` | `PARTITION_CORE_TOOLS` | __export | 55834 |
| `jw` | `parseScheduleDurationMs` | inferred | 61308 |
| `_6` | `assertScheduleDurationRepresentable` | inferred | 61319 |
| `FC` | `isOneShotJobSchedule` | inferred | 61323 |
| `J_e` | `validateJobScheduleExpression` | inferred | 61327 |
| `Lw` | `parseJobRearmTime` | inferred | 61344 |
| `G_e` | `isJobScheduleDue` | inferred | 61356 |
| `Cc` | `buildJobSessionKey` | inferred | 61533 |
| `tbe` | `parseJobFileFrontmatter` | inferred | 61555 |
| `gut` | `renderJobFileMarkdown` | inferred | 61576 |
| `ol` | `initJobManagerModule` | inferred | 61640 |
| `Wf` | `redactJobModelProfileTokens` | inferred | 62079 |
| `JC` | `renderManageJobToolDescription` | inferred | 64051 |
| `GC` | `renderJobSessionToolDescription` | inferred | 64058 |
| `ilt` | `renderJobPromptModeDescription` | inferred | 64069 |
| `olt` | `renderJobExtraToolsDescription` | inferred | 64076 |
| `Cbe` | `buildJobPromptModeExtraToolsSchema` | inferred | 64080 |
| `llt` | `listSelectableJobRuntimes` | inferred | 64087 |
| `Abe` | `buildJobRuntimeSchemaField` | inferred | 64096 |
| `ZC` | `buildManageJobInputSchema` | inferred | 64104 |
| `KC` | `buildJobSessionInputSchema` | inferred | 64113 |
| `Ag` | `runManageJobTool` | inferred | 64121 |
| `Gw` | `initManageJobToolModule` | inferred | 64260 |
| `Gbe` | `classifyConsumerStaleness` | inferred | 64743 |
| `U6` | `resolveNotifyUnconsumedHours` | inferred | 64756 |
| `q6` | `initNotifyConsumerStalenessModule` | inferred | 64762 |
| `Ng` | `evaluateNotifyConsumerRefusal` | inferred | 64770 |
| `$lt` | `listSessionsWithRecentConsumer` | inferred | 64793 |
| `rO` | `renderNotifyRefusalMessage` | inferred | 64819 |
| `Mg` | `runRemindDuoduoTool` | inferred | 64973 |
| `nS` | `initRemindDuoduoToolModule` | inferred | 65006 |
| `fO` | `normalizeNotifyChannelTarget` | inferred | 65019 |
| `dve` | `isJobSessionKeyKind` | inferred | 65213 |
| `hO` | `renderNotifyToolDescription` | inferred | 65247 |
| `gO` | `buildNotifyInputSchema` | inferred | 65266 |
| `fve` | `isOrphanJobSessionKey` | inferred | 65292 |
| `Jlt` | `computeBoundedEditDistance` | inferred | 65329 |
| `Glt` | `matchNearMissSessionKey` | inferred | 65348 |
| `sve` | `groupNotifyTargetCandidates` | inferred | 65390 |
| `ave` | `renderNotifyTargetCandidateLines` | inferred | 65408 |
| `Klt` | `resolveJobOwnerNotifyTarget` | inferred | 65428 |
| `Ylt` | `resolveNotifyTargetSessionKey` | inferred | 65437 |
| `uve` | `renderNotifyDeliveryReport` | inferred | 65470 |
| `Lg` | `runNotifyTool` | inferred | 65484 |
| `oS` | `initNotifyToolModule` | inferred | 65586 |
| `hS` | `loadSubconsciousPartitions` | inferred | 66462 |
| `Wct` | `parsePartitionDefinition` | inferred | 66486 |
| `Fg` | `readPlaylistRound` | inferred | 66527 |
| `Jct` | `parsePlaylistCurrentRound` | inferred | 66545 |
| `IO` | `markPlaylistItemExecuted` | inferred | 66564 |
| `Rwe` | `rebuildPlaylistRound` | inferred | 66582 |
| `Iwe` | `readPartitionInboxEntries` | inferred | 66626 |
| `TO` | `initSubconsciousPlaylistModule` | inferred | 66669 |
| `Pwe` | `resolvePartitionStatePath` | inferred | 66689 |
| `Xf` | `readPartitionRunState` | inferred | 66692 |
| `gH` | `writePartitionRunState` | inferred | 66715 |
| `yH` | `isPartitionBackedOff` | inferred | 66719 |
| `_H` | `computePartitionBackoffUntil` | inferred | 66723 |
| `PO` | `initPartitionRunStateModule` | inferred | 66735 |
| `FSe` | `resolveCadenceIntervalMs` | __export | 68843 |
| `Bpt` | `computeLegacyJobSessionKey` | inferred | 69335 |
| `Vpt` | `rewriteSessionKeyInStateAndMeta` | inferred | 69356 |
| `Dke` | `migrateLegacyJobSessionKeys` | inferred | 69390 |
| `Fke` | `retireListedPartitions` | inferred | 69442 |
| `Zpt` | `retirePartitionOnce` | inferred | 69455 |
| `zke` | `initPartitionRetirementModule` | inferred | 69507 |
| `uRe` | `isAutoArchivedJobSchedule` | inferred | 80537 |
| `lk` | `classifyJobScheduleType` | inferred | 80541 |
| `tIe` | `normalizePartitionOutputText` | inferred | 86048 |
| `wbt` | `stringifyPartitionToolInput` | inferred | 86053 |
| `kbt` | `detectEmptyRequiredPartitionOutput` | inferred | 86063 |
| `xbt` | `appendPartitionToolEvent` | inferred | 86066 |
| `Ebt` | `hashActivityFingerprint` | inferred | 86105 |
| `Rbt` | `readLatestExternalEventId` | inferred | 86108 |
| `CN` | `readNewestMtimeRecursive` | inferred | 86127 |
| `Ibt` | `renderPartitionRuntimeContext` | inferred | 86153 |
| `Tbt` | `renderPartitionInboxSection` | inferred | 86160 |
| `rIe` | `initMetaSessionModule` | inferred | 86721 |
| `Cbt` | `runCadenceTick` | __export | 86816 |
| `PG` | `scanAndSpawnDueJobs` | __export | 86847 |
| `Obt` | `fireDueWakeRecords` | inferred | 86938 |
| `Nbt` | `createJobScheduler` | __export | 87008 |
| `cIe` | `initJobSchedulerModule` | inferred | 87064 |
| `Dbt` | `isJobOrMetaOutboxRecord` | inferred | 87075 |
| `Mbt` | `createOutboxDeliveryManager` | __export | 87079 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `mS` | `partitionInboxDir` | __export | 66447 |
| `Mc` | `partitionInboxDirFromVar` | __export | 66451 |
| `Ni` | `resolveMemoryDirs` | inferred | 66751 |
| `OO` | `bytesToKibCeil` | inferred | 66761 |
| `Qf` | `scanWikiLinkOccurrences` | inferred | 66765 |
| `ep` | `resolveMemoryLinkTargets` | inferred | 66790 |
| `Ar` | `compareStringsAscending` | inferred | 66796 |
| `$we` | `countDatedStampLines` | inferred | 66800 |
| `AO` | `countNewlineChars` | inferred | 66807 |
| `Jo` | `splitLinesDropTrailingEmpty` | inferred | 66814 |
| `Ro` | `recordUnreadableMemoryPath` | inferred | 66829 |
| `Tn` | `readMemoryFileSyncOrNull` | inferred | 66841 |
| `jc` | `isMemoryPathFile` | inferred | 66849 |
| `Ug` | `isMemoryPathDirectory` | inferred | 66857 |
| `ou` | `listMarkdownSlugsSync` | inferred | 66865 |
| `NO` | `measureUtf8ByteLength` | inferred | 66877 |
| `Nwe` | `normalizeSignalKindVersion` | inferred | 66885 |
| `Go` | `initMemorySignalKindsModule` | inferred | 66889 |
| `edt` | `parseEffectivenessTrajectory` | inferred | 66908 |
| `tdt` | `parseEffectivenessCounts` | inferred | 66918 |
| `ndt` | `parseUpdaterGuidanceVerdict` | inferred | 66937 |
| `rdt` | `classifyTopicNodeFormat` | inferred | 66957 |
| `idt` | `classifyTopicNodeType` | inferred | 66965 |
| `Dwe` | `rankEffectivenessTrajectory` | inferred | 66976 |
| `odt` | `compareBoardLintTargets` | inferred | 66989 |
| `Mwe` | `collectBoardLintReport` | inferred | 67040 |
| `cdt` | `buildBoardLintTarget` | inferred | 67073 |
| `ddt` | `runBoardLint` | inferred | 67104 |
| `jwe` | `initBoardLintModule` | inferred | 67126 |
| `kH` | `isSafeMemorySlug` | inferred | 67134 |
| `Lc` | `createMemorySlugReader` | inferred | 67138 |
| `Fc` | `walkReachableMemory` | inferred | 67153 |
| `mdt` | `renderEntityConvergeSignalBody` | inferred | 67196 |
| `Uwe` | `runEntityLint` | inferred | 67204 |
| `qwe` | `initEntityLintModule` | inferred | 67244 |
| `gdt` | `isAllowedNodeSection` | inferred | 67254 |
| `_dt` | `renderNodeConvergeSignalBody` | inferred | 67269 |
| `Bwe` | `runNodeLint` | inferred | 67281 |
| `DO` | `buildNodeSignalKey` | inferred | 67330 |
| `Vwe` | `initNodeLintModule` | inferred | 67340 |
| `bS` | `initGapSpanModule` | inferred | 67476 |
| `vS` | `readPartitionContract` | inferred | 67484 |
| `FO` | `getCachedPartitionContract` | inferred | 67575 |
| `zO` | `postMemorySignalsToInboxes` | inferred | 67581 |
| `UO` | `enforceContractGate` | inferred | 67634 |
| `Xwe` | `reconcileMemorySignalInboxes` | inferred | 67665 |
| `Qwe` | `hasAnyMemorySignalConsumer` | inferred | 67708 |
| `eSe` | `isOrphanWarningDeliverable` | inferred | 67717 |
| `OH` | `initMemorySignalDeliveryModule` | inferred | 67720 |
| `VO` | `recordUnreadableUnlessMissing` | inferred | 67742 |
| `Mdt` | `listMemoryFragmentDates` | inferred | 67767 |
| `zdt` | `readOrSeedGapHandedDays` | inferred | 67824 |
| `nSe` | `appendGapHandedSpan` | inferred | 67866 |
| `rSe` | `readGapLintDayEvents` | inferred | 67874 |
| `oSe` | `mergeContiguousHourRanges` | inferred | 67915 |
| `qdt` | `renderScanGapSignalBody` | inferred | 67934 |
| `Bdt` | `buildScanGapSignal` | inferred | 67940 |
| `BO` | `buildGapReadFaultResult` | inferred | 67949 |
| `Vdt` | `runGapLint` | inferred | 67967 |
| `cSe` | `deliverScanGapSignal` | inferred | 68003 |
| `dSe` | `initGapLintModule` | inferred | 68047 |
| `NH` | `readMemoryMaxLinesLimit` | inferred | 68111 |
| `hSe` | `runBroadcastBudgetLint` | inferred | 68121 |
| `DH` | `initBroadcastBudgetLintModule` | inferred | 68160 |
| `oft` | `listEventPartitionDates` | inferred | 68173 |
| `aft` | `scanActivationWindowTouches` | inferred | 68200 |
| `uft` | `renderActivationReportHeader` | inferred | 68277 |
| `lft` | `renderBoardTemperatureSection` | inferred | 68282 |
| `cft` | `renderHotOrphansSection` | inferred | 68292 |
| `dft` | `renderActivationReportBody` | inferred | 68299 |
| `bSe` | `runActivationLint` | inferred | 68305 |
| `UH` | `initActivationLintModule` | inferred | 68404 |
| `kSe` | `readIntuitionWeaverLastFinishedMs` | inferred | 68414 |
| `fft` | `findNewestFragmentMtimeMs` | inferred | 68420 |
| `pft` | `renderFoldGapBody` | inferred | 68450 |
| `xSe` | `runFoldGapLint` | inferred | 68456 |
| `ESe` | `initFoldGapLintModule` | inferred | 68473 |
| `yft` | `extractBoardSlugLinks` | inferred | 68482 |
| `vft` | `formatSlugLinkLocations` | inferred | 68505 |
| `RSe` | `runBroadcastLinkLint` | inferred | 68519 |
| `ISe` | `initBroadcastLinkLintModule` | inferred | 68540 |
| `Ift` | `findBoardHeadingLines` | inferred | 68547 |
| `TSe` | `runBroadcastFlattenLint` | inferred | 68572 |
| `PSe` | `initBroadcastFlattenLintModule` | inferred | 68593 |
| `$ft` | `computeOrphanTopicNodes` | inferred | 68611 |
| `OSe` | `detectOrphanMemory` | inferred | 68660 |
| `ASe` | `buildOrphanNewbornSignals` | inferred | 68683 |
| `NSe` | `forgetMemoryEntry` | inferred | 68692 |
| `Cft` | `resolveGitToplevelSync` | inferred | 68728 |
| `Oft` | `renderOrphanIslandsBody` | inferred | 68742 |
| `DSe` | `filterOrphanIslands` | inferred | 68756 |
| `MSe` | `buildOrphanIslandsSignal` | inferred | 68760 |
| `Aft` | `computeMemoryLinkIndegree` | inferred | 68769 |
| `Nft` | `listMemorySlugReferrers` | inferred | 68780 |
| `qH` | `routeContractDecision` | inferred | 68797 |
| `Mft` | `formatForgetCommitMessage` | inferred | 68809 |
| `jSe` | `initOrphanMemoryModule` | inferred | 68812 |
| `VH` | `isTruthyEnvFlag` | inferred | 68829 |
| `WH` | `resolveMemoryCheckFlags` | __export | 68834 |
| `JH` | `buildMemoryCheckStatus` | __export | 68850 |
| `jft` | `runMemoryCheckTick` | __export | 68864 |
| `HH` | `runMemoryCheckSubStep` | inferred | 68980 |
| `fa` | `runReadAuditedMemoryCheckStep` | inferred | 68988 |
| `Lft` | `evaluatePredicateOrFalse` | inferred | 68995 |
| `GH` | `initMemoryCheckTickModule` | inferred | 69002 |
| `pW` | `runKernelGitCommand` | inferred | 69240 |
| `Pke` | `buildKernelGitEnv` | inferred | 69258 |
| `$ke` | `buildSafeDirectoryGitArgs` | inferred | 69270 |
| `Upt` | `isKernelGitToplevel` | inferred | 69273 |
| `Cke` | `ensureKernelGitRepo` | inferred | 69286 |
| `qpt` | `mergeKernelGitignoreEntries` | inferred | 69295 |
| `Oke` | `initKernelGitModule` | inferred | 69314 |
| `wG` | `computeBoardLayerHash` | __export | 82655 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `Ii` | `isEffortLevel` | inferred | 31533 |
| `gR` | `isAgentRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31669 |
| `NR` | `isKnownRuntimeValue` | inferred | 31793 |
| `Eb` | `isSupportedRuntime` | inferred | 31797 |
| `uU` | `validateKnownRuntimeValue` | inferred | 31801 |
| `Wd` | `validateRunnableRuntimeValue` | inferred | 31814 |
| `ho` | `resolveDefaultRuntime` | inferred | 31828 |
| `Fu` | `initRuntimeValidationModule` | inferred | 31837 |
| `Xl` | `attachStreamLineReader` | inferred | 31880 |
| `Fm` | `parseEnvBooleanFlag` | inferred | 32012 |
| `Ue` | `logErrorMessage` | inferred | 32041 |
| `Z` | `logWarnMessage` | inferred | 32045 |
| `ee` | `logInfoMessage` | inferred | 32049 |
| `ke` | `logDebugMessage` | inferred | 32053 |
| `vt` | `logAlwaysAtLevel` | inferred | 32069 |
| `yYe` | `appendTelemetryRecord` | inferred | 32914 |
| `_Ye` | `isTelemetryEnabled` | inferred | 32919 |
| `go` | `logLatencyStageTelemetry` | inferred | 32927 |
| `_s` | `recordTelemetryMetric` | inferred | 32935 |
| `Wi` | `formatYamlErrorMessage` | inferred | 35089 |
| `Wb` | `normalizePromptMode` | inferred | 35135 |
| `Jb` | `parseClaudeFrontmatterBlock` | inferred | 35336 |
| `eh` | `listFrontmatterKeyAliases` | inferred | 35450 |
| `HU` | `parseSdkConfigFrontmatter` | inferred | 35454 |
| `WQe` | `parseChannelRuntimeField` | inferred | 35468 |
| `Ua` | `resolveLayeredChannelRuntime` | inferred | 35477 |
| `cI` | `parseChannelConfigFields` | inferred | 35514 |
| `li` | `loadGlobalRuntimeConfig` | inferred | 36772 |
| `Wa` | `loadChannelKindConfig` | inferred | 36800 |
| `Ja` | `initChannelConfigLoaderModule` | inferred | 36816 |
| `fct` | `buildEffectiveRuntimeFields` | inferred | 65708 |
| `SO` | `foldConfigLayersByKey` | inferred | 65727 |
| `xve` | `mergeRuntimeModelLayers` | inferred | 65756 |
| `Eve` | `mergeRuntimeEffortLayers` | inferred | 65766 |
| `uS` | `readRuntimeModelSetting` | inferred | 65776 |
| `lS` | `readRuntimeEffortSetting` | inferred | 65780 |
| `nu` | `mergeGlobalModelConfigLayers` | inferred | 65794 |
| `G6` | `overlayConfigEntriesByKey` | inferred | 65830 |
| `Ive` | `appendPiConfigIssues` | inferred | 65874 |
| `Tve` | `buildEffectiveChannelConfig` | inferred | 65878 |
| `ru` | `resolveEffectiveChannelConfig` | inferred | 65973 |
| `cS` | `isBusinessSourceKind` | inferred | 65988 |
| `K6` | `resolveEffectiveChannelConfigForEvent` | inferred | 66001 |
| `iu` | `resolveChannelConfigBySession` | inferred | 66018 |
| `kwe` | `resolveRuntimePaths` | __export | 66362 |
| `GO` | `parseDotEnv` | __export | 69045 |
| `ll` | `hostDotEnvPath` | __export | 69060 |
| `VSe` | `removeHostModelEnvLines` | inferred | 69080 |
| `HSe` | `removeDotEnvKeyLines` | inferred | 69087 |
| `ZO` | `writeHostDotEnvLines` | inferred | 69099 |
| `YH` | `clearHostModelEnvVars` | __export | 69123 |
| `WSe` | `applyHostModelEnvVars` | __export | 69127 |
| `JSe` | `writeHostModelEnvConfig` | __export | 69130 |
| `ZSe` | `clearHostModelEnvConfig` | __export | 69155 |
| `Vft` | `readHostDaemonToken` | __export | 69166 |
| `Hft` | `writeHostDaemonToken` | __export | 69178 |
| `KSe` | `readHostDotEnvFile` | __export | 69189 |
| `Wft` | `loadHostDotEnv` | __export | 69198 |
| `KH` | `HOST_MODEL_ENV_KEYS` | __export | 69211 |
| `Ds` | `pathExistsAsync` | inferred | 69219 |
| `omt` | `isDirEmptyOrMissing` | inferred | 69751 |
| `_W` | `copyDirTreeOverwrite` | inferred | 69759 |
| `bW` | `copyDirTreeMissingOnly` | inferred | 69770 |
| `amt` | `refreshBootstrapDuoduoMdFiles` | inferred | 69781 |
| `umt` | `copyBootstrapIntoKernel` | inferred | 69796 |
| `lmt` | `initializeRuntime` | __export | 69834 |
| `Kke` | `initRuntimeInitializationModule` | inferred | 69867 |
| `FW` | `encodePiWorkerFrame` | inferred | 72964 |
| `$S` | `resolvePiWorkerCommand` | inferred | 73033 |
| `Eht` | `buildPiSystemPromptSpec` | inferred | 73045 |
| `vA` | `createPiWorkerAdapter` | inferred | 73070 |
| `mEe` | `parsePiToolResultDetails` | inferred | 73651 |
| `hEe` | `handlePiToolEndObservation` | inferred | 73657 |
| `eH` | `CHANNEL_CONFIG_KEY_TYPES` | inferred | 88302 |
| `_ct` | `validateConfigValue` | inferred | 88340 |
| `nwe` | `writeInstanceModelAlias` | inferred | 88835 |
| `Jft` | `isClaudeAuthSource` | inferred | 89434 |
| `QH` | `readClaudeAuthSourceEnv` | inferred | 89438 |
| `Hn` | `resolveEnvConfigEntry` | inferred | 90519 |
| `Wbt` | `buildSdkConfigReport` | inferred | 90550 |
| `Jbt` | `buildSystemConfigReport` | inferred | 90568 |
| `bIe` | `formatLayerModelAliases` | inferred | 91604 |
| `NG` | `formatModelConfigIssues` | inferred | 91627 |
| `ky` | `appendConfigChangedEvent` | inferred | 91842 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 |
|---|---|---|---|
| `N6` | `isGrokAvailable` | __export | 63277 |
| `Aut` | `grokUnavailableReason` | __export | 63281 |
| `Nut` | `primeGrokAvailability` | __export | 63284 |
| `Dut` | `__setGrokAvailabilityForTests` | __export | 63289 |
| `Nc` | `checkGrokAvailability` | __export | 63292 |
| `Hw` | `grokAcpExtMethod` | __export | 63313 |
| `Oi` | `coerceToPlainObject` | inferred | 63322 |
| `Ibe` | `collectGrokToolCallNames` | inferred | 63365 |
| `Uut` | `isGrokSkipToolCall` | inferred | 63374 |
| `qut` | `mapGrokUsageToDrainUsage` | inferred | 63378 |
| `Ww` | `createGrokAcpAdapter` | __export | 63437 |
| `kbe` | `GROK_ACP_COMPACT` | __export | 63995 |
| `wbe` | `GROK_ACP_EXT_PREFIX` | __export | 63995 |
| `Sbe` | `GROK_ACP_SDK_CALL` | __export | 63995 |
| `vbe` | `GROK_AGENT_PROFILE` | __export | 63995 |
| `bbe` | `GROK_DISALLOWED_TOOLS` | __export | 63995 |
| `xbe` | `GROK_MCP_SDK_META` | __export | 63995 |
| `Ebe` | `GROK_MCP_SERVERS_META` | __export | 63995 |
| `Rbe` | `GROK_MCP_SERVER_NAME` | __export | 63995 |
| `Og` | `initGrokAcpRuntimeModule` | inferred | 63995 |
