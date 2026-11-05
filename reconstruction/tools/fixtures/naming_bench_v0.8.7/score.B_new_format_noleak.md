# naming benchmark score: B_new_format_noleak

B_new_format_noleak: n=55 (5 skipped) answered=55 exact@1=34.5% tokenF1@1=0.725 exact@3=56.4% tokenF1@3=0.856

## by kind

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| function | 35 | 35 | 28.6% | 0.666 | 42.9% | 0.805 |
| moduleInit | 10 | 10 | 40.0% | 0.835 | 70.0% | 0.925 |
| value | 10 | 10 | 50.0% | 0.821 | 90.0% | 0.967 |

## by subsystem

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| 00-daemon-entry | 4 | 4 | 100.0% | 1.000 | 100.0% | 1.000 |
| 01-spine-wal | 4 | 4 | 0.0% | 0.556 | 50.0% | 0.889 |
| 02-gateway-rpc | 5 | 5 | 20.0% | 0.698 | 60.0% | 0.833 |
| 03-session-actor | 5 | 5 | 20.0% | 0.614 | 20.0% | 0.762 |
| 04-cognition-prompt | 3 | 3 | 33.3% | 0.833 | 66.7% | 0.963 |
| 05-drain-turn | 4 | 4 | 25.0% | 0.768 | 75.0% | 0.964 |
| 06-runtime-claude | 6 | 6 | 33.3% | 0.725 | 66.7% | 0.917 |
| 07-runtime-codex | 6 | 6 | 50.0% | 0.700 | 50.0% | 0.727 |
| 08-cadence-subconscious | 6 | 6 | 33.3% | 0.662 | 50.0% | 0.733 |
| 09-memory | 3 | 3 | 33.3% | 0.750 | 33.3% | 0.833 |
| 10-runtime-host | 5 | 5 | 20.0% | 0.653 | 40.0% | 0.831 |
| 11-runtime-grok | 4 | 4 | 50.0% | 0.867 | 75.0% | 0.972 |

## per symbol

| short | answer | kind | proposals | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|
| dve | isJobScheduleDue | function | isJobScheduleDue, isJobDue, isScheduleDue | 1 | 1.000 |
| Mve | mapItemCompletedToExecEvent | function | mapCodexItemToToolResult, codexItemToToolResultEvent, buildCodexToolResultEvent | 0 | 0.500 |
| fI | statusPath | function | statusPath, resolveStatusPath, statusFilePath | 1 | 1.000 |
| Lpt | renderNodeConvergeSignalBody | function | renderNodeConvergeSignalBody, renderNodeConvergeSignal, buildNodeConvergeSignal | 1 | 1.000 |
| cC | parseToolUseBlockStart | function | extractToolUseStart, parseToolUseBlockStart, extractToolUseBlockStart | 1 | 1.000 |
| mJ | extractPayloadMediaRefs | function | extractMediaAttachments, readMediaAttachments, extractPayloadMedia | 0 | 0.857 |
| Ofe | canonicalizeGatewayCommand | function | normalizeGatewayCommandName, canonicalizeGatewayCommand, resolveGatewayCommandName | 1 | 1.000 |
| fq | parseSdkConfigFrontmatter | function | parseClaudeToolFields, parseClaudeConfigFields, parseRuntimeToolFields | 0 | 0.500 |
| rt | readSessionRuntimeState | function | readSessionStateFile, readSessionStateJson, readSessionState | 0 | 0.857 |
| Uue | readSpineIndexRetentionDays | function | resolveSpineIndexRetentionDays, readSpineIndexRetentionDays, parseSpineIndexRetentionDays | 1 | 1.000 |
| VSe | rebuildPlaylistRound | function | rebuildPlaylistRound, rebuildSubconsciousPlaylistRound, writePlaylistCurrentRound | 1 | 1.000 |
| Nve | warnUnmappedCodexItemOnce | function | warnUnmappedCodexItemOnce, logUnmappedCodexItemOnce, noteUnmappedCodexItem | 1 | 1.000 |
| Hu | updateStatus | function | updateStatus, mutateStatus, updateStatusFile | 1 | 1.000 |
| vke | appendGapHandedSpan | function | appendGapHandedDay, appendGapHandedDays, writeGapHandedDay | 0 | 0.750 |
| sTe | selectSessionRolePrompt | function | resolveSessionRolePrompt, resolveChannelRolePrompt, selectRolePromptForSession | 0 | 0.889 |
| mC | buildClaudeCostBaseline | function | buildSdkTurnUsageRecord, buildClaudeTurnUsage, extractSdkResultUsage | 0 | 0.500 |
| gv | summarizeDrainRecords | function | aggregateDrainRecords, summarizeDrainRecords, buildUsageSummary | 1 | 1.000 |
| Knt | replyToGatewayCommandEvent | function | handleGatewayCommandEvent, executeGatewayCommandEvent, routeGatewayCommandEvent | 0 | 0.667 |
| rc | attachStreamLineReader | function | attachStreamLineReader, attachStreamReader, readStreamLines | 1 | 1.000 |
| Fo | hashSessionKey | function | sha256Hex, hashSha256Hex, computeSha256Hex | 0 | 0.286 |
| aS | grokAcpExtMethod | function | buildGrokAcpExtName, grokAcpExtMethod, prefixGrokAcpExtension | 1 | 1.000 |
| zue | findEventInPartitionFile | function | scanPartitionForEventId, findEventInPartition, readEventFromPartition | 0 | 0.889 |
| AO | renderNotifyToolDescription | function | renderNotifyModeGuidance, resolveNotifyModeGuidance, selectNotifyModeGuidance | 0 | 0.500 |
| Dve | mapItemStartedToExecEvent | function | mapCodexItemToToolUse, codexItemToToolUseEvent, buildCodexToolUseEvent | 0 | 0.500 |
| spt | computeHostBootId | function | computeHostBootId, buildHostBootId, resolveHostBootId | 1 | 1.000 |
| eA | buildNodeSignalKey | function | formatTopicNodeKey, buildTopicNodeKey, topicNodeKey | 0 | 0.750 |
| Mat | renderJobAcceptanceBlock | function | renderJobAcceptanceBlock, renderAcceptanceBlock, renderMissionAcceptanceBlock | 1 | 1.000 |
| lp | resolveContextCapToken | function | resolveMaxContextTokensValue, resolveClaudeMaxContextTokens, resolveContextTokenLimit | 0 | 1.000 |
| NSt | enqueueSessionCompactCommand | function | runSessionCompactRpc, handleSessionCompactRpc, compactSessionByTarget | 0 | 0.500 |
| Igt | refreshBootstrapDuoduoMdFiles | function | copyBootstrapVarDuoduoMd, copyBootstrapDuoduoMdFiles, seedVarDuoduoMd | 0 | 0.800 |
| yXe | resolveSessionsArchiveRoot | function | resolveSessionsArchiveDir, sessionsArchiveDir, resolveSessionArchiveRoot | 0 | 1.000 |
| Vu | advanceConsumerWatermark | function | writeConsumerOffsetForEventId, advanceConsumerOffset, commitConsumerOffset | 0 | 0.667 |
| RIe | isAutoArchivedJobSchedule | function | isOneShotScheduleExpression, isOnceOrInSchedule, isOneShotScheduleKind | 0 | 0.400 |
| Cy | buildCodexStringInputSchema | function | zodShapeToJsonSchema, buildJsonSchemaFromZodShape, convertZodShapeToSchema | 0 | 0.364 |
| Cq | replaceSessionIndexEntry | function | replaceSessionIndexEntry, upsertSessionIndexEntry, rebuildSessionIndexEntry | 1 | 1.000 |
| vU | initProtocolEffortModule | moduleInit | initEffortLevelsModule, initEffortLevelModule, initProtocolEffortModule | 1 | 1.000 |
| rp | initCodexAppServerModule | moduleInit | initCodexAppServerModule, initCodexAdapterModule, initCodexRuntimeModule | 1 | 1.000 |
| tl | initSkipToolModule | moduleInit | initSkipToolModule, initSkipModule, initSkipToolSchemaModule | 1 | 1.000 |
| jo | initSpineEventLogModule | moduleInit | initSpineEventIndexModule, initSpineEventLogModule, initEventIdIndexModule | 1 | 1.000 |
| To | initAgentSdkAdapterModule | moduleInit | initAgentSdkAdapterModule, initClaudeSdkAdapterModule, initAgentSdkModule | 1 | 1.000 |
| Vg | initGrokAcpRuntimeModule | moduleInit | initGrokAcpAdapterModule, initGrokAcpModule, initGrokMcpTransportModule | 0 | 0.889 |
| STe | initMetaSessionModule | moduleInit | initSubconsciousRunnerModule, initPartitionRunnerModule, initSubconsciousSchedulerModule | 0 | 0.500 |
| mEe | initRuntimeInitializationModule | moduleInit | initRuntimeInitializerModule, initInitializeRuntimeModule, initKernelBootstrapModule | 0 | 0.857 |
| sC | initCallerSessionEnvModule | moduleInit | initCallerSessionEnvModule, initCallerSessionModule, initCallerSessionEnvKeyModule | 1 | 1.000 |
| nTe | initBoardTransclusionModule | moduleInit | initBoardIncludesModule, initBoardTransclusionModule, initBoardIncludeModule | 1 | 1.000 |
| Eg | CLAUDE_CORE_TOOLS | value | DEFAULT_CLAUDE_TOOL_NAMES, CLAUDE_DEFAULT_TOOLS, CLAUDE_CORE_TOOLS | 1 | 1.000 |
| Oy | SESSION_SCHEMA_VERSION | value | INSTRUCTIONS_FINGERPRINT_SCHEMA_VERSION, INSTRUCTIONS_SCHEMA_VERSION, FINGERPRINT_SCHEMA_VERSION | 0 | 0.667 |
| uO | ALADUO_TOOL_NAMESPACE | value | ALADUO_TOOL_NAMESPACE, ALADUO_MCP_NAMESPACE, ALADUO_MCP_SERVER_NAME | 1 | 1.000 |
| fA | DAEMON_TOKEN_ENV_KEY | value | DAEMON_TOKEN_ENV_KEY, ALADUO_DAEMON_TOKEN_KEY, HOST_DAEMON_TOKEN_ENV_KEY | 1 | 1.000 |
| qve | GROK_ACP_COMPACT | value | GROK_ACP_COMPACT, GROK_ACP_COMPACT_CONVERSATION, GROK_COMPACT_METHOD | 1 | 1.000 |
| FV | PARTITION_CORE_TOOLS | value | META_SESSION_CORE_TOOLS, PARTITION_CORE_TOOLS, CORE_TOOL_NAMES | 1 | 1.000 |
| wfe | IN_PROCESS_BREAK_HIT_RATIO_FLOOR | value | IN_PROCESS_BREAK_HIT_RATE_FLOOR, IN_PROCESS_BREAK_HIT_RATIO_FLOOR, CACHE_HIT_RATE_FLOOR | 1 | 1.000 |
| yR | SUN_PATH_MAX_BYTES | value | UNIX_SOCKET_PATH_MAX_BYTES, SUN_PATH_MAX_BYTES, SOCKET_PATH_MAX_LENGTH | 1 | 1.000 |
| xW | CLAUDE_CODE_EXECUTABLE_ENV_KEY | value | CLAUDE_CODE_EXECUTABLE_ENV_KEY, CLAUDE_CODE_EXECUTABLE_KEY, HOST_CLAUDE_CODE_EXECUTABLE_KEY | 1 | 1.000 |
| Hve | GROK_MCP_SERVER_NAME | value | GROK_MCP_SERVER_NAME, GROK_ALADUO_SERVER_NAME, GROK_MCP_ALADUO_NAME | 1 | 1.000 |
