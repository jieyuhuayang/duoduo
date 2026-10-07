// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: PARTITION_CORE_TOOLS  (minified: gV, daemon.pretty.js:55834)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var CLAUDE_CORE_TOOLS, PARTITION_CORE_TOOLS, Hge, pot, mot, AgentSdkTurnInterruptedError, AgentSdkPromptNotAcceptedAbortError, Sc, jf, Yge, yV, Jge, Sot, initAgentSdkAdapterModule = O(() => {
    "use strict";
    pt();
    qu();
    initSkipToolModule();
    initCallerSessionEnvModule();
    Q$();
    CLAUDE_CORE_TOOLS = ["Bash", "Read", "Write", "Edit", "Grep", "Glob", "Agent", "TaskStop", "Skill", "ToolSearch", "TaskCreate", "TaskGet", "TaskUpdate", "TaskList", "SendMessage"], PARTITION_CORE_TOOLS = ["Bash", "Read", "Write", "Edit", "Grep", "Glob"];
    Hge = "Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior and you MUST follow them exactly as written.", pot = "The `[[slug]]` links in this board are dossier entry points, not footnotes. When a line's trigger fires in your current task and the inline summary is not enough to judge or act on that entity safely, read the linked dossier before committing — do not stitch a plausible judgment from the summary alone. Most turns resolve from the summary; expand only when it would otherwise leave you guessing on a consequential call.", mot = /\[\[[^\]]+\]\]/, AgentSdkTurnInterruptedError = class extends Error {
        constructor(t = "SDK turn interrupted during execution") {
            super(t), this.name = "AgentSdkTurnInterruptedError"
        }
    }, AgentSdkPromptNotAcceptedAbortError = class extends Error {
        constructor(t = "SDK query aborted before the prompt was accepted") {
            super(t), this.name = "AgentSdkPromptNotAcceptedAbortError"
        }
    };
    Yge = () => verifyClaudeCodeRuntimeAvailable(), yV = Yge, Jge = 5e3;
    Sot = 2147483647
});
