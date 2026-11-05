# naming benchmark score: A_old_format_noleak

A_old_format_noleak: n=55 (5 skipped) answered=55 exact@1=27.3% tokenF1@1=0.677 exact@3=27.3% tokenF1@3=0.677

## by kind

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| function | 35 | 35 | 20.0% | 0.615 | 20.0% | 0.615 |
| moduleInit | 10 | 10 | 40.0% | 0.846 | 40.0% | 0.846 |
| value | 10 | 10 | 40.0% | 0.726 | 40.0% | 0.726 |

## by subsystem

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| 00-daemon-entry | 4 | 4 | 75.0% | 0.850 | 75.0% | 0.850 |
| 01-spine-wal | 4 | 4 | 0.0% | 0.563 | 0.0% | 0.563 |
| 02-gateway-rpc | 5 | 5 | 20.0% | 0.698 | 20.0% | 0.698 |
| 03-session-actor | 5 | 5 | 20.0% | 0.438 | 20.0% | 0.438 |
| 04-cognition-prompt | 3 | 3 | 33.3% | 0.833 | 33.3% | 0.833 |
| 05-drain-turn | 4 | 4 | 25.0% | 0.768 | 25.0% | 0.768 |
| 06-runtime-claude | 6 | 6 | 33.3% | 0.725 | 33.3% | 0.725 |
| 07-runtime-codex | 6 | 6 | 33.3% | 0.581 | 33.3% | 0.581 |
| 08-cadence-subconscious | 6 | 6 | 33.3% | 0.620 | 33.3% | 0.620 |
| 09-memory | 3 | 3 | 0.0% | 0.611 | 0.0% | 0.611 |
| 10-runtime-host | 5 | 5 | 0.0% | 0.696 | 0.0% | 0.696 |
| 11-runtime-grok | 4 | 4 | 50.0% | 0.867 | 50.0% | 0.867 |

## per symbol

| short | answer | kind | proposals | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|
| dve | isJobScheduleDue | function | isJobScheduleDue | 1 | 1.000 |
| Mve | mapItemCompletedToExecEvent | function | mapCodexItemToToolResult | 0 | 0.500 |
| fI | statusPath | function | statusPath | 1 | 1.000 |
| Lpt | renderNodeConvergeSignalBody | function | renderNodeConvergeSignal | 0 | 0.889 |
| cC | parseToolUseBlockStart | function | extractToolUseStart | 0 | 0.667 |
| mJ | extractPayloadMediaRefs | function | extractMediaAttachments | 0 | 0.571 |
| Ofe | canonicalizeGatewayCommand | function | normalizeGatewayCommandName | 0 | 0.571 |
| fq | parseSdkConfigFrontmatter | function | parseClaudeConfigFields | 0 | 0.500 |
| rt | readSessionRuntimeState | function | readJsonFile | 0 | 0.286 |
| Uue | readSpineIndexRetentionDays | function | resolveSpineIndexRetentionDays | 0 | 0.800 |
| VSe | rebuildPlaylistRound | function | rebuildPlaylistRound | 1 | 1.000 |
| Nve | warnUnmappedCodexItemOnce | function | warnUnmappedCodexItemOnce | 1 | 1.000 |
| Hu | updateStatus | function | updateSnapshotFile | 0 | 0.400 |
| vke | appendGapHandedSpan | function | appendScanGapSignalLine | 0 | 0.444 |
| sTe | selectSessionRolePrompt | function | resolveSessionRolePrompt | 0 | 0.750 |
| mC | buildClaudeCostBaseline | function | buildSdkTurnUsageRecord | 0 | 0.222 |
| gv | summarizeDrainRecords | function | aggregateDrainRecords | 0 | 0.667 |
| Knt | replyToGatewayCommandEvent | function | handleGatewayCommandEvent | 0 | 0.667 |
| rc | attachStreamLineReader | function | attachStreamReader | 0 | 0.857 |
| Fo | hashSessionKey | function | sha256Hex | 0 | 0.000 |
| aS | grokAcpExtMethod | function | buildGrokAcpExtName | 0 | 0.667 |
| zue | findEventInPartitionFile | function | scanPartitionForEventId | 0 | 0.400 |
| AO | renderNotifyToolDescription | function | selectSessionContextTools | 0 | 0.250 |
| Dve | mapItemStartedToExecEvent | function | mapCodexItemToToolUse | 0 | 0.500 |
| spt | computeHostBootId | function | computeHostBootId | 1 | 1.000 |
| eA | buildNodeSignalKey | function | formatTopicNodeKey | 0 | 0.500 |
| Mat | renderJobAcceptanceBlock | function | renderJobAcceptanceBlock | 1 | 1.000 |
| lp | resolveContextCapToken | function | resolveClaudeMaxContextTokens | 0 | 0.889 |
| NSt | enqueueSessionCompactCommand | function | runSessionCompactRpc | 0 | 0.500 |
| Igt | refreshBootstrapDuoduoMdFiles | function | copyBootstrapVarDuoduoMd | 0 | 0.600 |
| yXe | resolveSessionsArchiveRoot | function | sessionsArchiveDir | 0 | 0.571 |
| Vu | advanceConsumerWatermark | function | writeConsumerOffsetForEvent | 0 | 0.250 |
| RIe | isAutoArchivedJobSchedule | function | isOneShotScheduleExpression | 0 | 0.400 |
| Cy | buildCodexStringInputSchema | function | zodShapeToJsonSchema | 0 | 0.200 |
| Cq | replaceSessionIndexEntry | function | replaceSessionIndexEntry | 1 | 1.000 |
| vU | initProtocolEffortModule | moduleInit | initEffortLevelsModule | 0 | 0.750 |
| rp | initCodexAppServerModule | moduleInit | initCodexAppServerModule | 1 | 1.000 |
| tl | initSkipToolModule | moduleInit | initSkipToolModule | 1 | 1.000 |
| jo | initSpineEventLogModule | moduleInit | initSpineEventIndexModule | 0 | 0.800 |
| To | initAgentSdkAdapterModule | moduleInit | initAgentSdkAdapterModule | 1 | 1.000 |
| Vg | initGrokAcpRuntimeModule | moduleInit | initGrokAcpAdapterModule | 0 | 0.800 |
| STe | initMetaSessionModule | moduleInit | initSubconsciousRunnerModule | 0 | 0.500 |
| mEe | initRuntimeInitializationModule | moduleInit | initRuntimeInitModule | 0 | 0.857 |
| sC | initCallerSessionEnvModule | moduleInit | initCallerSessionEnvModule | 1 | 1.000 |
| nTe | initBoardTransclusionModule | moduleInit | initBoardIncludeModule | 0 | 0.750 |
| Eg | CLAUDE_CORE_TOOLS | value | DEFAULT_CLAUDE_TOOL_NAMES | 0 | 0.571 |
| Oy | SESSION_SCHEMA_VERSION | value | INSTRUCTIONS_FINGERPRINT_VERSION | 0 | 0.333 |
| uO | ALADUO_TOOL_NAMESPACE | value | ALADUO_MCP_SERVER_NAME | 0 | 0.286 |
| fA | DAEMON_TOKEN_ENV_KEY | value | DAEMON_TOKEN_ENV_KEY | 1 | 1.000 |
| qve | GROK_ACP_COMPACT | value | GROK_ACP_COMPACT | 1 | 1.000 |
| FV | PARTITION_CORE_TOOLS | value | META_SESSION_CORE_TOOLS | 0 | 0.571 |
| wfe | IN_PROCESS_BREAK_HIT_RATIO_FLOOR | value | IN_PROCESS_BREAK_HIT_RATE_FLOOR | 0 | 0.833 |
| yR | SUN_PATH_MAX_BYTES | value | UNIX_SOCKET_PATH_MAX_BYTES | 0 | 0.667 |
| xW | CLAUDE_CODE_EXECUTABLE_ENV_KEY | value | CLAUDE_CODE_EXECUTABLE_ENV_KEY | 1 | 1.000 |
| Hve | GROK_MCP_SERVER_NAME | value | GROK_MCP_SERVER_NAME | 1 | 1.000 |
