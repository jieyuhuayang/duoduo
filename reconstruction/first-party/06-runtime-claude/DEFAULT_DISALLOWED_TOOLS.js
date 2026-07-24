// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: DEFAULT_DISALLOWED_TOOLS  (minified: g_, daemon.pretty.js:57700)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var DEFAULT_DISALLOWED_TOOLS, Jue, H9e, V9e, AgentSdkTurnInterruptedError, AgentSdkPromptNotAcceptedAbortError, Yc, Vl, Xue, iU, Kue, Q9e, Qc = $(() => {
 "use strict";
 Wt();
 vc();
 al();
 p_();
 tU();
 DEFAULT_DISALLOWED_TOOLS = ["EnterPlanMode", "ExitPlanMode", "AskUserQuestion", "WebFetch", "WebSearch", "EnterWorktree"], Jue = "Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior and you MUST follow them exactly as written.", H9e = "The `[[slug]]` links in this board are dossier entry points, not footnotes. When a line's trigger fires in your current task and the inline summary is not enough to judge or act on that entity safely, read the linked dossier before committing — do not stitch a plausible judgment from the summary alone. Most turns resolve from the summary; expand only when it would otherwise leave you guessing on a consequential call.", V9e = /\[\[[^\]]+\]\]/, AgentSdkTurnInterruptedError = class extends Error {
  constructor(t = "SDK turn interrupted during execution") {
   super(t), this.name = "AgentSdkTurnInterruptedError"
  }
 }, AgentSdkPromptNotAcceptedAbortError = class extends Error {
  constructor(t = "SDK query aborted before the prompt was accepted") {
   super(t), this.name = "AgentSdkPromptNotAcceptedAbortError"
  }
 };
 Xue = () => verifyClaudeCodeRuntimeAvailable(), iU = Xue, Kue = 5e3;
 Q9e = 2147483647
});
