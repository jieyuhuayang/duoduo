// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAgentSdkAdapter  (minified: Ef, daemon.pretty.js:55213)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAgentSdkAdapter() {
    let e = (t, n) => {
        let r = {},
            i = !!process.env.ALADUO_SDK_DEBUG;
        i && (r.debug = !0, r.stderr = u => {
            _t("debug", "[claude-sdk stderr]", u)
        }), t.sessionId && (r.resume = t.sessionId), t.abortController && (r.abortController = t.abortController), t.cwd && (r.cwd = t.cwd), t.settingSources && (r.settingSources = t.settingSources), t.persistSession !== void 0 && (r.persistSession = t.persistSession), "outputFormat" in t && t.outputFormat && (r.outputFormat = t.outputFormat), "model" in t && t.model && (r.model = t.model), "effort" in t && t.effort && (r.effort = t.effort);
        let o = t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions";
        if (o && (r.permissionMode = o), t.systemPrompt !== void 0) r.systemPrompt = t.systemPrompt;
        else {
            let u = Zv(process.env.SYSTEM_PROMPT),
                l = Zv(process.env.APPEND_SYSTEM_PROMPT),
                f = [resolveMetaPromptText(), l].filter(p => !!p).join(`

`).trim();
            u && f ? r.systemPrompt = `${u}

${f}` : u ? r.systemPrompt = u : f && (r.systemPrompt = {
                type: "preset",
                preset: "claude_code",
                append: f
            })
        }
        if (r.systemPrompt !== void 0 && (r.systemPrompt = Prt(r.systemPrompt)), t.allowedTools !== void 0 && (r.allowedTools = t.allowedTools), t.tools !== void 0) {
            let u = [...new Set(t.tools)];
            if (r.tools = u, _t("info", `[claude-sdk] built-in tool surface (${u.length}): ${u.join(",")}`), t.allowedTools?.length) {
                let l = findDeadAllowedToolEntries(t.allowedTools, u);
                l.length > 0 && Z(`[claude-sdk] allowedTools no longer adds built-in tools to the surface (allowlist-only via claude.tools); not on this session's surface: ${l.join(",")} — move them to the descriptor's claude: { tools: [...] } if you meant to enable them`)
            }
        }
        if (t.disallowedTools !== void 0) {
            let {
                mcpTools: u,
                builtIns: l
            } = splitDisallowedToolsForClaude(t.disallowedTools);
            l.length > 0 && Z(`[claude-sdk] disallowedTools no longer governs built-in tools (allowlist-only via claude.tools); ignoring: ${l.join(",")}`), u.length > 0 && (r.disallowedTools = u)
        }
        t.mcpServers && (r.mcpServers = t.mcpServers), t.additionalDirectories !== void 0 && (r.additionalDirectories = t.additionalDirectories);
        let s = {
            ...process.env
        };
        delete s.CLAUDECODE, (t.additionalDirectories?.length ?? 0) > 0 && t.autoloadAdditionalDirectoryClaudeMd !== !1 ? s.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1" : t.autoloadAdditionalDirectoryClaudeMd === !1 && delete s.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD, r.env = s, "claudeSettingsPath" in t && t.claudeSettingsPath && (r.settings = t.claudeSettingsPath);
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
            _t("debug", "[claude-sdk debug] execPath:", process.execPath), _t("debug", "[claude-sdk debug] PATH:", process.env.PATH), _t("debug", "[claude-sdk debug] options:", JSON.stringify(u))
        }
        return r
    };
    return {
        async run(t) {
            Ehe();
            let n = t.sessionId,
                r, i, o = "",
                s = "",
                a = Date.now(),
                u = !1,
                l, c, d = !1,
                f = !1,
                p = !1,
                m = !!process.env.ALADUO_SDK_DEBUG,
                h = e(t, {
                    includePartialMessages: !!t.onStream
                });
            {
                let M = h.hooks ?? {},
                    z = M.PreToolUse ?? [];
                z.push({
                    matcher: cc,
                    hooks: [async U => (U?.agent_id !== void 0 || (f = !0, d = !0, te("[claude-sdk] Skip detected via PreToolUse hook (non-streaming)")), {
                        continue: !1,
                        stopReason: "The agent intentionally ended this turn silently by calling Skip."
                    })]
                }), M.PreToolUse = z, h.hooks = M
            }
            let g = (M, z, U = !1) => {
                    if (!(!t.onStream || !M) && !d) {
                        if (u || (u = !0, l = Date.now() - a, po("sdk_first_token", t.sessionId ?? "new", {
                                ttftMs: l
                            })), U) {
                            t.onStream(M, !0);
                            return
                        }
                        if (z) {
                            o += M, s += M, t.onStream(M, !1);
                            return
                        }
                        if (s && M.startsWith(s)) {
                            let X = M.slice(s.length);
                            X && (o += X, s = M, t.onStream(X, !1));
                            return
                        }
                        if (M.startsWith(o)) {
                            let X = M.slice(o.length);
                            X && (o = M, s += X, t.onStream(X, !1));
                            return
                        }
                        o += M, s += M, t.onStream(M, !1)
                    }
                },
                y = new Map,
                v = new Map,
                b = M => {
                    if (t.onExecutionEvent) try {
                        t.onExecutionEvent(M)
                    } catch {}
                },
                _ = M => {
                    let z = M.message?.content;
                    if (Array.isArray(z))
                        for (let U of z) {
                            if (!U || typeof U != "object") continue;
                            if (U.type === "tool_use") {
                                let Ee = U.id,
                                    be = U.name,
                                    w = U.input;
                                Ee && be && (y.set(Ee, be), b({
                                    type: "tool_use",
                                    toolUseId: Ee,
                                    toolName: be,
                                    input: w
                                }))
                            }
                        }
                },
                I = parsePositiveMsEnv(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4),
                E = null,
                R = !1,
                x = t.holdInputOpenForBackgroundAgents === !0,
                S = new Set,
                D = !1,
                $ = !x,
                C = () => {},
                A = x ? new Promise(M => {
                    C = M
                }) : Promise.resolve(),
                F = parsePositiveMsEnv(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5),
                k = null,
                N = () => {
                    k && (clearTimeout(k), k = null)
                },
                V = () => {
                    $ || D && S.size === 0 && ($ = !0, N(), C())
                },
                W = () => {
                    $ || ($ = !0, N(), C())
                },
                ce = () => {
                    !x || $ || (N(), D && (k = setTimeout(() => {
                        $ || (_t("warn", "[claude-sdk] hold-input idle watchdog fired — SDK went silent with background Agent task(s) still tracked; force-releasing stdin to avoid an unbounded hang. If this was a legitimate long-running task, its continuation's in-process MCP call may fail; investigate.", JSON.stringify({
                            idleTimeoutMs: F,
                            inFlightAgentTaskIds: Array.from(S)
                        })), W())
                    }, F), typeof k == "object" && k?.unref && k.unref()))
                };
            async function* J() {
                let M = typeof t.prompt == "string" ? stringToMessageGenerator(t.prompt) : t.prompt;
                for await (let z of M) yield z;
                await A
            }
            let ne = khe({
                    prompt: x ? J() : t.prompt,
                    options: h
                }),
                fe = () => {
                    E = setTimeout(() => {
                        R = !0, Re("[claude-sdk] abort close timeout reached, closing query"), ne.close()
                    }, I)
                };
            t.abortController?.signal.aborted ? fe() : t.abortController?.signal.addEventListener("abort", fe, {
                once: !0
            });
            let j = !1,
                ue = () => {
                    if (!j) {
                        j = !0;
                        try {
                            t.onTurnAcknowledged?.()
                        } catch {}
                    }
                };
            try {
                for await (let M of ne) {
                    let z = M;
                    if (z.type === "system" && z.subtype === "init" || ue(), z.type === "system") {
                        if (z.subtype === "init" && (n = z.session_id ?? n), x && z.subtype === "task_started") {
                            let U = z,
                                X = typeof U.task_type == "string" ? U.task_type : void 0,
                                be = U.subagent_type !== void 0 && U.subagent_type !== null || X !== void 0 && X !== "local_bash";
                            typeof U.task_id == "string" && U.task_id.length > 0 && be && S.add(U.task_id)
                        }
                        if (x && z.subtype === "task_notification") {
                            let U = z;
                            typeof U.task_id == "string" && S.delete(U.task_id)
                        }
                        b({
                            type: "system",
                            subtype: z.subtype ?? "unknown",
                            data: z.subtype === "init" ? {
                                session_id: z.session_id
                            } : void 0
                        })
                    }
                    if (z.type === "stream_event") {
                        let U = kf(z),
                            X = fC(z.event);
                        for (let P of X) g(P.text, P.isDelta, U);
                        let Ee = pC(z.event);
                        for (let P of Ee) b({
                            type: "thought_chunk",
                            text: P
                        });
                        let be = mC(z.event);
                        be && (v.set(be.index, {
                            toolUseId: be.toolUseId,
                            toolName: be.toolName
                        }), y.set(be.toolUseId, be.toolName), b({
                            type: "tool_use",
                            toolUseId: be.toolUseId,
                            toolName: be.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let w = hC(z.event);
                        if (w) {
                            let P = v.get(w.index);
                            P && b({
                                type: "tool_input_delta",
                                toolUseId: P.toolUseId,
                                toolName: P.toolName,
                                partialJson: w.partialJson
                            })
                        }
                    }
                    if (typeof z.type == "string" && z.type.includes("assistant")) {
                        let U = kf(z),
                            X = dC(z);
                        for (let Ee of X) g(Ee.text, Ee.isDelta, U);
                        _(z)
                    }
                    if (z.type === "user") {
                        let U = z.message?.content;
                        if (Array.isArray(U))
                            for (let X of U) {
                                if (!X || typeof X != "object") continue;
                                if (X.type === "tool_result") {
                                    let be = X.tool_use_id,
                                        w = X.is_error ?? !1,
                                        P = X.content;
                                    be && (b({
                                        type: "tool_result",
                                        toolUseId: be,
                                        toolName: y.get(be),
                                        isError: w,
                                        summary: gC(P)
                                    }), s = "")
                                }
                            }
                    }
                    if (z.type === "result" && z.subtype === "success")
                        if (d) c = Vh(z);
                        else {
                            let U = typeof z.result == "string" ? z.result : "";
                            U.length > 0 && (r = U, p = !0), z.structured_output !== void 0 && (i = z.structured_output, p = !0), c = Vh(z)
                        } z.type === "result" && (d = !1), x && z.type === "result" && (D = !0, V()), x && !$ && ce()
                }
                if (R) throw Bh("SDK run force-closed after abort timeout", new Error("abort close timeout"))
            } catch (M) {
                throw m && _t("error", "[claude-sdk error]", M instanceof Error ? M.stack ?? M.message : String(M)), t.abortController?.signal.aborted && !isAbortLikeError(M) ? Bh("SDK run aborted", M) : M
            } finally {
                E && clearTimeout(E), t.abortController?.signal.removeEventListener("abort", fe), W()
            }
            let Ie = f && !p;
            return {
                sessionId: n,
                text: Ie ? void 0 : r ?? (o || void 0),
                structured: Ie ? void 0 : i,
                usage: c,
                firstTokenLatencyMs: l,
                skipped: Ie || void 0
            }
        },
        createStreamingQuery(t) {
            return Ehe(), {
                query: khe({
                    prompt: t.prompt,
                    options: e(t, {
                        includePartialMessages: !0
                    })
                })
            }
        }
    }
}
