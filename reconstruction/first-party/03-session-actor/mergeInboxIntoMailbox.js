// duoduo reconstruction — subsystem: 03-session-actor
// symbol: mergeInboxIntoMailbox  (minified: fR, daemon.pretty.js:32558)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mergeInboxIntoMailbox(e, t) {
    let n = rb(e, t),
        r;
    try {
        r = (await ob(n)).sort()
    } catch (s) {
        throw new dR(s)
    }
    if (r.length === 0) return await _z(e, t), {
        merged: 0
    };
    let i = await _z(e, t),
        o = 0;
    for (let s of r) {
        let a = Ys.join(n, s),
            u;
        try {
            u = await yr.readFile(a, "utf8")
        } catch (h) {
            let g = h.code,
                y = fse(g);
            if (!y && g === "ENOENT") try {
                y = (await yr.lstat(a)).isSymbolicLink()
            } catch (v) {
                y = v.code !== "ENOENT"
            }
            if (!y) {
                if (g === "ENOENT") continue;
                throw h
            }
            Le(`[mailbox] unprocessable inbox item — quarantining: ${a}`, h);
            try {
                await jd(a, Ys.join(n, "quarantine"))
            } catch (v) {
                Le(`[mailbox] failed to quarantine inbox item — skipped for this merge: ${a}`, v)
            }
            continue
        }
        let l = u.trim();
        if (l.length === 0) {
            await yr.unlink(a);
            continue
        }
        let c = _se(l) ?? void 0,
            d = bse(l) ?? void 0,
            p = `${s.replace(/\.pending$/,"")}.item.json`,
            m = {
                line: l,
                event_id: c,
                reply_session_key: d,
                created_at: p5e(s) ?? new Date().toISOString()
            };
        await Dt(Ys.join(i, p), JSON.stringify(m) + `
`), await yr.unlink(a), o += 1
    }
    return {
        merged: o
    }
}
