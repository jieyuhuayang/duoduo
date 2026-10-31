// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readMemoryFileForRpc  (minified: yxe, daemon.pretty.js:90938)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 11 renamed — 5 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readMemoryFileForRpc(paths, params) {
    let problem = describeMemoryReadProblem(params);
    if (problem !== null) throw new MemoryReadRpcError(renderParamsProblem("memory.read", problem));
    let path = params.path,
        memoryReadRpcError = new MemoryReadRpcError(`"${path}" is outside duoduo's memory`),
        memoryReadRpcError2 = new MemoryReadRpcError(`No file memory/${path}`),
        resolvedPath = gA.resolve(paths.memoryDir, path);
    if (!gxe(paths.memoryDir, resolvedPath)) throw memoryReadRpcError;
    let memoryDirRealpath, fileRealpath;
    try {
        memoryDirRealpath = await hA.realpath(paths.memoryDir), fileRealpath = await hA.realpath(resolvedPath)
    } catch (err) {
        let code = err.code;
        throw code === "ENOENT" || code === "ENOTDIR" ? memoryReadRpcError2 : err
    }
    if (!gxe(memoryDirRealpath, fileRealpath)) throw memoryReadRpcError;
    if ((await hA.stat(fileRealpath)).isDirectory()) throw new MemoryReadRpcError(`memory/${path} is a directory`);
    return {
        path,
        text: await hA.readFile(fileRealpath, "utf8")
    }
}
