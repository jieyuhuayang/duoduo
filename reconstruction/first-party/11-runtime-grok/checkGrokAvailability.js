// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: checkGrokAvailability  (minified: Qu, daemon.pretty.js:57710)
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
            timeout: Oet
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
