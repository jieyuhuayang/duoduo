// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generatePartitionCodexAgents  (minified: gdt, daemon.pretty.js:69245)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generatePartitionCodexAgents(e, t = {}) {
    let n = la.join(e, ".claude", "agents"),
        r = la.join(e, ".codex", "agents"),
        i = {
            generated: [],
            skipped: [],
            removed: [],
            errors: []
        },
        o = await ydt(r),
        s;
    try {
        s = (await eu.readdir(n, {
            withFileTypes: !0
        })).filter(l => l.isFile() && l.name.endsWith(".md")).map(l => la.join(n, l.name))
    } catch (u) {
        if (u?.code === "ENOENT") {
            if (t.removeStale !== !1) {
                for (let c of o) await eu.rm(c, {
                    force: !0
                }).catch(() => {}), i.removed.push(c);
                await eu.rmdir(r).catch(() => {})
            }
            return i
        }
        throw u
    }
    await eu.mkdir(r, {
        recursive: !0
    });
    let a = new Set;
    for (let u of s) try {
        let l = await eu.readFile(u, "utf8"),
            c = parseAgentMarkdown(u, l),
            d = la.join(r, `${c.name}.toml`),
            f = renderAgentToml(c);
        a.add(la.resolve(d));
        let p = await eu.readFile(d, "utf8").catch(() => {});
        if (p !== void 0 && _dt(p, f)) {
            i.skipped.push({
                sourcePath: u,
                targetPath: d,
                agentName: c.name
            });
            continue
        }
        let m = `${d}.tmp-${process.pid}-${Date.now()}`;
        await eu.writeFile(m, f, "utf8"), await eu.rename(m, d), i.generated.push({
            sourcePath: u,
            targetPath: d,
            agentName: c.name
        })
    } catch (l) {
        i.errors.push({
            path: u,
            reason: l instanceof Error ? l.message : String(l)
        })
    }
    if (t.removeStale !== !1)
        for (let u of o) a.has(la.resolve(u)) || (await eu.rm(u, {
            force: !0
        }).catch(() => {}), i.removed.push(u));
    return i
}
