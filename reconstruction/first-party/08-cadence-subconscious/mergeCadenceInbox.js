// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: mergeCadenceInbox  (minified: Z_e, daemon.pretty.js:78081)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mergeCadenceInbox(e) {
    let t = [],
        n = [];
    try {
        let s = await Wd.readdir(e.cadenceInboxDir, {
            withFileTypes: !0
        });
        t = s.filter(a => a.isFile() && a.name.endsWith(".pending")).map(a => a.name).sort(), n = s.filter(a => a.isFile() && !a.name.endsWith(".pending")).map(a => a.name).sort()
    } catch {
        return 0
    }
    if (n.length > 0) {
        for (let s of n) await Wd.unlink(xC.join(e.cadenceInboxDir, s));
        K("[cadence] removed incompatible inbox files", {
            removed: n.length
        })
    }
    let r = await Wd.readFile(e.cadenceQueuePath, "utf8"),
        i = [],
        o = [];
    for (let s of t) {
        let l = (await Wd.readFile(xC.join(e.cadenceInboxDir, s), "utf8")).trim();
        l && i.push(l.startsWith("- [ ]") ? l : `- [ ] ${l}`), o.push(s)
    }
    if (i.length > 0) {
        let s = Aot(r, i);
        await qt(e.cadenceQueuePath, s)
    }
    if (o.length === 0) return 0;
    for (let s of o) await Wd.unlink(xC.join(e.cadenceInboxDir, s));
    return i.length
}
