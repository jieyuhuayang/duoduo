// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generateAllPartitionCodexAgents  (minified: cmt, daemon.pretty.js:69844)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generateAllPartitionCodexAgents(e) {
    let {
        generatePartitionCodexAgents: t
    } = await Promise.resolve().then(() => (Jke(), Wke)), n;
    try {
        n = await or.readdir(e.subconsciousDir, {
            withFileTypes: !0
        })
    } catch {
        return
    }
    for (let r of n) {
        if (!r.isDirectory() || r.name.startsWith(".") || r.name === "inbox") continue;
        let i = sr.join(e.subconsciousDir, r.name);
        try {
            let o = await t(i);
            if (o.errors.length > 0)
                for (let s of o.errors) console.warn(`[runtime-init] codex-agents-generator error for ${s.path}: ${s.reason}`)
        } catch (o) {
            console.warn(`[runtime-init] codex-agents-generator failed for ${i}: ${o instanceof Error?o.message:String(o)}`)
        }
    }
}
