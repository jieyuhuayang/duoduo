# naming benchmark score: B_secondlook_H1_noleak

B_secondlook_H1_noleak: n=27 (5 skipped) answered=27 exact@1=37.0% tokenF1@1=0.763 exact@3=51.9% tokenF1@3=0.859

## by kind

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| function | 17 | 17 | 35.3% | 0.744 | 47.1% | 0.839 |
| moduleInit | 5 | 5 | 20.0% | 0.760 | 40.0% | 0.849 |
| value | 5 | 5 | 60.0% | 0.829 | 80.0% | 0.933 |

## by subsystem

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| 00-daemon-entry | 2 | 2 | 100.0% | 1.000 | 100.0% | 1.000 |
| 01-spine-wal | 1 | 1 | 0.0% | 0.800 | 100.0% | 1.000 |
| 02-gateway-rpc | 1 | 1 | 100.0% | 1.000 | 100.0% | 1.000 |
| 03-session-actor | 4 | 4 | 25.0% | 0.768 | 25.0% | 0.881 |
| 04-cognition-prompt | 1 | 1 | 0.0% | 0.750 | 100.0% | 1.000 |
| 06-runtime-claude | 4 | 4 | 25.0% | 0.782 | 75.0% | 1.000 |
| 07-runtime-codex | 4 | 4 | 50.0% | 0.675 | 50.0% | 0.716 |
| 08-cadence-subconscious | 3 | 3 | 33.3% | 0.667 | 33.3% | 0.667 |
| 09-memory | 2 | 2 | 50.0% | 0.875 | 50.0% | 0.875 |
| 10-runtime-host | 4 | 4 | 25.0% | 0.650 | 25.0% | 0.789 |
| 11-runtime-grok | 1 | 1 | 0.0% | 0.800 | 0.0% | 0.889 |

## per symbol

| short | answer | kind | proposals | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|
| dve | isJobScheduleDue | function | isJobScheduleDue, isJobDue, isScheduleDue | 1 | 1.000 |
| Mve | mapItemCompletedToExecEvent | function | mapCodexItemToToolResult, codexItemToToolResultEvent, buildCodexToolResultEvent | 0 | 0.500 |
| Lpt | renderNodeConvergeSignalBody | function | renderNodeConvergeSignalBody, renderNodeConvergeSignal, buildNodeConvergeSignal | 1 | 1.000 |
| cC | parseToolUseBlockStart | function | extractToolUseStart, parseToolUseBlockStart, extractToolUseBlockStart | 1 | 1.000 |
| fq | parseSdkConfigFrontmatter | function | parseClaudeToolFields, parseClaudeConfigFields, parseRuntimeToolFields | 0 | 0.500 |
| rt | readSessionRuntimeState | function | readSessionStateFile, readSessionStateJson, readSessionState | 0 | 0.857 |
| Uue | readSpineIndexRetentionDays | function | resolveSpineIndexRetentionDays, readSpineIndexRetentionDays, parseSpineIndexRetentionDays | 1 | 1.000 |
| Nve | warnUnmappedCodexItemOnce | function | warnUnmappedCodexItemOnce, logUnmappedCodexItemOnce, noteUnmappedCodexItem | 1 | 1.000 |
| Hu | updateStatus | function | updateStatus, mutateStatus, updateStatusFile | 1 | 1.000 |
| vke | appendGapHandedSpan | function | appendGapHandedDay, appendGapHandedDays, writeGapHandedDay | 0 | 0.750 |
| rc | attachStreamLineReader | function | attachStreamLineReader, attachStreamReader, readStreamLines | 1 | 1.000 |
| AO | renderNotifyToolDescription | function | renderNotifyModeGuidance, resolveNotifyModeGuidance, selectNotifyModeGuidance | 0 | 0.500 |
| spt | computeHostBootId | function | computeHostBootId, buildHostBootId, resolveHostBootId | 1 | 1.000 |
| lp | resolveContextCapToken | function | resolveMaxContextTokensValue, resolveClaudeMaxContextTokens, resolveContextTokenLimit | 0 | 1.000 |
| Igt | refreshBootstrapDuoduoMdFiles | function | copyBootstrapVarDuoduoMd, copyBootstrapDuoduoMdFiles, seedVarDuoduoMd | 0 | 0.800 |
| yXe | resolveSessionsArchiveRoot | function | resolveSessionsArchiveDir, sessionsArchiveDir, resolveSessionArchiveRoot | 0 | 1.000 |
| Cy | buildCodexStringInputSchema | function | zodShapeToJsonSchema, buildJsonSchemaFromZodShape, convertZodShapeToSchema | 0 | 0.364 |
| Vg | initGrokAcpRuntimeModule | moduleInit | initGrokAcpAdapterModule, initGrokAcpModule, initGrokMcpTransportModule | 0 | 0.889 |
| STe | initMetaSessionModule | moduleInit | initSubconsciousRunnerModule, initPartitionRunnerModule, initSubconsciousSchedulerModule | 0 | 0.500 |
| mEe | initRuntimeInitializationModule | moduleInit | initRuntimeInitializerModule, initInitializeRuntimeModule, initKernelBootstrapModule | 0 | 0.857 |
| sC | initCallerSessionEnvModule | moduleInit | initCallerSessionEnvModule, initCallerSessionModule, initCallerSessionEnvKeyModule | 1 | 1.000 |
| nTe | initBoardTransclusionModule | moduleInit | initBoardIncludesModule, initBoardTransclusionModule, initBoardIncludeModule | 1 | 1.000 |
| Eg | CLAUDE_CORE_TOOLS | value | DEFAULT_CLAUDE_TOOL_NAMES, CLAUDE_DEFAULT_TOOLS, CLAUDE_CORE_TOOLS | 1 | 1.000 |
| Oy | SESSION_SCHEMA_VERSION | value | INSTRUCTIONS_FINGERPRINT_SCHEMA_VERSION, INSTRUCTIONS_SCHEMA_VERSION, FINGERPRINT_SCHEMA_VERSION | 0 | 0.667 |
| uO | ALADUO_TOOL_NAMESPACE | value | ALADUO_TOOL_NAMESPACE, ALADUO_MCP_NAMESPACE, ALADUO_MCP_SERVER_NAME | 1 | 1.000 |
| fA | DAEMON_TOKEN_ENV_KEY | value | DAEMON_TOKEN_ENV_KEY, ALADUO_DAEMON_TOKEN_KEY, HOST_DAEMON_TOKEN_ENV_KEY | 1 | 1.000 |
| xW | CLAUDE_CODE_EXECUTABLE_ENV_KEY | value | CLAUDE_CODE_EXECUTABLE_ENV_KEY, CLAUDE_CODE_EXECUTABLE_KEY, HOST_CLAUDE_CODE_EXECUTABLE_KEY | 1 | 1.000 |
