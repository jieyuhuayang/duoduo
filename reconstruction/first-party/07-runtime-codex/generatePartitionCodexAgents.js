// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generatePartitionCodexAgents  (minified: n5e, daemon.pretty.js:58498)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generatePartitionCodexAgents(e, t = {}) {
    let n = ho.join(e, ".claude", "agents"),
        r = ho.join(e, ".codex", "agents"),
        i = {
            generated: [],
            skipped: [],
            removed: [],
            errors: []
        },
        s = await r5e(r),
        o;
    try {
        o = (await sa.readdir(n, {
            withFileTypes: !0
        })).filter(c => c.isFile() && c.name.endsWith(".md")).map(c => ho.join(n, c.name))
    } catch (u) {
        if (u?.code === "ENOENT") {
            if (t.removeStale !== !1) {
                for (let l of s) await sa.rm(l, {
                    force: !0
                }).catch(() => {}), i.removed.push(l);
                await sa.rmdir(r).catch(() => {})
            }
            return i
        }
        throw u
    }
    await sa.mkdir(r, {
        recursive: !0
    });
    let a = new Set;
    for (let u of o) try {
        let c = await sa.readFile(u, "utf8"),
            l = parseAgentMarkdown(u, c),
            d = ho.join(r, `${l.name}.toml`),
            p = renderAgentToml(l);
        a.add(ho.resolve(d));
        let f = await sa.readFile(d, "utf8").catch(() => {});
        if (f !== void 0 && i5e(f, p)) {
            i.skipped.push({
                sourcePath: u,
                targetPath: d,
                agentName: l.name
            });
            continue
        }
        let m = `${d}.tmp-${process.pid}-${Date.now()}`;
        await sa.writeFile(m, p, "utf8"), await sa.rename(m, d), i.generated.push({
            sourcePath: u,
            targetPath: d,
            agentName: l.name
        })
    } catch (c) {
        i.errors.push({
            path: u,
            reason: c instanceof Error ? c.message : String(c)
        })
    }
    if (t.removeStale !== !1)
        for (let u of s) a.has(ho.resolve(u)) || (await sa.rm(u, {
            force: !0
        }).catch(() => {}), i.removed.push(u));
    return i
}
