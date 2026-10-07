// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readMemoryFileForRpc  (minified: QSe, daemon.pretty.js:89453)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readMemoryFileForRpc(e, t) {
    let n = describeMemoryReadProblem(t);
    if (n !== null) throw new MemoryReadRpcError(renderParamsProblem("memory.read", n));
    let r = t.path,
        i = new MemoryReadRpcError(`"${r}" is outside duoduo's memory`),
        o = new MemoryReadRpcError(`No file memory/${r}`),
        s = YO.resolve(e.memoryDir, r);
    if (!XSe(e.memoryDir, s)) throw i;
    let a, u;
    try {
        a = await KO.realpath(e.memoryDir), u = await KO.realpath(s)
    } catch (l) {
        let c = l.code;
        throw c === "ENOENT" || c === "ENOTDIR" ? o : l
    }
    if (!XSe(a, u)) throw i;
    if ((await KO.stat(u)).isDirectory()) throw new MemoryReadRpcError(`memory/${r} is a directory`);
    return {
        path: r,
        text: await KO.readFile(u, "utf8")
    }
}
