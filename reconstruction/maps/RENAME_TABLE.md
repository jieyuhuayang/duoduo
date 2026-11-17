# duoduo 首字符还原：符号名映射表（daemon）

下表把 esbuild `--minify` 后的短标识符映射回**真实原名**。名字来源：`__export()` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*；其中标注 *published source* 的名字是上游在同作者的公开源码包里的拼写，由 `maps/published_daemon.json` 记录；标注 *historical export* 的名字是上游在旧版本 `__export` 块里的拼写，经版本配对追到本版本，由 `maps/historical_daemon.json` 记录）。“原行号”指反混淆后的 `daemon.pretty.js`。“首见版本”是 npm 上最早含有该声明的发行版（`maps/history_daemon.json`，由 `tools/history.sh` 逐版本配对得出）。

共 902 个一等公民符号，覆盖 12 个子系统。基于 `@openduo/duoduo` v0.8.9。

## 00-daemon-entry

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `tle` | `setSessionArchivedListener` | inferred | 33672 | v0.5.0 |
| `yI` | `statusPath` | inferred, historical export (v0.2.0..v0.3.7) | 34296 | v0.2.0 |
| `YU` | `buildInitialStatus` | inferred, historical export (v0.2.0..v0.3.7) | 34300 | v0.2.0 |
| `XU` | `writeStatus` | inferred, historical export (v0.2.0..v0.3.7) | 34327 | v0.2.0 |
| `nv` | `readStatus` | inferred, historical export (v0.2.0..v0.3.7) | 34330 | v0.2.0 |
| `Wu` | `updateStatus` | inferred, historical export (v0.2.0..v0.3.7) | 34338 | v0.2.0 |
| `zq` | `replaceSessionIndexEntry` | inferred | 38260 | v0.5.0 |
| `Pfe` | `createVoidAwareAttachmentCallbacks` | inferred | 38290 | v0.8.4 |
| `wpt` | `daemonRestartReasonPath` | inferred | 67544 | v0.6.2 |
| `LSe` | `claimDaemonRestartReason` | inferred | 67547 | v0.6.2 |
| `FSe` | `setPendingRestartReason` | inferred | 67573 | v0.6.2 |
| `zSe` | `getPendingRestartReason` | inferred | 67577 | v0.8.0 |
| `BSe` | `renderRestartWakeMessage` | inferred | 67619 | v0.8.0 |
| `Y6` | `resolveRuntimeWriterLockPath` | inferred | 90879 | v0.2.0 |
| `Apt` | `isProcessAliveByPid` | inferred | 90883 | v0.2.0 |
| `Npt` | `computeHostBootId` | inferred | 90893 | v0.3.0 |
| `XSe` | `getCachedHostBootId` | inferred | 90910 | v0.3.0 |
| `Dpt` | `isRuntimeWriterLockStale` | inferred | 90914 | v0.2.0 |
| `Q6` | `acquireRuntimeWriterLock` | inferred | 90926 | v0.2.0 |
| `QSe` | `refreshRuntimeWriterLockHeartbeat` | inferred | 90974 | v0.2.0 |
| `ZO` | `releaseRuntimeWriterLock` | inferred | 90979 | v0.2.0 |
| `sPe` | `readEnvIntegerOrFallback` | inferred | 92351 | v0.2.0 |
| `rkt` | `computeRuntimeId` | inferred | 92531 | v0.2.0 |
| `ckt` | `reconcileMainSession` | __export | 92787 | v0.8.7 |
| `mkt` | `deliverDaemonRestartWakes` | __export | 93075 | v0.8.0 |
| `Ekt` | `parseHostHeaderHostname` | inferred | 93860 | v0.7.0 |
| `Rkt` | `parseOriginHostname` | inferred | 93870 | v0.7.0 |
| `$kt` | `createDaemon` | __export | 93920 | v0.2.0 |
| `Ckt` | `main` | __export | 94989 | v0.2.0 |

## 01-spine-wal

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `ks` | `iterateStreamLines` | inferred | 33214 | v0.8.0 |
| `Ki` | `stringifyJsonlRecord` | inferred | 33248 | v0.8.0 |
| `qu` | `memoizeIndexLoad` | inferred | 33255 | v0.8.0 |
| `Bu` | `isIndexLoadStillCurrent` | inferred | 33260 | v0.8.0 |
| `Mt` | `writeFileAtomic` | inferred | 33272 | v0.2.0 |
| `Bt` | `writeJsonFileAtomic` | inferred | 33288 | v0.2.0 |
| `Ne` | `ensureDirectoryExists` | inferred | 33301 | v0.2.0 |
| `$Xe` | `enqueuePartitionAppend` | inferred | 33407 | v0.2.0 |
| `CXe` | `generateSpineEventId` | inferred | 33412 | v0.2.0 |
| `Ym` | `formatEventPartitionName` | inferred | 33416 | v0.2.0 |
| `tn` | `createSpineEvent` | inferred | 33420 | v0.2.0 |
| `AXe` | `appendEventToPartition` | inferred | 33427 | v0.2.0 |
| `Wb` | `resolveEventIdIndexPath` | inferred | 33450 | v0.2.0 |
| `NXe` | `appendEventIdIndexEntry` | inferred | 33453 | v0.2.0 |
| `nn` | `atomicAppendEvent` | inferred | 33462 | v0.2.0 |
| `Mo` | `readEventById` | inferred | 33471 | v0.3.1 |
| `DXe` | `readEventAtIndexedOffset` | inferred | 33479 | v0.3.1 |
| `MXe` | `scanPartitionsForEventId` | inferred | 33497 | v0.2.0 |
| `Jb` | `lookupEventIdIndexEntry` | inferred | 33514 | v0.2.0 |
| `jXe` | `getOrCreateEventIdIndexCache` | inferred | 33528 | v0.2.0 |
| `LXe` | `isUsableEventIndexEntry` | inferred | 33538 | v0.8.2 |
| `FXe` | `loadEventIdIndex` | inferred | 33541 | v0.2.0 |
| `Zue` | `findEventInPartitionFile` | inferred | 33578 | v0.8.0 |
| `Yue` | `readSpineIndexRetentionDays` | inferred | 33592 | v0.8.0 |
| `Xue` | `pruneEventIdIndexByRetention` | inferred | 33598 | v0.8.0 |
| `jo` | `initSpineEventLogModule` | inferred | 33640 | v0.8.0 |
| `dQe` | `resolveConsumerOffsetPath` | inferred | 34271 | v0.2.0 |
| `fQe` | `writeConsumerOffsetFile` | inferred | 34274 | v0.2.0 |
| `Hu` | `advanceConsumerWatermark` | inferred | 34277 | v0.2.0 |
| `mI` | `spineEventDedupStore` | inferred | 88708 | v0.2.0 |
| `hI` | `computeDedupKey` | inferred | 88768 | v0.2.0 |
| `kv` | `loadRegistryDedupStore` | inferred | 88931 | v0.2.0 |
| `eW` | `readPartitionByteRange` | inferred | 90993 | v0.8.2 |
| `ike` | `iteratePartitionLinesBackward` | inferred | 91005 | v0.8.2 |
| `Mpt` | `resolveTailCursorEndOffset` | inferred | 91017 | v0.8.2 |
| `eke` | `readPartitionTail` | inferred | 91032 | v0.8.2 |
| `oke` | `readSpineTail` | inferred | 91071 | v0.3.2 |
| `Mgt` | `shouldKeepRouteDeliverEvent` | inferred | 92205 | v0.8.4 |
| `sEe` | `stripSpineEventToEnvelope` | inferred | 92209 | v0.8.4 |
| `jgt` | `redactSpineEventForExternal` | inferred | 92223 | v0.8.4 |
| `Lgt` | `checkReservedRecordSource` | inferred | 92268 | v0.8.4 |
| `lEe` | `recordExternalSpineEvent` | inferred | 92279 | v0.8.4 |

## 02-gateway-rpc

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `qb` | `isJsonRpcRequest` | inferred | 32822 | v0.2.0 |
| `it` | `isRecord` | inferred, published source (@openduo/protocol@0.8.4 rpc.ts) | 32828 | v0.2.0 |
| `Ci` | `isOptionalString` | inferred, published source (@openduo/protocol@0.8.4 rpc.ts) | 32832 | v0.2.0 |
| `TU` | `initProtocolEffortModule` | inferred, published source (@openduo/protocol@0.8.4 effort.ts) | 32842 | v0.8.0 |
| `SR` | `isSystemRuntimeInfo` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32847 | v0.2.0 |
| `kR` | `isRuntimeInfoParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32851 | v0.2.0 |
| `xR` | `isSessionArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32858 | v0.5.0 |
| `PU` | `isSessionListKind` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32862 | v0.5.4 |
| `ER` | `isSessionListParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32866 | v0.5.4 |
| `RR` | `isSessionSetAliasParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32870 | v0.5.4 |
| `IR` | `isSessionWakeParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32874 | v0.8.2 |
| `TR` | `isSessionNotifyParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32878 | v0.5.4 |
| `PR` | `isSessionModelParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32882 | v0.8.0 |
| `$R` | `isSessionEffortParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32886 | v0.8.0 |
| `CR` | `isSessionCompactParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32890 | v0.5.8 |
| `OR` | `isSessionConfigParams` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32894 | v0.5.10 |
| `yXe` | `isNonEmptyText` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32906 | v0.8.4 |
| `$U` | `unknownKeyProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32910 | v0.8.4 |
| `Lue` | `textKeysProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32915 | v0.8.4 |
| `Wm` | `renderParamsProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32923 | v0.8.4 |
| `Fue` | `describeConversationProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32930 | v0.8.4 |
| `CU` | `describeMemoryReadProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32934 | v0.8.4 |
| `OU` | `describeSpineCatProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32938 | v0.8.4 |
| `AU` | `describeSpineRecordProblem` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32950 | v0.8.4 |
| `NU` | `initProtocolSystemModule` | inferred, published source (@openduo/protocol@0.8.4 system.ts) | 32953 | v0.7.1 |
| `DU` | `isModelRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32980 |  |
| `jR` | `isChannelIngressParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32984 | v0.2.0 |
| `LR` | `isChannelFileUploadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32988 | v0.2.0 |
| `FR` | `isChannelFileDownloadParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32992 | v0.2.0 |
| `Jm` | `isChannelPullParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32996 | v0.2.0 |
| `zR` | `isChannelCommandParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33000 | v0.2.0 |
| `UR` | `isChannelAckParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33004 | v0.2.0 |
| `qR` | `isChannelDescribeParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33008 | v0.5.0 |
| `BR` | `isChannelSpawnParams` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33012 | v0.5.0 |
| `bXe` | `isAttachmentArray` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33016 | v0.2.0 |
| `vXe` | `isChannelCapabilities` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33020 | v0.2.0 |
| `wXe` | `isMimePattern` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 33027 | v0.2.0 |
| `zue` | `initChannelProtocolModule` | inferred | 33030 |  |
| `VR` | `isJobCreateParams` | inferred | 33041 | v0.2.0 |
| `HR` | `isJobGetParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33045 | v0.2.0 |
| `WR` | `isJobListParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33049 | v0.2.0 |
| `JR` | `isJobArchiveParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33053 |  |
| `GR` | `isJobRescheduleParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33057 | v0.8.2 |
| `KR` | `isJobInterruptParams` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33061 | v0.8.2 |
| `que` | `initProtocolJobModule` | inferred, published source (@openduo/protocol@0.8.4 job.ts) | 33064 | v0.7.1 |
| `ZR` | `isSystemStatusParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 33073 |  |
| `YR` | `isSystemConfigParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 33077 |  |
| `XR` | `isSpineTailParams` | inferred, published source (@openduo/protocol@0.8.4 dashboard.ts) | 33081 | v0.3.2 |
| `QR` | `isSpineActivityParams` | inferred | 33085 | v0.8.9 |
| `jU` | `isDashboardShareParams` | inferred | 33089 | v0.8.9 |
| `yh` | `isValidChannelId` | inferred | 37136 | v0.2.0 |
| `_h` | `assertValidChannelId` | inferred | 37140 | v0.2.0 |
| `Is` | `readChannelDescriptor` | inferred | 37180 | v0.2.0 |
| `qnt` | `generateOutboxRecordId` | inferred | 37367 | v0.2.0 |
| `bv` | `resolveOutboxRecordPath` | inferred | 37371 | v0.2.0 |
| `Ka` | `createOutboxRecord` | inferred | 37375 | v0.2.0 |
| `Za` | `persistOutboxRecord` | inferred | 37407 | v0.2.0 |
| `Oq` | `indexOutboxRecordByEventId` | inferred | 37413 | v0.2.0 |
| `Ya` | `readOutboxRecord` | inferred | 37421 | v0.2.0 |
| `vv` | `listAllOutboxRecords` | inferred | 37446 | v0.2.0 |
| `vh` | `findOutboxRecordByEventId` | inferred | 37478 | v0.2.0 |
| `Sf` | `recordOutboxDeliveryAttempt` | inferred | 37486 | v0.2.0 |
| `Aq` | `resolveOutboxByEventIndexPath` | inferred | 37510 | v0.2.0 |
| `ofe` | `resolveOutboxSentIdsPath` | inferred | 37514 | v0.2.0 |
| `Wnt` | `loadOutboxByEventIndex` | inferred | 37527 | v0.2.0 |
| `Jnt` | `appendOutboxByEventIndexEntry` | inferred | 37544 | v0.2.0 |
| `wh` | `recordOutboxSentId` | inferred | 37574 | v0.2.0 |
| `MI` | `resolveOutboxReplayDir` | inferred | 37580 | v0.3.0 |
| `Ts` | `resolveOutboxReplayFilePath` | inferred | 37588 | v0.3.0 |
| `Nq` | `resolveOutboxByIdIndexPath` | inferred | 37599 | v0.3.0 |
| `ca` | `lookupOutboxByIdIndexEntry` | inferred | 37651 | v0.3.0 |
| `Qnt` | `ensureOutboxRecordInReplay` | inferred | 37704 | v0.3.0 |
| `jI` | `backfillOutboxByIdIndexFromReplay` | inferred | 37876 | v0.3.0 |
| `fc` | `resolveOutboxPendingQueuePath` | inferred | 37912 | v0.3.1 |
| `nrt` | `hasUnqueuedPendingOutboxRecords` | inferred | 37962 | v0.3.1 |
| `yfe` | `listRetryableOutboxRecords` | inferred | 38031 | v0.3.1 |
| `Bo` | `initOutboxStoreModule` | inferred | 38049 | v0.3.1 |
| `kh` | `refreshSessionIndexEntry` | inferred | 38268 | v0.5.4 |
| `$fe` | `listVoidChannelSessions` | inferred | 38302 | v0.8.4 |
| `BI` | `writeVoidSessionOutboxRecord` | inferred | 38314 | v0.8.4 |
| `pwe` | `updateDeliveryCursorFile` | inferred | 65854 | v0.5.6 |
| `fft` | `hashDeliveryCursorKey` | inferred | 65871 | v0.2.0 |
| `hwe` | `resolveDeliveryCursorPath` | inferred | 65875 | v0.2.0 |
| `gwe` | `readDeliveryCursorFile` | inferred | 65887 | v0.2.0 |
| `v6` | `advanceOptimisticDeliveryCursor` | inferred | 65930 | v0.3.0 |
| `yS` | `readOutboxRecordsPastCursor` | inferred | 66030 | v0.3.0 |
| `bwe` | `replayOutboxBacklogToSubscriber` | inferred | 66088 | v0.2.0 |
| `EO` | `readLatestDeliveryCursorUpdate` | inferred | 66174 | v0.8.2 |
| `Vc` | `hasNonEmptyDisplayName` | inferred | 66320 | v0.5.4 |
| `kft` | `filterDeliverableSessions` | inferred | 66364 | v0.8.4 |
| `Cft` | `isPlainObjectRecord` | inferred | 66515 |  |
| `Fs` | `deliverRouteEventToSession` | inferred | 66518 | v0.2.0 |
| `_A` | `DAEMON_TOKEN_ENV_KEY` | __export | 70595 |  |
| `vfe` | `lookupInjectionPrompt` | inferred | 88898 | v0.5.7 |
| `jfe` | `readRoutingTarget` | inferred | 88937 | v0.2.0 |
| `qfe` | `canonicalizeGatewayCommand` | inferred | 88950 | v0.2.0 |
| `WI` | `parseInjectionPromptCommand` | inferred | 88963 | v0.5.7 |
| `Bfe` | `expandInjectionPromptCommand` | inferred | 88979 | v0.5.7 |
| `Sv` | `parseGatewayCommandText` | inferred | 88988 | v0.2.0 |
| `Hq` | `classifyGatewayCommandIntent` | inferred | 89004 | v0.2.0 |
| `vrt` | `resolveRoutingTarget` | inferred | 89017 | v0.2.0 |
| `Vfe` | `ingestChannelMessage` | inferred | 89023 | v0.2.0 |
| `xv` | `ingestChannelCommand` | inferred | 89048 | v0.2.0 |
| `Hfe` | `appendBeforeExecuteGateway` | inferred | 89076 | v0.2.0 |
| `Wfe` | `probeEventsAppendable` | inferred | 89227 | v0.2.0 |
| `wrt` | `replyToGatewayCommandEvent` | inferred | 89242 | v0.2.0 |
| `Rrt` | `executeGatewayCommand` | inferred | 89365 | v0.2.0 |
| `Irt` | `writeIngressSnapshot` | inferred | 89673 | v0.2.0 |
| `Jwe` | `saveChannelUploadToInbox` | inferred | 89738 | v0.2.0 |
| `Gwe` | `readFileAsBase64` | inferred | 89762 | v0.2.0 |
| `ept` | `sanitizeUploadFileName` | inferred | 89766 | v0.2.0 |
| `ASe` | `formatSessionAliasCommand` | inferred | 90374 | v0.8.7 |
| `hpt` | `listMainAliasHolderKeys` | inferred | 90380 | v0.8.7 |
| `gpt` | `checkMainAliasCallerAuthority` | inferred | 90384 | v0.8.7 |
| `ypt` | `renderNewMainSessionNotice` | inferred | 90404 | v0.8.7 |
| `_pt` | `renderFormerMainSessionNotice` | inferred | 90409 | v0.8.7 |
| `H6` | `deliverMainRoleNoticeSafely` | inferred | 90413 | v0.8.7 |
| `NSe` | `announceMainSessionChange` | inferred | 90427 | v0.8.7 |
| `GO` | `setSessionAliasAndReindex` | inferred | 90436 | v0.5.4 |
| `DSe` | `setSessionAliasWithMainRole` | inferred | 90453 | v0.8.7 |
| `bpt` | `renderAmbiguousMainAliasNotice` | inferred | 90489 | v0.8.7 |
| `MSe` | `reconcileMainSessionAtBoot` | inferred | 90493 | v0.8.7 |
| `K6` | `createSessionSubscriptionRegistry` | inferred | 90687 | v0.2.0 |
| `ske` | `readSpineActivityWindow` | inferred | 91142 | v0.8.9 |
| `Yc` | `MemoryReadRpcError` | inferred | 91179 | v0.8.4 |
| `Dxe` | `readMemoryFileForRpc` | inferred | 91185 | v0.8.4 |
| `kA` | `TAILCAT_PINNED_VERSION` | inferred | 91211 |  |
| `Hht` | `DASHBOARD_SHARE_DEFAULT_TTL_MINUTES` | inferred | 91212 |  |
| `ns` | `DashboardShareError` | inferred | 91215 |  |
| `jxe` | `createDashboardShareManager` | inferred | 91271 | v0.8.9 |
| `cp` | `SpineRpcParamsError` | inferred | 92200 | v0.8.4 |
| `uEe` | `runSpineCatRpc` | inferred | 92243 | v0.8.4 |
| `Et` | `JsonRpcInvalidParamsError` | inferred | 92324 | v0.2.0 |
| `XTe` | `bindSessionSourceChannel` | inferred | 92327 | v0.8.4 |
| `QTe` | `assertWsChannelIdentityParams` | inferred | 92336 | v0.2.0 |
| `SK` | `normalizeReturnMask` | inferred | 92468 | v0.2.0 |
| `tkt` | `normalizeChannelCapabilityDeclarations` | inferred | 92498 | v0.3.3 |
| `nkt` | `recordChannelCapabilityDeclaration` | inferred | 92508 | v0.2.0 |
| `vp` | `resolveExistingDirRealpath` | inferred | 92543 | v0.2.0 |
| `aPe` | `ensureAbsoluteWorkspaceDir` | inferred | 92553 | v0.2.0 |
| `ePe` | `resolveIngressWorkspace` | inferred | 92560 | v0.2.0 |
| `skt` | `describeChannelInstance` | inferred | 92628 | v0.5.0 |
| `akt` | `archiveSessionIfQuiescent` | inferred | 92692 | v0.5.0 |
| `lkt` | `runSessionSetAliasRpc` | inferred | 92770 | v0.8.7 |
| `uPe` | `buildMainRoleContext` | inferred | 92774 | v0.8.7 |
| `dkt` | `resolveSessionByExactKey` | inferred | 92791 | v0.8.4 |
| `wp` | `resolveSessionByKeyOrAlias` | inferred | 92803 | v0.5.4 |
| `fkt` | `scheduleSessionWakeRecord` | inferred | 92850 | v0.8.2 |
| `IK` | `deliverExternalSessionNotify` | inferred | 92910 | v0.5.4 |
| `pkt` | `replayIdempotentSessionNotify` | inferred | 93050 | v0.8.4 |
| `hkt` | `readOrSetSessionModel` | inferred | 93100 | v0.8.0 |
| `gkt` | `readOrSetSessionEffort` | inferred | 93130 | v0.8.0 |
| `ykt` | `enqueueSessionCompactCommand` | inferred | 93160 | v0.5.8 |
| `cPe` | `checkChannelRuntimeRebindConflict` | inferred | 93271 | v0.8.3 |
| `bkt` | `applySessionConfigVerb` | inferred | 93280 | v0.5.10 |
| `xkt` | `upsertChannelSpawnDescriptor` | inferred | 93746 | v0.5.0 |
| `Ikt` | `isLoopbackBindHost` | __export | 93879 | v0.7.0 |
| `Tkt` | `resolveRemoteListenerConfig` | __export | 93886 | v0.7.0 |
| `Pkt` | `wsDefaultMaxPayload` | __export | 93912 | v0.8.7 |

## 03-session-actor

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Dt` | `classifySessionKey` | inferred, published source (@openduo/protocol@0.8.6 main-session.ts) | 32795 | v0.5.0 |
| `Nue` | `isMainSessionCandidate` | inferred, published source (@openduo/protocol@0.8.6 main-session.ts) | 32799 | v0.8.7 |
| `Ub` | `resolveMainSession` | inferred, published source (@openduo/protocol@0.8.6 main-session.ts) | 32803 | v0.8.7 |
| `IU` | `initMainSessionAliasModule` | inferred | 32817 | v0.8.7 |
| `sf` | `moveFileIntoDirectory` | inferred | 33656 | v0.5.6 |
| `Fo` | `hashSessionKey` | inferred | 33676 | v0.2.0 |
| `tr` | `resolveSessionDir` | inferred | 33680 | v0.2.0 |
| `BXe` | `resolveSessionsArchiveRoot` | inferred | 33684 | v0.4.5 |
| `Xm` | `resolveArchivedSessionDir` | inferred | 33688 | v0.4.5 |
| `zo` | `isSessionArchived` | inferred | 33692 | v0.5.6 |
| `Gb` | `resolveSessionInboxDir` | inferred | 33696 | v0.2.0 |
| `aI` | `resolveSessionMailboxMarkdownPath` | inferred | 33700 | v0.2.0 |
| `nle` | `resolveSessionMailboxDir` | inferred | 33704 | v0.3.1 |
| `af` | `resolveSessionMailboxPendingDir` | inferred | 33708 | v0.3.1 |
| `Kb` | `resolveSessionMailboxNotesPath` | inferred | 33712 | v0.3.1 |
| `Ha` | `resolveSessionMetaPath` | inferred | 33716 | v0.2.0 |
| `xs` | `resolveSessionStatePath` | inferred | 33720 | v0.2.0 |
| `Zb` | `listPendingInboxFiles` | inferred | 33730 | v0.5.6 |
| `Yb` | `probeSessionPendingWork` | inferred | 33745 | v0.6.0 |
| `rle` | `rehydrateSessionState` | inferred | 33759 | v0.4.0 |
| `Xb` | `moveSessionDirToArchive` | inferred | 33799 | v0.4.5 |
| `Zi` | `runWithSessionMutex` | inferred | 33829 | v0.3.1 |
| `lI` | `tryMarkSessionArchiving` | inferred | 33842 | v0.5.0 |
| `cI` | `clearSessionArchiving` | inferred | 33846 | v0.5.0 |
| `nr` | `isSessionArchiving` | inferred | 33850 | v0.5.0 |
| `uc` | `assertSessionNotArchiving` | inferred | 33854 | v0.5.0 |
| `sa` | `initSessionLockAndArchivingModule` | inferred | 33857 | v0.5.0 |
| `ale` | `isMailboxMergeReadError` | inferred | 33881 |  |
| `KU` | `ensureSessionMailboxPendingDir` | inferred | 33963 | v0.3.1 |
| `ua` | `enqueueSessionInboxLine` | inferred | 33966 | v0.2.0 |
| `fI` | `mergeInboxIntoMailbox` | inferred | 33977 | v0.2.0 |
| `ev` | `listMailboxPendingItems` | inferred | 34036 | v0.3.1 |
| `Uo` | `deleteMailboxPendingItemsByEventIds` | inferred | 34058 | v0.3.1 |
| `lle` | `removeOrphanMailboxItemFiles` | inferred | 34087 | v0.4.2 |
| `tv` | `appendSessionMailboxNote` | inferred | 34114 | v0.3.1 |
| `pI` | `renderSessionMailboxFile` | inferred | 34124 | v0.3.1 |
| `fh` | `notifySessionFileChanged` | inferred | 36888 | v0.5.0 |
| `_f` | `stripUndefinedFieldsDeep` | inferred | 36908 | v0.2.0 |
| `hv` | `isReservedMainAliasChange` | inferred | 36917 | v0.8.7 |
| `ph` | `ensureSessionDescriptorAndStateFiles` | inferred | 36920 | v0.2.0 |
| `qo` | `readSessionMetaFile` | inferred | 36955 | v0.2.0 |
| `Sq` | `updateSessionDisplayName` | inferred | 36964 | v0.5.4 |
| `ot` | `readSessionRuntimeState` | inferred | 36989 | v0.2.0 |
| `mh` | `readAllSessionStateFiles` | inferred | 36997 | v0.4.0 |
| `Qe` | `patchSessionRuntimeState` | inferred | 37015 | v0.2.0 |
| `bf` | `mutateSessionRuntimeState` | inferred | 37052 | v0.5.0 |
| `la` | `clearSessionRuntimeStateField` | inferred | 37088 | v0.5.0 |
| `Rr` | `initReservedMainAliasModule` | inferred | 37114 | v0.2.0 |
| `Fq` | `isUserVisibleSessionKey` | inferred | 38171 | v0.5.0 |
| `Sh` | `buildSessionIndexFromDisk` | inferred | 38174 | v0.5.0 |
| `Rfe` | `createEmptySessionIndex` | inferred | 38184 | v0.5.0 |
| `Ife` | `buildSessionIndexEntry` | inferred | 38188 | v0.5.0 |
| `Tfe` | `createMapBackedSessionIndex` | inferred | 38213 | v0.5.0 |
| `xh` | `resolveSessionChannelRuntime` | inferred | 38277 | v0.8.4 |
| `Zu` | `isVoidRuntimeSession` | inferred | 38285 | v0.8.4 |
| `kf` | `initVoidRuntimeModule` | inferred | 38331 | v0.8.4 |
| `qq` | `readAllSessionSummaries` | __export | 38483 | v0.2.0 |
| `dC` | `initCallerSessionEnvModule` | inferred | 56384 | v0.8.4 |
| `TC` | `issueWorkerToolContextToken` | inferred | 57255 | v0.8.0 |
| `Pve` | `assertJobWorkspaceUsable` | inferred | 62929 | v0.5.5 |
| `Dve` | `extractJobSdkConfig` | inferred | 63066 | v0.6.2 |
| `TO` | `listSessionIndexSummaries` | inferred | 66336 | v0.5.4 |
| `Twe` | `formatViewSessionsListLine` | inferred | 66384 | v0.8.2 |
| `Rft` | `renderActiveSessionsListing` | inferred | 66388 | v0.8.2 |
| `Zg` | `runViewSessionsTool` | inferred | 66421 | v0.8.2 |
| `wS` | `initViewSessionsToolModule` | inferred | 66433 | v0.8.2 |
| `GSe` | `archiveSessionDirUnlessAlreadyArchiving` | inferred | 67630 | v0.5.6 |
| `KSe` | `archiveSessionAndArtifacts` | inferred | 67646 | v0.5.0 |
| `HSe` | `readStateSourceChannelId` | inferred | 67787 | v0.5.0 |
| `JSe` | `listArchivedCopiesNewestFirst` | inferred | 67808 | v0.5.0 |
| `OEe` | `archiveLegacyRegistrySessionsDir` | __export | 71046 | v0.5.0 |
| `LEe` | `extractUrlHost` | inferred | 71328 | v0.7.0 |
| `VEe` | `acquireSessionDrainLock` | inferred | 71546 | v0.2.0 |
| `HEe` | `refreshSessionDrainLockHeartbeat` | inferred | 71569 | v0.2.0 |
| `WEe` | `releaseSessionDrainLock` | inferred | 71574 | v0.2.0 |
| `dJ` | `resolveSessionDrainLockPath` | inferred | 71586 | v0.2.0 |
| `JEe` | `readDrainLockFile` | inferred | 71589 | v0.2.0 |
| `x0e` | `drainSessionMailbox` | inferred | 72046 | v0.2.0 |
| `uo` | `classifySessionKeyOrUnknown` | inferred | 73130 |  |
| `Vyt` | `clearPendingGatewayNotice` | inferred | 73483 | v0.2.0 |
| `Hyt` | `setPendingInterruptedContext` | inferred | 73486 | v0.2.0 |
| `Wyt` | `clearPendingInterruptedContext` | inferred | 73492 | v0.2.0 |
| `Jyt` | `clearPendingSkipRewind` | inferred | 73495 | v0.2.0 |
| `cy` | `buildSessionInfoFromState` | inferred | 74042 | v0.2.0 |
| `__t` | `classifySessionPlane` | inferred | 74087 | v0.2.0 |
| `B0e` | `requestPiWorkerCatalog` | inferred | 74393 | v0.8.0 |
| `YS` | `resolvePiAgentDir` | inferred | 74856 | v0.8.0 |
| `XS` | `readPiAgentSettings` | inferred | 74860 | v0.8.0 |
| `J0e` | `selectInstructionsFingerprint` | inferred | 74886 | v0.8.0 |
| `AJ` | `canonicalizeJsonValue` | inferred | 74890 | v0.8.0 |
| `G0e` | `buildPiConfigSignature` | inferred | 74899 | v0.8.0 |
| `qIe` | `stringifyExecutionToolInput` | inferred | 81947 | v0.2.0 |
| `BIe` | `computeStreamEventDedupKey` | inferred | 81957 | v0.2.0 |
| `VIe` | `buildSessionExecutionPayload` | inferred | 81961 | v0.2.0 |
| `Tk` | `channelKindFromSessionKey` | inferred | 81991 | v0.2.0 |
| `JIe` | `listDefaultClaudeToolNames` | inferred | 82004 | v0.2.0 |
| `XG` | `inferActorOriginFromSessionKey` | inferred | 82008 | v0.4.0 |
| `GIe` | `classifySessionPoolKind` | inferred | 82020 | v0.2.0 |
| `KIe` | `isAvailableWorkspacePath` | inferred | 82024 | v0.2.0 |
| `My` | `SESSION_SCHEMA_VERSION` | __export | 82032 |  |
| `ZIe` | `createJobSessionFinalizer` | inferred | 82037 | v0.8.0 |
| `Nk` | `computeInstructionsFingerprint` | __export | 84126 | v0.4.5 |
| `pK` | `computeNonBoardInstructionsFingerprint` | __export | 84135 | v0.5.10 |
| `KN` | `diffStreamingConfigSignature` | __export | 84142 | v0.5.10 |
| `ETe` | `computeMissionFingerprint` | __export | 84175 | v0.5.1 |
| `ZN` | `runInstructionsFingerprintGuard` | __export | 84180 | v0.4.5 |
| `ITe` | `collectInstructionsInputs` | inferred | 84334 | v0.5.1 |
| `Dk` | `initInstructionsFingerprintModule` | inferred | 84369 | v0.8.0 |
| `mK` | `narrowToModelSettableAdapter` | inferred | 84383 | v0.8.0 |
| `hK` | `computeStreamingConfigSignature` | inferred | 84387 | v0.8.0 |
| `YN` | `readLiveStreamContextToken` | inferred | 84405 | v0.8.0 |
| `gK` | `isLiveStreamRebuildRequired` | inferred | 84415 | v0.8.0 |
| `XN` | `flagStreamRecreationOnModelReject` | inferred | 84421 | v0.8.0 |
| `PTe` | `createModelCommandResolvers` | inferred | 84439 | v0.8.0 |
| `pSt` | `recordPendingInterruptMarker` | inferred | 84577 | v0.8.2 |
| `ATe` | `prependPendingInterruptMarker` | inferred | 84599 | v0.8.2 |
| `tD` | `interruptActorQuery` | inferred | 84620 | v0.8.0 |
| `yK` | `triggerDeferredPreempt` | inferred | 84624 | v0.8.0 |
| `Mk` | `requestBoundaryAwarePreempt` | inferred | 84633 | v0.8.0 |
| `NTe` | `snapshotInflightEventIds` | inferred | 84642 | v0.8.0 |
| `bp` | `teardownStreamingSession` | inferred | 84647 | v0.8.0 |
| `_K` | `waitForWakeOrIdleTimeout` | inferred | 84662 | v0.8.0 |
| `nD` | `shutdownActorRuntimeAdapter` | inferred | 84676 | v0.8.0 |
| `jTe` | `memoizeAvailabilityProbeUntilOk` | inferred | 85441 | v0.8.3 |
| `wSt` | `createSessionManager` | __export | 85448 | v0.2.0 |
| `NSt` | `createMetaSession` | __export | 87666 | v0.2.0 |
| `DSt` | `sweepTombstonedSessionRecords` | __export | 88258 | v0.5.6 |
| `Wc` | `resolveMainSessionFromIndex` | inferred | 90370 | v0.8.7 |
| `ZSe` | `createIdleCompactSweeper` | inferred | 90528 | v0.5.10 |
| `RK` | `resolvePreemptFromCommandText` | inferred | 92480 | v0.2.0 |
| `ikt` | `classifySessionPlaneByKey` | inferred | 92536 | v0.2.0 |
| `lPe` | `resolveIsolatedPlaneKind` | inferred | 92846 | v0.8.2 |

## 04-cognition-prompt

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Hw` | `resolveMetaPromptText` | __export | 56763 | v0.2.0 |
| `QV` | `resolveRolePromptText` | __export | 56774 | v0.8.7 |
| `SC` | `composeIdentityLayer` | __export | 56785 | v0.8.7 |
| `uut` | `renderJobAcceptanceBlock` | inferred | 56792 | v0.8.0 |
| `I_e` | `renderJobMissionBlock` | __export | 56798 | v0.4.5 |
| `T_e` | `renderPromptLayers` | __export | 56805 | v0.2.0 |
| `$g` | `buildSystemPromptForChannelConfig` | __export | 56832 | v0.7.1 |
| `zve` | `extractSystemPromptAppend` | __export | 63699 | v0.4.4 |
| `USe` | `decideRestartHintInjection` | inferred | 67585 | v0.5.2 |
| `qSe` | `renderDaemonRestartHint` | inferred | 67614 | v0.5.2 |
| `UA` | `formatLocalTimestampWithZone` | inferred | 71810 | v0.5.0 |
| `n0e` | `decideBoardUpdatedInjection` | inferred | 71833 | v0.5.10 |
| `r0e` | `renderBoardUpdatedHint` | inferred | 71857 | v0.5.10 |
| `S0e` | `projectJobPromptContext` | inferred | 71912 | v0.8.0 |
| `Lt` | `escapeXmlText` | inferred | 73111 | v0.2.0 |
| `Ayt` | `renderJobCompleteReceiptGuidance` | inferred | 73134 | v0.4.0 |
| `bJ` | `extractStandInOwnerInfo` | inferred | 73142 | v0.8.7 |
| `vJ` | `renderForOwnerAttribute` | inferred | 73148 | v0.8.7 |
| `R0e` | `describeStandInJobOwner` | inferred | 73152 | v0.8.7 |
| `Nyt` | `renderJobFailureNotification` | inferred | 73160 | v0.4.0 |
| `VA` | `renderMailboxEventPrompt` | inferred | 73196 | v0.2.0 |
| `Myt` | `renderSkipRewindBlock` | inferred | 73281 | v0.2.0 |
| `Lyt` | `resolvePendingCompactNotice` | inferred | 73295 | v0.5.10 |
| `Fyt` | `renderSmartCompactNoticeBlock` | inferred | 73318 | v0.5.10 |
| `I0e` | `formatElapsedDuration` | inferred | 73327 | v0.3.0 |
| `T0e` | `computeTimeGapContext` | inferred | 73338 | v0.8.0 |
| `zyt` | `renderTimeGapContextBlock` | inferred | 73347 | v0.3.0 |
| `qyt` | `renderJobTickBlock` | inferred | 73361 | v0.4.5 |
| `P0e` | `buildTransientUserBlocks` | inferred | 73375 | v0.2.0 |
| `vTe` | `transcludeBroadcastBoard` | inferred | 83975 | v0.5.2 |
| `rSt` | `renderTranscludedFiles` | inferred | 83983 | v0.5.2 |
| `wTe` | `resolveBoardIncludes` | inferred | 83990 | v0.5.2 |
| `oSt` | `realpathOrSelf` | inferred | 84024 | v0.5.2 |
| `gTe` | `normalizeIncludePathKey` | inferred | 84032 | v0.5.2 |
| `sSt` | `stripBoardIncludeFrontmatter` | inferred | 84037 | v0.5.2 |
| `aSt` | `parseBoardFileContent` | inferred | 84045 | v0.5.2 |
| `uSt` | `stripBoardHtmlComments` | inferred | 84056 | v0.5.2 |
| `lSt` | `collectBoardIncludePaths` | inferred | 84073 | v0.5.2 |
| `cSt` | `normalizeBoardIncludeToken` | inferred | 84102 | v0.5.2 |
| `dSt` | `isBoardIncludePathCandidate` | inferred | 84108 | v0.5.2 |
| `fSt` | `resolveBoardIncludePath` | inferred | 84112 | v0.5.2 |
| `STe` | `initBoardTransclusionModule` | inferred | 84115 | v0.5.2 |
| `RTe` | `selectSessionRolePrompt` | inferred | 84328 | v0.8.7 |

## 05-drain-turn

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Uq` | `detectInProcessBreak` | __export | 38361 | v0.5.10 |
| `grt` | `sanitizeDrainRecordSegment` | inferred | 38369 | v0.2.0 |
| `eu` | `drainRecordPath` | __export | 38373 | v0.2.0 |
| `xf` | `appendDrainRecord` | __export | 38376 | v0.2.0 |
| `Eh` | `readDrainRecords` | __export | 38395 | v0.8.2 |
| `HI` | `createEmptyUsageSummary` | inferred | 38401 | v0.8.2 |
| `Afe` | `accumulateDrainRecordIntoSummary` | inferred | 38461 | v0.2.0 |
| `wv` | `summarizeDrainRecords` | __export | 38473 | v0.8.2 |
| `Nfe` | `aggregateSessionDrainSummary` | inferred | 38478 | v0.8.2 |
| `Bq` | `readGlobalUsageTotals` | __export | 38500 | v0.4.4 |
| `yrt` | `readRecentDrainRecords` | __export | 38517 | v0.2.0 |
| `Cfe` | `IN_PROCESS_BREAK_HIT_RATIO_FLOOR` | __export | 38534 |  |
| `cC` | `runSkipTool` | inferred | 56350 | v0.2.0 |
| `nl` | `initSkipToolModule` | inferred | 56374 | v0.2.0 |
| `Pg` | `isAbortLikeError` | __export | 56662 | v0.2.0 |
| `Vg` | `selectInterruptMarkerText` | inferred | 63571 | v0.8.2 |
| `Hg` | `normalizeTurnAbortReason` | inferred | 63575 | v0.8.2 |
| `aS` | `initInterruptMarkerTextModule` | inferred | 63578 | v0.8.2 |
| `Fve` | `computeCodexTurnUsage` | __export | 63675 | v0.5.6 |
| `YEe` | `normalizeInputTokenTotals` | inferred | 71773 | v0.5.6 |
| `XEe` | `computeCacheHitRate` | inferred | 71789 | v0.5.6 |
| `yJ` | `addToNumericField` | inferred | 71869 | v0.3.0 |
| `Oo` | `runTimedDrainPhase` | inferred | 71877 | v0.3.0 |
| `a0e` | `resolveTurnModelWithLayer` | inferred | 71922 | v0.8.1 |
| `u0e` | `resolveTurnEffortWithLayer` | inferred | 71935 | v0.8.1 |
| `c0e` | `extractServedModelFromUsage` | inferred | 71951 | v0.8.1 |
| `BA` | `isChannelMessageEvent` | inferred | 71956 | v0.8.1 |
| `EJ` | `prepareDrainTurnContext` | inferred | 71959 | v0.3.7 |
| `k0e` | `buildTurnSdkRunConfig` | inferred | 72011 | v0.2.0 |
| `d0e` | `resolveDrainContextProfileOrRefuse` | inferred | 72027 | v0.7.0 |
| `ao` | `isNonNullObject` | inferred | 73045 | v0.2.0 |
| `Xt` | `readStringProperty` | inferred | 73049 | v0.2.0 |
| `hJ` | `readNonNegativeNumberField` | inferred | 73054 | v0.5.10 |
| `RJ` | `extractPayloadMediaRefs` | inferred | 73060 | v0.2.0 |
| `Byt` | `mergeInterruptedContextTexts` | inferred | 73477 | v0.2.0 |
| `Gyt` | `hasSkipRewindRecordSince` | inferred | 73498 | v0.5.6 |
| `p0e` | `markTurnSkippedFromSkipRecord` | inferred | 73504 | v0.8.0 |
| `qA` | `clearPendingOutboundAttachments` | inferred | 73507 | v0.2.0 |
| `IJ` | `readPendingOutboundAttachments` | inferred | 73510 | v0.2.0 |
| `TJ` | `batchDrainItems` | inferred | 73514 | v0.2.0 |
| `$0e` | `loadDrainItemEventCached` | inferred | 73551 | v0.2.0 |
| `m0e` | `parseEventTimestampMs` | inferred | 73563 | v0.2.0 |
| `Zyt` | `isMergeableDrainBatch` | inferred | 73569 | v0.8.1 |
| `Yyt` | `isMergeableChannelMessageBatch` | inferred | 73573 | v0.5.5 |
| `C0e` | `hasUniformDrainCoalesceKey` | inferred | 73581 | v0.5.5 |
| `O0e` | `isWorkerTaskNotifyDelivery` | inferred | 73587 | v0.5.5 |
| `SJ` | `extractJobCompletePayload` | inferred | 73595 | v0.8.0 |
| `A0e` | `extractJobCompletionJobId` | inferred | 73601 | v0.8.0 |
| `h0e` | `classifyDrainBatchClass` | inferred | 73608 | v0.8.1 |
| `Qyt` | `computeDrainCoalesceKey` | inferred | 73616 | v0.2.0 |
| `e_t` | `resolveEventSourceChannelId` | inferred | 73624 | v0.2.0 |
| `t_t` | `renderJobCompletionReceipt` | inferred | 73636 | v0.8.0 |
| `n_t` | `collectJobCompletionReceipts` | inferred | 73653 | v0.8.1 |
| `r_t` | `renderCoalescedDrainPrompt` | inferred | 73681 | v0.8.1 |
| `D0e` | `createDrainExecutionEventRecorder` | inferred | 73693 | v0.2.0 |
| `g0e` | `renderTurnOutputText` | inferred | 73749 | v0.2.0 |
| `o_t` | `renderManualCompactNotice` | inferred | 73753 | v0.5.5 |
| `s_t` | `isStaleIdleCompactEvent` | inferred | 73759 | v0.5.10 |
| `y0e` | `countCompactGapIntervals` | inferred | 73764 | v0.5.10 |
| `_0e` | `buildCompactStatsRecord` | inferred | 73788 | v0.5.10 |
| `l_t` | `recordIdleCompactFireMetric` | inferred | 73821 | v0.5.10 |
| `c_t` | `runHistoryControlCommand` | inferred | 73829 | v0.5.2 |
| `M0e` | `resolveReplyTargetSessionKeys` | inferred | 73851 | v0.2.0 |
| `Qc` | `emitDrainOutputRecords` | inferred | 73863 | v0.2.0 |
| `d_t` | `renderDrainErrorRuntimeHint` | inferred | 73920 | v0.5.6 |
| `GS` | `handleDrainError` | inferred | 73947 | v0.5.0 |
| `f_t` | `clearModelOverrideOnRuntimeFlip` | inferred | 74003 | v0.5.6 |
| `p_t` | `resolvePendingModelFork` | inferred | 74020 | v0.5.6 |
| `m_t` | `describeWorkspaceProblem` | inferred | 74059 | v0.2.0 |
| `h_t` | `renderWorkspaceUnavailableNotice` | inferred | 74063 | v0.2.0 |
| `g_t` | `renderRuntimeUnavailableGuidance` | inferred | 74068 | v0.5.4 |
| `y_t` | `renderRuntimeMismatchGuidance` | inferred | 74076 | v0.8.3 |
| `b0e` | `runDrainQueryAndCollectOutboundAttachments` | inferred | 74102 | v0.5.0 |
| `j0e` | `mergeOutboundAttachmentLists` | inferred | 74183 | v0.5.0 |
| `k_t` | `runDrainTurnWithResumeFallback` | inferred | 74193 | v0.2.0 |
| `KS` | `initMailboxDrainRunnerModule` | inferred | 74325 | v0.2.0 |
| `z_t` | `extractSessionKeyChannelKind` | inferred | 74929 | v0.2.0 |
| `fy` | `runQueueOutboundAttachmentTool` | inferred | 74985 | v0.2.0 |
| `QS` | `initQueueOutboundAttachmentModule` | inferred | 75016 | v0.2.0 |

## 06-runtime-claude

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Wf` | `hasParentToolUseId` | inferred | 56397 | v0.5.7 |
| `Eg` | `createAbortErrorWithCause` | inferred | 56403 | v0.2.0 |
| `fC` | `extractSdkMessageTextChunks` | inferred | 56408 | v0.3.0 |
| `pC` | `extractStreamTextDeltas` | inferred | 56441 | v0.3.0 |
| `mC` | `extractStreamThinkingText` | inferred | 56469 | v0.3.0 |
| `hC` | `parseToolUseBlockStart` | inferred | 56491 | v0.3.2 |
| `gC` | `parseInputJsonDelta` | inferred | 56506 | v0.3.2 |
| `yC` | `stringifyToolResultContent` | inferred | 56519 | v0.3.0 |
| `eut` | `selectDominantModelByInputTokens` | inferred | 56530 | v0.5.6 |
| `Rg` | `mapClaudeResultToDrainUsage` | inferred | 56555 | v0.3.0 |
| `_C` | `resolveClaudeCostBaseline` | inferred | 56578 | v0.8.4 |
| `bC` | `buildClaudeCostBaseline` | inferred | 56587 | v0.8.4 |
| `S_e` | `findDeadAllowedToolEntries` | __export | 56639 | v0.5.10 |
| `k_e` | `splitDisallowedToolsForClaude` | __export | 56644 | v0.5.10 |
| `qw` | `isAgentSdkTurnInterruptedError` | __export | 56654 |  |
| `Bw` | `isAgentSdkPromptNotAcceptedAbortError` | __export | 56658 |  |
| `Gf` | `normalizeOptionalEnvString` | inferred | 56675 |  |
| `E_e` | `probeClaudeAvailability` | __export | 56684 | v0.5.3 |
| `XV` | `isClaudeAvailable` | __export | 56714 | v0.5.3 |
| `Vw` | `claudeUnavailableReason` | __export | 56718 | v0.5.3 |
| `out` | `primeClaudeAvailability` | __export | 56721 | v0.5.3 |
| `sut` | `__resetClaudeProbeCacheForTest` | __export | 56725 | v0.5.3 |
| `aut` | `__setClaudeVerifierForTest` | __export | 56729 | v0.5.3 |
| `R_e` | `verifyClaudeCodeRuntimeAvailable` | __export | 56733 | v0.5.0 |
| `eH` | `eventToMessageGenerator` | __export | 56870 | v0.2.0 |
| `kC` | `stringToMessageGenerator` | __export | 56898 | v0.2.0 |
| `GV` | `parsePositiveMsEnv` | __export | 56908 | v0.5.8 |
| `put` | `disableSystemPromptSnapshot` | inferred | 56914 | v0.8.1 |
| `Kf` | `createAgentSdkAdapter` | __export | 56925 | v0.2.0 |
| `Or` | `AgentSdkPromptNotAcceptedAbortError` | __export | 57230 |  |
| `Vr` | `AgentSdkTurnInterruptedError` | __export | 57230 |  |
| `Tg` | `CLAUDE_CORE_TOOLS` | __export | 57230 |  |
| `To` | `initAgentSdkAdapterModule` | inferred | 57230 | v0.5.10 |
| `Gft` | `buildClaudeSettingsEnvOverrides` | inferred | 67107 | v0.7.0 |
| `Hwe` | `materializeClaudeSettingsFile` | inferred | 67160 | v0.7.0 |
| `IS` | `computeContextProfileSignature` | inferred | 67171 | v0.7.0 |
| `TS` | `initMaterializedClaudeSettingsModule` | inferred | 67183 | v0.7.0 |
| `Kwe` | `mergeClaudeToolLists` | inferred | 67215 | v0.5.10 |
| `D6` | `applyJobSdkConfigOverride` | inferred | 67345 | v0.6.2 |
| `$xe` | `writeHostClaudeCodeExecutableEnvConfig` | __export | 70526 | v0.5.1 |
| `MW` | `CLAUDE_CODE_EXECUTABLE_ENV_KEY` | __export | 70595 |  |
| `dp` | `resolveContextCapToken` | inferred | 71281 | v0.7.0 |
| `AA` | `describeContextProfileSource` | inferred | 71291 | v0.7.0 |
| `NA` | `extractProfiledEndpointFields` | inferred | 71305 | v0.7.0 |
| `DA` | `listSortedAliasKeys` | inferred | 71336 | v0.7.0 |
| `DEe` | `buildProfiledExternalRequirement` | inferred | 71345 | v0.7.0 |
| `uJ` | `classifyModelContextRequirement` | inferred | 71375 | v0.7.0 |
| `ay` | `selectProfileIssuesForModel` | inferred | 71401 | v0.7.0 |
| `uy` | `resolveClaudeContextRequirement` | inferred | 71517 | v0.7.0 |
| `JS` | `isClaudeRuntimeOrDefault` | inferred | 71611 | v0.8.0 |
| `LA` | `prepareClaudeContextProfile` | inferred | 71614 | v0.7.0 |
| `o0e` | `normalizeDirPathForCompare` | inferred | 71901 | v0.5.2 |
| `s0e` | `resolveAdditionalDirClaudeMdAutoload` | inferred | 71906 | v0.5.2 |
| `Ny` | `createAladuoMcpServer` | inferred | 81673 | v0.2.0 |
| `OTe` | `initAbortableAsyncQueueModule` | inferred | 84537 | v0.3.0 |
| `DTe` | `createClaudeStreamingSessionFactory` | inferred | 84695 | v0.8.0 |

## 07-runtime-codex

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `u6` | `buildCodexDirectOnlyToolConfig` | inferred | 63615 | v0.7.1 |
| `ip` | `isCodexAvailable` | __export | 63621 | v0.5.0 |
| `mdt` | `codexUnavailableReason` | __export | 63625 |  |
| `hdt` | `primeCodexAvailability` | __export | 63628 | v0.5.0 |
| `gdt` | `__setCodexAvailabilityForTests` | __export | 63633 | v0.5.0 |
| `Wg` | `resolveCodexSandbox` | __export | 63637 | v0.4.4 |
| `qc` | `checkCodexAvailability` | __export | 63641 | v0.4.4 |
| `f6` | `ensureAgentsMdSymlink` | __export | 63661 | v0.4.4 |
| `Lve` | `codexNotificationFilterDecision` | __export | 63671 | v0.5.4 |
| `Uve` | `buildBaseInstructions` | __export | 63703 | v0.4.4 |
| `qve` | `buildDeveloperInstructions` | __export | 63721 | v0.4.4 |
| `l6` | `buildCodexTurnInput` | __export | 63735 | v0.7.0 |
| `lS` | `createCodexAppServerAdapter` | __export | 63748 | v0.4.4 |
| `bdt` | `resolveCodexSandboxForPermissionMode` | inferred | 64210 | v0.4.4 |
| `uS` | `isCodexPlainObject` | inferred | 64223 |  |
| `Bve` | `isImageGenerationItemType` | inferred | 64227 | v0.5.0 |
| `Vve` | `hasImageGenerationRecord` | __export | 64234 | v0.5.7 |
| `Hve` | `extractCodexGeneratedImageAttachment` | __export | 64250 | v0.5.0 |
| `Wve` | `capitalizeFirstChar` | inferred | 64278 | v0.6.0 |
| `Jve` | `warnUnmappedCodexItemOnce` | inferred | 64301 | v0.6.0 |
| `Gve` | `mapItemStartedToExecEvent` | __export | 64309 | v0.4.4 |
| `Kve` | `mapItemCompletedToExecEvent` | __export | 64420 | v0.4.4 |
| `mO` | `ALADUO_TOOL_NAMESPACE` | __export | 64493 |  |
| `op` | `initCodexAppServerModule` | inferred | 64493 | v0.4.4 |
| `nyt` | `generatePartitionCodexAgents` | __export | 70920 | v0.5.3 |
| `TEe` | `parseAgentMarkdown` | __export | 70994 | v0.5.3 |
| `PEe` | `renderAgentToml` | __export | 71009 | v0.5.3 |
| `pyt` | `generateAllPartitionCodexAgents` | inferred | 71228 | v0.5.3 |
| `Dy` | `buildCodexStringInputSchema` | inferred | 81803 | v0.4.4 |
| `FN` | `buildCodexDynamicTools` | inferred | 81823 | v0.4.4 |

## 08-cadence-subconscious

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `zI` | `containsWhitespaceChar` | inferred | 38155 | v0.5.6 |
| `UI` | `isProviderQualifiedModelId` | inferred | 38159 | v0.2.0 |
| `ZV` | `PARTITION_CORE_TOOLS` | __export | 57230 |  |
| `rS` | `parseScheduleDurationMs` | inferred | 62726 | v0.6.1 |
| `XH` | `assertScheduleDurationRepresentable` | inferred | 62737 | v0.6.1 |
| `QH` | `isOneShotJobSchedule` | inferred | 62741 | v0.4.5 |
| `wve` | `validateJobScheduleExpression` | inferred | 62745 | v0.6.1 |
| `iS` | `parseJobRearmTime` | inferred | 62762 | v0.5.6 |
| `Sve` | `computeJobNextDue` | inferred | 62774 | v0.8.9 |
| `Yct` | `computeScheduleNextDue` | inferred | 62792 | v0.2.0 |
| `kve` | `isJobScheduleDue` | inferred | 62851 | v0.8.9 |
| `e6` | `resolveJobScheduleAnchor` | inferred | 62856 | v0.8.9 |
| `xve` | `computeJobNextRunAt` | inferred | 62864 | v0.8.9 |
| `oS` | `initJobScheduleModule` | inferred | 62871 | v0.8.9 |
| `Eve` | `isPathWithinDir` | inferred | 62883 | v0.2.0 |
| `edt` | `normalizeJobCwdRelText` | inferred | 62894 | v0.2.0 |
| `Tve` | `resolveJobCwdRel` | inferred | 62898 | v0.2.0 |
| `$ve` | `resolveJobExecutionWorkspace` | inferred | 62938 | v0.2.0 |
| `Cve` | `prepareJobExecutionWorkspace` | inferred | 62955 | v0.2.0 |
| `zc` | `buildJobSessionKey` | inferred | 63005 | v0.2.0 |
| `Ave` | `parseJobFileFrontmatter` | inferred | 63027 | v0.2.0 |
| `sdt` | `renderJobFileMarkdown` | inferred | 63048 | v0.2.0 |
| `al` | `initJobManagerModule` | inferred | 63112 | v0.2.0 |
| `rp` | `redactJobModelProfileTokens` | inferred | 63551 | v0.7.0 |
| `yO` | `renderManageJobToolDescription` | inferred | 65507 | v0.8.0 |
| `_O` | `renderJobSessionToolDescription` | inferred | 65514 |  |
| `Kdt` | `renderJobPromptModeDescription` | inferred | 65525 | v0.8.0 |
| `Zdt` | `renderJobExtraToolsDescription` | inferred | 65532 | v0.8.0 |
| `lwe` | `buildJobPromptModeExtraToolsSchema` | inferred | 65536 | v0.8.0 |
| `eft` | `listSelectableJobRuntimes` | inferred | 65543 | v0.5.4 |
| `dwe` | `buildJobRuntimeSchemaField` | inferred | 65552 | v0.5.4 |
| `bO` | `buildManageJobInputSchema` | inferred | 65560 |  |
| `vO` | `buildJobSessionInputSchema` | inferred | 65569 |  |
| `Kg` | `runManageJobTool` | inferred | 65577 | v0.2.0 |
| `mS` | `initManageJobToolModule` | inferred | 65716 | v0.8.0 |
| `Rwe` | `classifyConsumerStaleness` | inferred | 66199 | v0.8.2 |
| `x6` | `resolveNotifyUnconsumedHours` | inferred | 66212 | v0.8.2 |
| `E6` | `initNotifyConsumerStalenessModule` | inferred | 66218 | v0.8.2 |
| `ul` | `evaluateNotifyConsumerRefusal` | inferred | 66226 | v0.8.2 |
| `wft` | `listSessionsWithRecentConsumer` | inferred | 66253 | v0.8.2 |
| `IO` | `renderNotifyRefusalMessage` | inferred | 66288 | v0.8.2 |
| `Yg` | `runRemindDuoduoTool` | inferred | 66453 | v0.8.2 |
| `kS` | `initRemindDuoduoToolModule` | inferred | 66486 | v0.8.2 |
| `MO` | `normalizeNotifyChannelTarget` | inferred | 66499 | v0.2.0 |
| `Lwe` | `classifyNotifySessionKind` | inferred | 66685 |  |
| `Fwe` | `isJobSessionKeyKind` | inferred | 66693 | v0.2.0 |
| `Nft` | `renderMetaNotifyModeGuidance` | inferred | 66712 | v0.3.0 |
| `Cwe` | `renderChannelNotifyModeGuidance` | inferred | 66717 | v0.3.0 |
| `Dft` | `renderSystemNotifyModeGuidance` | inferred | 66722 | v0.3.0 |
| `FO` | `renderNotifyToolDescription` | inferred | 66727 | v0.2.0 |
| `zO` | `buildNotifyInputSchema` | inferred | 66746 | v0.2.0 |
| `zwe` | `isOrphanJobSessionKey` | inferred | 66772 | v0.6.2 |
| `Lft` | `computeBoundedEditDistance` | inferred | 66809 | v0.5.0 |
| `Fft` | `matchNearMissSessionKey` | inferred | 66828 | v0.5.0 |
| `$6` | `groupNotifyTargetCandidates` | inferred | 66870 | v0.5.0 |
| `C6` | `renderNotifyTargetCandidateLines` | inferred | 66888 | v0.5.0 |
| `Uft` | `resolveJobOwnerNotifyTarget` | inferred | 66908 | v0.2.0 |
| `qft` | `resolveNotifyTargetSessionKey` | inferred | 66917 | v0.2.0 |
| `Mwe` | `renderNotifyDeliveryReport` | inferred | 66961 | v0.2.0 |
| `Qg` | `runNotifyTool` | inferred | 66975 | v0.2.0 |
| `RS` | `initNotifyToolModule` | inferred | 67077 | v0.2.0 |
| `DS` | `loadSubconsciousPartitions` | inferred | 67846 | v0.2.0 |
| `Upt` | `parsePartitionDefinition` | inferred | 67870 | v0.2.0 |
| `ey` | `readPlaylistRound` | inferred | 67911 | v0.2.0 |
| `qpt` | `parsePlaylistCurrentRound` | inferred | 67929 | v0.2.0 |
| `XO` | `markPlaylistItemExecuted` | inferred | 67948 | v0.2.0 |
| `uke` | `rebuildPlaylistRound` | inferred | 67966 | v0.2.0 |
| `lke` | `readPartitionInboxEntries` | inferred | 68010 | v0.2.0 |
| `QO` | `initSubconsciousPlaylistModule` | inferred | 68053 | v0.2.0 |
| `dke` | `resolvePartitionStatePath` | inferred | 68073 | v0.3.1 |
| `ap` | `readPartitionRunState` | inferred | 68076 | v0.3.1 |
| `rW` | `writePartitionRunState` | inferred | 68099 | v0.3.1 |
| `iW` | `isPartitionBackedOff` | inferred | 68103 | v0.3.1 |
| `oW` | `computePartitionBackoffUntil` | inferred | 68107 | v0.3.1 |
| `eA` | `initPartitionRunStateModule` | inferred | 68119 | v0.3.1 |
| `wxe` | `resolveCadenceIntervalMs` | __export | 70227 | v0.8.0 |
| `Wgt` | `computeLegacyJobSessionKey` | inferred | 70719 | v0.8.0 |
| `Jgt` | `rewriteSessionKeyInStateAndMeta` | inferred | 70740 | v0.8.0 |
| `bEe` | `migrateLegacyJobSessionKeys` | inferred | 70774 | v0.8.0 |
| `kEe` | `retireListedPartitions` | inferred | 70826 | v0.8.0 |
| `Xgt` | `retirePartitionOnce` | inferred | 70839 | v0.8.0 |
| `xEe` | `initPartitionRetirementModule` | inferred | 70891 | v0.8.0 |
| `WIe` | `isAutoArchivedJobSchedule` | inferred | 81996 | v0.4.0 |
| `Pk` | `classifyJobScheduleType` | inferred | 82000 | v0.4.0 |
| `zTe` | `normalizePartitionOutputText` | inferred | 87544 | v0.2.0 |
| `RSt` | `stringifyPartitionToolInput` | inferred | 87549 | v0.2.0 |
| `TSt` | `detectEmptyRequiredPartitionOutput` | inferred | 87559 | v0.2.0 |
| `PSt` | `appendPartitionToolEvent` | inferred | 87562 | v0.2.0 |
| `$St` | `hashActivityFingerprint` | inferred | 87601 | v0.2.0 |
| `CSt` | `readLatestExternalEventId` | inferred | 87604 | v0.5.3 |
| `rD` | `readNewestMtimeRecursive` | inferred | 87623 | v0.5.3 |
| `OSt` | `renderPartitionRuntimeContext` | inferred | 87649 | v0.2.0 |
| `ASt` | `renderPartitionInboxSection` | inferred | 87656 | v0.5.3 |
| `qTe` | `initMetaSessionModule` | inferred | 88223 | v0.8.0 |
| `MSt` | `runCadenceTick` | __export | 88318 | v0.2.0 |
| `vK` | `scanAndSpawnDueJobs` | __export | 88349 | v0.2.0 |
| `jSt` | `fireDueWakeRecords` | inferred | 88437 | v0.8.2 |
| `FSt` | `createJobScheduler` | __export | 88507 | v0.2.0 |
| `KTe` | `initJobSchedulerModule` | inferred | 88563 | v0.2.0 |
| `zSt` | `isJobOrMetaOutboxRecord` | inferred | 88574 | v0.2.0 |
| `USt` | `createOutboxDeliveryManager` | __export | 88578 | v0.2.0 |

## 09-memory

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `zb` | `partitionInboxDir` | __export | 32783 | v0.5.6 |
| `ic` | `partitionInboxDirFromVar` | __export | 32787 | v0.5.3 |
| `Fi` | `resolveMemoryDirs` | inferred | 68135 | v0.5.5 |
| `rA` | `bytesToKibCeil` | inferred | 68145 | v0.5.5 |
| `up` | `scanWikiLinkOccurrences` | inferred | 68149 | v0.5.5 |
| `lp` | `resolveMemoryLinkTargets` | inferred | 68174 | v0.5.5 |
| `Nr` | `compareStringsAscending` | inferred | 68180 | v0.5.5 |
| `fke` | `countDatedStampLines` | inferred | 68184 | v0.5.5 |
| `iA` | `countNewlineChars` | inferred | 68191 | v0.5.5 |
| `es` | `splitLinesDropTrailingEmpty` | inferred | 68198 | v0.5.5 |
| `Co` | `recordUnreadableMemoryPath` | inferred | 68213 | v0.7.1 |
| `mke` | `countUnreadableMemoryPaths` | inferred | 68217 |  |
| `$n` | `readMemoryFileSyncOrNull` | inferred | 68225 | v0.5.5 |
| `Jc` | `isMemoryPathFile` | inferred | 68233 | v0.5.5 |
| `ny` | `isMemoryPathDirectory` | inferred | 68241 | v0.5.5 |
| `cu` | `listMarkdownSlugsSync` | inferred | 68249 | v0.5.5 |
| `oA` | `measureUtf8ByteLength` | inferred | 68261 | v0.5.5 |
| `gke` | `normalizeSignalKindVersion` | inferred | 68269 | v0.5.6 |
| `ts` | `initMemorySignalKindsModule` | inferred | 68273 | v0.5.6 |
| `Kpt` | `parseEffectivenessTrajectory` | inferred | 68292 | v0.5.5 |
| `Zpt` | `parseEffectivenessCounts` | inferred | 68302 | v0.5.5 |
| `Ypt` | `parseUpdaterGuidanceVerdict` | inferred | 68321 | v0.5.5 |
| `Xpt` | `classifyTopicNodeFormat` | inferred | 68341 | v0.5.5 |
| `Qpt` | `classifyTopicNodeType` | inferred | 68349 | v0.5.5 |
| `yke` | `rankEffectivenessTrajectory` | inferred | 68360 | v0.5.5 |
| `emt` | `compareBoardLintTargets` | inferred | 68373 | v0.5.5 |
| `_ke` | `collectBoardLintReport` | inferred | 68424 | v0.5.5 |
| `omt` | `buildBoardLintTarget` | inferred | 68457 | v0.5.5 |
| `smt` | `runBoardLint` | inferred | 68488 | v0.5.5 |
| `bke` | `initBoardLintModule` | inferred | 68510 | v0.5.5 |
| `cW` | `isSafeMemorySlug` | inferred | 68518 | v0.5.5 |
| `Gc` | `createMemorySlugReader` | inferred | 68522 | v0.5.5 |
| `Kc` | `walkReachableMemory` | inferred | 68537 | v0.5.5 |
| `lmt` | `renderEntityConvergeSignalBody` | inferred | 68580 | v0.5.5 |
| `kke` | `runEntityLint` | inferred | 68588 | v0.5.5 |
| `xke` | `initEntityLintModule` | inferred | 68628 | v0.5.5 |
| `dmt` | `isAllowedNodeSection` | inferred | 68638 | v0.5.5 |
| `pmt` | `renderNodeConvergeSignalBody` | inferred | 68653 | v0.5.5 |
| `Eke` | `runNodeLint` | inferred | 68665 | v0.5.5 |
| `sA` | `buildNodeSignalKey` | inferred | 68714 | v0.5.5 |
| `Rke` | `initNodeLintModule` | inferred | 68724 | v0.5.5 |
| `FS` | `initGapSpanModule` | inferred | 68860 | v0.8.4 |
| `zS` | `readPartitionContract` | inferred | 68868 | v0.5.6 |
| `Pke` | `isPlainJsonObject` | inferred | 68945 |  |
| `cA` | `getCachedPartitionContract` | inferred | 68959 | v0.5.6 |
| `dA` | `postMemorySignalsToInboxes` | inferred | 68965 | v0.5.6 |
| `fA` | `enforceContractGate` | inferred | 69018 | v0.5.6 |
| `Nke` | `reconcileMemorySignalInboxes` | inferred | 69049 | v0.7.1 |
| `Dke` | `hasAnyMemorySignalConsumer` | inferred | 69092 | v0.5.6 |
| `Mke` | `isOrphanWarningDeliverable` | inferred | 69101 | v0.5.6 |
| `bW` | `initMemorySignalDeliveryModule` | inferred | 69104 | v0.5.6 |
| `hA` | `recordUnreadableUnlessMissing` | inferred | 69126 | v0.8.0 |
| `Cmt` | `listMemoryFragmentDates` | inferred | 69151 | v0.8.0 |
| `Dmt` | `readOrSeedGapHandedDays` | inferred | 69208 | v0.8.0 |
| `Lke` | `appendGapHandedSpan` | inferred | 69250 | v0.8.0 |
| `Fke` | `readGapLintDayEvents` | inferred | 69258 | v0.8.0 |
| `Uke` | `mergeContiguousHourRanges` | inferred | 69299 | v0.5.8 |
| `jmt` | `renderScanGapSignalBody` | inferred | 69318 | v0.5.8 |
| `Lmt` | `buildScanGapSignal` | inferred | 69324 | v0.8.0 |
| `mA` | `buildGapReadFaultResult` | inferred | 69333 | v0.8.0 |
| `Fmt` | `runGapLint` | inferred | 69351 | v0.8.0 |
| `Wke` | `deliverScanGapSignal` | inferred | 69387 | v0.8.0 |
| `Jke` | `initGapLintModule` | inferred | 69431 | v0.8.0 |
| `wW` | `readMemoryMaxLinesLimit` | inferred | 69495 | v0.8.0 |
| `Yke` | `runBroadcastBudgetLint` | inferred | 69505 | v0.8.0 |
| `SW` | `initBroadcastBudgetLintModule` | inferred | 69544 | v0.5.3 |
| `eht` | `listEventPartitionDates` | inferred | 69557 | v0.8.0 |
| `Xke` | `escapeRegExpSource` | inferred | 69572 |  |
| `nht` | `scanActivationWindowTouches` | inferred | 69584 | v0.8.0 |
| `rht` | `renderActivationReportHeader` | inferred | 69661 | v0.8.0 |
| `iht` | `renderBoardTemperatureSection` | inferred | 69666 | v0.8.0 |
| `oht` | `renderHotOrphansSection` | inferred | 69676 | v0.8.0 |
| `sht` | `renderActivationReportBody` | inferred | 69683 | v0.8.0 |
| `txe` | `runActivationLint` | inferred | 69689 | v0.8.0 |
| `TW` | `initActivationLintModule` | inferred | 69788 | v0.8.0 |
| `oxe` | `readIntuitionWeaverLastFinishedMs` | inferred | 69798 | v0.8.0 |
| `aht` | `findNewestFragmentMtimeMs` | inferred | 69804 | v0.8.0 |
| `uht` | `renderFoldGapBody` | inferred | 69834 | v0.8.0 |
| `sxe` | `runFoldGapLint` | inferred | 69840 | v0.8.0 |
| `axe` | `initFoldGapLintModule` | inferred | 69857 | v0.8.0 |
| `fht` | `extractBoardSlugLinks` | inferred | 69866 | v0.5.3 |
| `hht` | `formatSlugLinkLocations` | inferred | 69889 | v0.5.3 |
| `uxe` | `runBroadcastLinkLint` | inferred | 69903 | v0.8.0 |
| `lxe` | `initBroadcastLinkLintModule` | inferred | 69924 | v0.8.0 |
| `Sht` | `findBoardHeadingLines` | inferred | 69931 | v0.8.0 |
| `cxe` | `runBroadcastFlattenLint` | inferred | 69956 | v0.8.0 |
| `dxe` | `initBroadcastFlattenLintModule` | inferred | 69977 | v0.8.0 |
| `Eht` | `computeOrphanTopicNodes` | inferred | 69995 | v0.5.5 |
| `mxe` | `detectOrphanMemory` | inferred | 70044 | v0.5.5 |
| `hxe` | `buildOrphanNewbornSignals` | inferred | 70067 | v0.5.5 |
| `gxe` | `forgetMemoryEntry` | inferred | 70076 | v0.5.5 |
| `Rht` | `resolveGitToplevelSync` | inferred | 70112 | v0.5.5 |
| `Iht` | `renderOrphanIslandsBody` | inferred | 70126 | v0.5.5 |
| `yxe` | `filterOrphanIslands` | inferred | 70140 | v0.5.5 |
| `_xe` | `buildOrphanIslandsSignal` | inferred | 70144 | v0.5.5 |
| `Tht` | `computeMemoryLinkIndegree` | inferred | 70153 | v0.5.5 |
| `Pht` | `listMemorySlugReferrers` | inferred | 70164 | v0.5.5 |
| `PW` | `routeContractDecision` | inferred | 70181 | v0.5.5 |
| `Cht` | `formatForgetCommitMessage` | inferred | 70193 | v0.5.5 |
| `bxe` | `initOrphanMemoryModule` | inferred | 70196 | v0.5.5 |
| `CW` | `isTruthyEnvFlag` | inferred | 70213 | v0.5.5 |
| `AW` | `resolveMemoryCheckFlags` | __export | 70218 | v0.5.5 |
| `NW` | `buildMemoryCheckStatus` | __export | 70234 | v0.5.6 |
| `Oht` | `runMemoryCheckTick` | __export | 70248 | v0.5.5 |
| `OW` | `runMemoryCheckSubStep` | inferred | 70364 | v0.7.1 |
| `ba` | `runReadAuditedMemoryCheckStep` | inferred | 70372 | v0.7.1 |
| `Aht` | `evaluatePredicateOrFalse` | inferred | 70379 | v0.5.6 |
| `DW` | `initMemoryCheckTickModule` | inferred | 70386 | v0.5.6 |
| `eJ` | `runKernelGitCommand` | inferred | 70624 | v0.2.0 |
| `pEe` | `buildKernelGitEnv` | inferred | 70642 | v0.2.0 |
| `mEe` | `buildSafeDirectoryGitArgs` | inferred | 70654 | v0.5.2 |
| `Vgt` | `isKernelGitToplevel` | inferred | 70657 | v0.2.0 |
| `hEe` | `ensureKernelGitRepo` | inferred | 70670 | v0.2.0 |
| `Hgt` | `mergeKernelGitignoreEntries` | inferred | 70679 | v0.2.0 |
| `gEe` | `initKernelGitModule` | inferred | 70698 | v0.2.0 |
| `fK` | `computeBoardLayerHash` | __export | 84131 | v0.5.10 |

## 10-runtime-host

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `Oue` | `resolveRuntimePaths` | __export | 32698 | v0.2.0 |
| `wR` | `SUN_PATH_MAX_BYTES` | __export | 32790 |  |
| `Oi` | `isEffortLevel` | inferred | 32839 |  |
| `MR` | `isAgentRuntime` | inferred, published source (@openduo/protocol@0.8.4 channel.ts) | 32976 |  |
| `tI` | `isKnownRuntimeValue` | inferred | 33109 |  |
| `Hb` | `isSupportedRuntime` | inferred | 33113 |  |
| `LU` | `validateKnownRuntimeValue` | inferred | 33117 | v0.8.4 |
| `rf` | `validateRunnableRuntimeValue` | inferred | 33130 | v0.8.4 |
| `vo` | `resolveDefaultRuntime` | inferred | 33144 | v0.5.3 |
| `Uu` | `initRuntimeValidationModule` | inferred | 33153 | v0.8.4 |
| `sc` | `attachStreamLineReader` | inferred | 33196 | v0.8.0 |
| `Wue` | `parseLogLevelName` | inferred | 33322 | v0.2.0 |
| `Zm` | `parseEnvBooleanFlag` | inferred | 33328 | v0.2.0 |
| `EXe` | `resolveLogLevel` | inferred | 33341 | v0.3.3 |
| `RXe` | `isLogLevelEnabled` | inferred | 33345 | v0.2.0 |
| `IXe` | `formatLogPrefix` | inferred | 33349 | v0.2.0 |
| `of` | `writeLogLine` | inferred | 33353 | v0.2.0 |
| `ze` | `logErrorMessage` | inferred | 33357 | v0.2.0 |
| `X` | `logWarnMessage` | inferred | 33361 | v0.2.0 |
| `oe` | `logInfoMessage` | inferred | 33365 | v0.2.0 |
| `Re` | `logDebugMessage` | inferred | 33369 | v0.2.0 |
| `Jue` | `logTraceMessage` | inferred | 33373 | v0.3.6 |
| `TXe` | `isSessionLifecycleLoggingEnabled` | inferred | 33377 | v0.2.0 |
| `ct` | `logSessionLifecycleMessage` | inferred | 33381 | v0.2.0 |
| `St` | `logAlwaysAtLevel` | inferred | 33385 | v0.2.0 |
| `mt` | `initLogLevelModule` | inferred | 33390 | v0.2.0 |
| `iQe` | `appendTelemetryRecord` | inferred | 34230 | v0.3.0 |
| `oQe` | `isTelemetryEnabled` | inferred | 34235 | v0.4.5 |
| `wo` | `logLatencyStageTelemetry` | inferred | 34243 | v0.2.0 |
| `Es` | `recordTelemetryMetric` | inferred | 34251 | v0.3.0 |
| `Xi` | `formatYamlErrorMessage` | inferred | 36405 | v0.7.0 |
| `fv` | `normalizePromptMode` | inferred | 36451 | v0.2.0 |
| `pv` | `parseClaudeFrontmatterBlock` | inferred | 36652 | v0.5.10 |
| `dh` | `listFrontmatterKeyAliases` | inferred | 36766 | v0.5.10 |
| `wq` | `parseSdkConfigFrontmatter` | inferred | 36770 | v0.2.0 |
| `Dnt` | `parseChannelRuntimeField` | inferred | 36784 | v0.8.4 |
| `Ja` | `resolveLayeredChannelRuntime` | inferred | 36793 | v0.8.4 |
| `CI` | `parseChannelConfigFields` | inferred | 36830 | v0.5.10 |
| `gi` | `loadGlobalRuntimeConfig` | inferred | 38103 | v0.7.0 |
| `Xa` | `loadChannelKindConfig` | inferred | 38131 | v0.7.0 |
| `Qa` | `initChannelConfigLoaderModule` | inferred | 38147 | v0.7.0 |
| `rpt` | `buildEffectiveRuntimeFields` | inferred | 67200 | v0.8.4 |
| `WO` | `foldConfigLayersByKey` | inferred | 67219 | v0.7.0 |
| `Xwe` | `mergeRuntimeModelLayers` | inferred | 67248 | v0.8.1 |
| `Qwe` | `mergeRuntimeEffortLayers` | inferred | 67258 | v0.8.1 |
| `PS` | `readRuntimeModelSetting` | inferred | 67268 | v0.8.1 |
| `$S` | `readRuntimeEffortSetting` | inferred | 67272 | v0.8.1 |
| `au` | `mergeGlobalModelConfigLayers` | inferred | 67286 | v0.7.0 |
| `N6` | `overlayConfigEntriesByKey` | inferred | 67322 | v0.7.0 |
| `tSe` | `appendPiConfigIssues` | inferred | 67366 | v0.8.0 |
| `nSe` | `buildEffectiveChannelConfig` | inferred | 67370 | v0.2.0 |
| `uu` | `resolveEffectiveChannelConfig` | inferred | 67465 | v0.2.0 |
| `CS` | `isBusinessSourceKind` | inferred | 67480 | v0.7.0 |
| `M6` | `resolveEffectiveChannelConfigForEvent` | inferred | 67493 | v0.2.0 |
| `lu` | `resolveChannelConfigBySession` | inferred | 67510 | v0.5.10 |
| `bA` | `parseDotEnv` | __export | 70429 | v0.3.3 |
| `fl` | `hostDotEnvPath` | __export | 70444 | v0.4.3 |
| `jht` | `isHostModelEnvKey` | inferred | 70460 | v0.4.3 |
| `Rxe` | `removeHostModelEnvLines` | inferred | 70464 | v0.4.3 |
| `Ixe` | `removeDotEnvKeyLines` | inferred | 70471 | v0.5.1 |
| `vA` | `writeHostDotEnvLines` | inferred | 70483 | v0.4.3 |
| `LW` | `clearHostModelEnvVars` | __export | 70507 | v0.4.3 |
| `Txe` | `applyHostModelEnvVars` | __export | 70511 | v0.4.3 |
| `Pxe` | `writeHostModelEnvConfig` | __export | 70514 | v0.4.3 |
| `Cxe` | `clearHostModelEnvConfig` | __export | 70539 | v0.4.3 |
| `Fht` | `readHostDaemonToken` | __export | 70550 | v0.7.0 |
| `zht` | `writeHostDaemonToken` | __export | 70562 | v0.7.0 |
| `Oxe` | `readHostDotEnvFile` | __export | 70573 | v0.4.3 |
| `Uht` | `loadHostDotEnv` | __export | 70582 | v0.4.3 |
| `jW` | `HOST_MODEL_ENV_KEYS` | __export | 70595 |  |
| `Us` | `pathExistsAsync` | inferred | 70603 | v0.2.0 |
| `uyt` | `isDirEmptyOrMissing` | inferred | 71135 | v0.2.0 |
| `oJ` | `copyDirTreeOverwrite` | inferred | 71143 | v0.2.0 |
| `sJ` | `copyDirTreeMissingOnly` | inferred | 71154 | v0.2.0 |
| `cyt` | `refreshBootstrapDuoduoMdFiles` | inferred | 71165 | v0.2.0 |
| `dyt` | `copyBootstrapIntoKernel` | inferred | 71180 | v0.2.0 |
| `fyt` | `initializeRuntime` | __export | 71218 | v0.2.0 |
| `NEe` | `initRuntimeInitializationModule` | inferred | 71251 | v0.2.0 |
| `$J` | `encodePiWorkerFrame` | inferred | 74372 | v0.8.0 |
| `ZS` | `resolvePiWorkerCommand` | inferred | 74441 | v0.8.0 |
| `T_t` | `buildPiSystemPromptSpec` | inferred | 74453 | v0.8.0 |
| `WA` | `createPiWorkerAdapter` | inferred | 74478 | v0.8.0 |
| `X0e` | `parsePiToolResultDetails` | inferred | 75059 | v0.8.0 |
| `Q0e` | `handlePiToolEndObservation` | inferred | 75065 | v0.8.0 |
| `z6` | `CHANNEL_CONFIG_KEY_TYPES` | inferred | 89810 |  |
| `lpt` | `validateConfigValue` | inferred | 89848 | v0.5.10 |
| `$Se` | `writeInstanceModelAlias` | inferred | 90343 |  |
| `qht` | `isClaudeAuthSource` | inferred | 91166 | v0.4.3 |
| `zW` | `readClaudeAuthSourceEnv` | inferred | 91170 | v0.4.3 |
| `Zn` | `resolveEnvConfigEntry` | inferred | 92369 | v0.3.3 |
| `YSt` | `buildSdkConfigReport` | inferred | 92400 | v0.4.3 |
| `XSt` | `buildSystemConfigReport` | inferred | 92418 | v0.3.3 |
| `iPe` | `formatLayerModelAliases` | inferred | 93477 | v0.7.0 |
| `EK` | `formatModelConfigIssues` | inferred | 93500 | v0.7.0 |
| `Ly` | `appendConfigChangedEvent` | inferred | 93715 | v0.5.10 |

## 11-runtime-grok

| minified | 还原名 | 来源 | pretty 行 | 首见版本 |
|---|---|---|---|---|
| `y6` | `isGrokAvailable` | __export | 64733 |  |
| `xdt` | `grokUnavailableReason` | __export | 64737 |  |
| `Edt` | `primeGrokAvailability` | __export | 64740 | v0.7.1 |
| `Rdt` | `__setGrokAvailabilityForTests` | __export | 64745 |  |
| `Bc` | `checkGrokAvailability` | __export | 64748 | v0.7.1 |
| `dS` | `grokAcpExtMethod` | __export | 64769 | v0.7.1 |
| `ji` | `coerceToPlainObject` | inferred | 64778 | v0.7.1 |
| `owe` | `collectGrokToolCallNames` | inferred | 64821 | v0.7.1 |
| `Odt` | `isGrokSkipToolCall` | inferred | 64830 | v0.7.1 |
| `Adt` | `mapGrokUsageToDrainUsage` | inferred | 64834 | v0.7.1 |
| `fS` | `createGrokAcpAdapter` | __export | 64893 | v0.7.1 |
| `twe` | `GROK_ACP_COMPACT` | __export | 65451 |  |
| `Qve` | `GROK_ACP_EXT_PREFIX` | __export | 65451 |  |
| `ewe` | `GROK_ACP_SDK_CALL` | __export | 65451 |  |
| `Xve` | `GROK_AGENT_PROFILE` | __export | 65451 |  |
| `Yve` | `GROK_DISALLOWED_TOOLS` | __export | 65451 |  |
| `nwe` | `GROK_MCP_SDK_META` | __export | 65451 |  |
| `rwe` | `GROK_MCP_SERVERS_META` | __export | 65451 |  |
| `iwe` | `GROK_MCP_SERVER_NAME` | __export | 65451 |  |
| `Gg` | `initGrokAcpRuntimeModule` | inferred | 65451 | v0.7.1 |
