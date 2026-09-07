// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildTransientUserBlocks  (minified: Xye, daemon.pretty.js:65062)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildTransientUserBlocks(e, t, n) {
    let r = {
        gatewayNoticeInjected: !1,
        interruptedContextInjected: !1,
        skipRewindInjected: !1,
        timeGapInjected: !1,
        jobTickInjected: !1,
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
        p = !1;
    if (t.daemonRestartHint && (i.push({
            type: "text",
            text: renderDaemonRestartHint(t.daemonRestartHint.startedAt, getPendingRestartReason()),
            tag: "daemon-restart-hint"
        }), c = !0), t.compactNotice && (i.push({
            type: "text",
            text: Krt(t.compactNotice),
            tag: "smart-compact-notice"
        }), d = !0), t.gatewayNotice) {
        let w = ["[Session Runtime Notice]", "This action was executed by a gateway command outside the model context.", "Treat it as already applied runtime state. Do not repeat it unless explicitly requested.", ...t.gatewayNotice.command === t.gatewayNotice.command_name ? [`- command: ${t.gatewayNotice.command}`] : [`- command: ${t.gatewayNotice.command}`, `- command_name: ${t.gatewayNotice.command_name}`], `- result: ${t.gatewayNotice.result_summary}`, `- applied_at: ${t.gatewayNotice.created_at}`, `- current_cwd: ${n.cwd}`].join(`
`);
        i.push({
            type: "text",
            text: `<system-reminder>

${w}

IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.

</system-reminder>`,
            tag: "gateway-notice"
        }), o = !0
    }
    let f = Yrt(t.timeGap);
    f && (i.push({
        type: "text",
        text: f,
        tag: "time-context"
    }), l = !0);
    let h = t.isUserMessage !== !1 ? Jrt(t.skipRewind) : void 0;
    h && (i.push({
        type: "text",
        text: h,
        tag: "skip-rewind"
    }), a = !0);
    let g = Brt(t.interruptedContext);
    return g && (i.push({
        type: "text",
        text: `<interrupted-context>
${g}
</interrupted-context>`,
        tag: "interrupted-context"
    }), s = !0), t.jobTick && (i.push({
        type: "text",
        text: Qrt(t.jobTick),
        tag: "job-tick"
    }), u = !0), t.boardUpdated && (i.push({
        type: "text",
        text: Oye(t.boardUpdated.boardPath),
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
        timeGapInjected: l,
        jobTickInjected: u,
        daemonRestartHintInjected: c,
        compactNoticeInjected: d,
        boardUpdatedInjected: p
    }
}
