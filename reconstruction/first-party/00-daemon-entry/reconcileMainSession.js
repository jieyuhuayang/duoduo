// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: reconcileMainSession  (minified: ISt, daemon.pretty.js:92422)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function reconcileMainSession(paths, bus, sessionIndex, finalSubscriberCount) {
    await reconcileMainSessionAtBoot(buildMainRoleContext(paths, bus, sessionIndex, finalSubscriberCount))
}
