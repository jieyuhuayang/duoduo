// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildTransientUserBlocks  (minified: sfe, daemon.pretty.js:61047)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildTransientUserBlocks(e, t, n) {
    let r = {
            gatewayNotice: t.gatewayNotice,
            interruptedContext: t.interruptedContext,
            skipRewind: t.skipRewind
        },
        i = {
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
        ...i,
        captured: r
    };
    let s = [],
        o = !1,
        a = !1,
        c = !1,
        u = !1,
        l = !1,
        d = !1,
        p = !1,
        f = !1;
    if (t.daemonRestartHint && (s.push({
            type: "text",
            text: renderDaemonRestartHint(t.daemonRestartHint.startedAt, getPendingRestartReason()),
            tag: "daemon-restart-hint"
        }), d = !0), t.compactNotice && (s.push({
            type: "text",
            text: g8e(t.compactNotice),
            tag: "smart-compact-notice"
        }), p = !0), t.gatewayNotice) {
        let v = ["[Session Runtime Notice]", "This action was executed by a gateway command outside the model context.", "Treat it as already applied runtime state. Do not repeat it unless explicitly requested.", ...t.gatewayNotice.command === t.gatewayNotice.command_name ? [`- command: ${t.gatewayNotice.command}`] : [`- command: ${t.gatewayNotice.command}`, `- command_name: ${t.gatewayNotice.command_name}`], `- result: ${t.gatewayNotice.result_summary}`, `- applied_at: ${t.gatewayNotice.created_at}`, `- current_cwd: ${n.cwd}`].join(`
`);
        s.push({
            type: "text",
            text: `<system-reminder>

${v}

IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.

</system-reminder>`,
            tag: "gateway-notice"
        }), o = !0
    }
    let m = y8e(t.timeGap);
    m && (s.push({
        type: "text",
        text: m,
        tag: "time-context"
    }), u = !0);
    let _ = t.isUserMessage !== !1 ? m8e(t.skipRewind) : void 0;
    _ && (s.push({
        type: "text",
        text: _,
        tag: "skip-rewind"
    }), c = !0);
    let b = l8e(t.interruptedContext);
    return b && (s.push({
        type: "text",
        text: `<interrupted-context>
${b}
</interrupted-context>`,
        tag: "interrupted-context"
    }), a = !0), t.jobTick && (s.push({
        type: "text",
        text: b8e(t.jobTick),
        tag: "job-tick"
    }), l = !0), t.boardUpdated && (s.push({
        type: "text",
        text: Ude(t.boardUpdated.boardPath),
        tag: "board-updated"
    }), f = !0), s.push({
        type: "text",
        text: e,
        tag: "user-input"
    }), {
        blocks: s,
        gatewayNoticeInjected: o,
        interruptedContextInjected: a,
        skipRewindInjected: c,
        timeGapInjected: u,
        jobTickInjected: l,
        daemonRestartHintInjected: d,
        compactNoticeInjected: p,
        boardUpdatedInjected: f,
        captured: r
    }
}
