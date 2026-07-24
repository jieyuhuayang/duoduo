// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMetaSession  (minified: oet, daemon.pretty.js:74212)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createMetaSession(e) {
    let {
        paths: t,
        bus: n,
        sessionManager: r
    } = e, i = e.sdk, s = e.sessionKey ?? "meta:subconscious", o = e.codexAvailability ?? checkCodexAvailability, a = e.codexAdapterFactory ?? (() => createCodexAppServerAdapter({
        sandbox: resolveCodexSandbox(),
        ephemeral: !0,
        dynamicTools: zI({
            paths: t,
            sessionKey: s,
            bus: n,
            sessionContextKind: "meta"
        })
    })), u = e.maxPartitionsPerIdleTick ?? 2, c = e.cadenceIntervalMs ?? N2, l = !1, d = !1, p = null, f = !1, m = null, h = 0, _ = new Map;
    async function b(k, E, R) {
        let $ = await Promise.all(k.map(async P => [P.name, await Ab(t, P.name)])),
            I = new Map($);
        for (;;) {
            let P = await sm(t);
            if (P.allDone) {
                if (await jce(t) === 0) return null;
                P = await sm(t)
            }
            let C = w(P.items, k, R, I, new Date);
            if (!C) return null;
            let L = k.find(W => W.name === C.name);
            if (!L || !L.schedule.enabled) {
                let W = P.items.filter(X => !X.done).length;
                await cR(t, C.name);
                let Oe = (await sm(t)).items.filter(X => !X.done).length;
                if (Oe >= W) return ie("[meta-session] stale playlist item did not advance", {
                    name: C.name,
                    reason: L ? "disabled" : "removed",
                    beforeUnchecked: W,
                    afterUnchecked: Oe
                }), null;
                Pe("[meta-session] skipping unavailable partition, will retry next", {
                    name: C.name,
                    reason: L ? "disabled" : "removed"
                });
                continue
            }
            let G = await v(L, E, R),
                Q = (await Promise.all(k.map(async W => [W.name, await Ab(t, W.name)]))).filter(([, W]) => A2(W, new Date)).map(([W]) => W);
            return {
                ...G,
                backedOff: Q
            }
        }
    }
    async function v(k, E, R) {
        let $ = Date.now(),
            I, P, C = 0,
            L = 0,
            G = k.runtime,
            K = G ?? Ou();
        J("[v12-observe] partition runtime selected", {
            partition: k.name,
            runtime: K,
            requestedRuntime: G ?? null,
            sdkInjected: !!i
        });
        let Q, W, ae = async N => {
            let M = Date.now() - $,
                ee = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${k.name}`
                    },
                    session_key: s,
                    payload: {
                        stage: "partition_execution",
                        partition: k.name,
                        outcome: "runtime_unavailable",
                        runtime: K,
                        runtime_source: G ? "explicit" : "default",
                        error: `runtime '${K}' is unavailable: ${N}`
                    }
                });
            await atomicAppendEvent(t, ee), await advanceConsumerWatermark(t, "meta_session", ee.id, new Date(ee.ts)), ie("[meta-session] partition skipped: requested runtime unavailable", {
                partition: k.name,
                runtime: K,
                requestedFrom: G ? "frontmatter" : "default",
                reason: N
            }), await cR(t, k.name), _.set(k.name, R);
            let ke = await Ab(t, k.name),
                ct = new Date,
                Ne = {
                    last_started_at: new Date($).toISOString(),
                    last_finished_at: ct.toISOString(),
                    last_result: "error",
                    consecutive_failures: ke.consecutive_failures + 1,
                    backoff_until: D2("error", ke.consecutive_failures + 1, ct, c)
                };
            return await C2(t, k.name, Ne), {
                name: k.name,
                outcome: "error",
                durationMs: M,
                backedOff: []
            }
        }, Oe = claudeUnavailableReason();
        if (K === "claude" && !i && Oe) return await ae(Oe);
        if (i && K === "claude") Q = i;
        else if (K === "codex") {
            let N = await o();
            if (J("[v12-observe] codex probe result", {
                    partition: k.name,
                    probeOk: N.ok,
                    probeReason: N.ok ? null : N.reason
                }), !N.ok) return await ae(N.reason);
            J("[v12-observe] codex adapter spawn", {
                partition: k.name,
                sandbox: resolveCodexSandbox()
            });
            let M = a();
            Q = M, W = () => M.shutdown()
        } else Q = createAgentSdkAdapter();
        let X = [],
            Ue = !1,
            Nt = partitionInboxDir(t, k.name),
            Se = await Lce(t, k.name),
            st = set(k, Nt, Se),
            ze = `### Partition
- Name: ${k.name}
- cwd: ${k.dir}/
- Inbox: ${Nt}/
`,
            A = st ? `${k.promptContent}

${ze}
${E}

${st}` : `${k.promptContent}

${ze}
${E}`,
            z = MI(t, {
                sessionKey: s,
                bus: n,
                sessionContextKind: "meta"
            }),
            H = [...new Set([...PARTITION_CORE_TOOLS, ...k.claudeTools ?? []])],
            U = new AbortController;
        J("[meta-session] executing partition", {
            partition: k.name
        });
        let Ce = Q.run({
                prompt: JE(A),
                cwd: k.dir,
                settingSources: ["user", "project"],
                persistSession: !1,
                mcpServers: {
                    aladuo: z
                },
                holdInputOpenForBackgroundAgents: !0,
                additionalDirectories: [t.memoryDir],
                autoloadAdditionalDirectoryClaudeMd: !1,
                tools: H,
                abortController: U,
                onStream: (N, M) => {
                    Ue || n.emit("session.stream", {
                        sessionKey: s,
                        chunk: N,
                        isSidechain: M
                    })
                },
                onExecutionEvent: N => {
                    Ue || (N.type === "tool_use" ? C += 1 : N.type === "tool_result" && N.isError && (L += 1), X.push(XXe(t, s, k.name, N).catch(M => {
                        ie("[meta-session] failed to persist execution event", {
                            partition: k.name,
                            eventType: N.type,
                            error: M instanceof Error ? M.message : String(M)
                        })
                    })))
                }
            }),
            Ae = Math.max(1, k.schedule.max_duration_ms),
            Ke = new Error(`partition timeout: ${k.name} exceeded ${Ae}ms`),
            _t, en = new Promise((N, M) => {
                _t = setTimeout(() => M(Ke), Ae)
            });
        try {
            P = await Promise.race([Ce, en])
        } catch (N) {
            Ue = !0, N === Ke ? (I = "timeout", U.abort(), Ce.catch(M => {
                ie("[meta-session] late sdk completion after timeout", {
                    partition: k.name,
                    error: M instanceof Error ? M.message : String(M)
                })
            })) : I = "error"
        } finally {
            _t && clearTimeout(_t)
        }
        if (!I) {
            let N = Wme(P?.text);
            I = QXe(k.name, N) ? "invalid_output" : "success"
        }
        let En = Date.now() - $,
            Je = P?.usage;
        if (appendDrainRecord(t, {
                id: crypto.randomUUID(),
                session_key: `${s}:${k.name}`,
                sdk_session_id: P?.sessionId,
                drain_started_at: new Date($).toISOString(),
                drain_duration_ms: En,
                sdk_duration_ms: En,
                events_processed: 1,
                events_skipped: 0,
                tool_calls: C,
                tool_errors: L,
                output_chars: P?.text?.length ?? 0,
                cancelled: I === "timeout",
                usage: Je
            }).catch(() => {}), X.length > 0 && await Promise.all(X), I === "success") {
            let N = Wme(P?.text),
                M = createSpineEvent({
                    type: "agent.result",
                    source: {
                        kind: "meta",
                        name: `subconscious:${k.name}`
                    },
                    session_key: s,
                    payload: {
                        text: N,
                        tick_type: "subconscious",
                        partition: k.name,
                        runtime: K,
                        runtime_source: G ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, M), await advanceConsumerWatermark(t, "meta_session", M.id, new Date(M.ts)), J("[meta-session] partition completed", {
                partition: k.name,
                runtime: K,
                eventId: M.id
            })
        } else {
            let N = I === "timeout" ? `partition timeout: ${k.name} exceeded ${Ae}ms` : I === "invalid_output" ? `invalid output from ${k.name}` : `partition error: ${k.name}`,
                M = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${k.name}`
                    },
                    session_key: s,
                    payload: {
                        stage: "partition_execution",
                        partition: k.name,
                        outcome: I,
                        error: N,
                        output_preview: P?.text?.slice(0, 400),
                        runtime: K,
                        runtime_source: G ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, M), await advanceConsumerWatermark(t, "meta_session", M.id, new Date(M.ts)), ie("[meta-session] partition settled with non-success outcome", {
                partition: k.name,
                runtime: K,
                outcome: I
            })
        }
        await cR(t, k.name), _.set(k.name, R);
        let Xn = await Ab(t, k.name),
            y = I === "success" ? 0 : Xn.consecutive_failures + 1,
            T = new Date,
            j = {
                last_started_at: new Date($).toISOString(),
                last_finished_at: T.toISOString(),
                last_result: I,
                consecutive_failures: y,
                backoff_until: D2(I, y, T, c)
            };
        if (await C2(t, k.name, j), W) {
            J("[v12-observe] codex adapter shutdown", {
                partition: k.name,
                outcome: I,
                durationMs: En
            });
            try {
                await W()
            } catch (N) {
                ie("[meta-session] codex adapter shutdown threw", {
                    partition: k.name,
                    error: N instanceof Error ? N.message : String(N)
                })
            }
        }
        return {
            name: k.name,
            outcome: I,
            durationMs: En,
            backedOff: []
        }
    }

    function w(k, E, R, $, I) {
        for (let P of k) {
            if (P.done) continue;
            let C = E.find(Q => Q.name === P.name);
            if (!C || !C.schedule.enabled) return P;
            let L = $.get(P.name);
            if (L && A2(L, I)) continue;
            let G = Math.max(0, C.schedule.cooldown_ticks),
                K = _.get(P.name);
            if (K === void 0 || R - K >= G) return P
        }
        return null
    }
    let g = async () => {
        if (l || d) {
            Pe("[meta-session] skipping tick", {
                processing: l,
                stopRequested: d
            });
            return
        }
        l = !0, J("[meta-session] starting tick");
        try {
            h += 1;
            let [k, E, R, $, I] = await Promise.all([KI(t.memoryFragmentsDir), KI(t.memoryEntitiesDir), KI(t.memoryTopicsDir), net(t), ret(t)]), P = [k, E, R, $, I].join(":"), C = eet(P);
            if (m !== null && C === m) {
                Pe("[meta-session] activity gate: skipping tick (fingerprint unchanged)"), l = !1;
                return
            }
            m = C, await Ca(t, Q => ({
                ...Q,
                health: {
                    ...Q.health,
                    meta_session: "starting"
                }
            })), await pm(t), await hm(t);
            let L = await z_(t),
                G = await iet(t, r),
                K = await b(L, G, h);
            if (K?.name && u > 1 && (!r || r.activeCount() <= 1))
                for (let W = 1; W < u && await b(L, G, h); W++);
            await Ca(t, Q => ({
                ...Q,
                health: {
                    ...Q.health,
                    meta_session: "ok"
                }
            })), J("[meta-session] tick completed", {
                executed: K?.name ?? null,
                outcome: K?.outcome ?? null,
                durationMs: K?.durationMs ?? null,
                backedOff: K?.backedOff ?? []
            })
        } catch (k) {
            Ve("[meta-session] tick error:", k), m = null, await Ca(t, R => ({
                ...R,
                health: {
                    ...R.health,
                    meta_session: "down"
                }
            }));
            let E = createSpineEvent({
                type: "agent.error",
                source: {
                    kind: "meta",
                    name: "meta-session"
                },
                session_key: s,
                payload: {
                    stage: "tick",
                    error: k instanceof Error ? k.message : String(k)
                }
            });
            await atomicAppendEvent(t, E), await advanceConsumerWatermark(t, "meta_session", E.id, new Date(E.ts))
        } finally {
            l = !1
        }
    }, x = () => {
        if (l || d) {
            g();
            return
        }
        let k = g();
        p = k;
        let E = () => {
            p === k && (p = null)
        };
        k.then(E, E)
    };
    return {
        start() {
            d || f || (n.on("cadence.tick", x), f = !0, Ca(t, k => ({
                ...k,
                health: {
                    ...k.health,
                    meta_session: "starting"
                }
            })), Yt("info", "[meta-session] started, listening for cadence ticks"))
        },
        async stop() {
            if (d = !0, f && (n.off("cadence.tick", x), f = !1), p) try {
                await p
            } catch {}
            Yt("info", "[meta-session] stopped")
        },
        isProcessing() {
            return l
        }
    }
}
