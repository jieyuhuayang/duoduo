// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildTransientUserBlocks  (minified: K_e, daemon.pretty.js:65787)
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
        l = !1,
        u = !1,
        c = !1,
        d = !1,
        p = !1,
        f = !1;
    if (t.daemonRestartHint && (i.push({
            type: "text",
            text: renderDaemonRestartHint(t.daemonRestartHint.startedAt, getPendingRestartReason()),
            tag: "daemon-restart-hint"
        }), d = !0), t.compactNotice && (i.push({
            type: "text",
            text: Pot(t.compactNotice),
            tag: "smart-compact-notice"
        }), p = !0), t.gatewayNotice) {
        let v = ["[Session Runtime Notice]", "This action was executed by a gateway command outside the model context.", "Treat it as already applied runtime state. Do not repeat it unless explicitly requested.", ...t.gatewayNotice.command === t.gatewayNotice.command_name ? [`- command: ${t.gatewayNotice.command}`] : [`- command: ${t.gatewayNotice.command}`, `- command_name: ${t.gatewayNotice.command_name}`], `- result: ${t.gatewayNotice.result_summary}`, `- applied_at: ${t.gatewayNotice.created_at}`, `- current_cwd: ${n.cwd}`].join(`
`);
        i.push({
            type: "text",
            text: `<system-reminder>

${v}

IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.

</system-reminder>`,
            tag: "gateway-notice"
        }), o = !0
    }
    let m = Cot(t.timeGap);
    m && (i.push({
        type: "text",
        text: m,
        tag: "time-context"
    }), l = !0);
    let g = t.isUserMessage !== !1 ? Rot(t.skipRewind) : void 0;
    g && (i.push({
        type: "text",
        text: g,
        tag: "skip-rewind"
    }), a = !0);
    let y = Sot(t.interruptedContext);
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
        text: $ot(t.jobTick),
        tag: "job-tick"
    }), u = !0), t.boardUpdated && (i.push({
        type: "text",
        text: E_e(t.boardUpdated.boardPath),
        tag: "board-updated"
    }), f = !0), i.push({
        type: "text",
        text: e,
        tag: "user-input"
    }), {
        blocks: i,
        gatewayNoticeInjected: o,
        interruptedContextInjected: s,
        skipRewindInjected: a,
        timeGapInjected: l,
        jobTickInjected: u,
        jobReceiptsInjected: c,
        daemonRestartHintInjected: d,
        compactNoticeInjected: p,
        boardUpdatedInjected: f
    }
}
