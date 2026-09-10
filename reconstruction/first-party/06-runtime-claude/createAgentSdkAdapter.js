// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAgentSdkAdapter  (minified: Gd, daemon.pretty.js:50087)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAgentSdkAdapter() {
    let e = (t, n) => {
        let r = {},
            i = !!process.env.ALADUO_SDK_DEBUG;
        i && (r.debug = !0, r.stderr = l => {
            gt("debug", "[claude-sdk stderr]", l)
        }), t.sessionId && (r.resume = t.sessionId), t.abortController && (r.abortController = t.abortController), t.cwd && (r.cwd = t.cwd), t.settingSources && (r.settingSources = t.settingSources), t.persistSession !== void 0 && (r.persistSession = t.persistSession), "outputFormat" in t && t.outputFormat && (r.outputFormat = t.outputFormat), "model" in t && t.model && (r.model = t.model), "effort" in t && t.effort && (r.effort = t.effort);
        let o = t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions";
        if (o && (r.permissionMode = o), t.systemPrompt !== void 0) r.systemPrompt = t.systemPrompt;
        else {
            let l = Ab(process.env.SYSTEM_PROMPT),
                u = Ab(process.env.APPEND_SYSTEM_PROMPT),
                p = [resolveMetaPromptText(), u].filter(f => !!f).join(`

`).trim();
            l && p ? r.systemPrompt = `${l}

${p}` : l ? r.systemPrompt = l : p && (r.systemPrompt = {
                type: "preset",
                preset: "claude_code",
                append: p
            })
        }
        if (r.systemPrompt !== void 0 && (r.systemPrompt = y7e(r.systemPrompt)), t.allowedTools !== void 0 && (r.allowedTools = t.allowedTools), t.tools !== void 0) {
            let l = [...new Set(t.tools)];
            if (r.tools = l, gt("info", `[claude-sdk] built-in tool surface (${l.length}): ${l.join(",")}`), t.allowedTools?.length) {
                let u = findDeadAllowedToolEntries(t.allowedTools, l);
                u.length > 0 && W(`[claude-sdk] allowedTools no longer adds built-in tools to the surface (allowlist-only via claude.tools); not on this session's surface: ${u.join(",")} — move them to the descriptor's claude: { tools: [...] } if you meant to enable them`)
            }
        }
        if (t.disallowedTools !== void 0) {
            let {
                mcpTools: l,
                builtIns: u
            } = splitDisallowedToolsForClaude(t.disallowedTools);
            u.length > 0 && W(`[claude-sdk] disallowedTools no longer governs built-in tools (allowlist-only via claude.tools); ignoring: ${u.join(",")}`), l.length > 0 && (r.disallowedTools = l)
        }
        t.mcpServers && (r.mcpServers = t.mcpServers), t.additionalDirectories !== void 0 && (r.additionalDirectories = t.additionalDirectories);
        let s = {
            ...process.env
        };
        delete s.CLAUDECODE, (t.additionalDirectories?.length ?? 0) > 0 && t.autoloadAdditionalDirectoryClaudeMd !== !1 ? s.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1" : t.autoloadAdditionalDirectoryClaudeMd === !1 && delete s.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD, r.env = s, "claudeSettingsPath" in t && t.claudeSettingsPath && (r.settings = t.claudeSettingsPath);
        let a = process.env.CLAUDE_CODE_EXECUTABLE;
        if (a && a.trim().length > 0 && (r.pathToClaudeCodeExecutable = a), "hooks" in t && t.hooks && (r.hooks = t.hooks), n?.includePartialMessages && (r.includePartialMessages = !0), i) {
            let l = {
                cwd: r.cwd,
                settingSources: r.settingSources,
                persistSession: r.persistSession,
                permissionMode: r.permissionMode,
                allowedTools: r.allowedTools,
                disallowedTools: r.disallowedTools,
                tools: r.tools,
                includePartialMessages: r.includePartialMessages
            };
            gt("debug", "[claude-sdk debug] execPath:", process.execPath), gt("debug", "[claude-sdk debug] PATH:", process.env.PATH), gt("debug", "[claude-sdk debug] options:", JSON.stringify(l))
        }
        return r
    };
    return {
        async run(t) {
            Pde();
            let n = t.sessionId,
                r, i, o = "",
                s = "",
                a = Date.now(),
                l = !1,
                u, c, d = !1,
                p = !1,
                f = !1,
                m = !!process.env.ALADUO_SDK_DEBUG,
                h = e(t, {
                    includePartialMessages: !!t.onStream
                });
            {
                let L = h.hooks ?? {},
                    M = L.PreToolUse ?? [];
                M.push({
                    matcher: Uu,
                    hooks: [async U => (U?.agent_id !== void 0 || (p = !0, d = !0, ee("[claude-sdk] Skip detected via PreToolUse hook (non-streaming)")), {
                        continue: !1,
                        stopReason: "The agent intentionally ended this turn silently by calling Skip."
                    })]
                }), L.PreToolUse = M, h.hooks = L
            }
            let g = (L, M, U = !1) => {
                    if (!(!t.onStream || !L) && !d) {
                        if (l || (l = !0, u = Date.now() - a, eo("sdk_first_token", t.sessionId ?? "new", {
                                ttftMs: u
                            })), U) {
                            t.onStream(L, !0);
                            return
                        }
                        if (M) {
                            o += L, s += L, t.onStream(L, !1);
                            return
                        }
                        if (s && L.startsWith(s)) {
                            let G = L.slice(s.length);
                            G && (o += G, s = L, t.onStream(G, !1));
                            return
                        }
                        if (L.startsWith(o)) {
                            let G = L.slice(o.length);
                            G && (o = L, s += G, t.onStream(G, !1));
                            return
                        }
                        o += L, s += L, t.onStream(L, !1)
                    }
                },
                y = new Map,
                w = new Map,
                v = L => {
                    if (t.onExecutionEvent) try {
                        t.onExecutionEvent(L)
                    } catch {}
                },
                b = L => {
                    let M = L.message?.content;
                    if (Array.isArray(M))
                        for (let U of M) {
                            if (!U || typeof U != "object") continue;
                            if (U.type === "tool_use") {
                                let ne = U.id,
                                    Q = U.name,
                                    Ae = U.input;
                                ne && Q && (y.set(ne, Q), v({
                                    type: "tool_use",
                                    toolUseId: ne,
                                    toolName: Q,
                                    input: Ae
                                }))
                            }
                        }
                },
                I = parsePositiveMsEnv(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4),
                T = null,
                P = !1,
                k = t.holdInputOpenForBackgroundAgents === !0,
                S = new Set,
                D = !1,
                $ = !k,
                C = () => {},
                O = k ? new Promise(L => {
                    C = L
                }) : Promise.resolve(),
                j = parsePositiveMsEnv(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5),
                x = null,
                F = () => {
                    x && (clearTimeout(x), x = null)
                },
                q = () => {
                    $ || D && S.size === 0 && ($ = !0, F(), C())
                },
                J = () => {
                    $ || ($ = !0, F(), C())
                },
                le = () => {
                    !k || $ || (F(), D && (x = setTimeout(() => {
                        $ || (gt("warn", "[claude-sdk] hold-input idle watchdog fired — SDK went silent with background Agent task(s) still tracked; force-releasing stdin to avoid an unbounded hang. If this was a legitimate long-running task, its continuation's in-process MCP call may fail; investigate.", JSON.stringify({
                            idleTimeoutMs: j,
                            inFlightAgentTaskIds: Array.from(S)
                        })), J())
                    }, j), typeof x == "object" && x?.unref && x.unref()))
                };
            async function* oe() {
                let L = typeof t.prompt == "string" ? stringToMessageGenerator(t.prompt) : t.prompt;
                for await (let M of L) yield M;
                await O
            }
            let X = Tde({
                    prompt: k ? oe() : t.prompt,
                    options: h
                }),
                te = () => {
                    T = setTimeout(() => {
                        P = !0, ke("[claude-sdk] abort close timeout reached, closing query"), X.close()
                    }, I)
                };
            t.abortController?.signal.aborted ? te() : t.abortController?.signal.addEventListener("abort", te, {
                once: !0
            });
            let z = !1,
                V = () => {
                    if (!z) {
                        z = !0;
                        try {
                            t.onTurnAcknowledged?.()
                        } catch {}
                    }
                };
            try {
                for await (let L of X) {
                    let M = L;
                    if (M.type === "system" && M.subtype === "init" || V(), M.type === "system") {
                        if (M.subtype === "init" && (n = M.session_id ?? n), k && M.subtype === "task_started") {
                            let U = M,
                                G = typeof U.task_type == "string" ? U.task_type : void 0,
                                Q = U.subagent_type !== void 0 && U.subagent_type !== null || G !== void 0 && G !== "local_bash";
                            typeof U.task_id == "string" && U.task_id.length > 0 && Q && S.add(U.task_id)
                        }
                        if (k && M.subtype === "task_notification") {
                            let U = M;
                            typeof U.task_id == "string" && S.delete(U.task_id)
                        }
                        v({
                            type: "system",
                            subtype: M.subtype ?? "unknown",
                            data: M.subtype === "init" ? {
                                session_id: M.session_id
                            } : void 0
                        })
                    }
                    if (M.type === "stream_event") {
                        let U = Wd(M),
                            G = mI(M.event);
                        for (let _ of G) g(_.text, _.isDelta, U);
                        let ne = hI(M.event);
                        for (let _ of ne) v({
                            type: "thought_chunk",
                            text: _
                        });
                        let Q = gI(M.event);
                        Q && (w.set(Q.index, {
                            toolUseId: Q.toolUseId,
                            toolName: Q.toolName
                        }), y.set(Q.toolUseId, Q.toolName), v({
                            type: "tool_use",
                            toolUseId: Q.toolUseId,
                            toolName: Q.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let Ae = yI(M.event);
                        if (Ae) {
                            let _ = w.get(Ae.index);
                            _ && v({
                                type: "tool_input_delta",
                                toolUseId: _.toolUseId,
                                toolName: _.toolName,
                                partialJson: Ae.partialJson
                            })
                        }
                    }
                    if (typeof M.type == "string" && M.type.includes("assistant")) {
                        let U = Wd(M),
                            G = pI(M);
                        for (let ne of G) g(ne.text, ne.isDelta, U);
                        b(M)
                    }
                    if (M.type === "user") {
                        let U = M.message?.content;
                        if (Array.isArray(U))
                            for (let G of U) {
                                if (!G || typeof G != "object") continue;
                                if (G.type === "tool_result") {
                                    let Q = G.tool_use_id,
                                        Ae = G.is_error ?? !1,
                                        _ = G.content;
                                    Q && (v({
                                        type: "tool_result",
                                        toolUseId: Q,
                                        toolName: y.get(Q),
                                        isError: Ae,
                                        summary: _I(_)
                                    }), s = "")
                                }
                            }
                    }
                    if (M.type === "result" && M.subtype === "success")
                        if (d) c = Ym(M);
                        else {
                            let U = typeof M.result == "string" ? M.result : "";
                            U.length > 0 && (r = U, f = !0), M.structured_output !== void 0 && (i = M.structured_output, f = !0), c = Ym(M)
                        } M.type === "result" && (d = !1), k && M.type === "result" && (D = !0, q()), k && !$ && le()
                }
                if (P) throw Km("SDK run force-closed after abort timeout", new Error("abort close timeout"))
            } catch (L) {
                throw m && gt("error", "[claude-sdk error]", L instanceof Error ? L.stack ?? L.message : String(L)), t.abortController?.signal.aborted && !isAbortLikeError(L) ? Km("SDK run aborted", L) : L
            } finally {
                T && clearTimeout(T), t.abortController?.signal.removeEventListener("abort", te), J()
            }
            let pe = p && !f;
            return {
                sessionId: n,
                text: pe ? void 0 : r ?? (o || void 0),
                structured: pe ? void 0 : i,
                usage: c,
                firstTokenLatencyMs: u,
                skipped: pe || void 0
            }
        },
        createStreamingQuery(t) {
            return Pde(), {
                query: Tde({
                    prompt: t.prompt,
                    options: e(t, {
                        includePartialMessages: !0
                    })
                })
            }
        }
    }
}
