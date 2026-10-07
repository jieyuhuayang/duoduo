// duoduo reconstruction — subsystem: 09-memory
// symbol: initMemorySignalKindsModule  (minified: Go, daemon.pretty.js:66889)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.5.8, v0.8.0 (maps/history_daemon.json)
// changelog v0.5.6 (medium): Each subconscious partition declares which `.pending` signal kinds it consumes in its `contract:` frontmatter. The memory-check delivery layer validates the declaration before posting — an undeclared signal kind is withheld
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Vn, initMemorySignalKindsModule = O(() => {
    "use strict";
    Vn = {
        ENTITY_CONVERGE: "entity-converge.v1",
        NODE_CONVERGE: "node-converge.v1",
        REVISE: "revise.v1",
        MERGE: "merge.v1",
        ORPHAN_ISLANDS: "orphan-islands.v1",
        ORPHAN_NEWBORN: "orphan-newborn.v1",
        SCAN_GAP: "scan-gap.v2",
        FOLD_GAP: "fold-gap.v1",
        CLAUDE_COMPRESS: "claude-compress.v1",
        CLAUDE_LINT: "claude-lint.v1",
        CLAUDE_FLATTEN: "claude-flatten.v1",
        ACTIVATION_REPORT: "activation-report.v1"
    }
});
