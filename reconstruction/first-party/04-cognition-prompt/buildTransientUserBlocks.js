// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildTransientUserBlocks  (minified: Vxe, daemon.pretty.js:71970)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.4.5, v0.5.2, v0.5.5, v0.5.10, v0.6.0, v0.6.2, v0.8.0, v0.8.1 (maps/history_daemon.json)
// locals: 18 renamed — 1 from the code at the binding (rule), 17 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (medium): **runner**: Add configurable time-gap session context and upgrade runtime prompt assembly to structured content blocks.
// changelog v0.5.10 (medium): A one-line notice on the session's next reply reports what was compacted and its measured stats, so retuning is based on real numbers rather than guesswork. See the `smart-compaction` skill
// changelog v0.6.2 (medium): `-r "<what changed>"` reaches every session that wakes after the restart
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildTransientUserBlocks(userText, options, context) {
    let noneInjected = {
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
    if (userText.trimStart().startsWith("/")) return {
        blocks: [{
            type: "text",
            text: userText,
            tag: "user-input"
        }],
        ...noneInjected
    };
    let blocks = [],
        gatewayNoticeInjected = !1,
        interruptedContextInjected = !1,
        skipRewindInjected = !1,
        timeGapInjected = !1,
        jobTickInjected = !1,
        jobReceiptsInjected = !1,
        daemonRestartHintInjected = !1,
        compactNoticeInjected = !1,
        boardUpdatedInjected = !1;
    if (options.daemonRestartHint && (blocks.push({
            type: "text",
            text: renderDaemonRestartHint(options.daemonRestartHint.startedAt, getPendingRestartReason()),
            tag: "daemon-restart-hint"
        }), daemonRestartHintInjected = !0), options.compactNotice && (blocks.push({
            type: "text",
            text: renderSmartCompactNoticeBlock(options.compactNotice),
            tag: "smart-compact-notice"
        }), compactNoticeInjected = !0), options.gatewayNotice) {
        let noticeText = ["[Session Runtime Notice]", "This action was executed by a gateway command outside the model context.", "Treat it as already applied runtime state. Do not repeat it unless explicitly requested.", ...options.gatewayNotice.command === options.gatewayNotice.command_name ? [`- command: ${options.gatewayNotice.command}`] : [`- command: ${options.gatewayNotice.command}`, `- command_name: ${options.gatewayNotice.command_name}`], `- result: ${options.gatewayNotice.result_summary}`, `- applied_at: ${options.gatewayNotice.created_at}`, `- current_cwd: ${context.cwd}`].join(`
`);
        blocks.push({
            type: "text",
            text: `<system-reminder>

${noticeText}

IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.

</system-reminder>`,
            tag: "gateway-notice"
        }), gatewayNoticeInjected = !0
    }
    let timeGapContextBlock = renderTimeGapContextBlock(options.timeGap);
    timeGapContextBlock && (blocks.push({
        type: "text",
        text: timeGapContextBlock,
        tag: "time-context"
    }), timeGapInjected = !0);
    let skipRewindBlock = options.isUserMessage !== !1 ? renderSkipRewindBlock(options.skipRewind) : void 0;
    skipRewindBlock && (blocks.push({
        type: "text",
        text: skipRewindBlock,
        tag: "skip-rewind"
    }), skipRewindInjected = !0);
    let interruptedContext = Pmt(options.interruptedContext);
    return interruptedContext && (blocks.push({
        type: "text",
        text: `<interrupted-context>
${interruptedContext}
</interrupted-context>`,
        tag: "interrupted-context"
    }), interruptedContextInjected = !0), options.jobReceipts && (blocks.push({
        type: "text",
        text: options.jobReceipts,
        tag: "job-receipts"
    }), jobReceiptsInjected = !0), options.jobTick && (blocks.push({
        type: "text",
        text: renderJobTickBlock(options.jobTick),
        tag: "job-tick"
    }), jobTickInjected = !0), options.boardUpdated && (blocks.push({
        type: "text",
        text: renderBoardUpdatedHint(options.boardUpdated.boardPath),
        tag: "board-updated"
    }), boardUpdatedInjected = !0), blocks.push({
        type: "text",
        text: userText,
        tag: "user-input"
    }), {
        blocks,
        gatewayNoticeInjected,
        interruptedContextInjected,
        skipRewindInjected,
        timeGapInjected,
        jobTickInjected,
        jobReceiptsInjected,
        daemonRestartHintInjected,
        compactNoticeInjected,
        boardUpdatedInjected
    }
}
