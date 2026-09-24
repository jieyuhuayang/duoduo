// duoduo reconstruction — subsystem: 03-session-actor
// symbol: requestBoundaryAwarePreempt  (minified: zS, daemon.pretty.js:82849)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function requestBoundaryAwarePreempt(e, t, n, r) {
    if (e.query) {
        if (n === "tool_result" && e.activeToolCalls.size > 0) return e.pendingPreempt = !0, e.pendingPreemptBoundary = "tool_result", e.pendingPreemptReason = r ?? null, "defer_tool_result";
        let i = e.streamingState?.currentTurn;
        return i && !i.accepted ? (e.pendingPreempt = !0, e.pendingPreemptBoundary = "accept", e.pendingPreemptReason = r ?? null, "defer_accept") : (interruptActorQuery(e), e.pendingPreempt = !1, e.pendingPreemptBoundary = null, e.pendingPreemptReason = null, "immediate")
    }
    return !e.currentAbortController || e.currentAbortController.signal.aborted ? "noop" : n === "tool_result" ? e.activeToolCalls.size > 0 ? (e.pendingPreempt = !0, e.pendingPreemptBoundary = "tool_result", e.pendingPreemptReason = r ?? null, "defer_tool_result") : (e.currentAbortController.abort(r), e.currentAbortController = null, e.pendingPreempt = !1, e.pendingPreemptBoundary = null, e.pendingPreemptReason = null, "immediate") : n === "tool_use" ? e.isStreaming ? (e.pendingPreempt = !0, e.pendingPreemptBoundary = "tool_use", e.pendingPreemptReason = r ?? null, "defer_tool_use") : (e.currentAbortController.abort(r), e.currentAbortController = null, e.pendingPreempt = !1, e.pendingPreemptBoundary = null, e.pendingPreemptReason = null, "immediate") : t === "soft" && e.isStreaming ? (e.pendingPreempt = !0, e.pendingPreemptBoundary = "tool_use", e.pendingPreemptReason = r ?? null, "defer_tool_use") : t === "soft" && e.activeToolCalls.size > 0 ? (e.pendingPreempt = !0, e.pendingPreemptBoundary = "tool_result", e.pendingPreemptReason = r ?? null, "defer_tool_result") : (e.currentAbortController.abort(r), e.currentAbortController = null, e.pendingPreempt = !1, e.pendingPreemptBoundary = null, e.pendingPreemptReason = null, "immediate")
}
