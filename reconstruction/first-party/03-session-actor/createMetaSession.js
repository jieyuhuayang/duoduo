// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMetaSession  (minified: Iot, daemon.pretty.js:77531)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createMetaSession(e) {
    let {
        paths: t,
        bus: n,
        sessionManager: r
    } = e, i = e.sdk, o = e.sessionKey ?? "meta:subconscious", s = e.codexAvailability ?? checkCodexAvailability, a = e.codexAdapterFactory ?? (() => createCodexAppServerAdapter({
        sandbox: resolveCodexSandbox(),
        ephemeral: !0,
        dynamicTools: fC({
            paths: t,
            sessionKey: o,
            bus: n,
            sessionContextKind: "meta"
        })
    })), l = e.grokAvailability ?? checkGrokAvailability, u = e.grokAdapterFactory, c = e.maxPartitionsPerIdleTick ?? 2, d = e.cadenceIntervalMs ?? UB, p = !1, f = !1, m = null, h = !1, y = null, _ = 0, k = new Map;
    async function v(w, C, O) {
        let A = await Promise.all(w.map(async P => [P.name, await Ov(t, P.name)])),
            x = new Map(A);
        for (;;) {
            let P = await Zm(t);
            if (P.allDone) {
                if (await Kfe(t) === 0) return null;
                P = await Zm(t)
            }
            let M = I(P.items, w, O, x, new Date);
            if (!M) return null;
            let j = w.find(ie => ie.name === M.name);
            if (!j || !j.schedule.enabled) {
                let ie = P.items.filter(je => !je.done).length;
                await xI(t, M.name);
                let Ye = (await Zm(t)).items.filter(je => !je.done).length;
                if (Ye >= ie) return Z("[meta-session] stale playlist item did not advance", {
                    name: M.name,
                    reason: j ? "disabled" : "removed",
                    beforeUnchecked: ie,
                    afterUnchecked: Ye
                }), null;
                Ae("[meta-session] skipping unavailable partition, will retry next", {
                    name: M.name,
                    reason: j ? "disabled" : "removed"
                });
                continue
            }
            let H = await b(j, C, O),
                ee = (await Promise.all(w.map(async ie => [ie.name, await Ov(t, ie.name)]))).filter(([, ie]) => zB(ie, new Date)).map(([ie]) => ie);
            return {
                ...H,
                backedOff: ee
            }
        }
    }
    async function b(w, C, O) {
        let A = Date.now(),
            x, P, M = 0,
            j = 0,
            H = w.runtime,
            J = H ?? Xl();
        K("[v12-observe] partition runtime selected", {
            partition: w.name,
            runtime: J,
            requestedRuntime: H ?? null,
            sdkInjected: !!i
        });
        let ee, ie, re, Ye = async Ze => {
            let it = Date.now() - A,
                sn = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${w.name}`
                    },
                    session_key: o,
                    payload: {
                        stage: "partition_execution",
                        partition: w.name,
                        outcome: "runtime_unavailable",
                        runtime: J,
                        runtime_source: H ? "explicit" : "default",
                        error: `runtime '${J}' is unavailable: ${Ze}`
                    }
                });
            await atomicAppendEvent(t, sn), await advanceConsumerWatermark(t, "meta_session", sn.id, new Date(sn.ts)), Z("[meta-session] partition skipped: requested runtime unavailable", {
                partition: w.name,
                runtime: J,
                requestedFrom: H ? "frontmatter" : "default",
                reason: Ze
            }), await xI(t, w.name), k.set(w.name, O);
            let qi = await Ov(t, w.name),
                xi = new Date,
                g = {
                    last_started_at: new Date(A).toISOString(),
                    last_finished_at: xi.toISOString(),
                    last_result: "error",
                    consecutive_failures: qi.consecutive_failures + 1,
                    backoff_until: qB("error", qi.consecutive_failures + 1, xi, d)
                };
            return await FB(t, w.name, g), {
                name: w.name,
                outcome: "error",
                durationMs: it,
                backedOff: []
            }
        }, je = claudeUnavailableReason();
        if (J === "claude" && !i && je) return await Ye(je);
        if (i && J === "claude") ee = i;
        else if (J === "codex") {
            let Ze = await s();
            if (K("[v12-observe] codex probe result", {
                    partition: w.name,
                    probeOk: Ze.ok,
                    probeReason: Ze.ok ? null : Ze.reason
                }), !Ze.ok) return await Ye(Ze.reason);
            K("[v12-observe] codex adapter spawn", {
                partition: w.name,
                sandbox: resolveCodexSandbox()
            });
            let it = a();
            ee = it, ie = () => it.shutdown()
        } else if (J === "grok") {
            let Ze = await l();
            if (K("[v12-observe] grok probe result", {
                    partition: w.name,
                    probeOk: Ze.ok,
                    probeReason: Ze.ok ? null : Ze.reason
                }), !Ze.ok) return await Ye(Ze.reason);
            K("[v12-observe] grok adapter spawn", {
                partition: w.name
            });
            let it = u ? u() : createGrokAcpAdapter({
                cwd: w.dir,
                mcpServerFactory: () => Ah(t, {
                    sessionKey: o,
                    bus: n,
                    sessionContextKind: "meta"
                })
            });
            ee = it, re = () => it.shutdown()
        } else ee = createAgentSdkAdapter();
        let Se = [],
            lt = !1,
            Fe = partitionInboxDir(t, w.name),
            qe = await Yfe(t, w.name),
            F = Tot(w, Fe, qe),
            L = `### Partition
- Name: ${w.name}
- cwd: ${w.dir}/
- Inbox: ${Fe}/
`,
            B = F ? `${w.promptContent}

${L}
${C}

${F}` : `${w.promptContent}

${L}
${C}`,
            te = Ah(t, {
                sessionKey: o,
                bus: n,
                sessionContextKind: "meta"
            }),
            Le = [...new Set([...PARTITION_CORE_TOOLS, ...w.claudeTools ?? []])],
            Re = new AbortController;
        K("[meta-session] executing partition", {
            partition: w.name
        });
        let We = J === "grok" ? buildSystemPromptForChannelConfig({
                channel_kind: "meta",
                prompt_mode: w.prompt_mode ?? "append"
            }, o) : void 0,
            Be = ee.run({
                prompt: ET(B),
                cwd: w.dir,
                settingSources: ["user", "project"],
                persistSession: !1,
                mcpServers: {
                    aladuo: te
                },
                holdInputOpenForBackgroundAgents: !0,
                additionalDirectories: [t.memoryDir],
                autoloadAdditionalDirectoryClaudeMd: !1,
                tools: Le,
                systemPrompt: We,
                abortController: Re,
                onStream: (Ze, it) => {
                    lt || n.emit("session.stream", {
                        sessionKey: o,
                        chunk: Ze,
                        isSidechain: it
                    })
                },
                onExecutionEvent: Ze => {
                    lt || (Ze.type === "tool_use" ? M += 1 : Ze.type === "tool_result" && Ze.isError && (j += 1), Se.push(wot(t, o, w.name, Ze).catch(it => {
                        Z("[meta-session] failed to persist execution event", {
                            partition: w.name,
                            eventType: Ze.type,
                            error: it instanceof Error ? it.message : String(it)
                        })
                    })))
                }
            }),
            X = Math.max(1, w.schedule.max_duration_ms),
            Q = new Error(`partition timeout: ${w.name} exceeded ${X}ms`),
            fe, ve = new Promise((Ze, it) => {
                fe = setTimeout(() => it(Q), X)
            });
        try {
            P = await Promise.race([Be, ve])
        } catch (Ze) {
            lt = !0, Ze === Q ? (x = "timeout", Re.abort(), Be.catch(it => {
                Z("[meta-session] late sdk completion after timeout", {
                    partition: w.name,
                    error: it instanceof Error ? it.message : String(it)
                })
            })) : x = "error"
        } finally {
            fe && clearTimeout(fe)
        }
        if (!x) {
            let Ze = z_e(P?.text);
            x = vot(w.name, Ze) ? "invalid_output" : "success"
        }
        let me = Date.now() - A,
            Bt = P?.usage;
        if (appendDrainRecord(t, {
                id: crypto.randomUUID(),
                session_key: `${o}:${w.name}`,
                sdk_session_id: P?.sessionId,
                drain_started_at: new Date(A).toISOString(),
                drain_duration_ms: me,
                sdk_duration_ms: me,
                events_processed: 1,
                events_skipped: 0,
                tool_calls: M,
                tool_errors: j,
                output_chars: P?.text?.length ?? 0,
                cancelled: x === "timeout",
                usage: Bt
            }).catch(() => {}), Se.length > 0 && await Promise.all(Se), x === "success") {
            let Ze = z_e(P?.text),
                it = createSpineEvent({
                    type: "agent.result",
                    source: {
                        kind: "meta",
                        name: `subconscious:${w.name}`
                    },
                    session_key: o,
                    payload: {
                        text: Ze,
                        tick_type: "subconscious",
                        partition: w.name,
                        runtime: J,
                        runtime_source: H ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, it), await advanceConsumerWatermark(t, "meta_session", it.id, new Date(it.ts)), K("[meta-session] partition completed", {
                partition: w.name,
                runtime: J,
                eventId: it.id
            })
        } else {
            let Ze = x === "timeout" ? `partition timeout: ${w.name} exceeded ${X}ms` : x === "invalid_output" ? `invalid output from ${w.name}` : `partition error: ${w.name}`,
                it = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${w.name}`
                    },
                    session_key: o,
                    payload: {
                        stage: "partition_execution",
                        partition: w.name,
                        outcome: x,
                        error: Ze,
                        output_preview: P?.text?.slice(0, 400),
                        runtime: J,
                        runtime_source: H ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, it), await advanceConsumerWatermark(t, "meta_session", it.id, new Date(it.ts)), Z("[meta-session] partition settled with non-success outcome", {
                partition: w.name,
                runtime: J,
                outcome: x
            })
        }
        await xI(t, w.name), k.set(w.name, O);
        let tt = await Ov(t, w.name),
            Yt = x === "success" ? 0 : tt.consecutive_failures + 1,
            St = new Date,
            Qn = {
                last_started_at: new Date(A).toISOString(),
                last_finished_at: St.toISOString(),
                last_result: x,
                consecutive_failures: Yt,
                backoff_until: qB(x, Yt, St, d)
            };
        if (await FB(t, w.name, Qn), ie) {
            K("[v12-observe] codex adapter shutdown", {
                partition: w.name,
                outcome: x,
                durationMs: me
            });
            try {
                await ie()
            } catch (Ze) {
                Z("[meta-session] codex adapter shutdown threw", {
                    partition: w.name,
                    error: Ze instanceof Error ? Ze.message : String(Ze)
                })
            }
        }
        if (re) {
            K("[v12-observe] grok adapter shutdown", {
                partition: w.name,
                outcome: x,
                durationMs: me
            });
            try {
                await re()
            } catch (Ze) {
                Z("[meta-session] grok adapter shutdown threw", {
                    partition: w.name,
                    error: Ze instanceof Error ? Ze.message : String(Ze)
                })
            }
        }
        return {
            name: w.name,
            outcome: x,
            durationMs: me,
            backedOff: []
        }
    }

    function I(w, C, O, A, x) {
        for (let P of w) {
            if (P.done) continue;
            let M = C.find(ee => ee.name === P.name);
            if (!M || !M.schedule.enabled) return P;
            let j = A.get(P.name);
            if (j && zB(j, x)) continue;
            let H = Math.max(0, M.schedule.cooldown_ticks),
                J = k.get(P.name);
            if (J === void 0 || O - J >= H) return P
        }
        return null
    }
    let T = async () => {
        if (p || f) {
            Ae("[meta-session] skipping tick", {
                processing: p,
                stopRequested: f
            });
            return
        }
        p = !0, K("[meta-session] starting tick");
        try {
            _ += 1;
            let [w, C, O, A, x] = await Promise.all([kC(t.memoryFragmentsDir), kC(t.memoryEntitiesDir), kC(t.memoryTopicsDir), xot(t), Eot(t)]), P = [w, C, O, A, x].join(":"), M = Sot(P);
            if (y !== null && M === y) {
                Ae("[meta-session] activity gate: skipping tick (fingerprint unchanged)"), p = !1;
                return
            }
            y = M, await Xa(t, ee => ({
                ...ee,
                health: {
                    ...ee.health,
                    meta_session: "starting"
                }
            })), await ah(t), await uh(t);
            let j = await Ob(t),
                H = await Rot(t, r),
                J = await v(j, H, _);
            if (J?.name && c > 1 && (!r || r.activeCount() <= 1))
                for (let ie = 1; ie < c && await v(j, H, _); ie++);
            await Xa(t, ee => ({
                ...ee,
                health: {
                    ...ee.health,
                    meta_session: "ok"
                }
            })), K("[meta-session] tick completed", {
                executed: J?.name ?? null,
                outcome: J?.outcome ?? null,
                durationMs: J?.durationMs ?? null,
                backedOff: J?.backedOff ?? []
            })
        } catch (w) {
            et("[meta-session] tick error:", w), y = null, await Xa(t, O => ({
                ...O,
                health: {
                    ...O.health,
                    meta_session: "down"
                }
            }));
            let C = createSpineEvent({
                type: "agent.error",
                source: {
                    kind: "meta",
                    name: "meta-session"
                },
                session_key: o,
                payload: {
                    stage: "tick",
                    error: w instanceof Error ? w.message : String(w)
                }
            });
            await atomicAppendEvent(t, C), await advanceConsumerWatermark(t, "meta_session", C.id, new Date(C.ts))
        } finally {
            p = !1
        }
    }, S = () => {
        if (p || f) {
            T();
            return
        }
        let w = T();
        m = w;
        let C = () => {
            m === w && (m = null)
        };
        w.then(C, C)
    };
    return {
        start() {
            f || h || (n.on("cadence.tick", S), h = !0, Xa(t, w => ({
                ...w,
                health: {
                    ...w.health,
                    meta_session: "starting"
                }
            })), Ct("info", "[meta-session] started, listening for cadence ticks"))
        },
        async stop() {
            if (f = !0, h && (n.off("cadence.tick", S), h = !1), m) try {
                await m
            } catch {}
            Ct("info", "[meta-session] stopped")
        },
        isProcessing() {
            return p
        }
    }
}
