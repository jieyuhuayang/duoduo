// duoduo reconstruction — subsystem: 03-session-actor
// symbol: requestBoundaryAwarePreempt  (minified: gk, daemon.pretty.js:83195)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function requestBoundaryAwarePreempt(actor, mode, boundary, reason) {
    if (actor.query) {
        if (boundary === "tool_result" && actor.activeToolCalls.size > 0) return actor.pendingPreempt = !0, actor.pendingPreemptBoundary = "tool_result", actor.pendingPreemptReason = reason ?? null, "defer_tool_result";
        let currentTurn = actor.streamingState?.currentTurn;
        return currentTurn && !currentTurn.accepted ? (actor.pendingPreempt = !0, actor.pendingPreemptBoundary = "accept", actor.pendingPreemptReason = reason ?? null, "defer_accept") : (interruptActorQuery(actor), actor.pendingPreempt = !1, actor.pendingPreemptBoundary = null, actor.pendingPreemptReason = null, "immediate")
    }
    return !actor.currentAbortController || actor.currentAbortController.signal.aborted ? "noop" : boundary === "tool_result" ? actor.activeToolCalls.size > 0 ? (actor.pendingPreempt = !0, actor.pendingPreemptBoundary = "tool_result", actor.pendingPreemptReason = reason ?? null, "defer_tool_result") : (actor.currentAbortController.abort(reason), actor.currentAbortController = null, actor.pendingPreempt = !1, actor.pendingPreemptBoundary = null, actor.pendingPreemptReason = null, "immediate") : boundary === "tool_use" ? actor.isStreaming ? (actor.pendingPreempt = !0, actor.pendingPreemptBoundary = "tool_use", actor.pendingPreemptReason = reason ?? null, "defer_tool_use") : (actor.currentAbortController.abort(reason), actor.currentAbortController = null, actor.pendingPreempt = !1, actor.pendingPreemptBoundary = null, actor.pendingPreemptReason = null, "immediate") : mode === "soft" && actor.isStreaming ? (actor.pendingPreempt = !0, actor.pendingPreemptBoundary = "tool_use", actor.pendingPreemptReason = reason ?? null, "defer_tool_use") : mode === "soft" && actor.activeToolCalls.size > 0 ? (actor.pendingPreempt = !0, actor.pendingPreemptBoundary = "tool_result", actor.pendingPreemptReason = reason ?? null, "defer_tool_result") : (actor.currentAbortController.abort(reason), actor.currentAbortController = null, actor.pendingPreempt = !1, actor.pendingPreemptBoundary = null, actor.pendingPreemptReason = null, "immediate")
}
