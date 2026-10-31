// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: initMaterializedClaudeSettingsModule  (minified: xS, daemon.pretty.js:66998)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.0 (high): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var hft, gft, yft, _ft, bft, w6, Twe, initMaterializedClaudeSettingsModule = A(() => {
    "use strict";
    Xn();
    initLogLevelModule();
    ni();
    hft = {
        fable: "ANTHROPIC_DEFAULT_FABLE_MODEL",
        opus: "ANTHROPIC_DEFAULT_OPUS_MODEL",
        sonnet: "ANTHROPIC_DEFAULT_SONNET_MODEL",
        haiku: "ANTHROPIC_DEFAULT_HAIKU_MODEL"
    }, gft = {
        anthropic_auth_token: "ANTHROPIC_AUTH_TOKEN",
        claude_code_oauth_token: "CLAUDE_CODE_OAUTH_TOKEN"
    }, yft = "CLAUDE_CODE_MAX_CONTEXT_TOKENS", _ft = "ANTHROPIC_BASE_URL", bft = "claude-settings";
    w6 = new Set, Twe = !1
});
