// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generatePartitionCodexAgents  (minified: Wit, daemon.pretty.js:63390)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generatePartitionCodexAgents(e, t = {}) {
    let n = Vs.join(e, ".claude", "agents"),
        r = Vs.join(e, ".codex", "agents"),
        i = {
            generated: [],
            skipped: [],
            removed: [],
            errors: []
        },
        o = await Jit(r),
        s;
    try {
        s = (await ja.readdir(n, {
            withFileTypes: !0
        })).filter(u => u.isFile() && u.name.endsWith(".md")).map(u => Vs.join(n, u.name))
    } catch (l) {
        if (l?.code === "ENOENT") {
            if (t.removeStale !== !1) {
                for (let c of o) await ja.rm(c, {
                    force: !0
                }).catch(() => {}), i.removed.push(c);
                await ja.rmdir(r).catch(() => {})
            }
            return i
        }
        throw l
    }
    await ja.mkdir(r, {
        recursive: !0
    });
    let a = new Set;
    for (let l of s) try {
        let u = await ja.readFile(l, "utf8"),
            c = parseAgentMarkdown(l, u),
            d = Vs.join(r, `${c.name}.toml`),
            p = renderAgentToml(c);
        a.add(Vs.resolve(d));
        let f = await ja.readFile(d, "utf8").catch(() => {});
        if (f !== void 0 && Git(f, p)) {
            i.skipped.push({
                sourcePath: l,
                targetPath: d,
                agentName: c.name
            });
            continue
        }
        let m = `${d}.tmp-${process.pid}-${Date.now()}`;
        await ja.writeFile(m, p, "utf8"), await ja.rename(m, d), i.generated.push({
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
        for (let l of o) a.has(Vs.resolve(l)) || (await ja.rm(l, {
            force: !0
        }).catch(() => {}), i.removed.push(l));
    return i
}
