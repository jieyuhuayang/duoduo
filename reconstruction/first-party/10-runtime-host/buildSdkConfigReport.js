// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildSdkConfigReport  (minified: mSt, daemon.pretty.js:92035)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in v0.6.0 (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (medium): refactor: simplify host onboarding auth flow
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSdkConfigReport() {
    let report = {
            permission_mode: resolveEnvConfigEntry("ALADUO_PERMISSION_MODE", "default")
        },
        authSource = readClaudeAuthSourceEnv(process.env) ?? null;
    if (report.claude_auth_source = authSource === null ? {
            value: null,
            source: "unset"
        } : {
            value: authSource,
            source: "env"
        }, authSource === "claude_code_local") return report;
    for (let envKey of fSt) {
        let envConfigEntry = resolveEnvConfigEntry(envKey, null);
        envConfigEntry.source !== "unset" && (report[pSt(envKey)] = envConfigEntry)
    }
    return report
}
