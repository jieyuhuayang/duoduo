// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveBoardIncludes  (minified: JEe, daemon.pretty.js:82212)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveBoardIncludes(e, t, n = 0, r) {
    if (n >= fgt) return [];
    let i = ha.resolve(e),
        o = normalizeIncludePathKey(i);
    if (t.has(o)) return [];
    let s = ha.extname(i).toLowerCase();
    if (s && !pgt.has(s)) return [];
    let a = await realpathOrSelf(i);
    t.add(o), t.add(normalizeIncludePathKey(a));
    let u = await ggt(i);
    if (u === void 0) return [];
    let {
        content: l,
        includePaths: c
    } = bgt(u, a);
    if (!l.trim()) return [];
    let d = [{
        path: i,
        content: l,
        parentPath: r
    }];
    for (let f of c) {
        let p = await resolveBoardIncludes(f, t, n + 1, i);
        d.push(...p)
    }
    return d
}
