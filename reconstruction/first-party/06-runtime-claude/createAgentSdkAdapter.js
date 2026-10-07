// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAgentSdkAdapter  (minified: Lf, daemon.pretty.js:55529)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.6.0, v0.6.2, v0.7.0, v0.8.0, v0.8.1, v0.8.4 (maps/history_daemon.json)
// changelog v0.8.4 (high): **Claude Code's own auto memory is off** in every Claude session duoduo starts, because it would keep a second memory store beside duoduo's.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAgentSdkAdapter() {
    let e = (t, n) => {
        let r = {},
            i = !!process.env.ALADUO_SDK_DEBUG;
        i && (r.debug = !0, r.stderr = u => {
            logAlwaysAtLevel("debug", "[claude-sdk stderr]", u)
        }), t.sessionId && (r.resume = t.sessionId), t.abortController && (r.abortController = t.abortController), t.cwd && (r.cwd = t.cwd), t.settingSources && (r.settingSources = t.settingSources), t.persistSession !== void 0 && (r.persistSession = t.persistSession), "outputFormat" in t && t.outputFormat && (r.outputFormat = t.outputFormat), "model" in t && t.model && (r.model = t.model), "effort" in t && t.effort && (r.effort = t.effort);
        let o = t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions";
        if (o && (r.permissionMode = o), t.systemPrompt !== void 0) r.systemPrompt = t.systemPrompt;
        else {
            let u = normalizeOptionalEnvString(process.env.SYSTEM_PROMPT),
                l = normalizeOptionalEnvString(process.env.APPEND_SYSTEM_PROMPT),
                f = [resolveMetaPromptText(), l].filter(p => !!p).join(`

`).trim();
            u && f ? r.systemPrompt = `${u}

${f}` : u ? r.systemPrompt = u : f && (r.systemPrompt = {
                type: "preset",
                preset: "claude_code",
                append: f
            })
        }
        if (r.systemPrompt !== void 0 && (r.systemPrompt = disableSystemPromptSnapshot(r.systemPrompt)), t.allowedTools !== void 0 && (r.allowedTools = t.allowedTools), t.tools !== void 0) {
            let u = [...new Set(t.tools)];
            if (r.tools = u, logAlwaysAtLevel("info", `[claude-sdk] built-in tool surface (${u.length}): ${u.join(",")}`), t.allowedTools?.length) {
                let l = findDeadAllowedToolEntries(t.allowedTools, u);
                l.length > 0 && logWarnMessage(`[claude-sdk] allowedTools no longer adds built-in tools to the surface (allowlist-only via claude.tools); not on this session's surface: ${l.join(",")} — move them to the descriptor's claude: { tools: [...] } if you meant to enable them`)
            }
        }
        if (t.disallowedTools !== void 0) {
            let {
                mcpTools: u,
                builtIns: l
            } = splitDisallowedToolsForClaude(t.disallowedTools);
            l.length > 0 && logWarnMessage(`[claude-sdk] disallowedTools no longer governs built-in tools (allowlist-only via claude.tools); ignoring: ${l.join(",")}`), u.length > 0 && (r.disallowedTools = u)
        }
        t.mcpServers && (r.mcpServers = t.mcpServers), t.additionalDirectories !== void 0 && (r.additionalDirectories = t.additionalDirectories);
        let s = {
            ...process.env
        };
        delete s.CLAUDECODE, (t.additionalDirectories?.length ?? 0) > 0 && t.autoloadAdditionalDirectoryClaudeMd !== !1 ? s.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1" : t.autoloadAdditionalDirectoryClaudeMd === !1 && delete s.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD, s.CLAUDE_CODE_DISABLE_AUTO_MEMORY = "1", t.callerSession ? s[tl] = t.callerSession : delete s[tl], r.env = s, "claudeSettingsPath" in t && t.claudeSettingsPath && (r.settings = t.claudeSettingsPath);
        let a = process.env.CLAUDE_CODE_EXECUTABLE;
        if (a && a.trim().length > 0 && (r.pathToClaudeCodeExecutable = a), "hooks" in t && t.hooks && (r.hooks = t.hooks), n?.includePartialMessages && (r.includePartialMessages = !0), i) {
            let u = {
                cwd: r.cwd,
                settingSources: r.settingSources,
                persistSession: r.persistSession,
                permissionMode: r.permissionMode,
                allowedTools: r.allowedTools,
                disallowedTools: r.disallowedTools,
                tools: r.tools,
                includePartialMessages: r.includePartialMessages
            };
            logAlwaysAtLevel("debug", "[claude-sdk debug] execPath:", process.execPath), logAlwaysAtLevel("debug", "[claude-sdk debug] PATH:", process.env.PATH), logAlwaysAtLevel("debug", "[claude-sdk debug] options:", JSON.stringify(u))
        }
        return r
    };
    return {
        async run(t) {
            Wge();
            let n = t.sessionId,
                r, i, o = "",
                s = "",
                a = Date.now(),
                u = !1,
                l, c, d = resolveClaudeCostBaseline(t.sessionId, t.costBaseline),
                f, p = !1,
                m = !1,
                h = !1,
                g = !!process.env.ALADUO_SDK_DEBUG,
                y = e(t, {
                    includePartialMessages: !!t.onStream
                });
            {
                let H = y.hooks ?? {},
                    q = H.PreToolUse ?? [];
                q.push({
                    matcher: wc,
                    hooks: [async pe => (pe?.agent_id !== void 0 || (m = !0, p = !0, logInfoMessage("[claude-sdk] Skip detected via PreToolUse hook (non-streaming)")), {
                        continue: !1,
                        stopReason: "The agent intentionally ended this turn silently by calling Skip."
                    })]
                }), H.PreToolUse = q, y.hooks = H
            }
            let v = (H, q, pe = !1) => {
                    if (!(!t.onStream || !H) && !p) {
                        if (u || (u = !0, l = Date.now() - a, logLatencyStageTelemetry("sdk_first_token", t.sessionId ?? "new", {
                                ttftMs: l
                            })), pe) {
                            t.onStream(H, !0);
                            return
                        }
                        if (q) {
                            o += H, s += H, t.onStream(H, !1);
                            return
                        }
                        if (s && H.startsWith(s)) {
                            let fe = H.slice(s.length);
                            fe && (o += fe, s = H, t.onStream(fe, !1));
                            return
                        }
                        if (H.startsWith(o)) {
                            let fe = H.slice(o.length);
                            fe && (o = H, s += fe, t.onStream(fe, !1));
                            return
                        }
                        o += H, s += H, t.onStream(H, !1)
                    }
                },
                b = new Map,
                _ = new Map,
                E = H => {
                    if (t.onExecutionEvent) try {
                        t.onExecutionEvent(H)
                    } catch {}
                },
                R = H => {
                    let q = H.message?.content;
                    if (Array.isArray(q))
                        for (let pe of q) {
                            if (!pe || typeof pe != "object") continue;
                            if (pe.type === "tool_use") {
                                let Se = pe.id,
                                    w = pe.name,
                                    T = pe.input;
                                Se && w && (b.set(Se, w), E({
                                    type: "tool_use",
                                    toolUseId: Se,
                                    toolName: w,
                                    input: T
                                }))
                            }
                        }
                },
                P = parsePositiveMsEnv(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4),
                k = null,
                S = !1,
                D = t.holdInputOpenForBackgroundAgents === !0,
                A = new Set,
                $ = !1,
                C = !D,
                N = () => {},
                x = D ? new Promise(H => {
                    N = H
                }) : Promise.resolve(),
                M = parsePositiveMsEnv(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5),
                F = null,
                J = () => {
                    F && (clearTimeout(F), F = null)
                },
                ce = () => {
                    C || $ && A.size === 0 && (C = !0, J(), N())
                },
                ie = () => {
                    C || (C = !0, J(), N())
                },
                Ce = () => {
                    !D || C || (J(), $ && (F = setTimeout(() => {
                        C || (logAlwaysAtLevel("warn", "[claude-sdk] hold-input idle watchdog fired — SDK went silent with background Agent task(s) still tracked; force-releasing stdin to avoid an unbounded hang. If this was a legitimate long-running task, its continuation's in-process MCP call may fail; investigate.", JSON.stringify({
                            idleTimeoutMs: M,
                            inFlightAgentTaskIds: Array.from(A)
                        })), ie())
                    }, M), typeof F == "object" && F?.unref && F.unref()))
                };
            async function* se() {
                let H = typeof t.prompt == "string" ? stringToMessageGenerator(t.prompt) : t.prompt;
                for await (let q of H) yield q;
                await x
            }
            let j = Vge({
                    prompt: D ? se() : t.prompt,
                    options: y
                }),
                ne = () => {
                    k = setTimeout(() => {
                        S = !0, logDebugMessage("[claude-sdk] abort close timeout reached, closing query"), j.close()
                    }, P)
                };
            t.abortController?.signal.aborted ? ne() : t.abortController?.signal.addEventListener("abort", ne, {
                once: !0
            });
            let K = !1,
                te = () => {
                    if (!K) {
                        K = !0;
                        try {
                            t.onTurnAcknowledged?.()
                        } catch {}
                    }
                };
            try {
                for await (let H of j) {
                    let q = H;
                    if (q.type === "system" && q.subtype === "init" || te(), q.type === "system") {
                        if (q.subtype === "init" && (n = q.session_id ?? n), D && q.subtype === "task_started") {
                            let pe = q,
                                fe = typeof pe.task_type == "string" ? pe.task_type : void 0,
                                w = pe.subagent_type !== void 0 && pe.subagent_type !== null || fe !== void 0 && fe !== "local_bash";
                            typeof pe.task_id == "string" && pe.task_id.length > 0 && w && A.add(pe.task_id)
                        }
                        if (D && q.subtype === "task_notification") {
                            let pe = q;
                            typeof pe.task_id == "string" && A.delete(pe.task_id)
                        }
                        E({
                            type: "system",
                            subtype: q.subtype ?? "unknown",
                            data: q.subtype === "init" ? {
                                session_id: q.session_id
                            } : void 0
                        })
                    }
                    if (q.type === "stream_event") {
                        let pe = hasParentToolUseId(q),
                            fe = extractStreamTextDeltas(q.event);
                        for (let L of fe) v(L.text, L.isDelta, pe);
                        let Se = extractStreamThinkingText(q.event);
                        for (let L of Se) E({
                            type: "thought_chunk",
                            text: L
                        });
                        let w = parseToolUseBlockStart(q.event);
                        w && (_.set(w.index, {
                            toolUseId: w.toolUseId,
                            toolName: w.toolName
                        }), b.set(w.toolUseId, w.toolName), E({
                            type: "tool_use",
                            toolUseId: w.toolUseId,
                            toolName: w.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let T = parseInputJsonDelta(q.event);
                        if (T) {
                            let L = _.get(T.index);
                            L && E({
                                type: "tool_input_delta",
                                toolUseId: L.toolUseId,
                                toolName: L.toolName,
                                partialJson: T.partialJson
                            })
                        }
                    }
                    if (typeof q.type == "string" && q.type.includes("assistant")) {
                        let pe = hasParentToolUseId(q),
                            fe = extractSdkMessageTextChunks(q);
                        for (let Se of fe) v(Se.text, Se.isDelta, pe);
                        R(q)
                    }
                    if (q.type === "user") {
                        let pe = q.message?.content;
                        if (Array.isArray(pe))
                            for (let fe of pe) {
                                if (!fe || typeof fe != "object") continue;
                                if (fe.type === "tool_result") {
                                    let w = fe.tool_use_id,
                                        T = fe.is_error ?? !1,
                                        L = fe.content;
                                    w && (E({
                                        type: "tool_result",
                                        toolUseId: w,
                                        toolName: b.get(w),
                                        isError: T,
                                        summary: stringifyToolResultContent(L)
                                    }), s = "")
                                }
                            }
                    }
                    if (q.type === "result" && q.subtype === "success")
                        if (p) c = mapClaudeResultToDrainUsage(q, d);
                        else {
                            let pe = typeof q.result == "string" ? q.result : "";
                            pe.length > 0 && (r = pe, h = !0), q.structured_output !== void 0 && (i = q.structured_output, h = !0), c = mapClaudeResultToDrainUsage(q, d)
                        } q.type === "result" && (p = !1, f = q), D && q.type === "result" && ($ = !0, ce()), D && !C && Ce()
                }
                if (S) throw createAbortErrorWithCause("SDK run force-closed after abort timeout", new Error("abort close timeout"))
            } catch (H) {
                throw g && logAlwaysAtLevel("error", "[claude-sdk error]", H instanceof Error ? H.stack ?? H.message : String(H)), t.abortController?.signal.aborted && !isAbortLikeError(H) ? createAbortErrorWithCause("SDK run aborted", H) : H
            } finally {
                k && clearTimeout(k), t.abortController?.signal.removeEventListener("abort", ne), ie()
            }
            let B = m && !h;
            return {
                sessionId: n,
                text: B ? void 0 : r ?? (o || void 0),
                structured: B ? void 0 : i,
                usage: c,
                costBaseline: buildClaudeCostBaseline(n, f?.total_cost_usd, f?.modelUsage),
                firstTokenLatencyMs: l,
                skipped: B || void 0
            }
        },
        createStreamingQuery(t) {
            return Wge(), {
                query: Vge({
                    prompt: t.prompt,
                    options: e(t, {
                        includePartialMessages: !0
                    })
                })
            }
        }
    }
}
