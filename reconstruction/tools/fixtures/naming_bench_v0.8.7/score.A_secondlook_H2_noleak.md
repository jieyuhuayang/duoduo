# naming benchmark score: A_secondlook_H2_noleak

A_secondlook_H2_noleak: n=28 (5 skipped) answered=28 exact@1=32.1% tokenF1@1=0.689 exact@3=32.1% tokenF1@3=0.689

## by kind

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| function | 18 | 18 | 22.2% | 0.593 | 22.2% | 0.593 |
| moduleInit | 5 | 5 | 60.0% | 0.910 | 60.0% | 0.910 |
| value | 5 | 5 | 40.0% | 0.814 | 40.0% | 0.814 |

## by subsystem

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| 00-daemon-entry | 2 | 2 | 100.0% | 1.000 | 100.0% | 1.000 |
| 01-spine-wal | 3 | 3 | 0.0% | 0.483 | 0.0% | 0.483 |
| 02-gateway-rpc | 4 | 4 | 0.0% | 0.622 | 0.0% | 0.622 |
| 03-session-actor | 1 | 1 | 0.0% | 0.000 | 0.0% | 0.000 |
| 04-cognition-prompt | 2 | 2 | 50.0% | 0.875 | 50.0% | 0.875 |
| 05-drain-turn | 4 | 4 | 25.0% | 0.768 | 25.0% | 0.768 |
| 06-runtime-claude | 2 | 2 | 50.0% | 0.611 | 50.0% | 0.611 |
| 07-runtime-codex | 2 | 2 | 50.0% | 0.750 | 50.0% | 0.750 |
| 08-cadence-subconscious | 3 | 3 | 33.3% | 0.657 | 33.3% | 0.657 |
| 09-memory | 1 | 1 | 0.0% | 0.500 | 0.0% | 0.500 |
| 10-runtime-host | 1 | 1 | 0.0% | 0.667 | 0.0% | 0.667 |
| 11-runtime-grok | 3 | 3 | 66.7% | 0.889 | 66.7% | 0.889 |

## per symbol

| short | answer | kind | proposals | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|
| fI | statusPath | function | statusPath | 1 | 1.000 |
| mJ | extractPayloadMediaRefs | function | extractMediaAttachments | 0 | 0.571 |
| Ofe | canonicalizeGatewayCommand | function | normalizeGatewayCommandName | 0 | 0.571 |
| VSe | rebuildPlaylistRound | function | rebuildPlaylistRound | 1 | 1.000 |
| sTe | selectSessionRolePrompt | function | resolveSessionRolePrompt | 0 | 0.750 |
| mC | buildClaudeCostBaseline | function | buildSdkTurnUsageRecord | 0 | 0.222 |
| gv | summarizeDrainRecords | function | aggregateDrainRecords | 0 | 0.667 |
| Knt | replyToGatewayCommandEvent | function | handleGatewayCommandEvent | 0 | 0.667 |
| Fo | hashSessionKey | function | sha256Hex | 0 | 0.000 |
| aS | grokAcpExtMethod | function | buildGrokAcpExtName | 0 | 0.667 |
| zue | findEventInPartitionFile | function | scanPartitionForEventId | 0 | 0.400 |
| Dve | mapItemStartedToExecEvent | function | mapCodexItemToToolUse | 0 | 0.500 |
| eA | buildNodeSignalKey | function | formatTopicNodeKey | 0 | 0.500 |
| Mat | renderJobAcceptanceBlock | function | renderJobAcceptanceBlock | 1 | 1.000 |
| NSt | enqueueSessionCompactCommand | function | runSessionCompactRpc | 0 | 0.500 |
| Vu | advanceConsumerWatermark | function | writeConsumerOffsetForEvent | 0 | 0.250 |
| RIe | isAutoArchivedJobSchedule | function | isOneShotScheduleExpression | 0 | 0.400 |
| Cq | replaceSessionIndexEntry | function | replaceSessionIndexEntry | 1 | 1.000 |
| vU | initProtocolEffortModule | moduleInit | initEffortLevelsModule | 0 | 0.750 |
| rp | initCodexAppServerModule | moduleInit | initCodexAppServerModule | 1 | 1.000 |
| tl | initSkipToolModule | moduleInit | initSkipToolModule | 1 | 1.000 |
| jo | initSpineEventLogModule | moduleInit | initSpineEventIndexModule | 0 | 0.800 |
| To | initAgentSdkAdapterModule | moduleInit | initAgentSdkAdapterModule | 1 | 1.000 |
| qve | GROK_ACP_COMPACT | value | GROK_ACP_COMPACT | 1 | 1.000 |
| FV | PARTITION_CORE_TOOLS | value | META_SESSION_CORE_TOOLS | 0 | 0.571 |
| wfe | IN_PROCESS_BREAK_HIT_RATIO_FLOOR | value | IN_PROCESS_BREAK_HIT_RATE_FLOOR | 0 | 0.833 |
| yR | SUN_PATH_MAX_BYTES | value | UNIX_SOCKET_PATH_MAX_BYTES | 0 | 0.667 |
| Hve | GROK_MCP_SERVER_NAME | value | GROK_MCP_SERVER_NAME | 1 | 1.000 |
