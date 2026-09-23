// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: AgentSdkPromptNotAcceptedAbortError  (minified: Rr, daemon.pretty.js:55516)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var CLAUDE_CORE_TOOLS, PARTITION_CORE_TOOLS, xhe, brt, vrt, AgentSdkTurnInterruptedError, AgentSdkPromptNotAcceptedAbortError, dc, xf, Che, hB, Rhe, Trt, wo = O(() => {
    "use strict";
    dt();
    Au();
    Bu();
    yC();
    CLAUDE_CORE_TOOLS = ["Bash", "Read", "Write", "Edit", "Grep", "Glob", "Agent", "TaskStop", "Skill", "ToolSearch", "TaskCreate", "TaskGet", "TaskUpdate", "TaskList", "SendMessage"], PARTITION_CORE_TOOLS = ["Bash", "Read", "Write", "Edit", "Grep", "Glob"];
    xhe = "Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior and you MUST follow them exactly as written.", brt = "The `[[slug]]` links in this board are dossier entry points, not footnotes. When a line's trigger fires in your current task and the inline summary is not enough to judge or act on that entity safely, read the linked dossier before committing — do not stitch a plausible judgment from the summary alone. Most turns resolve from the summary; expand only when it would otherwise leave you guessing on a consequential call.", vrt = /\[\[[^\]]+\]\]/, AgentSdkTurnInterruptedError = class extends Error {
        constructor(t = "SDK turn interrupted during execution") {
            super(t), this.name = "AgentSdkTurnInterruptedError"
        }
    }, AgentSdkPromptNotAcceptedAbortError = class extends Error {
        constructor(t = "SDK query aborted before the prompt was accepted") {
            super(t), this.name = "AgentSdkPromptNotAcceptedAbortError"
        }
    };
    Che = () => verifyClaudeCodeRuntimeAvailable(), hB = Che, Rhe = 5e3;
    Trt = 2147483647
});
