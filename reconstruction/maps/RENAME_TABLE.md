# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*；其中标注 *published source* 的名字是上游在同作者的公开源码包里的拼写，由 `maps/published_daemon.json` 记录；标注 *historical export* 的名字是上游在旧版本 `__export` 块里的拼写，经版本配对追到本版本，由 `maps/historical_daemon.json` 记录）。“原行号”指反混淆后的 `daemon.pretty.js`。“首见版本”是 npm 上最早含有该声明的发行版（`maps/history_daemon.json`，由 `tools/history.sh` 逐版本配对得出）。

共 845 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.5。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `KR` | `statusPath` | inferred, historical export (v0.2.0..v0.3.7) | 32980 | v0.2.0 |
| `wU` | `buildInitialStatus` | inferred, historical export (v0.2.0..v0.3.7) | 32984 | v0.2.0 |
| `SU` | `writeStatus` | inferred, historical export (v0.2.0..v0.3.7) | 33011 | v0.2.0 |
| `Mb` | `readStatus` | inferred, historical export (v0.2.0..v0.3.7) | 33014 | v0.2.0 |
| `Vu` | `updateStatus` | inferred, historical export (v0.2.0..v0.3.7) | 33022 | v0.2.0 |
| `lq` | `replaceSessionIndexEntry` | inferred | 36932 |  |
| `nde` | `createVoidAwareAttachmentCallbacks` | inferred | 36957 | v0.8.4 |
| `Ict` | `daemonRestartReasonPath` | inferred | 66053 | v0.6.2 |
| `awe` | `claimDaemonRestartReason` | inferred | 66056 | v0.6.2 |
| `uwe` | `setPendingRestartReason` | inferred | 66082 |  |
| `lwe` | `getPendingRestartReason` | inferred | 66086 | v0.8.0 |
| `fwe` | `renderRestartWakeMessage` | inferred | 66128 | v0.8.0 |
| `dH` | `resolveRuntimeWriterLockPath` | inferred | 89258 | v0.2.0 |
| `Fct` | `isProcessAliveByPid` | inferred | 89262 | v0.2.0 |
| `zct` | `computeHostBootId` | inferred | 89272 | v0.3.0 |
| `wwe` | `getCachedHostBootId` | inferred | 89289 |  |
| `Uct` | `isRuntimeWriterLockStale` | inferred | 89293 | v0.3.0 |
| `pH` | `acquireRuntimeWriterLock` | inferred | 89305 | v0.2.0 |
| `Swe` | `refreshRuntimeWriterLockHeartbeat` | inferred | 89353 | v0.2.0 |
| `EO` | `releaseRuntimeWriterLock` | inferred | 89358 | v0.2.0 |
| `xIe` | `readEnvIntegerOrFallback` | inferred | 90547 | v0.2.0 |
| `nvt` | `computeRuntimeId` | inferred | 90727 | v0.2.0 |
| `dvt` | `deliverDaemonRestartWakes` | __export | 91248 | v0.8.0 |
| `Svt` | `parseHostHeaderHostname` | inferred | 92029 | v0.7.0 |
| `kvt` | `parseOriginHostname` | inferred | 92039 |  |
| `Rvt` | `createDaemon` | __export | 92081 | v0.2.0 |
| `Ivt` | `main` | __export | 93119 | v0.2.0 |

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
| `W8e` | `enqueuePartitionAppend` | inferred | 32091 | v0.2.0 |
| `J8e` | `generateSpineEventId` | inferred | 32096 | v0.2.0 |
| `Fm` | `formatEventPartitionName` | inferred | 32100 | v0.2.0 |
| `en` | `createSpineEvent` | inferred | 32104 | v0.2.0 |
| `Z8e` | `appendEventToPartition` | inferred | 32111 | v0.2.0 |
| `Rb` | `resolveEventIdIndexPath` | inferred | 32134 | v0.2.0 |
| `K8e` | `appendEventIdIndexEntry` | inferred | 32137 | v0.2.0 |
| `tn` | `atomicAppendEvent` | inferred | 32146 | v0.2.0 |
| `Oo` | `readEventById` | inferred | 32155 | v0.3.1 |
| `Y8e` | `readEventAtIndexedOffset` | inferred | 32163 | v0.3.1 |
| `X8e` | `scanPartitionsForEventId` | inferred | 32181 | v0.2.0 |
| `Ib` | `lookupEventIdIndexEntry` | inferred | 32198 | v0.2.0 |
| `Q8e` | `getOrCreateEventIdIndexCache` | inferred | 32212 | v0.2.0 |
| `eYe` | `isUsableEventIndexEntry` | inferred | 32222 | v0.8.2 |
| `tYe` | `loadEventIdIndex` | inferred | 32225 | v0.2.0 |
| `Sae` | `findEventInPartitionFile` | inferred | 32262 |  |
| `kae` | `readSpineIndexRetentionDays` | inferred | 32276 | v0.8.0 |
| `xae` | `pruneEventIdIndexByRetention` | inferred | 32282 | v0.8.0 |
| `Ao` | `initSpineEventLogModule` | inferred | 32324 | v0.8.0 |
| `IYe` | `resolveConsumerOffsetPath` | inferred | 32955 | v0.2.0 |
| `TYe` | `writeConsumerOffsetFile` | inferred | 32958 | v0.2.0 |
| `Bu` | `advanceConsumerWatermark` | inferred | 32961 | v0.2.0 |
| `JR` | `spineEventDedupStore` | inferred | 87246 | v0.2.0 |
| `GR` | `computeDedupKey` | inferred | 87306 | v0.2.0 |
| `nv` | `loadRegistryDedupStore` | inferred | 87469 | v0.2.0 |
| `mH` | `readPartitionByteRange` | inferred | 89372 | v0.8.2 |
| `Vct` | `iteratePartitionLinesBackward` | inferred | 89384 | v0.8.2 |
| `Hct` | `resolveTailCursorEndOffset` | inferred | 89396 | v0.8.2 |
| `kwe` | `readPartitionTail` | inferred | 89411 | v0.8.2 |
| `xwe` | `readSpineTail` | inferred | 89450 | v0.3.2 |
| `Dpt` | `shouldKeepRouteDeliverEvent` | inferred | 90401 | v0.8.4 |
| `Eke` | `stripSpineEventToEnvelope` | inferred | 90405 | v0.8.4 |
| `Mpt` | `redactSpineEventForExternal` | inferred | 90419 | v0.8.4 |
| `jpt` | `checkReservedRecordSource` | inferred | 90464 | v0.8.4 |
| `Tke` | `recordExternalSpineEvent` | inferred | 90475 | v0.8.4 |

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
| `A8e` | `isNonEmptyText` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31600 | v0.8.4 |
| `tU` | `unknownKeyProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31604 | v0.8.4 |
| `cae` | `textKeysProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31609 | v0.8.4 |
| `Nm` | `renderParamsProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31617 | v0.8.4 |
| `dae` | `describeConversationProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31624 |  |
| `nU` | `describeMemoryReadProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31628 |  |
| `rU` | `describeSpineCatProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31632 | v0.8.4 |
| `iU` | `describeSpineRecordProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31644 | v0.8.4 |
| `oU` | `initProtocolSystemModule` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 31647 | v0.7.1 |
| `sU` | `isModelRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31673 |  |
| `yR` | `isChannelIngressParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31677 | v0.2.0 |
| `_R` | `isChannelFileUploadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31681 | v0.2.0 |
| `bR` | `isChannelFileDownloadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31685 | v0.2.0 |
| `Dm` | `isChannelPullParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31689 | v0.2.0 |
| `vR` | `isChannelCommandParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31693 | v0.2.0 |
| `wR` | `isChannelAckParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31697 | v0.2.0 |
| `SR` | `isChannelDescribeParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31701 | v0.5.0 |
| `kR` | `isChannelSpawnParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31705 | v0.5.0 |
| `D8e` | `isAttachmentArray` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31709 | v0.2.0 |
| `M8e` | `isChannelCapabilities` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31713 | v0.2.0 |
| `j8e` | `isMimePattern` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31720 | v0.2.0 |
| `fae` | `initChannelProtocolModule` | inferred | 31723 |  |
| `xR` | `isJobCreateParams` | inferred | 31734 | v0.2.0 |
| `ER` | `isJobGetParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31738 | v0.2.0 |
| `RR` | `isJobListParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31742 | v0.2.0 |
| `IR` | `isJobArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31746 |  |
| `TR` | `isJobRescheduleParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31750 | v0.8.2 |
| `PR` | `isJobInterruptParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31754 | v0.8.2 |
| `mae` | `initProtocolJobModule` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 31757 | v0.7.1 |
| `$R` | `isSystemStatusParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 31766 |  |
| `CR` | `isSystemConfigParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 31770 |  |
| `OR` | `isSpineTailParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 31774 | v0.3.2 |
| `oh` | `isValidChannelId` | inferred | 35805 | v0.2.0 |
| `sh` | `assertValidChannelId` | inferred | 35809 | v0.2.0 |
| `vs` | `readChannelDescriptor` | inferred | 35849 | v0.2.0 |
| `net` | `generateOutboxRecordId` | inferred | 36036 | v0.2.0 |
| `Xb` | `resolveOutboxRecordPath` | inferred | 36040 | v0.2.0 |
| `Ba` | `createOutboxRecord` | inferred | 36044 | v0.2.0 |
| `Va` | `persistOutboxRecord` | inferred | 36076 | v0.2.0 |
| `tq` | `indexOutboxRecordByEventId` | inferred | 36082 | v0.2.0 |
| `Ha` | `readOutboxRecord` | inferred | 36090 | v0.2.0 |
| `Qb` | `listAllOutboxRecords` | inferred | 36115 | v0.2.0 |
| `uh` | `findOutboxRecordByEventId` | inferred | 36147 | v0.2.0 |
| `cf` | `recordOutboxDeliveryAttempt` | inferred | 36155 | v0.2.0 |
| `nq` | `resolveOutboxByEventIndexPath` | inferred | 36179 | v0.2.0 |
| `Oce` | `resolveOutboxSentIdsPath` | inferred | 36183 | v0.2.0 |
| `set` | `loadOutboxByEventIndex` | inferred | 36196 | v0.2.0 |
| `aet` | `appendOutboxByEventIndexEntry` | inferred | 36213 | v0.2.0 |
| `lh` | `recordOutboxSentId` | inferred | 36243 | v0.2.0 |
| `mI` | `resolveOutboxReplayDir` | inferred | 36249 | v0.3.0 |
| `ws` | `resolveOutboxReplayFilePath` | inferred | 36257 |  |
| `rq` | `resolveOutboxByIdIndexPath` | inferred | 36268 | v0.3.0 |
| `ia` | `lookupOutboxByIdIndexEntry` | inferred | 36320 |  |
| `met` | `ensureOutboxRecordInReplay` | inferred | 36373 | v0.3.0 |
| `hI` | `backfillOutboxByIdIndexFromReplay` | inferred | 36545 | v0.3.0 |
| `ic` | `resolveOutboxPendingQueuePath` | inferred | 36581 | v0.3.1 |
| `yet` | `hasUnqueuedPendingOutboxRecords` | inferred | 36631 | v0.3.1 |
| `Vce` | `listRetryableOutboxRecords` | inferred | 36700 | v0.3.1 |
| `jo` | `initOutboxStoreModule` | inferred | 36718 | v0.3.1 |
| `rde` | `listVoidChannelSessions` | inferred | 36969 | v0.8.4 |
| `wI` | `writeVoidSessionOutboxRecord` | inferred | 36981 | v0.8.4 |
| `Lbe` | `updateDeliveryCursorFile` | inferred | 64399 | v0.5.6 |
| `zbe` | `resolveDeliveryCursorPath` | inferred | 64420 | v0.2.0 |
| `Ube` | `readDeliveryCursorFile` | inferred | 64432 | v0.2.0 |
| `L6` | `advanceOptimisticDeliveryCursor` | inferred | 64475 | v0.3.0 |
| `Yw` | `readOutboxRecordsPastCursor` | inferred | 64575 | v0.2.0 |
| `Vbe` | `replayOutboxBacklogToSubscriber` | inferred | 64633 | v0.2.0 |
| `tO` | `readLatestDeliveryCursorUpdate` | inferred | 64719 |  |
| `Gf` | `hasNonEmptyDisplayName` | inferred | 64851 | v0.5.4 |
| `Nlt` | `filterDeliverableSessions` | inferred | 64886 | v0.8.4 |
| `As` | `deliverRouteEventToSession` | inferred | 65039 | v0.8.0 |
| `JO` | `DAEMON_TOKEN_ENV_KEY` | __export | 69212 |  |
| `Jce` | `lookupInjectionPrompt` | inferred | 87436 | v0.5.7 |
| `cde` | `readRoutingTarget` | inferred | 87475 | v0.2.0 |
| `hde` | `canonicalizeGatewayCommand` | inferred | 87488 | v0.2.0 |
| `xI` | `parseInjectionPromptCommand` | inferred | 87501 | v0.5.7 |
| `gde` | `expandInjectionPromptCommand` | inferred | 87517 | v0.5.7 |
| `tv` | `parseGatewayCommandText` | inferred | 87526 | v0.2.0 |
| `mq` | `classifyGatewayCommandIntent` | inferred | 87542 | v0.2.0 |
| `Met` | `resolveRoutingTarget` | inferred | 87555 | v0.2.0 |
| `yde` | `ingestChannelMessage` | inferred | 87561 | v0.2.0 |
| `rv` | `ingestChannelCommand` | inferred | 87586 | v0.2.0 |
| `_de` | `appendBeforeExecuteGateway` | inferred | 87614 | v0.2.0 |
| `bde` | `probeEventsAppendable` | inferred | 87765 | v0.2.0 |
| `jet` | `replyToGatewayCommandEvent` | inferred | 87780 | v0.2.0 |
| `qet` | `executeGatewayCommand` | inferred | 87903 | v0.2.0 |
| `Bet` | `writeIngressSnapshot` | inferred | 88211 | v0.2.0 |
| `Sve` | `saveChannelUploadToInbox` | inferred | 88276 | v0.2.0 |
| `kve` | `readFileAsBase64` | inferred | 88300 | v0.2.0 |
| `dct` | `sanitizeUploadFileName` | inferred | 88304 | v0.2.0 |
| `lH` | `createSessionSubscriptionRegistry` | inferred | 89066 | v0.2.0 |
| `zc` | `MemoryReadRpcError` | inferred | 89493 |  |
| `nke` | `readMemoryFileForRpc` | inferred | 89499 | v0.8.4 |
| `ep` | `SpineRpcParamsError` | inferred | 90396 |  |
| `Ike` | `runSpineCatRpc` | inferred | 90439 | v0.8.4 |
| `Tt` | `JsonRpcInvalidParamsError` | inferred | 90520 | v0.2.0 |
| `gIe` | `bindSessionSourceChannel` | inferred | 90523 |  |
| `yIe` | `assertWsChannelIdentityParams` | inferred | 90532 | v0.2.0 |
| `OG` | `normalizeReturnMask` | inferred | 90664 | v0.2.0 |
| `evt` | `normalizeChannelCapabilityDeclarations` | inferred | 90694 | v0.3.3 |
| `tvt` | `recordChannelCapabilityDeclaration` | inferred | 90704 | v0.2.0 |
| `cp` | `resolveExistingDirRealpath` | inferred | 90739 | v0.2.0 |
| `EIe` | `ensureAbsoluteWorkspaceDir` | inferred | 90749 | v0.2.0 |
| `_Ie` | `resolveIngressWorkspace` | inferred | 90756 | v0.2.0 |
| `ovt` | `describeChannelInstance` | inferred | 90824 | v0.5.0 |
| `svt` | `archiveSessionIfQuiescent` | inferred | 90888 | v0.5.0 |
| `RIe` | `refreshSessionIndexEntry` | inferred | 90961 |  |
| `avt` | `setSessionAliasAndReindex` | inferred | 90965 | v0.5.4 |
| `uvt` | `resolveSessionByExactKey` | inferred | 90982 | v0.8.4 |
| `dp` | `resolveSessionByKeyOrAlias` | inferred | 90994 | v0.5.4 |
| `lvt` | `scheduleSessionWakeRecord` | inferred | 91023 | v0.8.2 |
| `TIe` | `deliverExternalSessionNotify` | inferred | 91083 | v0.5.4 |
| `cvt` | `replayIdempotentSessionNotify` | inferred | 91223 | v0.8.4 |
| `fvt` | `readOrSetSessionModel` | inferred | 91273 | v0.8.0 |
| `pvt` | `readOrSetSessionEffort` | inferred | 91303 | v0.8.0 |
| `mvt` | `enqueueSessionCompactCommand` | inferred | 91333 | v0.5.8 |
| `PIe` | `checkChannelRuntimeRebindConflict` | inferred | 91444 | v0.8.3 |
| `gvt` | `applySessionConfigVerb` | inferred | 91453 | v0.5.10 |
| `wvt` | `upsertChannelSpawnDescriptor` | inferred | 91919 | v0.5.0 |
| `xvt` | `isLoopbackBindHost` | __export | 92048 | v0.7.0 |
| `Evt` | `resolveRemoteListenerConfig` | __export | 92055 | v0.7.0 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Jd` | `moveFileIntoDirectory` | inferred | 32340 | v0.5.6 |
| `Do` | `hashSessionKey` | inferred | 32360 | v0.2.0 |
| `Yn` | `resolveSessionDir` | inferred | 32364 | v0.2.0 |
| `oYe` | `resolveSessionsArchiveRoot` | inferred | 32368 | v0.4.5 |
| `zm` | `resolveArchivedSessionDir` | inferred | 32372 |  |
| `Qs` | `isSessionArchived` | inferred | 32376 |  |
| `Tb` | `resolveSessionInboxDir` | inferred | 32380 | v0.2.0 |
| `zR` | `resolveSessionMailboxMarkdownPath` | inferred | 32384 | v0.2.0 |
| `Tae` | `resolveSessionMailboxDir` | inferred | 32388 |  |
| `Gd` | `resolveSessionMailboxPendingDir` | inferred | 32392 | v0.3.1 |
| `Pb` | `resolveSessionMailboxNotesPath` | inferred | 32396 | v0.3.1 |
| `La` | `resolveSessionMetaPath` | inferred | 32400 | v0.2.0 |
| `ys` | `resolveSessionStatePath` | inferred | 32404 | v0.2.0 |
| `$b` | `listPendingInboxFiles` | inferred | 32414 | v0.5.6 |
| `Cb` | `probeSessionPendingWork` | inferred | 32429 | v0.6.0 |
| `Pae` | `rehydrateSessionState` | inferred | 32443 | v0.4.0 |
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
| `Dae` | `removeOrphanMailboxItemFiles` | inferred | 32771 | v0.4.2 |
| `Db` | `appendSessionMailboxNote` | inferred | 32798 | v0.3.1 |
| `WR` | `renderSessionMailboxFile` | inferred | 32808 | v0.3.1 |
| `eh` | `notifySessionFileChanged` | inferred | 35572 |  |
| `sf` | `stripUndefinedFieldsDeep` | inferred | 35592 | v0.2.0 |
| `th` | `ensureSessionDescriptorAndStateFiles` | inferred | 35600 | v0.2.0 |
| `na` | `readSessionMetaFile` | inferred | 35631 | v0.5.4 |
| `Sce` | `updateSessionDisplayName` | inferred | 35640 | v0.2.0 |
| `rt` | `readSessionRuntimeState` | inferred | 35664 | v0.2.0 |
| `nh` | `readAllSessionStateFiles` | inferred | 35672 | v0.4.0 |
| `et` | `patchSessionRuntimeState` | inferred | 35690 | v0.2.0 |
| `af` | `mutateSessionRuntimeState` | inferred | 35727 | v0.5.0 |
| `ra` | `clearSessionRuntimeStateField` | inferred | 35763 | v0.5.0 |
| `_n` | `classifySessionKeyKind` | inferred | 36840 | v0.5.0 |
| `uq` | `isUserVisibleSessionKey` | inferred | 36844 |  |
| `ch` | `buildSessionIndexFromDisk` | inferred | 36847 | v0.5.0 |
| `Qce` | `createEmptySessionIndex` | inferred | 36857 |  |
| `ede` | `buildSessionIndexEntry` | inferred | 36861 | v0.5.0 |
| `tde` | `createMapBackedSessionIndex` | inferred | 36885 | v0.5.0 |
| `dh` | `resolveSessionChannelRuntime` | inferred | 36944 | v0.8.4 |
| `Gu` | `isVoidRuntimeSession` | inferred | 36952 | v0.8.4 |
| `df` | `initVoidRuntimeModule` | inferred | 36998 |  |
| `dq` | `readAllSessionSummaries` | __export | 37150 | v0.2.0 |
| `V$` | `initCallerSessionEnvModule` | inferred | 55016 |  |
| `oC` | `issueWorkerToolContextToken` | inferred | 55858 | v0.8.0 |
| `ebe` | `assertJobWorkspaceUsable` | inferred | 61458 | v0.5.5 |
| `sbe` | `extractJobSdkConfig` | inferred | 61595 | v0.6.2 |
| `oO` | `listSessionIndexSummaries` | inferred | 64867 | v0.5.4 |
| `Qbe` | `formatViewSessionsListLine` | inferred | 64905 | v0.8.2 |
| `Dg` | `runViewSessionsTool` | inferred | 64942 | v0.8.2 |
| `eS` | `initViewSessionsToolModule` | inferred | 64954 | v0.8.2 |
| `ywe` | `archiveSessionDirUnlessAlreadyArchiving` | inferred | 66139 | v0.5.6 |
| `_we` | `archiveSessionAndArtifacts` | inferred | 66155 | v0.5.0 |
| `mwe` | `readStateSourceChannelId` | inferred | 66296 | v0.5.0 |
| `gwe` | `listArchivedCopiesNewestFirst` | inferred | 66317 | v0.5.0 |
| `Yke` | `archiveLegacyRegistrySessionsDir` | __export | 69663 | v0.5.0 |
| `rxe` | `extractUrlHost` | inferred | 69945 |  |
| `lxe` | `acquireSessionDrainLock` | inferred | 70163 | v0.2.0 |
| `cxe` | `refreshSessionDrainLockHeartbeat` | inferred | 70186 | v0.2.0 |
| `dxe` | `releaseSessionDrainLock` | inferred | 70191 | v0.2.0 |
| `EW` | `resolveSessionDrainLockPath` | inferred | 70203 | v0.2.0 |
| `fxe` | `readDrainLockFile` | inferred | 70206 | v0.2.0 |
| `Bxe` | `drainSessionMailbox` | inferred | 70663 | v0.2.0 |
| `no` | `classifySessionKeyOrUnknown` | inferred | 71747 | v0.3.0 |
| `Bmt` | `clearPendingGatewayNotice` | inferred | 72079 | v0.2.0 |
| `Vmt` | `setPendingInterruptedContext` | inferred | 72082 | v0.2.0 |
| `Hmt` | `clearPendingInterruptedContext` | inferred | 72088 | v0.2.0 |
| `Wmt` | `clearPendingSkipRewind` | inferred | 72091 | v0.2.0 |
| `Zg` | `buildSessionInfoFromState` | inferred | 72635 | v0.2.0 |
| `yht` | `classifySessionPlane` | inferred | 72680 | v0.2.0 |
| `uEe` | `requestPiWorkerCatalog` | inferred | 72986 | v0.8.0 |
| `CS` | `resolvePiAgentDir` | inferred | 73449 | v0.8.0 |
| `OS` | `readPiAgentSettings` | inferred | 73453 | v0.8.0 |
| `fEe` | `selectInstructionsFingerprint` | inferred | 73479 |  |
| `BW` | `canonicalizeJsonValue` | inferred | 73483 | v0.8.0 |
| `pEe` | `buildPiConfigSignature` | inferred | 73492 | v0.8.0 |
| `aRe` | `stringifyExecutionToolInput` | inferred | 80534 | v0.2.0 |
| `uRe` | `computeStreamEventDedupKey` | inferred | 80544 | v0.2.0 |
| `lRe` | `buildSessionExecutionPayload` | inferred | 80548 | v0.2.0 |
| `uk` | `channelKindFromSessionKey` | inferred | 80578 | v0.2.0 |
| `fRe` | `listDefaultClaudeToolNames` | inferred | 80591 | v0.2.0 |
| `uG` | `inferActorOriginFromSessionKey` | inferred | 80595 | v0.4.0 |
| `pRe` | `classifySessionPoolKind` | inferred | 80607 | v0.2.0 |
| `mRe` | `isAvailableWorkspacePath` | inferred | 80611 | v0.2.0 |
| `wy` | `SESSION_SCHEMA_VERSION` | __export | 80619 |  |
| `hRe` | `createJobSessionFinalizer` | inferred | 80624 | v0.8.0 |
| `mk` | `computeInstructionsFingerprint` | __export | 82696 | v0.4.5 |
| `kG` | `computeNonBoardInstructionsFingerprint` | __export | 82705 |  |
| `kN` | `diffStreamingConfigSignature` | __export | 82712 | v0.5.10 |
| `VRe` | `computeMissionFingerprint` | __export | 82745 |  |
| `xN` | `runInstructionsFingerprintGuard` | __export | 82750 | v0.4.5 |
| `HRe` | `collectInstructionsInputs` | inferred | 82897 | v0.5.1 |
| `hk` | `initInstructionsFingerprintModule` | inferred | 82932 |  |
| `xG` | `narrowToModelSettableAdapter` | inferred | 82945 | v0.8.0 |
| `EG` | `computeStreamingConfigSignature` | inferred | 82949 | v0.8.0 |
| `EN` | `readLiveStreamContextToken` | inferred | 82967 | v0.8.0 |
| `RG` | `isLiveStreamRebuildRequired` | inferred | 82977 | v0.8.0 |
| `RN` | `flagStreamRecreationOnModelReject` | inferred | 82983 | v0.8.0 |
| `JRe` | `createModelCommandResolvers` | inferred | 83001 | v0.8.0 |
| `fbt` | `recordPendingInterruptMarker` | inferred | 83139 | v0.8.2 |
| `YRe` | `prependPendingInterruptMarker` | inferred | 83161 | v0.8.2 |
| `PN` | `interruptActorQuery` | inferred | 83182 | v0.8.0 |
| `IG` | `triggerDeferredPreempt` | inferred | 83186 | v0.8.0 |
| `gk` | `requestBoundaryAwarePreempt` | inferred | 83195 | v0.8.0 |
| `XRe` | `snapshotInflightEventIds` | inferred | 83204 | v0.8.0 |
| `lp` | `teardownStreamingSession` | inferred | 83209 | v0.8.0 |
| `TG` | `waitForWakeOrIdleTimeout` | inferred | 83224 | v0.8.0 |
| `$N` | `shutdownActorRuntimeAdapter` | inferred | 83238 | v0.8.0 |
| `tIe` | `memoizeAvailabilityProbeUntilOk` | inferred | 84003 |  |
| `vbt` | `createSessionManager` | __export | 84010 | v0.2.0 |
| `Abt` | `createMetaSession` | __export | 86216 | v0.2.0 |
| `Nbt` | `sweepTombstonedSessionRecords` | __export | 86802 | v0.5.6 |
| `bwe` | `createIdleCompactSweeper` | inferred | 88907 | v0.5.10 |
| `MG` | `resolvePreemptFromCommandText` | inferred | 90676 | v0.2.0 |
| `rvt` | `classifySessionPlaneByKey` | inferred | 90732 | v0.2.0 |
| `IIe` | `resolveIsolatedPlaneKind` | inferred | 91019 |  |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `xw` | `resolveMetaPromptText` | __export | 55385 | v0.2.0 |
| `wot` | `renderJobAcceptanceBlock` | inferred | 55396 | v0.8.0 |
| `tye` | `renderJobMissionBlock` | __export | 55402 | v0.4.5 |
| `nye` | `renderPromptLayers` | __export | 55409 | v0.7.1 |
| `hg` | `buildSystemPromptForChannelConfig` | __export | 55436 | v0.2.0 |
| `dbe` | `extractSystemPromptAppend` | __export | 62245 | v0.4.4 |
| `cwe` | `decideRestartHintInjection` | inferred | 66094 | v0.5.2 |
| `dwe` | `renderDaemonRestartHint` | inferred | 66123 |  |
| `hA` | `formatLocalTimestampWithZone` | inferred | 70427 | v0.5.0 |
| `wxe` | `decideBoardUpdatedInjection` | inferred | 70450 | v0.5.10 |
| `Sxe` | `renderBoardUpdatedHint` | inferred | 70474 |  |
| `Uxe` | `projectJobPromptContext` | inferred | 70529 | v0.8.0 |
| `Ut` | `escapeXmlText` | inferred | 71728 | v0.2.0 |
| `Omt` | `renderJobCompleteReceiptGuidance` | inferred | 71751 | v0.4.0 |
| `_A` | `renderMailboxEventPrompt` | inferred | 71794 | v0.2.0 |
| `Dmt` | `renderSkipRewindBlock` | inferred | 71877 | v0.2.0 |
| `jmt` | `resolvePendingCompactNotice` | inferred | 71891 | v0.5.10 |
| `Lmt` | `renderSmartCompactNoticeBlock` | inferred | 71914 | v0.5.10 |
| `Hxe` | `formatElapsedDuration` | inferred | 71923 | v0.3.0 |
| `Wxe` | `computeTimeGapContext` | inferred | 71934 | v0.8.0 |
| `Fmt` | `renderTimeGapContextBlock` | inferred | 71943 | v0.3.0 |
| `Umt` | `renderJobTickBlock` | inferred | 71957 | v0.4.5 |
| `Jxe` | `buildTransientUserBlocks` | inferred | 71971 | v0.2.0 |
| `FRe` | `transcludeBroadcastBoard` | inferred | 82545 | v0.5.2 |
| `nbt` | `renderTranscludedFiles` | inferred | 82553 | v0.5.2 |
| `zRe` | `resolveBoardIncludes` | inferred | 82560 | v0.5.2 |
| `ibt` | `realpathOrSelf` | inferred | 82594 |  |
| `DRe` | `normalizeIncludePathKey` | inferred | 82602 | v0.5.2 |
| `obt` | `stripBoardIncludeFrontmatter` | inferred | 82607 | v0.5.2 |
| `sbt` | `parseBoardFileContent` | inferred | 82615 | v0.5.2 |
| `abt` | `stripBoardHtmlComments` | inferred | 82626 | v0.5.2 |
| `ubt` | `collectBoardIncludePaths` | inferred | 82643 | v0.5.2 |
| `lbt` | `normalizeBoardIncludeToken` | inferred | 82672 |  |
| `cbt` | `isBoardIncludePathCandidate` | inferred | 82678 | v0.5.2 |
| `dbt` | `resolveBoardIncludePath` | inferred | 82682 | v0.5.2 |
| `URe` | `initBoardTransclusionModule` | inferred | 82685 | v0.5.2 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `cq` | `detectInProcessBreak` | __export | 37028 | v0.5.10 |
| `Za` | `drainRecordPath` | __export | 37040 | v0.2.0 |
| `ff` | `appendDrainRecord` | __export | 37043 | v0.2.0 |
| `fh` | `readDrainRecords` | __export | 37062 |  |
| `kI` | `createEmptyUsageSummary` | inferred | 37068 | v0.8.2 |
| `sde` | `accumulateDrainRecordIntoSummary` | inferred | 37128 | v0.2.0 |
| `ev` | `summarizeDrainRecords` | __export | 37140 |  |
| `ade` | `aggregateSessionDrainSummary` | inferred | 37145 |  |
| `fq` | `readGlobalUsageTotals` | __export | 37167 | v0.4.4 |
| `Aet` | `readRecentDrainRecords` | __export | 37184 | v0.2.0 |
| `ide` | `IN_PROCESS_BREAK_HIT_RATIO_FLOOR` | __export | 37201 |  |
| `B$` | `runSkipTool` | inferred | 54982 | v0.2.0 |
| `el` | `initSkipToolModule` | inferred | 55006 | v0.2.0 |
| `mg` | `isAbortLikeError` | __export | 55284 | v0.2.0 |
| `Tg` | `selectInterruptMarkerText` | inferred | 62100 |  |
| `Pg` | `normalizeTurnAbortReason` | inferred | 62104 | v0.8.2 |
| `Uw` | `initInterruptMarkerTextModule` | inferred | 62107 |  |
| `cbe` | `computeCodexTurnUsage` | __export | 62221 | v0.5.6 |
| `gxe` | `normalizeInputTokenTotals` | inferred | 70390 | v0.5.6 |
| `yxe` | `computeCacheHitRate` | inferred | 70406 | v0.5.6 |
| `$W` | `addToNumericField` | inferred | 70486 |  |
| `Io` | `runTimedDrainPhase` | inferred | 70494 |  |
| `Rxe` | `resolveTurnModelWithLayer` | inferred | 70539 | v0.8.1 |
| `Ixe` | `resolveTurnEffortWithLayer` | inferred | 70552 | v0.8.1 |
| `Pxe` | `extractServedModelFromUsage` | inferred | 70568 | v0.8.1 |
| `yA` | `isChannelMessageEvent` | inferred | 70573 | v0.8.1 |
| `DW` | `prepareDrainTurnContext` | inferred | 70576 | v0.3.7 |
| `qxe` | `buildTurnSdkRunConfig` | inferred | 70628 | v0.2.0 |
| `$xe` | `resolveDrainContextProfileOrRefuse` | inferred | 70644 | v0.7.0 |
| `to` | `isNonNullObject` | inferred | 71662 | v0.2.0 |
| `on` | `readStringProperty` | inferred | 71666 | v0.2.0 |
| `PW` | `readNonNegativeNumberField` | inferred | 71671 | v0.5.10 |
| `MW` | `extractPayloadMediaRefs` | inferred | 71677 | v0.2.0 |
| `qmt` | `mergeInterruptedContextTexts` | inferred | 72073 | v0.2.0 |
| `Jmt` | `hasSkipRewindRecordSince` | inferred | 72094 | v0.5.6 |
| `Oxe` | `markTurnSkippedFromSkipRecord` | inferred | 72100 | v0.8.0 |
| `gA` | `clearPendingOutboundAttachments` | inferred | 72103 | v0.2.0 |
| `jW` | `readPendingOutboundAttachments` | inferred | 72106 | v0.2.0 |
| `LW` | `batchDrainItems` | inferred | 72110 | v0.2.0 |
| `Gxe` | `loadDrainItemEventCached` | inferred | 72147 | v0.2.0 |
| `Axe` | `parseEventTimestampMs` | inferred | 72159 | v0.2.0 |
| `Zmt` | `isMergeableDrainBatch` | inferred | 72165 | v0.8.1 |
| `Kmt` | `isMergeableChannelMessageBatch` | inferred | 72169 | v0.2.0 |
| `Zxe` | `hasUniformDrainCoalesceKey` | inferred | 72177 | v0.5.5 |
| `Kxe` | `isWorkerTaskNotifyDelivery` | inferred | 72183 | v0.5.5 |
| `Yxe` | `extractJobCompletePayload` | inferred | 72191 | v0.8.0 |
| `Xxe` | `extractJobCompletionJobId` | inferred | 72197 | v0.8.0 |
| `Nxe` | `classifyDrainBatchClass` | inferred | 72204 |  |
| `Xmt` | `computeDrainCoalesceKey` | inferred | 72212 | v0.2.0 |
| `Qmt` | `resolveEventSourceChannelId` | inferred | 72220 | v0.2.0 |
| `tht` | `collectJobCompletionReceipts` | inferred | 72246 | v0.8.1 |
| `nht` | `renderCoalescedDrainPrompt` | inferred | 72274 | v0.8.1 |
| `eEe` | `createDrainExecutionEventRecorder` | inferred | 72286 | v0.2.0 |
| `Dxe` | `renderTurnOutputText` | inferred | 72342 | v0.2.0 |
| `iht` | `renderManualCompactNotice` | inferred | 72346 | v0.5.5 |
| `oht` | `isStaleIdleCompactEvent` | inferred | 72352 | v0.5.10 |
| `Mxe` | `countCompactGapIntervals` | inferred | 72357 | v0.5.10 |
| `jxe` | `buildCompactStatsRecord` | inferred | 72381 | v0.5.10 |
| `uht` | `recordIdleCompactFireMetric` | inferred | 72414 | v0.5.10 |
| `lht` | `runHistoryControlCommand` | inferred | 72422 | v0.5.2 |
| `tEe` | `resolveReplyTargetSessionKeys` | inferred | 72444 | v0.2.0 |
| `qc` | `emitDrainOutputRecords` | inferred | 72456 | v0.2.0 |
| `cht` | `renderDrainErrorRuntimeHint` | inferred | 72513 | v0.5.6 |
| `TS` | `handleDrainError` | inferred | 72540 | v0.5.0 |
| `dht` | `clearModelOverrideOnRuntimeFlip` | inferred | 72596 | v0.5.6 |
| `fht` | `resolvePendingModelFork` | inferred | 72613 | v0.5.6 |
| `pht` | `describeWorkspaceProblem` | inferred | 72652 | v0.2.0 |
| `mht` | `renderWorkspaceUnavailableNotice` | inferred | 72656 | v0.2.0 |
| `hht` | `renderRuntimeUnavailableGuidance` | inferred | 72661 | v0.5.4 |
| `ght` | `renderRuntimeMismatchGuidance` | inferred | 72669 | v0.8.3 |
| `Lxe` | `runDrainQueryAndCollectOutboundAttachments` | inferred | 72695 | v0.5.0 |
| `nEe` | `mergeOutboundAttachmentLists` | inferred | 72776 | v0.5.0 |
| `Sht` | `runDrainTurnWithResumeFallback` | inferred | 72786 | v0.2.0 |
| `PS` | `initMailboxDrainRunnerModule` | inferred | 72918 | v0.2.0 |
| `Yg` | `runQueueOutboundAttachmentTool` | inferred | 73578 | v0.2.0 |
| `AS` | `initQueueOutboundAttachmentModule` | inferred | 73609 | v0.2.0 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Df` | `hasParentToolUseId` | inferred | 55021 | v0.5.7 |
| `dg` | `createAbortErrorWithCause` | inferred | 55027 | v0.2.0 |
| `H$` | `extractSdkMessageTextChunks` | inferred | 55032 | v0.3.0 |
| `W$` | `extractStreamTextDeltas` | inferred | 55065 | v0.3.0 |
| `J$` | `extractStreamThinkingText` | inferred | 55093 | v0.3.0 |
| `G$` | `parseToolUseBlockStart` | inferred | 55115 | v0.3.2 |
| `Z$` | `parseInputJsonDelta` | inferred | 55130 | v0.3.2 |
| `K$` | `stringifyToolResultContent` | inferred | 55143 | v0.3.0 |
| `pot` | `selectDominantModelByInputTokens` | inferred | 55154 | v0.5.6 |
| `fg` | `mapClaudeResultToDrainUsage` | inferred | 55179 | v0.3.0 |
| `Y$` | `resolveClaudeCostBaseline` | inferred | 55202 | v0.8.4 |
| `X$` | `buildClaudeCostBaseline` | inferred | 55211 | v0.8.4 |
| `Kge` | `findDeadAllowedToolEntries` | __export | 55261 | v0.5.10 |
| `Yge` | `splitDisallowedToolsForClaude` | __export | 55266 | v0.5.10 |
| `ww` | `isAgentSdkTurnInterruptedError` | __export | 55276 |  |
| `Sw` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 55280 |  |
| `vw` | `normalizeOptionalEnvString` | inferred | 55297 | v0.8.0 |
| `Qge` | `probeClaudeAvailability` | __export | 55306 | v0.5.3 |
| `_V` | `isClaudeAvailable` | __export | 55336 |  |
| `kw` | `claudeUnavailableReason` | __export | 55340 | v0.5.3 |
| `_ot` | `primeClaudeAvailability` | __export | 55343 |  |
| `bot` | `__resetClaudeProbeCacheForTest` | __export | 55347 |  |
| `vot` | `__setClaudeVerifierForTest` | __export | 55351 |  |
| `eye` | `verifyClaudeCodeRuntimeAvailable` | __export | 55355 | v0.5.0 |
| `bV` | `eventToMessageGenerator` | __export | 55474 | v0.2.0 |
| `eC` | `stringToMessageGenerator` | __export | 55502 | v0.2.0 |
| `hV` | `parsePositiveMsEnv` | __export | 55512 | v0.5.8 |
| `Rot` | `disableSystemPromptSnapshot` | inferred | 55518 | v0.8.1 |
| `jf` | `createAgentSdkAdapter` | __export | 55529 | v0.5.10 |
| `Cr` | `AgentSdkPromptNotAcceptedAbortError` | __export | 55834 |  |
| `Ur` | `AgentSdkTurnInterruptedError` | __export | 55834 |  |
| `pg` | `CLAUDE_CORE_TOOLS` | __export | 55834 |  |
| `ko` | `initAgentSdkAdapterModule` | inferred | 55834 | v0.5.10 |
| `oct` | `buildClaudeSettingsEnvOverrides` | inferred | 65616 | v0.7.0 |
| `vve` | `materializeClaudeSettingsFile` | inferred | 65669 | v0.7.0 |
| `sS` | `computeContextProfileSignature` | inferred | 65680 | v0.7.0 |
| `aS` | `initMaterializedClaudeSettingsModule` | inferred | 65692 | v0.7.0 |
| `xve` | `mergeClaudeToolLists` | inferred | 65724 |  |
| `K6` | `applyJobSdkConfigOverride` | inferred | 65854 | v0.6.2 |
| `YSe` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 69143 | v0.5.1 |
| `KH` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 69212 |  |
| `tp` | `resolveContextCapToken` | inferred | 69898 | v0.7.0 |
| `aA` | `describeContextProfileSource` | inferred | 69908 | v0.7.0 |
| `uA` | `extractProfiledEndpointFields` | inferred | 69922 | v0.7.0 |
| `lA` | `listSortedAliasKeys` | inferred | 69953 | v0.7.0 |
| `exe` | `buildProfiledExternalRequirement` | inferred | 69962 | v0.7.0 |
| `SW` | `classifyModelContextRequirement` | inferred | 69992 | v0.7.0 |
| `Wg` | `selectProfileIssuesForModel` | inferred | 70018 | v0.7.0 |
| `Jg` | `resolveClaudeContextRequirement` | inferred | 70134 | v0.7.0 |
| `IS` | `isClaudeRuntimeOrDefault` | inferred | 70228 |  |
| `fA` | `prepareClaudeContextProfile` | inferred | 70231 | v0.7.0 |
| `Exe` | `resolveAdditionalDirClaudeMdAutoload` | inferred | 70523 | v0.5.2 |
| `by` | `createAladuoMcpServer` | inferred | 80266 | v0.2.0 |
| `KRe` | `initAbortableAsyncQueueModule` | inferred | 83099 | v0.3.0 |
| `QRe` | `createClaudeStreamingSessionFactory` | inferred | 83257 | v0.8.0 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `R6` | `buildCodexDirectOnlyToolConfig` | inferred | 62144 |  |
| `Wf` | `isCodexAvailable` | __export | 62150 |  |
| `Rut` | `codexUnavailableReason` | __export | 62154 | v0.2.0 |
| `Iut` | `primeCodexAvailability` | __export | 62157 | v0.5.0 |
| `Tut` | `__setCodexAvailabilityForTests` | __export | 62162 |  |
| `$g` | `resolveCodexSandbox` | __export | 62166 | v0.4.4 |
| `Oc` | `checkCodexAvailability` | __export | 62170 | v0.4.4 |
| `$6` | `ensureAgentsMdSymlink` | __export | 62207 | v0.4.4 |
| `lbe` | `codexNotificationFilterDecision` | __export | 62217 | v0.5.4 |
| `fbe` | `buildBaseInstructions` | __export | 62249 | v0.4.4 |
| `pbe` | `buildDeveloperInstructions` | __export | 62267 | v0.4.4 |
| `I6` | `buildCodexTurnInput` | __export | 62281 | v0.7.0 |
| `Bw` | `createCodexAppServerAdapter` | __export | 62294 | v0.4.4 |
| `$ut` | `resolveCodexSandboxForPermissionMode` | inferred | 62756 | v0.4.4 |
| `qw` | `isCodexPlainObject` | inferred | 62769 | v0.5.0 |
| `mbe` | `isImageGenerationItemType` | inferred | 62773 | v0.5.0 |
| `hbe` | `hasImageGenerationRecord` | __export | 62780 | v0.5.7 |
| `gbe` | `extractCodexGeneratedImageAttachment` | __export | 62796 | v0.5.0 |
| `ybe` | `capitalizeFirstChar` | inferred | 62824 | v0.6.0 |
| `_be` | `warnUnmappedCodexItemOnce` | inferred | 62847 | v0.6.0 |
| `bbe` | `mapItemStartedToExecEvent` | __export | 62855 | v0.4.4 |
| `vbe` | `mapItemCompletedToExecEvent` | __export | 62966 | v0.4.4 |
| `VC` | `ALADUO_TOOL_NAMESPACE` | __export | 63039 |  |
| `Jf` | `initCodexAppServerModule` | inferred | 63039 | v0.5.3 |
| `tmt` | `generatePartitionCodexAgents` | __export | 69537 | v0.5.3 |
| `Jke` | `parseAgentMarkdown` | __export | 69611 | v0.5.3 |
| `Gke` | `renderAgentToml` | __export | 69626 | v0.5.3 |
| `fmt` | `generateAllPartitionCodexAgents` | inferred | 69845 | v0.5.3 |
| `vy` | `buildCodexStringInputSchema` | inferred | 80393 | v0.4.4 |
| `pN` | `buildCodexDynamicTools` | inferred | 80413 | v0.4.4 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `_I` | `containsWhitespaceChar` | inferred | 36824 |  |
| `bI` | `isProviderQualifiedModelId` | inferred | 36828 | v0.8.0 |
| `gV` | `PARTITION_CORE_TOOLS` | __export | 55834 |  |
| `jw` | `parseScheduleDurationMs` | inferred | 61308 | v0.6.1 |
| `_6` | `assertScheduleDurationRepresentable` | inferred | 61319 | v0.6.1 |
| `FC` | `isOneShotJobSchedule` | inferred | 61323 | v0.4.5 |
| `G_e` | `validateJobScheduleExpression` | inferred | 61327 | v0.6.1 |
| `Lw` | `parseJobRearmTime` | inferred | 61344 | v0.5.6 |
| `Z_e` | `isJobScheduleDue` | inferred | 61356 | v0.5.6 |
| `K_e` | `isPathWithinDir` | inferred | 61412 | v0.8.5 |
| `fut` | `normalizeJobCwdRelText` | inferred | 61423 | v0.2.0 |
| `Q_e` | `resolveJobCwdRel` | inferred | 61427 | v0.2.0 |
| `tbe` | `resolveJobExecutionWorkspace` | inferred | 61467 | v0.2.0 |
| `nbe` | `prepareJobExecutionWorkspace` | inferred | 61484 | v0.2.0 |
| `$c` | `buildJobSessionKey` | inferred | 61534 | v0.2.0 |
| `ibe` | `parseJobFileFrontmatter` | inferred | 61556 | v0.2.0 |
| `_ut` | `renderJobFileMarkdown` | inferred | 61577 | v0.2.0 |
| `ol` | `initJobManagerModule` | inferred | 61641 | v0.2.0 |
| `Hf` | `redactJobModelProfileTokens` | inferred | 62080 |  |
| `JC` | `renderManageJobToolDescription` | inferred | 64052 |  |
| `GC` | `renderJobSessionToolDescription` | inferred | 64059 |  |
| `slt` | `renderJobPromptModeDescription` | inferred | 64070 | v0.8.0 |
| `alt` | `renderJobExtraToolsDescription` | inferred | 64077 | v0.8.0 |
| `Nbe` | `buildJobPromptModeExtraToolsSchema` | inferred | 64081 | v0.8.0 |
| `dlt` | `listSelectableJobRuntimes` | inferred | 64088 | v0.5.4 |
| `Mbe` | `buildJobRuntimeSchemaField` | inferred | 64097 | v0.5.4 |
| `ZC` | `buildManageJobInputSchema` | inferred | 64105 |  |
| `KC` | `buildJobSessionInputSchema` | inferred | 64114 |  |
| `Ag` | `runManageJobTool` | inferred | 64122 | v0.2.0 |
| `Gw` | `initManageJobToolModule` | inferred | 64261 | v0.8.0 |
| `Ybe` | `classifyConsumerStaleness` | inferred | 64744 | v0.8.2 |
| `q6` | `resolveNotifyUnconsumedHours` | inferred | 64757 | v0.8.2 |
| `B6` | `initNotifyConsumerStalenessModule` | inferred | 64763 | v0.8.2 |
| `Ng` | `evaluateNotifyConsumerRefusal` | inferred | 64771 | v0.8.2 |
| `Olt` | `listSessionsWithRecentConsumer` | inferred | 64794 | v0.8.2 |
| `rO` | `renderNotifyRefusalMessage` | inferred | 64820 | v0.8.2 |
| `Mg` | `runRemindDuoduoTool` | inferred | 64974 | v0.8.2 |
| `nS` | `initRemindDuoduoToolModule` | inferred | 65007 | v0.8.2 |
| `fO` | `normalizeNotifyChannelTarget` | inferred | 65020 | v0.8.0 |
| `mve` | `isJobSessionKeyKind` | inferred | 65214 | v0.2.0 |
| `hO` | `renderNotifyToolDescription` | inferred | 65248 | v0.2.0 |
| `gO` | `buildNotifyInputSchema` | inferred | 65267 | v0.2.0 |
| `hve` | `isOrphanJobSessionKey` | inferred | 65293 | v0.6.2 |
| `Zlt` | `computeBoundedEditDistance` | inferred | 65330 | v0.5.0 |
| `Klt` | `matchNearMissSessionKey` | inferred | 65349 | v0.5.0 |
| `lve` | `groupNotifyTargetCandidates` | inferred | 65391 | v0.5.0 |
| `cve` | `renderNotifyTargetCandidateLines` | inferred | 65409 | v0.5.0 |
| `Xlt` | `resolveJobOwnerNotifyTarget` | inferred | 65429 | v0.2.0 |
| `Qlt` | `resolveNotifyTargetSessionKey` | inferred | 65438 | v0.2.0 |
| `dve` | `renderNotifyDeliveryReport` | inferred | 65471 | v0.2.0 |
| `Lg` | `runNotifyTool` | inferred | 65485 | v0.2.0 |
| `oS` | `initNotifyToolModule` | inferred | 65587 | v0.2.0 |
| `hS` | `loadSubconsciousPartitions` | inferred | 66463 | v0.2.0 |
| `Gct` | `parsePartitionDefinition` | inferred | 66487 | v0.2.0 |
| `Fg` | `readPlaylistRound` | inferred | 66528 | v0.2.0 |
| `Zct` | `parsePlaylistCurrentRound` | inferred | 66546 | v0.2.0 |
| `IO` | `markPlaylistItemExecuted` | inferred | 66565 | v0.2.0 |
| `Pwe` | `rebuildPlaylistRound` | inferred | 66583 | v0.2.0 |
| `$we` | `readPartitionInboxEntries` | inferred | 66627 | v0.2.0 |
| `TO` | `initSubconsciousPlaylistModule` | inferred | 66670 | v0.2.0 |
| `Owe` | `resolvePartitionStatePath` | inferred | 66690 | v0.3.1 |
| `Yf` | `readPartitionRunState` | inferred | 66693 | v0.3.1 |
| `yH` | `writePartitionRunState` | inferred | 66716 |  |
| `_H` | `isPartitionBackedOff` | inferred | 66720 | v0.3.1 |
| `bH` | `computePartitionBackoffUntil` | inferred | 66724 | v0.3.1 |
| `PO` | `initPartitionRunStateModule` | inferred | 66736 | v0.3.1 |
| `qSe` | `resolveCadenceIntervalMs` | __export | 68844 | v0.8.0 |
| `Hpt` | `computeLegacyJobSessionKey` | inferred | 69336 | v0.8.0 |
| `Wpt` | `rewriteSessionKeyInStateAndMeta` | inferred | 69357 | v0.8.0 |
| `Lke` | `migrateLegacyJobSessionKeys` | inferred | 69391 | v0.8.0 |
| `qke` | `retireListedPartitions` | inferred | 69443 | v0.8.0 |
| `Ypt` | `retirePartitionOnce` | inferred | 69456 | v0.8.0 |
| `Bke` | `initPartitionRetirementModule` | inferred | 69508 | v0.8.0 |
| `dRe` | `isAutoArchivedJobSchedule` | inferred | 80583 | v0.4.0 |
| `lk` | `classifyJobScheduleType` | inferred | 80587 |  |
| `iIe` | `normalizePartitionOutputText` | inferred | 86094 | v0.2.0 |
| `Ebt` | `stringifyPartitionToolInput` | inferred | 86099 | v0.2.0 |
| `Ibt` | `detectEmptyRequiredPartitionOutput` | inferred | 86109 | v0.2.0 |
| `Tbt` | `appendPartitionToolEvent` | inferred | 86112 | v0.2.0 |
| `Pbt` | `hashActivityFingerprint` | inferred | 86151 | v0.2.0 |
| `$bt` | `readLatestExternalEventId` | inferred | 86154 | v0.5.3 |
| `CN` | `readNewestMtimeRecursive` | inferred | 86173 | v0.5.3 |
| `Cbt` | `renderPartitionRuntimeContext` | inferred | 86199 | v0.2.0 |
| `Obt` | `renderPartitionInboxSection` | inferred | 86206 | v0.5.3 |
| `sIe` | `initMetaSessionModule` | inferred | 86767 | v0.8.0 |
| `Dbt` | `runCadenceTick` | __export | 86862 | v0.2.0 |
| `$G` | `scanAndSpawnDueJobs` | __export | 86893 | v0.2.0 |
| `Mbt` | `fireDueWakeRecords` | inferred | 86984 | v0.8.2 |
| `Lbt` | `createJobScheduler` | __export | 87054 | v0.2.0 |
| `pIe` | `initJobSchedulerModule` | inferred | 87110 | v0.2.0 |
| `Fbt` | `isJobOrMetaOutboxRecord` | inferred | 87121 | v0.2.0 |
| `zbt` | `createOutboxDeliveryManager` | __export | 87125 | v0.2.0 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `mS` | `partitionInboxDir` | __export | 66448 |  |
| `Dc` | `partitionInboxDirFromVar` | __export | 66452 | v0.5.3 |
| `Ni` | `resolveMemoryDirs` | inferred | 66752 | v0.5.5 |
| `OO` | `bytesToKibCeil` | inferred | 66762 | v0.5.5 |
| `Xf` | `scanWikiLinkOccurrences` | inferred | 66766 | v0.5.5 |
| `Qf` | `resolveMemoryLinkTargets` | inferred | 66791 | v0.5.5 |
| `Ar` | `compareStringsAscending` | inferred | 66797 |  |
| `Awe` | `countDatedStampLines` | inferred | 66801 |  |
| `AO` | `countNewlineChars` | inferred | 66808 |  |
| `Jo` | `splitLinesDropTrailingEmpty` | inferred | 66815 | v0.5.5 |
| `Ro` | `recordUnreadableMemoryPath` | inferred | 66830 | v0.7.1 |
| `Tn` | `readMemoryFileSyncOrNull` | inferred | 66842 |  |
| `Mc` | `isMemoryPathFile` | inferred | 66850 | v0.5.5 |
| `Ug` | `isMemoryPathDirectory` | inferred | 66858 | v0.5.5 |
| `ou` | `listMarkdownSlugsSync` | inferred | 66866 | v0.5.5 |
| `NO` | `measureUtf8ByteLength` | inferred | 66878 | v0.5.5 |
| `jwe` | `normalizeSignalKindVersion` | inferred | 66886 | v0.5.6 |
| `Go` | `initMemorySignalKindsModule` | inferred | 66890 | v0.5.6 |
| `ndt` | `parseEffectivenessTrajectory` | inferred | 66909 | v0.5.5 |
| `rdt` | `parseEffectivenessCounts` | inferred | 66919 | v0.5.5 |
| `idt` | `parseUpdaterGuidanceVerdict` | inferred | 66938 | v0.5.5 |
| `odt` | `classifyTopicNodeFormat` | inferred | 66958 | v0.5.5 |
| `sdt` | `classifyTopicNodeType` | inferred | 66966 | v0.5.5 |
| `Lwe` | `rankEffectivenessTrajectory` | inferred | 66977 | v0.5.5 |
| `adt` | `compareBoardLintTargets` | inferred | 66990 | v0.5.5 |
| `Fwe` | `collectBoardLintReport` | inferred | 67041 | v0.5.5 |
| `fdt` | `buildBoardLintTarget` | inferred | 67074 | v0.5.5 |
| `pdt` | `runBoardLint` | inferred | 67105 | v0.5.5 |
| `zwe` | `initBoardLintModule` | inferred | 67127 | v0.5.5 |
| `xH` | `isSafeMemorySlug` | inferred | 67135 | v0.5.5 |
| `jc` | `createMemorySlugReader` | inferred | 67139 | v0.5.5 |
| `Lc` | `walkReachableMemory` | inferred | 67154 | v0.5.5 |
| `gdt` | `renderEntityConvergeSignalBody` | inferred | 67197 | v0.5.5 |
| `Vwe` | `runEntityLint` | inferred | 67205 | v0.5.5 |
| `Hwe` | `initEntityLintModule` | inferred | 67245 | v0.5.5 |
| `_dt` | `isAllowedNodeSection` | inferred | 67255 | v0.5.5 |
| `vdt` | `renderNodeConvergeSignalBody` | inferred | 67270 | v0.5.5 |
| `Wwe` | `runNodeLint` | inferred | 67282 | v0.5.5 |
| `DO` | `buildNodeSignalKey` | inferred | 67331 |  |
| `Jwe` | `initNodeLintModule` | inferred | 67341 |  |
| `bS` | `initGapSpanModule` | inferred | 67477 | v0.8.4 |
| `vS` | `readPartitionContract` | inferred | 67485 | v0.5.6 |
| `FO` | `getCachedPartitionContract` | inferred | 67576 | v0.5.6 |
| `zO` | `postMemorySignalsToInboxes` | inferred | 67582 | v0.5.6 |
| `UO` | `enforceContractGate` | inferred | 67635 | v0.5.6 |
| `tSe` | `reconcileMemorySignalInboxes` | inferred | 67666 | v0.7.1 |
| `nSe` | `hasAnyMemorySignalConsumer` | inferred | 67709 | v0.5.6 |
| `rSe` | `isOrphanWarningDeliverable` | inferred | 67718 |  |
| `AH` | `initMemorySignalDeliveryModule` | inferred | 67721 |  |
| `VO` | `recordUnreadableUnlessMissing` | inferred | 67743 |  |
| `Ldt` | `listMemoryFragmentDates` | inferred | 67768 | v0.8.0 |
| `qdt` | `readOrSeedGapHandedDays` | inferred | 67825 | v0.8.0 |
| `oSe` | `appendGapHandedSpan` | inferred | 67867 | v0.8.0 |
| `sSe` | `readGapLintDayEvents` | inferred | 67875 | v0.8.0 |
| `uSe` | `mergeContiguousHourRanges` | inferred | 67916 | v0.5.8 |
| `Vdt` | `renderScanGapSignalBody` | inferred | 67935 | v0.5.8 |
| `Hdt` | `buildScanGapSignal` | inferred | 67941 | v0.8.0 |
| `BO` | `buildGapReadFaultResult` | inferred | 67950 | v0.8.0 |
| `Wdt` | `runGapLint` | inferred | 67968 | v0.8.0 |
| `pSe` | `deliverScanGapSignal` | inferred | 68004 | v0.8.0 |
| `mSe` | `initGapLintModule` | inferred | 68048 | v0.8.0 |
| `DH` | `readMemoryMaxLinesLimit` | inferred | 68112 |  |
| `_Se` | `runBroadcastBudgetLint` | inferred | 68122 | v0.8.0 |
| `MH` | `initBroadcastBudgetLintModule` | inferred | 68161 | v0.5.3 |
| `aft` | `listEventPartitionDates` | inferred | 68174 | v0.8.0 |
| `lft` | `scanActivationWindowTouches` | inferred | 68201 | v0.8.0 |
| `cft` | `renderActivationReportHeader` | inferred | 68278 | v0.8.0 |
| `dft` | `renderBoardTemperatureSection` | inferred | 68283 | v0.8.0 |
| `fft` | `renderHotOrphansSection` | inferred | 68293 | v0.8.0 |
| `pft` | `renderActivationReportBody` | inferred | 68300 |  |
| `SSe` | `runActivationLint` | inferred | 68306 | v0.8.0 |
| `qH` | `initActivationLintModule` | inferred | 68405 | v0.8.0 |
| `RSe` | `readIntuitionWeaverLastFinishedMs` | inferred | 68415 | v0.8.0 |
| `mft` | `findNewestFragmentMtimeMs` | inferred | 68421 | v0.8.0 |
| `hft` | `renderFoldGapBody` | inferred | 68451 | v0.8.0 |
| `ISe` | `runFoldGapLint` | inferred | 68457 | v0.8.0 |
| `TSe` | `initFoldGapLintModule` | inferred | 68474 |  |
| `bft` | `extractBoardSlugLinks` | inferred | 68483 | v0.5.3 |
| `Sft` | `formatSlugLinkLocations` | inferred | 68506 | v0.5.3 |
| `PSe` | `runBroadcastLinkLint` | inferred | 68520 | v0.8.0 |
| `$Se` | `initBroadcastLinkLintModule` | inferred | 68541 |  |
| `Pft` | `findBoardHeadingLines` | inferred | 68548 | v0.8.0 |
| `CSe` | `runBroadcastFlattenLint` | inferred | 68573 | v0.8.0 |
| `OSe` | `initBroadcastFlattenLintModule` | inferred | 68594 |  |
| `Oft` | `computeOrphanTopicNodes` | inferred | 68612 | v0.5.5 |
| `DSe` | `detectOrphanMemory` | inferred | 68661 | v0.5.5 |
| `MSe` | `buildOrphanNewbornSignals` | inferred | 68684 | v0.5.5 |
| `jSe` | `forgetMemoryEntry` | inferred | 68693 | v0.5.5 |
| `Aft` | `resolveGitToplevelSync` | inferred | 68729 | v0.5.5 |
| `Nft` | `renderOrphanIslandsBody` | inferred | 68743 | v0.5.5 |
| `LSe` | `filterOrphanIslands` | inferred | 68757 | v0.5.5 |
| `FSe` | `buildOrphanIslandsSignal` | inferred | 68761 | v0.5.5 |
| `Dft` | `computeMemoryLinkIndegree` | inferred | 68770 | v0.5.5 |
| `Mft` | `listMemorySlugReferrers` | inferred | 68781 | v0.5.5 |
| `BH` | `routeContractDecision` | inferred | 68798 | v0.5.5 |
| `Lft` | `formatForgetCommitMessage` | inferred | 68810 | v0.5.5 |
| `zSe` | `initOrphanMemoryModule` | inferred | 68813 | v0.5.5 |
| `HH` | `isTruthyEnvFlag` | inferred | 68830 | v0.5.5 |
| `JH` | `resolveMemoryCheckFlags` | __export | 68835 | v0.5.5 |
| `GH` | `buildMemoryCheckStatus` | __export | 68851 | v0.5.6 |
| `Fft` | `runMemoryCheckTick` | __export | 68865 | v0.5.5 |
| `WH` | `runMemoryCheckSubStep` | inferred | 68981 | v0.7.1 |
| `fa` | `runReadAuditedMemoryCheckStep` | inferred | 68989 | v0.7.1 |
| `zft` | `evaluatePredicateOrFalse` | inferred | 68996 |  |
| `ZH` | `initMemoryCheckTickModule` | inferred | 69003 |  |
| `mW` | `runKernelGitCommand` | inferred | 69241 | v0.2.0 |
| `Oke` | `buildKernelGitEnv` | inferred | 69259 | v0.2.0 |
| `Ake` | `buildSafeDirectoryGitArgs` | inferred | 69271 |  |
| `Bpt` | `isKernelGitToplevel` | inferred | 69274 | v0.2.0 |
| `Nke` | `ensureKernelGitRepo` | inferred | 69287 | v0.2.0 |
| `Vpt` | `mergeKernelGitignoreEntries` | inferred | 69296 | v0.2.0 |
| `Dke` | `initKernelGitModule` | inferred | 69315 | v0.2.0 |
| `SG` | `computeBoardLayerHash` | __export | 82701 | v0.5.10 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Ii` | `isEffortLevel` | inferred | 31533 |  |
| `gR` | `isAgentRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 31669 |  |
| `NR` | `isKnownRuntimeValue` | inferred | 31793 |  |
| `Eb` | `isSupportedRuntime` | inferred | 31797 |  |
| `uU` | `validateKnownRuntimeValue` | inferred | 31801 | v0.8.4 |
| `Hd` | `validateRunnableRuntimeValue` | inferred | 31814 | v0.8.4 |
| `ho` | `resolveDefaultRuntime` | inferred | 31828 | v0.7.1 |
| `Fu` | `initRuntimeValidationModule` | inferred | 31837 | v0.8.4 |
| `Xl` | `attachStreamLineReader` | inferred | 31880 | v0.8.0 |
| `_ae` | `parseLogLevelName` | inferred | 32006 | v0.2.0 |
| `Lm` | `parseEnvBooleanFlag` | inferred | 32012 | v0.2.0 |
| `U8e` | `resolveLogLevel` | inferred | 32025 | v0.3.3 |
| `q8e` | `isLogLevelEnabled` | inferred | 32029 |  |
| `B8e` | `formatLogPrefix` | inferred | 32033 | v0.2.0 |
| `Wd` | `writeLogLine` | inferred | 32037 | v0.2.0 |
| `Ue` | `logErrorMessage` | inferred | 32041 | v0.2.0 |
| `Z` | `logWarnMessage` | inferred | 32045 | v0.2.0 |
| `ee` | `logInfoMessage` | inferred | 32049 | v0.2.0 |
| `ke` | `logDebugMessage` | inferred | 32053 | v0.2.0 |
| `bae` | `logTraceMessage` | inferred | 32057 |  |
| `V8e` | `isSessionLifecycleLoggingEnabled` | inferred | 32061 | v0.2.0 |
| `ut` | `logSessionLifecycleMessage` | inferred | 32065 | v0.2.0 |
| `vt` | `logAlwaysAtLevel` | inferred | 32069 | v0.2.0 |
| `pt` | `initLogLevelModule` | inferred | 32074 | v0.2.0 |
| `vYe` | `appendTelemetryRecord` | inferred | 32914 | v0.3.0 |
| `wYe` | `isTelemetryEnabled` | inferred | 32919 | v0.4.5 |
| `go` | `logLatencyStageTelemetry` | inferred | 32927 | v0.2.0 |
| `_s` | `recordTelemetryMetric` | inferred | 32935 | v0.3.0 |
| `Wi` | `formatYamlErrorMessage` | inferred | 35089 | v0.7.0 |
| `Wb` | `normalizePromptMode` | inferred | 35135 | v0.2.0 |
| `Jb` | `parseClaudeFrontmatterBlock` | inferred | 35336 | v0.5.10 |
| `Qm` | `listFrontmatterKeyAliases` | inferred | 35450 |  |
| `HU` | `parseSdkConfigFrontmatter` | inferred | 35454 | v0.2.0 |
| `ZQe` | `parseChannelRuntimeField` | inferred | 35468 | v0.8.4 |
| `Ua` | `resolveLayeredChannelRuntime` | inferred | 35477 | v0.8.4 |
| `cI` | `parseChannelConfigFields` | inferred | 35514 | v0.2.0 |
| `li` | `loadGlobalRuntimeConfig` | inferred | 36772 | v0.7.0 |
| `Wa` | `loadChannelKindConfig` | inferred | 36800 | v0.7.0 |
| `Ja` | `initChannelConfigLoaderModule` | inferred | 36816 |  |
| `mct` | `buildEffectiveRuntimeFields` | inferred | 65709 | v0.8.4 |
| `SO` | `foldConfigLayersByKey` | inferred | 65728 | v0.7.0 |
| `Ive` | `mergeRuntimeModelLayers` | inferred | 65757 | v0.8.1 |
| `Tve` | `mergeRuntimeEffortLayers` | inferred | 65767 | v0.8.1 |
| `uS` | `readRuntimeModelSetting` | inferred | 65777 |  |
| `lS` | `readRuntimeEffortSetting` | inferred | 65781 |  |
| `nu` | `mergeGlobalModelConfigLayers` | inferred | 65795 | v0.7.0 |
| `Z6` | `overlayConfigEntriesByKey` | inferred | 65831 |  |
| `$ve` | `appendPiConfigIssues` | inferred | 65875 |  |
| `Cve` | `buildEffectiveChannelConfig` | inferred | 65879 | v0.2.0 |
| `ru` | `resolveEffectiveChannelConfig` | inferred | 65974 | v0.2.0 |
| `cS` | `isBusinessSourceKind` | inferred | 65989 |  |
| `Y6` | `resolveEffectiveChannelConfigForEvent` | inferred | 66002 | v0.2.0 |
| `iu` | `resolveChannelConfigBySession` | inferred | 66019 | v0.5.10 |
| `Rwe` | `resolveRuntimePaths` | __export | 66363 | v0.4.3 |
| `GO` | `parseDotEnv` | __export | 69046 | v0.3.3 |
| `ll` | `hostDotEnvPath` | __export | 69061 | v0.4.3 |
| `JSe` | `removeHostModelEnvLines` | inferred | 69081 |  |
| `GSe` | `removeDotEnvKeyLines` | inferred | 69088 | v0.5.1 |
| `ZO` | `writeHostDotEnvLines` | inferred | 69100 | v0.4.3 |
| `XH` | `clearHostModelEnvVars` | __export | 69124 |  |
| `ZSe` | `applyHostModelEnvVars` | __export | 69128 | v0.4.3 |
| `KSe` | `writeHostModelEnvConfig` | __export | 69131 | v0.4.3 |
| `XSe` | `clearHostModelEnvConfig` | __export | 69156 | v0.4.3 |
| `Wft` | `readHostDaemonToken` | __export | 69167 | v0.7.0 |
| `Jft` | `writeHostDaemonToken` | __export | 69179 | v0.7.0 |
| `QSe` | `readHostDotEnvFile` | __export | 69190 | v0.4.3 |
| `Gft` | `loadHostDotEnv` | __export | 69199 | v0.4.3 |
| `YH` | `HOST_MODEL_ENV_KEYS` | __export | 69212 |  |
| `Ds` | `pathExistsAsync` | inferred | 69220 | v0.2.0 |
| `amt` | `isDirEmptyOrMissing` | inferred | 69752 | v0.2.0 |
| `bW` | `copyDirTreeOverwrite` | inferred | 69760 | v0.2.0 |
| `vW` | `copyDirTreeMissingOnly` | inferred | 69771 | v0.2.0 |
| `lmt` | `refreshBootstrapDuoduoMdFiles` | inferred | 69782 | v0.2.0 |
| `cmt` | `copyBootstrapIntoKernel` | inferred | 69797 | v0.2.0 |
| `dmt` | `initializeRuntime` | __export | 69835 | v0.2.0 |
| `Qke` | `initRuntimeInitializationModule` | inferred | 69868 | v0.2.0 |
| `zW` | `encodePiWorkerFrame` | inferred | 72965 |  |
| `$S` | `resolvePiWorkerCommand` | inferred | 73034 | v0.8.0 |
| `Iht` | `buildPiSystemPromptSpec` | inferred | 73046 | v0.8.0 |
| `vA` | `createPiWorkerAdapter` | inferred | 73071 | v0.8.0 |
| `yEe` | `parsePiToolResultDetails` | inferred | 73652 | v0.8.0 |
| `_Ee` | `handlePiToolEndObservation` | inferred | 73658 | v0.8.0 |
| `tH` | `CHANNEL_CONFIG_KEY_TYPES` | inferred | 88348 |  |
| `vct` | `validateConfigValue` | inferred | 88386 | v0.5.10 |
| `owe` | `writeInstanceModelAlias` | inferred | 88881 |  |
| `Zft` | `isClaudeAuthSource` | inferred | 89480 | v0.4.3 |
| `eW` | `readClaudeAuthSourceEnv` | inferred | 89484 | v0.4.3 |
| `Hn` | `resolveEnvConfigEntry` | inferred | 90565 | v0.3.3 |
| `Kbt` | `buildSdkConfigReport` | inferred | 90596 | v0.4.3 |
| `Ybt` | `buildSystemConfigReport` | inferred | 90614 | v0.3.3 |
| `SIe` | `formatLayerModelAliases` | inferred | 91650 | v0.7.0 |
| `DG` | `formatModelConfigIssues` | inferred | 91673 | v0.7.0 |
| `ky` | `appendConfigChangedEvent` | inferred | 91888 | v0.5.10 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `D6` | `isGrokAvailable` | __export | 63278 |  |
| `Dut` | `grokUnavailableReason` | __export | 63282 |  |
| `Mut` | `primeGrokAvailability` | __export | 63285 | v0.7.1 |
| `jut` | `__setGrokAvailabilityForTests` | __export | 63290 |  |
| `Ac` | `checkGrokAvailability` | __export | 63293 | v0.7.1 |
| `Hw` | `grokAcpExtMethod` | __export | 63314 |  |
| `Oi` | `coerceToPlainObject` | inferred | 63323 | v0.7.1 |
| `$be` | `collectGrokToolCallNames` | inferred | 63366 | v0.7.1 |
| `But` | `isGrokSkipToolCall` | inferred | 63375 |  |
| `Vut` | `mapGrokUsageToDrainUsage` | inferred | 63379 | v0.7.1 |
| `Ww` | `createGrokAcpAdapter` | __export | 63438 | v0.7.1 |
| `Rbe` | `GROK_ACP_COMPACT` | __export | 63996 |  |
| `xbe` | `GROK_ACP_EXT_PREFIX` | __export | 63996 |  |
| `Ebe` | `GROK_ACP_SDK_CALL` | __export | 63996 |  |
| `kbe` | `GROK_AGENT_PROFILE` | __export | 63996 |  |
| `Sbe` | `GROK_DISALLOWED_TOOLS` | __export | 63996 |  |
| `Ibe` | `GROK_MCP_SDK_META` | __export | 63996 |  |
| `Tbe` | `GROK_MCP_SERVERS_META` | __export | 63996 |  |
| `Pbe` | `GROK_MCP_SERVER_NAME` | __export | 63996 |  |
| `Og` | `initGrokAcpRuntimeModule` | inferred | 63996 | v0.7.1 |
