// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseDotEnv  (minified: xU, daemon.pretty.js:57085)
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
        let s = r.slice(0, i).trim(),
            o = r.slice(i + 1).trim();
        (o.startsWith('"') && o.endsWith('"') || o.startsWith("'") && o.endsWith("'")) && (o = o.slice(1, -1)), t[s] = o
    }
    return t
}
