// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: applyHostModelEnvVars  (minified: qpe, daemon.pretty.js:58601)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function applyHostModelEnvVars(e, t) {
    clearHostModelEnvVars(e), t.apiKey && (e.ANTHROPIC_API_KEY = t.apiKey), t.authToken && (e.ANTHROPIC_AUTH_TOKEN = t.authToken), t.baseUrl && (e.ANTHROPIC_BASE_URL = t.baseUrl), t.model && (e.ANTHROPIC_DEFAULT_OPUS_MODEL = t.model, e.ANTHROPIC_DEFAULT_SONNET_MODEL = t.model, e.ANTHROPIC_DEFAULT_HAIKU_MODEL = t.model), (t.apiKey || t.authToken || t.baseUrl || t.model) && (e.API_TIMEOUT_MS = "3000000", e.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "true")
}
