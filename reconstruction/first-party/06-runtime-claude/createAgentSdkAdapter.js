// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAgentSdkAdapter  (minified: Dd, daemon.pretty.js:49529)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAgentSdkAdapter() {
    let e = (t, n) => {
        let r = {},
            i = !!process.env.ALADUO_SDK_DEBUG;
        i && (r.debug = !0, r.stderr = l => {
            ht("debug", "[claude-sdk stderr]", l)
        }), t.sessionId && (r.resume = t.sessionId), t.abortController && (r.abortController = t.abortController), t.cwd && (r.cwd = t.cwd), t.settingSources && (r.settingSources = t.settingSources), t.persistSession !== void 0 && (r.persistSession = t.persistSession), "outputFormat" in t && t.outputFormat && (r.outputFormat = t.outputFormat), "model" in t && t.model && (r.model = t.model), "effort" in t && t.effort && (r.effort = t.effort);
        let o = t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions";
        if (o && (r.permissionMode = o), t.systemPrompt !== void 0) r.systemPrompt = t.systemPrompt;
        else {
            let l = _b(process.env.SYSTEM_PROMPT),
                u = _b(process.env.APPEND_SYSTEM_PROMPT),
                p = [resolveMetaPromptText(), u].filter(f => !!f).join(`

`).trim();
            l && p ? r.systemPrompt = `${l}

${p}` : l ? r.systemPrompt = l : p && (r.systemPrompt = {
                type: "preset",
                preset: "claude_code",
                append: p
            })
        }
        if (t.allowedTools !== void 0 && (r.allowedTools = t.allowedTools), t.tools !== void 0) {
            let l = [...new Set(t.tools)];
            if (r.tools = l, ht("info", `[claude-sdk] built-in tool surface (${l.length}): ${l.join(",")}`), t.allowedTools?.length) {
                let u = Uce(t.allowedTools, l);
                u.length > 0 && J(`[claude-sdk] allowedTools no longer adds built-in tools to the surface (allowlist-only via claude.tools); not on this session's surface: ${u.join(",")} — move them to the descriptor's claude: { tools: [...] } if you meant to enable them`)
            }
        }
        if (t.disallowedTools !== void 0) {
            let {
                mcpTools: l,
                builtIns: u
            } = splitDisallowedToolsForClaude(t.disallowedTools);
            u.length > 0 && J(`[claude-sdk] disallowedTools no longer governs built-in tools (allowlist-only via claude.tools); ignoring: ${u.join(",")}`), l.length > 0 && (r.disallowedTools = l)
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
            ht("debug", "[claude-sdk debug] execPath:", process.execPath), ht("debug", "[claude-sdk debug] PATH:", process.env.PATH), ht("debug", "[claude-sdk debug] options:", JSON.stringify(l))
        }
        return r
    };
    return {
        async run(t) {
            Lce();
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
                let D = h.hooks ?? {},
                    B = D.PreToolUse ?? [];
                B.push({
                    matcher: Cu,
                    hooks: [async F => (F?.agent_id !== void 0 || (p = !0, d = !0, Q("[claude-sdk] Skip detected via PreToolUse hook (non-streaming)")), {
                        continue: !1,
                        stopReason: "The agent intentionally ended this turn silently by calling Skip."
                    })]
                }), D.PreToolUse = B, h.hooks = D
            }
            let g = (D, B, F = !1) => {
                    if (!(!t.onStream || !D) && !d) {
                        if (l || (l = !0, u = Date.now() - a, Bi("sdk_first_token", t.sessionId ?? "new", {
                                ttftMs: u
                            })), F) {
                            t.onStream(D, !0);
                            return
                        }
                        if (B) {
                            o += D, s += D, t.onStream(D, !1);
                            return
                        }
                        if (s && D.startsWith(s)) {
                            let W = D.slice(s.length);
                            W && (o += W, s = D, t.onStream(W, !1));
                            return
                        }
                        if (D.startsWith(o)) {
                            let W = D.slice(o.length);
                            W && (o = D, s += W, t.onStream(W, !1));
                            return
                        }
                        o += D, s += D, t.onStream(D, !1)
                    }
                },
                y = new Map,
                w = new Map,
                v = D => {
                    if (t.onExecutionEvent) try {
                        t.onExecutionEvent(D)
                    } catch {}
                },
                b = D => {
                    let B = D.message?.content;
                    if (Array.isArray(B))
                        for (let F of B) {
                            if (!F || typeof F != "object") continue;
                            if (F.type === "tool_use") {
                                let ye = F.id,
                                    ge = F.name,
                                    Be = F.input;
                                ye && ge && (y.set(ye, ge), v({
                                    type: "tool_use",
                                    toolUseId: ye,
                                    toolName: ge,
                                    input: Be
                                }))
                            }
                        }
                },
                R = parsePositiveMsEnv(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4),
                I = null,
                T = !1,
                x = t.holdInputOpenForBackgroundAgents === !0,
                S = new Set,
                O = !1,
                $ = !x,
                C = () => {},
                A = x ? new Promise(D => {
                    C = D
                }) : Promise.resolve(),
                j = parsePositiveMsEnv(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5),
                P = null,
                z = () => {
                    P && (clearTimeout(P), P = null)
                },
                U = () => {
                    $ || O && S.size === 0 && ($ = !0, z(), C())
                },
                K = () => {
                    $ || ($ = !0, z(), C())
                },
                te = () => {
                    !x || $ || (z(), O && (P = setTimeout(() => {
                        $ || (ht("warn", "[claude-sdk] hold-input idle watchdog fired — SDK went silent with background Agent task(s) still tracked; force-releasing stdin to avoid an unbounded hang. If this was a legitimate long-running task, its continuation's in-process MCP call may fail; investigate.", JSON.stringify({
                            idleTimeoutMs: j,
                            inFlightAgentTaskIds: Array.from(S)
                        })), K())
                    }, j), typeof P == "object" && P?.unref && P.unref()))
                };
            async function* V() {
                let D = typeof t.prompt == "string" ? rI(t.prompt) : t.prompt;
                for await (let B of D) yield B;
                await A
            }
            let re = Mce({
                    prompt: x ? V() : t.prompt,
                    options: h
                }),
                X = () => {
                    I = setTimeout(() => {
                        T = !0, ke("[claude-sdk] abort close timeout reached, closing query"), re.close()
                    }, R)
                };
            t.abortController?.signal.aborted ? X() : t.abortController?.signal.addEventListener("abort", X, {
                once: !0
            });
            let L = !1,
                ie = () => {
                    if (!L) {
                        L = !0;
                        try {
                            t.onTurnAcknowledged?.()
                        } catch {}
                    }
                };
            try {
                for await (let D of re) {
                    let B = D;
                    if (B.type === "system" && B.subtype === "init" || ie(), B.type === "system") {
                        if (B.subtype === "init" && (n = B.session_id ?? n), x && B.subtype === "task_started") {
                            let F = B,
                                W = typeof F.task_type == "string" ? F.task_type : void 0,
                                ge = F.subagent_type !== void 0 && F.subagent_type !== null || W !== void 0 && W !== "local_bash";
                            typeof F.task_id == "string" && F.task_id.length > 0 && ge && S.add(F.task_id)
                        }
                        if (x && B.subtype === "task_notification") {
                            let F = B;
                            typeof F.task_id == "string" && S.delete(F.task_id)
                        }
                        v({
                            type: "system",
                            subtype: B.subtype ?? "unknown",
                            data: B.subtype === "init" ? {
                                session_id: B.session_id
                            } : void 0
                        })
                    }
                    if (B.type === "stream_event") {
                        let F = Ad(B),
                            W = YT(B.event);
                        for (let _ of W) g(_.text, _.isDelta, F);
                        let ye = XT(B.event);
                        for (let _ of ye) v({
                            type: "thought_chunk",
                            text: _
                        });
                        let ge = QT(B.event);
                        ge && (w.set(ge.index, {
                            toolUseId: ge.toolUseId,
                            toolName: ge.toolName
                        }), y.set(ge.toolUseId, ge.toolName), v({
                            type: "tool_use",
                            toolUseId: ge.toolUseId,
                            toolName: ge.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let Be = eI(B.event);
                        if (Be) {
                            let _ = w.get(Be.index);
                            _ && v({
                                type: "tool_input_delta",
                                toolUseId: _.toolUseId,
                                toolName: _.toolName,
                                partialJson: Be.partialJson
                            })
                        }
                    }
                    if (typeof B.type == "string" && B.type.includes("assistant")) {
                        let F = Ad(B),
                            W = KT(B);
                        for (let ye of W) g(ye.text, ye.isDelta, F);
                        b(B)
                    }
                    if (B.type === "user") {
                        let F = B.message?.content;
                        if (Array.isArray(F))
                            for (let W of F) {
                                if (!W || typeof W != "object") continue;
                                if (W.type === "tool_result") {
                                    let ge = W.tool_use_id,
                                        Be = W.is_error ?? !1,
                                        _ = W.content;
                                    ge && (v({
                                        type: "tool_result",
                                        toolUseId: ge,
                                        toolName: y.get(ge),
                                        isError: Be,
                                        summary: tI(_)
                                    }), s = "")
                                }
                            }
                    }
                    if (B.type === "result" && B.subtype === "success")
                        if (d) c = Lm(B);
                        else {
                            let F = typeof B.result == "string" ? B.result : "";
                            F.length > 0 && (r = F, f = !0), B.structured_output !== void 0 && (i = B.structured_output, f = !0), c = Lm(B)
                        } B.type === "result" && (d = !1), x && B.type === "result" && (O = !0, U()), x && !$ && te()
                }
                if (T) throw jm("SDK run force-closed after abort timeout", new Error("abort close timeout"))
            } catch (D) {
                throw m && ht("error", "[claude-sdk error]", D instanceof Error ? D.stack ?? D.message : String(D)), t.abortController?.signal.aborted && !isAbortLikeError(D) ? jm("SDK run aborted", D) : D
            } finally {
                I && clearTimeout(I), t.abortController?.signal.removeEventListener("abort", X), K()
            }
            let fe = p && !f;
            return {
                sessionId: n,
                text: fe ? void 0 : r ?? (o || void 0),
                structured: fe ? void 0 : i,
                usage: c,
                firstTokenLatencyMs: u,
                skipped: fe || void 0
            }
        },
        createStreamingQuery(t) {
            return Lce(), {
                query: Mce({
                    prompt: t.prompt,
                    options: e(t, {
                        includePartialMessages: !0
                    })
                })
            }
        }
    }
}
