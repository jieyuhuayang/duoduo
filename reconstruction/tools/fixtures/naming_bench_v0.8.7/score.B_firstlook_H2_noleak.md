# naming benchmark score: B_firstlook_H2_noleak

B_firstlook_H2_noleak: n=28 (5 skipped) answered=28 exact@1=32.1% tokenF1@1=0.688 exact@3=60.7% tokenF1@3=0.854

## by kind

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| function | 18 | 18 | 22.2% | 0.591 | 38.9% | 0.772 |
| moduleInit | 5 | 5 | 60.0% | 0.910 | 100.0% | 1.000 |
| value | 5 | 5 | 40.0% | 0.814 | 100.0% | 1.000 |

## by subsystem

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| 00-daemon-entry | 2 | 2 | 100.0% | 1.000 | 100.0% | 1.000 |
| 01-spine-wal | 3 | 3 | 0.0% | 0.474 | 33.3% | 0.852 |
| 02-gateway-rpc | 4 | 4 | 0.0% | 0.622 | 50.0% | 0.792 |
| 03-session-actor | 1 | 1 | 0.0% | 0.000 | 0.0% | 0.286 |
| 04-cognition-prompt | 2 | 2 | 50.0% | 0.875 | 50.0% | 0.944 |
| 05-drain-turn | 4 | 4 | 25.0% | 0.768 | 75.0% | 0.964 |
| 06-runtime-claude | 2 | 2 | 50.0% | 0.611 | 50.0% | 0.750 |
| 07-runtime-codex | 2 | 2 | 50.0% | 0.750 | 50.0% | 0.750 |
| 08-cadence-subconscious | 3 | 3 | 33.3% | 0.657 | 66.7% | 0.800 |
| 09-memory | 1 | 1 | 0.0% | 0.500 | 0.0% | 0.750 |
| 10-runtime-host | 1 | 1 | 0.0% | 0.667 | 100.0% | 1.000 |
| 11-runtime-grok | 3 | 3 | 66.7% | 0.889 | 100.0% | 1.000 |

## per symbol

| short | answer | kind | proposals | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|
| fI | statusPath | function | statusPath, resolveStatusPath, statusFilePath | 1 | 1.000 |
| mJ | extractPayloadMediaRefs | function | extractMediaAttachments, readMediaAttachments, extractPayloadMedia | 0 | 0.857 |
| Ofe | canonicalizeGatewayCommand | function | normalizeGatewayCommandName, canonicalizeGatewayCommand, resolveGatewayCommandName | 1 | 1.000 |
| VSe | rebuildPlaylistRound | function | rebuildPlaylistRound, rebuildSubconsciousPlaylistRound, writePlaylistCurrentRound | 1 | 1.000 |
| sTe | selectSessionRolePrompt | function | resolveSessionRolePrompt, resolveChannelRolePrompt, selectRolePromptForSession | 0 | 0.889 |
| mC | buildClaudeCostBaseline | function | buildSdkTurnUsageRecord, buildClaudeTurnUsage, extractSdkResultUsage | 0 | 0.500 |
| gv | summarizeDrainRecords | function | aggregateDrainRecords, summarizeDrainRecords, buildUsageSummary | 1 | 1.000 |
| Knt | replyToGatewayCommandEvent | function | handleGatewayCommandEvent, executeGatewayCommandEvent, routeGatewayCommandEvent | 0 | 0.667 |
| Fo | hashSessionKey | function | sha256Hex, hashSha256Hex, computeSha256Hex | 0 | 0.286 |
| aS | grokAcpExtMethod | function | buildGrokAcpExtName, grokAcpExtMethod, prefixGrokAcpExtension | 1 | 1.000 |
| zue | findEventInPartitionFile | function | scanPartitionForEventId, findEventInPartition, readEventFromPartition | 0 | 0.889 |
| Dve | mapItemStartedToExecEvent | function | mapCodexItemToToolUse, codexItemToToolUseEvent, buildCodexToolUseEvent | 0 | 0.500 |
| eA | buildNodeSignalKey | function | formatTopicNodeKey, buildTopicNodeKey, topicNodeKey | 0 | 0.750 |
| Mat | renderJobAcceptanceBlock | function | renderJobAcceptanceBlock, renderAcceptanceBlock, renderMissionAcceptanceBlock | 1 | 1.000 |
| NSt | enqueueSessionCompactCommand | function | runSessionCompactRpc, handleSessionCompactRpc, compactSessionByTarget | 0 | 0.500 |
| Vu | advanceConsumerWatermark | function | writeConsumerOffsetForEventId, advanceConsumerOffset, commitConsumerOffset | 0 | 0.667 |
| RIe | isAutoArchivedJobSchedule | function | isOneShotScheduleExpression, isOnceOrInSchedule, isOneShotScheduleKind | 0 | 0.400 |
| Cq | replaceSessionIndexEntry | function | replaceSessionIndexEntry, upsertSessionIndexEntry, rebuildSessionIndexEntry | 1 | 1.000 |
| vU | initProtocolEffortModule | moduleInit | initEffortLevelsModule, initEffortLevelModule, initProtocolEffortModule | 1 | 1.000 |
| rp | initCodexAppServerModule | moduleInit | initCodexAppServerModule, initCodexAdapterModule, initCodexRuntimeModule | 1 | 1.000 |
| tl | initSkipToolModule | moduleInit | initSkipToolModule, initSkipModule, initSkipToolSchemaModule | 1 | 1.000 |
| jo | initSpineEventLogModule | moduleInit | initSpineEventIndexModule, initSpineEventLogModule, initEventIdIndexModule | 1 | 1.000 |
| To | initAgentSdkAdapterModule | moduleInit | initAgentSdkAdapterModule, initClaudeSdkAdapterModule, initAgentSdkModule | 1 | 1.000 |
| qve | GROK_ACP_COMPACT | value | GROK_ACP_COMPACT, GROK_ACP_COMPACT_CONVERSATION, GROK_COMPACT_METHOD | 1 | 1.000 |
| FV | PARTITION_CORE_TOOLS | value | META_SESSION_CORE_TOOLS, PARTITION_CORE_TOOLS, CORE_TOOL_NAMES | 1 | 1.000 |
| wfe | IN_PROCESS_BREAK_HIT_RATIO_FLOOR | value | IN_PROCESS_BREAK_HIT_RATE_FLOOR, IN_PROCESS_BREAK_HIT_RATIO_FLOOR, CACHE_HIT_RATE_FLOOR | 1 | 1.000 |
| yR | SUN_PATH_MAX_BYTES | value | UNIX_SOCKET_PATH_MAX_BYTES, SUN_PATH_MAX_BYTES, SOCKET_PATH_MAX_LENGTH | 1 | 1.000 |
| Hve | GROK_MCP_SERVER_NAME | value | GROK_MCP_SERVER_NAME, GROK_ALADUO_SERVER_NAME, GROK_MCP_ALADUO_NAME | 1 | 1.000 |
