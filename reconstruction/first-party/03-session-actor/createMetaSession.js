// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMetaSession  (minified: vct, daemon.pretty.js:79799)
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
        dynamicTools: dO({
            paths: t,
            sessionKey: o,
            bus: n,
            sessionContextKind: "meta"
        })
    })), l = e.grokAvailability ?? checkGrokAvailability, u = e.grokAdapterFactory, c = e.piAdapterFactory ?? (({
        cwd: S,
        model: D,
        thinkingLevel: $
    }) => {
        let C = Dv(),
            {
                settingsSeed: O,
                defaultProjectTrust: j
            } = Mv(C),
            x = uct(Qh.join(dct(), "aladuo-pi-partition-")),
            F = {
                session_context_kind: "system"
            },
            q = _C({
                cwd: S,
                sdkSessionId: crypto.randomUUID(),
                sessionDir: x,
                agentDir: C,
                authPath: Qh.join(C, "auth.json"),
                modelsPath: Qh.join(C, "models.json"),
                modelsStorePath: Qh.join(x, "models-store.json"),
                settingsSeed: O,
                resources: {
                    extensions: "all",
                    skills: "all",
                    default_project_trust: j
                },
                model: D,
                thinkingLevel: $,
                inMemorySession: !0,
                workerCommand: Nv(),
                env: {
                    [SI]: t.daemonSocketPath,
                    [kI]: EI({
                        session_key: o,
                        ...F
                    }),
                    [xI]: JSON.stringify(F)
                },
                logDebug: J => ke(J, {
                    sessionKey: o
                })
            });
        return {
            ...q,
            shutdown: async () => {
                try {
                    await q.shutdown()
                } finally {
                    cct(x, {
                        recursive: !0,
                        force: !0
                    })
                }
            }
        }
    }), d = e.maxPartitionsPerIdleTick ?? 2, p = e.cadenceIntervalMs ?? bh, f = !1, m = !1, h = null, g = !1, y = null, w = 0, v = new Map;
    async function b(S, D, $) {
        let C = await Promise.all(S.map(async j => [j.name, await lf(t, j.name)])),
            O = new Map(C);
        for (;;) {
            let j = await _h(t);
            if (j.allDone) {
                if (await rge(t) === 0) return null;
                j = await _h(t)
            }
            let x = T(j.items, S, $, O, new Date);
            if (!x) return null;
            let F = S.find(oe => oe.name === x.name);
            if (!F || !F.schedule.enabled) {
                let oe = j.items.filter(z => !z.done).length;
                await DP(t, x.name);
                let te = (await _h(t)).items.filter(z => !z.done).length;
                if (te >= oe) return W("[meta-session] stale playlist item did not advance", {
                    name: x.name,
                    reason: F ? "disabled" : "removed",
                    beforeUnchecked: oe,
                    afterUnchecked: te
                }), null;
                ke("[meta-session] skipping unavailable partition, will retry next", {
                    name: x.name,
                    reason: F ? "disabled" : "removed"
                });
                continue
            }
            let q = await I(F, D, $),
                le = (await Promise.all(S.map(async oe => [oe.name, await lf(t, oe.name)]))).filter(([, oe]) => j4(oe, new Date)).map(([oe]) => oe);
            return {
                ...q,
                backedOff: le
            }
        }
    }
    async function I(S, D, $) {
        let C = Date.now(),
            O, j, x = 0,
            F = 0,
            q = S.runtime,
            J = q ?? _o();
        ee("[v12-observe] partition runtime selected", {
            partition: S.name,
            runtime: J,
            requestedRuntime: q ?? null,
            sdkInjected: !!i
        });
        let le, oe, X, te, z = async Ie => {
            let ze = Date.now() - C,
                ft = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        stage: "partition_execution",
                        partition: S.name,
                        outcome: "runtime_unavailable",
                        runtime: J,
                        runtime_source: q ? "explicit" : "default",
                        error: `runtime '${J}' is unavailable: ${Ie}`
                    }
                });
            await atomicAppendEvent(t, ft), await advanceConsumerWatermark(t, "meta_session", ft.id, new Date(ft.ts)), W("[meta-session] partition skipped: requested runtime unavailable", {
                partition: S.name,
                runtime: J,
                requestedFrom: q ? "frontmatter" : "default",
                reason: Ie
            }), await DP(t, S.name), v.set(S.name, $);
            let fr = await lf(t, S.name),
                Ut = new Date,
                pr = {
                    last_started_at: new Date(C).toISOString(),
                    last_finished_at: Ut.toISOString(),
                    last_result: "error",
                    consecutive_failures: fr.consecutive_failures + 1,
                    backoff_until: L4("error", fr.consecutive_failures + 1, Ut, p)
                };
            return await M4(t, S.name, pr), {
                name: S.name,
                outcome: "error",
                durationMs: ze,
                backedOff: []
            }
        }, V = claudeUnavailableReason();
        if (J === "claude" && !i && V) return await z(V);
        let pe = Ca(await ti(t.channelConfigDir)),
            ae = S.model ?? pe.runtimeModels?.[J]?.model,
            L = S.effort ?? pe.runtimeEfforts?.[J]?.effort;
        if (i && J === "claude") le = i;
        else if (J === "codex") {
            let Ie = await s();
            if (ee("[v12-observe] codex probe result", {
                    partition: S.name,
                    probeOk: Ie.ok,
                    probeReason: Ie.ok ? null : Ie.reason
                }), !Ie.ok) return await z(Ie.reason);
            ee("[v12-observe] codex adapter spawn", {
                partition: S.name,
                sandbox: resolveCodexSandbox()
            });
            let ze = a();
            le = ze, oe = () => ze.shutdown()
        } else if (J === "grok") {
            let Ie = await l();
            if (ee("[v12-observe] grok probe result", {
                    partition: S.name,
                    probeOk: Ie.ok,
                    probeReason: Ie.ok ? null : Ie.reason
                }), !Ie.ok) return await z(Ie.reason);
            ee("[v12-observe] grok adapter spawn", {
                partition: S.name
            });
            let ze = u ? u() : createGrokAcpAdapter({
                cwd: S.dir,
                mcpServerFactory: () => Yh(t, {
                    sessionKey: o,
                    bus: n,
                    sessionContextKind: "meta",
                    callerRuntime: J
                })
            });
            le = ze, X = () => ze.shutdown()
        } else if (J === "pi") {
            if (!ae) return await z("pi partition has no model: set `model: provider/modelId` in the partition CLAUDE.md frontmatter, or `pi.model` in the global runtime config");
            ee("[v12-observe] pi adapter spawn", {
                partition: S.name
            });
            let Ie = c({
                cwd: S.dir,
                model: ae,
                thinkingLevel: L
            });
            le = Ie, te = () => Ie.shutdown()
        } else le = createAgentSdkAdapter();
        let M = [],
            U = !1,
            G = partitionInboxDir(t, S.name),
            ne = await ige(t, S.name),
            Q = bct(G, ne),
            Ae = `### Partition
- Name: ${S.name}
- cwd: ${S.dir}/
- Inbox: ${G}/
- runtime: ${J}
`,
            _ = Q ? `${S.promptContent}

${Ae}
${D}

${Q}` : `${S.promptContent}

${Ae}
${D}`,
            E = Yh(t, {
                sessionKey: o,
                bus: n,
                sessionContextKind: "meta",
                callerRuntime: J
            }),
            N = [...new Set([...PARTITION_CORE_TOOLS, ...S.claudeTools ?? []])],
            K = new AbortController;
        ee("[meta-session] executing partition", {
            partition: S.name
        });
        let B = J === "grok" ? buildSystemPromptForChannelConfig({
                channel_kind: "meta",
                prompt_mode: S.prompt_mode ?? "append"
            }, o, void 0, void 0, J) : void 0,
            se = Math.max(1, S.schedule.max_duration_ms),
            me, be = new Error(`partition timeout: ${S.name} exceeded ${se}ms`),
            De;
        try {
            let Ie = await cC(t, {
                    runtime: J,
                    model: ae,
                    cwd: S.dir,
                    effective: null
                }),
                ze = le.run({
                    prompt: J === "pi" ? _ : vI(_),
                    cwd: S.dir,
                    model: J === "claude" ? Ie.effectiveModel ?? ae : J === "pi" ? void 0 : ae,
                    effort: J === "pi" ? void 0 : L,
                    claudeContextRequirement: Ie.requirement,
                    claudeModelAliases: Ie.aliases,
                    claudeSettingsPath: Ie.settingsPath,
                    settingSources: ["user", "project"],
                    persistSession: !1,
                    mcpServers: {
                        aladuo: E
                    },
                    holdInputOpenForBackgroundAgents: !0,
                    additionalDirectories: [t.memoryDir],
                    autoloadAdditionalDirectoryClaudeMd: !1,
                    tools: N,
                    systemPrompt: B,
                    abortController: K,
                    onStream: (fr, Ut) => {
                        U || n.emit("session.stream", {
                            sessionKey: o,
                            chunk: fr,
                            isSidechain: Ut
                        })
                    },
                    onExecutionEvent: fr => {
                        U || (fr.type === "tool_use" ? x += 1 : fr.type === "tool_result" && fr.isError && (F += 1), M.push(hct(t, o, S.name, fr).catch(Ut => {
                            W("[meta-session] failed to persist execution event", {
                                partition: S.name,
                                eventType: fr.type,
                                error: Ut instanceof Error ? Ut.message : String(Ut)
                            })
                        })))
                    }
                }),
                ft = new Promise((fr, Ut) => {
                    De = setTimeout(() => {
                        ze.catch(pr => {
                            W("[meta-session] late sdk completion after timeout", {
                                partition: S.name,
                                error: pr instanceof Error ? pr.message : String(pr)
                            })
                        }), Ut(be)
                    }, se)
                });
            j = await Promise.race([ze, ft])
        } catch (Ie) {
            U = !0, Ie === be ? (O = "timeout", K.abort()) : (O = "error", me = Ie instanceof Error ? Ie.message : String(Ie))
        } finally {
            De && clearTimeout(De)
        }
        if (!O) {
            let Ie = iSe(j?.text);
            O = mct(S.name, Ie) ? "invalid_output" : "success"
        }
        let Be = Date.now() - C;
        if (oe) {
            ee("[v12-observe] codex adapter shutdown", {
                partition: S.name,
                outcome: O,
                durationMs: Be
            });
            try {
                await oe()
            } catch (Ie) {
                W("[meta-session] codex adapter shutdown threw", {
                    partition: S.name,
                    error: Ie instanceof Error ? Ie.message : String(Ie)
                })
            }
        }
        if (X) {
            ee("[v12-observe] grok adapter shutdown", {
                partition: S.name,
                outcome: O,
                durationMs: Be
            });
            try {
                await X()
            } catch (Ie) {
                W("[meta-session] grok adapter shutdown threw", {
                    partition: S.name,
                    error: Ie instanceof Error ? Ie.message : String(Ie)
                })
            }
        }
        if (te) {
            ee("[v12-observe] pi adapter shutdown", {
                partition: S.name,
                outcome: O,
                durationMs: Be
            });
            try {
                await te()
            } catch (Ie) {
                W("[meta-session] pi adapter shutdown threw", {
                    partition: S.name,
                    error: Ie instanceof Error ? Ie.message : String(Ie)
                })
            }
        }
        let $t = j?.usage;
        if (appendDrainRecord(t, {
                id: crypto.randomUUID(),
                session_key: `${o}:${S.name}`,
                sdk_session_id: j?.sessionId,
                drain_started_at: new Date(C).toISOString(),
                drain_duration_ms: Be,
                sdk_duration_ms: Be,
                events_processed: 1,
                events_skipped: 0,
                tool_calls: x,
                tool_errors: F,
                output_chars: j?.text?.length ?? 0,
                cancelled: O === "timeout",
                usage: $t
            }).catch(() => {}), M.length > 0 && await Promise.all(M), O === "success") {
            let Ie = iSe(j?.text),
                ze = createSpineEvent({
                    type: "agent.result",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        text: Ie,
                        tick_type: "subconscious",
                        partition: S.name,
                        runtime: J,
                        runtime_source: q ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, ze), await advanceConsumerWatermark(t, "meta_session", ze.id, new Date(ze.ts)), ee("[meta-session] partition completed", {
                partition: S.name,
                runtime: J,
                eventId: ze.id
            })
        } else {
            let Ie = O === "timeout" ? `partition timeout: ${S.name} exceeded ${se}ms` : O === "invalid_output" ? `invalid output from ${S.name}` : `partition error: ${S.name}${me?`: ${me}`:""}`,
                ze = createSpineEvent({
                    type: "agent.error",
                    source: {
                        kind: "meta",
                        name: `subconscious:${S.name}`
                    },
                    session_key: o,
                    payload: {
                        stage: "partition_execution",
                        partition: S.name,
                        outcome: O,
                        error: Ie,
                        output_preview: j?.text?.slice(0, 400),
                        runtime: J,
                        runtime_source: q ? "explicit" : "default"
                    }
                });
            await atomicAppendEvent(t, ze), await advanceConsumerWatermark(t, "meta_session", ze.id, new Date(ze.ts)), W("[meta-session] partition settled with non-success outcome", {
                partition: S.name,
                runtime: J,
                outcome: O,
                error: Ie
            })
        }
        await DP(t, S.name), v.set(S.name, $);
        let ot = await lf(t, S.name),
            Gt = O === "success" ? 0 : ot.consecutive_failures + 1,
            Fe = new Date,
            et = {
                last_started_at: new Date(C).toISOString(),
                last_finished_at: Fe.toISOString(),
                last_result: O,
                consecutive_failures: Gt,
                backoff_until: L4(O, Gt, Fe, p)
            };
        return await M4(t, S.name, et), {
            name: S.name,
            outcome: O,
            durationMs: Be,
            backedOff: []
        }
    }

    function T(S, D, $, C, O) {
        for (let j of S) {
            if (j.done) continue;
            let x = D.find(le => le.name === j.name);
            if (!x || !x.schedule.enabled) return j;
            let F = C.get(j.name);
            if (F && j4(F, O)) continue;
            let q = Math.max(0, x.schedule.cooldown_ticks),
                J = v.get(j.name);
            if (J === void 0 || $ - J >= q) return j
        }
        return null
    }
    let P = async () => {
        if (f || m) {
            ke("[meta-session] skipping tick", {
                processing: f,
                stopRequested: m
            });
            return
        }
        f = !0, ee("[meta-session] starting tick");
        try {
            w += 1;
            let [S, D, $, C] = await Promise.all([PO(t.memoryFragmentsDir), PO(t.memoryEntitiesDir), PO(t.memoryTopicsDir), yct(t)]), O = [S, D, $, C].join(":"), j = gct(O);
            if (y !== null && j === y) {
                ke("[meta-session] activity gate: skipping tick (fingerprint unchanged)"), f = !1;
                return
            }
            y = j, await gl(t, J => ({
                ...J,
                health: {
                    ...J.health,
                    meta_session: "starting"
                }
            }));
            let x = await kv(t),
                F = await _ct(t, r),
                q = await b(x, F, w);
            if (q?.name && d > 1 && (!r || r.activeCount() <= 1))
                for (let le = 1; le < d && await b(x, F, w); le++);
            await gl(t, J => ({
                ...J,
                health: {
                    ...J.health,
                    meta_session: "ok"
                }
            })), ee("[meta-session] tick completed", {
                executed: q?.name ?? null,
                outcome: q?.outcome ?? null,
                durationMs: q?.durationMs ?? null,
                backedOff: q?.backedOff ?? []
            })
        } catch (S) {
            Me("[meta-session] tick error:", S), y = null, await gl(t, $ => ({
                ...$,
                health: {
                    ...$.health,
                    meta_session: "down"
                }
            }));
            let D = createSpineEvent({
                type: "agent.error",
                source: {
                    kind: "meta",
                    name: "meta-session"
                },
                session_key: o,
                payload: {
                    stage: "tick",
                    error: S instanceof Error ? S.message : String(S)
                }
            });
            await atomicAppendEvent(t, D), await advanceConsumerWatermark(t, "meta_session", D.id, new Date(D.ts))
        } finally {
            f = !1
        }
    }, k = () => {
        if (f || m) {
            P();
            return
        }
        let S = P();
        h = S;
        let D = () => {
            h === S && (h = null)
        };
        S.then(D, D)
    };
    return {
        start() {
            m || g || (n.on("cadence.tick", k), g = !0, gl(t, S => ({
                ...S,
                health: {
                    ...S.health,
                    meta_session: "starting"
                }
            })), gt("info", "[meta-session] started, listening for cadence ticks"))
        },
        async stop() {
            if (m = !0, g && (n.off("cadence.tick", k), g = !1), h) try {
                await h
            } catch {}
            gt("info", "[meta-session] stopped")
        },
        isProcessing() {
            return f
        }
    }
}
