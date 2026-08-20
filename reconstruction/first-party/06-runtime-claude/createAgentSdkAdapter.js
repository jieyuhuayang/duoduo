// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAgentSdkAdapter  (minified: Su, daemon.pretty.js:49321)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAgentSdkAdapter() {
    let e = (t, n) => {
        let r = {},
            i = !!process.env.ALADUO_SDK_DEBUG;
        i && (r.debug = !0, r.stderr = l => {
            Ct("debug", "[claude-sdk stderr]", l)
        }), t.sessionId && (r.resume = t.sessionId), t.abortController && (r.abortController = t.abortController), t.cwd && (r.cwd = t.cwd), t.settingSources && (r.settingSources = t.settingSources), t.persistSession !== void 0 && (r.persistSession = t.persistSession), "outputFormat" in t && t.outputFormat && (r.outputFormat = t.outputFormat), "model" in t && t.model && (r.model = t.model), "effort" in t && t.effort && (r.effort = t.effort);
        let o = t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions";
        if (o && (r.permissionMode = o), t.systemPrompt !== void 0) r.systemPrompt = t.systemPrompt;
        else {
            let l = cb(process.env.SYSTEM_PROMPT),
                u = cb(process.env.APPEND_SYSTEM_PROMPT),
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
            if (r.tools = l, Ct("info", `[claude-sdk] built-in tool surface (${l.length}): ${l.join(",")}`), t.allowedTools?.length) {
                let u = Tue(t.allowedTools, l);
                u.length > 0 && Z(`[claude-sdk] allowedTools no longer adds built-in tools to the surface (allowlist-only via claude.tools); not on this session's surface: ${u.join(",")} — move them to the descriptor's claude: { tools: [...] } if you meant to enable them`)
            }
        }
        if (t.disallowedTools !== void 0) {
            let {
                mcpTools: l,
                builtIns: u
            } = splitDisallowedToolsForClaude(t.disallowedTools);
            u.length > 0 && Z(`[claude-sdk] disallowedTools no longer governs built-in tools (allowlist-only via claude.tools); ignoring: ${u.join(",")}`), l.length > 0 && (r.disallowedTools = l)
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
            Ct("debug", "[claude-sdk debug] execPath:", process.execPath), Ct("debug", "[claude-sdk debug] PATH:", process.env.PATH), Ct("debug", "[claude-sdk debug] options:", JSON.stringify(l))
        }
        return r
    };
    return {
        async run(t) {
            xue();
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
                let F = h.hooks ?? {},
                    L = F.PreToolUse ?? [];
                L.push({
                    matcher: wd,
                    hooks: [async B => (B?.agent_id !== void 0 || (p = !0, d = !0, K("[claude-sdk] Skip detected via PreToolUse hook (non-streaming)")), {
                        continue: !1,
                        stopReason: "The agent intentionally ended this turn silently by calling Skip."
                    })]
                }), F.PreToolUse = L, h.hooks = F
            }
            let y = (F, L, B = !1) => {
                    if (!(!t.onStream || !F) && !d) {
                        if (l || (l = !0, u = Date.now() - a, Yi("sdk_first_token", t.sessionId ?? "new", {
                                ttftMs: u
                            })), B) {
                            t.onStream(F, !0);
                            return
                        }
                        if (L) {
                            o += F, s += F, t.onStream(F, !1);
                            return
                        }
                        if (s && F.startsWith(s)) {
                            let te = F.slice(s.length);
                            te && (o += te, s = F, t.onStream(te, !1));
                            return
                        }
                        if (F.startsWith(o)) {
                            let te = F.slice(o.length);
                            te && (o = F, s += te, t.onStream(te, !1));
                            return
                        }
                        o += F, s += F, t.onStream(F, !1)
                    }
                },
                _ = new Map,
                k = new Map,
                v = F => {
                    if (t.onExecutionEvent) try {
                        t.onExecutionEvent(F)
                    } catch {}
                },
                b = F => {
                    let L = F.message?.content;
                    if (Array.isArray(L))
                        for (let B of L) {
                            if (!B || typeof B != "object") continue;
                            if (B.type === "tool_use") {
                                let Le = B.id,
                                    Re = B.name,
                                    We = B.input;
                                Le && Re && (_.set(Le, Re), v({
                                    type: "tool_use",
                                    toolUseId: Le,
                                    toolName: Re,
                                    input: We
                                }))
                            }
                        }
                },
                I = parsePositiveMsEnv(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4),
                T = null,
                S = !1,
                w = t.holdInputOpenForBackgroundAgents === !0,
                C = new Set,
                O = !1,
                A = !w,
                x = () => {},
                P = w ? new Promise(F => {
                    x = F
                }) : Promise.resolve(),
                M = parsePositiveMsEnv(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5),
                j = null,
                H = () => {
                    j && (clearTimeout(j), j = null)
                },
                J = () => {
                    A || O && C.size === 0 && (A = !0, H(), x())
                },
                ee = () => {
                    A || (A = !0, H(), x())
                },
                ie = () => {
                    !w || A || (H(), O && (j = setTimeout(() => {
                        A || (Ct("warn", "[claude-sdk] hold-input idle watchdog fired — SDK went silent with background Agent task(s) still tracked; force-releasing stdin to avoid an unbounded hang. If this was a legitimate long-running task, its continuation's in-process MCP call may fail; investigate.", JSON.stringify({
                            idleTimeoutMs: M,
                            inFlightAgentTaskIds: Array.from(C)
                        })), ee())
                    }, M), typeof j == "object" && j?.unref && j.unref()))
                };
            async function* re() {
                let F = typeof t.prompt == "string" ? ET(t.prompt) : t.prompt;
                for await (let L of F) yield L;
                await P
            }
            let Ye = Sue({
                    prompt: w ? re() : t.prompt,
                    options: h
                }),
                je = () => {
                    T = setTimeout(() => {
                        S = !0, Ae("[claude-sdk] abort close timeout reached, closing query"), Ye.close()
                    }, I)
                };
            t.abortController?.signal.aborted ? je() : t.abortController?.signal.addEventListener("abort", je, {
                once: !0
            });
            let Se = !1,
                lt = () => {
                    if (!Se) {
                        Se = !0;
                        try {
                            t.onTurnAcknowledged?.()
                        } catch {}
                    }
                };
            try {
                for await (let F of Ye) {
                    let L = F;
                    if (L.type === "system" && L.subtype === "init" || lt(), L.type === "system") {
                        if (L.subtype === "init" && (n = L.session_id ?? n), w && L.subtype === "task_started") {
                            let B = L,
                                te = typeof B.task_type == "string" ? B.task_type : void 0,
                                Re = B.subagent_type !== void 0 && B.subagent_type !== null || te !== void 0 && te !== "local_bash";
                            typeof B.task_id == "string" && B.task_id.length > 0 && Re && C.add(B.task_id)
                        }
                        if (w && L.subtype === "task_notification") {
                            let B = L;
                            typeof B.task_id == "string" && C.delete(B.task_id)
                        }
                        v({
                            type: "system",
                            subtype: L.subtype ?? "unknown",
                            data: L.subtype === "init" ? {
                                session_id: L.session_id
                            } : void 0
                        })
                    }
                    if (L.type === "stream_event") {
                        let B = xm(L),
                            te = bT(L.event);
                        for (let Be of te) y(Be.text, Be.isDelta, B);
                        let Le = vT(L.event);
                        for (let Be of Le) v({
                            type: "thought_chunk",
                            text: Be
                        });
                        let Re = wT(L.event);
                        Re && (k.set(Re.index, {
                            toolUseId: Re.toolUseId,
                            toolName: Re.toolName
                        }), _.set(Re.toolUseId, Re.toolName), v({
                            type: "tool_use",
                            toolUseId: Re.toolUseId,
                            toolName: Re.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let We = ST(L.event);
                        if (We) {
                            let Be = k.get(We.index);
                            Be && v({
                                type: "tool_input_delta",
                                toolUseId: Be.toolUseId,
                                toolName: Be.toolName,
                                partialJson: We.partialJson
                            })
                        }
                    }
                    if (typeof L.type == "string" && L.type.includes("assistant")) {
                        let B = xm(L),
                            te = _T(L);
                        for (let Le of te) y(Le.text, Le.isDelta, B);
                        b(L)
                    }
                    if (L.type === "user") {
                        let B = L.message?.content;
                        if (Array.isArray(B))
                            for (let te of B) {
                                if (!te || typeof te != "object") continue;
                                if (te.type === "tool_result") {
                                    let Re = te.tool_use_id,
                                        We = te.is_error ?? !1,
                                        Be = te.content;
                                    Re && (v({
                                        type: "tool_result",
                                        toolUseId: Re,
                                        toolName: _.get(Re),
                                        isError: We,
                                        summary: kT(Be)
                                    }), s = "")
                                }
                            }
                    }
                    if (L.type === "result" && L.subtype === "success")
                        if (d) c = Rm(L);
                        else {
                            let B = typeof L.result == "string" ? L.result : "";
                            B.length > 0 && (r = B, f = !0), L.structured_output !== void 0 && (i = L.structured_output, f = !0), c = Rm(L)
                        } L.type === "result" && (d = !1), w && L.type === "result" && (O = !0, J()), w && !A && ie()
                }
                if (S) throw Em("SDK run force-closed after abort timeout", new Error("abort close timeout"))
            } catch (F) {
                throw m && Ct("error", "[claude-sdk error]", F instanceof Error ? F.stack ?? F.message : String(F)), t.abortController?.signal.aborted && !x9e(F) ? Em("SDK run aborted", F) : F
            } finally {
                T && clearTimeout(T), t.abortController?.signal.removeEventListener("abort", je), ee()
            }
            let Fe = p && !f;
            return {
                sessionId: n,
                text: Fe ? void 0 : r ?? (o || void 0),
                structured: Fe ? void 0 : i,
                usage: c,
                firstTokenLatencyMs: u,
                skipped: Fe || void 0
            }
        },
        createStreamingQuery(t) {
            return xue(), {
                query: Sue({
                    prompt: t.prompt,
                    options: e(t, {
                        includePartialMessages: !0
                    })
                })
            }
        },
        async undo(t) {
            let n = new Date().toISOString();
            if (!Number.isInteger(t.numTurns) || t.numTurns < 1) return {
                kind: "noop",
                runtime: "claude",
                reason: `invalid numTurns: ${t.numTurns}`,
                triggered_at: n
            };
            let r = process.env.CLAUDE_CONFIG_DIR ?? Tm.join(w9e(), ".claude"),
                i = Tm.join(r, "projects"),
                o = [];
            try {
                o = await b9e(i)
            } catch (m) {
                return {
                    kind: "failed",
                    runtime: "claude",
                    error: `failed to scan claude projects dir: ${m instanceof Error?m.message.split(`
`)[0]:String(m)}`,
                    triggered_at: n
                }
            }
            let s;
            for (let m of o) {
                let h = Tm.join(i, m, `${t.sessionId}.jsonl`);
                try {
                    if (!(await v9e(h)).isFile()) continue;
                    if (s) return {
                        kind: "failed",
                        runtime: "claude",
                        error: "ambiguous session file lookup (multiple matches)",
                        triggered_at: n
                    };
                    s = h
                } catch {}
            }
            if (!s) return {
                kind: "failed",
                runtime: "claude",
                error: `session file not found for sdk_session_id=${t.sessionId}`,
                triggered_at: n
            };
            if (t.abortController?.signal.aborted) return {
                kind: "failed",
                runtime: "claude",
                error: "aborted",
                triggered_at: n
            };
            let a;
            try {
                a = await _9e(s, "utf8")
            } catch (m) {
                return {
                    kind: "failed",
                    runtime: "claude",
                    error: `failed to read session file: ${m instanceof Error?m.message.split(`
`)[0]:String(m)}`,
                    triggered_at: n
                }
            }
            let l = [],
                u = [],
                c = m => {
                    if (m.type !== "user") return !1;
                    let y = m.message?.content;
                    return typeof y == "string" ? !0 : Array.isArray(y) ? y.some(_ => !_ || typeof _ != "object" ? !0 : _.type !== "tool_result") : !0
                };
            for (let m of a.split(`
`)) {
                let h = m.trim();
                if (!h) continue;
                let y;
                try {
                    y = JSON.parse(h)
                } catch {
                    continue
                }
                if (y.isSidechain === !0 || typeof y.type != "string" || typeof y.uuid != "string" || y.uuid.length === 0) continue;
                let _ = l.length;
                l.push({
                    uuid: y.uuid,
                    type: y.type
                }), c(y) && u.push(_)
            }
            if (u.length === 0) return {
                kind: "noop",
                runtime: "claude",
                reason: "session has no real user turns to undo",
                triggered_at: n
            };
            if (t.numTurns >= u.length) return {
                kind: "noop",
                runtime: "claude",
                reason: "would drop entire conversation; use /clear instead",
                triggered_at: n
            };
            let p = u[u.length - t.numTurns] - 1;
            if (p < 0) return {
                kind: "noop",
                runtime: "claude",
                reason: "no entries before the first dropped turn; use /clear instead",
                triggered_at: n
            };
            let f = l[p].uuid;
            return {
                kind: "succeeded",
                runtime: "claude",
                sessionIdChanged: !0,
                droppedTurns: t.numTurns,
                cutoff_message_uuid: f,
                triggered_at: n
            }
        }
    }
}
