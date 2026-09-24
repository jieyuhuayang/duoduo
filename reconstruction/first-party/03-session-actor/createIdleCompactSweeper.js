// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createIdleCompactSweeper  (minified: Xbe, daemon.pretty.js:88480)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createIdleCompactSweeper(e) {
    let {
        paths: t,
        sessionManager: n,
        sessionIndex: r,
        bus: i
    } = e, o = e.intervalMs ?? Dut, s = e.fireCapPerSweep ?? IDLE_COMPACT_FIRE_CAP_PER_SWEEP, a = null, u = !1, l = null, c = !1, d = new Map;

    function f(y) {
        let v = y.session_key;
        if (classifySessionKeyKind(v) !== "channel") return !1;
        let b = n.getSweeperActorState(v);
        return !(!b || b.midTurn || m(y.last_compact_at, y.last_event_at))
    }

    function p(y, v, b) {
        let _ = y.last_event_at ? Date.parse(y.last_event_at) : Number.NaN,
            I = Number.isFinite(_) ? _ : 0;
        return b - Math.max(I, typeof v == "number" ? v : 0)
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
        if (isSessionArchiving(_)) return Re("[idle-compact] skip: archiving", {
            sessionKey: _
        }), !1;
        let I = await Ga(t, _).catch(() => null);
        if (!I || I.runtime === "codex") return !1;
        let E = I.auto_compact_idle_minutes,
            R = I.auto_compact_min_context_tokens;
        if (!E || E <= 0 || !R || R <= 0 || v < E * Mut) return !1;
        let x = y.context_used_tokens;
        if (typeof x != "number" || x < R) return !1;
        let S = y.compact_measured_floor;
        if (typeof S == "number" && R <= S) {
            b.add(_);
            let A = `${y.compact_measured_at??""}:${R}`;
            return d.get(_) !== A ? (d.set(_, A), _t("info", "[idle-compact] fuse: threshold ≤ measured floor, skipping", {
                sessionKey: _,
                threshold: R,
                measured_floor: S
            })) : Re("[idle-compact] fuse: threshold ≤ measured floor, skipping (repeat)", {
                sessionKey: _,
                threshold: R,
                measured_floor: S
            }), !1
        }
        let D = I.channel_kind,
            $ = y.source_channel_id;
        try {
            await patchSessionRuntimeState(t, _, {
                last_compact_at: new Date().toISOString()
            })
        } catch (A) {
            if (A instanceof xm) return Re("[idle-compact] skip: archiving (marker write)", {
                sessionKey: _
            }), !1;
            throw A
        }
        return (await ingestChannelCommand(t, {
            sessionKey: _,
            sourceKind: D,
            sourceChannelId: $,
            sourceName: "idle-compact",
            command: "/compact",
            idle_ms: v,
            threshold_at_fire: R
        }, {
            bus: i
        })).routing.enqueued ? (i.emit("session.wake", {
            sessionKey: _,
            preempt: "never"
        }), te("[idle-compact] fired", {
            sessionKey: _,
            channel_kind: D,
            idle_ms: v,
            context_used_tokens: x
        }), !0) : (Z("[idle-compact] /compact not enqueued", {
            sessionKey: _
        }), !1)
    }
    async function g() {
        if (u || c) return u && Re("[idle-compact] sweep skipped: previous sweep still running"), 0;
        u = !0;
        let y = Date.now(),
            v = 0,
            b = new Set;
        try {
            let _ = Date.now();
            for (let I of r.listByKind("channel")) {
                if (c) break;
                if (v >= s) {
                    Re("[idle-compact] per-sweep fire cap reached", {
                        cap: s
                    });
                    break
                }
                try {
                    if (!f(I)) continue;
                    let E = n.getSweeperActorState(I.session_key);
                    if (!E) continue;
                    let R = p(I, E.lastActivityAt, _);
                    await h(I, R, b) && (v += 1)
                } catch (E) {
                    if (E instanceof xm) continue;
                    Le("[idle-compact] per-session sweep error", {
                        sessionKey: I.session_key,
                        error: E instanceof Error ? E.message : String(E)
                    })
                }
            }
            for (let I of d.keys()) b.has(I) || d.delete(I);
            Re("[idle-compact] sweep complete", {
                fired: v,
                durationMs: Date.now() - y
            })
        } catch (_) {
            Le("[idle-compact] sweep error", _)
        } finally {
            u = !1
        }
        return v
    }
    return {
        start() {
            a || c || (a = setInterval(() => {
                l = g()
            }, o), te("[idle-compact] started", {
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
            te("[idle-compact] stopped")
        },
        isSweeping() {
            return u
        },
        async sweepNow() {
            return g()
        }
    }
}
