# naming benchmark score: A_firstlook_H1_noleak

A_firstlook_H1_noleak: n=27 (5 skipped) answered=27 exact@1=22.2% tokenF1@1=0.665 exact@3=22.2% tokenF1@3=0.665

## by kind

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| function | 17 | 17 | 17.6% | 0.638 | 17.6% | 0.638 |
| moduleInit | 5 | 5 | 20.0% | 0.781 | 20.0% | 0.781 |
| value | 5 | 5 | 40.0% | 0.638 | 40.0% | 0.638 |

## by subsystem

| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|---|
| 00-daemon-entry | 2 | 2 | 50.0% | 0.700 | 50.0% | 0.700 |
| 01-spine-wal | 1 | 1 | 0.0% | 0.800 | 0.0% | 0.800 |
| 02-gateway-rpc | 1 | 1 | 100.0% | 1.000 | 100.0% | 1.000 |
| 03-session-actor | 4 | 4 | 25.0% | 0.548 | 25.0% | 0.548 |
| 04-cognition-prompt | 1 | 1 | 0.0% | 0.750 | 0.0% | 0.750 |
| 06-runtime-claude | 4 | 4 | 25.0% | 0.782 | 25.0% | 0.782 |
| 07-runtime-codex | 4 | 4 | 25.0% | 0.496 | 25.0% | 0.496 |
| 08-cadence-subconscious | 3 | 3 | 33.3% | 0.583 | 33.3% | 0.583 |
| 09-memory | 2 | 2 | 0.0% | 0.667 | 0.0% | 0.667 |
| 10-runtime-host | 4 | 4 | 0.0% | 0.704 | 0.0% | 0.704 |
| 11-runtime-grok | 1 | 1 | 0.0% | 0.800 | 0.0% | 0.800 |

## per symbol

| short | answer | kind | proposals | exact@3 | tokenF1@3 |
|---|---|---|---|---|---|
| dve | isJobScheduleDue | function | isJobScheduleDue | 1 | 1.000 |
| Mve | mapItemCompletedToExecEvent | function | mapCodexItemToToolResult | 0 | 0.500 |
| Lpt | renderNodeConvergeSignalBody | function | renderNodeConvergeSignal | 0 | 0.889 |
| cC | parseToolUseBlockStart | function | extractToolUseStart | 0 | 0.667 |
| fq | parseSdkConfigFrontmatter | function | parseClaudeConfigFields | 0 | 0.500 |
| rt | readSessionRuntimeState | function | readJsonFile | 0 | 0.286 |
| Uue | readSpineIndexRetentionDays | function | resolveSpineIndexRetentionDays | 0 | 0.800 |
| Nve | warnUnmappedCodexItemOnce | function | warnUnmappedCodexItemOnce | 1 | 1.000 |
| Hu | updateStatus | function | updateSnapshotFile | 0 | 0.400 |
| vke | appendGapHandedSpan | function | appendScanGapSignalLine | 0 | 0.444 |
| rc | attachStreamLineReader | function | attachStreamReader | 0 | 0.857 |
| AO | renderNotifyToolDescription | function | selectSessionContextTools | 0 | 0.250 |
| spt | computeHostBootId | function | computeHostBootId | 1 | 1.000 |
| lp | resolveContextCapToken | function | resolveClaudeMaxContextTokens | 0 | 0.889 |
| Igt | refreshBootstrapDuoduoMdFiles | function | copyBootstrapVarDuoduoMd | 0 | 0.600 |
| yXe | resolveSessionsArchiveRoot | function | sessionsArchiveDir | 0 | 0.571 |
| Cy | buildCodexStringInputSchema | function | zodShapeToJsonSchema | 0 | 0.200 |
| Vg | initGrokAcpRuntimeModule | moduleInit | initGrokAcpAdapterModule | 0 | 0.800 |
| STe | initMetaSessionModule | moduleInit | initSubconsciousRunnerModule | 0 | 0.500 |
| mEe | initRuntimeInitializationModule | moduleInit | initRuntimeInitModule | 0 | 0.857 |
| sC | initCallerSessionEnvModule | moduleInit | initCallerSessionEnvModule | 1 | 1.000 |
| nTe | initBoardTransclusionModule | moduleInit | initBoardIncludeModule | 0 | 0.750 |
| Eg | CLAUDE_CORE_TOOLS | value | DEFAULT_CLAUDE_TOOL_NAMES | 0 | 0.571 |
| Oy | SESSION_SCHEMA_VERSION | value | INSTRUCTIONS_FINGERPRINT_VERSION | 0 | 0.333 |
| uO | ALADUO_TOOL_NAMESPACE | value | ALADUO_MCP_SERVER_NAME | 0 | 0.286 |
| fA | DAEMON_TOKEN_ENV_KEY | value | DAEMON_TOKEN_ENV_KEY | 1 | 1.000 |
| xW | CLAUDE_CODE_EXECUTABLE_ENV_KEY | value | CLAUDE_CODE_EXECUTABLE_ENV_KEY | 1 | 1.000 |
