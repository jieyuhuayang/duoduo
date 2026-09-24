// duoduo reconstruction — subsystem: 09-memory
// symbol: readPartitionContract  (minified: Jw, daemon.pretty.js:67193)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readPartitionContract(e, t) {
    let n;
    try {
        n = Ove.readFileSync(Nlt.join(e, t, "CLAUDE.md"), "utf8")
    } catch (l) {
        let c = l?.code;
        return c === "ENOENT" || c === "ENOTDIR" ? {
            state: "partition-absent"
        } : {
            state: "parse-fail",
            enabled: !0
        }
    }
    let r;
    try {
        r = (0, Ave.default)(n, _r).data
    } catch {
        return {
            state: "parse-fail",
            enabled: !0
        }
    }
    let i = $ve(r.schedule) ? r.schedule : {},
        o = typeof i.enabled == "boolean" ? i.enabled : !0,
        s = r.contract;
    if (s == null) return {
        state: "no-contract",
        enabled: o
    };
    if (!$ve(s)) return {
        state: "parse-fail",
        enabled: o
    };
    if (typeof s.partition != "string") return {
        state: "parse-fail",
        enabled: o
    };
    if (s.partition !== t) return {
        state: "self-id-mismatch",
        enabled: o
    };
    let a = s.consumes;
    if (!Array.isArray(a) || a.some(l => typeof l != "string")) return {
        state: "parse-fail",
        enabled: o
    };
    let u = new Set(a.map(normalizeSignalKindVersion));
    return {
        state: "valid",
        enabled: o,
        consumes: u
    }
}
