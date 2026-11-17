// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: checkCodexAvailability  (minified: qc, daemon.pretty.js:63641)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.8.9 (maps/history_daemon.json)
// locals: 4 renamed — 2 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (high): Preflight check for codex CLI availability
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function checkCodexAvailability(codexBinary = "codex") {
    let {
        execFile
    } = await import("node:child_process"), {
        promisify
    } = await import("node:util"), execFileAsync = promisify(execFile);
    try {
        await execFileAsync(codexBinary, ["--version"], {
            timeout: ydt
        })
    } catch {
        return {
            ok: !1,
            reason: `Codex CLI ('${codexBinary}') is not installed or not in PATH. Install it from https://github.com/openai/codex and run 'codex login'.`
        }
    }
    return {
        ok: !0
    }
}
