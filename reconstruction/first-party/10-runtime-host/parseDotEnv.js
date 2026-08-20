// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseDotEnv  (minified: jI, daemon.pretty.js:58519)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseDotEnv(e) {
    let t = {};
    for (let n of e.split(`
`)) {
        let r = n.trim();
        if (!r || r.startsWith("#")) continue;
        let i = r.indexOf("=");
        if (i < 1) continue;
        let o = r.slice(0, i).trim(),
            s = r.slice(i + 1).trim();
        (s.startsWith('"') && s.endsWith('"') || s.startsWith("'") && s.endsWith("'")) && (s = s.slice(1, -1)), t[o] = s
    }
    return t
}
