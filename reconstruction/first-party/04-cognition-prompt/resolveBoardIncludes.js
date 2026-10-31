// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: resolveBoardIncludes  (minified: tTe, daemon.pretty.js:83805)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 14 renamed — 4 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (high): The runtime parses Claude Code's `@<file>` directives itself and injects the rendered import graph
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveBoardIncludes(filePath, visited, depth = 0, parentPath) {
    if (depth >= ywt) return [];
    let resolvedPath = Ea.resolve(filePath),
        includePathKey = normalizeIncludePathKey(resolvedPath);
    if (visited.has(includePathKey)) return [];
    let extension = Ea.extname(resolvedPath).toLowerCase();
    if (extension && !_wt.has(extension)) return [];
    let realPath = await realpathOrSelf(resolvedPath);
    visited.add(includePathKey), visited.add(normalizeIncludePathKey(realPath));
    let rawContent = await wwt(resolvedPath);
    if (rawContent === void 0) return [];
    let {
        content,
        includePaths
    } = parseBoardFileContent(rawContent, realPath);
    if (!content.trim()) return [];
    let results = [{
        path: resolvedPath,
        content,
        parentPath
    }];
    for (let includePath of includePaths) {
        let boardIncludes = await resolveBoardIncludes(includePath, visited, depth + 1, resolvedPath);
        results.push(...boardIncludes)
    }
    return results
}
