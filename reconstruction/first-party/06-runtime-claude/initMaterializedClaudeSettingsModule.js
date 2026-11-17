// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: initMaterializedClaudeSettingsModule  (minified: TS, daemon.pretty.js:67183)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.0 (high): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Bft, Vft, Hft, Wft, Jft, A6, Uwe, initMaterializedClaudeSettingsModule = A(() => {
    "use strict";
    er();
    initLogLevelModule();
    ni();
    Bft = {
        fable: "ANTHROPIC_DEFAULT_FABLE_MODEL",
        opus: "ANTHROPIC_DEFAULT_OPUS_MODEL",
        sonnet: "ANTHROPIC_DEFAULT_SONNET_MODEL",
        haiku: "ANTHROPIC_DEFAULT_HAIKU_MODEL"
    }, Vft = {
        anthropic_auth_token: "ANTHROPIC_AUTH_TOKEN",
        claude_code_oauth_token: "CLAUDE_CODE_OAUTH_TOKEN"
    }, Hft = "CLAUDE_CODE_MAX_CONTEXT_TOKENS", Wft = "ANTHROPIC_BASE_URL", Jft = "claude-settings";
    A6 = new Set, Uwe = !1
});
