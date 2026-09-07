// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generatePartitionCodexAgents  (minified: prt, daemon.pretty.js:62803)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generatePartitionCodexAgents(e, t = {}) {
    let n = js.join(e, ".claude", "agents"),
        r = js.join(e, ".codex", "agents"),
        i = {
            generated: [],
            skipped: [],
            removed: [],
            errors: []
        },
        o = await mrt(r),
        s;
    try {
        s = (await Ia.readdir(n, {
            withFileTypes: !0
        })).filter(u => u.isFile() && u.name.endsWith(".md")).map(u => js.join(n, u.name))
    } catch (l) {
        if (l?.code === "ENOENT") {
            if (t.removeStale !== !1) {
                for (let c of o) await Ia.rm(c, {
                    force: !0
                }).catch(() => {}), i.removed.push(c);
                await Ia.rmdir(r).catch(() => {})
            }
            return i
        }
        throw l
    }
    await Ia.mkdir(r, {
        recursive: !0
    });
    let a = new Set;
    for (let l of s) try {
        let u = await Ia.readFile(l, "utf8"),
            c = parseAgentMarkdown(l, u),
            d = js.join(r, `${c.name}.toml`),
            p = renderAgentToml(c);
        a.add(js.resolve(d));
        let f = await Ia.readFile(d, "utf8").catch(() => {});
        if (f !== void 0 && hrt(f, p)) {
            i.skipped.push({
                sourcePath: l,
                targetPath: d,
                agentName: c.name
            });
            continue
        }
        let m = `${d}.tmp-${process.pid}-${Date.now()}`;
        await Ia.writeFile(m, p, "utf8"), await Ia.rename(m, d), i.generated.push({
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
        for (let l of o) a.has(js.resolve(l)) || (await Ia.rm(l, {
            force: !0
        }).catch(() => {}), i.removed.push(l));
    return i
}
