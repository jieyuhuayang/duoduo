// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: AgentSdkTurnInterruptedError  (minified: ea, daemon.pretty.js:?)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var CLAUDE_CORE_TOOLS, PARTITION_CORE_TOOLS, Joe, JJe, WJe, AgentSdkTurnInterruptedError, AgentSdkPromptNotAcceptedAbortError, eu, Vl, Xoe, Lz, Goe, nWe, Fa = O(() => {
    "use strict";
    Jt();
    Nc();
    Mp();
    Az();
    CLAUDE_CORE_TOOLS = ["Bash", "Read", "Write", "Edit", "Grep", "Glob", "Agent", "TaskOutput", "TaskStop", "Skill", "ToolSearch", "TaskCreate", "TaskGet", "TaskUpdate", "TaskList", "SendMessage"], PARTITION_CORE_TOOLS = ["Bash", "Read", "Write", "Edit", "Grep", "Glob", "Agent"];
    Joe = "Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior and you MUST follow them exactly as written.", JJe = "The `[[slug]]` links in this board are dossier entry points, not footnotes. When a line's trigger fires in your current task and the inline summary is not enough to judge or act on that entity safely, read the linked dossier before committing — do not stitch a plausible judgment from the summary alone. Most turns resolve from the summary; expand only when it would otherwise leave you guessing on a consequential call.", WJe = /\[\[[^\]]+\]\]/, AgentSdkTurnInterruptedError = class extends Error {
        constructor(t = "SDK turn interrupted during execution") {
            super(t), this.name = "AgentSdkTurnInterruptedError"
        }
    }, AgentSdkPromptNotAcceptedAbortError = class extends Error {
        constructor(t = "SDK query aborted before the prompt was accepted") {
            super(t), this.name = "AgentSdkPromptNotAcceptedAbortError"
        }
    };
    Xoe = () => verifyClaudeCodeRuntimeAvailable(), Lz = Xoe, Goe = 5e3;
    nWe = 2147483647
});
