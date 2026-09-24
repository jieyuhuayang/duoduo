// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: createPiWorkerAdapter  (minified: TO, daemon.pretty.js:72768)
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
        p = $ => {
            let C;
            return {
                promise: new Promise((F, k) => {
                    C = {
                        match: $,
                        resolve: F,
                        reject: k
                    }, d.add(C)
                }),
                cancel: () => C && d.delete(C)
            }
        },
        m = $ => {
            let C = r;
            if (C) {
                if (C.stdin.writableEnded || C.stdin.destroyed) {
                    t(`pi adapter: frame dropped, worker stdin closed: ${$.type}`);
                    return
                }
                C.stdin.write(encodePiWorkerFrame($))
            }
        },
        h = $ => {
            for (let C of d)
                if (C.match($)) {
                    d.delete(C), C.resolve($);
                    return
                }
        },
        g = () => {
            f = null
        },
        y = $ => {
            let C = f;
            if (!C || C.turnId !== $.turn_id) return;
            let A = $.event,
                F = null;
            if (A.kind === "tool_start") {
                let k = A.args_json === "" ? void 0 : A.args_json;
                try {
                    A.args_json !== "" && (k = JSON.parse(A.args_json))
                } catch {}
                F = {
                    type: "tool_use",
                    toolUseId: A.tool_call_id,
                    toolName: A.tool_name,
                    input: k
                }
            } else A.kind === "tool_delta" ? F = {
                type: "tool_input_delta",
                toolUseId: A.tool_call_id,
                toolName: A.tool_name,
                partialJson: A.delta
            } : (A.tool_name === "Skip" && (C.skipObserved = !0), e.onToolEnd && C.pendingToolEndEffects.push(Promise.resolve(e.onToolEnd({
                tool_name: A.tool_name,
                result_json: A.result_json,
                is_error: A.is_error
            })).catch(k => {
                t(`pi adapter: tool-end effect failed: ${String(k)}`)
            })), F = {
                type: "tool_result",
                toolUseId: A.tool_call_id,
                toolName: A.tool_name,
                isError: A.is_error,
                summary: A.result_json
            });
            C.onExecutionEvent?.(F)
        },
        v = $ => {
            switch ($.type) {
                case "stream":
                    f && f.turnId === $.turn_id && f.onStream?.($.delta);
                    return;
                case "thought":
                    f && f.turnId === $.turn_id && f.onExecutionEvent?.({
                        type: "thought_chunk",
                        text: $.delta
                    });
                    return;
                case "exec":
                    y($);
                    return;
                case "notify":
                    e.onNotify?.($.text);
                    return;
                case "run_ack":
                    $.accepted && f && f.turnId === $.turn_id && (f.acceptedAt = Date.now()), h($);
                    return;
                case "orphan_run":
                    t(`pi adapter: orphan_run ${$.phase}`);
                    return;
                default: {
                    if (!Hft.has($.type)) {
                        t(`pi adapter: unknown frame type ignored: ${String($.type)}`);
                        return
                    }
                    h($)
                }
            }
        },
        b = $ => {
            r = null, o || (i = null);
            for (let C of [...d]) d.delete(C), C.reject($);
            g()
        },
        _ = async $ => {
            let C = o;
            if (C && (await C, !$())) throw new Error("pi adapter: connect cancelled by shutdown");
            let A = mke(e.workerCommand.command, e.workerCommand.args, {
                cwd: e.cwd,
                env: {
                    ...process.env,
                    ...e.env
                },
                stdio: ["pipe", "pipe", "pipe"]
            });
            r = A, A.on("error", k => {
                r === A && b(k)
            }), A.on("exit", k => {
                r === A && b(new Error(`pi worker exited (code ${String(k)})`))
            }), Ll(A.stdout, k => {
                if (r !== A) return;
                let N = RH(k);
                if (!N) {
                    k.trim() && t("pi adapter: non-frame stdout line skipped");
                    return
                }
                v(N)
            }), A.stderr.on("data", k => {
                for (let N of k.toString().split(`
`)) N.trim() && t(`pi worker: ${N}`)
            }), A.stdin.on("error", k => {
                t(`pi adapter: worker stdin error: ${String(k)}`)
            });
            let F = p(k => k.type === "ready" || k.type === "init_error");
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
                let k = await F.promise;
                if (k.type === "init_error") throw new Error(`pi worker init failed: ${k.reason}`);
                if (k.type !== "ready") throw new Error("pi worker: unexpected frame before ready");
                return s = k.session_id, u = a, t(`pi adapter: ready session=${s}`), s
            } finally {
                F.cancel()
            }
        }, I = () => {
            if (!i) {
                let $ = _(() => i === $).catch(C => {
                    throw i === $ && (i = null), C
                });
                i = $
            }
            return i
        }, E = async $ => {
            if (typeof $.prompt != "string") throw new Error("pi adapter: prompt must be a string (streaming generators are claude-only)");
            if (f) throw new Error("pi adapter: a run is already in flight (single-inflight violation)");
            if ($.abortController?.signal.aborted) throw new AgentSdkPromptNotAcceptedAbortError;
            $.tools && n("pi adapter: RunInput.tools carries the claude builtin surface — ignored on pi (§3 no-op table)");
            let C = `pi-turn-${++c}-${Date.now()}`;
            f = {
                turnId: C,
                acceptedAt: void 0,
                skipObserved: !1,
                pendingToolEndEffects: [],
                onStream: $.onStream,
                onExecutionEvent: $.onExecutionEvent
            };
            let A = f,
                F = () => m({
                    type: "abort",
                    turn_id: C,
                    reason: normalizeTurnAbortReason($.abortController?.signal.reason)
                });
            $.abortController?.signal.addEventListener("abort", F, {
                once: !0
            });
            try {
                let k = Bft($.disallowedTools);
                !r && !i ? (a = k, l = buildPiSystemPromptSpec($.systemPrompt)) : Vft(u ?? a, k) || t("pi adapter: disallowedTools changed after worker init — exclusions apply after the worker recycles");
                let N = $.abortController?.signal;
                if (N) {
                    let fe, j = new Promise((ue, Ie) => {
                        let ae = () => Ie(new AgentSdkPromptNotAcceptedAbortError);
                        N.addEventListener("abort", ae, {
                            once: !0
                        }), fe = () => N.removeEventListener("abort", ae)
                    });
                    j.catch(() => {});
                    try {
                        await Promise.race([I(), j])
                    } catch (ue) {
                        throw ue instanceof AgentSdkPromptNotAcceptedAbortError && D(), ue
                    } finally {
                        fe?.()
                    }
                } else await I();
                if ($.abortController?.signal.aborted) throw new AgentSdkPromptNotAcceptedAbortError;
                let V = pke($.attachments),
                    W = p(fe => fe.type === "run_ack" && fe.turn_id === C),
                    ce = p(fe => fe.type === "settled" && fe.turn_id === C);
                ce.promise.catch(() => {}), m({
                    type: "run",
                    turn_id: C,
                    prompt: $.prompt,
                    images: V.length > 0 ? V : void 0
                });
                let J = await W.promise;
                if (!J.accepted) throw ce.cancel(), $.onTurnRejected?.(), new Error(`pi worker rejected run: ${J.reason??"unknown"}`);
                $.onTurnAcknowledged?.();
                let ne = await ce.promise;
                if (ne.aborted) {
                    if (A.skipObserved) return {
                        sessionId: s,
                        text: ne.text,
                        structured: void 0,
                        usage: fke(ne.usage, e.model),
                        firstTokenLatencyMs: ne.first_token_latency_ms,
                        skipped: !0
                    };
                    throw new AgentSdkTurnInterruptedError
                }
                if (ne.error) throw new Error(`pi run failed: ${ne.error}`);
                return {
                    sessionId: s,
                    text: ne.text,
                    structured: void 0,
                    usage: fke(ne.usage, e.model),
                    firstTokenLatencyMs: ne.first_token_latency_ms,
                    skipped: A.skipObserved
                }
            } finally {
                $.abortController?.signal.removeEventListener("abort", F), A.pendingToolEndEffects.length > 0 && await Promise.all(A.pendingToolEndEffects), f === A && g()
            }
        }, R = async ($, C, A) => {
            if (!r || !f?.acceptedAt || f.turnId !== C) return !1;
            let F = pke(A),
                k = p(V => V.type === "steer_result" && V.turn_id === C);
            return m({
                type: "steer",
                turn_id: C,
                text: $,
                images: F.length > 0 ? F : void 0
            }), (await k.promise).landed
        }, x = async $ => {
            let C = new Date().toISOString(),
                A = () => m({
                    type: "abort",
                    turn_id: "compact"
                }),
                F = !r && !i;
            try {
                await I(), $.abortController?.signal.addEventListener("abort", A, {
                    once: !0
                });
                let k = p(W => W.type === "compact_result");
                m({
                    type: "compact"
                });
                let V = (await k.promise).outcome;
                return V.kind === "succeeded" ? {
                    kind: "succeeded",
                    runtime: IO,
                    pre_input_tokens: V.pre_input_tokens,
                    summary_excerpt: V.summary_excerpt,
                    triggered_at: C
                } : V.kind === "noop" ? {
                    kind: "noop",
                    runtime: IO,
                    reason: V.reason,
                    triggered_at: C
                } : {
                    kind: "failed",
                    runtime: IO,
                    error: V.error,
                    triggered_at: C
                }
            } catch (k) {
                return {
                    kind: "failed",
                    runtime: IO,
                    error: String(k.message ?? k),
                    triggered_at: C
                }
            } finally {
                $.abortController?.signal.removeEventListener("abort", A), F && await D()
            }
        }, S = async $ => {
            if ($.exitCode !== null || $.signalCode !== null) return;
            let C = new Promise(F => {
                    $.once("exit", () => F())
                }),
                A = F => new Promise(k => {
                    let N = setTimeout(() => k(!1), F);
                    C.then(() => {
                        clearTimeout(N), k(!0)
                    })
                });
            $.stdin.end(), !await A(dke) && ($.kill("SIGTERM"), !await A(dke) && ($.kill("SIGKILL"), await C))
        }, D = () => {
            if (i = null, o) return o;
            let $ = r;
            if (!$) return Promise.resolve();
            let C = S($).finally(() => {
                r === $ && (r = null), o = null
            });
            return o = C, C
        };
    return {
        run: E,
        compact: x,
        steerActiveTurn: R,
        activeTurnId: () => f?.acceptedAt !== void 0 ? f.turnId : void 0,
        activeTurnStartedAt: () => f?.acceptedAt,
        activeTurnSkipObserved: () => f?.skipObserved === !0,
        shutdown: D,
        connect: I
    }
}
