// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildTransientUserBlocks  (minified: Vxe, daemon.pretty.js:71970)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.4.5, v0.5.2, v0.5.5, v0.5.10, v0.6.0, v0.6.2, v0.8.0, v0.8.1 (maps/history_daemon.json)
// changelog v0.3.0 (medium): **runner**: Add configurable time-gap session context and upgrade runtime prompt assembly to structured content blocks.
// changelog v0.5.10 (medium): A one-line notice on the session's next reply reports what was compacted and its measured stats, so retuning is based on real numbers rather than guesswork. See the `smart-compaction` skill
// changelog v0.6.2 (medium): `-r "<what changed>"` reaches every session that wakes after the restart
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildTransientUserBlocks(e, t, n) {
    let r = {
        gatewayNoticeInjected: !1,
        interruptedContextInjected: !1,
        skipRewindInjected: !1,
        timeGapInjected: !1,
        jobTickInjected: !1,
        jobReceiptsInjected: !1,
        daemonRestartHintInjected: !1,
        compactNoticeInjected: !1,
        boardUpdatedInjected: !1
    };
    if (e.trimStart().startsWith("/")) return {
        blocks: [{
            type: "text",
            text: e,
            tag: "user-input"
        }],
        ...r
    };
    let i = [],
        o = !1,
        s = !1,
        a = !1,
        u = !1,
        l = !1,
        c = !1,
        d = !1,
        f = !1,
        p = !1;
    if (t.daemonRestartHint && (i.push({
            type: "text",
            text: renderDaemonRestartHint(t.daemonRestartHint.startedAt, getPendingRestartReason()),
            tag: "daemon-restart-hint"
        }), d = !0), t.compactNotice && (i.push({
            type: "text",
            text: renderSmartCompactNoticeBlock(t.compactNotice),
            tag: "smart-compact-notice"
        }), f = !0), t.gatewayNotice) {
        let b = ["[Session Runtime Notice]", "This action was executed by a gateway command outside the model context.", "Treat it as already applied runtime state. Do not repeat it unless explicitly requested.", ...t.gatewayNotice.command === t.gatewayNotice.command_name ? [`- command: ${t.gatewayNotice.command}`] : [`- command: ${t.gatewayNotice.command}`, `- command_name: ${t.gatewayNotice.command_name}`], `- result: ${t.gatewayNotice.result_summary}`, `- applied_at: ${t.gatewayNotice.created_at}`, `- current_cwd: ${n.cwd}`].join(`
`);
        i.push({
            type: "text",
            text: `<system-reminder>

${b}

IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.

</system-reminder>`,
            tag: "gateway-notice"
        }), o = !0
    }
    let m = renderTimeGapContextBlock(t.timeGap);
    m && (i.push({
        type: "text",
        text: m,
        tag: "time-context"
    }), u = !0);
    let g = t.isUserMessage !== !1 ? renderSkipRewindBlock(t.skipRewind) : void 0;
    g && (i.push({
        type: "text",
        text: g,
        tag: "skip-rewind"
    }), a = !0);
    let y = Pmt(t.interruptedContext);
    return y && (i.push({
        type: "text",
        text: `<interrupted-context>
${y}
</interrupted-context>`,
        tag: "interrupted-context"
    }), s = !0), t.jobReceipts && (i.push({
        type: "text",
        text: t.jobReceipts,
        tag: "job-receipts"
    }), c = !0), t.jobTick && (i.push({
        type: "text",
        text: renderJobTickBlock(t.jobTick),
        tag: "job-tick"
    }), l = !0), t.boardUpdated && (i.push({
        type: "text",
        text: renderBoardUpdatedHint(t.boardUpdated.boardPath),
        tag: "board-updated"
    }), p = !0), i.push({
        type: "text",
        text: e,
        tag: "user-input"
    }), {
        blocks: i,
        gatewayNoticeInjected: o,
        interruptedContextInjected: s,
        skipRewindInjected: a,
        timeGapInjected: u,
        jobTickInjected: l,
        jobReceiptsInjected: c,
        daemonRestartHintInjected: d,
        compactNoticeInjected: f,
        boardUpdatedInjected: p
    }
}
