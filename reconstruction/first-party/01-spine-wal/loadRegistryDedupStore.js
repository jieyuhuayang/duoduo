// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: loadRegistryDedupStore  (minified: nv, daemon.pretty.js:87423)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadRegistryDedupStore(e) {
    let t = mf.join(e.registryDir, "dedup.jsonl"),
        n = ude.get(t);
    return n || (n = new spineEventDedupStore(t), ude.set(t, n)), await n.ensureLoaded(), n
}
