// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: materializeClaudeSettingsFile  (minified: Q_e, daemon.pretty.js:65406)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function materializeClaudeSettingsFile(e) {
    let t = buildClaudeSettingsEnvOverrides(e);
    if (!t) return;
    fut();
    let n = cut(t),
        r = Y_e.join(e.dir, dut(n));
    return ZV.has(r) || (await Dt(r, n, {
        mode: 384
    }), await JV.chmod(r, 384), ZV.add(r)), r
}
