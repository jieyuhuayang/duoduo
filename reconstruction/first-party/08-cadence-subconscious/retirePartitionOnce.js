// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: retirePartitionOnce  (minified: Zpt, daemon.pretty.js:69455)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function retirePartitionOnce(e, t) {
    let {
        name: n,
        selfId: r
    } = t, i = h => ({
        partition: n,
        action: "skipped",
        reason: h
    }), o = readPartitionContract(e.subconsciousDir, n);
    if (o.state === "partition-absent") return i("absent");
    if (o.state === "parse-fail") return Z(`[init] partition '${n}': charter frontmatter is unreadable, not retiring it.`), i("unreadable");
    if (!(r === "contract" ? o.state === "valid" : o.state === "no-contract")) return ee(`[init] partition '${n}' is retired upstream but no longer declares itself the official '${n}' (contract: ${o.state}) — left untouched.`), i("not-self-identified");
    let a = jke.join(e.partitionStateDir, `${n}${Gpt}`);
    if (await Kpt(a)) return o.enabled && ee(`[init] partition '${n}' was retired on this host but is enabled again — leaving it alone (the retirement runs once).`), i("already-retired");
    let u = jke.join(e.subconsciousDir, n, "CLAUDE.md"),
        l = await Lke.readFile(u, "utf8"),
        c = (0, hW.default)(l, Sr),
        d = c.data;
    if (d == null || typeof d != "object" || Array.isArray(d)) return Z(`[init] partition '${n}': frontmatter is not a map, not retiring.`), i("unreadable");
    let f = d,
        p = f.schedule;
    if (typeof p != "object" || p === null || Array.isArray(p) || p.enabled !== !0) return i("not-enabled");
    await Ne(e.partitionStateDir), await Dt(a, `${JSON.stringify({version:Ypt(),retired_at:new Date().toISOString()})}
`);
    let m = {
        ...f,
        schedule: {
            ...p,
            enabled: !1
        }
    };
    return await Dt(u, hW.default.stringify(c.content, m)), ee(`[init] retired partition '${n}': bootstrap no longer ships it, so schedule.enabled was flipped to false once (marker ${a}). Set it back by hand to keep running it.`), {
        partition: n,
        action: "retired",
        reason: "flipped"
    }
}
