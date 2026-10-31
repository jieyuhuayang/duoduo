# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*；其中标注 *published source* 的名字是上游在同作者的公开源码包里的拼写，由 `maps/published_daemon.json` 记录；标注 *historical export* 的名字是上游在旧版本 `__export` 块里的拼写，经版本配对追到本版本，由 `maps/historical_daemon.json` 记录）。“原行号”指反混淆后的 `daemon.pretty.js`。“首见版本”是 npm 上最早含有该声明的发行版（`maps/history_daemon.json`，由 `tools/history.sh` 逐版本配对得出）。

共 863 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.7。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `fI` | `statusPath` | inferred, historical export (v0.2.0..v0.3.7) | 34178 | v0.2.0 |
| `qU` | `buildInitialStatus` | inferred, historical export (v0.2.0..v0.3.7) | 34182 | v0.2.0 |
| `BU` | `writeStatus` | inferred, historical export (v0.2.0..v0.3.7) | 34209 | v0.2.0 |
| `Yb` | `readStatus` | inferred, historical export (v0.2.0..v0.3.7) | 34212 | v0.2.0 |
| `Hu` | `updateStatus` | inferred, historical export (v0.2.0..v0.3.7) | 34220 | v0.2.0 |
| `Cq` | `replaceSessionIndexEntry` | inferred | 38142 |  |
| `bfe` | `createVoidAwareAttachmentCallbacks` | inferred | 38172 | v0.8.4 |
| `Jft` | `daemonRestartReasonPath` | inferred | 67359 | v0.6.2 |
| `ESe` | `claimDaemonRestartReason` | inferred | 67362 | v0.6.2 |
| `RSe` | `setPendingRestartReason` | inferred | 67388 |  |
| `ISe` | `getPendingRestartReason` | inferred | 67392 | v0.8.0 |
| `$Se` | `renderRestartWakeMessage` | inferred | 67434 | v0.8.0 |
| `F6` | `resolveRuntimeWriterLockPath` | inferred | 90697 | v0.2.0 |
| `opt` | `isProcessAliveByPid` | inferred | 90701 | v0.2.0 |
| `spt` | `computeHostBootId` | inferred | 90711 | v0.3.0 |
| `FSe` | `getCachedHostBootId` | inferred | 90728 |  |
| `apt` | `isRuntimeWriterLockStale` | inferred | 90732 | v0.3.0 |
| `U6` | `acquireRuntimeWriterLock` | inferred | 90744 | v0.2.0 |
| `zSe` | `refreshRuntimeWriterLockHeartbeat` | inferred | 90792 | v0.2.0 |
| `VO` | `releaseRuntimeWriterLock` | inferred | 90797 | v0.2.0 |
| `zTe` | `readEnvIntegerOrFallback` | inferred | 91986 | v0.2.0 |
| `vSt` | `computeRuntimeId` | inferred | 92166 | v0.2.0 |
| `ISt` | `reconcileMainSession` | __export | 92422 |  |
| `CSt` | `deliverDaemonRestartWakes` | __export | 92710 | v0.8.0 |
| `qSt` | `parseHostHeaderHostname` | inferred | 93495 | v0.7.0 |
| `BSt` | `parseOriginHostname` | inferred | 93505 |  |
| `JSt` | `createDaemon` | __export | 93555 | v0.2.0 |
| `GSt` | `main` | __export | 94601 | v0.2.0 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `ws` | `iterateStreamLines` | inferred | 33096 | v0.8.0 |
| `Ki` | `stringifyJsonlRecord` | inferred | 33130 | v0.8.0 |
| `Uu` | `memoizeIndexLoad` | inferred | 33137 | v0.8.0 |
| `qu` | `isIndexLoadStillCurrent` | inferred | 33142 | v0.8.0 |
| `Dt` | `writeFileAtomic` | inferred | 33154 | v0.2.0 |
| `Bt` | `writeJsonFileAtomic` | inferred | 33170 | v0.2.0 |
| `Ne` | `ensureDirectoryExists` | inferred | 33183 | v0.2.0 |
| `iXe` | `enqueuePartitionAppend` | inferred | 33289 | v0.2.0 |
| `oXe` | `generateSpineEventId` | inferred | 33294 | v0.2.0 |
| `Gm` | `formatEventPartitionName` | inferred | 33298 | v0.2.0 |
| `nn` | `createSpineEvent` | inferred | 33302 | v0.2.0 |
| `aXe` | `appendEventToPartition` | inferred | 33309 | v0.2.0 |
| `Ub` | `resolveEventIdIndexPath` | inferred | 33332 | v0.2.0 |
| `uXe` | `appendEventIdIndexEntry` | inferred | 33335 | v0.2.0 |
| `rn` | `atomicAppendEvent` | inferred | 33344 | v0.2.0 |
| `Mo` | `readEventById` | inferred | 33353 | v0.3.1 |
| `lXe` | `readEventAtIndexedOffset` | inferred | 33361 | v0.3.1 |
| `cXe` | `scanPartitionsForEventId` | inferred | 33379 | v0.2.0 |
| `qb` | `lookupEventIdIndexEntry` | inferred | 33396 | v0.2.0 |
| `dXe` | `getOrCreateEventIdIndexCache` | inferred | 33410 | v0.2.0 |
| `fXe` | `isUsableEventIndexEntry` | inferred | 33420 | v0.8.2 |
| `pXe` | `loadEventIdIndex` | inferred | 33423 | v0.2.0 |
| `zue` | `findEventInPartitionFile` | inferred | 33460 |  |
| `Uue` | `readSpineIndexRetentionDays` | inferred | 33474 | v0.8.0 |
| `que` | `pruneEventIdIndexByRetention` | inferred | 33480 | v0.8.0 |
| `jo` | `initSpineEventLogModule` | inferred | 33522 | v0.8.0 |
| `FXe` | `resolveConsumerOffsetPath` | inferred | 34153 | v0.2.0 |
| `zXe` | `writeConsumerOffsetFile` | inferred | 34156 | v0.2.0 |
| `Vu` | `advanceConsumerWatermark` | inferred | 34159 | v0.2.0 |
| `lI` | `spineEventDedupStore` | inferred | 88526 | v0.2.0 |
| `cI` | `computeDedupKey` | inferred | 88586 | v0.2.0 |
| `_v` | `loadRegistryDedupStore` | inferred | 88749 | v0.2.0 |
| `q6` | `readPartitionByteRange` | inferred | 90811 | v0.8.2 |
| `cpt` | `iteratePartitionLinesBackward` | inferred | 90823 | v0.8.2 |
| `dpt` | `resolveTailCursorEndOffset` | inferred | 90835 | v0.8.2 |
| `USe` | `readPartitionTail` | inferred | 90850 | v0.8.2 |
| `qSe` | `readSpineTail` | inferred | 90889 | v0.3.2 |
| `Qht` | `shouldKeepRouteDeliverEvent` | inferred | 91840 | v0.8.4 |
| `zxe` | `stripSpineEventToEnvelope` | inferred | 91844 | v0.8.4 |
| `egt` | `redactSpineEventForExternal` | inferred | 91858 | v0.8.4 |
| `tgt` | `checkReservedRecordSource` | inferred | 91903 | v0.8.4 |
| `Bxe` | `recordExternalSpineEvent` | inferred | 91914 | v0.8.4 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `jb` | `isJsonRpcRequest` | inferred | 32712 | v0.2.0 |
| `lt` | `isRecord` | inferred, published source (@openduo/protocol@0.8.4 rpc.ts) | 32718 | v0.2.0 |
| `Ci` | `isOptionalString` | inferred, published source (@openduo/protocol@0.8.4 rpc.ts) | 32722 | v0.2.0 |
| `vU` | `initProtocolEffortModule` | inferred, published source (@openduo/protocol@0.8.4 effort.ts) | 32732 | v0.8.0 |
| `_R` | `isSystemRuntimeInfo` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32737 | v0.2.0 |
| `bR` | `isRuntimeInfoParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32741 | v0.2.0 |
| `vR` | `isSessionArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32748 | v0.5.0 |
| `wU` | `isSessionListKind` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32752 | v0.5.4 |
| `wR` | `isSessionListParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32756 | v0.5.4 |
| `SR` | `isSessionSetAliasParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32760 | v0.5.4 |
| `kR` | `isSessionWakeParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32764 | v0.8.2 |
| `xR` | `isSessionNotifyParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32768 | v0.5.4 |
| `ER` | `isSessionModelParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32772 | v0.8.0 |
| `RR` | `isSessionEffortParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32776 | v0.8.0 |
| `IR` | `isSessionCompactParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32780 | v0.5.8 |
| `TR` | `isSessionConfigParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32784 | v0.5.10 |
| `H7e` | `isNonEmptyText` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32796 | v0.8.4 |
| `SU` | `unknownKeyProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32800 | v0.8.4 |
| `Tue` | `textKeysProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32805 | v0.8.4 |
| `Bm` | `renderParamsProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32813 | v0.8.4 |
| `Pue` | `describeConversationProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32820 |  |
| `kU` | `describeMemoryReadProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32824 |  |
| `xU` | `describeSpineCatProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32828 | v0.8.4 |
| `EU` | `describeSpineRecordProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32840 | v0.8.4 |
| `RU` | `initProtocolSystemModule` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32843 | v0.7.1 |
| `IU` | `isModelRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32870 |  |
| `AR` | `isChannelIngressParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32874 | v0.2.0 |
| `NR` | `isChannelFileUploadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32878 | v0.2.0 |
| `DR` | `isChannelFileDownloadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32882 | v0.2.0 |
| `Vm` | `isChannelPullParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32886 | v0.2.0 |
| `MR` | `isChannelCommandParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32890 | v0.2.0 |
| `jR` | `isChannelAckParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32894 | v0.2.0 |
| `LR` | `isChannelDescribeParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32898 | v0.5.0 |
| `FR` | `isChannelSpawnParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32902 | v0.5.0 |
| `J7e` | `isAttachmentArray` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32906 | v0.2.0 |
| `G7e` | `isChannelCapabilities` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32910 | v0.2.0 |
| `K7e` | `isMimePattern` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32917 | v0.2.0 |
| `$ue` | `initChannelProtocolModule` | inferred | 32920 |  |
| `zR` | `isJobCreateParams` | inferred | 32931 | v0.2.0 |
| `UR` | `isJobGetParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 32935 | v0.2.0 |
| `qR` | `isJobListParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 32939 | v0.2.0 |
| `BR` | `isJobArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 32943 |  |
| `VR` | `isJobRescheduleParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 32947 | v0.8.2 |
| `HR` | `isJobInterruptParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 32951 | v0.8.2 |
| `Oue` | `initProtocolJobModule` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 32954 | v0.7.1 |
| `WR` | `isSystemStatusParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 32963 |  |
| `JR` | `isSystemConfigParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 32967 |  |
| `GR` | `isSpineTailParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 32971 | v0.3.2 |
| `mh` | `isValidChannelId` | inferred | 37018 | v0.2.0 |
| `hh` | `assertValidChannelId` | inferred | 37022 | v0.2.0 |
| `Es` | `readChannelDescriptor` | inferred | 37062 | v0.2.0 |
| `gnt` | `generateOutboxRecordId` | inferred | 37249 | v0.2.0 |
| `mv` | `resolveOutboxRecordPath` | inferred | 37253 | v0.2.0 |
| `Ga` | `createOutboxRecord` | inferred | 37257 | v0.2.0 |
| `Ka` | `persistOutboxRecord` | inferred | 37289 | v0.2.0 |
| `kq` | `indexOutboxRecordByEventId` | inferred | 37295 | v0.2.0 |
| `Za` | `readOutboxRecord` | inferred | 37303 | v0.2.0 |
| `hv` | `listAllOutboxRecords` | inferred | 37328 | v0.2.0 |
| `yh` | `findOutboxRecordByEventId` | inferred | 37360 | v0.2.0 |
| `vf` | `recordOutboxDeliveryAttempt` | inferred | 37368 | v0.2.0 |
| `xq` | `resolveOutboxByEventIndexPath` | inferred | 37392 | v0.2.0 |
| `Kde` | `resolveOutboxSentIdsPath` | inferred | 37396 | v0.2.0 |
| `vnt` | `loadOutboxByEventIndex` | inferred | 37409 | v0.2.0 |
| `wnt` | `appendOutboxByEventIndexEntry` | inferred | 37426 | v0.2.0 |
| `_h` | `recordOutboxSentId` | inferred | 37456 | v0.2.0 |
| `CI` | `resolveOutboxReplayDir` | inferred | 37462 | v0.3.0 |
| `Rs` | `resolveOutboxReplayFilePath` | inferred | 37470 |  |
| `Eq` | `resolveOutboxByIdIndexPath` | inferred | 37481 | v0.3.0 |
| `la` | `lookupOutboxByIdIndexEntry` | inferred | 37533 |  |
| `Int` | `ensureOutboxRecordInReplay` | inferred | 37586 | v0.3.0 |
| `OI` | `backfillOutboxByIdIndexFromReplay` | inferred | 37758 | v0.3.0 |
| `lc` | `resolveOutboxPendingQueuePath` | inferred | 37794 | v0.3.1 |
| `$nt` | `hasUnqueuedPendingOutboxRecords` | inferred | 37844 | v0.3.1 |
| `afe` | `listRetryableOutboxRecords` | inferred | 37913 | v0.3.1 |
| `Bo` | `initOutboxStoreModule` | inferred | 37931 | v0.3.1 |
| `vh` | `refreshSessionIndexEntry` | inferred | 38150 |  |
| `vfe` | `listVoidChannelSessions` | inferred | 38184 | v0.8.4 |
| `LI` | `writeVoidSessionOutboxRecord` | inferred | 38196 | v0.8.4 |
| `ewe` | `updateDeliveryCursorFile` | inferred | 65669 | v0.5.6 |
| `nwe` | `resolveDeliveryCursorPath` | inferred | 65690 | v0.2.0 |
| `rwe` | `readDeliveryCursorFile` | inferred | 65702 | v0.2.0 |
| `u6` | `advanceOptimisticDeliveryCursor` | inferred | 65745 | v0.3.0 |
| `pS` | `readOutboxRecordsPastCursor` | inferred | 65845 | v0.2.0 |
| `swe` | `replayOutboxBacklogToSubscriber` | inferred | 65903 | v0.2.0 |
| `bO` | `readLatestDeliveryCursorUpdate` | inferred | 65989 |  |
| `zc` | `hasNonEmptyDisplayName` | inferred | 66135 | v0.5.4 |
| `Kdt` | `filterDeliverableSessions` | inferred | 66179 | v0.8.4 |
| `Ls` | `deliverRouteEventToSession` | inferred | 66333 | v0.8.0 |
| `fA` | `DAEMON_TOKEN_ENV_KEY` | __export | 70410 |  |
| `cfe` | `lookupInjectionPrompt` | inferred | 88716 | v0.5.7 |
| `Ife` | `readRoutingTarget` | inferred | 88755 | v0.2.0 |
| `Ofe` | `canonicalizeGatewayCommand` | inferred | 88768 | v0.2.0 |
| `UI` | `parseInjectionPromptCommand` | inferred | 88781 | v0.5.7 |
| `Afe` | `expandInjectionPromptCommand` | inferred | 88797 | v0.5.7 |
| `yv` | `parseGatewayCommandText` | inferred | 88806 | v0.2.0 |
| `Mq` | `classifyGatewayCommandIntent` | inferred | 88822 | v0.2.0 |
| `Gnt` | `resolveRoutingTarget` | inferred | 88835 | v0.2.0 |
| `Nfe` | `ingestChannelMessage` | inferred | 88841 | v0.2.0 |
| `bv` | `ingestChannelCommand` | inferred | 88866 | v0.2.0 |
| `Dfe` | `appendBeforeExecuteGateway` | inferred | 88894 | v0.2.0 |
| `Mfe` | `probeEventsAppendable` | inferred | 89045 | v0.2.0 |
| `Knt` | `replyToGatewayCommandEvent` | inferred | 89060 | v0.2.0 |
| `ert` | `executeGatewayCommand` | inferred | 89183 | v0.2.0 |
| `trt` | `writeIngressSnapshot` | inferred | 89491 | v0.2.0 |
| `Nwe` | `saveChannelUploadToInbox` | inferred | 89556 | v0.2.0 |
| `Dwe` | `readFileAsBase64` | inferred | 89580 | v0.2.0 |
| `Rft` | `sanitizeUploadFileName` | inferred | 89584 | v0.2.0 |
| `qft` | `checkMainAliasCallerAuthority` | inferred | 90202 | v0.8.7 |
| `wSe` | `announceMainSessionChange` | inferred | 90245 | v0.8.7 |
| `qO` | `setSessionAliasAndReindex` | inferred | 90254 | v0.8.7 |
| `SSe` | `setSessionAliasWithMainRole` | inferred | 90271 | v0.8.7 |
| `kSe` | `reconcileMainSessionAtBoot` | inferred | 90311 | v0.8.7 |
| `j6` | `createSessionSubscriptionRegistry` | inferred | 90505 | v0.2.0 |
| `Jc` | `MemoryReadRpcError` | inferred | 90932 |  |
| `yxe` | `readMemoryFileForRpc` | inferred | 90938 | v0.8.4 |
| `up` | `SpineRpcParamsError` | inferred | 91835 |  |
| `qxe` | `runSpineCatRpc` | inferred | 91878 | v0.8.4 |
| `It` | `JsonRpcInvalidParamsError` | inferred | 91959 | v0.2.0 |
| `OTe` | `bindSessionSourceChannel` | inferred | 91962 |  |
| `ATe` | `assertWsChannelIdentityParams` | inferred | 91971 | v0.2.0 |
| `cK` | `normalizeReturnMask` | inferred | 92103 | v0.2.0 |
| `_St` | `normalizeChannelCapabilityDeclarations` | inferred | 92133 | v0.3.3 |
| `bSt` | `recordChannelCapabilityDeclaration` | inferred | 92143 | v0.2.0 |
| `_p` | `resolveExistingDirRealpath` | inferred | 92178 | v0.2.0 |
| `UTe` | `ensureAbsoluteWorkspaceDir` | inferred | 92188 | v0.2.0 |
| `NTe` | `resolveIngressWorkspace` | inferred | 92195 | v0.2.0 |
| `kSt` | `describeChannelInstance` | inferred | 92263 | v0.5.0 |
| `xSt` | `archiveSessionIfQuiescent` | inferred | 92327 | v0.5.0 |
| `RSt` | `runSessionSetAliasRpc` | inferred | 92405 |  |
| `qTe` | `buildMainRoleContext` | inferred | 92409 | v0.8.7 |
| `TSt` | `resolveSessionByExactKey` | inferred | 92426 | v0.8.4 |
| `bp` | `resolveSessionByKeyOrAlias` | inferred | 92438 | v0.5.4 |
| `PSt` | `scheduleSessionWakeRecord` | inferred | 92485 | v0.8.2 |
| `hK` | `deliverExternalSessionNotify` | inferred | 92545 | v0.5.4 |
| `$St` | `replayIdempotentSessionNotify` | inferred | 92685 | v0.8.4 |
| `OSt` | `readOrSetSessionModel` | inferred | 92735 | v0.8.0 |
| `ASt` | `readOrSetSessionEffort` | inferred | 92765 | v0.8.0 |
| `NSt` | `enqueueSessionCompactCommand` | inferred | 92795 | v0.5.8 |
| `VTe` | `checkChannelRuntimeRebindConflict` | inferred | 92906 | v0.8.3 |
| `MSt` | `applySessionConfigVerb` | inferred | 92915 | v0.5.10 |
| `USt` | `upsertChannelSpawnDescriptor` | inferred | 93381 | v0.5.0 |
| `VSt` | `isLoopbackBindHost` | __export | 93514 | v0.7.0 |
| `HSt` | `resolveRemoteListenerConfig` | __export | 93521 | v0.7.0 |
| `WSt` | `wsDefaultMaxPayload` | __export | 93547 | v0.8.7 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Nt` | `classifySessionKeyKind` | inferred | 32685 | v0.5.0 |
| `xue` | `isMainAliasedChannelSession` | inferred | 32689 | v0.8.7 |
| `Mb` | `resolveMainSessionHolder` | inferred | 32693 | v0.8.7 |
| `bU` | `initMainSessionAliasModule` | inferred | 32707 |  |
| `rf` | `moveFileIntoDirectory` | inferred | 33538 | v0.5.6 |
| `Fo` | `hashSessionKey` | inferred | 33558 | v0.2.0 |
| `Qn` | `resolveSessionDir` | inferred | 33562 | v0.2.0 |
| `yXe` | `resolveSessionsArchiveRoot` | inferred | 33566 | v0.4.5 |
| `Km` | `resolveArchivedSessionDir` | inferred | 33570 |  |
| `zo` | `isSessionArchived` | inferred | 33574 |  |
| `Bb` | `resolveSessionInboxDir` | inferred | 33578 | v0.2.0 |
| `nI` | `resolveSessionMailboxMarkdownPath` | inferred | 33582 | v0.2.0 |
| `Wue` | `resolveSessionMailboxDir` | inferred | 33586 |  |
| `of` | `resolveSessionMailboxPendingDir` | inferred | 33590 | v0.3.1 |
| `Vb` | `resolveSessionMailboxNotesPath` | inferred | 33594 | v0.3.1 |
| `Va` | `resolveSessionMetaPath` | inferred | 33598 | v0.2.0 |
| `Ss` | `resolveSessionStatePath` | inferred | 33602 | v0.2.0 |
| `Hb` | `listPendingInboxFiles` | inferred | 33612 | v0.5.6 |
| `Wb` | `probeSessionPendingWork` | inferred | 33627 | v0.6.0 |
| `Jue` | `rehydrateSessionState` | inferred | 33641 | v0.4.0 |
| `Jb` | `moveSessionDirToArchive` | inferred | 33681 | v0.4.5 |
| `Zi` | `runWithSessionMutex` | inferred | 33711 | v0.5.0 |
| `iI` | `tryMarkSessionArchiving` | inferred | 33724 | v0.5.0 |
| `oI` | `clearSessionArchiving` | inferred | 33728 |  |
| `er` | `isSessionArchiving` | inferred | 33732 |  |
| `oc` | `assertSessionNotArchiving` | inferred | 33736 |  |
| `oa` | `initSessionLockAndArchivingModule` | inferred | 33739 | v0.5.0 |
| `zU` | `ensureSessionMailboxPendingDir` | inferred | 33845 |  |
| `aa` | `enqueueSessionInboxLine` | inferred | 33848 | v0.2.0 |
| `aI` | `mergeInboxIntoMailbox` | inferred | 33859 | v0.2.0 |
| `Kb` | `listMailboxPendingItems` | inferred | 33918 | v0.3.1 |
| `Uo` | `deleteMailboxPendingItemsByEventIds` | inferred | 33940 | v0.3.1 |
| `Que` | `removeOrphanMailboxItemFiles` | inferred | 33969 | v0.4.2 |
| `Zb` | `appendSessionMailboxNote` | inferred | 33996 | v0.3.1 |
| `uI` | `renderSessionMailboxFile` | inferred | 34006 | v0.3.1 |
| `lh` | `notifySessionFileChanged` | inferred | 36770 |  |
| `gf` | `stripUndefinedFieldsDeep` | inferred | 36790 | v0.2.0 |
| `cv` | `isReservedMainAliasChange` | inferred | 36799 | v0.8.7 |
| `ch` | `ensureSessionDescriptorAndStateFiles` | inferred | 36802 | v0.2.0 |
| `qo` | `readSessionMetaFile` | inferred | 36837 | v0.2.0 |
| `pq` | `updateSessionDisplayName` | inferred | 36846 | v0.5.4 |
| `rt` | `readSessionRuntimeState` | inferred | 36871 | v0.2.0 |
| `dh` | `readAllSessionStateFiles` | inferred | 36879 | v0.4.0 |
| `Ye` | `patchSessionRuntimeState` | inferred | 36897 | v0.2.0 |
| `yf` | `mutateSessionRuntimeState` | inferred | 36934 | v0.5.0 |
| `ua` | `clearSessionRuntimeStateField` | inferred | 36970 | v0.5.0 |
| `$q` | `isUserVisibleSessionKey` | inferred | 38053 |  |
| `bh` | `buildSessionIndexFromDisk` | inferred | 38056 | v0.5.0 |
| `gfe` | `createEmptySessionIndex` | inferred | 38066 |  |
| `yfe` | `buildSessionIndexEntry` | inferred | 38070 | v0.5.0 |
| `_fe` | `createMapBackedSessionIndex` | inferred | 38095 | v0.5.0 |
| `wh` | `resolveSessionChannelRuntime` | inferred | 38159 | v0.8.4 |
| `Ku` | `isVoidRuntimeSession` | inferred | 38167 | v0.8.4 |
| `wf` | `initVoidRuntimeModule` | inferred | 38213 |  |
| `Aq` | `readAllSessionSummaries` | __export | 38365 | v0.2.0 |
| `sC` | `initCallerSessionEnvModule` | inferred | 56266 |  |
| `kC` | `issueWorkerToolContextToken` | inferred | 57128 | v0.8.0 |
| `gve` | `assertJobWorkspaceUsable` | inferred | 62728 | v0.5.5 |
| `Sve` | `extractJobSdkConfig` | inferred | 62865 | v0.6.2 |
| `SO` | `listSessionIndexSummaries` | inferred | 66151 | v0.5.4 |
| `hwe` | `formatViewSessionsListLine` | inferred | 66199 | v0.8.2 |
| `Wg` | `runViewSessionsTool` | inferred | 66236 | v0.8.2 |
| `yS` | `initViewSessionsToolModule` | inferred | 66248 | v0.8.2 |
| `DSe` | `archiveSessionDirUnlessAlreadyArchiving` | inferred | 67445 | v0.5.6 |
| `MSe` | `archiveSessionAndArtifacts` | inferred | 67461 | v0.5.0 |
| `OSe` | `readStateSourceChannelId` | inferred | 67602 | v0.5.0 |
| `NSe` | `listArchivedCopiesNewestFirst` | inferred | 67623 | v0.5.0 |
| `fEe` | `archiveLegacyRegistrySessionsDir` | __export | 70861 | v0.5.0 |
| `_Ee` | `extractUrlHost` | inferred | 71143 |  |
| `xEe` | `acquireSessionDrainLock` | inferred | 71361 | v0.2.0 |
| `EEe` | `refreshSessionDrainLockHeartbeat` | inferred | 71384 | v0.2.0 |
| `REe` | `releaseSessionDrainLock` | inferred | 71389 | v0.2.0 |
| `QW` | `resolveSessionDrainLockPath` | inferred | 71401 | v0.2.0 |
| `IEe` | `readDrainLockFile` | inferred | 71404 | v0.2.0 |
| `i0e` | `drainSessionMailbox` | inferred | 71861 | v0.2.0 |
| `uo` | `classifySessionKeyOrUnknown` | inferred | 72945 | v0.3.0 |
| `ayt` | `clearPendingGatewayNotice` | inferred | 73298 | v0.2.0 |
| `uyt` | `setPendingInterruptedContext` | inferred | 73301 | v0.2.0 |
| `lyt` | `clearPendingInterruptedContext` | inferred | 73307 | v0.2.0 |
| `cyt` | `clearPendingSkipRewind` | inferred | 73310 | v0.2.0 |
| `sy` | `buildSessionInfoFromState` | inferred | 73857 | v0.2.0 |
| `Dyt` | `classifySessionPlane` | inferred | 73902 | v0.2.0 |
| `k0e` | `requestPiWorkerCatalog` | inferred | 74208 | v0.8.0 |
| `JS` | `resolvePiAgentDir` | inferred | 74671 | v0.8.0 |
| `GS` | `readPiAgentSettings` | inferred | 74675 | v0.8.0 |
| `I0e` | `selectInstructionsFingerprint` | inferred | 74701 |  |
| `wJ` | `canonicalizeJsonValue` | inferred | 74705 | v0.8.0 |
| `T0e` | `buildPiConfigSignature` | inferred | 74714 | v0.8.0 |
| `SIe` | `stringifyExecutionToolInput` | inferred | 81762 | v0.2.0 |
| `kIe` | `computeStreamEventDedupKey` | inferred | 81772 | v0.2.0 |
| `xIe` | `buildSessionExecutionPayload` | inferred | 81776 | v0.2.0 |
| `xk` | `channelKindFromSessionKey` | inferred | 81806 | v0.2.0 |
| `IIe` | `listDefaultClaudeToolNames` | inferred | 81819 | v0.2.0 |
| `zG` | `inferActorOriginFromSessionKey` | inferred | 81823 | v0.4.0 |
| `TIe` | `classifySessionPoolKind` | inferred | 81835 | v0.2.0 |
| `PIe` | `isAvailableWorkspacePath` | inferred | 81839 | v0.2.0 |
| `Oy` | `SESSION_SCHEMA_VERSION` | __export | 81847 |  |
| `$Ie` | `createJobSessionFinalizer` | inferred | 81852 | v0.8.0 |
| `$k` | `computeInstructionsFingerprint` | __export | 83941 | v0.4.5 |
| `tK` | `computeNonBoardInstructionsFingerprint` | __export | 83950 |  |
| `qN` | `diffStreamingConfigSignature` | __export | 83957 | v0.5.10 |
| `oTe` | `computeMissionFingerprint` | __export | 83990 |  |
| `BN` | `runInstructionsFingerprintGuard` | __export | 83995 | v0.4.5 |
| `aTe` | `collectInstructionsInputs` | inferred | 84149 | v0.5.1 |
| `Ck` | `initInstructionsFingerprintModule` | inferred | 84184 |  |
| `nK` | `narrowToModelSettableAdapter` | inferred | 84198 | v0.8.0 |
| `rK` | `computeStreamingConfigSignature` | inferred | 84202 | v0.8.0 |
| `VN` | `readLiveStreamContextToken` | inferred | 84220 | v0.8.0 |
| `iK` | `isLiveStreamRebuildRequired` | inferred | 84230 | v0.8.0 |
| `HN` | `flagStreamRecreationOnModelReject` | inferred | 84236 | v0.8.0 |
| `lTe` | `createModelCommandResolvers` | inferred | 84254 | v0.8.0 |
| `$wt` | `recordPendingInterruptMarker` | inferred | 84392 | v0.8.2 |
| `pTe` | `prependPendingInterruptMarker` | inferred | 84414 | v0.8.2 |
| `GN` | `interruptActorQuery` | inferred | 84435 | v0.8.0 |
| `oK` | `triggerDeferredPreempt` | inferred | 84439 | v0.8.0 |
| `Ok` | `requestBoundaryAwarePreempt` | inferred | 84448 | v0.8.0 |
| `mTe` | `snapshotInflightEventIds` | inferred | 84457 | v0.8.0 |
| `yp` | `teardownStreamingSession` | inferred | 84462 | v0.8.0 |
| `sK` | `waitForWakeOrIdleTimeout` | inferred | 84477 | v0.8.0 |
| `KN` | `shutdownActorRuntimeAdapter` | inferred | 84491 | v0.8.0 |
| `yTe` | `memoizeAvailabilityProbeUntilOk` | inferred | 85256 |  |
| `Lwt` | `createSessionManager` | __export | 85263 | v0.2.0 |
| `Ywt` | `createMetaSession` | __export | 87481 | v0.2.0 |
| `Xwt` | `sweepTombstonedSessionRecords` | __export | 88073 | v0.5.6 |
| `qc` | `resolveMainSessionFromIndex` | inferred | 90188 |  |
| `jSe` | `createIdleCompactSweeper` | inferred | 90346 | v0.5.10 |
| `mK` | `resolvePreemptFromCommandText` | inferred | 92115 | v0.2.0 |
| `wSt` | `classifySessionPlaneByKey` | inferred | 92171 | v0.2.0 |
| `BTe` | `resolveIsolatedPlaneKind` | inferred | 92481 |  |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `zw` | `resolveMetaPromptText` | __export | 56637 | v0.2.0 |
| `qV` | `resolveRolePromptText` | __export | 56648 | v0.8.7 |
| `yC` | `composeIdentityLayer` | __export | 56659 | v0.8.7 |
| `Mat` | `renderJobAcceptanceBlock` | inferred | 56666 | v0.8.0 |
| `y_e` | `renderJobMissionBlock` | __export | 56672 | v0.4.5 |
| `__e` | `renderPromptLayers` | __export | 56679 | v0.7.1 |
| `Ig` | `buildSystemPromptForChannelConfig` | __export | 56706 | v0.2.0 |
| `Ive` | `extractSystemPromptAppend` | __export | 63515 | v0.4.4 |
| `TSe` | `decideRestartHintInjection` | inferred | 67400 | v0.5.2 |
| `PSe` | `renderDaemonRestartHint` | inferred | 67429 |  |
| `NA` | `formatLocalTimestampWithZone` | inferred | 71625 | v0.5.0 |
| `MEe` | `decideBoardUpdatedInjection` | inferred | 71648 | v0.5.10 |
| `jEe` | `renderBoardUpdatedHint` | inferred | 71672 |  |
| `n0e` | `projectJobPromptContext` | inferred | 71727 | v0.8.0 |
| `jt` | `escapeXmlText` | inferred | 72926 | v0.2.0 |
| `Zgt` | `renderJobCompleteReceiptGuidance` | inferred | 72949 | v0.4.0 |
| `s0e` | `describeStandInJobOwner` | inferred | 72967 | v0.8.7 |
| `jA` | `renderMailboxEventPrompt` | inferred | 73011 | v0.2.0 |
| `Qgt` | `renderSkipRewindBlock` | inferred | 73096 | v0.2.0 |
| `tyt` | `resolvePendingCompactNotice` | inferred | 73110 | v0.5.10 |
| `nyt` | `renderSmartCompactNoticeBlock` | inferred | 73133 | v0.5.10 |
| `a0e` | `formatElapsedDuration` | inferred | 73142 | v0.3.0 |
| `u0e` | `computeTimeGapContext` | inferred | 73153 | v0.8.0 |
| `ryt` | `renderTimeGapContextBlock` | inferred | 73162 | v0.3.0 |
| `oyt` | `renderJobTickBlock` | inferred | 73176 | v0.4.5 |
| `l0e` | `buildTransientUserBlocks` | inferred | 73190 | v0.2.0 |
| `eTe` | `transcludeBroadcastBoard` | inferred | 83790 | v0.5.2 |
| `vwt` | `renderTranscludedFiles` | inferred | 83798 | v0.5.2 |
| `tTe` | `resolveBoardIncludes` | inferred | 83805 | v0.5.2 |
| `Swt` | `realpathOrSelf` | inferred | 83839 |  |
| `ZIe` | `normalizeIncludePathKey` | inferred | 83847 | v0.5.2 |
| `kwt` | `stripBoardIncludeFrontmatter` | inferred | 83852 | v0.5.2 |
| `xwt` | `parseBoardFileContent` | inferred | 83860 | v0.5.2 |
| `Ewt` | `stripBoardHtmlComments` | inferred | 83871 | v0.5.2 |
| `Rwt` | `collectBoardIncludePaths` | inferred | 83888 | v0.5.2 |
| `Iwt` | `normalizeBoardIncludeToken` | inferred | 83917 |  |
| `Twt` | `isBoardIncludePathCandidate` | inferred | 83923 | v0.5.2 |
| `Pwt` | `resolveBoardIncludePath` | inferred | 83927 | v0.5.2 |
| `nTe` | `initBoardTransclusionModule` | inferred | 83930 | v0.5.2 |
| `sTe` | `selectSessionRolePrompt` | inferred | 84143 | v0.8.7 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Oq` | `detectInProcessBreak` | __export | 38243 | v0.5.10 |
| `Qa` | `drainRecordPath` | __export | 38255 | v0.2.0 |
| `Sf` | `appendDrainRecord` | __export | 38258 | v0.2.0 |
| `Sh` | `readDrainRecords` | __export | 38277 |  |
| `zI` | `createEmptyUsageSummary` | inferred | 38283 | v0.8.2 |
| `kfe` | `accumulateDrainRecordIntoSummary` | inferred | 38343 | v0.2.0 |
| `gv` | `summarizeDrainRecords` | __export | 38355 |  |
| `xfe` | `aggregateSessionDrainSummary` | inferred | 38360 |  |
| `Nq` | `readGlobalUsageTotals` | __export | 38382 | v0.4.4 |
| `Hnt` | `readRecentDrainRecords` | __export | 38399 | v0.2.0 |
| `wfe` | `IN_PROCESS_BREAK_HIT_RATIO_FLOOR` | __export | 38416 |  |
| `oC` | `runSkipTool` | inferred | 56232 | v0.2.0 |
| `tl` | `initSkipToolModule` | inferred | 56256 | v0.2.0 |
| `Rg` | `isAbortLikeError` | __export | 56536 | v0.2.0 |
| `zg` | `selectInterruptMarkerText` | inferred | 63370 |  |
| `Ug` | `normalizeTurnAbortReason` | inferred | 63374 | v0.8.2 |
| `rS` | `initInterruptMarkerTextModule` | inferred | 63377 |  |
| `Rve` | `computeCodexTurnUsage` | __export | 63491 | v0.5.6 |
| `CEe` | `normalizeInputTokenTotals` | inferred | 71588 | v0.5.6 |
| `OEe` | `computeCacheHitRate` | inferred | 71604 | v0.5.6 |
| `oJ` | `addToNumericField` | inferred | 71684 |  |
| `Oo` | `runTimedDrainPhase` | inferred | 71692 |  |
| `UEe` | `resolveTurnModelWithLayer` | inferred | 71737 | v0.8.1 |
| `qEe` | `resolveTurnEffortWithLayer` | inferred | 71750 | v0.8.1 |
| `VEe` | `extractServedModelFromUsage` | inferred | 71766 | v0.8.1 |
| `MA` | `isChannelMessageEvent` | inferred | 71771 | v0.8.1 |
| `pJ` | `prepareDrainTurnContext` | inferred | 71774 | v0.3.7 |
| `r0e` | `buildTurnSdkRunConfig` | inferred | 71826 | v0.2.0 |
| `HEe` | `resolveDrainContextProfileOrRefuse` | inferred | 71842 | v0.7.0 |
| `ao` | `isNonNullObject` | inferred | 72860 | v0.2.0 |
| `Xt` | `readStringProperty` | inferred | 72864 | v0.2.0 |
| `rJ` | `readNonNegativeNumberField` | inferred | 72869 | v0.5.10 |
| `mJ` | `extractPayloadMediaRefs` | inferred | 72875 | v0.2.0 |
| `syt` | `mergeInterruptedContextTexts` | inferred | 73292 | v0.2.0 |
| `dyt` | `hasSkipRewindRecordSince` | inferred | 73313 | v0.5.6 |
| `JEe` | `markTurnSkippedFromSkipRecord` | inferred | 73319 | v0.8.0 |
| `DA` | `clearPendingOutboundAttachments` | inferred | 73322 | v0.2.0 |
| `hJ` | `readPendingOutboundAttachments` | inferred | 73325 | v0.2.0 |
| `gJ` | `batchDrainItems` | inferred | 73329 | v0.2.0 |
| `c0e` | `loadDrainItemEventCached` | inferred | 73366 | v0.2.0 |
| `GEe` | `parseEventTimestampMs` | inferred | 73378 | v0.2.0 |
| `pyt` | `isMergeableDrainBatch` | inferred | 73384 | v0.8.1 |
| `myt` | `isMergeableChannelMessageBatch` | inferred | 73388 | v0.2.0 |
| `d0e` | `hasUniformDrainCoalesceKey` | inferred | 73396 | v0.5.5 |
| `f0e` | `isWorkerTaskNotifyDelivery` | inferred | 73402 | v0.5.5 |
| `cJ` | `extractJobCompletePayload` | inferred | 73410 | v0.8.0 |
| `p0e` | `extractJobCompletionJobId` | inferred | 73416 | v0.8.0 |
| `KEe` | `classifyDrainBatchClass` | inferred | 73423 |  |
| `gyt` | `computeDrainCoalesceKey` | inferred | 73431 | v0.2.0 |
| `yyt` | `resolveEventSourceChannelId` | inferred | 73439 | v0.2.0 |
| `byt` | `collectJobCompletionReceipts` | inferred | 73468 | v0.8.1 |
| `vyt` | `renderCoalescedDrainPrompt` | inferred | 73496 | v0.8.1 |
| `h0e` | `createDrainExecutionEventRecorder` | inferred | 73508 | v0.2.0 |
| `ZEe` | `renderTurnOutputText` | inferred | 73564 | v0.2.0 |
| `Syt` | `renderManualCompactNotice` | inferred | 73568 | v0.5.5 |
| `kyt` | `isStaleIdleCompactEvent` | inferred | 73574 | v0.5.10 |
| `YEe` | `countCompactGapIntervals` | inferred | 73579 | v0.5.10 |
| `XEe` | `buildCompactStatsRecord` | inferred | 73603 | v0.5.10 |
| `Ryt` | `recordIdleCompactFireMetric` | inferred | 73636 | v0.5.10 |
| `Iyt` | `runHistoryControlCommand` | inferred | 73644 | v0.5.2 |
| `g0e` | `resolveReplyTargetSessionKeys` | inferred | 73666 | v0.2.0 |
| `Kc` | `emitDrainOutputRecords` | inferred | 73678 | v0.2.0 |
| `Tyt` | `renderDrainErrorRuntimeHint` | inferred | 73735 | v0.5.6 |
| `VS` | `handleDrainError` | inferred | 73762 | v0.5.0 |
| `Pyt` | `clearModelOverrideOnRuntimeFlip` | inferred | 73818 | v0.5.6 |
| `$yt` | `resolvePendingModelFork` | inferred | 73835 | v0.5.6 |
| `Cyt` | `describeWorkspaceProblem` | inferred | 73874 | v0.2.0 |
| `Oyt` | `renderWorkspaceUnavailableNotice` | inferred | 73878 | v0.2.0 |
| `Ayt` | `renderRuntimeUnavailableGuidance` | inferred | 73883 | v0.5.4 |
| `Nyt` | `renderRuntimeMismatchGuidance` | inferred | 73891 | v0.8.3 |
| `QEe` | `runDrainQueryAndCollectOutboundAttachments` | inferred | 73917 | v0.5.0 |
| `y0e` | `mergeOutboundAttachmentLists` | inferred | 73998 | v0.5.0 |
| `zyt` | `runDrainTurnWithResumeFallback` | inferred | 74008 | v0.2.0 |
| `HS` | `initMailboxDrainRunnerModule` | inferred | 74140 | v0.2.0 |
| `uy` | `runQueueOutboundAttachmentTool` | inferred | 74800 | v0.2.0 |
| `KS` | `initQueueOutboundAttachmentModule` | inferred | 74831 | v0.2.0 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Vf` | `hasParentToolUseId` | inferred | 56271 | v0.5.7 |
| `Sg` | `createAbortErrorWithCause` | inferred | 56277 | v0.2.0 |
| `aC` | `extractSdkMessageTextChunks` | inferred | 56282 | v0.3.0 |
| `uC` | `extractStreamTextDeltas` | inferred | 56315 | v0.3.0 |
| `lC` | `extractStreamThinkingText` | inferred | 56343 | v0.3.0 |
| `cC` | `parseToolUseBlockStart` | inferred | 56365 | v0.3.2 |
| `dC` | `parseInputJsonDelta` | inferred | 56380 | v0.3.2 |
| `fC` | `stringifyToolResultContent` | inferred | 56393 | v0.3.0 |
| `Tat` | `selectDominantModelByInputTokens` | inferred | 56404 | v0.5.6 |
| `kg` | `mapClaudeResultToDrainUsage` | inferred | 56429 | v0.3.0 |
| `pC` | `resolveClaudeCostBaseline` | inferred | 56452 | v0.8.4 |
| `mC` | `buildClaudeCostBaseline` | inferred | 56461 | v0.8.4 |
| `f_e` | `findDeadAllowedToolEntries` | __export | 56513 | v0.5.10 |
| `p_e` | `splitDisallowedToolsForClaude` | __export | 56518 | v0.5.10 |
| `jw` | `isAgentSdkTurnInterruptedError` | __export | 56528 |  |
| `Lw` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 56532 |  |
| `Wf` | `normalizeOptionalEnvString` | inferred | 56549 | v0.8.0 |
| `h_e` | `probeClaudeAvailability` | __export | 56558 | v0.5.3 |
| `UV` | `isClaudeAvailable` | __export | 56588 |  |
| `Fw` | `claudeUnavailableReason` | __export | 56592 | v0.5.3 |
| `Aat` | `primeClaudeAvailability` | __export | 56595 |  |
| `Nat` | `__resetClaudeProbeCacheForTest` | __export | 56599 |  |
| `Dat` | `__setClaudeVerifierForTest` | __export | 56603 |  |
| `g_e` | `verifyClaudeCodeRuntimeAvailable` | __export | 56607 | v0.5.0 |
| `BV` | `eventToMessageGenerator` | __export | 56744 | v0.2.0 |
| `_C` | `stringToMessageGenerator` | __export | 56772 | v0.2.0 |
| `jV` | `parsePositiveMsEnv` | __export | 56782 | v0.5.8 |
| `Uat` | `disableSystemPromptSnapshot` | inferred | 56788 | v0.8.1 |
| `Jf` | `createAgentSdkAdapter` | __export | 56799 | v0.5.10 |
| `Ar` | `AgentSdkPromptNotAcceptedAbortError` | __export | 57104 |  |
| `Hr` | `AgentSdkTurnInterruptedError` | __export | 57104 |  |
| `Eg` | `CLAUDE_CORE_TOOLS` | __export | 57104 |  |
| `To` | `initAgentSdkAdapterModule` | inferred | 57104 | v0.5.10 |
| `vft` | `buildClaudeSettingsEnvOverrides` | inferred | 66922 | v0.7.0 |
| `Owe` | `materializeClaudeSettingsFile` | inferred | 66975 | v0.7.0 |
| `kS` | `computeContextProfileSignature` | inferred | 66986 | v0.7.0 |
| `xS` | `initMaterializedClaudeSettingsModule` | inferred | 66998 | v0.7.0 |
| `Mwe` | `mergeClaudeToolLists` | inferred | 67030 |  |
| `k6` | `applyJobSdkConfigOverride` | inferred | 67160 | v0.6.2 |
| `fxe` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 70341 | v0.5.1 |
| `xW` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 70410 |  |
| `lp` | `resolveContextCapToken` | inferred | 71096 | v0.7.0 |
| `RA` | `describeContextProfileSource` | inferred | 71106 | v0.7.0 |
| `IA` | `extractProfiledEndpointFields` | inferred | 71120 | v0.7.0 |
| `TA` | `listSortedAliasKeys` | inferred | 71151 | v0.7.0 |
| `hEe` | `buildProfiledExternalRequirement` | inferred | 71160 | v0.7.0 |
| `ZW` | `classifyModelContextRequirement` | inferred | 71190 | v0.7.0 |
| `ry` | `selectProfileIssuesForModel` | inferred | 71216 | v0.7.0 |
| `iy` | `resolveClaudeContextRequirement` | inferred | 71332 | v0.7.0 |
| `BS` | `isClaudeRuntimeOrDefault` | inferred | 71426 |  |
| `CA` | `prepareClaudeContextProfile` | inferred | 71429 | v0.7.0 |
| `zEe` | `resolveAdditionalDirClaudeMdAutoload` | inferred | 71721 | v0.5.2 |
| `$y` | `createAladuoMcpServer` | inferred | 81488 | v0.2.0 |
| `fTe` | `initAbortableAsyncQueueModule` | inferred | 84352 | v0.3.0 |
| `hTe` | `createClaudeStreamingSessionFactory` | inferred | 84510 | v0.8.0 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `ZH` | `buildCodexDirectOnlyToolConfig` | inferred | 63414 |  |
| `np` | `isCodexAvailable` | __export | 63420 |  |
| `Uct` | `codexUnavailableReason` | __export | 63424 | v0.2.0 |
| `qct` | `primeCodexAvailability` | __export | 63427 | v0.5.0 |
| `Bct` | `__setCodexAvailabilityForTests` | __export | 63432 |  |
| `qg` | `resolveCodexSandbox` | __export | 63436 | v0.4.4 |
| `Lc` | `checkCodexAvailability` | __export | 63440 | v0.4.4 |
| `e6` | `ensureAgentsMdSymlink` | __export | 63477 | v0.4.4 |
| `Eve` | `codexNotificationFilterDecision` | __export | 63487 | v0.5.4 |
| `Tve` | `buildBaseInstructions` | __export | 63519 | v0.4.4 |
| `Pve` | `buildDeveloperInstructions` | __export | 63537 | v0.4.4 |
| `YH` | `buildCodexTurnInput` | __export | 63551 | v0.7.0 |
| `oS` | `createCodexAppServerAdapter` | __export | 63564 | v0.4.4 |
| `Hct` | `resolveCodexSandboxForPermissionMode` | inferred | 64026 | v0.4.4 |
| `iS` | `isCodexPlainObject` | inferred | 64039 | v0.5.0 |
| `$ve` | `isImageGenerationItemType` | inferred | 64043 | v0.5.0 |
| `Cve` | `hasImageGenerationRecord` | __export | 64050 | v0.5.7 |
| `Ove` | `extractCodexGeneratedImageAttachment` | __export | 64066 | v0.5.0 |
| `Ave` | `capitalizeFirstChar` | inferred | 64094 | v0.6.0 |
| `Nve` | `warnUnmappedCodexItemOnce` | inferred | 64117 | v0.6.0 |
| `Dve` | `mapItemStartedToExecEvent` | __export | 64125 | v0.4.4 |
| `Mve` | `mapItemCompletedToExecEvent` | __export | 64236 | v0.4.4 |
| `uO` | `ALADUO_TOOL_NAMESPACE` | __export | 64309 |  |
| `rp` | `initCodexAppServerModule` | inferred | 64309 | v0.5.3 |
| `bgt` | `generatePartitionCodexAgents` | __export | 70735 | v0.5.3 |
| `uEe` | `parseAgentMarkdown` | __export | 70809 | v0.5.3 |
| `lEe` | `renderAgentToml` | __export | 70824 | v0.5.3 |
| `$gt` | `generateAllPartitionCodexAgents` | inferred | 71043 | v0.5.3 |
| `Cy` | `buildCodexStringInputSchema` | inferred | 81618 | v0.4.4 |
| `ON` | `buildCodexDynamicTools` | inferred | 81638 | v0.4.4 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `DI` | `containsWhitespaceChar` | inferred | 38037 |  |
| `MI` | `isProviderQualifiedModelId` | inferred | 38041 | v0.8.0 |
| `FV` | `PARTITION_CORE_TOOLS` | __export | 57104 |  |
| `Qw` | `parseScheduleDurationMs` | inferred | 62578 | v0.6.1 |
| `qH` | `assertScheduleDurationRepresentable` | inferred | 62589 | v0.6.1 |
| `rO` | `isOneShotJobSchedule` | inferred | 62593 | v0.4.5 |
| `cve` | `validateJobScheduleExpression` | inferred | 62597 | v0.6.1 |
| `eS` | `parseJobRearmTime` | inferred | 62614 | v0.5.6 |
| `dve` | `isJobScheduleDue` | inferred | 62626 | v0.5.6 |
| `fve` | `isPathWithinDir` | inferred | 62682 | v0.8.5 |
| `Ict` | `normalizeJobCwdRelText` | inferred | 62693 | v0.2.0 |
| `hve` | `resolveJobCwdRel` | inferred | 62697 | v0.2.0 |
| `yve` | `resolveJobExecutionWorkspace` | inferred | 62737 | v0.2.0 |
| `_ve` | `prepareJobExecutionWorkspace` | inferred | 62754 | v0.2.0 |
| `Mc` | `buildJobSessionKey` | inferred | 62804 | v0.2.0 |
| `vve` | `parseJobFileFrontmatter` | inferred | 62826 | v0.2.0 |
| `Act` | `renderJobFileMarkdown` | inferred | 62847 | v0.2.0 |
| `sl` | `initJobManagerModule` | inferred | 62911 | v0.2.0 |
| `tp` | `redactJobModelProfileTokens` | inferred | 63350 |  |
| `dO` | `renderManageJobToolDescription` | inferred | 65322 |  |
| `fO` | `renderJobSessionToolDescription` | inferred | 65329 |  |
| `wdt` | `renderJobPromptModeDescription` | inferred | 65340 | v0.8.0 |
| `Sdt` | `renderJobExtraToolsDescription` | inferred | 65347 | v0.8.0 |
| `Zve` | `buildJobPromptModeExtraToolsSchema` | inferred | 65351 | v0.8.0 |
| `Rdt` | `listSelectableJobRuntimes` | inferred | 65358 | v0.5.4 |
| `Xve` | `buildJobRuntimeSchemaField` | inferred | 65367 | v0.5.4 |
| `pO` | `buildManageJobInputSchema` | inferred | 65375 |  |
| `mO` | `buildJobSessionInputSchema` | inferred | 65384 |  |
| `Hg` | `runManageJobTool` | inferred | 65392 | v0.2.0 |
| `cS` | `initManageJobToolModule` | inferred | 65531 | v0.8.0 |
| `pwe` | `classifyConsumerStaleness` | inferred | 66014 | v0.8.2 |
| `f6` | `resolveNotifyUnconsumedHours` | inferred | 66027 | v0.8.2 |
| `p6` | `initNotifyConsumerStalenessModule` | inferred | 66033 | v0.8.2 |
| `al` | `evaluateNotifyConsumerRefusal` | inferred | 66041 | v0.8.2 |
| `Jdt` | `listSessionsWithRecentConsumer` | inferred | 66068 | v0.8.2 |
| `wO` | `renderNotifyRefusalMessage` | inferred | 66103 | v0.8.2 |
| `Jg` | `runRemindDuoduoTool` | inferred | 66268 | v0.8.2 |
| `bS` | `initRemindDuoduoToolModule` | inferred | 66301 | v0.8.2 |
| `$O` | `normalizeNotifyChannelTarget` | inferred | 66314 | v0.8.0 |
| `Rwe` | `isJobSessionKeyKind` | inferred | 66508 | v0.2.0 |
| `AO` | `renderNotifyToolDescription` | inferred | 66542 | v0.2.0 |
| `NO` | `buildNotifyInputSchema` | inferred | 66561 | v0.2.0 |
| `Iwe` | `isOrphanJobSessionKey` | inferred | 66587 | v0.6.2 |
| `cft` | `computeBoundedEditDistance` | inferred | 66624 | v0.5.0 |
| `dft` | `matchNearMissSessionKey` | inferred | 66643 | v0.5.0 |
| `_6` | `groupNotifyTargetCandidates` | inferred | 66685 | v0.5.0 |
| `b6` | `renderNotifyTargetCandidateLines` | inferred | 66703 | v0.5.0 |
| `pft` | `resolveJobOwnerNotifyTarget` | inferred | 66723 | v0.2.0 |
| `mft` | `resolveNotifyTargetSessionKey` | inferred | 66732 | v0.2.0 |
| `kwe` | `renderNotifyDeliveryReport` | inferred | 66776 | v0.2.0 |
| `Kg` | `runNotifyTool` | inferred | 66790 | v0.2.0 |
| `SS` | `initNotifyToolModule` | inferred | 66892 | v0.2.0 |
| `CS` | `loadSubconsciousPartitions` | inferred | 67661 | v0.2.0 |
| `fpt` | `parsePartitionDefinition` | inferred | 67685 | v0.2.0 |
| `Zg` | `readPlaylistRound` | inferred | 67726 | v0.2.0 |
| `ppt` | `parsePlaylistCurrentRound` | inferred | 67744 | v0.2.0 |
| `WO` | `markPlaylistItemExecuted` | inferred | 67763 | v0.2.0 |
| `VSe` | `rebuildPlaylistRound` | inferred | 67781 | v0.2.0 |
| `HSe` | `readPartitionInboxEntries` | inferred | 67825 | v0.2.0 |
| `JO` | `initSubconsciousPlaylistModule` | inferred | 67868 | v0.2.0 |
| `JSe` | `resolvePartitionStatePath` | inferred | 67888 | v0.3.1 |
| `op` | `readPartitionRunState` | inferred | 67891 | v0.3.1 |
| `H6` | `writePartitionRunState` | inferred | 67914 |  |
| `W6` | `isPartitionBackedOff` | inferred | 67918 | v0.3.1 |
| `J6` | `computePartitionBackoffUntil` | inferred | 67922 | v0.3.1 |
| `GO` | `initPartitionRunStateModule` | inferred | 67934 | v0.3.1 |
| `rxe` | `resolveCadenceIntervalMs` | __export | 70042 | v0.8.0 |
| `lgt` | `computeLegacyJobSessionKey` | inferred | 70534 | v0.8.0 |
| `cgt` | `rewriteSessionKeyInStateAndMeta` | inferred | 70555 | v0.8.0 |
| `Qxe` | `migrateLegacyJobSessionKeys` | inferred | 70589 | v0.8.0 |
| `rEe` | `retireListedPartitions` | inferred | 70641 | v0.8.0 |
| `hgt` | `retirePartitionOnce` | inferred | 70654 | v0.8.0 |
| `iEe` | `initPartitionRetirementModule` | inferred | 70706 | v0.8.0 |
| `RIe` | `isAutoArchivedJobSchedule` | inferred | 81811 | v0.4.0 |
| `Ek` | `classifyJobScheduleType` | inferred | 81815 |  |
| `vTe` | `normalizePartitionOutputText` | inferred | 87359 | v0.2.0 |
| `Bwt` | `stringifyPartitionToolInput` | inferred | 87364 | v0.2.0 |
| `Hwt` | `detectEmptyRequiredPartitionOutput` | inferred | 87374 | v0.2.0 |
| `Wwt` | `appendPartitionToolEvent` | inferred | 87377 | v0.2.0 |
| `Jwt` | `hashActivityFingerprint` | inferred | 87416 | v0.2.0 |
| `Gwt` | `readLatestExternalEventId` | inferred | 87419 | v0.5.3 |
| `ZN` | `readNewestMtimeRecursive` | inferred | 87438 | v0.5.3 |
| `Kwt` | `renderPartitionRuntimeContext` | inferred | 87464 | v0.2.0 |
| `Zwt` | `renderPartitionInboxSection` | inferred | 87471 | v0.5.3 |
| `STe` | `initMetaSessionModule` | inferred | 88038 | v0.8.0 |
| `Qwt` | `runCadenceTick` | __export | 88133 | v0.2.0 |
| `uK` | `scanAndSpawnDueJobs` | __export | 88164 | v0.2.0 |
| `eSt` | `fireDueWakeRecords` | inferred | 88255 | v0.8.2 |
| `nSt` | `createJobScheduler` | __export | 88325 | v0.2.0 |
| `PTe` | `initJobSchedulerModule` | inferred | 88381 | v0.2.0 |
| `rSt` | `isJobOrMetaOutboxRecord` | inferred | 88392 | v0.2.0 |
| `iSt` | `createOutboxDeliveryManager` | __export | 88396 | v0.2.0 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Db` | `partitionInboxDir` | __export | 32673 |  |
| `tc` | `partitionInboxDirFromVar` | __export | 32677 | v0.5.3 |
| `Fi` | `resolveMemoryDirs` | inferred | 67950 | v0.5.5 |
| `YO` | `bytesToKibCeil` | inferred | 67960 | v0.5.5 |
| `sp` | `scanWikiLinkOccurrences` | inferred | 67964 | v0.5.5 |
| `ap` | `resolveMemoryLinkTargets` | inferred | 67989 | v0.5.5 |
| `Dr` | `compareStringsAscending` | inferred | 67995 |  |
| `GSe` | `countDatedStampLines` | inferred | 67999 |  |
| `XO` | `countNewlineChars` | inferred | 68006 |  |
| `Qo` | `splitLinesDropTrailingEmpty` | inferred | 68013 | v0.5.5 |
| `Co` | `recordUnreadableMemoryPath` | inferred | 68028 | v0.7.1 |
| `$n` | `readMemoryFileSyncOrNull` | inferred | 68040 |  |
| `Bc` | `isMemoryPathFile` | inferred | 68048 | v0.5.5 |
| `Xg` | `isMemoryPathDirectory` | inferred | 68056 | v0.5.5 |
| `lu` | `listMarkdownSlugsSync` | inferred | 68064 | v0.5.5 |
| `QO` | `measureUtf8ByteLength` | inferred | 68076 | v0.5.5 |
| `XSe` | `normalizeSignalKindVersion` | inferred | 68084 | v0.5.6 |
| `es` | `initMemorySignalKindsModule` | inferred | 68088 | v0.5.6 |
| `vpt` | `parseEffectivenessTrajectory` | inferred | 68107 | v0.5.5 |
| `wpt` | `parseEffectivenessCounts` | inferred | 68117 | v0.5.5 |
| `Spt` | `parseUpdaterGuidanceVerdict` | inferred | 68136 | v0.5.5 |
| `kpt` | `classifyTopicNodeFormat` | inferred | 68156 | v0.5.5 |
| `xpt` | `classifyTopicNodeType` | inferred | 68164 | v0.5.5 |
| `QSe` | `rankEffectivenessTrajectory` | inferred | 68175 | v0.5.5 |
| `Ept` | `compareBoardLintTargets` | inferred | 68188 | v0.5.5 |
| `eke` | `collectBoardLintReport` | inferred | 68239 | v0.5.5 |
| `$pt` | `buildBoardLintTarget` | inferred | 68272 | v0.5.5 |
| `Cpt` | `runBoardLint` | inferred | 68303 | v0.5.5 |
| `tke` | `initBoardLintModule` | inferred | 68325 | v0.5.5 |
| `X6` | `isSafeMemorySlug` | inferred | 68333 | v0.5.5 |
| `Vc` | `createMemorySlugReader` | inferred | 68337 | v0.5.5 |
| `Hc` | `walkReachableMemory` | inferred | 68352 | v0.5.5 |
| `Npt` | `renderEntityConvergeSignalBody` | inferred | 68395 | v0.5.5 |
| `oke` | `runEntityLint` | inferred | 68403 | v0.5.5 |
| `ske` | `initEntityLintModule` | inferred | 68443 | v0.5.5 |
| `Mpt` | `isAllowedNodeSection` | inferred | 68453 | v0.5.5 |
| `Lpt` | `renderNodeConvergeSignalBody` | inferred | 68468 | v0.5.5 |
| `ake` | `runNodeLint` | inferred | 68480 | v0.5.5 |
| `eA` | `buildNodeSignalKey` | inferred | 68529 |  |
| `uke` | `initNodeLintModule` | inferred | 68539 |  |
| `DS` | `initGapSpanModule` | inferred | 68675 | v0.8.4 |
| `MS` | `readPartitionContract` | inferred | 68683 | v0.5.6 |
| `iA` | `getCachedPartitionContract` | inferred | 68774 | v0.5.6 |
| `oA` | `postMemorySignalsToInboxes` | inferred | 68780 | v0.5.6 |
| `sA` | `enforceContractGate` | inferred | 68833 | v0.5.6 |
| `gke` | `reconcileMemorySignalInboxes` | inferred | 68864 | v0.7.1 |
| `yke` | `hasAnyMemorySignalConsumer` | inferred | 68907 | v0.5.6 |
| `_ke` | `isOrphanWarningDeliverable` | inferred | 68916 |  |
| `aW` | `initMemorySignalDeliveryModule` | inferred | 68919 |  |
| `lA` | `recordUnreadableUnlessMissing` | inferred | 68941 |  |
| `nmt` | `listMemoryFragmentDates` | inferred | 68966 | v0.8.0 |
| `smt` | `readOrSeedGapHandedDays` | inferred | 69023 | v0.8.0 |
| `vke` | `appendGapHandedSpan` | inferred | 69065 | v0.8.0 |
| `wke` | `readGapLintDayEvents` | inferred | 69073 | v0.8.0 |
| `kke` | `mergeContiguousHourRanges` | inferred | 69114 | v0.5.8 |
| `umt` | `renderScanGapSignalBody` | inferred | 69133 | v0.5.8 |
| `lmt` | `buildScanGapSignal` | inferred | 69139 | v0.8.0 |
| `uA` | `buildGapReadFaultResult` | inferred | 69148 | v0.8.0 |
| `cmt` | `runGapLint` | inferred | 69166 | v0.8.0 |
| `Tke` | `deliverScanGapSignal` | inferred | 69202 | v0.8.0 |
| `Pke` | `initGapLintModule` | inferred | 69246 | v0.8.0 |
| `lW` | `readMemoryMaxLinesLimit` | inferred | 69310 |  |
| `Ake` | `runBroadcastBudgetLint` | inferred | 69320 | v0.8.0 |
| `cW` | `initBroadcastBudgetLintModule` | inferred | 69359 | v0.5.3 |
| `Emt` | `listEventPartitionDates` | inferred | 69372 | v0.8.0 |
| `Imt` | `scanActivationWindowTouches` | inferred | 69399 | v0.8.0 |
| `Tmt` | `renderActivationReportHeader` | inferred | 69476 | v0.8.0 |
| `Pmt` | `renderBoardTemperatureSection` | inferred | 69481 | v0.8.0 |
| `$mt` | `renderHotOrphansSection` | inferred | 69491 | v0.8.0 |
| `Cmt` | `renderActivationReportBody` | inferred | 69498 |  |
| `jke` | `runActivationLint` | inferred | 69504 | v0.8.0 |
| `gW` | `initActivationLintModule` | inferred | 69603 | v0.8.0 |
| `Uke` | `readIntuitionWeaverLastFinishedMs` | inferred | 69613 | v0.8.0 |
| `Omt` | `findNewestFragmentMtimeMs` | inferred | 69619 | v0.8.0 |
| `Amt` | `renderFoldGapBody` | inferred | 69649 | v0.8.0 |
| `qke` | `runFoldGapLint` | inferred | 69655 | v0.8.0 |
| `Bke` | `initFoldGapLintModule` | inferred | 69672 |  |
| `jmt` | `extractBoardSlugLinks` | inferred | 69681 | v0.5.3 |
| `zmt` | `formatSlugLinkLocations` | inferred | 69704 | v0.5.3 |
| `Vke` | `runBroadcastLinkLint` | inferred | 69718 | v0.8.0 |
| `Hke` | `initBroadcastLinkLintModule` | inferred | 69739 |  |
| `Jmt` | `findBoardHeadingLines` | inferred | 69746 | v0.8.0 |
| `Wke` | `runBroadcastFlattenLint` | inferred | 69771 | v0.8.0 |
| `Jke` | `initBroadcastFlattenLintModule` | inferred | 69792 |  |
| `Zmt` | `computeOrphanTopicNodes` | inferred | 69810 | v0.5.5 |
| `Zke` | `detectOrphanMemory` | inferred | 69859 | v0.5.5 |
| `Yke` | `buildOrphanNewbornSignals` | inferred | 69882 | v0.5.5 |
| `Xke` | `forgetMemoryEntry` | inferred | 69891 | v0.5.5 |
| `Ymt` | `resolveGitToplevelSync` | inferred | 69927 | v0.5.5 |
| `Xmt` | `renderOrphanIslandsBody` | inferred | 69941 | v0.5.5 |
| `Qke` | `filterOrphanIslands` | inferred | 69955 | v0.5.5 |
| `exe` | `buildOrphanIslandsSignal` | inferred | 69959 | v0.5.5 |
| `Qmt` | `computeMemoryLinkIndegree` | inferred | 69968 | v0.5.5 |
| `eht` | `listMemorySlugReferrers` | inferred | 69979 | v0.5.5 |
| `yW` | `routeContractDecision` | inferred | 69996 | v0.5.5 |
| `nht` | `formatForgetCommitMessage` | inferred | 70008 | v0.5.5 |
| `txe` | `initOrphanMemoryModule` | inferred | 70011 | v0.5.5 |
| `bW` | `isTruthyEnvFlag` | inferred | 70028 | v0.5.5 |
| `wW` | `resolveMemoryCheckFlags` | __export | 70033 | v0.5.5 |
| `SW` | `buildMemoryCheckStatus` | __export | 70049 | v0.5.6 |
| `rht` | `runMemoryCheckTick` | __export | 70063 | v0.5.5 |
| `vW` | `runMemoryCheckSubStep` | inferred | 70179 | v0.7.1 |
| `_a` | `runReadAuditedMemoryCheckStep` | inferred | 70187 | v0.7.1 |
| `iht` | `evaluatePredicateOrFalse` | inferred | 70194 |  |
| `kW` | `initMemoryCheckTickModule` | inferred | 70201 |  |
| `qW` | `runKernelGitCommand` | inferred | 70439 | v0.2.0 |
| `Jxe` | `buildKernelGitEnv` | inferred | 70457 | v0.2.0 |
| `Gxe` | `buildSafeDirectoryGitArgs` | inferred | 70469 |  |
| `agt` | `isKernelGitToplevel` | inferred | 70472 | v0.2.0 |
| `Kxe` | `ensureKernelGitRepo` | inferred | 70485 | v0.2.0 |
| `ugt` | `mergeKernelGitignoreEntries` | inferred | 70494 | v0.2.0 |
| `Zxe` | `initKernelGitModule` | inferred | 70513 | v0.2.0 |
| `eK` | `computeBoardLayerHash` | __export | 83946 | v0.5.10 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Sue` | `resolveRuntimePaths` | __export | 32588 | v0.4.3 |
| `yR` | `SUN_PATH_MAX_BYTES` | __export | 32680 |  |
| `Oi` | `isEffortLevel` | inferred | 32729 |  |
| `OR` | `isAgentRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32866 |  |
| `ZR` | `isKnownRuntimeValue` | inferred | 32991 |  |
| `zb` | `isSupportedRuntime` | inferred | 32995 |  |
| `PU` | `validateKnownRuntimeValue` | inferred | 32999 | v0.8.4 |
| `tf` | `validateRunnableRuntimeValue` | inferred | 33012 | v0.8.4 |
| `vo` | `resolveDefaultRuntime` | inferred | 33026 | v0.7.1 |
| `zu` | `initRuntimeValidationModule` | inferred | 33035 | v0.8.4 |
| `rc` | `attachStreamLineReader` | inferred | 33078 | v0.8.0 |
| `Mue` | `parseLogLevelName` | inferred | 33204 | v0.2.0 |
| `Jm` | `parseEnvBooleanFlag` | inferred | 33210 | v0.2.0 |
| `Q7e` | `resolveLogLevel` | inferred | 33223 | v0.3.3 |
| `eXe` | `isLogLevelEnabled` | inferred | 33227 |  |
| `tXe` | `formatLogPrefix` | inferred | 33231 | v0.2.0 |
| `nf` | `writeLogLine` | inferred | 33235 | v0.2.0 |
| `ze` | `logErrorMessage` | inferred | 33239 | v0.2.0 |
| `Y` | `logWarnMessage` | inferred | 33243 | v0.2.0 |
| `oe` | `logInfoMessage` | inferred | 33247 | v0.2.0 |
| `xe` | `logDebugMessage` | inferred | 33251 | v0.2.0 |
| `jue` | `logTraceMessage` | inferred | 33255 |  |
| `nXe` | `isSessionLifecycleLoggingEnabled` | inferred | 33259 | v0.2.0 |
| `ct` | `logSessionLifecycleMessage` | inferred | 33263 | v0.2.0 |
| `wt` | `logAlwaysAtLevel` | inferred | 33267 | v0.2.0 |
| `mt` | `initLogLevelModule` | inferred | 33272 | v0.2.0 |
| `OXe` | `appendTelemetryRecord` | inferred | 34112 | v0.3.0 |
| `AXe` | `isTelemetryEnabled` | inferred | 34117 | v0.4.5 |
| `wo` | `logLatencyStageTelemetry` | inferred | 34125 | v0.2.0 |
| `ks` | `recordTelemetryMetric` | inferred | 34133 | v0.3.0 |
| `Xi` | `formatYamlErrorMessage` | inferred | 36287 | v0.7.0 |
| `av` | `normalizePromptMode` | inferred | 36333 | v0.2.0 |
| `uv` | `parseClaudeFrontmatterBlock` | inferred | 36534 | v0.5.10 |
| `uh` | `listFrontmatterKeyAliases` | inferred | 36648 |  |
| `fq` | `parseSdkConfigFrontmatter` | inferred | 36652 | v0.2.0 |
| `lnt` | `parseChannelRuntimeField` | inferred | 36666 | v0.8.4 |
| `Wa` | `resolveLayeredChannelRuntime` | inferred | 36675 | v0.8.4 |
| `RI` | `parseChannelConfigFields` | inferred | 36712 | v0.2.0 |
| `gi` | `loadGlobalRuntimeConfig` | inferred | 37985 | v0.7.0 |
| `Ya` | `loadChannelKindConfig` | inferred | 38013 | v0.7.0 |
| `Xa` | `initChannelConfigLoaderModule` | inferred | 38029 |  |
| `Pft` | `buildEffectiveRuntimeFields` | inferred | 67015 | v0.8.4 |
| `zO` | `foldConfigLayersByKey` | inferred | 67034 | v0.7.0 |
| `Fwe` | `mergeRuntimeModelLayers` | inferred | 67063 | v0.8.1 |
| `zwe` | `mergeRuntimeEffortLayers` | inferred | 67073 | v0.8.1 |
| `ES` | `readRuntimeModelSetting` | inferred | 67083 |  |
| `RS` | `readRuntimeEffortSetting` | inferred | 67087 |  |
| `su` | `mergeGlobalModelConfigLayers` | inferred | 67101 | v0.7.0 |
| `S6` | `overlayConfigEntriesByKey` | inferred | 67137 |  |
| `qwe` | `appendPiConfigIssues` | inferred | 67181 |  |
| `Bwe` | `buildEffectiveChannelConfig` | inferred | 67185 | v0.2.0 |
| `au` | `resolveEffectiveChannelConfig` | inferred | 67280 | v0.2.0 |
| `IS` | `isBusinessSourceKind` | inferred | 67295 |  |
| `x6` | `resolveEffectiveChannelConfigForEvent` | inferred | 67308 | v0.2.0 |
| `uu` | `resolveChannelConfigBySession` | inferred | 67325 | v0.5.10 |
| `pA` | `parseDotEnv` | __export | 70244 | v0.3.3 |
| `dl` | `hostDotEnvPath` | __export | 70259 | v0.4.3 |
| `uxe` | `removeHostModelEnvLines` | inferred | 70279 |  |
| `lxe` | `removeDotEnvKeyLines` | inferred | 70286 | v0.5.1 |
| `mA` | `writeHostDotEnvLines` | inferred | 70298 | v0.4.3 |
| `RW` | `clearHostModelEnvVars` | __export | 70322 |  |
| `cxe` | `applyHostModelEnvVars` | __export | 70326 | v0.4.3 |
| `dxe` | `writeHostModelEnvConfig` | __export | 70329 | v0.4.3 |
| `pxe` | `clearHostModelEnvConfig` | __export | 70354 | v0.4.3 |
| `cht` | `readHostDaemonToken` | __export | 70365 | v0.7.0 |
| `dht` | `writeHostDaemonToken` | __export | 70377 | v0.7.0 |
| `mxe` | `readHostDotEnvFile` | __export | 70388 | v0.4.3 |
| `fht` | `loadHostDotEnv` | __export | 70397 | v0.4.3 |
| `EW` | `HOST_MODEL_ENV_KEYS` | __export | 70410 |  |
| `zs` | `pathExistsAsync` | inferred | 70418 | v0.2.0 |
| `Egt` | `isDirEmptyOrMissing` | inferred | 70950 | v0.2.0 |
| `JW` | `copyDirTreeOverwrite` | inferred | 70958 | v0.2.0 |
| `GW` | `copyDirTreeMissingOnly` | inferred | 70969 | v0.2.0 |
| `Igt` | `refreshBootstrapDuoduoMdFiles` | inferred | 70980 | v0.2.0 |
| `Tgt` | `copyBootstrapIntoKernel` | inferred | 70995 | v0.2.0 |
| `Pgt` | `initializeRuntime` | __export | 71033 | v0.2.0 |
| `mEe` | `initRuntimeInitializationModule` | inferred | 71066 | v0.2.0 |
| `_J` | `encodePiWorkerFrame` | inferred | 74187 |  |
| `WS` | `resolvePiWorkerCommand` | inferred | 74256 | v0.8.0 |
| `Hyt` | `buildPiSystemPromptSpec` | inferred | 74268 | v0.8.0 |
| `FA` | `createPiWorkerAdapter` | inferred | 74293 | v0.8.0 |
| `O0e` | `parsePiToolResultDetails` | inferred | 74874 | v0.8.0 |
| `A0e` | `handlePiToolEndObservation` | inferred | 74880 | v0.8.0 |
| `T6` | `CHANNEL_CONFIG_KEY_TYPES` | inferred | 89628 |  |
| `Dft` | `validateConfigValue` | inferred | 89666 | v0.5.10 |
| `ySe` | `writeInstanceModelAlias` | inferred | 90161 |  |
| `pht` | `isClaudeAuthSource` | inferred | 90919 | v0.4.3 |
| `TW` | `readClaudeAuthSourceEnv` | inferred | 90923 | v0.4.3 |
| `Gn` | `resolveEnvConfigEntry` | inferred | 92004 | v0.3.3 |
| `mSt` | `buildSdkConfigReport` | inferred | 92035 | v0.4.3 |
| `hSt` | `buildSystemConfigReport` | inferred | 92053 | v0.3.3 |
| `LTe` | `formatLayerModelAliases` | inferred | 93112 | v0.7.0 |
| `pK` | `formatModelConfigIssues` | inferred | 93135 | v0.7.0 |
| `Ny` | `appendConfigChangedEvent` | inferred | 93350 | v0.5.10 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `o6` | `isGrokAvailable` | __export | 64548 |  |
| `Zct` | `grokUnavailableReason` | __export | 64552 |  |
| `Yct` | `primeGrokAvailability` | __export | 64555 | v0.7.1 |
| `Xct` | `__setGrokAvailabilityForTests` | __export | 64560 |  |
| `Fc` | `checkGrokAvailability` | __export | 64563 | v0.7.1 |
| `aS` | `grokAcpExtMethod` | __export | 64584 |  |
| `ji` | `coerceToPlainObject` | inferred | 64593 | v0.7.1 |
| `Wve` | `collectGrokToolCallNames` | inferred | 64636 | v0.7.1 |
| `idt` | `isGrokSkipToolCall` | inferred | 64645 |  |
| `odt` | `mapGrokUsageToDrainUsage` | inferred | 64649 | v0.7.1 |
| `uS` | `createGrokAcpAdapter` | __export | 64708 | v0.7.1 |
| `qve` | `GROK_ACP_COMPACT` | __export | 65266 |  |
| `zve` | `GROK_ACP_EXT_PREFIX` | __export | 65266 |  |
| `Uve` | `GROK_ACP_SDK_CALL` | __export | 65266 |  |
| `Fve` | `GROK_AGENT_PROFILE` | __export | 65266 |  |
| `Lve` | `GROK_DISALLOWED_TOOLS` | __export | 65266 |  |
| `Bve` | `GROK_MCP_SDK_META` | __export | 65266 |  |
| `Vve` | `GROK_MCP_SERVERS_META` | __export | 65266 |  |
| `Hve` | `GROK_MCP_SERVER_NAME` | __export | 65266 |  |
| `Vg` | `initGrokAcpRuntimeModule` | inferred | 65266 | v0.7.1 |
