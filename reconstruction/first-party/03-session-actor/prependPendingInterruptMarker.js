// duoduo reconstruction — subsystem: 03-session-actor
// symbol: prependPendingInterruptMarker  (minified: BTe, daemon.pretty.js:85243)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 2 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): instead of the turn simply stopping and the next one starting from a gap it cannot explain.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function prependPendingInterruptMarker(actor, queryInput) {
    let pendingInterruptMarker = actor.pendingInterruptMarker;
    if (!pendingInterruptMarker || typeof queryInput.prompt == "string") return queryInput;
    let marker = pendingInterruptMarker,
        prompt = queryInput.prompt;
    async function* promptWithMarker() {
        let injected = !1;
        for await (let message of prompt) {
            if (!injected && actor.pendingInterruptMarker === marker) {
                injected = !0, actor.pendingInterruptMarker = null, yield lkt(message, marker);
                continue
            }
            yield message
        }
    }
    return {
        ...queryInput,
        prompt: promptWithMarker()
    }
}
