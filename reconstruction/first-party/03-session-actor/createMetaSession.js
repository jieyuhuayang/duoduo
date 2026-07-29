// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMetaSession  (minified: xet, daemon.pretty.js:74390)
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
    })), c = e.maxPartitionsPerIdleTick ?? 2, u = e.cadenceIntervalMs ?? M2, l = !1, d = !1, p = null, f = !1, m = null, h = 0, _ = new Map;
    async function b(k, E, R) {
        let $ = await Promise.all(k.map(async P => [P.name, await Ab(t, P.name)])),
            I = new Map($);
        for (;;) {
            let P = await cm(t);
            if (P.allDone) {
                if (await Zue(t) === 0) return null;
                P = await cm(t)
            }
            let C = v(P.items, k, R, I, new Date);
            if (!C) return null;
            let j = k.find(G => G.name === C.name);
            if (!j || !j.schedule.enabled) {
                let G = P.items.filter(ue => !ue.done).length;
                await lR(t, C.name);
                let Ce = (await cm(t)).items.filter(ue => !ue.done).length;
                if (Ce >= G) return se("[meta-session] stale playlist item did not advance", {
                    name: C.name,
                    reason: j ? "disabled" : "removed",
                    beforeUnchecked: G,
                    afterUnchecked: Ce
                }), null;
                Pe("[meta-session] skipping unavailable partition, will retry next", {
                    name: C.name,
                    reason: j ? "disabled" : "removed"
                });
                continue
            }
            let X = await w(j, E, R),
                Y = (await Promise.all(k.map(async G => [G.name, await Ab(t, G.name)]))).filter(([, G]) => L2(G, new Date)).map(([G]) => G);
            return {
                ...X,
                backedOff: Y
            }
        }
    }
    async function w(k, E, R) {
        let $ = Date.now(),
            I, P, C = 0,
            j = 0,
            X = k.runtime,
            W = X ?? Oc();
        K("[v12-observe] partition runtime selected", {
            partition: k.name,
            runtime: W,
            requestedRuntime: X ?? null,
            sdkInjected: !!i
        });
        let Y, G, ae = async A => {
            let z = Date.now() - $,
                te = createSpineEvent({
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
                        runtime: W,
                        runtime_source: X ? "explicit" : "default",
                        error: `runtime '${W}' is unavailable: ${A}`
                    }
                });
            await atomicAppendEvent(t, te), await advanceConsumerWatermark(t, "meta_session", te.id, new Date(te.ts)), se("[meta-session] partition skipped: requested runtime unavailable", {
                partition: k.name,
                runtime: W,
                requestedFrom: X ? "frontmatter" : "default",
                reason: A
            }), await lR(t, k.name), _.set(k.name, R);
            let ke = await Ab(t, k.name),
                at = new Date,
                $e = {
                    last_started_at: new Date($).toISOString(),
                    last_finished_at: at.toISOString(),
                    last_result: "error",
                    consecutive_failures: ke.consecutive_failures + 1,
                    backoff_until: z2("error", ke.consecutive_failures + 1, at, u)
                };
            return await j2(t, k.name, $e), {
                name: k.name,
                outcome: "error",
                durationMs: z,
                backedOff: []
            }
        }, Ce = claudeUnavailableReason();
        if (W === "claude" && !i && Ce) return await ae(Ce);
        if (i && W === "claude") Y = i;
        else if (W === "codex") {
            let A = await o();
            if (K("[v12-observe] codex probe result", {
                    partition: k.name,
                    probeOk: A.ok,
                    probeReason: A.ok ? null : A.reason
                }), !A.ok) return await ae(A.reason);
            K("[v12-observe] codex adapter spawn", {
                partition: k.name,
                sandbox: resolveCodexSandbox()
            });
            let z = a();
            Y = z, G = () => z.shutdown()
        } else Y = createAgentSdkAdapter();
        let ue = [],
            Ne = !1,
            ot = partitionInboxDir(t, k.name),
            Se = await Jue(t, k.name),
            Xe = ket(k, ot, Se),
            Sn = `### Partition
- Name: ${k.name}
- cwd: ${k.dir}/
- Inbox: ${ot}/
`,
            U = Xe ? `${k.promptContent}

${Sn}
${E}

${Xe}` : `${k.promptContent}

${Sn}
${E}`,
            L = MI(t, {
                sessionKey: s,
                bus: n,
                sessionContextKind: "meta"
            }),
            M = [...new Set([...PARTITION_CORE_TOOLS, ...k.claudeTools ?? []])],
            F = new AbortController;
        K("[meta-session] executing partition", {
            partition: k.name
        });
        let xe = Y.run({
                prompt: GE(U),
                cwd: k.dir,
                settingSources: ["user", "project"],
                persistSession: !1,
                mcpServers: {
                    aladuo: L
                },
                holdInputOpenForBackgroundAgents: !0,
                additionalDirectories: [t.memoryDir],
                autoloadAdditionalDirectoryClaudeMd: !1,
                tools: M,
                abortController: F,
                onStream: (A, z) => {
                    Ne || n.emit("session.stream", {
                        sessionKey: s,
                        chunk: A,
                        isSidechain: z
                    })
                },
                onExecutionEvent: A => {
                    Ne || (A.type === "tool_use" ? C += 1 : A.type === "tool_result" && A.isError && (j += 1), ue.push(get(t, s, k.name, A).catch(z => {
                        se("[meta-session] failed to persist execution event", {
                            partition: k.name,
                            eventType: A.type,
                            error: z instanceof Error ? z.message : String(z)
                        })
                    })))
                }
            }),
            Oe = Math.max(1, k.schedule.max_duration_ms),
            ze = new Error(`partition timeout: ${k.name} exceeded ${Oe}ms`),
            et, yt = new Promise((A, z) => {
                et = setTimeout(() => z(ze), Oe)
            });
        try {
            P = await Promise.race([xe, yt])
        } catch (A) {
            Ne = !0, A === ze ? (I = "timeout", F.abort(), xe.catch(z => {
                se("[meta-session] late sdk completion after timeout", {
                    partition: k.name,
                    error: z instanceof Error ? z.message : String(z)
                })
            })) : I = "error"
        } finally {
            et && clearTimeout(et)
        }
        if (!I) {
            let A = ahe(P?.text);
            I = het(k.name, A) ? "invalid_output" : "success"
        }
        let Tn = Date.now() - $,
            Ze = P?.usage;
        if (appendDrainRecord(t, {
                id: crypto.randomUUID(),
                session_key: `${s}:${k.name}`,
                sdk_session_id: P?.sessionId,
                drain_started_at: new Date($).toISOString(),
                drain_duration_ms: Tn,
                sdk_duration_ms: Tn,
                events_processed: 1,
                events_skipped: 0,
                tool_calls: C,
                tool_errors: j,
                output_chars: P?.text?.length ?? 0,
                cancelled: I === "timeout",
                usage: Ze
            }).catch(() => {}), ue.length > 0 && await Promise.all(ue), I === "success") {
            let A = ahe(P?.text),
                z = createSpineEvent({
                    type: "agent.result",
                    source: {
                        kind: "meta",
                        name: `subconscious:${k.name}`
                    },
                    session_key: s,
                    payload: {
                        text: A,
                        tick_type: "subconscious",
                        partition: k.name,
                        runtime: W,
                        runtime_source: X ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, z), await advanceConsumerWatermark(t, "meta_session", z.id, new Date(z.ts)), K("[meta-session] partition completed", {
                partition: k.name,
                runtime: W,
                eventId: z.id
            })
        } else {
            let A = I === "timeout" ? `partition timeout: ${k.name} exceeded ${Oe}ms` : I === "invalid_output" ? `invalid output from ${k.name}` : `partition error: ${k.name}`,
                z = createSpineEvent({
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
                        error: A,
                        output_preview: P?.text?.slice(0, 400),
                        runtime: W,
                        runtime_source: X ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, z), await advanceConsumerWatermark(t, "meta_session", z.id, new Date(z.ts)), se("[meta-session] partition settled with non-success outcome", {
                partition: k.name,
                runtime: W,
                outcome: I
            })
        }
        await lR(t, k.name), _.set(k.name, R);
        let Qn = await Ab(t, k.name),
            y = I === "success" ? 0 : Qn.consecutive_failures + 1,
            T = new Date,
            D = {
                last_started_at: new Date($).toISOString(),
                last_finished_at: T.toISOString(),
                last_result: I,
                consecutive_failures: y,
                backoff_until: z2(I, y, T, u)
            };
        if (await j2(t, k.name, D), G) {
            K("[v12-observe] codex adapter shutdown", {
                partition: k.name,
                outcome: I,
                durationMs: Tn
            });
            try {
                await G()
            } catch (A) {
                se("[meta-session] codex adapter shutdown threw", {
                    partition: k.name,
                    error: A instanceof Error ? A.message : String(A)
                })
            }
        }
        return {
            name: k.name,
            outcome: I,
            durationMs: Tn,
            backedOff: []
        }
    }

    function v(k, E, R, $, I) {
        for (let P of k) {
            if (P.done) continue;
            let C = E.find(Y => Y.name === P.name);
            if (!C || !C.schedule.enabled) return P;
            let j = $.get(P.name);
            if (j && L2(j, I)) continue;
            let X = Math.max(0, C.schedule.cooldown_ticks),
                W = _.get(P.name);
            if (W === void 0 || R - W >= X) return P
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
        l = !0, K("[meta-session] starting tick");
        try {
            h += 1;
            let [k, E, R, $, I] = await Promise.all([KI(t.memoryFragmentsDir), KI(t.memoryEntitiesDir), KI(t.memoryTopicsDir), bet(t), vet(t)]), P = [k, E, R, $, I].join(":"), C = yet(P);
            if (m !== null && C === m) {
                Pe("[meta-session] activity gate: skipping tick (fingerprint unchanged)"), l = !1;
                return
            }
            m = C, await Aa(t, Y => ({
                ...Y,
                health: {
                    ...Y.health,
                    meta_session: "starting"
                }
            })), await gm(t), await _m(t);
            let j = await z_(t),
                X = await wet(t, r),
                W = await b(j, X, h);
            if (W?.name && c > 1 && (!r || r.activeCount() <= 1))
                for (let G = 1; G < c && await b(j, X, h); G++);
            await Aa(t, Y => ({
                ...Y,
                health: {
                    ...Y.health,
                    meta_session: "ok"
                }
            })), K("[meta-session] tick completed", {
                executed: W?.name ?? null,
                outcome: W?.outcome ?? null,
                durationMs: W?.durationMs ?? null,
                backedOff: W?.backedOff ?? []
            })
        } catch (k) {
            Be("[meta-session] tick error:", k), m = null, await Aa(t, R => ({
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
            d || f || (n.on("cadence.tick", x), f = !0, Aa(t, k => ({
                ...k,
                health: {
                    ...k.health,
                    meta_session: "starting"
                }
            })), Kt("info", "[meta-session] started, listening for cadence ticks"))
        },
        async stop() {
            if (d = !0, f && (n.off("cadence.tick", x), f = !1), p) try {
                await p
            } catch {}
            Kt("info", "[meta-session] stopped")
        },
        isProcessing() {
            return l
        }
    }
}
