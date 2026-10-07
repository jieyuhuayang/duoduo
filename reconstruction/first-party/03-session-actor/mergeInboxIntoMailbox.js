// duoduo reconstruction — subsystem: 03-session-actor
// symbol: mergeInboxIntoMailbox  (minified: HR, daemon.pretty.js:32661)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mergeInboxIntoMailbox(e, t) {
    let n = resolveSessionInboxDir(e, t),
        r;
    try {
        r = (await $b(n)).sort()
    } catch (s) {
        throw new VR(s)
    }
    if (r.length === 0) return await bU(e, t), {
        merged: 0
    };
    let i = await bU(e, t),
        o = 0;
    for (let s of r) {
        let a = ea.join(n, s),
            u;
        try {
            u = await wr.readFile(a, "utf8")
        } catch (h) {
            let g = h.code,
                y = Pae(g);
            if (!y && g === "ENOENT") try {
                y = (await wr.lstat(a)).isSymbolicLink()
            } catch (v) {
                y = v.code !== "ENOENT"
            }
            if (!y) {
                if (g === "ENOENT") continue;
                throw h
            }
            Ue(`[mailbox] unprocessable inbox item — quarantining: ${a}`, h);
            try {
                await Gd(a, ea.join(n, "quarantine"))
            } catch (v) {
                Ue(`[mailbox] failed to quarantine inbox item — skipped for this merge: ${a}`, v)
            }
            continue
        }
        let l = u.trim();
        if (l.length === 0) {
            await wr.unlink(a);
            continue
        }
        let c = Dae(l) ?? void 0,
            d = Mae(l) ?? void 0,
            p = `${s.replace(/\.pending$/,"")}.item.json`,
            m = {
                line: l,
                event_id: c,
                reply_session_key: d,
                created_at: aYe(s) ?? new Date().toISOString()
            };
        await Dt(ea.join(i, p), JSON.stringify(m) + `
`), await wr.unlink(a), o += 1
    }
    return {
        merged: o
    }
}
