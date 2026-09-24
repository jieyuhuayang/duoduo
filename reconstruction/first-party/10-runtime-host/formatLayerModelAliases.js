// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: formatLayerModelAliases  (minified: T0e, daemon.pretty.js:90076)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatLayerModelAliases(e, t) {
    let n = Object.entries(e ?? {});
    if (n.length !== 0) return n.map(([r, i]) => ({
        tier: r,
        model: i,
        source: t
    })).sort((r, i) => r.tier.localeCompare(i.tier))
}
