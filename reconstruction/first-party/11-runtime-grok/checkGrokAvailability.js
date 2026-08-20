// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: checkGrokAvailability  (minified: ju, daemon.pretty.js:59913)
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
            timeout: 5e3
        })
    } catch {
        return {
            ok: !1,
            reason: `Grok CLI ('${e}') is not installed or not in PATH. Install it and run 'grok login'.`
        }
    }
    try {
        let {
            stdout: i,
            stderr: o
        } = await r(e, ["models"], {
            timeout: 5e3
        });
        if (!(i + o).toLowerCase().includes("logged in")) return {
            ok: !1,
            reason: "Grok CLI is installed but not authenticated. Run 'grok login' to sign in."
        }
    } catch (i) {
        let o = i,
            s = o.killed ? "timed out" : typeof o.code == "number" ? `exited with code ${o.code}${o.stderr?.trim()?`: ${o.stderr.trim().slice(0,200)}`:""}` : o.message ?? String(i);
        return Z("grok availability probe: 'grok models' failed", {
            detail: s
        }), {
            ok: !1,
            reason: `Could not verify grok login: 'grok models' ${s}. If it works in your shell this was transient (network/load) — retry. Otherwise run 'grok login'.`
        }
    }
    return {
        ok: !0
    }
}
