// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createIdleCompactSweeper  (minified: bwe, daemon.pretty.js:88907)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.8.4 (maps/history_daemon.json)
// locals: 52 renamed — 18 from the code at the binding (rule), 34 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.10 (high): A channel session that has sat idle past a configurable threshold and grown past a token floor now silently runs `/compact` on its next turn
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createIdleCompactSweeper(options) {
    let {
        paths,
        sessionManager,
        sessionIndex,
        bus
    } = options, intervalMs = options.intervalMs ?? Oct, fireCapPerSweep = options.fireCapPerSweep ?? Nct, intervalHandle = null, sweeping = !1, currentSweep = null, stopped = !1, map = new Map;

    function isEligible(entry) {
        let sessionKey = entry.session_key;
        if (classifySessionKeyKind(sessionKey) !== "channel") return !1;
        let actorState = sessionManager.getSweeperActorState(sessionKey);
        return !(!actorState || actorState.midTurn || isCompactedSinceLastEvent(entry.last_compact_at, entry.last_event_at))
    }

    function computeIdleMs(entry, lastActivityAt, now) {
        let parsedLastEventAt = entry.last_event_at ? Date.parse(entry.last_event_at) : Number.NaN,
            lastEventMs = Number.isFinite(parsedLastEventAt) ? parsedLastEventAt : 0;
        return now - Math.max(lastEventMs, typeof lastActivityAt == "number" ? lastActivityAt : 0)
    }

    function isCompactedSinceLastEvent(lastCompactAt, lastEventAt) {
        if (!lastCompactAt) return !1;
        let compactMs = Date.parse(lastCompactAt);
        if (Number.isNaN(compactMs)) return !1;
        if (!lastEventAt) return !0;
        let eventMs = Date.parse(lastEventAt);
        return Number.isNaN(eventMs) ? !0 : compactMs >= eventMs
    }
    async function tryFireCompact(entry, idleMs, fusedKeys) {
        let sessionKey = entry.session_key;
        if (isSessionArchiving(sessionKey)) return logDebugMessage("[idle-compact] skip: archiving", {
            sessionKey
        }), !1;
        let channelConfig = await resolveChannelConfigBySession(paths, sessionKey).catch(() => null);
        if (!channelConfig || channelConfig.runtime === "codex" || channelConfig.runtimeRefusal || channelConfig.runtime === "void") return !1;
        let autoCompactIdleMinutes = channelConfig.auto_compact_idle_minutes,
            autoCompactMinContextTokens = channelConfig.auto_compact_min_context_tokens;
        if (!autoCompactIdleMinutes || autoCompactIdleMinutes <= 0 || !autoCompactMinContextTokens || autoCompactMinContextTokens <= 0 || idleMs < autoCompactIdleMinutes * Act) return !1;
        let contextUsedTokens = entry.context_used_tokens;
        if (typeof contextUsedTokens != "number" || contextUsedTokens < autoCompactMinContextTokens) return !1;
        let compactMeasuredFloor = entry.compact_measured_floor;
        if (typeof compactMeasuredFloor == "number" && autoCompactMinContextTokens <= compactMeasuredFloor) {
            fusedKeys.add(sessionKey);
            let fuseKey = `${entry.compact_measured_at??""}:${autoCompactMinContextTokens}`;
            return map.get(sessionKey) !== fuseKey ? (map.set(sessionKey, fuseKey), logAlwaysAtLevel("info", "[idle-compact] fuse: threshold ≤ measured floor, skipping", {
                sessionKey,
                threshold: autoCompactMinContextTokens,
                measured_floor: compactMeasuredFloor
            })) : logDebugMessage("[idle-compact] fuse: threshold ≤ measured floor, skipping (repeat)", {
                sessionKey,
                threshold: autoCompactMinContextTokens,
                measured_floor: compactMeasuredFloor
            }), !1
        }
        let channelKind = channelConfig.channel_kind,
            sourceChannelId = entry.source_channel_id;
        try {
            await patchSessionRuntimeState(paths, sessionKey, {
                last_compact_at: new Date().toISOString()
            })
        } catch (err) {
            if (err instanceof Um) return logDebugMessage("[idle-compact] skip: archiving (marker write)", {
                sessionKey
            }), !1;
            throw err
        }
        return (await ingestChannelCommand(paths, {
            sessionKey,
            sourceKind: channelKind,
            sourceChannelId,
            sourceName: "idle-compact",
            command: "/compact",
            idle_ms: idleMs,
            threshold_at_fire: autoCompactMinContextTokens
        }, {
            bus
        })).routing.enqueued ? (bus.emit("session.wake", {
            sessionKey,
            preempt: "never"
        }), logInfoMessage("[idle-compact] fired", {
            sessionKey,
            channel_kind: channelKind,
            idle_ms: idleMs,
            context_used_tokens: contextUsedTokens
        }), !0) : (logWarnMessage("[idle-compact] /compact not enqueued", {
            sessionKey
        }), !1)
    }
    async function sweep() {
        if (sweeping || stopped) return sweeping && logDebugMessage("[idle-compact] sweep skipped: previous sweep still running"), 0;
        sweeping = !0;
        let now = Date.now(),
            fired = 0,
            fusedKeys = new Set;
        try {
            let now2 = Date.now();
            for (let entry of sessionIndex.listByKind("channel")) {
                if (stopped) break;
                if (fired >= fireCapPerSweep) {
                    logDebugMessage("[idle-compact] per-sweep fire cap reached", {
                        cap: fireCapPerSweep
                    });
                    break
                }
                try {
                    if (!isEligible(entry)) continue;
                    let actorState = sessionManager.getSweeperActorState(entry.session_key);
                    if (!actorState) continue;
                    let idleMs = computeIdleMs(entry, actorState.lastActivityAt, now2);
                    await tryFireCompact(entry, idleMs, fusedKeys) && (fired += 1)
                } catch (err) {
                    if (err instanceof Um) continue;
                    logErrorMessage("[idle-compact] per-session sweep error", {
                        sessionKey: entry.session_key,
                        error: err instanceof Error ? err.message : String(err)
                    })
                }
            }
            for (let sessionKey of map.keys()) fusedKeys.has(sessionKey) || map.delete(sessionKey);
            logDebugMessage("[idle-compact] sweep complete", {
                fired,
                durationMs: Date.now() - now
            })
        } catch (err) {
            logErrorMessage("[idle-compact] sweep error", err)
        } finally {
            sweeping = !1
        }
        return fired
    }
    return {
        start() {
            intervalHandle || stopped || (intervalHandle = setInterval(() => {
                currentSweep = sweep()
            }, intervalMs), logInfoMessage("[idle-compact] started", {
                intervalMs,
                fireCapPerSweep
            }))
        },
        async stop() {
            if (stopped = !0, intervalHandle && (clearInterval(intervalHandle), intervalHandle = null), currentSweep) {
                try {
                    await currentSweep
                } catch {}
                currentSweep = null
            }
            logInfoMessage("[idle-compact] stopped")
        },
        isSweeping() {
            return sweeping
        },
        async sweepNow() {
            return sweep()
        }
    }
}
