// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostDotEnvLines  (minified: ZO, daemon.pretty.js:69099)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostDotEnvLines(e, t) {
    let n = hostDotEnvPath(t),
        r = USe.dirname(n);
    if (!e.some(u => u.trim() !== "")) {
        await Ns.rm(n, {
            force: !0
        });
        return
    }
    await Ns.mkdir(r, {
        recursive: !0
    });
    let o = [...e];
    for (; o.length > 0 && o[o.length - 1] === "";) o.pop();
    let s = o.join(`
`) + `
`,
        a = `${n}.tmp`;
    await Ns.writeFile(a, s, {
        encoding: "utf8",
        mode: 384
    }), await Ns.rename(a, n), await Ns.chmod(n, 384)
}
