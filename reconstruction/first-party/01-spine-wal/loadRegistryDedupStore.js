// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: loadRegistryDedupStore  (minified: MXe, daemon.pretty.js:87069)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadRegistryDedupStore(e) {
    let t = ef.join(e.registryDir, "dedup.jsonl"),
        n = Ule.get(t);
    return n || (n = new spineEventDedupStore(t), Ule.set(t, n)), await n.ensureLoaded(), n
}
