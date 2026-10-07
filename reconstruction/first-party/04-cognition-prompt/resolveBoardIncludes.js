// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveBoardIncludes  (minified: jRe, daemon.pretty.js:82514)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.2 (high): The runtime parses Claude Code's `@<file>` directives itself and injects the rendered import graph
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveBoardIncludes(e, t, n = 0, r) {
    if (n >= Z_t) return [];
    let i = ba.resolve(e),
        o = normalizeIncludePathKey(i);
    if (t.has(o)) return [];
    let s = ba.extname(i).toLowerCase();
    if (s && !K_t.has(s)) return [];
    let a = await realpathOrSelf(i);
    t.add(o), t.add(normalizeIncludePathKey(a));
    let u = await Q_t(i);
    if (u === void 0) return [];
    let {
        content: l,
        includePaths: c
    } = parseBoardFileContent(u, a);
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
