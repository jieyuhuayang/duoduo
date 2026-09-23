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
            wt("debug", "[claude-sdk stderr]", u)
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
        if (r.systemPrompt !== void 0 && (r.systemPrompt = Ert(r.systemPrompt)), t.allowedTools !== void 0 && (r.allowedTools = t.allowedTools), t.tools !== void 0) {
            let u = [...new Set(t.tools)];
            if (r.tools = u, wt("info", `[claude-sdk] built-in tool surface (${u.length}): ${u.join(",")}`), t.allowedTools?.length) {
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
            wt("debug", "[claude-sdk debug] execPath:", process.execPath), wt("debug", "[claude-sdk debug] PATH:", process.env.PATH), wt("debug", "[claude-sdk debug] options:", JSON.stringify(u))
        }
        return r
    };
    return {
        async run(t) {
            xhe();
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
                let N = h.hooks ?? {},
                    U = N.PreToolUse ?? [];
                U.push({
                    matcher: cc,
                    hooks: [async q => (q?.agent_id !== void 0 || (f = !0, d = !0, Q("[claude-sdk] Skip detected via PreToolUse hook (non-streaming)")), {
                        continue: !1,
                        stopReason: "The agent intentionally ended this turn silently by calling Skip."
                    })]
                }), N.PreToolUse = U, h.hooks = N
            }
            let g = (N, U, q = !1) => {
                    if (!(!t.onStream || !N) && !d) {
                        if (u || (u = !0, l = Date.now() - a, fo("sdk_first_token", t.sessionId ?? "new", {
                                ttftMs: l
                            })), q) {
                            t.onStream(N, !0);
                            return
                        }
                        if (U) {
                            o += N, s += N, t.onStream(N, !1);
                            return
                        }
                        if (s && N.startsWith(s)) {
                            let Y = N.slice(s.length);
                            Y && (o += Y, s = N, t.onStream(Y, !1));
                            return
                        }
                        if (N.startsWith(o)) {
                            let Y = N.slice(o.length);
                            Y && (o = N, s += Y, t.onStream(Y, !1));
                            return
                        }
                        o += N, s += N, t.onStream(N, !1)
                    }
                },
                y = new Map,
                v = new Map,
                b = N => {
                    if (t.onExecutionEvent) try {
                        t.onExecutionEvent(N)
                    } catch {}
                },
                _ = N => {
                    let U = N.message?.content;
                    if (Array.isArray(U))
                        for (let q of U) {
                            if (!q || typeof q != "object") continue;
                            if (q.type === "tool_use") {
                                let Se = q.id,
                                    ye = q.name,
                                    Be = q.input;
                                Se && ye && (y.set(Se, ye), b({
                                    type: "tool_use",
                                    toolUseId: Se,
                                    toolName: ye,
                                    input: Be
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
                A = !x,
                C = () => {},
                $ = x ? new Promise(N => {
                    C = N
                }) : Promise.resolve(),
                j = parsePositiveMsEnv(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5),
                k = null,
                L = () => {
                    k && (clearTimeout(k), k = null)
                },
                B = () => {
                    A || D && S.size === 0 && (A = !0, L(), C())
                },
                G = () => {
                    A || (A = !0, L(), C())
                },
                ce = () => {
                    !x || A || (L(), D && (k = setTimeout(() => {
                        A || (wt("warn", "[claude-sdk] hold-input idle watchdog fired — SDK went silent with background Agent task(s) still tracked; force-releasing stdin to avoid an unbounded hang. If this was a legitimate long-running task, its continuation's in-process MCP call may fail; investigate.", JSON.stringify({
                            idleTimeoutMs: j,
                            inFlightAgentTaskIds: Array.from(S)
                        })), G())
                    }, j), typeof k == "object" && k?.unref && k.unref()))
                };
            async function* J() {
                let N = typeof t.prompt == "string" ? stringToMessageGenerator(t.prompt) : t.prompt;
                for await (let U of N) yield U;
                await $
            }
            let ee = She({
                    prompt: x ? J() : t.prompt,
                    options: h
                }),
                le = () => {
                    E = setTimeout(() => {
                        R = !0, Ee("[claude-sdk] abort close timeout reached, closing query"), ee.close()
                    }, I)
                };
            t.abortController?.signal.aborted ? le() : t.abortController?.signal.addEventListener("abort", le, {
                once: !0
            });
            let M = !1,
                ue = () => {
                    if (!M) {
                        M = !0;
                        try {
                            t.onTurnAcknowledged?.()
                        } catch {}
                    }
                };
            try {
                for await (let N of ee) {
                    let U = N;
                    if (U.type === "system" && U.subtype === "init" || ue(), U.type === "system") {
                        if (U.subtype === "init" && (n = U.session_id ?? n), x && U.subtype === "task_started") {
                            let q = U,
                                Y = typeof q.task_type == "string" ? q.task_type : void 0,
                                ye = q.subagent_type !== void 0 && q.subagent_type !== null || Y !== void 0 && Y !== "local_bash";
                            typeof q.task_id == "string" && q.task_id.length > 0 && ye && S.add(q.task_id)
                        }
                        if (x && U.subtype === "task_notification") {
                            let q = U;
                            typeof q.task_id == "string" && S.delete(q.task_id)
                        }
                        b({
                            type: "system",
                            subtype: U.subtype ?? "unknown",
                            data: U.subtype === "init" ? {
                                session_id: U.session_id
                            } : void 0
                        })
                    }
                    if (U.type === "stream_event") {
                        let q = kf(U),
                            Y = fC(U.event);
                        for (let w of Y) g(w.text, w.isDelta, q);
                        let Se = pC(U.event);
                        for (let w of Se) b({
                            type: "thought_chunk",
                            text: w
                        });
                        let ye = mC(U.event);
                        ye && (v.set(ye.index, {
                            toolUseId: ye.toolUseId,
                            toolName: ye.toolName
                        }), y.set(ye.toolUseId, ye.toolName), b({
                            type: "tool_use",
                            toolUseId: ye.toolUseId,
                            toolName: ye.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let Be = hC(U.event);
                        if (Be) {
                            let w = v.get(Be.index);
                            w && b({
                                type: "tool_input_delta",
                                toolUseId: w.toolUseId,
                                toolName: w.toolName,
                                partialJson: Be.partialJson
                            })
                        }
                    }
                    if (typeof U.type == "string" && U.type.includes("assistant")) {
                        let q = kf(U),
                            Y = dC(U);
                        for (let Se of Y) g(Se.text, Se.isDelta, q);
                        _(U)
                    }
                    if (U.type === "user") {
                        let q = U.message?.content;
                        if (Array.isArray(q))
                            for (let Y of q) {
                                if (!Y || typeof Y != "object") continue;
                                if (Y.type === "tool_result") {
                                    let ye = Y.tool_use_id,
                                        Be = Y.is_error ?? !1,
                                        w = Y.content;
                                    ye && (b({
                                        type: "tool_result",
                                        toolUseId: ye,
                                        toolName: y.get(ye),
                                        isError: Be,
                                        summary: gC(w)
                                    }), s = "")
                                }
                            }
                    }
                    if (U.type === "result" && U.subtype === "success")
                        if (d) c = Bh(U);
                        else {
                            let q = typeof U.result == "string" ? U.result : "";
                            q.length > 0 && (r = q, p = !0), U.structured_output !== void 0 && (i = U.structured_output, p = !0), c = Bh(U)
                        } U.type === "result" && (d = !1), x && U.type === "result" && (D = !0, B()), x && !A && ce()
                }
                if (R) throw qh("SDK run force-closed after abort timeout", new Error("abort close timeout"))
            } catch (N) {
                throw m && wt("error", "[claude-sdk error]", N instanceof Error ? N.stack ?? N.message : String(N)), t.abortController?.signal.aborted && !isAbortLikeError(N) ? qh("SDK run aborted", N) : N
            } finally {
                E && clearTimeout(E), t.abortController?.signal.removeEventListener("abort", le), G()
            }
            let $e = f && !p;
            return {
                sessionId: n,
                text: $e ? void 0 : r ?? (o || void 0),
                structured: $e ? void 0 : i,
                usage: c,
                firstTokenLatencyMs: l,
                skipped: $e || void 0
            }
        },
        createStreamingQuery(t) {
            return xhe(), {
                query: She({
                    prompt: t.prompt,
                    options: e(t, {
                        includePartialMessages: !0
                    })
                })
            }
        }
    }
}
