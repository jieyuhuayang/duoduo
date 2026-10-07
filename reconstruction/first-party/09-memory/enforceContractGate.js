// duoduo reconstruction — subsystem: 09-memory
// symbol: enforceContractGate  (minified: UO, daemon.pretty.js:67634)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.6 (high): Each subconscious partition declares which `.pending` signal kinds it consumes in its `contract:` frontmatter. The memory-check delivery layer validates the declaration before posting — an undeclared signal kind is withheld
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function enforceContractGate(e, t, n) {
    if (t.state === "partition-absent") return "partition-absent";
    if (t.state === "self-id-mismatch") return "self-id-mismatch";
    if (!t.enabled) return "partition-disabled";
    switch (t.state) {
        case "valid":
            return t.consumes.has(e) ? null : "kind-not-consumed";
        case "no-contract":
            return n ? null : "no-contract";
        case "parse-fail":
            return n ? null : "parse-fail"
    }
}
