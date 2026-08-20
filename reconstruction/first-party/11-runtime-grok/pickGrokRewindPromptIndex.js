// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: pickGrokRewindPromptIndex  (minified: vme, daemon.pretty.js:59960)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function pickGrokRewindPromptIndex(e, t) {
    if (!Number.isInteger(t) || t < 1) return null;
    let n = [...new Set(e.map(i => i.promptIndex).filter(i => Number.isInteger(i) && i >= 0).sort((i, o) => i - o))],
        r = n.length - t;
    return r < 1 ? null : n[r - 1] ?? null
}
