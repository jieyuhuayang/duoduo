// duoduo reconstruction — subsystem: 09-memory
// symbol: readOrSeedGapHandedDays  (minified: Hlt, daemon.pretty.js:67533)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readOrSeedGapHandedDays(e, t, n) {
    let r = Cc.join(t, "memory", Wve);
    try {
        return {
            coverage: Ww(Xa.readFileSync(r, "utf8")),
            readFault: !1
        }
    } catch (s) {
        if (!Jve(s)) return recordUnreadableMemoryPath(s), {
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
        coverage: Ww(o),
        readFault: !1
    };
    Xa.mkdirSync(Cc.dirname(r), {
        recursive: !0
    });
    try {
        return Xa.writeFileSync(r, o, {
            encoding: "utf8",
            flag: "wx"
        }), {
            coverage: Ww(o),
            readFault: !1
        }
    } catch (s) {
        if (s?.code !== "EEXIST") throw s;
        return Vlt(r)
    }
}
