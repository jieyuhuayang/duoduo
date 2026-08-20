// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generatePartitionCodexAgents  (minified: cQe, daemon.pretty.js:60876)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generatePartitionCodexAgents(e, t = {}) {
    let n = Ds.join(e, ".claude", "agents"),
        r = Ds.join(e, ".codex", "agents"),
        i = {
            generated: [],
            skipped: [],
            removed: [],
            errors: []
        },
        o = await dQe(r),
        s;
    try {
        s = (await xa.readdir(n, {
            withFileTypes: !0
        })).filter(u => u.isFile() && u.name.endsWith(".md")).map(u => Ds.join(n, u.name))
    } catch (l) {
        if (l?.code === "ENOENT") {
            if (t.removeStale !== !1) {
                for (let c of o) await xa.rm(c, {
                    force: !0
                }).catch(() => {}), i.removed.push(c);
                await xa.rmdir(r).catch(() => {})
            }
            return i
        }
        throw l
    }
    await xa.mkdir(r, {
        recursive: !0
    });
    let a = new Set;
    for (let l of s) try {
        let u = await xa.readFile(l, "utf8"),
            c = parseAgentMarkdown(l, u),
            d = Ds.join(r, `${c.name}.toml`),
            p = renderAgentToml(c);
        a.add(Ds.resolve(d));
        let f = await xa.readFile(d, "utf8").catch(() => {});
        if (f !== void 0 && fQe(f, p)) {
            i.skipped.push({
                sourcePath: l,
                targetPath: d,
                agentName: c.name
            });
            continue
        }
        let m = `${d}.tmp-${process.pid}-${Date.now()}`;
        await xa.writeFile(m, p, "utf8"), await xa.rename(m, d), i.generated.push({
            sourcePath: l,
            targetPath: d,
            agentName: c.name
        })
    } catch (u) {
        i.errors.push({
            path: l,
            reason: u instanceof Error ? u.message : String(u)
        })
    }
    if (t.removeStale !== !1)
        for (let l of o) a.has(Ds.resolve(l)) || (await xa.rm(l, {
            force: !0
        }).catch(() => {}), i.removed.push(l));
    return i
}
