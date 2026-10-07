// duoduo reconstruction — subsystem: 09-memory
// symbol: readPartitionContract  (minified: vS, daemon.pretty.js:67484)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readPartitionContract(e, t) {
    let n;
    try {
        n = Gwe.readFileSync(Pdt.join(e, t, "CLAUDE.md"), "utf8")
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
        r = (0, Zwe.default)(n, Sr).data
    } catch {
        return {
            state: "parse-fail",
            enabled: !0
        }
    }
    let i = Jwe(r.schedule) ? r.schedule : {},
        o = typeof i.enabled == "boolean" ? i.enabled : !0,
        s = r.contract;
    if (s == null) return {
        state: "no-contract",
        enabled: o
    };
    if (!Jwe(s)) return {
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
