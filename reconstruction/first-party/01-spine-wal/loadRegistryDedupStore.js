// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: loadRegistryDedupStore  (minified: mv, daemon.pretty.js:89551)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function loadRegistryDedupStore(paths) {
    let filePath = vf.join(paths.registryDir, "dedup.jsonl"),
        store = tpe.get(filePath);
    return store || (store = new spineEventDedupStore(filePath), tpe.set(filePath, store)), await store.ensureLoaded(), store
}
