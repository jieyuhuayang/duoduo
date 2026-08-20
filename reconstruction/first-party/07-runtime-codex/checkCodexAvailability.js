// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: checkCodexAvailability  (minified: Mu, daemon.pretty.js:58753)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function checkCodexAvailability(e = "codex") {
    let {
        execFile: t
    } = await import("node:child_process"), {
        promisify: n
    } = await import("node:util"), r = n(t);
    try {
        await r(e, ["--version"], {
            timeout: 5e3
        })
    } catch {
        return {
            ok: !1,
            reason: `Codex CLI ('${e}') is not installed or not in PATH. Install it from https://github.com/openai/codex and run 'codex login'.`
        }
    }
    try {
        let {
            stdout: i,
            stderr: o
        } = await r(e, ["login", "status"], {
            timeout: 5e3
        });
        if (!(i + o).toLowerCase().includes("logged in")) return {
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
