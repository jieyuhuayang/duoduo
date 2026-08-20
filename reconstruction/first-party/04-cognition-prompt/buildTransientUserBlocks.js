// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildTransientUserBlocks  (minified: Lhe, daemon.pretty.js:63657)
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
    let o = [],
        s = !1,
        a = !1,
        l = !1,
        u = !1,
        c = !1,
        d = !1,
        p = !1,
        f = !1;
    if (t.daemonRestartHint && (o.push({
            type: "text",
            text: renderDaemonRestartHint(t.daemonRestartHint.startedAt, getPendingRestartReason()),
            tag: "daemon-restart-hint"
        }), d = !0), t.compactNotice && (o.push({
            type: "text",
            text: bet(t.compactNotice),
            tag: "smart-compact-notice"
        }), p = !0), t.gatewayNotice) {
        let v = ["[Session Runtime Notice]", "This action was executed by a gateway command outside the model context.", "Treat it as already applied runtime state. Do not repeat it unless explicitly requested.", ...t.gatewayNotice.command === t.gatewayNotice.command_name ? [`- command: ${t.gatewayNotice.command}`] : [`- command: ${t.gatewayNotice.command}`, `- command_name: ${t.gatewayNotice.command_name}`], `- result: ${t.gatewayNotice.result_summary}`, `- applied_at: ${t.gatewayNotice.created_at}`, `- current_cwd: ${n.cwd}`].join(`
`);
        o.push({
            type: "text",
            text: `<system-reminder>

${v}

IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.

</system-reminder>`,
            tag: "gateway-notice"
        }), s = !0
    }
    let m = vet(t.timeGap);
    m && (o.push({
        type: "text",
        text: m,
        tag: "time-context"
    }), u = !0);
    let y = t.isUserMessage !== !1 ? yet(t.skipRewind) : void 0;
    y && (o.push({
        type: "text",
        text: y,
        tag: "skip-rewind"
    }), l = !0);
    let _ = pet(t.interruptedContext);
    return _ && (o.push({
        type: "text",
        text: `<interrupted-context>
${_}
</interrupted-context>`,
        tag: "interrupted-context"
    }), a = !0), t.jobTick && (o.push({
        type: "text",
        text: ket(t.jobTick),
        tag: "job-tick"
    }), c = !0), t.boardUpdated && (o.push({
        type: "text",
        text: vhe(t.boardUpdated.boardPath),
        tag: "board-updated"
    }), f = !0), o.push({
        type: "text",
        text: e,
        tag: "user-input"
    }), {
        blocks: o,
        gatewayNoticeInjected: s,
        interruptedContextInjected: a,
        skipRewindInjected: l,
        timeGapInjected: u,
        jobTickInjected: c,
        daemonRestartHintInjected: d,
        compactNoticeInjected: p,
        boardUpdatedInjected: f,
        captured: r
    }
}
