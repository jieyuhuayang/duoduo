// duoduo reconstruction — subsystem: 09-memory
// symbol: readOrSeedGapHandedDays  (minified: zdt, daemon.pretty.js:67824)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readOrSeedGapHandedDays(e, t, n) {
    let r = zc.join(t, "memory", uSe);
    try {
        return {
            coverage: _S(au.readFileSync(r, "utf8")),
            readFault: !1
        }
    } catch (s) {
        if (!lSe(s)) return recordUnreadableMemoryPath(s), {
            coverage: new Map,
            readFault: !0
        }
    }
    let i = listMemoryFragmentDates(e);
    if (i.readFault) return {
        coverage: new Map,
        readFault: !0
    };
    let o = i.dates.length > 0 ? `${i.dates.join(`
`)}
` : "";
    if (n) return {
        coverage: _S(o),
        readFault: !1
    };
    au.mkdirSync(zc.dirname(r), {
        recursive: !0
    });
    try {
        return au.writeFileSync(r, o, {
            encoding: "utf8",
            flag: "wx"
        }), {
            coverage: _S(o),
            readFault: !1
        }
    } catch (s) {
        if (s?.code !== "EEXIST") throw s;
        return Fdt(r)
    }
}
