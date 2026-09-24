// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generateAllPartitionCodexAgents  (minified: Idt, daemon.pretty.js:69553)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generateAllPartitionCodexAgents(e) {
    let {
        generatePartitionCodexAgents: t
    } = await Promise.resolve().then(() => (rSe(), nSe)), n;
    try {
        n = await tr.readdir(e.subconsciousDir, {
            withFileTypes: !0
        })
    } catch {
        return
    }
    for (let r of n) {
        if (!r.isDirectory() || r.name.startsWith(".") || r.name === "inbox") continue;
        let i = nr.join(e.subconsciousDir, r.name);
        try {
            let o = await t(i);
            if (o.errors.length > 0)
                for (let s of o.errors) console.warn(`[runtime-init] codex-agents-generator error for ${s.path}: ${s.reason}`)
        } catch (o) {
            console.warn(`[runtime-init] codex-agents-generator failed for ${i}: ${o instanceof Error?o.message:String(o)}`)
        }
    }
}
