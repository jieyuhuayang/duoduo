// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveNotifyTargetSessionKey  (minified: rut, daemon.pretty.js:65179)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveNotifyTargetSessionKey(e, t) {
    let n = t?.trim(),
        r = await AR(e),
        i = Object.keys(r);
    if (!n) {
        let l = await j_e(e, i),
            c = await L_e(e, i, l),
            d = q_e(void 0, r, c, l);
        throw new Error(["target_session_key is required in this session.", "The target must be a foreground working session.", ...B_e(d)].join(`
`))
    }
    if (n in r) return n;
    let o = await j_e(e, i),
        s = await L_e(e, i, o),
        a = [...s.entries()].filter(([, l]) => l === n).map(([l]) => l);
    if (a.length === 1) return a[0];
    if (a.length > 1) {
        let l = a.map(c => {
            let d = r[c];
            return {
                sessionKey: c,
                lastEventAt: d?.last_event_at,
                sortKey: d?.last_event_at ?? d?.updated_at ?? ""
            }
        }).sort((c, d) => d.sortKey.localeCompare(c.sortKey));
        throw new Error([`Ambiguous target alias: ${a.length} sessions share the display name "${n}".`, "Retry with the full session_key of the one you mean (most recent activity first):", ...l.map(c => c.lastEventAt ? `- ${c.sessionKey} (last activity ${c.lastEventAt})` : `- ${c.sessionKey} (never drained; session state written ${c.sortKey||"unknown"})`)].join(`
`))
    }
    let u = q_e(n, r, s, o);
    throw new Error([`Target session not found: ${n}`, "The target must be a persisted session key or a session display-name alias (prefer active foreground sessions).", ...B_e(u)].join(`
`))
}
