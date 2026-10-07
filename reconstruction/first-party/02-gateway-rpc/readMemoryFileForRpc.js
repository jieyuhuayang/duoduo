// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readMemoryFileForRpc  (minified: QSe, daemon.pretty.js:89453)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readMemoryFileForRpc(e, t) {
    let n = nU(t);
    if (n !== null) throw new Uc(Dm("memory.read", n));
    let r = t.path,
        i = new Uc(`"${r}" is outside duoduo's memory`),
        o = new Uc(`No file memory/${r}`),
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
    if ((await KO.stat(u)).isDirectory()) throw new Uc(`memory/${r} is a directory`);
    return {
        path: r,
        text: await KO.readFile(u, "utf8")
    }
}
