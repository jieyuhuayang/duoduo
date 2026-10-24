# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*；其中标注 *published source* 的名字是上游在同作者的公开源码包里的拼写，由 `maps/published_daemon.json` 记录；标注 *historical export* 的名字是上游在旧版本 `__export` 块里的拼写，经版本配对追到本版本，由 `maps/historical_daemon.json` 记录）。“原行号”指反混淆后的 `daemon.pretty.js`。“首见版本”是 npm 上最早含有该声明的发行版（`maps/history_daemon.json`，由 `tools/history.sh` 逐版本配对得出）。

共 845 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.6。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `fI` | `statusPath` | inferred, historical export (v0.2.0..v0.3.7) | 35062 | v0.2.0 |
| `tq` | `buildInitialStatus` | inferred, historical export (v0.2.0..v0.3.7) | 35066 | v0.2.0 |
| `nq` | `writeStatus` | inferred, historical export (v0.2.0..v0.3.7) | 35093 | v0.2.0 |
| `Gb` | `readStatus` | inferred, historical export (v0.2.0..v0.3.7) | 35096 | v0.2.0 |
| `Hu` | `updateStatus` | inferred, historical export (v0.2.0..v0.3.7) | 35104 | v0.2.0 |
| `Bq` | `replaceSessionIndexEntry` | inferred | 39014 |  |
| `Gfe` | `createVoidAwareAttachmentCallbacks` | inferred | 39039 | v0.8.4 |
| `kmt` | `daemonRestartReasonPath` | inferred | 68135 | v0.6.2 |
| `QSe` | `claimDaemonRestartReason` | inferred | 68138 | v0.6.2 |
| `eke` | `setPendingRestartReason` | inferred | 68164 |  |
| `tke` | `getPendingRestartReason` | inferred | 68168 | v0.8.0 |
| `ike` | `renderRestartWakeMessage` | inferred | 68210 | v0.8.0 |
| `V6` | `resolveRuntimeWriterLockPath` | inferred | 91340 | v0.2.0 |
| `Dmt` | `isProcessAliveByPid` | inferred | 91344 | v0.2.0 |
| `Mmt` | `computeHostBootId` | inferred | 91354 | v0.3.0 |
| `pke` | `getCachedHostBootId` | inferred | 91371 |  |
| `jmt` | `isRuntimeWriterLockStale` | inferred | 91375 | v0.3.0 |
| `J6` | `acquireRuntimeWriterLock` | inferred | 91387 | v0.2.0 |
| `mke` | `refreshRuntimeWriterLockHeartbeat` | inferred | 91435 | v0.2.0 |
| `UO` | `releaseRuntimeWriterLock` | inferred | 91440 | v0.2.0 |
| `gPe` | `readEnvIntegerOrFallback` | inferred | 92629 | v0.2.0 |
| `Xkt` | `computeRuntimeId` | inferred | 92809 | v0.2.0 |
| `axt` | `deliverDaemonRestartWakes` | __export | 93330 | v0.8.0 |
| `_xt` | `parseHostHeaderHostname` | inferred | 94111 | v0.7.0 |
| `bxt` | `parseOriginHostname` | inferred | 94121 |  |
| `Sxt` | `createDaemon` | __export | 94163 | v0.2.0 |
| `kxt` | `main` | __export | 95201 | v0.2.0 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `ys` | `iterateStreamLines` | inferred | 33980 | v0.8.0 |
| `Vi` | `stringifyJsonlRecord` | inferred | 34014 | v0.8.0 |
| `zu` | `memoizeIndexLoad` | inferred | 34021 | v0.8.0 |
| `Uu` | `isIndexLoadStillCurrent` | inferred | 34026 | v0.8.0 |
| `Dt` | `writeFileAtomic` | inferred | 34038 | v0.2.0 |
| `Bt` | `writeJsonFileAtomic` | inferred | 34054 | v0.2.0 |
| `Ne` | `ensureDirectoryExists` | inferred | 34067 | v0.2.0 |
| `qQe` | `enqueuePartitionAppend` | inferred | 34173 | v0.2.0 |
| `BQe` | `generateSpineEventId` | inferred | 34178 | v0.2.0 |
| `Gm` | `formatEventPartitionName` | inferred | 34182 | v0.2.0 |
| `tn` | `createSpineEvent` | inferred | 34186 | v0.2.0 |
| `VQe` | `appendEventToPartition` | inferred | 34193 | v0.2.0 |
| `Lb` | `resolveEventIdIndexPath` | inferred | 34216 | v0.2.0 |
| `WQe` | `appendEventIdIndexEntry` | inferred | 34219 | v0.2.0 |
| `nn` | `atomicAppendEvent` | inferred | 34228 | v0.2.0 |
| `No` | `readEventById` | inferred | 34237 | v0.3.1 |
| `JQe` | `readEventAtIndexedOffset` | inferred | 34245 | v0.3.1 |
| `GQe` | `scanPartitionsForEventId` | inferred | 34263 | v0.2.0 |
| `Fb` | `lookupEventIdIndexEntry` | inferred | 34280 | v0.2.0 |
| `ZQe` | `getOrCreateEventIdIndexCache` | inferred | 34294 | v0.2.0 |
| `KQe` | `isUsableEventIndexEntry` | inferred | 34304 | v0.8.2 |
| `YQe` | `loadEventIdIndex` | inferred | 34307 | v0.2.0 |
| `mle` | `findEventInPartitionFile` | inferred | 34344 |  |
| `hle` | `readSpineIndexRetentionDays` | inferred | 34358 | v0.8.0 |
| `gle` | `pruneEventIdIndexByRetention` | inferred | 34364 | v0.8.0 |
| `Do` | `initSpineEventLogModule` | inferred | 34406 | v0.8.0 |
| `Eet` | `resolveConsumerOffsetPath` | inferred | 35037 | v0.2.0 |
| `Ret` | `writeConsumerOffsetFile` | inferred | 35040 | v0.2.0 |
| `Bu` | `advanceConsumerWatermark` | inferred | 35043 | v0.2.0 |
| `lI` | `spineEventDedupStore` | inferred | 89328 | v0.2.0 |
| `cI` | `computeDedupKey` | inferred | 89388 | v0.2.0 |
| `mv` | `loadRegistryDedupStore` | inferred | 89551 | v0.2.0 |
| `G6` | `readPartitionByteRange` | inferred | 91454 | v0.8.2 |
| `zmt` | `iteratePartitionLinesBackward` | inferred | 91466 | v0.8.2 |
| `Umt` | `resolveTailCursorEndOffset` | inferred | 91478 | v0.8.2 |
| `hke` | `readPartitionTail` | inferred | 91493 | v0.8.2 |
| `gke` | `readSpineTail` | inferred | 91532 | v0.3.2 |
| `Cyt` | `shouldKeepRouteDeliverEvent` | inferred | 92483 | v0.8.4 |
| `y0e` | `stripSpineEventToEnvelope` | inferred | 92487 | v0.8.4 |
| `Oyt` | `redactSpineEventForExternal` | inferred | 92501 | v0.8.4 |
| `Ayt` | `checkReservedRecordSource` | inferred | 92546 | v0.8.4 |
| `v0e` | `recordExternalSpineEvent` | inferred | 92557 | v0.8.4 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Nb` | `isJsonRpcRequest` | inferred | 33598 | v0.2.0 |
| `at` | `isRecord` | inferred, published source (@openduo/protocol@0.8.4 rpc.ts) | 33604 | v0.2.0 |
| `Ti` | `isOptionalString` | inferred, published source (@openduo/protocol@0.8.4 rpc.ts) | 33608 | v0.2.0 |
| `AU` | `initProtocolEffortModule` | inferred, published source (@openduo/protocol@0.8.4 effort.ts) | 33618 | v0.8.0 |
| `_R` | `isSystemRuntimeInfo` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33623 | v0.2.0 |
| `bR` | `isRuntimeInfoParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33627 | v0.2.0 |
| `vR` | `isSessionArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33634 | v0.5.0 |
| `NU` | `isSessionListKind` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33638 | v0.5.4 |
| `wR` | `isSessionListParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33642 | v0.5.4 |
| `SR` | `isSessionSetAliasParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33646 | v0.5.4 |
| `kR` | `isSessionWakeParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33650 | v0.8.2 |
| `xR` | `isSessionNotifyParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33654 | v0.5.4 |
| `ER` | `isSessionModelParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33658 | v0.8.0 |
| `RR` | `isSessionEffortParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33662 | v0.8.0 |
| `IR` | `isSessionCompactParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33666 | v0.5.8 |
| `TR` | `isSessionConfigParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33670 | v0.5.10 |
| `PQe` | `isNonEmptyText` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33682 | v0.8.4 |
| `DU` | `unknownKeyProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33686 | v0.8.4 |
| `nle` | `textKeysProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33691 | v0.8.4 |
| `Bm` | `renderParamsProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33699 | v0.8.4 |
| `rle` | `describeConversationProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33706 |  |
| `MU` | `describeMemoryReadProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33710 |  |
| `jU` | `describeSpineCatProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33714 | v0.8.4 |
| `LU` | `describeSpineRecordProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33726 | v0.8.4 |
| `FU` | `initProtocolSystemModule` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 33729 | v0.7.1 |
| `zU` | `isModelRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33755 |  |
| `AR` | `isChannelIngressParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33759 | v0.2.0 |
| `NR` | `isChannelFileUploadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33763 | v0.2.0 |
| `DR` | `isChannelFileDownloadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33767 | v0.2.0 |
| `Hm` | `isChannelPullParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33771 | v0.2.0 |
| `MR` | `isChannelCommandParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33775 | v0.2.0 |
| `jR` | `isChannelAckParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33779 | v0.2.0 |
| `LR` | `isChannelDescribeParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33783 | v0.5.0 |
| `FR` | `isChannelSpawnParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33787 | v0.5.0 |
| `CQe` | `isAttachmentArray` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33791 | v0.2.0 |
| `OQe` | `isChannelCapabilities` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33795 | v0.2.0 |
| `AQe` | `isMimePattern` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33802 | v0.2.0 |
| `ile` | `initChannelProtocolModule` | inferred | 33805 |  |
| `zR` | `isJobCreateParams` | inferred | 33816 | v0.2.0 |
| `UR` | `isJobGetParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33820 | v0.2.0 |
| `qR` | `isJobListParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33824 | v0.2.0 |
| `BR` | `isJobArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33828 |  |
| `HR` | `isJobRescheduleParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33832 | v0.8.2 |
| `VR` | `isJobInterruptParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33836 | v0.8.2 |
| `sle` | `initProtocolJobModule` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33839 | v0.7.1 |
| `WR` | `isSystemStatusParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 33848 |  |
| `JR` | `isSystemConfigParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 33852 |  |
| `GR` | `isSpineTailParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 33856 | v0.3.2 |
| `mh` | `isValidChannelId` | inferred | 37887 | v0.2.0 |
| `hh` | `assertValidChannelId` | inferred | 37891 | v0.2.0 |
| `ws` | `readChannelDescriptor` | inferred | 37931 | v0.2.0 |
| `eit` | `generateOutboxRecordId` | inferred | 38118 | v0.2.0 |
| `cv` | `resolveOutboxRecordPath` | inferred | 38122 | v0.2.0 |
| `Va` | `createOutboxRecord` | inferred | 38126 | v0.2.0 |
| `Wa` | `persistOutboxRecord` | inferred | 38158 | v0.2.0 |
| `Dq` | `indexOutboxRecordByEventId` | inferred | 38164 | v0.2.0 |
| `Ja` | `readOutboxRecord` | inferred | 38172 | v0.2.0 |
| `dv` | `listAllOutboxRecords` | inferred | 38197 | v0.2.0 |
| `yh` | `findOutboxRecordByEventId` | inferred | 38229 | v0.2.0 |
| `yf` | `recordOutboxDeliveryAttempt` | inferred | 38237 | v0.2.0 |
| `Mq` | `resolveOutboxByEventIndexPath` | inferred | 38261 | v0.2.0 |
| `xfe` | `resolveOutboxSentIdsPath` | inferred | 38265 | v0.2.0 |
| `iit` | `loadOutboxByEventIndex` | inferred | 38278 | v0.2.0 |
| `oit` | `appendOutboxByEventIndexEntry` | inferred | 38295 | v0.2.0 |
| `_h` | `recordOutboxSentId` | inferred | 38325 | v0.2.0 |
| `$I` | `resolveOutboxReplayDir` | inferred | 38331 | v0.3.0 |
| `Ss` | `resolveOutboxReplayFilePath` | inferred | 38339 |  |
| `jq` | `resolveOutboxByIdIndexPath` | inferred | 38350 | v0.3.0 |
| `oa` | `lookupOutboxByIdIndexEntry` | inferred | 38402 |  |
| `dit` | `ensureOutboxRecordInReplay` | inferred | 38455 | v0.3.0 |
| `CI` | `backfillOutboxByIdIndexFromReplay` | inferred | 38627 | v0.3.0 |
| `ac` | `resolveOutboxPendingQueuePath` | inferred | 38663 | v0.3.1 |
| `mit` | `hasUnqueuedPendingOutboxRecords` | inferred | 38713 | v0.3.1 |
| `Mfe` | `listRetryableOutboxRecords` | inferred | 38782 | v0.3.1 |
| `Fo` | `initOutboxStoreModule` | inferred | 38800 | v0.3.1 |
| `Zfe` | `listVoidChannelSessions` | inferred | 39051 | v0.8.4 |
| `jI` | `writeVoidSessionOutboxRecord` | inferred | 39063 | v0.8.4 |
| `$we` | `updateDeliveryCursorFile` | inferred | 66481 | v0.5.6 |
| `Owe` | `resolveDeliveryCursorPath` | inferred | 66502 | v0.2.0 |
| `Awe` | `readDeliveryCursorFile` | inferred | 66514 | v0.2.0 |
| `_6` | `advanceOptimisticDeliveryCursor` | inferred | 66557 | v0.3.0 |
| `lS` | `readOutboxRecordsPastCursor` | inferred | 66657 | v0.2.0 |
| `Mwe` | `replayOutboxBacklogToSubscriber` | inferred | 66715 | v0.2.0 |
| `yO` | `readLatestDeliveryCursorUpdate` | inferred | 66801 |  |
| `tp` | `hasNonEmptyDisplayName` | inferred | 66933 | v0.5.4 |
| `$pt` | `filterDeliverableSessions` | inferred | 66968 | v0.8.4 |
| `Ns` | `deliverRouteEventToSession` | inferred | 67121 | v0.8.0 |
| `lA` | `DAEMON_TOKEN_ENV_KEY` | __export | 71294 |  |
| `Ffe` | `lookupInjectionPrompt` | inferred | 89518 | v0.5.7 |
| `npe` | `readRoutingTarget` | inferred | 89557 | v0.2.0 |
| `ape` | `canonicalizeGatewayCommand` | inferred | 89570 | v0.2.0 |
| `zI` | `parseInjectionPromptCommand` | inferred | 89583 | v0.5.7 |
| `upe` | `expandInjectionPromptCommand` | inferred | 89599 | v0.5.7 |
| `pv` | `parseGatewayCommandText` | inferred | 89608 | v0.2.0 |
| `Gq` | `classifyGatewayCommandIntent` | inferred | 89624 | v0.2.0 |
| `Oit` | `resolveRoutingTarget` | inferred | 89637 | v0.2.0 |
| `lpe` | `ingestChannelMessage` | inferred | 89643 | v0.2.0 |
| `hv` | `ingestChannelCommand` | inferred | 89668 | v0.2.0 |
| `cpe` | `appendBeforeExecuteGateway` | inferred | 89696 | v0.2.0 |
| `dpe` | `probeEventsAppendable` | inferred | 89847 | v0.2.0 |
| `Ait` | `replyToGatewayCommandEvent` | inferred | 89862 | v0.2.0 |
| `Lit` | `executeGatewayCommand` | inferred | 89985 | v0.2.0 |
| `Fit` | `writeIngressSnapshot` | inferred | 90293 | v0.2.0 |
| `mSe` | `saveChannelUploadToInbox` | inferred | 90358 | v0.2.0 |
| `hSe` | `readFileAsBase64` | inferred | 90382 | v0.2.0 |
| `amt` | `sanitizeUploadFileName` | inferred | 90386 | v0.2.0 |
| `B6` | `createSessionSubscriptionRegistry` | inferred | 91148 | v0.2.0 |
| `Bc` | `MemoryReadRpcError` | inferred | 91575 |  |
| `Gxe` | `readMemoryFileForRpc` | inferred | 91581 | v0.8.4 |
| `ap` | `SpineRpcParamsError` | inferred | 92478 |  |
| `b0e` | `runSpineCatRpc` | inferred | 92521 | v0.8.4 |
| `Tt` | `JsonRpcInvalidParamsError` | inferred | 92602 | v0.2.0 |
| `uPe` | `bindSessionSourceChannel` | inferred | 92605 |  |
| `lPe` | `assertWsChannelIdentityParams` | inferred | 92614 | v0.2.0 |
| `fZ` | `normalizeReturnMask` | inferred | 92746 | v0.2.0 |
| `Kkt` | `normalizeChannelCapabilityDeclarations` | inferred | 92776 | v0.3.3 |
| `Ykt` | `recordChannelCapabilityDeclaration` | inferred | 92786 | v0.2.0 |
| `yp` | `resolveExistingDirRealpath` | inferred | 92821 | v0.2.0 |
| `yPe` | `ensureAbsoluteWorkspaceDir` | inferred | 92831 | v0.2.0 |
| `cPe` | `resolveIngressWorkspace` | inferred | 92838 | v0.2.0 |
| `txt` | `describeChannelInstance` | inferred | 92906 | v0.5.0 |
| `nxt` | `archiveSessionIfQuiescent` | inferred | 92970 | v0.5.0 |
| `_Pe` | `refreshSessionIndexEntry` | inferred | 93043 |  |
| `rxt` | `setSessionAliasAndReindex` | inferred | 93047 | v0.5.4 |
| `ixt` | `resolveSessionByExactKey` | inferred | 93064 | v0.8.4 |
| `_p` | `resolveSessionByKeyOrAlias` | inferred | 93076 | v0.5.4 |
| `oxt` | `scheduleSessionWakeRecord` | inferred | 93105 | v0.8.2 |
| `vPe` | `deliverExternalSessionNotify` | inferred | 93165 | v0.5.4 |
| `sxt` | `replayIdempotentSessionNotify` | inferred | 93305 | v0.8.4 |
| `uxt` | `readOrSetSessionModel` | inferred | 93355 | v0.8.0 |
| `lxt` | `readOrSetSessionEffort` | inferred | 93385 | v0.8.0 |
| `cxt` | `enqueueSessionCompactCommand` | inferred | 93415 | v0.5.8 |
| `wPe` | `checkChannelRuntimeRebindConflict` | inferred | 93526 | v0.8.3 |
| `fxt` | `applySessionConfigVerb` | inferred | 93535 | v0.5.10 |
| `yxt` | `upsertChannelSpawnDescriptor` | inferred | 94001 | v0.5.0 |
| `vxt` | `isLoopbackBindHost` | __export | 94130 | v0.7.0 |
| `wxt` | `resolveRemoteListenerConfig` | __export | 94137 | v0.7.0 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `ef` | `moveFileIntoDirectory` | inferred | 34422 | v0.5.6 |
| `jo` | `hashSessionKey` | inferred | 34442 | v0.2.0 |
| `Yn` | `resolveSessionDir` | inferred | 34446 | v0.2.0 |
| `tet` | `resolveSessionsArchiveRoot` | inferred | 34450 | v0.4.5 |
| `Zm` | `resolveArchivedSessionDir` | inferred | 34454 |  |
| `ea` | `isSessionArchived` | inferred | 34458 |  |
| `zb` | `resolveSessionInboxDir` | inferred | 34462 | v0.2.0 |
| `nI` | `resolveSessionMailboxMarkdownPath` | inferred | 34466 | v0.2.0 |
| `vle` | `resolveSessionMailboxDir` | inferred | 34470 |  |
| `tf` | `resolveSessionMailboxPendingDir` | inferred | 34474 | v0.3.1 |
| `Ub` | `resolveSessionMailboxNotesPath` | inferred | 34478 | v0.3.1 |
| `za` | `resolveSessionMetaPath` | inferred | 34482 | v0.2.0 |
| `_s` | `resolveSessionStatePath` | inferred | 34486 | v0.2.0 |
| `qb` | `listPendingInboxFiles` | inferred | 34496 | v0.5.6 |
| `Bb` | `probeSessionPendingWork` | inferred | 34511 | v0.6.0 |
| `wle` | `rehydrateSessionState` | inferred | 34525 | v0.4.0 |
| `Hb` | `moveSessionDirToArchive` | inferred | 34565 | v0.4.5 |
| `Wi` | `runWithSessionMutex` | inferred | 34595 | v0.5.0 |
| `iI` | `tryMarkSessionArchiving` | inferred | 34608 | v0.5.0 |
| `oI` | `clearSessionArchiving` | inferred | 34612 |  |
| `dr` | `isSessionArchiving` | inferred | 34616 |  |
| `rc` | `assertSessionNotArchiving` | inferred | 34620 |  |
| `Ua` | `initSessionLockAndArchivingModule` | inferred | 34623 | v0.5.0 |
| `QU` | `ensureSessionMailboxPendingDir` | inferred | 34729 |  |
| `na` | `enqueueSessionInboxLine` | inferred | 34732 | v0.2.0 |
| `aI` | `mergeInboxIntoMailbox` | inferred | 34743 | v0.2.0 |
| `Wb` | `listMailboxPendingItems` | inferred | 34802 | v0.3.1 |
| `Lo` | `deleteMailboxPendingItemsByEventIds` | inferred | 34824 | v0.3.1 |
| `Ile` | `removeOrphanMailboxItemFiles` | inferred | 34853 | v0.4.2 |
| `Jb` | `appendSessionMailboxNote` | inferred | 34880 | v0.3.1 |
| `uI` | `renderSessionMailboxFile` | inferred | 34890 | v0.3.1 |
| `lh` | `notifySessionFileChanged` | inferred | 37654 |  |
| `pf` | `stripUndefinedFieldsDeep` | inferred | 37674 | v0.2.0 |
| `ch` | `ensureSessionDescriptorAndStateFiles` | inferred | 37682 | v0.2.0 |
| `ra` | `readSessionMetaFile` | inferred | 37713 | v0.5.4 |
| `mfe` | `updateSessionDisplayName` | inferred | 37722 | v0.2.0 |
| `rt` | `readSessionRuntimeState` | inferred | 37746 | v0.2.0 |
| `dh` | `readAllSessionStateFiles` | inferred | 37754 | v0.4.0 |
| `et` | `patchSessionRuntimeState` | inferred | 37772 | v0.2.0 |
| `mf` | `mutateSessionRuntimeState` | inferred | 37809 | v0.5.0 |
| `ia` | `clearSessionRuntimeStateField` | inferred | 37845 | v0.5.0 |
| `bn` | `classifySessionKeyKind` | inferred | 38922 | v0.5.0 |
| `qq` | `isUserVisibleSessionKey` | inferred | 38926 |  |
| `bh` | `buildSessionIndexFromDisk` | inferred | 38929 | v0.5.0 |
| `Vfe` | `createEmptySessionIndex` | inferred | 38939 |  |
| `Wfe` | `buildSessionIndexEntry` | inferred | 38943 | v0.5.0 |
| `Jfe` | `createMapBackedSessionIndex` | inferred | 38967 | v0.5.0 |
| `vh` | `resolveSessionChannelRuntime` | inferred | 39026 | v0.8.4 |
| `Gu` | `isVoidRuntimeSession` | inferred | 39034 | v0.8.4 |
| `_f` | `initVoidRuntimeModule` | inferred | 39080 |  |
| `Vq` | `readAllSessionSummaries` | __export | 39232 | v0.2.0 |
| `sC` | `initCallerSessionEnvModule` | inferred | 57098 |  |
| `wC` | `issueWorkerToolContextToken` | inferred | 57940 | v0.8.0 |
| `Wve` | `assertJobWorkspaceUsable` | inferred | 63540 | v0.5.5 |
| `Xve` | `extractJobSdkConfig` | inferred | 63677 | v0.6.2 |
| `wO` | `listSessionIndexSummaries` | inferred | 66949 | v0.5.4 |
| `Vwe` | `formatViewSessionsListLine` | inferred | 66987 | v0.8.2 |
| `Hg` | `runViewSessionsTool` | inferred | 67024 | v0.8.2 |
| `fS` | `initViewSessionsToolModule` | inferred | 67036 | v0.8.2 |
| `lke` | `archiveSessionDirUnlessAlreadyArchiving` | inferred | 68221 | v0.5.6 |
| `cke` | `archiveSessionAndArtifacts` | inferred | 68237 | v0.5.0 |
| `ske` | `readStateSourceChannelId` | inferred | 68378 | v0.5.0 |
| `uke` | `listArchivedCopiesNewestFirst` | inferred | 68399 | v0.5.0 |
| `B0e` | `archiveLegacyRegistrySessionsDir` | __export | 71745 | v0.5.0 |
| `Z0e` | `extractUrlHost` | inferred | 72027 |  |
| `tEe` | `acquireSessionDrainLock` | inferred | 72245 | v0.2.0 |
| `nEe` | `refreshSessionDrainLockHeartbeat` | inferred | 72268 | v0.2.0 |
| `rEe` | `releaseSessionDrainLock` | inferred | 72273 | v0.2.0 |
| `oJ` | `resolveSessionDrainLockPath` | inferred | 72285 | v0.2.0 |
| `iEe` | `readDrainLockFile` | inferred | 72288 | v0.2.0 |
| `DEe` | `drainSessionMailbox` | inferred | 72745 | v0.2.0 |
| `io` | `classifySessionKeyOrUnknown` | inferred | 73829 | v0.3.0 |
| `F_t` | `clearPendingGatewayNotice` | inferred | 74161 | v0.2.0 |
| `z_t` | `setPendingInterruptedContext` | inferred | 74164 | v0.2.0 |
| `U_t` | `clearPendingInterruptedContext` | inferred | 74170 | v0.2.0 |
| `q_t` | `clearPendingSkipRewind` | inferred | 74173 | v0.2.0 |
| `iy` | `buildSessionInfoFromState` | inferred | 74717 | v0.2.0 |
| `pbt` | `classifySessionPlane` | inferred | 74762 | v0.2.0 |
| `eRe` | `requestPiWorkerCatalog` | inferred | 75068 | v0.8.0 |
| `BS` | `resolvePiAgentDir` | inferred | 75531 | v0.8.0 |
| `HS` | `readPiAgentSettings` | inferred | 75535 | v0.8.0 |
| `iRe` | `selectInstructionsFingerprint` | inferred | 75561 |  |
| `kJ` | `canonicalizeJsonValue` | inferred | 75565 | v0.8.0 |
| `oRe` | `buildPiConfigSignature` | inferred | 75574 | v0.8.0 |
| `QIe` | `stringifyExecutionToolInput` | inferred | 82616 | v0.2.0 |
| `eTe` | `computeStreamEventDedupKey` | inferred | 82626 | v0.2.0 |
| `tTe` | `buildSessionExecutionPayload` | inferred | 82630 | v0.2.0 |
| `vk` | `channelKindFromSessionKey` | inferred | 82660 | v0.2.0 |
| `iTe` | `listDefaultClaudeToolNames` | inferred | 82673 | v0.2.0 |
| `qG` | `inferActorOriginFromSessionKey` | inferred | 82677 | v0.4.0 |
| `oTe` | `classifySessionPoolKind` | inferred | 82689 | v0.2.0 |
| `sTe` | `isAvailableWorkspacePath` | inferred | 82693 | v0.2.0 |
| `$y` | `SESSION_SCHEMA_VERSION` | __export | 82701 |  |
| `aTe` | `createJobSessionFinalizer` | inferred | 82706 | v0.8.0 |
| `Rk` | `computeInstructionsFingerprint` | __export | 84778 | v0.4.5 |
| `rZ` | `computeNonBoardInstructionsFingerprint` | __export | 84787 |  |
| `FN` | `diffStreamingConfigSignature` | __export | 84794 | v0.5.10 |
| `MTe` | `computeMissionFingerprint` | __export | 84827 |  |
| `zN` | `runInstructionsFingerprintGuard` | __export | 84832 | v0.4.5 |
| `jTe` | `collectInstructionsInputs` | inferred | 84979 | v0.5.1 |
| `Ik` | `initInstructionsFingerprintModule` | inferred | 85014 |  |
| `iZ` | `narrowToModelSettableAdapter` | inferred | 85027 | v0.8.0 |
| `oZ` | `computeStreamingConfigSignature` | inferred | 85031 | v0.8.0 |
| `UN` | `readLiveStreamContextToken` | inferred | 85049 | v0.8.0 |
| `sZ` | `isLiveStreamRebuildRequired` | inferred | 85059 | v0.8.0 |
| `qN` | `flagStreamRecreationOnModelReject` | inferred | 85065 | v0.8.0 |
| `FTe` | `createModelCommandResolvers` | inferred | 85083 | v0.8.0 |
| `ukt` | `recordPendingInterruptMarker` | inferred | 85221 | v0.8.2 |
| `BTe` | `prependPendingInterruptMarker` | inferred | 85243 | v0.8.2 |
| `VN` | `interruptActorQuery` | inferred | 85264 | v0.8.0 |
| `aZ` | `triggerDeferredPreempt` | inferred | 85268 | v0.8.0 |
| `Tk` | `requestBoundaryAwarePreempt` | inferred | 85277 | v0.8.0 |
| `HTe` | `snapshotInflightEventIds` | inferred | 85286 | v0.8.0 |
| `gp` | `teardownStreamingSession` | inferred | 85291 | v0.8.0 |
| `uZ` | `waitForWakeOrIdleTimeout` | inferred | 85306 | v0.8.0 |
| `WN` | `shutdownActorRuntimeAdapter` | inferred | 85320 | v0.8.0 |
| `JTe` | `memoizeAvailabilityProbeUntilOk` | inferred | 86085 |  |
| `gkt` | `createSessionManager` | __export | 86092 | v0.2.0 |
| `Pkt` | `createMetaSession` | __export | 88298 | v0.2.0 |
| `$kt` | `sweepTombstonedSessionRecords` | __export | 88884 | v0.5.6 |
| `dke` | `createIdleCompactSweeper` | inferred | 90989 | v0.5.10 |
| `gZ` | `resolvePreemptFromCommandText` | inferred | 92758 | v0.2.0 |
| `Qkt` | `classifySessionPlaneByKey` | inferred | 92814 | v0.2.0 |
| `bPe` | `resolveIsolatedPlaneKind` | inferred | 93101 |  |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Mw` | `resolveMetaPromptText` | __export | 57467 | v0.2.0 |
| `ylt` | `renderJobAcceptanceBlock` | inferred | 57478 | v0.8.0 |
| `J_e` | `renderJobMissionBlock` | __export | 57484 | v0.4.5 |
| `G_e` | `renderPromptLayers` | __export | 57491 | v0.7.1 |
| `xg` | `buildSystemPromptForChannelConfig` | __export | 57518 | v0.2.0 |
| `rwe` | `extractSystemPromptAppend` | __export | 64327 | v0.4.4 |
| `nke` | `decideRestartHintInjection` | inferred | 68176 | v0.5.2 |
| `rke` | `renderDaemonRestartHint` | inferred | 68205 |  |
| `CA` | `formatLocalTimestampWithZone` | inferred | 72509 | v0.5.0 |
| `pEe` | `decideBoardUpdatedInjection` | inferred | 72532 | v0.5.10 |
| `mEe` | `renderBoardUpdatedHint` | inferred | 72556 |  |
| `AEe` | `projectJobPromptContext` | inferred | 72611 | v0.8.0 |
| `Ut` | `escapeXmlText` | inferred | 73810 | v0.2.0 |
| `T_t` | `renderJobCompleteReceiptGuidance` | inferred | 73833 | v0.4.0 |
| `NA` | `renderMailboxEventPrompt` | inferred | 73876 | v0.2.0 |
| `C_t` | `renderSkipRewindBlock` | inferred | 73959 | v0.2.0 |
| `A_t` | `resolvePendingCompactNotice` | inferred | 73973 | v0.5.10 |
| `N_t` | `renderSmartCompactNoticeBlock` | inferred | 73996 | v0.5.10 |
| `jEe` | `formatElapsedDuration` | inferred | 74005 | v0.3.0 |
| `LEe` | `computeTimeGapContext` | inferred | 74016 | v0.8.0 |
| `D_t` | `renderTimeGapContextBlock` | inferred | 74025 | v0.3.0 |
| `j_t` | `renderJobTickBlock` | inferred | 74039 | v0.4.5 |
| `FEe` | `buildTransientUserBlocks` | inferred | 74053 | v0.2.0 |
| `CTe` | `transcludeBroadcastBoard` | inferred | 84627 | v0.5.2 |
| `XSt` | `renderTranscludedFiles` | inferred | 84635 | v0.5.2 |
| `OTe` | `resolveBoardIncludes` | inferred | 84642 | v0.5.2 |
| `ekt` | `realpathOrSelf` | inferred | 84676 |  |
| `ITe` | `normalizeIncludePathKey` | inferred | 84684 | v0.5.2 |
| `tkt` | `stripBoardIncludeFrontmatter` | inferred | 84689 | v0.5.2 |
| `nkt` | `parseBoardFileContent` | inferred | 84697 | v0.5.2 |
| `rkt` | `stripBoardHtmlComments` | inferred | 84708 | v0.5.2 |
| `ikt` | `collectBoardIncludePaths` | inferred | 84725 | v0.5.2 |
| `okt` | `normalizeBoardIncludeToken` | inferred | 84754 |  |
| `skt` | `isBoardIncludePathCandidate` | inferred | 84760 | v0.5.2 |
| `akt` | `resolveBoardIncludePath` | inferred | 84764 | v0.5.2 |
| `ATe` | `initBoardTransclusionModule` | inferred | 84767 | v0.5.2 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Hq` | `detectInProcessBreak` | __export | 39110 | v0.5.10 |
| `Ya` | `drainRecordPath` | __export | 39122 | v0.2.0 |
| `bf` | `appendDrainRecord` | __export | 39125 | v0.2.0 |
| `wh` | `readDrainRecords` | __export | 39144 |  |
| `FI` | `createEmptyUsageSummary` | inferred | 39150 | v0.8.2 |
| `Xfe` | `accumulateDrainRecordIntoSummary` | inferred | 39210 | v0.2.0 |
| `fv` | `summarizeDrainRecords` | __export | 39222 |  |
| `Qfe` | `aggregateSessionDrainSummary` | inferred | 39227 |  |
| `Wq` | `readGlobalUsageTotals` | __export | 39249 | v0.4.4 |
| `Pit` | `readRecentDrainRecords` | __export | 39266 | v0.2.0 |
| `Kfe` | `IN_PROCESS_BREAK_HIT_RATIO_FLOOR` | __export | 39283 |  |
| `oC` | `runSkipTool` | inferred | 57064 | v0.2.0 |
| `el` | `initSkipToolModule` | inferred | 57088 | v0.2.0 |
| `kg` | `isAbortLikeError` | __export | 57366 | v0.2.0 |
| `jg` | `selectInterruptMarkerText` | inferred | 64182 |  |
| `Lg` | `normalizeTurnAbortReason` | inferred | 64186 | v0.8.2 |
| `Qw` | `initInterruptMarkerTextModule` | inferred | 64189 |  |
| `nwe` | `computeCodexTurnUsage` | __export | 64303 | v0.5.6 |
| `uEe` | `normalizeInputTokenTotals` | inferred | 72472 | v0.5.6 |
| `lEe` | `computeCacheHitRate` | inferred | 72488 | v0.5.6 |
| `cJ` | `addToNumericField` | inferred | 72568 |  |
| `Po` | `runTimedDrainPhase` | inferred | 72576 |  |
| `_Ee` | `resolveTurnModelWithLayer` | inferred | 72621 | v0.8.1 |
| `bEe` | `resolveTurnEffortWithLayer` | inferred | 72634 | v0.8.1 |
| `wEe` | `extractServedModelFromUsage` | inferred | 72650 | v0.8.1 |
| `AA` | `isChannelMessageEvent` | inferred | 72655 | v0.8.1 |
| `hJ` | `prepareDrainTurnContext` | inferred | 72658 | v0.3.7 |
| `NEe` | `buildTurnSdkRunConfig` | inferred | 72710 | v0.2.0 |
| `SEe` | `resolveDrainContextProfileOrRefuse` | inferred | 72726 | v0.7.0 |
| `ro` | `isNonNullObject` | inferred | 73744 | v0.2.0 |
| `sn` | `readStringProperty` | inferred | 73748 | v0.2.0 |
| `lJ` | `readNonNegativeNumberField` | inferred | 73753 | v0.5.10 |
| `gJ` | `extractPayloadMediaRefs` | inferred | 73759 | v0.2.0 |
| `L_t` | `mergeInterruptedContextTexts` | inferred | 74155 | v0.2.0 |
| `B_t` | `hasSkipRewindRecordSince` | inferred | 74176 | v0.5.6 |
| `xEe` | `markTurnSkippedFromSkipRecord` | inferred | 74182 | v0.8.0 |
| `OA` | `clearPendingOutboundAttachments` | inferred | 74185 | v0.2.0 |
| `yJ` | `readPendingOutboundAttachments` | inferred | 74188 | v0.2.0 |
| `_J` | `batchDrainItems` | inferred | 74192 | v0.2.0 |
| `zEe` | `loadDrainItemEventCached` | inferred | 74229 | v0.2.0 |
| `EEe` | `parseEventTimestampMs` | inferred | 74241 | v0.2.0 |
| `V_t` | `isMergeableDrainBatch` | inferred | 74247 | v0.8.1 |
| `W_t` | `isMergeableChannelMessageBatch` | inferred | 74251 | v0.2.0 |
| `UEe` | `hasUniformDrainCoalesceKey` | inferred | 74259 | v0.5.5 |
| `qEe` | `isWorkerTaskNotifyDelivery` | inferred | 74265 | v0.5.5 |
| `BEe` | `extractJobCompletePayload` | inferred | 74273 | v0.8.0 |
| `HEe` | `extractJobCompletionJobId` | inferred | 74279 | v0.8.0 |
| `REe` | `classifyDrainBatchClass` | inferred | 74286 |  |
| `G_t` | `computeDrainCoalesceKey` | inferred | 74294 | v0.2.0 |
| `Z_t` | `resolveEventSourceChannelId` | inferred | 74302 | v0.2.0 |
| `Y_t` | `collectJobCompletionReceipts` | inferred | 74328 | v0.8.1 |
| `X_t` | `renderCoalescedDrainPrompt` | inferred | 74356 | v0.8.1 |
| `WEe` | `createDrainExecutionEventRecorder` | inferred | 74368 | v0.2.0 |
| `IEe` | `renderTurnOutputText` | inferred | 74424 | v0.2.0 |
| `ebt` | `renderManualCompactNotice` | inferred | 74428 | v0.5.5 |
| `tbt` | `isStaleIdleCompactEvent` | inferred | 74434 | v0.5.10 |
| `TEe` | `countCompactGapIntervals` | inferred | 74439 | v0.5.10 |
| `PEe` | `buildCompactStatsRecord` | inferred | 74463 | v0.5.10 |
| `ibt` | `recordIdleCompactFireMetric` | inferred | 74496 | v0.5.10 |
| `obt` | `runHistoryControlCommand` | inferred | 74504 | v0.5.2 |
| `JEe` | `resolveReplyTargetSessionKeys` | inferred | 74526 | v0.2.0 |
| `Vc` | `emitDrainOutputRecords` | inferred | 74538 | v0.2.0 |
| `sbt` | `renderDrainErrorRuntimeHint` | inferred | 74595 | v0.5.6 |
| `zS` | `handleDrainError` | inferred | 74622 | v0.5.0 |
| `abt` | `clearModelOverrideOnRuntimeFlip` | inferred | 74678 | v0.5.6 |
| `ubt` | `resolvePendingModelFork` | inferred | 74695 | v0.5.6 |
| `lbt` | `describeWorkspaceProblem` | inferred | 74734 | v0.2.0 |
| `cbt` | `renderWorkspaceUnavailableNotice` | inferred | 74738 | v0.2.0 |
| `dbt` | `renderRuntimeUnavailableGuidance` | inferred | 74743 | v0.5.4 |
| `fbt` | `renderRuntimeMismatchGuidance` | inferred | 74751 | v0.8.3 |
| `$Ee` | `runDrainQueryAndCollectOutboundAttachments` | inferred | 74777 | v0.5.0 |
| `GEe` | `mergeOutboundAttachmentLists` | inferred | 74858 | v0.5.0 |
| `_bt` | `runDrainTurnWithResumeFallback` | inferred | 74868 | v0.2.0 |
| `US` | `initMailboxDrainRunnerModule` | inferred | 75000 | v0.2.0 |
| `sy` | `runQueueOutboundAttachmentTool` | inferred | 75660 | v0.2.0 |
| `VS` | `initQueueOutboundAttachmentModule` | inferred | 75691 | v0.2.0 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `qf` | `hasParentToolUseId` | inferred | 57103 | v0.5.7 |
| `vg` | `createAbortErrorWithCause` | inferred | 57109 | v0.2.0 |
| `aC` | `extractSdkMessageTextChunks` | inferred | 57114 | v0.3.0 |
| `uC` | `extractStreamTextDeltas` | inferred | 57147 | v0.3.0 |
| `lC` | `extractStreamThinkingText` | inferred | 57175 | v0.3.0 |
| `cC` | `parseToolUseBlockStart` | inferred | 57197 | v0.3.2 |
| `dC` | `parseInputJsonDelta` | inferred | 57212 | v0.3.2 |
| `fC` | `stringifyToolResultContent` | inferred | 57225 | v0.3.0 |
| `llt` | `selectDominantModelByInputTokens` | inferred | 57236 | v0.5.6 |
| `wg` | `mapClaudeResultToDrainUsage` | inferred | 57261 | v0.3.0 |
| `pC` | `resolveClaudeCostBaseline` | inferred | 57284 | v0.8.4 |
| `mC` | `buildClaudeCostBaseline` | inferred | 57293 | v0.8.4 |
| `q_e` | `findDeadAllowedToolEntries` | __export | 57343 | v0.5.10 |
| `B_e` | `splitDisallowedToolsForClaude` | __export | 57348 | v0.5.10 |
| `Aw` | `isAgentSdkTurnInterruptedError` | __export | 57358 |  |
| `Nw` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 57362 |  |
| `Ow` | `normalizeOptionalEnvString` | inferred | 57379 | v0.8.0 |
| `V_e` | `probeClaudeAvailability` | __export | 57388 | v0.5.3 |
| `XH` | `isClaudeAvailable` | __export | 57418 |  |
| `Dw` | `claudeUnavailableReason` | __export | 57422 | v0.5.3 |
| `mlt` | `primeClaudeAvailability` | __export | 57425 |  |
| `hlt` | `__resetClaudeProbeCacheForTest` | __export | 57429 |  |
| `glt` | `__setClaudeVerifierForTest` | __export | 57433 |  |
| `W_e` | `verifyClaudeCodeRuntimeAvailable` | __export | 57437 | v0.5.0 |
| `QH` | `eventToMessageGenerator` | __export | 57556 | v0.2.0 |
| `gC` | `stringToMessageGenerator` | __export | 57584 | v0.2.0 |
| `ZH` | `parsePositiveMsEnv` | __export | 57594 | v0.5.8 |
| `Slt` | `disableSystemPromptSnapshot` | inferred | 57600 | v0.8.1 |
| `Hf` | `createAgentSdkAdapter` | __export | 57611 | v0.5.10 |
| `Or` | `AgentSdkPromptNotAcceptedAbortError` | __export | 57916 |  |
| `qr` | `AgentSdkTurnInterruptedError` | __export | 57916 |  |
| `Sg` | `CLAUDE_CORE_TOOLS` | __export | 57916 |  |
| `Eo` | `initAgentSdkAdapterModule` | inferred | 57916 | v0.5.10 |
| `tmt` | `buildClaudeSettingsEnvOverrides` | inferred | 67698 | v0.7.0 |
| `fSe` | `materializeClaudeSettingsFile` | inferred | 67751 | v0.7.0 |
| `_S` | `computeContextProfileSignature` | inferred | 67762 | v0.7.0 |
| `bS` | `initMaterializedClaudeSettingsModule` | inferred | 67774 | v0.7.0 |
| `gSe` | `mergeClaudeToolLists` | inferred | 67806 |  |
| `$6` | `applyJobSdkConfigOverride` | inferred | 67936 | v0.6.2 |
| `Bxe` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 71225 | v0.5.1 |
| `$W` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 71294 |  |
| `up` | `resolveContextCapToken` | inferred | 71980 | v0.7.0 |
| `kA` | `describeContextProfileSource` | inferred | 71990 | v0.7.0 |
| `xA` | `extractProfiledEndpointFields` | inferred | 72004 | v0.7.0 |
| `EA` | `listSortedAliasKeys` | inferred | 72035 | v0.7.0 |
| `W0e` | `buildProfiledExternalRequirement` | inferred | 72044 | v0.7.0 |
| `nJ` | `classifyModelContextRequirement` | inferred | 72074 | v0.7.0 |
| `ty` | `selectProfileIssuesForModel` | inferred | 72100 | v0.7.0 |
| `ny` | `resolveClaudeContextRequirement` | inferred | 72216 | v0.7.0 |
| `FS` | `isClaudeRuntimeOrDefault` | inferred | 72310 |  |
| `TA` | `prepareClaudeContextProfile` | inferred | 72313 | v0.7.0 |
| `yEe` | `resolveAdditionalDirClaudeMdAutoload` | inferred | 72605 | v0.5.2 |
| `Ty` | `createAladuoMcpServer` | inferred | 82348 | v0.2.0 |
| `qTe` | `initAbortableAsyncQueueModule` | inferred | 85181 | v0.3.0 |
| `VTe` | `createClaudeStreamingSessionFactory` | inferred | 85339 | v0.8.0 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `s6` | `buildCodexDirectOnlyToolConfig` | inferred | 64226 |  |
| `Qf` | `isCodexAvailable` | __export | 64232 |  |
| `Sft` | `codexUnavailableReason` | __export | 64236 | v0.2.0 |
| `kft` | `primeCodexAvailability` | __export | 64239 | v0.5.0 |
| `xft` | `__setCodexAvailabilityForTests` | __export | 64244 |  |
| `Fg` | `resolveCodexSandbox` | __export | 64248 | v0.4.4 |
| `Dc` | `checkCodexAvailability` | __export | 64252 | v0.4.4 |
| `c6` | `ensureAgentsMdSymlink` | __export | 64289 | v0.4.4 |
| `twe` | `codexNotificationFilterDecision` | __export | 64299 | v0.5.4 |
| `iwe` | `buildBaseInstructions` | __export | 64331 | v0.4.4 |
| `owe` | `buildDeveloperInstructions` | __export | 64349 | v0.4.4 |
| `a6` | `buildCodexTurnInput` | __export | 64363 | v0.7.0 |
| `tS` | `createCodexAppServerAdapter` | __export | 64376 | v0.4.4 |
| `Rft` | `resolveCodexSandboxForPermissionMode` | inferred | 64838 | v0.4.4 |
| `eS` | `isCodexPlainObject` | inferred | 64851 | v0.5.0 |
| `swe` | `isImageGenerationItemType` | inferred | 64855 | v0.5.0 |
| `awe` | `hasImageGenerationRecord` | __export | 64862 | v0.5.7 |
| `uwe` | `extractCodexGeneratedImageAttachment` | __export | 64878 | v0.5.0 |
| `lwe` | `capitalizeFirstChar` | inferred | 64906 | v0.6.0 |
| `cwe` | `warnUnmappedCodexItemOnce` | inferred | 64929 | v0.6.0 |
| `dwe` | `mapItemStartedToExecEvent` | __export | 64937 | v0.4.4 |
| `fwe` | `mapItemCompletedToExecEvent` | __export | 65048 | v0.4.4 |
| `sO` | `ALADUO_TOOL_NAMESPACE` | __export | 65121 |  |
| `ep` | `initCodexAppServerModule` | inferred | 65121 | v0.5.3 |
| `Yyt` | `generatePartitionCodexAgents` | __export | 71619 | v0.5.3 |
| `F0e` | `parseAgentMarkdown` | __export | 71693 | v0.5.3 |
| `z0e` | `renderAgentToml` | __export | 71708 | v0.5.3 |
| `u_t` | `generateAllPartitionCodexAgents` | inferred | 71927 | v0.5.3 |
| `Py` | `buildCodexStringInputSchema` | inferred | 82475 | v0.4.4 |
| `PN` | `buildCodexDynamicTools` | inferred | 82495 | v0.4.4 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `NI` | `containsWhitespaceChar` | inferred | 38906 |  |
| `DI` | `isProviderQualifiedModelId` | inferred | 38910 | v0.8.0 |
| `KH` | `PARTITION_CORE_TOOLS` | __export | 57916 |  |
| `Zw` | `parseScheduleDurationMs` | inferred | 63390 | v0.6.1 |
| `XV` | `assertScheduleDurationRepresentable` | inferred | 63401 | v0.6.1 |
| `tO` | `isOneShotJobSchedule` | inferred | 63405 | v0.4.5 |
| `zve` | `validateJobScheduleExpression` | inferred | 63409 | v0.6.1 |
| `Kw` | `parseJobRearmTime` | inferred | 63426 | v0.5.6 |
| `Uve` | `isJobScheduleDue` | inferred | 63438 | v0.5.6 |
| `qve` | `isPathWithinDir` | inferred | 63494 | v0.8.5 |
| `uft` | `normalizeJobCwdRelText` | inferred | 63505 | v0.2.0 |
| `Vve` | `resolveJobCwdRel` | inferred | 63509 | v0.2.0 |
| `Jve` | `resolveJobExecutionWorkspace` | inferred | 63549 | v0.2.0 |
| `Gve` | `prepareJobExecutionWorkspace` | inferred | 63566 | v0.2.0 |
| `Ac` | `buildJobSessionKey` | inferred | 63616 | v0.2.0 |
| `Kve` | `parseJobFileFrontmatter` | inferred | 63638 | v0.2.0 |
| `mft` | `renderJobFileMarkdown` | inferred | 63659 | v0.2.0 |
| `ol` | `initJobManagerModule` | inferred | 63723 | v0.2.0 |
| `Xf` | `redactJobModelProfileTokens` | inferred | 64162 |  |
| `lO` | `renderManageJobToolDescription` | inferred | 66134 |  |
| `cO` | `renderJobSessionToolDescription` | inferred | 66141 |  |
| `npt` | `renderJobPromptModeDescription` | inferred | 66152 | v0.8.0 |
| `rpt` | `renderJobExtraToolsDescription` | inferred | 66159 | v0.8.0 |
| `Rwe` | `buildJobPromptModeExtraToolsSchema` | inferred | 66163 | v0.8.0 |
| `apt` | `listSelectableJobRuntimes` | inferred | 66170 | v0.5.4 |
| `Twe` | `buildJobRuntimeSchemaField` | inferred | 66179 | v0.5.4 |
| `dO` | `buildManageJobInputSchema` | inferred | 66187 |  |
| `fO` | `buildJobSessionInputSchema` | inferred | 66196 |  |
| `qg` | `runManageJobTool` | inferred | 66204 | v0.2.0 |
| `sS` | `initManageJobToolModule` | inferred | 66343 | v0.8.0 |
| `Bwe` | `classifyConsumerStaleness` | inferred | 66826 | v0.8.2 |
| `S6` | `resolveNotifyUnconsumedHours` | inferred | 66839 | v0.8.2 |
| `k6` | `initNotifyConsumerStalenessModule` | inferred | 66845 | v0.8.2 |
| `Bg` | `evaluateNotifyConsumerRefusal` | inferred | 66853 | v0.8.2 |
| `Tpt` | `listSessionsWithRecentConsumer` | inferred | 66876 | v0.8.2 |
| `bO` | `renderNotifyRefusalMessage` | inferred | 66902 | v0.8.2 |
| `Vg` | `runRemindDuoduoTool` | inferred | 67056 | v0.8.2 |
| `mS` | `initRemindDuoduoToolModule` | inferred | 67089 | v0.8.2 |
| `TO` | `normalizeNotifyChannelTarget` | inferred | 67102 | v0.8.0 |
| `sSe` | `isJobSessionKeyKind` | inferred | 67296 | v0.2.0 |
| `CO` | `renderNotifyToolDescription` | inferred | 67330 | v0.2.0 |
| `OO` | `buildNotifyInputSchema` | inferred | 67349 | v0.2.0 |
| `aSe` | `isOrphanJobSessionKey` | inferred | 67375 | v0.6.2 |
| `Vpt` | `computeBoundedEditDistance` | inferred | 67412 | v0.5.0 |
| `Wpt` | `matchNearMissSessionKey` | inferred | 67431 | v0.5.0 |
| `tSe` | `groupNotifyTargetCandidates` | inferred | 67473 | v0.5.0 |
| `nSe` | `renderNotifyTargetCandidateLines` | inferred | 67491 | v0.5.0 |
| `Gpt` | `resolveJobOwnerNotifyTarget` | inferred | 67511 | v0.2.0 |
| `Zpt` | `resolveNotifyTargetSessionKey` | inferred | 67520 | v0.2.0 |
| `rSe` | `renderNotifyDeliveryReport` | inferred | 67553 | v0.2.0 |
| `Jg` | `runNotifyTool` | inferred | 67567 | v0.2.0 |
| `yS` | `initNotifyToolModule` | inferred | 67669 | v0.2.0 |
| `IS` | `loadSubconsciousPartitions` | inferred | 68545 | v0.2.0 |
| `Hmt` | `parsePartitionDefinition` | inferred | 68569 | v0.2.0 |
| `Gg` | `readPlaylistRound` | inferred | 68610 | v0.2.0 |
| `Vmt` | `parsePlaylistCurrentRound` | inferred | 68628 | v0.2.0 |
| `BO` | `markPlaylistItemExecuted` | inferred | 68647 | v0.2.0 |
| `wke` | `rebuildPlaylistRound` | inferred | 68665 | v0.2.0 |
| `Ske` | `readPartitionInboxEntries` | inferred | 68709 | v0.2.0 |
| `HO` | `initSubconsciousPlaylistModule` | inferred | 68752 | v0.2.0 |
| `xke` | `resolvePartitionStatePath` | inferred | 68772 | v0.3.1 |
| `ip` | `readPartitionRunState` | inferred | 68775 | v0.3.1 |
| `Y6` | `writePartitionRunState` | inferred | 68798 |  |
| `X6` | `isPartitionBackedOff` | inferred | 68802 | v0.3.1 |
| `Q6` | `computePartitionBackoffUntil` | inferred | 68806 | v0.3.1 |
| `VO` | `initPartitionRunStateModule` | inferred | 68818 | v0.3.1 |
| `Nxe` | `resolveCadenceIntervalMs` | __export | 70926 | v0.8.0 |
| `Uyt` | `computeLegacyJobSessionKey` | inferred | 71418 | v0.8.0 |
| `qyt` | `rewriteSessionKeyInStateAndMeta` | inferred | 71439 | v0.8.0 |
| `$0e` | `migrateLegacyJobSessionKeys` | inferred | 71473 | v0.8.0 |
| `N0e` | `retireListedPartitions` | inferred | 71525 | v0.8.0 |
| `Jyt` | `retirePartitionOnce` | inferred | 71538 | v0.8.0 |
| `D0e` | `initPartitionRetirementModule` | inferred | 71590 | v0.8.0 |
| `rTe` | `isAutoArchivedJobSchedule` | inferred | 82665 | v0.4.0 |
| `wk` | `classifyJobScheduleType` | inferred | 82669 |  |
| `KTe` | `normalizePartitionOutputText` | inferred | 88176 | v0.2.0 |
| `wkt` | `stringifyPartitionToolInput` | inferred | 88181 | v0.2.0 |
| `kkt` | `detectEmptyRequiredPartitionOutput` | inferred | 88191 | v0.2.0 |
| `xkt` | `appendPartitionToolEvent` | inferred | 88194 | v0.2.0 |
| `Ekt` | `hashActivityFingerprint` | inferred | 88233 | v0.2.0 |
| `Rkt` | `readLatestExternalEventId` | inferred | 88236 | v0.5.3 |
| `JN` | `readNewestMtimeRecursive` | inferred | 88255 | v0.5.3 |
| `Ikt` | `renderPartitionRuntimeContext` | inferred | 88281 | v0.2.0 |
| `Tkt` | `renderPartitionInboxSection` | inferred | 88288 | v0.5.3 |
| `XTe` | `initMetaSessionModule` | inferred | 88849 | v0.8.0 |
| `Ckt` | `runCadenceTick` | __export | 88944 | v0.2.0 |
| `cZ` | `scanAndSpawnDueJobs` | __export | 88975 | v0.2.0 |
| `Okt` | `fireDueWakeRecords` | inferred | 89066 | v0.8.2 |
| `Nkt` | `createJobScheduler` | __export | 89136 | v0.2.0 |
| `oPe` | `initJobSchedulerModule` | inferred | 89192 | v0.2.0 |
| `Dkt` | `isJobOrMetaOutboxRecord` | inferred | 89203 | v0.2.0 |
| `Mkt` | `createOutboxDeliveryManager` | __export | 89207 | v0.2.0 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `RS` | `partitionInboxDir` | __export | 68530 |  |
| `Lc` | `partitionInboxDirFromVar` | __export | 68534 | v0.5.3 |
| `Mi` | `resolveMemoryDirs` | inferred | 68834 | v0.5.5 |
| `GO` | `bytesToKibCeil` | inferred | 68844 | v0.5.5 |
| `op` | `scanWikiLinkOccurrences` | inferred | 68848 | v0.5.5 |
| `sp` | `resolveMemoryLinkTargets` | inferred | 68873 | v0.5.5 |
| `Nr` | `compareStringsAscending` | inferred | 68879 |  |
| `Eke` | `countDatedStampLines` | inferred | 68883 |  |
| `ZO` | `countNewlineChars` | inferred | 68890 |  |
| `Zo` | `splitLinesDropTrailingEmpty` | inferred | 68897 | v0.5.5 |
| `To` | `recordUnreadableMemoryPath` | inferred | 68912 | v0.7.1 |
| `Pn` | `readMemoryFileSyncOrNull` | inferred | 68924 |  |
| `Fc` | `isMemoryPathFile` | inferred | 68932 | v0.5.5 |
| `Kg` | `isMemoryPathDirectory` | inferred | 68940 | v0.5.5 |
| `au` | `listMarkdownSlugsSync` | inferred | 68948 | v0.5.5 |
| `KO` | `measureUtf8ByteLength` | inferred | 68960 | v0.5.5 |
| `Pke` | `normalizeSignalKindVersion` | inferred | 68968 | v0.5.6 |
| `Ko` | `initMemorySignalKindsModule` | inferred | 68972 | v0.5.6 |
| `Xmt` | `parseEffectivenessTrajectory` | inferred | 68991 | v0.5.5 |
| `Qmt` | `parseEffectivenessCounts` | inferred | 69001 | v0.5.5 |
| `eht` | `parseUpdaterGuidanceVerdict` | inferred | 69020 | v0.5.5 |
| `tht` | `classifyTopicNodeFormat` | inferred | 69040 | v0.5.5 |
| `nht` | `classifyTopicNodeType` | inferred | 69048 | v0.5.5 |
| `$ke` | `rankEffectivenessTrajectory` | inferred | 69059 | v0.5.5 |
| `rht` | `compareBoardLintTargets` | inferred | 69072 | v0.5.5 |
| `Cke` | `collectBoardLintReport` | inferred | 69123 | v0.5.5 |
| `uht` | `buildBoardLintTarget` | inferred | 69156 | v0.5.5 |
| `lht` | `runBoardLint` | inferred | 69187 | v0.5.5 |
| `Oke` | `initBoardLintModule` | inferred | 69209 | v0.5.5 |
| `iW` | `isSafeMemorySlug` | inferred | 69217 | v0.5.5 |
| `zc` | `createMemorySlugReader` | inferred | 69221 | v0.5.5 |
| `Uc` | `walkReachableMemory` | inferred | 69236 | v0.5.5 |
| `fht` | `renderEntityConvergeSignalBody` | inferred | 69279 | v0.5.5 |
| `Mke` | `runEntityLint` | inferred | 69287 | v0.5.5 |
| `jke` | `initEntityLintModule` | inferred | 69327 | v0.5.5 |
| `mht` | `isAllowedNodeSection` | inferred | 69337 | v0.5.5 |
| `ght` | `renderNodeConvergeSignalBody` | inferred | 69352 | v0.5.5 |
| `Lke` | `runNodeLint` | inferred | 69364 | v0.5.5 |
| `YO` | `buildNodeSignalKey` | inferred | 69413 |  |
| `Fke` | `initNodeLintModule` | inferred | 69423 |  |
| `CS` | `initGapSpanModule` | inferred | 69559 | v0.8.4 |
| `OS` | `readPartitionContract` | inferred | 69567 | v0.5.6 |
| `tA` | `getCachedPartitionContract` | inferred | 69658 | v0.5.6 |
| `nA` | `postMemorySignalsToInboxes` | inferred | 69664 | v0.5.6 |
| `rA` | `enforceContractGate` | inferred | 69717 | v0.5.6 |
| `Jke` | `reconcileMemorySignalInboxes` | inferred | 69748 | v0.7.1 |
| `Gke` | `hasAnyMemorySignalConsumer` | inferred | 69791 | v0.5.6 |
| `Zke` | `isOrphanWarningDeliverable` | inferred | 69800 |  |
| `pW` | `initMemorySignalDeliveryModule` | inferred | 69803 |  |
| `sA` | `recordUnreadableUnlessMissing` | inferred | 69825 |  |
| `Nht` | `listMemoryFragmentDates` | inferred | 69850 | v0.8.0 |
| `Lht` | `readOrSeedGapHandedDays` | inferred | 69907 | v0.8.0 |
| `Yke` | `appendGapHandedSpan` | inferred | 69949 | v0.8.0 |
| `Xke` | `readGapLintDayEvents` | inferred | 69957 | v0.8.0 |
| `exe` | `mergeContiguousHourRanges` | inferred | 69998 | v0.5.8 |
| `zht` | `renderScanGapSignalBody` | inferred | 70017 | v0.5.8 |
| `Uht` | `buildScanGapSignal` | inferred | 70023 | v0.8.0 |
| `oA` | `buildGapReadFaultResult` | inferred | 70032 | v0.8.0 |
| `qht` | `runGapLint` | inferred | 70050 | v0.8.0 |
| `oxe` | `deliverScanGapSignal` | inferred | 70086 | v0.8.0 |
| `sxe` | `initGapLintModule` | inferred | 70130 | v0.8.0 |
| `hW` | `readMemoryMaxLinesLimit` | inferred | 70194 |  |
| `cxe` | `runBroadcastBudgetLint` | inferred | 70204 | v0.8.0 |
| `gW` | `initBroadcastBudgetLintModule` | inferred | 70243 | v0.5.3 |
| `rgt` | `listEventPartitionDates` | inferred | 70256 | v0.8.0 |
| `ogt` | `scanActivationWindowTouches` | inferred | 70283 | v0.8.0 |
| `sgt` | `renderActivationReportHeader` | inferred | 70360 | v0.8.0 |
| `agt` | `renderBoardTemperatureSection` | inferred | 70365 | v0.8.0 |
| `ugt` | `renderHotOrphansSection` | inferred | 70375 | v0.8.0 |
| `lgt` | `renderActivationReportBody` | inferred | 70382 |  |
| `mxe` | `runActivationLint` | inferred | 70388 | v0.8.0 |
| `SW` | `initActivationLintModule` | inferred | 70487 | v0.8.0 |
| `_xe` | `readIntuitionWeaverLastFinishedMs` | inferred | 70497 | v0.8.0 |
| `cgt` | `findNewestFragmentMtimeMs` | inferred | 70503 | v0.8.0 |
| `dgt` | `renderFoldGapBody` | inferred | 70533 | v0.8.0 |
| `bxe` | `runFoldGapLint` | inferred | 70539 | v0.8.0 |
| `vxe` | `initFoldGapLintModule` | inferred | 70556 |  |
| `hgt` | `extractBoardSlugLinks` | inferred | 70565 | v0.5.3 |
| `_gt` | `formatSlugLinkLocations` | inferred | 70588 | v0.5.3 |
| `wxe` | `runBroadcastLinkLint` | inferred | 70602 | v0.8.0 |
| `Sxe` | `initBroadcastLinkLintModule` | inferred | 70623 |  |
| `Egt` | `findBoardHeadingLines` | inferred | 70630 | v0.8.0 |
| `kxe` | `runBroadcastFlattenLint` | inferred | 70655 | v0.8.0 |
| `xxe` | `initBroadcastFlattenLintModule` | inferred | 70676 |  |
| `Tgt` | `computeOrphanTopicNodes` | inferred | 70694 | v0.5.5 |
| `Ixe` | `detectOrphanMemory` | inferred | 70743 | v0.5.5 |
| `Txe` | `buildOrphanNewbornSignals` | inferred | 70766 | v0.5.5 |
| `Pxe` | `forgetMemoryEntry` | inferred | 70775 | v0.5.5 |
| `Pgt` | `resolveGitToplevelSync` | inferred | 70811 | v0.5.5 |
| `$gt` | `renderOrphanIslandsBody` | inferred | 70825 | v0.5.5 |
| `$xe` | `filterOrphanIslands` | inferred | 70839 | v0.5.5 |
| `Cxe` | `buildOrphanIslandsSignal` | inferred | 70843 | v0.5.5 |
| `Cgt` | `computeMemoryLinkIndegree` | inferred | 70852 | v0.5.5 |
| `Ogt` | `listMemorySlugReferrers` | inferred | 70863 | v0.5.5 |
| `kW` | `routeContractDecision` | inferred | 70880 | v0.5.5 |
| `Ngt` | `formatForgetCommitMessage` | inferred | 70892 | v0.5.5 |
| `Oxe` | `initOrphanMemoryModule` | inferred | 70895 | v0.5.5 |
| `EW` | `isTruthyEnvFlag` | inferred | 70912 | v0.5.5 |
| `IW` | `resolveMemoryCheckFlags` | __export | 70917 | v0.5.5 |
| `TW` | `buildMemoryCheckStatus` | __export | 70933 | v0.5.6 |
| `Dgt` | `runMemoryCheckTick` | __export | 70947 | v0.5.5 |
| `RW` | `runMemoryCheckSubStep` | inferred | 71063 | v0.7.1 |
| `pa` | `runReadAuditedMemoryCheckStep` | inferred | 71071 | v0.7.1 |
| `Mgt` | `evaluatePredicateOrFalse` | inferred | 71078 |  |
| `PW` | `initMemoryCheckTickModule` | inferred | 71085 |  |
| `GW` | `runKernelGitCommand` | inferred | 71323 | v0.2.0 |
| `x0e` | `buildKernelGitEnv` | inferred | 71341 | v0.2.0 |
| `E0e` | `buildSafeDirectoryGitArgs` | inferred | 71353 |  |
| `Fyt` | `isKernelGitToplevel` | inferred | 71356 | v0.2.0 |
| `R0e` | `ensureKernelGitRepo` | inferred | 71369 | v0.2.0 |
| `zyt` | `mergeKernelGitignoreEntries` | inferred | 71378 | v0.2.0 |
| `I0e` | `initKernelGitModule` | inferred | 71397 | v0.2.0 |
| `nZ` | `computeBoardLayerHash` | __export | 84783 | v0.5.10 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Pi` | `isEffortLevel` | inferred | 33615 |  |
| `OR` | `isAgentRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33751 |  |
| `KR` | `isKnownRuntimeValue` | inferred | 33875 |  |
| `jb` | `isSupportedRuntime` | inferred | 33879 |  |
| `qU` | `validateKnownRuntimeValue` | inferred | 33883 | v0.8.4 |
| `Xd` | `validateRunnableRuntimeValue` | inferred | 33896 | v0.8.4 |
| `yo` | `resolveDefaultRuntime` | inferred | 33910 | v0.7.1 |
| `Fu` | `initRuntimeValidationModule` | inferred | 33919 | v0.8.4 |
| `tc` | `attachStreamLineReader` | inferred | 33962 | v0.8.0 |
| `cle` | `parseLogLevelName` | inferred | 34088 | v0.2.0 |
| `Jm` | `parseEnvBooleanFlag` | inferred | 34094 | v0.2.0 |
| `jQe` | `resolveLogLevel` | inferred | 34107 | v0.3.3 |
| `LQe` | `isLogLevelEnabled` | inferred | 34111 |  |
| `FQe` | `formatLogPrefix` | inferred | 34115 | v0.2.0 |
| `Qd` | `writeLogLine` | inferred | 34119 | v0.2.0 |
| `Ue` | `logErrorMessage` | inferred | 34123 | v0.2.0 |
| `Z` | `logWarnMessage` | inferred | 34127 | v0.2.0 |
| `ie` | `logInfoMessage` | inferred | 34131 | v0.2.0 |
| `xe` | `logDebugMessage` | inferred | 34135 | v0.2.0 |
| `dle` | `logTraceMessage` | inferred | 34139 |  |
| `zQe` | `isSessionLifecycleLoggingEnabled` | inferred | 34143 | v0.2.0 |
| `ut` | `logSessionLifecycleMessage` | inferred | 34147 | v0.2.0 |
| `vt` | `logAlwaysAtLevel` | inferred | 34151 | v0.2.0 |
| `pt` | `initLogLevelModule` | inferred | 34156 | v0.2.0 |
| `yet` | `appendTelemetryRecord` | inferred | 34996 | v0.3.0 |
| `_et` | `isTelemetryEnabled` | inferred | 35001 | v0.4.5 |
| `_o` | `logLatencyStageTelemetry` | inferred | 35009 | v0.2.0 |
| `bs` | `recordTelemetryMetric` | inferred | 35017 | v0.3.0 |
| `Gi` | `formatYamlErrorMessage` | inferred | 37171 | v0.7.0 |
| `iv` | `normalizePromptMode` | inferred | 37217 | v0.2.0 |
| `ov` | `parseClaudeFrontmatterBlock` | inferred | 37418 | v0.5.10 |
| `uh` | `listFrontmatterKeyAliases` | inferred | 37532 |  |
| `Eq` | `parseSdkConfigFrontmatter` | inferred | 37536 | v0.2.0 |
| `Jrt` | `parseChannelRuntimeField` | inferred | 37550 | v0.8.4 |
| `Ba` | `resolveLayeredChannelRuntime` | inferred | 37559 | v0.8.4 |
| `RI` | `parseChannelConfigFields` | inferred | 37596 | v0.2.0 |
| `di` | `loadGlobalRuntimeConfig` | inferred | 38854 | v0.7.0 |
| `Ga` | `loadChannelKindConfig` | inferred | 38882 | v0.7.0 |
| `Za` | `initChannelConfigLoaderModule` | inferred | 38898 |  |
| `cmt` | `buildEffectiveRuntimeFields` | inferred | 67791 | v0.8.4 |
| `LO` | `foldConfigLayersByKey` | inferred | 67810 | v0.7.0 |
| `bSe` | `mergeRuntimeModelLayers` | inferred | 67839 | v0.8.1 |
| `vSe` | `mergeRuntimeEffortLayers` | inferred | 67849 | v0.8.1 |
| `vS` | `readRuntimeModelSetting` | inferred | 67859 |  |
| `wS` | `readRuntimeEffortSetting` | inferred | 67863 |  |
| `iu` | `mergeGlobalModelConfigLayers` | inferred | 67877 | v0.7.0 |
| `P6` | `overlayConfigEntriesByKey` | inferred | 67913 |  |
| `SSe` | `appendPiConfigIssues` | inferred | 67957 |  |
| `kSe` | `buildEffectiveChannelConfig` | inferred | 67961 | v0.2.0 |
| `ou` | `resolveEffectiveChannelConfig` | inferred | 68056 | v0.2.0 |
| `SS` | `isBusinessSourceKind` | inferred | 68071 |  |
| `C6` | `resolveEffectiveChannelConfigForEvent` | inferred | 68084 | v0.2.0 |
| `su` | `resolveChannelConfigBySession` | inferred | 68101 | v0.5.10 |
| `_ke` | `resolveRuntimePaths` | __export | 68445 | v0.4.3 |
| `cA` | `parseDotEnv` | __export | 71128 | v0.3.3 |
| `ll` | `hostDotEnvPath` | __export | 71143 | v0.4.3 |
| `Fxe` | `removeHostModelEnvLines` | inferred | 71163 |  |
| `zxe` | `removeDotEnvKeyLines` | inferred | 71170 | v0.5.1 |
| `dA` | `writeHostDotEnvLines` | inferred | 71182 | v0.4.3 |
| `OW` | `clearHostModelEnvVars` | __export | 71206 |  |
| `Uxe` | `applyHostModelEnvVars` | __export | 71210 | v0.4.3 |
| `qxe` | `writeHostModelEnvConfig` | __export | 71213 | v0.4.3 |
| `Hxe` | `clearHostModelEnvConfig` | __export | 71238 | v0.4.3 |
| `qgt` | `readHostDaemonToken` | __export | 71249 | v0.7.0 |
| `Bgt` | `writeHostDaemonToken` | __export | 71261 | v0.7.0 |
| `Vxe` | `readHostDotEnvFile` | __export | 71272 | v0.4.3 |
| `Hgt` | `loadHostDotEnv` | __export | 71281 | v0.4.3 |
| `CW` | `HOST_MODEL_ENV_KEYS` | __export | 71294 |  |
| `Ms` | `pathExistsAsync` | inferred | 71302 | v0.2.0 |
| `r_t` | `isDirEmptyOrMissing` | inferred | 71834 | v0.2.0 |
| `QW` | `copyDirTreeOverwrite` | inferred | 71842 | v0.2.0 |
| `eJ` | `copyDirTreeMissingOnly` | inferred | 71853 | v0.2.0 |
| `o_t` | `refreshBootstrapDuoduoMdFiles` | inferred | 71864 | v0.2.0 |
| `s_t` | `copyBootstrapIntoKernel` | inferred | 71879 | v0.2.0 |
| `a_t` | `initializeRuntime` | __export | 71917 | v0.2.0 |
| `V0e` | `initRuntimeInitializationModule` | inferred | 71950 | v0.2.0 |
| `vJ` | `encodePiWorkerFrame` | inferred | 75047 |  |
| `qS` | `resolvePiWorkerCommand` | inferred | 75116 | v0.8.0 |
| `kbt` | `buildPiSystemPromptSpec` | inferred | 75128 | v0.8.0 |
| `MA` | `createPiWorkerAdapter` | inferred | 75153 | v0.8.0 |
| `lRe` | `parsePiToolResultDetails` | inferred | 75734 | v0.8.0 |
| `cRe` | `handlePiToolEndObservation` | inferred | 75740 | v0.8.0 |
| `D6` | `CHANNEL_CONFIG_KEY_TYPES` | inferred | 90430 |  |
| `gmt` | `validateConfigValue` | inferred | 90468 | v0.5.10 |
| `YSe` | `writeInstanceModelAlias` | inferred | 90963 |  |
| `Vgt` | `isClaudeAuthSource` | inferred | 91562 | v0.4.3 |
| `NW` | `readClaudeAuthSourceEnv` | inferred | 91566 | v0.4.3 |
| `Wn` | `resolveEnvConfigEntry` | inferred | 92647 | v0.3.3 |
| `Wkt` | `buildSdkConfigReport` | inferred | 92678 | v0.4.3 |
| `Jkt` | `buildSystemConfigReport` | inferred | 92696 | v0.3.3 |
| `mPe` | `formatLayerModelAliases` | inferred | 93732 | v0.7.0 |
| `hZ` | `formatModelConfigIssues` | inferred | 93755 | v0.7.0 |
| `Oy` | `appendConfigChangedEvent` | inferred | 93970 | v0.5.10 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `h6` | `isGrokAvailable` | __export | 65360 |  |
| `Cft` | `grokUnavailableReason` | __export | 65364 |  |
| `Oft` | `primeGrokAvailability` | __export | 65367 | v0.7.1 |
| `Aft` | `__setGrokAvailabilityForTests` | __export | 65372 |  |
| `Mc` | `checkGrokAvailability` | __export | 65375 | v0.7.1 |
| `rS` | `grokAcpExtMethod` | __export | 65396 |  |
| `Ni` | `coerceToPlainObject` | inferred | 65405 | v0.7.1 |
| `Swe` | `collectGrokToolCallNames` | inferred | 65448 | v0.7.1 |
| `Fft` | `isGrokSkipToolCall` | inferred | 65457 |  |
| `zft` | `mapGrokUsageToDrainUsage` | inferred | 65461 | v0.7.1 |
| `iS` | `createGrokAcpAdapter` | __export | 65520 | v0.7.1 |
| `_we` | `GROK_ACP_COMPACT` | __export | 66078 |  |
| `gwe` | `GROK_ACP_EXT_PREFIX` | __export | 66078 |  |
| `ywe` | `GROK_ACP_SDK_CALL` | __export | 66078 |  |
| `hwe` | `GROK_AGENT_PROFILE` | __export | 66078 |  |
| `mwe` | `GROK_DISALLOWED_TOOLS` | __export | 66078 |  |
| `bwe` | `GROK_MCP_SDK_META` | __export | 66078 |  |
| `vwe` | `GROK_MCP_SERVERS_META` | __export | 66078 |  |
| `wwe` | `GROK_MCP_SERVER_NAME` | __export | 66078 |  |
| `Ug` | `initGrokAcpRuntimeModule` | inferred | 66078 | v0.7.1 |
