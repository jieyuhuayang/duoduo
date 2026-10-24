// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: isAgentSdkPromptNotAcceptedAbortError  (minified: Nw, daemon.pretty.js:57362)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isAgentSdkPromptNotAcceptedAbortError(error) {
    return error instanceof AgentSdkPromptNotAcceptedAbortError
}
