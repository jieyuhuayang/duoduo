// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: initMaterializedClaudeSettingsModule  (minified: aS, daemon.pretty.js:65691)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.0 (high): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Xlt, Qlt, ect, tct, nct, J6, pve, initMaterializedClaudeSettingsModule = O(() => {
    "use strict";
    Kn();
    pt();
    Kr();
    Xlt = {
        fable: "ANTHROPIC_DEFAULT_FABLE_MODEL",
        opus: "ANTHROPIC_DEFAULT_OPUS_MODEL",
        sonnet: "ANTHROPIC_DEFAULT_SONNET_MODEL",
        haiku: "ANTHROPIC_DEFAULT_HAIKU_MODEL"
    }, Qlt = {
        anthropic_auth_token: "ANTHROPIC_AUTH_TOKEN",
        claude_code_oauth_token: "CLAUDE_CODE_OAUTH_TOKEN"
    }, ect = "CLAUDE_CODE_MAX_CONTEXT_TOKENS", tct = "ANTHROPIC_BASE_URL", nct = "claude-settings";
    J6 = new Set, pve = !1
});
