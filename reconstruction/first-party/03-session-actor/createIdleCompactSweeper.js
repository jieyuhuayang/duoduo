// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createIdleCompactSweeper  (minified: gwe, daemon.pretty.js:88861)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.8.4 (maps/history_daemon.json)
// changelog v0.5.10 (high): A channel session that has sat idle past a configurable threshold and grown past a token floor now silently runs `/compact` on its next turn
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createIdleCompactSweeper(e) {
    let {
        paths: t,
        sessionManager: n,
        sessionIndex: r,
        bus: i
    } = e, o = e.intervalMs ?? $ct, s = e.fireCapPerSweep ?? Oct, a = null, u = !1, l = null, c = !1, d = new Map;

    function f(y) {
        let v = y.session_key;
        if (classifySessionKeyKind(v) !== "channel") return !1;
        let b = n.getSweeperActorState(v);
        return !(!b || b.midTurn || m(y.last_compact_at, y.last_event_at))
    }

    function p(y, v, b) {
        let _ = y.last_event_at ? Date.parse(y.last_event_at) : Number.NaN,
            E = Number.isFinite(_) ? _ : 0;
        return b - Math.max(E, typeof v == "number" ? v : 0)
    }

    function m(y, v) {
        if (!y) return !1;
        let b = Date.parse(y);
        if (Number.isNaN(b)) return !1;
        if (!v) return !0;
        let _ = Date.parse(v);
        return Number.isNaN(_) ? !0 : b >= _
    }
    async function h(y, v, b) {
        let _ = y.session_key;
        if (isSessionArchiving(_)) return logDebugMessage("[idle-compact] skip: archiving", {
            sessionKey: _
        }), !1;
        let E = await resolveChannelConfigBySession(t, _).catch(() => null);
        if (!E || E.runtime === "codex" || E.runtimeRefusal || E.runtime === "void") return !1;
        let R = E.auto_compact_idle_minutes,
            P = E.auto_compact_min_context_tokens;
        if (!R || R <= 0 || !P || P <= 0 || v < R * Cct) return !1;
        let k = y.context_used_tokens;
        if (typeof k != "number" || k < P) return !1;
        let S = y.compact_measured_floor;
        if (typeof S == "number" && P <= S) {
            b.add(_);
            let C = `${y.compact_measured_at??""}:${P}`;
            return d.get(_) !== C ? (d.set(_, C), logAlwaysAtLevel("info", "[idle-compact] fuse: threshold ≤ measured floor, skipping", {
                sessionKey: _,
                threshold: P,
                measured_floor: S
            })) : logDebugMessage("[idle-compact] fuse: threshold ≤ measured floor, skipping (repeat)", {
                sessionKey: _,
                threshold: P,
                measured_floor: S
            }), !1
        }
        let D = E.channel_kind,
            A = y.source_channel_id;
        try {
            await patchSessionRuntimeState(t, _, {
                last_compact_at: new Date().toISOString()
            })
        } catch (C) {
            if (C instanceof qm) return logDebugMessage("[idle-compact] skip: archiving (marker write)", {
                sessionKey: _
            }), !1;
            throw C
        }
        return (await ingestChannelCommand(t, {
            sessionKey: _,
            sourceKind: D,
            sourceChannelId: A,
            sourceName: "idle-compact",
            command: "/compact",
            idle_ms: v,
            threshold_at_fire: P
        }, {
            bus: i
        })).routing.enqueued ? (i.emit("session.wake", {
            sessionKey: _,
            preempt: "never"
        }), logInfoMessage("[idle-compact] fired", {
            sessionKey: _,
            channel_kind: D,
            idle_ms: v,
            context_used_tokens: k
        }), !0) : (logWarnMessage("[idle-compact] /compact not enqueued", {
            sessionKey: _
        }), !1)
    }
    async function g() {
        if (u || c) return u && logDebugMessage("[idle-compact] sweep skipped: previous sweep still running"), 0;
        u = !0;
        let y = Date.now(),
            v = 0,
            b = new Set;
        try {
            let _ = Date.now();
            for (let E of r.listByKind("channel")) {
                if (c) break;
                if (v >= s) {
                    logDebugMessage("[idle-compact] per-sweep fire cap reached", {
                        cap: s
                    });
                    break
                }
                try {
                    if (!f(E)) continue;
                    let R = n.getSweeperActorState(E.session_key);
                    if (!R) continue;
                    let P = p(E, R.lastActivityAt, _);
                    await h(E, P, b) && (v += 1)
                } catch (R) {
                    if (R instanceof qm) continue;
                    logErrorMessage("[idle-compact] per-session sweep error", {
                        sessionKey: E.session_key,
                        error: R instanceof Error ? R.message : String(R)
                    })
                }
            }
            for (let E of d.keys()) b.has(E) || d.delete(E);
            logDebugMessage("[idle-compact] sweep complete", {
                fired: v,
                durationMs: Date.now() - y
            })
        } catch (_) {
            logErrorMessage("[idle-compact] sweep error", _)
        } finally {
            u = !1
        }
        return v
    }
    return {
        start() {
            a || c || (a = setInterval(() => {
                l = g()
            }, o), logInfoMessage("[idle-compact] started", {
                intervalMs: o,
                fireCapPerSweep: s
            }))
        },
        async stop() {
            if (c = !0, a && (clearInterval(a), a = null), l) {
                try {
                    await l
                } catch {}
                l = null
            }
            logInfoMessage("[idle-compact] stopped")
        },
        isSweeping() {
            return u
        },
        async sweepNow() {
            return g()
        }
    }
}
