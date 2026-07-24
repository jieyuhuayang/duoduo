// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: buildTransientUserBlocks  (minified: fde, daemon.pretty.js:61154)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildTransientUserBlocks(e, t, n) {
 let r = {
  gatewayNoticeInjected: !1,
  interruptedContextInjected: !1,
  skipRewindInjected: !1,
  timeGapInjected: !1,
  jobTickInjected: !1,
  daemonRestartHintInjected: !1
 };
 if (e.trimStart()
  .startsWith("/")) return {
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
  c = !1,
  u = !1,
  l = !1;
 if (t.daemonRestartHint && (i.push({
   type: "text",
   text: Kle(t.daemonRestartHint.startedAt),
   tag: "daemon-restart-hint"
  }), l = !0), t.gatewayNotice) {
  let g = ["[Session Runtime Notice]", "This action was executed by a gateway command outside the model context.", "Treat it as already applied runtime state. Do not repeat it unless explicitly requested.", ...t.gatewayNotice.command === t.gatewayNotice.command_name ? [`- command: ${t.gatewayNotice.command}`] : [`- command: ${t.gatewayNotice.command}`, `- command_name: ${t.gatewayNotice.command_name}`], `- result: ${t.gatewayNotice.result_summary}`, `- applied_at: ${t.gatewayNotice.created_at}`, `- current_cwd: ${n.cwd}`].join(`
`);
  i.push({
   type: "text",
   text: `<system-reminder>

${g}

IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.

</system-reminder>`,
   tag: "gateway-notice"
  }), o = !0
 }
 let d = w5e(t.timeGap);
 d && (i.push({
  type: "text",
  text: d,
  tag: "time-context"
 }), c = !0);
 let f = t.isUserMessage !== !1 ? b5e(t.skipRewind) : void 0;
 f && (i.push({
  type: "text",
  text: f,
  tag: "skip-rewind"
 }), a = !0);
 let m = g5e(t.interruptedContext);
 return m && (i.push({
  type: "text",
  text: `<interrupted-context>
${m}
</interrupted-context>`,
  tag: "interrupted-context"
 }), s = !0), t.jobTick && (i.push({
  type: "text",
  text: k5e(t.jobTick),
  tag: "job-tick"
 }), u = !0), i.push({
  type: "text",
  text: e,
  tag: "user-input"
 }), {
  blocks: i,
  gatewayNoticeInjected: o,
  interruptedContextInjected: s,
  skipRewindInjected: a,
  timeGapInjected: c,
  jobTickInjected: u,
  daemonRestartHintInjected: l
 }
}
