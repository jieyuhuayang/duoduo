# naming benchmark score: rules_only

rules_only: n=60 answered=57 exact@1=0.0% tokenF1@1=0.220 exact@3=0.0% tokenF1@3=0.220

## by kind

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| function | 40 | 40 | 0.0% | 0.152 | 0.0% | 0.152 |
| moduleInit | 10 | 10 | 0.0% | 0.500 | 0.0% | 0.500 |
| value | 10 | 7 | 0.0% | 0.212 | 0.0% | 0.212 |

## by subsystem

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| 00-daemon-entry | 4 | 4 | 0.0% | 0.100 | 0.0% | 0.100 |
| 01-spine-wal | 4 | 4 | 0.0% | 0.236 | 0.0% | 0.236 |
| 02-gateway-rpc | 5 | 5 | 0.0% | 0.271 | 0.0% | 0.271 |
| 03-session-actor | 5 | 4 | 0.0% | 0.371 | 0.0% | 0.371 |
| 04-cognition-prompt | 4 | 4 | 0.0% | 0.188 | 0.0% | 0.188 |
| 05-drain-turn | 5 | 4 | 0.0% | 0.157 | 0.0% | 0.157 |
| 06-runtime-claude | 6 | 6 | 0.0% | 0.387 | 0.0% | 0.387 |
| 07-runtime-codex | 6 | 6 | 0.0% | 0.182 | 0.0% | 0.182 |
| 08-cadence-subconscious | 6 | 6 | 0.0% | 0.173 | 0.0% | 0.173 |
| 09-memory | 4 | 4 | 0.0% | 0.063 | 0.0% | 0.063 |
| 10-runtime-host | 5 | 4 | 0.0% | 0.150 | 0.0% | 0.150 |
| 11-runtime-grok | 6 | 6 | 0.0% | 0.278 | 0.0% | 0.278 |

## per symbol

| short | answer | kind | proposals | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|
| dve | isJobScheduleDue | function | isParserExpression | 0 | 0.286 |
| Mve | mapItemCompletedToExecEvent | function | isAveChanges | 0 | 0.000 |
| fI | statusPath | function | resolveRegistryStatus | 0 | 0.400 |
| Lpt | renderNodeConvergeSignalBody | function | renderCallableRule | 0 | 0.250 |
| ryt | renderTimeGapContextBlock | function | renderApproximatelyClock | 0 | 0.250 |
| cC | parseToolUseBlockStart | function | resolveBlockStart | 0 | 0.500 |
| mJ | extractPayloadMediaRefs | function | listMediaMime | 0 | 0.286 |
| Ofe | canonicalizeGatewayCommand | function | resolveResetStats | 0 | 0.000 |
| fq | parseSdkConfigFrontmatter | function | buildExpandSnt | 0 | 0.000 |
| rt | readSessionRuntimeState | function | readUtfRead | 0 | 0.333 |
| Wve | collectGrokToolCallNames | function | listTitleMeta | 0 | 0.250 |
| Uue | readSpineIndexRetentionDays | function | renderIntegerSpine | 0 | 0.250 |
| VSe | rebuildPlaylistRound | function | readRecoveryEdit | 0 | 0.000 |
| Nve | warnUnmappedCodexItemOnce | function | renderMappingDropping | 0 | 0.000 |
| Hu | updateStatus | function | resolveGeneratedIso | 0 | 0.000 |
| vke | appendGapHandedSpan | function | writeMkdirRecursive | 0 | 0.000 |
| sTe | selectSessionRolePrompt | function | resolveMemberHeld | 0 | 0.000 |
| mC | buildClaudeCostBaseline | function | buildCostUsd | 0 | 0.571 |
| gv | summarizeDrainRecords | function | listDaemon | 0 | 0.000 |
| Knt | replyToGatewayCommandEvent | function | buildOfflineHandled | 0 | 0.000 |
| rc | attachStreamLineReader | function | resolveEofFlush | 0 | 0.000 |
| Fo | hashSessionKey | function | resolveHexSha | 0 | 0.000 |
| aS | grokAcpExtMethod | function | renderGrokAcp | 0 | 0.571 |
| zue | findEventInPartitionFile | function | listEventAt | 0 | 0.250 |
| AO | renderNotifyToolDescription | function | resolveForegroundMeta | 0 | 0.000 |
| Dve | mapItemStartedToExecEvent | function | isChangesCollab | 0 | 0.000 |
| spt | computeHostBootId | function | renderBoottimeKern | 0 | 0.000 |
| eA | buildNodeSignalKey | function | renderSlug | 0 | 0.000 |
| Mat | renderJobAcceptanceBlock | function | listOnesFinishing | 0 | 0.000 |
| lp | resolveContextCapToken | function | isNativeGeneration | 0 | 0.000 |
| gyt | computeDrainCoalesceKey | function | renderPrimaryFanout | 0 | 0.000 |
| NSt | enqueueSessionCompactCommand | function | isCommandsEnqueued | 0 | 0.286 |
| Igt | refreshBootstrapDuoduoMdFiles | function | readCopyBootstrap | 0 | 0.250 |
| yXe | resolveSessionsArchiveRoot | function | resolveArchiveSessions | 0 | 0.857 |
| Fc | checkGrokAvailability | function | renderPromisifyUtil | 0 | 0.000 |
| Vu | advanceConsumerWatermark | function | resolveByteOffset | 0 | 0.000 |
| RIe | isAutoArchivedJobSchedule | function | isOnceStarts | 0 | 0.250 |
| Cy | buildCodexStringInputSchema | function | buildPropertiesUnwrap | 0 | 0.250 |
| Cq | replaceSessionIndexEntry | function | resolveUpsertRemove | 0 | 0.000 |
| cmt | runGapLint | function | parseBkeSke | 0 | 0.000 |
| vU | initProtocolEffortModule | moduleInit | initLowMediumModule | 0 | 0.500 |
| rp | initCodexAppServerModule | moduleInit | initElicitationFeaturesModule | 0 | 0.444 |
| tl | initSkipToolModule | moduleInit | initAcknowledgementsAddressedModule | 0 | 0.500 |
| jo | initSpineEventLogModule | moduleInit | initRetentionDaysModule | 0 | 0.444 |
| To | initAgentSdkAdapterModule | moduleInit | initConstructorEnoughModule | 0 | 0.500 |
| Vg | initGrokAcpRuntimeModule | moduleInit | initGoalOnmessageModule | 0 | 0.444 |
| STe | initMetaSessionModule | moduleInit | initDistillerGradientModule | 0 | 0.500 |
| mEe | initRuntimeInitializationModule | moduleInit | initRgtXgtModule | 0 | 0.500 |
| sC | initCallerSessionEnvModule | moduleInit | initCallerAladuoModule | 0 | 0.667 |
| nTe | initBoardTransclusionModule | moduleInit | initAdocAsciidocModule | 0 | 0.500 |
| Eg | CLAUDE_CORE_TOOLS | value | BASH_VALUE | 0 | 0.000 |
| Oy | SESSION_SCHEMA_VERSION | value | (none) | 0 | 0.000 |
| uO | ALADUO_TOOL_NAMESPACE | value | ALADUO_VALUE | 0 | 0.400 |
| fA | DAEMON_TOKEN_ENV_KEY | value | ALADUO_DAEMON_TOKEN | 0 | 0.571 |
| qve | GROK_ACP_COMPACT | value | COMPACT_CONVERSATION | 0 | 0.400 |
| FV | PARTITION_CORE_TOOLS | value | BASH_VALUE | 0 | 0.000 |
| wfe | IN_PROCESS_BREAK_HIT_RATIO_FLOOR | value | (none) | 0 | 0.000 |
| yR | SUN_PATH_MAX_BYTES | value | (none) | 0 | 0.000 |
| xW | CLAUDE_CODE_EXECUTABLE_ENV_KEY | value | CLAUDE_CODE_EXECUTABLE | 0 | 0.750 |
| Hve | GROK_MCP_SERVER_NAME | value | ALADUO_VALUE | 0 | 0.000 |
