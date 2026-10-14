// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: checkCodexAvailability  (minified: Oc, daemon.pretty.js:62170)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 4 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
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
            timeout: 5e3
        })
    } catch {
        return {
            ok: !1,
            reason: `Codex CLI ('${codexBinary}') is not installed or not in PATH. Install it from https://github.com/openai/codex and run 'codex login'.`
        }
    }
    try {
        let {
            stdout,
            stderr
        } = await execFileAsync(codexBinary, ["login", "status"], {
            timeout: 5e3
        });
        if (!(stdout + stderr).toLowerCase().includes("logged in")) return {
            ok: !1,
            reason: "Codex CLI is installed but not authenticated. Run 'codex login' to sign in."
        }
    } catch {
        return {
            ok: !1,
            reason: "Codex CLI is installed but not authenticated. Run 'codex login' to sign in."
        }
    }
    return {
        ok: !0
    }
}
