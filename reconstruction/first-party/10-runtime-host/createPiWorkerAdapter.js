// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: createPiWorkerAdapter  (minified: vA, daemon.pretty.js:73070)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createPiWorkerAdapter(e) {
    let t = e.logDebug ?? (() => {}),
        n = e.logWarn ?? t,
        r = null,
        i = null,
        o = null,
        s, a, u, l, c = 0,
        d = new Set,
        f = null,
        p = A => {
            let $;
            return {
                promise: new Promise((N, x) => {
                    $ = {
                        match: A,
                        resolve: N,
                        reject: x
                    }, d.add($)
                }),
                cancel: () => $ && d.delete($)
            }
        },
        m = A => {
            let $ = r;
            if ($) {
                if ($.stdin.writableEnded || $.stdin.destroyed) {
                    t(`pi adapter: frame dropped, worker stdin closed: ${A.type}`);
                    return
                }
                $.stdin.write(encodePiWorkerFrame(A))
            }
        },
        h = A => {
            for (let $ of d)
                if ($.match(A)) {
                    d.delete($), $.resolve(A);
                    return
                }
        },
        g = () => {
            f = null
        },
        y = A => {
            let $ = f;
            if (!$ || $.turnId !== A.turn_id) return;
            let C = A.event,
                N = null;
            if (C.kind === "tool_start") {
                let x = C.args_json === "" ? void 0 : C.args_json;
                try {
                    C.args_json !== "" && (x = JSON.parse(C.args_json))
                } catch {}
                N = {
                    type: "tool_use",
                    toolUseId: C.tool_call_id,
                    toolName: C.tool_name,
                    input: x
                }
            } else C.kind === "tool_delta" ? N = {
                type: "tool_input_delta",
                toolUseId: C.tool_call_id,
                toolName: C.tool_name,
                partialJson: C.delta
            } : (C.tool_name === "Skip" && ($.skipObserved = !0), e.onToolEnd && $.pendingToolEndEffects.push(Promise.resolve(e.onToolEnd({
                tool_name: C.tool_name,
                result_json: C.result_json,
                is_error: C.is_error
            })).catch(x => {
                t(`pi adapter: tool-end effect failed: ${String(x)}`)
            })), N = {
                type: "tool_result",
                toolUseId: C.tool_call_id,
                toolName: C.tool_name,
                isError: C.is_error,
                summary: C.result_json
            });
            $.onExecutionEvent?.(N)
        },
        v = A => {
            switch (A.type) {
                case "stream":
                    f && f.turnId === A.turn_id && f.onStream?.(A.delta);
                    return;
                case "thought":
                    f && f.turnId === A.turn_id && f.onExecutionEvent?.({
                        type: "thought_chunk",
                        text: A.delta
                    });
                    return;
                case "exec":
                    y(A);
                    return;
                case "notify":
                    e.onNotify?.(A.text);
                    return;
                case "run_ack":
                    A.accepted && f && f.turnId === A.turn_id && (f.acceptedAt = Date.now()), h(A);
                    return;
                case "orphan_run":
                    t(`pi adapter: orphan_run ${A.phase}`);
                    return;
                default: {
                    if (!Tht.has(A.type)) {
                        t(`pi adapter: unknown frame type ignored: ${String(A.type)}`);
                        return
                    }
                    h(A)
                }
            }
        },
        b = A => {
            r = null, o || (i = null);
            for (let $ of [...d]) d.delete($), $.reject(A);
            g()
        },
        _ = async A => {
            let $ = o;
            if ($ && (await $, !A())) throw new Error("pi adapter: connect cancelled by shutdown");
            let C = iEe(e.workerCommand.command, e.workerCommand.args, {
                cwd: e.cwd,
                env: {
                    ...process.env,
                    ...e.env
                },
                stdio: ["pipe", "pipe", "pipe"]
            });
            r = C, C.on("error", x => {
                r === C && b(x)
            }), C.on("exit", x => {
                r === C && b(new Error(`pi worker exited (code ${String(x)})`))
            }), Xl(C.stdout, x => {
                if (r !== C) return;
                let M = LW(x);
                if (!M) {
                    x.trim() && t("pi adapter: non-frame stdout line skipped");
                    return
                }
                v(M)
            }), C.stderr.on("data", x => {
                for (let M of x.toString().split(`
`)) M.trim() && t(`pi worker: ${M}`)
            }), C.stdin.on("error", x => {
                t(`pi adapter: worker stdin error: ${String(x)}`)
            });
            let N = p(x => x.type === "ready" || x.type === "init_error");
            m({
                type: "init",
                cwd: e.cwd,
                agent_dir: e.agentDir,
                session: {
                    id: e.sdkSessionId,
                    in_memory: e.inMemorySession
                },
                session_dir: e.sessionDir,
                auth_path: e.authPath,
                models_path: e.modelsPath,
                models_store_path: e.modelsStorePath,
                settings_seed: e.settingsSeed,
                resources: e.resources,
                model: e.model,
                exclude_tools: a,
                thinking_level: e.thinkingLevel,
                system_prompt: l
            });
            try {
                let x = await N.promise;
                if (x.type === "init_error") throw new Error(`pi worker init failed: ${x.reason}`);
                if (x.type !== "ready") throw new Error("pi worker: unexpected frame before ready");
                return s = x.session_id, u = a, t(`pi adapter: ready session=${s}`), s
            } finally {
                N.cancel()
            }
        }, E = () => {
            if (!i) {
                let A = _(() => i === A).catch($ => {
                    throw i === A && (i = null), $
                });
                i = A
            }
            return i
        }, R = async A => {
            if (typeof A.prompt != "string") throw new Error("pi adapter: prompt must be a string (streaming generators are claude-only)");
            if (f) throw new Error("pi adapter: a run is already in flight (single-inflight violation)");
            if (A.abortController?.signal.aborted) throw new AgentSdkPromptNotAcceptedAbortError;
            A.tools && n("pi adapter: RunInput.tools carries the claude builtin surface — ignored on pi (§3 no-op table)");
            let $ = `pi-turn-${++c}-${Date.now()}`;
            f = {
                turnId: $,
                acceptedAt: void 0,
                skipObserved: !1,
                pendingToolEndEffects: [],
                onStream: A.onStream,
                onExecutionEvent: A.onExecutionEvent
            };
            let C = f,
                N = () => m({
                    type: "abort",
                    turn_id: $,
                    reason: normalizeTurnAbortReason(A.abortController?.signal.reason)
                });
            A.abortController?.signal.addEventListener("abort", N, {
                once: !0
            });
            try {
                let x = Rht(A.disallowedTools);
                !r && !i ? (a = x, l = buildPiSystemPromptSpec(A.systemPrompt)) : Iht(u ?? a, x) || t("pi adapter: disallowedTools changed after worker init — exclusions apply after the worker recycles");
                let M = A.abortController?.signal;
                if (M) {
                    let se, j = new Promise((ne, K) => {
                        let te = () => K(new AgentSdkPromptNotAcceptedAbortError);
                        M.addEventListener("abort", te, {
                            once: !0
                        }), se = () => M.removeEventListener("abort", te)
                    });
                    j.catch(() => {});
                    try {
                        await Promise.race([E(), j])
                    } catch (ne) {
                        throw ne instanceof AgentSdkPromptNotAcceptedAbortError && D(), ne
                    } finally {
                        se?.()
                    }
                } else await E();
                if (A.abortController?.signal.aborted) throw new AgentSdkPromptNotAcceptedAbortError;
                let F = rEe(A.attachments),
                    J = p(se => se.type === "run_ack" && se.turn_id === $),
                    ce = p(se => se.type === "settled" && se.turn_id === $);
                ce.promise.catch(() => {}), m({
                    type: "run",
                    turn_id: $,
                    prompt: A.prompt,
                    images: F.length > 0 ? F : void 0
                });
                let ie = await J.promise;
                if (!ie.accepted) throw ce.cancel(), A.onTurnRejected?.(), new Error(`pi worker rejected run: ${ie.reason??"unknown"}`);
                A.onTurnAcknowledged?.();
                let Ce = await ce.promise;
                if (Ce.aborted) {
                    if (C.skipObserved) return {
                        sessionId: s,
                        text: Ce.text,
                        structured: void 0,
                        usage: nEe(Ce.usage, e.model),
                        firstTokenLatencyMs: Ce.first_token_latency_ms,
                        skipped: !0
                    };
                    throw new AgentSdkTurnInterruptedError
                }
                if (Ce.error) throw new Error(`pi run failed: ${Ce.error}`);
                return {
                    sessionId: s,
                    text: Ce.text,
                    structured: void 0,
                    usage: nEe(Ce.usage, e.model),
                    firstTokenLatencyMs: Ce.first_token_latency_ms,
                    skipped: C.skipObserved
                }
            } finally {
                A.abortController?.signal.removeEventListener("abort", N), C.pendingToolEndEffects.length > 0 && await Promise.all(C.pendingToolEndEffects), f === C && g()
            }
        }, P = async (A, $, C) => {
            if (!r || !f?.acceptedAt || f.turnId !== $) return !1;
            let N = rEe(C),
                x = p(F => F.type === "steer_result" && F.turn_id === $);
            return m({
                type: "steer",
                turn_id: $,
                text: A,
                images: N.length > 0 ? N : void 0
            }), (await x.promise).landed
        }, k = async A => {
            let $ = new Date().toISOString(),
                C = () => m({
                    type: "abort",
                    turn_id: "compact"
                }),
                N = !r && !i;
            try {
                await E(), A.abortController?.signal.addEventListener("abort", C, {
                    once: !0
                });
                let x = p(J => J.type === "compact_result");
                m({
                    type: "compact"
                });
                let F = (await x.promise).outcome;
                return F.kind === "succeeded" ? {
                    kind: "succeeded",
                    runtime: bA,
                    pre_input_tokens: F.pre_input_tokens,
                    summary_excerpt: F.summary_excerpt,
                    triggered_at: $
                } : F.kind === "noop" ? {
                    kind: "noop",
                    runtime: bA,
                    reason: F.reason,
                    triggered_at: $
                } : {
                    kind: "failed",
                    runtime: bA,
                    error: F.error,
                    triggered_at: $
                }
            } catch (x) {
                return {
                    kind: "failed",
                    runtime: bA,
                    error: String(x.message ?? x),
                    triggered_at: $
                }
            } finally {
                A.abortController?.signal.removeEventListener("abort", C), N && await D()
            }
        }, S = async A => {
            if (A.exitCode !== null || A.signalCode !== null) return;
            let $ = new Promise(N => {
                    A.once("exit", () => N())
                }),
                C = N => new Promise(x => {
                    let M = setTimeout(() => x(!1), N);
                    $.then(() => {
                        clearTimeout(M), x(!0)
                    })
                });
            A.stdin.end(), !await C(tEe) && (A.kill("SIGTERM"), !await C(tEe) && (A.kill("SIGKILL"), await $))
        }, D = () => {
            if (i = null, o) return o;
            let A = r;
            if (!A) return Promise.resolve();
            let $ = S(A).finally(() => {
                r === A && (r = null), o = null
            });
            return o = $, $
        };
    return {
        run: R,
        compact: k,
        steerActiveTurn: P,
        activeTurnId: () => f?.acceptedAt !== void 0 ? f.turnId : void 0,
        activeTurnStartedAt: () => f?.acceptedAt,
        activeTurnSkipObserved: () => f?.skipObserved === !0,
        shutdown: D,
        connect: E
    }
}
