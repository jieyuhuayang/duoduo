// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAgentSdkAdapter  (minified: tu, daemon.pretty.js:48357)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAgentSdkAdapter() {
    let e = (t, n) => {
        let r = {},
            i = !!process.env.ALADUO_SDK_DEBUG;
        i && (r.debug = !0, r.stderr = c => {
            Kt("debug", "[claude-sdk stderr]", c)
        }), t.sessionId && (r.resume = t.sessionId), t.abortController && (r.abortController = t.abortController), t.cwd && (r.cwd = t.cwd), t.settingSources && (r.settingSources = t.settingSources), t.persistSession !== void 0 && (r.persistSession = t.persistSession), "outputFormat" in t && t.outputFormat && (r.outputFormat = t.outputFormat), "model" in t && t.model && (r.model = t.model), "effort" in t && t.effort && (r.effort = t.effort);
        let s = t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions";
        if (s && (r.permissionMode = s), t.systemPrompt !== void 0) r.systemPrompt = t.systemPrompt;
        else {
            let c = y_(process.env.SYSTEM_PROMPT),
                u = y_(process.env.APPEND_SYSTEM_PROMPT),
                p = [resolveMetaPromptText(), u].filter(f => !!f).join(`

`).trim();
            c && p ? r.systemPrompt = `${c}

${p}` : c ? r.systemPrompt = c : p && (r.systemPrompt = {
                type: "preset",
                preset: "claude_code",
                append: p
            })
        }
        if (t.allowedTools !== void 0 && (r.allowedTools = t.allowedTools), t.tools !== void 0) {
            let c = [...new Set(t.tools)];
            if (r.tools = c, Kt("info", `[claude-sdk] built-in tool surface (${c.length}): ${c.join(",")}`), t.allowedTools?.length) {
                let u = Yoe(t.allowedTools, c);
                u.length > 0 && se(`[claude-sdk] allowedTools no longer adds built-in tools to the surface (allowlist-only via claude.tools); not on this session's surface: ${u.join(",")} — move them to the descriptor's claude: { tools: [...] } if you meant to enable them`)
            }
        }
        if (t.disallowedTools !== void 0) {
            let {
                mcpTools: c,
                builtIns: u
            } = splitDisallowedToolsForClaude(t.disallowedTools);
            u.length > 0 && se(`[claude-sdk] disallowedTools no longer governs built-in tools (allowlist-only via claude.tools); ignoring: ${u.join(",")}`), c.length > 0 && (r.disallowedTools = c)
        }
        t.mcpServers && (r.mcpServers = t.mcpServers), t.additionalDirectories !== void 0 && (r.additionalDirectories = t.additionalDirectories);
        let o = {
            ...process.env
        };
        delete o.CLAUDECODE, (t.additionalDirectories?.length ?? 0) > 0 && t.autoloadAdditionalDirectoryClaudeMd !== !1 ? o.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1" : t.autoloadAdditionalDirectoryClaudeMd === !1 && delete o.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD, r.env = o;
        let a = process.env.CLAUDE_CODE_EXECUTABLE;
        if (a && a.trim().length > 0 && (r.pathToClaudeCodeExecutable = a), "hooks" in t && t.hooks && (r.hooks = t.hooks), n?.includePartialMessages && (r.includePartialMessages = !0), i) {
            let c = {
                cwd: r.cwd,
                settingSources: r.settingSources,
                persistSession: r.persistSession,
                permissionMode: r.permissionMode,
                allowedTools: r.allowedTools,
                disallowedTools: r.disallowedTools,
                tools: r.tools,
                includePartialMessages: r.includePartialMessages
            };
            Kt("debug", "[claude-sdk debug] execPath:", process.execPath), Kt("debug", "[claude-sdk debug] PATH:", process.env.PATH), Kt("debug", "[claude-sdk debug] options:", JSON.stringify(c))
        }
        return r
    };
    return {
        async run(t) {
            Woe();
            let n = t.sessionId,
                r, i, s = "",
                o = "",
                a = Date.now(),
                c = !1,
                u, l, d = !1,
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
                    matcher: g_,
                    hooks: [async F => (F?.agent_id !== void 0 || (p = !0, d = !0, K("[claude-sdk] Skip detected via PreToolUse hook (non-streaming)")), {
                        continue: !1,
                        stopReason: "The agent intentionally ended this turn silently by calling Skip."
                    })]
                }), L.PreToolUse = M, h.hooks = L
            }
            let _ = (L, M, F = !1) => {
                    if (!(!t.onStream || !L) && !d) {
                        if (c || (c = !0, u = Date.now() - a, Ci("sdk_first_token", t.sessionId ?? "new", {
                                ttftMs: u
                            })), F) {
                            t.onStream(L, !0);
                            return
                        }
                        if (M) {
                            s += L, o += L, t.onStream(L, !1);
                            return
                        }
                        if (o && L.startsWith(o)) {
                            let xe = L.slice(o.length);
                            xe && (s += xe, o = L, t.onStream(xe, !1));
                            return
                        }
                        if (L.startsWith(s)) {
                            let xe = L.slice(s.length);
                            xe && (s = L, o += xe, t.onStream(xe, !1));
                            return
                        }
                        s += L, o += L, t.onStream(L, !1)
                    }
                },
                b = new Map,
                w = new Map,
                v = L => {
                    if (t.onExecutionEvent) try {
                        t.onExecutionEvent(L)
                    } catch {}
                },
                g = L => {
                    let M = L.message?.content;
                    if (Array.isArray(M))
                        for (let F of M) {
                            if (!F || typeof F != "object") continue;
                            if (F.type === "tool_use") {
                                let Oe = F.id,
                                    ze = F.name,
                                    et = F.input;
                                Oe && ze && (b.set(Oe, ze), v({
                                    type: "tool_use",
                                    toolUseId: Oe,
                                    toolName: ze,
                                    input: et
                                }))
                            }
                        }
                },
                x = parsePositiveMsEnv(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4),
                k = null,
                E = !1,
                R = t.holdInputOpenForBackgroundAgents === !0,
                $ = new Set,
                I = !1,
                P = !R,
                C = () => {},
                j = R ? new Promise(L => {
                    C = L
                }) : Promise.resolve(),
                X = parsePositiveMsEnv(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5),
                W = null,
                Y = () => {
                    W && (clearTimeout(W), W = null)
                },
                G = () => {
                    P || I && $.size === 0 && (P = !0, Y(), C())
                },
                ae = () => {
                    P || (P = !0, Y(), C())
                },
                Ce = () => {
                    !R || P || (Y(), I && (W = setTimeout(() => {
                        P || (Kt("warn", "[claude-sdk] hold-input idle watchdog fired — SDK went silent with background Agent task(s) still tracked; force-releasing stdin to avoid an unbounded hang. If this was a legitimate long-running task, its continuation's in-process MCP call may fail; investigate.", JSON.stringify({
                            idleTimeoutMs: X,
                            inFlightAgentTaskIds: Array.from($)
                        })), ae())
                    }, X), typeof W == "object" && W?.unref && W.unref()))
                };
            async function* ue() {
                let L = typeof t.prompt == "string" ? GE(t.prompt) : t.prompt;
                for await (let M of L) yield M;
                await j
            }
            let Ne = Zoe({
                    prompt: R ? ue() : t.prompt,
                    options: h
                }),
                ot = () => {
                    k = setTimeout(() => {
                        E = !0, Pe("[claude-sdk] abort close timeout reached, closing query"), Ne.close()
                    }, x)
                };
            t.abortController?.signal.aborted ? ot() : t.abortController?.signal.addEventListener("abort", ot, {
                once: !0
            });
            let Se = !1,
                Xe = () => {
                    if (!Se) {
                        Se = !0;
                        try {
                            t.onTurnAcknowledged?.()
                        } catch {}
                    }
                };
            try {
                for await (let L of Ne) {
                    let M = L;
                    if (M.type === "system" && M.subtype === "init" || Xe(), M.type === "system") {
                        if (M.subtype === "init" && (n = M.session_id ?? n), R && M.subtype === "task_started") {
                            let F = M,
                                xe = typeof F.task_type == "string" ? F.task_type : void 0,
                                ze = F.subagent_type !== void 0 && F.subagent_type !== null || xe !== void 0 && xe !== "local_bash";
                            typeof F.task_id == "string" && F.task_id.length > 0 && ze && $.add(F.task_id)
                        }
                        if (R && M.subtype === "task_notification") {
                            let F = M;
                            typeof F.task_id == "string" && $.delete(F.task_id)
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
                        let F = zp(M),
                            xe = qE(M.event);
                        for (let yt of xe) _(yt.text, yt.isDelta, F);
                        let Oe = BE(M.event);
                        for (let yt of Oe) v({
                            type: "thought_chunk",
                            text: yt
                        });
                        let ze = HE(M.event);
                        ze && (w.set(ze.index, {
                            toolUseId: ze.toolUseId,
                            toolName: ze.toolName
                        }), b.set(ze.toolUseId, ze.toolName), v({
                            type: "tool_use",
                            toolUseId: ze.toolUseId,
                            toolName: ze.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let et = VE(M.event);
                        if (et) {
                            let yt = w.get(et.index);
                            yt && v({
                                type: "tool_input_delta",
                                toolUseId: yt.toolUseId,
                                toolName: yt.toolName,
                                partialJson: et.partialJson
                            })
                        }
                    }
                    if (typeof M.type == "string" && M.type.includes("assistant")) {
                        let F = zp(M),
                            xe = UE(M);
                        for (let Oe of xe) _(Oe.text, Oe.isDelta, F);
                        g(M)
                    }
                    if (M.type === "user") {
                        let F = M.message?.content;
                        if (Array.isArray(F))
                            for (let xe of F) {
                                if (!xe || typeof xe != "object") continue;
                                if (xe.type === "tool_result") {
                                    let ze = xe.tool_use_id,
                                        et = xe.is_error ?? !1,
                                        yt = xe.content;
                                    ze && (v({
                                        type: "tool_result",
                                        toolUseId: ze,
                                        toolName: b.get(ze),
                                        isError: et,
                                        summary: ZE(yt)
                                    }), o = "")
                                }
                            }
                    }
                    if (M.type === "result" && M.subtype === "success")
                        if (d) l = Up(M);
                        else {
                            let F = typeof M.result == "string" ? M.result : "";
                            F.length > 0 && (r = F, f = !0), M.structured_output !== void 0 && (i = M.structured_output, f = !0), l = Up(M)
                        } M.type === "result" && (d = !1), R && M.type === "result" && (I = !0, G()), R && !P && Ce()
                }
                if (E) throw Fp("SDK run force-closed after abort timeout", new Error("abort close timeout"))
            } catch (L) {
                throw m && Kt("error", "[claude-sdk error]", L instanceof Error ? L.stack ?? L.message : String(L)), t.abortController?.signal.aborted && !GJe(L) ? Fp("SDK run aborted", L) : L
            } finally {
                k && clearTimeout(k), t.abortController?.signal.removeEventListener("abort", ot), ae()
            }
            let Sn = p && !f;
            return {
                sessionId: n,
                text: Sn ? void 0 : r ?? (s || void 0),
                structured: Sn ? void 0 : i,
                usage: l,
                firstTokenLatencyMs: u,
                skipped: Sn || void 0
            }
        },
        createStreamingQuery(t) {
            return Woe(), {
                query: Zoe({
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
            let r = process.env.CLAUDE_CONFIG_DIR ?? qp.join(ZJe(), ".claude"),
                i = qp.join(r, "projects"),
                s = [];
            try {
                s = await HJe(i)
            } catch (m) {
                return {
                    kind: "failed",
                    runtime: "claude",
                    error: `failed to scan claude projects dir: ${m instanceof Error?m.message.split(`
`)[0]:String(m)}`,
                    triggered_at: n
                }
            }
            let o;
            for (let m of s) {
                let h = qp.join(i, m, `${t.sessionId}.jsonl`);
                try {
                    if (!(await VJe(h)).isFile()) continue;
                    if (o) return {
                        kind: "failed",
                        runtime: "claude",
                        error: "ambiguous session file lookup (multiple matches)",
                        triggered_at: n
                    };
                    o = h
                } catch {}
            }
            if (!o) return {
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
                a = await BJe(o, "utf8")
            } catch (m) {
                return {
                    kind: "failed",
                    runtime: "claude",
                    error: `failed to read session file: ${m instanceof Error?m.message.split(`
`)[0]:String(m)}`,
                    triggered_at: n
                }
            }
            let c = [],
                u = [],
                l = m => {
                    if (m.type !== "user") return !1;
                    let _ = m.message?.content;
                    return typeof _ == "string" ? !0 : Array.isArray(_) ? _.some(b => !b || typeof b != "object" ? !0 : b.type !== "tool_result") : !0
                };
            for (let m of a.split(`
`)) {
                let h = m.trim();
                if (!h) continue;
                let _;
                try {
                    _ = JSON.parse(h)
                } catch {
                    continue
                }
                if (_.isSidechain === !0 || typeof _.type != "string" || typeof _.uuid != "string" || _.uuid.length === 0) continue;
                let b = c.length;
                c.push({
                    uuid: _.uuid,
                    type: _.type
                }), l(_) && u.push(b)
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
            let f = c[p].uuid;
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
