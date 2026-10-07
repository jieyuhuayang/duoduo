// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: updateRegistryStatus  (minified: Vu, daemon.pretty.js:33022)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function updateRegistryStatus(e, t, n = new Date) {
    let r = await readRegistryStatusFile(e) ?? buildInitialRegistryStatus(e, n),
        i = t(r);
    return i.generated_at = n.toISOString(), await writeRegistryStatusFile(e, i), i
}
