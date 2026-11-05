# Naming tasks: unnamed top-level code

For each section, read the body and how the named code below uses it, and write a name into `toplevel.tsv`
(second column; keep or change the suggested subsystem in the third). Spell it for its kind: a function in
camelCase, a module initialiser as `init<Name>Module`, a literal constant in UPPER_SNAKE; at least 8 characters;
say what the code does, from its string literals, property names and callers -- never from a local's name.
Delete the line of anything you cannot name with confidence. Then check every proposal before writing it:

    node name_symbol.mjs --build <OUT> --dry-run <pretty.js> --batch toplevel.tsv

51 candidate(s), most used first.

## rt (function, line 36871)

spell: camelCase (a class: PascalCase); suggested subsystem: 02-gateway-rpc
used by: applySessionConfigVerb [02-gateway-rpc], checkChannelRuntimeRebindConflict [02-gateway-rpc], collectInstructionsInputs [03-session-actor], createClaudeStreamingSessionFactory [06-runtime-claude], createDaemon [00-daemon-entry], createModelCommandResolvers [03-session-actor], createSessionManager [03-session-actor], describeChannelInstance [02-gateway-rpc], drainSessionMailbox [03-session-actor], executeGatewayCommand [02-gateway-rpc], hasSkipRewindRecordSince [05-drain-turn], readPendingOutboundAttachments [05-drain-turn] (+7)

```js
async function rt(e, t) {
    try {
        let n = await Ja.readFile(Ss(e, t), "utf8");
        return JSON.parse(n)
    } catch {
        return null
    }
}
```

## Fo (function, line 33558)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: archiveSessionAndArtifacts [03-session-actor], drainSessionMailbox [03-session-actor], executeGatewayCommand [02-gateway-rpc], rehydrateSessionState [03-session-actor], resolveArchivedSessionDir [03-session-actor], resolveSessionDir [03-session-actor], writeIngressSnapshot [02-gateway-rpc]
strings: "sha256"

```js
function Fo(e) {
    return gXe.createHash("sha256").update(e).digest("hex")
}
```

## rp (module initialiser, line 64309)

spell: init<Name>Module; suggested subsystem: 07-runtime-codex
used by: buildCodexDirectOnlyToolConfig [07-runtime-codex], buildDeveloperInstructions [07-runtime-codex], createCodexAppServerAdapter [07-runtime-codex], describeChannelInstance [02-gateway-rpc], initManageJobToolModule [08-cadence-subconscious], main [00-daemon-entry]
assigns: uO (uninitialised vars the code reads; cite their values through this initialiser)
strings: "use strict", "aladuo", "features.code_mode.direct_only_tool_namespaces", ", env: {}, sandbox: ", ", serviceName: ", "app-server", ", n => { this.alive = !1; let r = n.code === ", "Codex CLI ('", ") : n; this.rejectAllPending(r) }), this.proc.on(\"exit\", (n, r) => { this.al", "codex app-server exited (code=", "); this.rejectAllPending(i) }), this.rl = rc(this.proc.stdout, n => this.handleLine(n)), rc(", "[codex-stderr]"
shares uO: also used by buildCodexDirectOnlyToolConfig, buildDeveloperInstructions, createCodexAppServerAdapter
shares zct: also used by buildCodexDirectOnlyToolConfig
shares aO: also used by createCodexAppServerAdapter
shares not: also used by validateKnownRuntimeValue, runSkipTool, verifyClaudeCodeRuntimeAvailable, renderJobMissionBlock, createAgentSdkAdapter, validateJobScheduleExpression

```js
rp = A(() => {
    "use strict";
    ic();
    mt();
    rS();
    tl();
    uO = "aladuo", zct = "features.code_mode.direct_only_tool_namespaces";
    Vct = {
        codexBinary: "codex",
        env: {},
        sandbox: "read-only",
        serviceName: "duoduo_runtime",
        model: null,
        effort: null,
        ephemeral: !0,
        dynamicTools: []
    }, aO = class extends Fct {
        constructor(n, r, i) {
            super();
            this.binary = n;
            this.cwd = r;
            this.env = i
        }
        binary;
        cwd;
        env;
        proc = null;
        rl = null;
        nextId = 1;
        pending = new Map;
        alive = !1;
        start() {
            this.alive || (this.proc = Mct(this.binary, ["app-server"], {
                cwd: this.cwd,
                stdio: ["pipe", "pipe", "pipe"],
                env: {
                    ...process.env,
                    ...this.env
                },
                detached: !0
… (211 lines)
```

## To (module initialiser, line 57104)

spell: init<Name>Module; suggested subsystem: 03-session-actor
used by: createMetaSession [03-session-actor], describeChannelInstance [02-gateway-rpc], initInstructionsFingerprintModule [03-session-actor], initMailboxDrainRunnerModule [05-drain-turn], initManageJobToolModule [08-cadence-subconscious], listDefaultClaudeToolNames [03-session-actor], main [00-daemon-entry]
assigns: Eg, FV (uninitialised vars the code reads; cite their values through this initialiser)
strings: "use strict", "TaskStop", "ToolSearch", "TaskCreate", "TaskGet", "TaskUpdate", "TaskList", "SendMessage", "]; l_e = ", ", Cat = ", "[[slug]]", " links in this board are dossier entry points, not footnotes. When a line's trigger fires in your current task and the i"
shares Eg: also used by listDefaultClaudeToolNames
shares FV: also used by createMetaSession
shares l_e: also used by renderPromptLayers
shares are: also used by renderJobMissionBlock, parseJobRearmTime, buildDeveloperInstructions, renderJobExtraToolsDescription, runManageJobTool, renderNotifyRefusalMessage
shares to: also used by resolveRuntimePaths, mergeInboxIntoMailbox, verifyClaudeCodeRuntimeAvailable, renderJobMissionBlock, createAgentSdkAdapter, assertScheduleDurationRepresentable
shares Cat: also used by renderPromptLayers

```js
To = A(() => {
    "use strict";
    mt();
    Bu();
    tl();
    sC();
    hC();
    Eg = ["Bash", "Read", "Write", "Edit", "Grep", "Glob", "Agent", "TaskStop", "Skill", "ToolSearch", "TaskCreate", "TaskGet", "TaskUpdate", "TaskList", "SendMessage"], FV = ["Bas
    l_e = "Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior and you MUST follow 
        constructor(t = "SDK turn interrupted during execution") {
            super(t), this.name = "AgentSdkTurnInterruptedError"
        }
    }, Ar = class extends Error {
        constructor(t = "SDK query aborted before the prompt was accepted") {
            super(t), this.name = "AgentSdkPromptNotAcceptedAbortError"
        }
    };
    m_e = () => g_e(), zV = m_e, d_e = 5e3;
    zat = 2147483647
})
```

## Fc (function, line 64563)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: createMetaSession [03-session-actor], createSessionManager [03-session-actor], primeGrokAvailability [11-runtime-grok], runManageJobTool [08-cadence-subconscious]
strings: ") { let { execFile: t } = await import(", "), { promisify: n } = await import(", "), r = n(t); try { await r(e, [", "Grok CLI ('", " } } return { ok: !0 } }"
shares ok: also used by validateKnownRuntimeValue, validateRunnableRuntimeValue, resolveLayeredChannelRuntime, loadChannelKindConfig, probeClaudeAvailability, checkCodexAvailability
shares not: also used by validateKnownRuntimeValue, runSkipTool, verifyClaudeCodeRuntimeAvailable, renderJobMissionBlock, createAgentSdkAdapter, validateJobScheduleExpression

```js
async function Fc(e = "grok") {
    let {
        execFile: t
    } = await import("node:child_process"), {
        promisify: n
    } = await import("node:util"), r = n(t);
    try {
        await r(e, ["--version"], {
            timeout: Qct
        })
    } catch {
        return {
            ok: !1,
            reason: `Grok CLI ('${e}') is not installed or not in PATH. Install it and run 'grok login'.`
        }
    }
    return {
        ok: !0
    }
}
```

## Vg (module initialiser, line 65266)

spell: init<Name>Module; suggested subsystem: 11-runtime-grok
used by: createGrokAcpAdapter [11-runtime-grok], describeChannelInstance [02-gateway-rpc], initManageJobToolModule [08-cadence-subconscious], main [00-daemon-entry]
assigns: qve, Hve (uninitialised vars the code reads; cite their values through this initialiser)
strings: "use strict", "scheduler_create", "scheduler_list", "scheduler_delete", "monitor", "workflow", "update_goal", "duoduo", "duoduo session", "; Uve = aS(", "), qve = aS(", "), Bve = "
shares qve: also used by createGrokAcpAdapter
shares Hve: also used by createGrokAcpAdapter
shares n6: also used by createGrokAcpAdapter
shares ms: also used by probeClaudeAvailability, createGrokAcpAdapter, createMetaSession, main

```js
Vg = A(() => {
    "use strict";
    ic();
    mt();
    To();
    rS();
    tl();
    Qct = 5e3;
    Lve = ["scheduler_create", "scheduler_list", "scheduler_delete", "monitor", "workflow", "update_goal"], Fve = {
        name: "duoduo",
        description: "duoduo session",
        disallowedTools: [...Lve]
    }, zve = "_x.ai";
    Uve = aS("mcp/sdk_call"), qve = aS("compact_conversation"), Bve = "x.ai/mcp/sdk", Vve = "x.ai/mcp/servers", Hve = "aladuo";
    n6 = class {
        onmessage;
        onclose;
        onerror;
        replies = new Map;
        async start() {}
        async close() {
            let t = new Error("aladuo MCP transport closed");
            for (let n of this.replies.values()) n.reject(t);
            this.replies.clear(), this.onclose?.()
        }
        async send(t) {
            if (!("id" in t) || t.id === void 0 || t.id === null) return;
            let n = this.replies.get(String(t.id));
            n && (this.replies.delete(String(t.id)), n.resolve(t))
        }
        dispatch(t, n = 3e4) {
            if (!("id" in t) || t.id === void 0 || t.id === null) return this.onmessage?.(t), Promise.resolve({
                jsonrpc: "2.0",
                id: 0,
                result: {}
            });
            let r = String(t.id);
            return new Promise((i, o) => {
                let s = setTimeout(() => {
                    this.replies.delete(r);
… (55 lines)
```

## rc (function, line 33078)

spell: camelCase (a class: PascalCase); suggested subsystem: 11-runtime-grok
used by: createGrokAcpAdapter [11-runtime-grok], createPiWorkerAdapter [10-runtime-host], requestPiWorkerCatalog [03-session-actor]
strings: ", o), e.off(", ", s), e.off(", ", s) }; return e.on(", ", o), e.on(", ", s), e.on("

```js
function rc(e, t, n) {
    let r = Due(t),
        i = !1,
        o = u => {
            r.write(u)
        },
        s = () => {
            i || (i = !0, r.flush(), a(), n?.onEof?.())
        },
        a = () => {
            e.off("data", o), e.off("end", s), e.off("close", s)
        };
    return e.on("data", o), e.on("end", s), e.on("close", s), {
        close() {
            i || (i = !0, a())
        }
    }
}
```

## Vu (function, line 34159)

spell: camelCase (a class: PascalCase); suggested subsystem: 02-gateway-rpc
used by: appendBeforeExecuteGateway [02-gateway-rpc], createMetaSession [03-session-actor], runCadenceTick [08-cadence-subconscious]

```js
async function Vu(e, t, n, r = new Date) {
    let i = await qb(e, n);
    return i ? (await zXe(e, t, {
        updated_at: r.toISOString(),
        partition: i.partition,
        byte_offset: i.byte_offset,
        last_event_id: n
    }), !0) : !1
}
```

## fI (function, line 34178)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: initializeRuntime [10-runtime-host], readStatus [00-daemon-entry], writeStatus [00-daemon-entry]
strings: "status.json"

```js
function fI(e) {
    return rle.join(e.registryDir, "status.json")
}
```

## Hu (function, line 34220)

spell: camelCase (a class: PascalCase); suggested subsystem: 02-gateway-rpc
used by: appendBeforeExecuteGateway [02-gateway-rpc], createMetaSession [03-session-actor], runCadenceTick [08-cadence-subconscious]

```js
async function Hu(e, t, n = new Date) {
    let r = await Yb(e) ?? qU(e, n),
        i = t(r);
    return i.generated_at = n.toISOString(), await BU(e, i), i
}
```

## IW (module initialiser, line 70410)

spell: init<Name>Module; suggested subsystem: 10-runtime-host
used by: readHostDaemonToken [10-runtime-host], writeHostClaudeCodeExecutableEnvConfig [06-runtime-claude], writeHostDaemonToken [10-runtime-host]
assigns: fA, xW (uninitialised vars the code reads; cite their values through this initialiser)
strings: "use strict", "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "ANTHROPIC_DEFAULT_OPUS_MODEL", "ANTHROPIC_DEFAULT_SONNET_MODEL", "ANTHROPIC_DEFAULT_HAIKU_MODEL", "API_TIMEOUT_MS", "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "CLAUDE_CODE_EXECUTABLE", "ALADUO_DAEMON_TOKEN"
shares xW: also used by writeHostClaudeCodeExecutableEnvConfig
shares fA: also used by readHostDaemonToken, writeHostDaemonToken

```js
IW = A(() => {
    "use strict";
    EW = ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "ANTHROPIC_DEFAULT_OPUS_MODEL", "ANTHROPIC_DEFAULT_SONNET_MODEL", "ANTHROPIC_DEFAULT_HAIKU_MODEL", "API
    fA = "ALADUO_DAEMON_TOKEN"
})
```

## lp (function, line 71096)

spell: camelCase (a class: PascalCase); suggested subsystem: 06-runtime-claude
used by: createClaudeStreamingSessionFactory [06-runtime-claude], createModelCommandResolvers [03-session-actor], runDrainTurnWithResumeFallback [05-drain-turn]
strings: "profiled-external", "native-claude", "explicit-1m"

```js
function lp(e) {
    let t = Ogt(e.hostMaxContextTokens),
        n = e.requirement;
    return n?.kind === "profiled-external" ? String(n.requiredMaxContextTokens) : n?.kind === "native-claude" || n?.kind === "explicit-1m" ? e.liveGenerationToken === void 0 ? t : 
}
```

## zue (function, line 33460)

spell: camelCase (a class: PascalCase); suggested subsystem: 01-spine-wal
used by: readEventAtIndexedOffset [01-spine-wal], scanPartitionsForEventId [01-spine-wal]

```js
async function zue(e, t) {
    try {
        let n = jU(e);
        for await (let r of ws(n)) {
            if (!r) continue;
            let i = MU(r);
            if (i?.id === t) return i
        }
    } catch {
        return null
    }
    return null
}
```

## fq (function, line 36652)

spell: camelCase (a class: PascalCase); suggested subsystem: 10-runtime-host
used by: parseChannelConfigFields [10-runtime-host], parseJobFileFrontmatter [08-cadence-subconscious]
shares mf: also used by listFrontmatterKeyAliases, parseChannelConfigFields

```js
function fq(e) {
    return {
        allowedTools: sq(e, mf.allowedTools),
        disallowedTools: sq(e, mf.disallowedTools),
        additionalDirectories: sq(e, mf.additionalDirectories, {
            expandPaths: !0
        }),
        ...uv(e),
        ...snt(e),
        ...cq(e),
        ...dq(e)
    }
}
```

## Cq (function, line 38142)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: createDaemon [00-daemon-entry], refreshSessionIndexEntry [02-gateway-rpc]

```js
function Cq(e, t, n, r) {
    let i = Unt(t, n, r);
    if (i === null) {
        e.remove(t);
        return
    }
    e.remove(t), e.upsert(i)
}
```

## gv (function, line 38355)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: createDaemon [00-daemon-entry], readGlobalUsageTotals [05-drain-turn]

```js
function gv(e) {
    let t = zI();
    for (let n of e) kfe(t, n);
    return t
}
```

## cC (function, line 56365)

spell: camelCase (a class: PascalCase); suggested subsystem: 06-runtime-claude
used by: createAgentSdkAdapter [06-runtime-claude], createClaudeStreamingSessionFactory [06-runtime-claude]
strings: "object", "content_block_start", "number", "tool_use", "string"

```js
function cC(e) {
    if (!e || typeof e != "object" || e.type !== "content_block_start") return null;
    let n = e.index;
    if (typeof n != "number") return null;
    let r = e.content_block;
    if (!r || typeof r != "object" || r.type !== "tool_use") return null;
    let o = r.id,
        s = r.name;
    return typeof o != "string" || typeof s != "string" ? null : {
        index: n,
        toolUseId: o,
        toolName: s
    }
}
```

## mC (function, line 56461)

spell: camelCase (a class: PascalCase); suggested subsystem: 06-runtime-claude
used by: createAgentSdkAdapter [06-runtime-claude], createClaudeStreamingSessionFactory [06-runtime-claude]
strings: "number", "object"

```js
function mC(e, t, n) {
    if (!(!e || typeof t != "number") && !(!n || typeof n != "object")) return {
        sdk_session_id: e,
        total_cost_usd: t,
        model_usage: n
    }
}
```

## AO (function, line 66542)

spell: camelCase (a class: PascalCase); suggested subsystem: 07-runtime-codex
used by: buildCodexDynamicTools [07-runtime-codex], createAladuoMcpServer [06-runtime-claude]
strings: "foreground", ": return oft(); case ", ": return sft(); case ", ": return _we(); case "

```js
function AO(e) {
    let {
        sessionKey: t,
        sessionContextKind: n
    } = e;
    switch (n ?? (Rwe(t) ? "job" : "foreground")) {
        case "job":
            return oft();
        case "meta":
            return sft();
        case "foreground":
            return _we();
        case "system":
            return aft();
        default:
            return _we()
    }
}
```

## mJ (function, line 72875)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: drainSessionMailbox [03-session-actor], prepareDrainTurnContext [05-drain-turn]
strings: "); i && n.push({ path: i, mime: Xt(r, "

```js
function mJ(e) {
    if (!ao(e)) return;
    let t = e.media;
    if (!Array.isArray(t)) return;
    let n = [];
    for (let r of t) {
        if (!ao(r)) continue;
        let i = Xt(r, "path");
        i && n.push({
            path: i,
            mime: Xt(r, "mime")
        })
    }
    return n.length > 0 ? n : void 0
}
```

## nc (module initialiser, line 32680)

spell: init<Name>Module; suggested subsystem: 00-daemon-entry
used by: createDaemon [00-daemon-entry]
assigns: yR (uninitialised vars the code reads; cite their values through this initialiser)
strings: "use strict"
shares yR: also used by createDaemon
shares wue: also used by resolveRuntimePaths

```js
nc = A(() => {
    "use strict";
    yR = 104, wue = vt.resolve(vt.dirname(z7e(import.meta.url)), "..", "..")
})
```

## Uue (function, line 33474)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: main [00-daemon-entry]
strings: "[spine] ", "), DU) }"
shares not: also used by validateKnownRuntimeValue, runSkipTool, verifyClaudeCodeRuntimeAvailable, renderJobMissionBlock, createAgentSdkAdapter, validateJobScheduleExpression

```js
function Uue(e = process.env) {
    let t = e[Fue];
    if (t === void 0 || t.trim() === "") return DU;
    let n = Number(t);
    return Number.isInteger(n) && n >= 1 ? n : (Y(`[spine] ${Fue}=${JSON.stringify(t)} is not a positive integer; using ${DU}`), DU)
}
```

## yXe (function, line 33566)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: resolveArchivedSessionDir [03-session-actor]
strings: "sessions-archive"

```js
function yXe(e) {
    return ei.join(e.varDir, "sessions-archive")
}
```

## Zu (module initialiser, line 38416)

spell: init<Name>Module; suggested subsystem: 05-drain-turn
used by: detectInProcessBreak [05-drain-turn]
assigns: wfe (uninitialised vars the code reads; cite their values through this initialiser)
strings: "use strict"
shares wfe: also used by detectInProcessBreak

```js
Zu = A(() => {
    "use strict";
    ic();
    Cr();
    wfe = .5
})
```

## Mat (function, line 56666)

spell: camelCase (a class: PascalCase); suggested subsystem: 04-cognition-prompt
used by: renderJobMissionBlock [04-cognition-prompt]
strings: "This job is done when all of the following hold. Verify them before you", "finish, and say which ones you could not satisfy rather than finishing", "silently. Work these do not ask for is out of scope.", "<acceptance>", "</acceptance>"
shares not: also used by validateKnownRuntimeValue, runSkipTool, verifyClaudeCodeRuntimeAvailable, renderJobMissionBlock, createAgentSdkAdapter, validateJobScheduleExpression

```js
function Mat(e) {
    let t = e?.trim();
    if (t) return ["This job is done when all of the following hold. Verify them before you", "finish, and say which ones you could not satisfy rather than finishing", "silently. W
`)
}
```

## dve (function, line 62626)

spell: camelCase (a class: PascalCase); suggested subsystem: 08-cadence-subconscious
used by: scanAndSpawnDueJobs [08-cadence-subconscious]
strings: "string", " || e.startsWith(", ")) && t === null) return !1 } } let o = typeof r == ", " && r.length > 0 ? new Date(r).getTime() : Number.NaN, s = Number.isFinite(o); if (e === ", " || e === ", ") return t !== null ? !1 : s ? n.getTime() >= o : !0; if (e.startsWith(", "@every "
shares Xw: also used by validateJobScheduleExpression

```js
function dve(e, t, n = new Date, r, i) {
    if (typeof i == "string" && i.length > 0) {
        let a = new Date(i).getTime();
        if (Number.isFinite(a)) {
            if (n.getTime() >= a) return !0;
            if ((e === "once" || e.startsWith("@in ")) && t === null) return !1
        }
    }
    let o = typeof r == "string" && r.length > 0 ? new Date(r).getTime() : Number.NaN,
        s = Number.isFinite(o);
    if (e === "once" || e === "keepalive") return t !== null ? !1 : s ? n.getTime() >= o : !0;
    if (e.startsWith("@in ")) {
        let a = e.substring(4).trim();
        try {
            let u = Qw(a);
            return t !== null ? !1 : s ? n.getTime() - o >= u : !0
        } catch {
            return !1
        }
    }
    if (e.startsWith("@every ")) {
        let a = e.substring(7).trim();
        try {
            let u = Qw(a);
            if (!t) return s ? n.getTime() >= o : !0;
            let l = new Date(t).getTime();
            return n.getTime() - l >= u
        } catch {
            return !1
        }
    }
    try {
        if (!t) return s ? Xw.CronExpressionParser.parse(e, {
            currentDate: new Date(o),
            tz: "UTC"
        }).next().toDate().getTime() <= n.getTime() : (Xw.CronExpressionParser.parse(e, {
            currentDate: n,
            tz: "UTC"
        }), !0);
        let u = Xw.CronExpressionParser.parse(e, {
… (49 lines)
```

## Dve (function, line 64125)

spell: camelCase (a class: PascalCase); suggested subsystem: 07-runtime-codex
used by: createCodexAppServerAdapter [07-runtime-codex]
strings: "commandExecution", "tool_use", ", input: { command: e.command } }; case ", ": return { type: ", ", toolUseId: n, toolName: ", ", input: { files: e.changes?.map(r => r.path) } }; case ", ", toolUseId: n, toolName: `mcp__${e.server}__${e.tool}`, input: {} }; case ", ", toolUseId: n, toolName: e.tool ?? ", ", input: {} }; case ", ", input: { text: e.text } }; case ", ": { let r = typeof e.tool == ", " ? e.tool : "

```js
function Dve(e) {
    let t = e.type,
        n = e.id;
    switch (t) {
        case "commandExecution":
            return {
                type: "tool_use", toolUseId: n, toolName: "Bash", input: {
                    command: e.command
                }
            };
        case "fileChange":
            return {
                type: "tool_use", toolUseId: n, toolName: "Write", input: {
                    files: e.changes?.map(r => r.path)
                }
            };
        case "mcpToolCall":
            return {
                type: "tool_use", toolUseId: n, toolName: `mcp__${e.server}__${e.tool}`, input: {}
            };
        case "dynamicToolCall":
            return {
                type: "tool_use", toolUseId: n, toolName: e.tool ?? "unknown", input: {}
            };
        case "webSearch":
            return {
                type: "tool_use", toolUseId: n, toolName: "WebSearch", input: {
                    query: e.query,
                    action: e.action ?? null
                }
            };
        case "plan":
            return {
                type: "tool_use", toolUseId: n, toolName: "Plan", input: {
                    text: e.text
                }
            };
        case "collabAgentToolCall": {
            let r = typeof e.tool == "string" ? e.tool : "unknown";
            return {
… (110 lines)
```

## Mve (function, line 64236)

spell: camelCase (a class: PascalCase); suggested subsystem: 07-runtime-codex
used by: createCodexAppServerAdapter [07-runtime-codex]
strings: "commandExecution", "tool_result", ", isError: e.exitCode !== 0, summary: `exit=${e.exitCode}` }; case ", ": return { type: ", ", toolUseId: n, toolName: ", ", isError: !1, summary: `files=${JSON.stringify(e.changes?.map(r=>r.path))}` }; case ", ", toolUseId: n, toolName: `mcp__${e.server}__${e.tool}`, isError: e.status === ", ", summary: `status=${e.status}` }; case ", ", toolUseId: n, toolName: e.tool ?? ", ", isError: e.status === ", ", isError: !1, summary: Wct(e.action, e.query ?? ", ") }; case "

```js
function Mve(e) {
    let t = e.type,
        n = e.id;
    switch (t) {
        case "commandExecution":
            return {
                type: "tool_result", toolUseId: n, toolName: "Bash", isError: e.exitCode !== 0, summary: `exit=${e.exitCode}`
            };
        case "fileChange":
            return {
                type: "tool_result", toolUseId: n, toolName: "Write", isError: !1, summary: `files=${JSON.stringify(e.changes?.map(r=>r.path))}`
            };
        case "mcpToolCall":
            return {
                type: "tool_result", toolUseId: n, toolName: `mcp__${e.server}__${e.tool}`, isError: e.status === "failed", summary: `status=${e.status}`
            };
        case "dynamicToolCall":
            return {
                type: "tool_result", toolUseId: n, toolName: e.tool ?? "unknown", isError: e.status === "failed", summary: `status=${e.status}`
            };
        case "webSearch":
            return {
                type: "tool_result", toolUseId: n, toolName: "WebSearch", isError: !1, summary: Wct(e.action, e.query ?? "")
            };
        case "plan":
            return {
                type: "tool_result", toolUseId: n, toolName: "Plan", isError: !1, summary: String(e.text ?? "")
            };
        case "collabAgentToolCall": {
            let r = typeof e.tool == "string" ? e.tool : "unknown";
            return {
                type: "tool_result",
                toolUseId: n,
                toolName: `CollabAgent${Ave(r)}`,
                isError: e.status === "failed",
                summary: `status=${e.status} receivers=${JSON.stringify(e.receiverThreadIds??[])}`
            }
        }
        case "imageView":
            return {
… (73 lines)
```

## aS (function, line 64584)

spell: camelCase (a class: PascalCase); suggested subsystem: 11-runtime-grok
used by: createGrokAcpAdapter [11-runtime-grok]

```js
function aS(e) {
    let t = e.replace(/^_?x\.ai\//, "");
    return `${zve}/${t}`
}
```

## Wve (function, line 64636)

spell: camelCase (a class: PascalCase); suggested subsystem: 11-runtime-grok
used by: isGrokSkipToolCall [11-runtime-grok]
strings: "x.ai/tool", "string"

```js
function Wve(e) {
    let t = ji(e._meta);
    return [ji(t["x.ai/tool"]).name, e.name, e.toolName, e.title, e.kind].filter(i => typeof i == "string" && i.length > 0)
}
```

## VSe (function, line 67781)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: createMetaSession [03-session-actor]
strings: "[playlist] all partitions are disabled, meta-session will idle", "Edit partition CLAUDE.md files to set 'enabled: true' in frontmatter, or add new partitions", "# Subconscious Playlist ## Current Round ## History ", " } let i = r.split(", "), o = i.findIndex(s => s.trim() === \"## Current Round\"); if (o === -1) { let s = n.map(a => ", "- [ ] ", "); i.push(\"## Current Round\", ...s) } else { let s = i.length; for (let u = o + 1; u < i.len", ") && i[u].trim() !== ", "); i.splice(o + 1, s - o - 1, ...a, \"\") } return await Dt(e.subconsciousPlaylistPath, ", ").replace(/\\s+", ")} `), xe("
shares are: also used by renderJobMissionBlock, parseJobRearmTime, buildDeveloperInstructions, renderJobExtraToolsDescription, runManageJobTool, renderNotifyRefusalMessage
shares to: also used by resolveRuntimePaths, mergeInboxIntoMailbox, verifyClaudeCodeRuntimeAvailable, renderJobMissionBlock, createAgentSdkAdapter, assertScheduleDurationRepresentable

```js
async function VSe(e) {
    let t = await CS(e),
        n = t.filter(s => s.schedule.enabled);
    if (n.length === 0 && t.length > 0) {
        let s = t.map(a => a.name);
        Y("[playlist] all partitions are disabled, meta-session will idle", {
            totalPartitions: t.length,
            disabledPartitions: s,
            recoveryHint: "Edit partition CLAUDE.md files to set 'enabled: true' in frontmatter, or add new partitions"
        })
    }
    let r;
    try {
        r = await ll.readFile(e.subconsciousPlaylistPath, "utf8")
    } catch {
        r = `# Subconscious Playlist

## Current Round

## History
`
    }
    let i = r.split(`
`),
        o = i.findIndex(s => s.trim() === "## Current Round");
    if (o === -1) {
        let s = n.map(a => `- [ ] ${a.name}`);
        i.push("## Current Round", ...s)
    } else {
        let s = i.length;
        for (let u = o + 1; u < i.length; u++)
            if (i[u].trim().startsWith("## ") && i[u].trim() !== "## Current Round") {
                s = u;
                break
            } let a = n.map(u => `- [ ] ${u.name}`);
        i.splice(o + 1, s - o - 1, ...a, "")
    }
    return await Dt(e.subconsciousPlaylistPath, `${i.join(`
`).replace(/\s+$/,"")}
`), xe("[playlist] rebuilt round", {
… (44 lines)
```

## Lpt (function, line 68468)

spell: camelCase (a class: PascalCase); suggested subsystem: 09-memory
used by: runNodeLint [09-memory]
strings: "[node-converge] [[", "node: topics/", "]; if (e.lines > Q6 && n.push(", "lines: ", "), e.unexpectedSectionCount > 0) { n.push(", "unexpected-sections: ", "); for (let r of e.unexpectedSections) n.push(", " - ## ", ") } return n.push(", "reachable: ", "}`), e.escalated && n.push(", "action: revisit per your Node Format + Revisit discipline — converge to the bounded callable rule (## Condition / ## Pro"
shares Q6: also used by runNodeLint
shares to: also used by resolveRuntimePaths, mergeInboxIntoMailbox, verifyClaudeCodeRuntimeAvailable, renderJobMissionBlock, createAgentSdkAdapter, assertScheduleDurationRepresentable

```js
function Lpt(e) {
    let t = eA(e),
        n = [`[node-converge] [[${t}]]`, `node: topics/${t}.md`];
    if (e.lines > Q6 && n.push(`lines: ${e.lines} (over ${Q6})`), e.unexpectedSectionCount > 0) {
        n.push(`unexpected-sections: ${e.unexpectedSectionCount}`);
        for (let r of e.unexpectedSections) n.push(`  - ## ${r}`)
    }
    return n.push(`reachable: ${e.reachable?"yes":"no"}`), e.escalated && n.push("escalated: WASTED-COMPUTE — walked-off AND board-unreachable; consider whether this node should ex
`) + `
`
}
```

## eA (function, line 68529)

spell: camelCase (a class: PascalCase); suggested subsystem: 09-memory
used by: runNodeLint [09-memory]

```js
function eA(e) {
    return `${e.type}-${e.slug}`
}
```

## vke (function, line 69065)

spell: camelCase (a class: PascalCase); suggested subsystem: 09-memory
used by: deliverScanGapSignal [09-memory]
strings: "memory", ", \"utf8\") }"
shares Rke: also used by readOrSeedGapHandedDays

```js
function vke(e, t) {
    let n = Wc.join(e, "memory");
    du.mkdirSync(n, {
        recursive: !0
    }), du.appendFileSync(Wc.join(n, Rke), `${cke(t)}
`, "utf8")
}
```

## cmt (function, line 69166)

spell: camelCase (a class: PascalCase); suggested subsystem: 09-memory
used by: deliverScanGapSignal [09-memory]
strings: "), a = bke(t, o), u = rmt(a); if (u < ya && i.dates.includes(o)) { let d = wke(Wc.join(e, ", ")); if (d.readFault) return uA(null); let f = -1; for (let p of d.events) p.interaction && p.msO", ")); return c.readFault ? uA(l) : uW(l, kke(Ske(c.events, l))) }"

```js
function cmt(e, t, n, r) {
    let i = tmt(e);
    if (i.readFault) return uA(null);
    let o = new Date(n).toISOString().slice(0, 10),
        s = Date.parse(`${o}T00:00:00.000Z`),
        a = bke(t, o),
        u = rmt(a);
    if (u < ya && i.dates.includes(o)) {
        let d = wke(Wc.join(e, `${o}.jsonl`));
        if (d.readFault) return uA(null);
        let f = -1;
        for (let p of d.events) p.interaction && p.msOfDay > u && p.msOfDay > f && (f = p.msOfDay);
        if (f >= 0 && n - (s + f) >= r) {
            let p = {
                date: o,
                startMs: u,
                endMs: f
            };
            return uW(p, kke(Ske(d.events, p)))
        }
    }
    let l = null;
    for (let d = i.dates.length - 1; d >= 0; d -= 1) {
        let f = i.dates[d];
        if (f >= o) continue;
        let p = imt(f, bke(t, f));
        if (p.length > 0) {
            l = p[p.length - 1];
            break
        }
    }
    if (l === null) return uW(null, []);
    let c = wke(Wc.join(e, `${l.date}.jsonl`));
    return c.readFault ? uA(l) : uW(l, kke(Ske(c.events, l)))
}
```

## Igt (function, line 70980)

spell: camelCase (a class: PascalCase); suggested subsystem: 10-runtime-host
used by: initializeRuntime [10-runtime-host]
strings: "DUODUO.md"

```js
async function Igt(e) {
    let t = cr.join(e.bootstrapDir, "var");
    if (!await zs(t)) return;
    async function n(r, i) {
        let o = await lr.readdir(r, {
            withFileTypes: !0
        });
        for (let s of o) {
            let a = cr.join(r, s.name),
                u = cr.join(i, s.name);
            s.isDirectory() ? await n(a, u) : s.isFile() && s.name === "DUODUO.md" && (await Ne(i), await lr.copyFile(a, u))
        }
    }
    await n(t, e.varDir)
}
```

## mEe (module initialiser, line 71066)

spell: init<Name>Module; suggested subsystem: 00-daemon-entry
used by: main [00-daemon-entry]
strings: "use strict", "# Subconscious Playlist ## Current Round ## History ", ", xgt = \"\"; Rgt = new Set([\"memory\", \"config\"]), HW = new Set([\"var\", \"roles\"]), WW = new Set([\"meta-prompt.md\", \"da"
shares kgt: also used by initializeRuntime
shares xgt: also used by initializeRuntime
shares Rgt: also used by copyBootstrapIntoKernel
shares HW: also used by copyBootstrapIntoKernel
shares WW: also used by copyBootstrapIntoKernel

```js
mEe = A(() => {
    "use strict";
    Cr();
    UW();
    Ym();
    mt();
    Zxe();
    eEe();
    iEe();
    kgt = `# Subconscious Playlist

## Current Round

## History
`, xgt = "";
    Rgt = new Set(["memory", "config"]), HW = new Set(["var", "roles"]), WW = new Set(["meta-prompt.md", "dashboard.html"])
})
```

## ryt (function, line 73162)

spell: camelCase (a class: PascalCase); suggested subsystem: 04-cognition-prompt
used by: buildTransientUserBlocks [04-cognition-prompt]
strings: "<time-context last_interaction=\"", " current_time=", "Approximately ", "], s = NA(e.currentEventAt); return s && o.push(", "Daemon wall-clock time: ", "), o.push(\"</time-context>\"), o.join("

```js
function ryt(e) {
    if (!e) return;
    let t = new Date(e.lastEventAt).getTime(),
        n = new Date(e.currentEventAt).getTime();
    if (!Number.isFinite(t) || !Number.isFinite(n)) return;
    let r = n - t;
    if (r < e.thresholdMs) return;
    let i = a0e(r),
        o = [`<time-context last_interaction="${jt(e.lastEventAt)}" current_time="${jt(e.currentEventAt)}">`, `Approximately ${i} have elapsed since your last interaction in this s
        s = NA(e.currentEventAt);
    return s && o.push(`Daemon wall-clock time: ${s}.`), o.push("</time-context>"), o.join(`
`)
}
```

## gyt (function, line 73431)

spell: camelCase (a class: PascalCase); suggested subsystem: 05-drain-turn
used by: hasUniformDrainCoalesceKey [05-drain-turn]

```js
function gyt(e, t, n) {
    let {
        primaryTargetSessionKey: r,
        fanoutTargets: i
    } = g0e(e, t, n);
    return `${r}|${i.join(",")}|${yyt(t)}`
}
```

## Cy (function, line 81618)

spell: camelCase (a class: PascalCase); suggested subsystem: 07-runtime-codex
used by: buildCodexDynamicTools [07-runtime-codex]
strings: "string", "object"

```js
function Cy(e) {
    let t = {},
        n = [];
    for (let [r, i] of Object.entries(e)) {
        let o = i,
            s = o.description ?? o.unwrap?.()?.description;
        o.safeParse?.(void 0)?.success === !0 || n.push(r), t[r] = {
            type: "string",
            ...s ? {
                description: s
            } : {}
        }
    }
    return {
        type: "object",
        properties: t,
        required: n
    }
}
```

## RIe (function, line 81811)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: createJobSessionFinalizer [03-session-actor]
strings: " || e.startsWith("

```js
function RIe(e) {
    return e === "once" || e.startsWith("@in ")
}
```

## UG (module initialiser, line 81847)

spell: init<Name>Module; suggested subsystem: 03-session-actor
used by: runInstructionsFingerprintGuard [03-session-actor]
assigns: Oy (uninitialised vars the code reads; cite their values through this initialiser)
strings: "use strict"
shares Oy: also used by runInstructionsFingerprintGuard

```js
UG = A(() => {
    "use strict";
    Oy = 2
})
```

## sTe (function, line 84143)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: createSessionManager [03-session-actor]
strings: "channel", " && n.session_key === e ? ", "member"

```js
function sTe(e, t) {
    if (Nt(e) !== "channel") return;
    let n = t(),
        r = n.state === "held" && n.session_key === e ? "main" : "member";
    return qV(r)
}
```

## STe (module initialiser, line 88038)

spell: init<Name>Module; suggested subsystem: 00-daemon-entry
used by: main [00-daemon-entry]
strings: "use strict", "gradient-distiller", "intuition-weaver"
shares Vwt: also used by detectEmptyRequiredPartitionOutput

```js
STe = A(() => {
    "use strict";
    To();
    rp();
    Vg();
    vJ();
    SJ();
    xC();
    zu();
    Ym();
    jo();
    DS();
    LG();
    FG();
    eJ();
    Xa();
    ul();
    mt();
    dI();
    Zu();
    JO();
    nc();
    GO();
    Vwt = new Set(["gradient-distiller", "intuition-weaver"])
})
```

## Ofe (function, line 88768)

spell: camelCase (a class: PascalCase); suggested subsystem: 02-gateway-rpc
used by: parseGatewayCommandText [02-gateway-rpc]
strings: "/status", "/config", "/debug", "#debug", "/cancel", "/clear", "/reset", "/stats", ") return ", "; if (e === "

```js
function Ofe(e) {
    if (e === "/status") return "/status";
    if (e === "/config") return "/config";
    if (e === "/debug" || e === "#debug") return "/debug";
    if (e === "/cancel") return "/cancel";
    if (e === "/clear" || e === "/reset") return "/clear";
    if (e === "/stats") return "/stats";
    if (e === "/task") return "/task";
    if (e === "/compact") return "/compact";
    if (e === "/model") return "/model";
    if (e === "/effort") return "/effort"
}
```

## Knt (function, line 89060)

spell: camelCase (a class: PascalCase); suggested subsystem: 02-gateway-rpc
used by: appendBeforeExecuteGateway [02-gateway-rpc]
strings: "gateway:offline", "gateway_command", ") ? o.split(", "agent.result", "gateway", "session.output", "spine.event"

```js
async function Knt(e, t, n, r) {
    let i = Znt(t);
    if (!i) return {
        handled: !1
    };
    let o = t.session_key ?? "gateway:offline",
        s = await ert(e, i, o, r, {
            sourceKind: t.source.kind,
            sourceChannelId: t.source.channel_id
        });
    s.noticeSummary && await Ye(e, o, {
        pending_gateway_notice: {
            source: "gateway_command",
            command: i.raw,
            command_name: i.name,
            result_summary: s.noticeSummary,
            created_at: new Date().toISOString()
        }
    });
    let a = o.includes(":") ? o.split(":")[0] : t.source.kind,
        u = Ga({
            channel_kind: a,
            session_key: o,
            in_reply_to_event_id: t.id,
            payload: {
                text: s.responseText,
                data: {
                    ...s.data ?? {},
                    gateway_command: i.name
                }
            }
        });
    await Ka(e, u);
    let l = nn({
        type: "agent.result",
        source: {
            kind: "gateway",
            name: "gateway"
        },
        session_key: o,
… (56 lines)
```

## spt (function, line 90711)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: getCachedHostBootId [00-daemon-entry]
strings: "/proc/sys/kernel/random/boot_id", ").trim(); if (n) return `${e}:${n}` } catch {} try { let r = tpt(", "kern.boottime", ", stdio: [", "ignore", " } catch {} let t = Math.floor((Date.now() - LSe.uptime() * 1e3) / 6e4); return "

```js
function spt() {
    let e = LSe.hostname();
    try {
        let n = rpt("/proc/sys/kernel/random/boot_id", "utf8").trim();
        if (n) return `${e}:${n}`
    } catch {}
    try {
        let r = tpt("sysctl", ["-n", "kern.boottime"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"]
        }).trim().match(/sec = (\d+)/);
        if (r?.[1]) return `${e}:${r[1]}`
    } catch {}
    let t = Math.floor((Date.now() - LSe.uptime() * 1e3) / 6e4);
    return `${e}:fallback-${t}`
}
```

## NSt (function, line 92795)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: createDaemon [00-daemon-entry]
strings: "ambiguous", "not_found", "channel", "forbidden_kind", "void_session", " }; if (er(s.session_key)) return { ok: !1, reason: \"archiving\", target: o, sess", ", sourceName: i.source?.trim() || ", ", command: ", " }, { bus: t, gatewayCommands: r }); return u.routing.enqueued ? (t.emit(", ", { sessionKey: s.session_key, preempt: mK(", "delivery_failed", "command was not enqueued (gateway did not route /compact to the session mailbox)"
shares ok: also used by validateKnownRuntimeValue, validateRunnableRuntimeValue, resolveLayeredChannelRuntime, loadChannelKindConfig, probeClaudeAvailability, checkCodexAvailability
shares Gu: also used by createModelCommandResolvers, createSessionManager, appendBeforeExecuteGateway, scheduleSessionWakeRecord
shares to: also used by resolveRuntimePaths, mergeInboxIntoMailbox, verifyClaudeCodeRuntimeAvailable, renderJobMissionBlock, createAgentSdkAdapter, assertScheduleDurationRepresentable
shares not: also used by validateKnownRuntimeValue, runSkipTool, verifyClaudeCodeRuntimeAvailable, renderJobMissionBlock, createAgentSdkAdapter, validateJobScheduleExpression

```js
async function NSt(e, t, n, r, i) {
    let o = i.target.trim(),
        s = bp(n, o);
    if (!s.ok) return s.reason === "ambiguous" ? {
        ok: !1,
        reason: "ambiguous",
        target: o,
        candidates: s.candidates
    } : {
        ok: !1,
        reason: "not_found",
        target: o
    };
    let a = Nt(s.session_key);
    if (a !== "channel") return {
        ok: !1,
        reason: "forbidden_kind",
        target: o,
        session_key: s.session_key,
        kind: a
    };
    if (await Ku(e, s.session_key)) return {
        ok: !1,
        reason: "void_session",
        target: o,
        session_key: s.session_key,
        error: `${Gu} It has no context to compact; nothing was queued.`
    };
    if (er(s.session_key)) return {
        ok: !1,
        reason: "archiving",
        target: o,
        session_key: s.session_key
    };
    let u = await bv(e, {
        sessionKey: s.session_key,
        sourceKind: "rpc",
        sourceName: i.source?.trim() || "session.compact",
        command: "/compact"
    }, {
… (60 lines)
```

## vU (module initialiser, line 32732)

spell: init<Name>Module; suggested subsystem: 02-gateway-rpc
used by: initProtocolSystemModule [02-gateway-rpc]
strings: "use strict", "medium"
shares Gi: also used by isEffortLevel, parseJobFileFrontmatter, runManageJobTool, executeGatewayCommand, validateConfigValue

```js
vU = A(() => {
    "use strict";
    Gi = ["low", "medium", "high", "xhigh", "max"]
})
```

## jo (module initialiser, line 33522)

spell: init<Name>Module; suggested subsystem: 05-drain-turn
used by: initMailboxDrainRunnerModule [05-drain-turn]
strings: "use strict", "ALADUO_SPINE_INDEX_RETENTION_DAYS"
shares Lue: also used by enqueuePartitionAppend
shares sXe: also used by scanPartitionsForEventId
shares QR: also used by appendEventIdIndexEntry, lookupEventIdIndexEntry, getOrCreateEventIdIndexCache

```js
jo = A(() => {
    "use strict";
    ic();
    YR();
    Cr();
    Xn();
    mt();
    Lue = new Map;
    sXe = /^\d{4}-\d{2}-\d{2}\.jsonl$/;
    QR = new Map;
    DU = 7, Fue = "ALADUO_SPINE_INDEX_RETENTION_DAYS"
})
```

## nTe (module initialiser, line 83930)

spell: init<Name>Module; suggested subsystem: 03-session-actor
used by: initInstructionsFingerprintModule [03-session-actor]
strings: "use strict", ".scala", ".swift", ".config", ".properties", ".graphql", ".proto", ".svelte", ".astro", ".cmake", ".makefile", ".gradle"
shares XIe: also used by stripBoardIncludeFrontmatter
shares ywt: also used by resolveBoardIncludes
shares _wt: also used by resolveBoardIncludes
shares ts: also used by createSpineEvent, appendSessionMailboxNote, logLatencyStageTelemetry, recordTelemetryMetric, appendBeforeExecuteGateway, stripSpineEventToEnvelope
shares KIe: also used by collectBoardIncludePaths
shares QIe: also used by stripBoardHtmlComments, collectBoardIncludePaths

```js
nTe = A(() => {
    "use strict";
    XIe = Zn(xs(), 1);
    ni();
    GIe();
    ywt = 5, _wt = new Set([".md", ".txt", ".text", ".json", ".yaml", ".yml", ".toml", ".xml", ".csv", ".html", ".htm", ".css", ".scss", ".sass", ".less", ".js", ".ts", ".tsx", ".j
})
```
