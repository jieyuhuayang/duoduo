// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: mergeCadenceInbox  (minified: the, daemon.pretty.js:74721)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mergeCadenceInbox(e) {
    let t = [],
        n = [];
    try {
        let o = await fd.readdir(e.cadenceInboxDir, {
            withFileTypes: !0
        });
        t = o.filter(a => a.isFile() && a.name.endsWith(".pending")).map(a => a.name).sort(), n = o.filter(a => a.isFile() && !a.name.endsWith(".pending")).map(a => a.name).sort()
    } catch {
        return 0
    }
    if (n.length > 0) {
        for (let o of n) await fd.unlink(YI.join(e.cadenceInboxDir, o));
        J("[cadence] removed incompatible inbox files", {
            removed: n.length
        })
    }
    let r = await fd.readFile(e.cadenceQueuePath, "utf8"),
        i = [],
        s = [];
    for (let o of t) {
        let u = (await fd.readFile(YI.join(e.cadenceInboxDir, o), "utf8")).trim();
        u && i.push(u.startsWith("- [ ]") ? u : `- [ ] ${u}`), s.push(o)
    }
    if (i.length > 0) {
        let o = fet(r, i);
        await Mt(e.cadenceQueuePath, o)
    }
    if (s.length === 0) return 0;
    for (let o of s) await fd.unlink(YI.join(e.cadenceInboxDir, o));
    return i.length
}
