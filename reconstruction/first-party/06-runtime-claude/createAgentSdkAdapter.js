// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAgentSdkAdapter  (minified: tc, daemon.pretty.js:48337)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAgentSdkAdapter() {
    let e = (t, n) => {
        let r = {},
            i = !!process.env.ALADUO_SDK_DEBUG;
        i && (r.debug = !0, r.stderr = u => {
            Yt("debug", "[claude-sdk stderr]", u)
        }), t.sessionId && (r.resume = t.sessionId), t.abortController && (r.abortController = t.abortController), t.cwd && (r.cwd = t.cwd), t.settingSources && (r.settingSources = t.settingSources), t.persistSession !== void 0 && (r.persistSession = t.persistSession), "outputFormat" in t && t.outputFormat && (r.outputFormat = t.outputFormat), "model" in t && t.model && (r.model = t.model), "effort" in t && t.effort && (r.effort = t.effort);
        let s = t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions";
        if (s && (r.permissionMode = s), t.systemPrompt !== void 0) r.systemPrompt = t.systemPrompt;
        else {
            let u = y_(process.env.SYSTEM_PROMPT),
                c = y_(process.env.APPEND_SYSTEM_PROMPT),
                p = [resolveMetaPromptText(), c].filter(f => !!f).join(`

`).trim();
            u && p ? r.systemPrompt = `${u}

${p}` : u ? r.systemPrompt = u : p && (r.systemPrompt = {
                type: "preset",
                preset: "claude_code",
                append: p
            })
        }
        if (t.allowedTools !== void 0 && (r.allowedTools = t.allowedTools), t.tools !== void 0) {
            let u = [...new Set(t.tools)];
            if (r.tools = u, Yt("info", `[claude-sdk] built-in tool surface (${u.length}): ${u.join(",")}`), t.allowedTools?.length) {
                let c = Joe(t.allowedTools, u);
                c.length > 0 && ie(`[claude-sdk] allowedTools no longer adds built-in tools to the surface (allowlist-only via claude.tools); not on this session's surface: ${c.join(",")} — move them to the descriptor's claude: { tools: [...] } if you meant to enable them`)
            }
        }
        if (t.disallowedTools !== void 0) {
            let {
                mcpTools: u,
                builtIns: c
            } = splitDisallowedToolsForClaude(t.disallowedTools);
            c.length > 0 && ie(`[claude-sdk] disallowedTools no longer governs built-in tools (allowlist-only via claude.tools); ignoring: ${c.join(",")}`), u.length > 0 && (r.disallowedTools = u)
        }
        t.mcpServers && (r.mcpServers = t.mcpServers), t.additionalDirectories !== void 0 && (r.additionalDirectories = t.additionalDirectories);
        let o = {
            ...process.env
        };
        delete o.CLAUDECODE, (t.additionalDirectories?.length ?? 0) > 0 && t.autoloadAdditionalDirectoryClaudeMd !== !1 ? o.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1" : t.autoloadAdditionalDirectoryClaudeMd === !1 && delete o.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD, r.env = o;
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
            Yt("debug", "[claude-sdk debug] execPath:", process.execPath), Yt("debug", "[claude-sdk debug] PATH:", process.env.PATH), Yt("debug", "[claude-sdk debug] options:", JSON.stringify(u))
        }
        return r
    };
    return {
        async run(t) {
            Voe();
            let n = t.sessionId,
                r, i, s = "",
                o = "",
                a = Date.now(),
                u = !1,
                c, l, d = !1,
                p = !!process.env.ALADUO_SDK_DEBUG,
                f = e(t, {
                    includePartialMessages: !!t.onStream
                });
            {
                let ze = f.hooks ?? {},
                    A = ze.PreToolUse ?? [];
                A.push({
                    matcher: h_,
                    hooks: [async () => (d = !0, J("[claude-sdk] Skip detected via PreToolUse hook (non-streaming)"), {})]
                }), ze.PreToolUse = A, f.hooks = ze
            }
            let m = !1,
                h = (ze, A, z = !1) => {
                    if (!(!t.onStream || !ze) && !d) {
                        if (u || (u = !0, c = Date.now() - a, Ai("sdk_first_token", t.sessionId ?? "new", {
                                ttftMs: c
                            })), z) {
                            t.onStream(ze, !0);
                            return
                        }
                        if (A) {
                            s += ze, o += ze, t.onStream(ze, !1);
                            return
                        }
                        if (o && ze.startsWith(o)) {
                            let H = ze.slice(o.length);
                            H && (s += H, o = ze, t.onStream(H, !1));
                            return
                        }
                        if (ze.startsWith(s)) {
                            let H = ze.slice(s.length);
                            H && (s = ze, o += H, t.onStream(H, !1));
                            return
                        }
                        s += ze, o += ze, t.onStream(ze, !1)
                    }
                },
                _ = new Map,
                b = new Map,
                v = ze => {
                    if (t.onExecutionEvent) try {
                        t.onExecutionEvent(ze)
                    } catch {}
                },
                w = ze => {
                    let A = ze.message?.content;
                    if (Array.isArray(A))
                        for (let z of A) {
                            if (!z || typeof z != "object") continue;
                            if (z.type === "tool_use") {
                                let U = z.id,
                                    Ce = z.name,
                                    Ae = z.input;
                                U && Ce && (_.set(U, Ce), v({
                                    type: "tool_use",
                                    toolUseId: U,
                                    toolName: Ce,
                                    input: Ae
                                }))
                            }
                        }
                },
                g = parsePositiveMsEnv(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4),
                x = null,
                k = !1,
                E = t.holdInputOpenForBackgroundAgents === !0,
                R = new Set,
                $ = !1,
                I = !E,
                P = () => {},
                C = E ? new Promise(ze => {
                    P = ze
                }) : Promise.resolve(),
                L = parsePositiveMsEnv(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5),
                G = null,
                K = () => {
                    G && (clearTimeout(G), G = null)
                },
                Q = () => {
                    I || $ && R.size === 0 && (I = !0, K(), P())
                },
                W = () => {
                    I || (I = !0, K(), P())
                },
                ae = () => {
                    !E || I || (K(), $ && (G = setTimeout(() => {
                        I || (Yt("warn", "[claude-sdk] hold-input idle watchdog fired — SDK went silent with background Agent task(s) still tracked; force-releasing stdin to avoid an unbounded hang. If this was a legitimate long-running task, its continuation's in-process MCP call may fail; investigate.", JSON.stringify({
                            idleTimeoutMs: L,
                            inFlightAgentTaskIds: Array.from(R)
                        })), W())
                    }, L), typeof G == "object" && G?.unref && G.unref()))
                };
            async function* Oe() {
                let ze = typeof t.prompt == "string" ? JE(t.prompt) : t.prompt;
                for await (let A of ze) yield A;
                await C
            }
            let X = Boe({
                    prompt: E ? Oe() : t.prompt,
                    options: f
                }),
                Ue = () => {
                    x = setTimeout(() => {
                        k = !0, Pe("[claude-sdk] abort close timeout reached, closing query"), X.close()
                    }, g)
                };
            t.abortController?.signal.aborted ? Ue() : t.abortController?.signal.addEventListener("abort", Ue, {
                once: !0
            });
            let Nt = !1,
                Se = () => {
                    if (!Nt) {
                        Nt = !0;
                        try {
                            t.onTurnAcknowledged?.()
                        } catch {}
                    }
                };
            try {
                for await (let ze of X) {
                    let A = ze;
                    if (A.type === "system" && A.subtype === "init" || Se(), A.type === "system") {
                        if (A.subtype === "init" && (n = A.session_id ?? n), E && A.subtype === "task_started") {
                            let z = A,
                                H = typeof z.task_type == "string" ? z.task_type : void 0,
                                Ce = z.subagent_type !== void 0 && z.subagent_type !== null || H !== void 0 && H !== "local_bash";
                            typeof z.task_id == "string" && z.task_id.length > 0 && Ce && R.add(z.task_id)
                        }
                        if (E && A.subtype === "task_notification") {
                            let z = A;
                            typeof z.task_id == "string" && R.delete(z.task_id)
                        }
                        v({
                            type: "system",
                            subtype: A.subtype ?? "unknown",
                            data: A.subtype === "init" ? {
                                session_id: A.session_id
                            } : void 0
                        })
                    }
                    if (A.type === "stream_event") {
                        let z = Lp(A),
                            H = UE(A.event);
                        for (let Ke of H) h(Ke.text, Ke.isDelta, z);
                        let U = qE(A.event);
                        for (let Ke of U) v({
                            type: "thought_chunk",
                            text: Ke
                        });
                        let Ce = BE(A.event);
                        Ce && (b.set(Ce.index, {
                            toolUseId: Ce.toolUseId,
                            toolName: Ce.toolName
                        }), _.set(Ce.toolUseId, Ce.toolName), v({
                            type: "tool_use",
                            toolUseId: Ce.toolUseId,
                            toolName: Ce.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let Ae = HE(A.event);
                        if (Ae) {
                            let Ke = b.get(Ae.index);
                            Ke && v({
                                type: "tool_input_delta",
                                toolUseId: Ke.toolUseId,
                                toolName: Ke.toolName,
                                partialJson: Ae.partialJson
                            })
                        }
                    }
                    if (typeof A.type == "string" && A.type.includes("assistant")) {
                        let z = Lp(A),
                            H = FE(A);
                        for (let U of H) h(U.text, U.isDelta, z);
                        w(A)
                    }
                    if (A.type === "user") {
                        let z = A.message?.content,
                            H = !1;
                        if (Array.isArray(z))
                            for (let U of z) {
                                if (!U || typeof U != "object") continue;
                                if (U.type === "tool_result") {
                                    H = !0;
                                    let Ae = U.tool_use_id,
                                        Ke = U.is_error ?? !1,
                                        _t = U.content;
                                    Ae && (v({
                                        type: "tool_result",
                                        toolUseId: Ae,
                                        toolName: _.get(Ae),
                                        isError: Ke,
                                        summary: VE(_t)
                                    }), o = "")
                                }
                            }
                        H && d && !m && (m = !0, typeof X.interrupt == "function" && (J("[claude-sdk] Skip called — interrupting turn (non-streaming)"), Promise.resolve(X.interrupt()).catch(U => {
                            J("[claude-sdk] skip interrupt failed (non-streaming)", {
                                error: U instanceof Error ? U.message : String(U)
                            })
                        })))
                    }
                    A.type === "result" && A.subtype === "success" && (typeof A.result == "string" && (r = A.result), A.structured_output !== void 0 && (i = A.structured_output), l = g_(A)), E && A.type === "result" && ($ = !0, Q()), E && !I && ae()
                }
                if (k) throw Mp("SDK run force-closed after abort timeout", new Error("abort close timeout"))
            } catch (ze) {
                throw p && Yt("error", "[claude-sdk error]", ze instanceof Error ? ze.stack ?? ze.message : String(ze)), t.abortController?.signal.aborted && !LWe(ze) ? Mp("SDK run aborted", ze) : ze
            } finally {
                x && clearTimeout(x), t.abortController?.signal.removeEventListener("abort", Ue), W()
            }
            return {
                sessionId: n,
                text: d ? void 0 : r ?? (s || void 0),
                structured: d ? void 0 : i,
                usage: l,
                firstTokenLatencyMs: c,
                skipped: d || void 0
            }
        },
        createStreamingQuery(t) {
            return Voe(), {
                query: Boe({
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
            let r = process.env.CLAUDE_CONFIG_DIR ?? zp.join(NWe(), ".claude"),
                i = zp.join(r, "projects"),
                s = [];
            try {
                s = await CWe(i)
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
                let h = zp.join(i, m, `${t.sessionId}.jsonl`);
                try {
                    if (!(await AWe(h)).isFile()) continue;
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
                a = await OWe(o, "utf8")
            } catch (m) {
                return {
                    kind: "failed",
                    runtime: "claude",
                    error: `failed to read session file: ${m instanceof Error?m.message.split(`
`)[0]:String(m)}`,
                    triggered_at: n
                }
            }
            let u = [],
                c = [],
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
                let b = u.length;
                u.push({
                    uuid: _.uuid,
                    type: _.type
                }), l(_) && c.push(b)
            }
            if (c.length === 0) return {
                kind: "noop",
                runtime: "claude",
                reason: "session has no real user turns to undo",
                triggered_at: n
            };
            if (t.numTurns >= c.length) return {
                kind: "noop",
                runtime: "claude",
                reason: "would drop entire conversation; use /clear instead",
                triggered_at: n
            };
            let p = c[c.length - t.numTurns] - 1;
            if (p < 0) return {
                kind: "noop",
                runtime: "claude",
                reason: "no entries before the first dropped turn; use /clear instead",
                triggered_at: n
            };
            let f = u[p].uuid;
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
