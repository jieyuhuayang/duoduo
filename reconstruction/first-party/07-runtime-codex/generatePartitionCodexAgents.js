// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generatePartitionCodexAgents  (minified: g5e, daemon.pretty.js:58620)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generatePartitionCodexAgents(e, t = {}) {
    let n = yo.join(e, ".claude", "agents"),
        r = yo.join(e, ".codex", "agents"),
        i = {
            generated: [],
            skipped: [],
            removed: [],
            errors: []
        },
        s = await y5e(r),
        o;
    try {
        o = (await oa.readdir(n, {
            withFileTypes: !0
        })).filter(u => u.isFile() && u.name.endsWith(".md")).map(u => yo.join(n, u.name))
    } catch (c) {
        if (c?.code === "ENOENT") {
            if (t.removeStale !== !1) {
                for (let l of s) await oa.rm(l, {
                    force: !0
                }).catch(() => {}), i.removed.push(l);
                await oa.rmdir(r).catch(() => {})
            }
            return i
        }
        throw c
    }
    await oa.mkdir(r, {
        recursive: !0
    });
    let a = new Set;
    for (let c of o) try {
        let u = await oa.readFile(c, "utf8"),
            l = parseAgentMarkdown(c, u),
            d = yo.join(r, `${l.name}.toml`),
            p = renderAgentToml(l);
        a.add(yo.resolve(d));
        let f = await oa.readFile(d, "utf8").catch(() => {});
        if (f !== void 0 && _5e(f, p)) {
            i.skipped.push({
                sourcePath: c,
                targetPath: d,
                agentName: l.name
            });
            continue
        }
        let m = `${d}.tmp-${process.pid}-${Date.now()}`;
        await oa.writeFile(m, p, "utf8"), await oa.rename(m, d), i.generated.push({
            sourcePath: c,
            targetPath: d,
            agentName: l.name
        })
    } catch (u) {
        i.errors.push({
            path: c,
            reason: u instanceof Error ? u.message : String(u)
        })
    }
    if (t.removeStale !== !1)
        for (let c of s) a.has(yo.resolve(c)) || (await oa.rm(c, {
            force: !0
        }).catch(() => {}), i.removed.push(c));
    return i
}
