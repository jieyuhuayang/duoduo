// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: applyHostModelEnvVars  (minified: WSe, daemon.pretty.js:69127)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (high): fix(daemon): forward ANTHROPIC_* env and apply onboard state on upgrade
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function applyHostModelEnvVars(env, config) {
    clearHostModelEnvVars(env), config.apiKey && (env.ANTHROPIC_API_KEY = config.apiKey), config.authToken && (env.ANTHROPIC_AUTH_TOKEN = config.authToken), config.baseUrl && (env.ANTHROPIC_BASE_URL = config.baseUrl), config.model && (env.ANTHROPIC_DEFAULT_OPUS_MODEL = config.model, env.ANTHROPIC_DEFAULT_SONNET_MODEL = config.model, env.ANTHROPIC_DEFAULT_HAIKU_MODEL = config.model), (config.apiKey || config.authToken || config.baseUrl || config.model) && (env.API_TIMEOUT_MS = "3000000", env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "true")
}
