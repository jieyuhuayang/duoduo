// duoduo reconstruction — subsystem: 09-memory
// symbol: readPartitionContract  (minified: MS, daemon.pretty.js:68683)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// locals: 12 renamed — 3 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (high): Each subconscious partition declares which `.pending` signal kinds it consumes in its `contract:` frontmatter. The memory-check delivery layer validates the declaration before posting — an undeclared signal kind is withheld
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readPartitionContract(subconsciousDir, partition) {
    let content;
    try {
        content = fke.readFileSync(Kpt.join(subconsciousDir, partition, "CLAUDE.md"), "utf8")
    } catch (err) {
        let code = err?.code;
        return code === "ENOENT" || code === "ENOTDIR" ? {
            state: "partition-absent"
        } : {
            state: "parse-fail",
            enabled: !0
        }
    }
    let frontmatter;
    try {
        frontmatter = (0, pke.default)(content, Er).data
    } catch {
        return {
            state: "parse-fail",
            enabled: !0
        }
    }
    let schedule = dke(frontmatter.schedule) ? frontmatter.schedule : {},
        enabled = typeof schedule.enabled == "boolean" ? schedule.enabled : !0,
        contract = frontmatter.contract;
    if (contract == null) return {
        state: "no-contract",
        enabled
    };
    if (!dke(contract)) return {
        state: "parse-fail",
        enabled
    };
    if (typeof contract.partition != "string") return {
        state: "parse-fail",
        enabled
    };
    if (contract.partition !== partition) return {
        state: "self-id-mismatch",
        enabled
    };
    let consumes = contract.consumes;
    if (!Array.isArray(consumes) || consumes.some(item => typeof item != "string")) return {
        state: "parse-fail",
        enabled
    };
    let consumesSet = new Set(consumes.map(normalizeSignalKindVersion));
    return {
        state: "valid",
        enabled,
        consumes: consumesSet
    }
}
