// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: checkGrokAvailability  (minified: Nc, daemon.pretty.js:63292)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.7.1 (high): Availability is checked against the Grok CLI you already have installed, and it fails closed: asking for Grok when Grok is not usable gives you a clear error, never a silent fall back to Claude.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function checkGrokAvailability(e = "grok") {
    let {
        execFile: t
    } = await import("node:child_process"), {
        promisify: n
    } = await import("node:util"), r = n(t);
    try {
        await r(e, ["--version"], {
            timeout: Mut
        })
    } catch {
        return {
            ok: !1,
            reason: `Grok CLI ('${e}') is not installed or not in PATH. Install it and run 'grok login'.`
        }
    }
    return {
        ok: !0
    }
}
