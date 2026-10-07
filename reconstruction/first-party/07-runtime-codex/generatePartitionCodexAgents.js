// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generatePartitionCodexAgents  (minified: Qpt, daemon.pretty.js:69536)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generatePartitionCodexAgents(e, t = {}) {
    let n = pa.join(e, ".claude", "agents"),
        r = pa.join(e, ".codex", "agents"),
        i = {
            generated: [],
            skipped: [],
            removed: [],
            errors: []
        },
        o = await emt(r),
        s;
    try {
        s = (await lu.readdir(n, {
            withFileTypes: !0
        })).filter(l => l.isFile() && l.name.endsWith(".md")).map(l => pa.join(n, l.name))
    } catch (u) {
        if (u?.code === "ENOENT") {
            if (t.removeStale !== !1) {
                for (let c of o) await lu.rm(c, {
                    force: !0
                }).catch(() => {}), i.removed.push(c);
                await lu.rmdir(r).catch(() => {})
            }
            return i
        }
        throw u
    }
    await lu.mkdir(r, {
        recursive: !0
    });
    let a = new Set;
    for (let u of s) try {
        let l = await lu.readFile(u, "utf8"),
            c = parseAgentMarkdown(u, l),
            d = pa.join(r, `${c.name}.toml`),
            f = renderAgentToml(c);
        a.add(pa.resolve(d));
        let p = await lu.readFile(d, "utf8").catch(() => {});
        if (p !== void 0 && tmt(p, f)) {
            i.skipped.push({
                sourcePath: u,
                targetPath: d,
                agentName: c.name
            });
            continue
        }
        let m = `${d}.tmp-${process.pid}-${Date.now()}`;
        await lu.writeFile(m, f, "utf8"), await lu.rename(m, d), i.generated.push({
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
        for (let u of o) a.has(pa.resolve(u)) || (await lu.rm(u, {
            force: !0
        }).catch(() => {}), i.removed.push(u));
    return i
}
