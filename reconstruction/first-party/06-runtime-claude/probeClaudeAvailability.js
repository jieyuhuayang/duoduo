// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: probeClaudeAvailability  (minified: h_e, daemon.pretty.js:56558)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 3 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.3 (medium): Hosts can expose whichever runtimes are actually installed and authenticated. Claude remains the conservative fallback
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeClaudeAvailability() {
    if (Tc) return Tc;
    if (Hf) return Hf;
    Hf = (async () => {
        let promise = new Promise(resolve => {
                try {
                    zV(), resolve({
                        ok: !0
                    })
                } catch (err) {
                    let reason = err instanceof Error ? err.message : String(err);
                    resolve({
                        ok: !1,
                        reason
                    })
                }
            }),
            promise2 = new Promise(resolve => {
                setTimeout(() => resolve({
                    ok: !1,
                    reason: `[agent-sdk] claude availability probe timed out after ${d_e}ms`
                }), d_e)
            }),
            probeResult = await Promise.race([promise, promise2]);
        return Tc = probeResult, probeResult
    })();
    let result = await Hf;
    return Hf = void 0, result
}
