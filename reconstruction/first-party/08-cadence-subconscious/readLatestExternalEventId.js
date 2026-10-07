// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: readLatestExternalEventId  (minified: Rbt, daemon.pretty.js:86108)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readLatestExternalEventId(e) {
    let t;
    try {
        let r = (await yk.readdir(e.eventsDir)).filter(i => i.endsWith(".jsonl")).sort();
        if (r.length === 0) return "";
        t = await yk.readFile(Sy.join(e.eventsDir, r[r.length - 1]), "utf8")
    } catch {
        return ""
    }
    let n = t.split(`
`);
    for (let r = n.length - 1; r >= 0; r -= 1)
        if (n[r]) try {
            let i = JSON.parse(n[r]),
                o = i.source?.kind;
            if (o && !qg.has(o) && typeof i.id == "string") return i.id
        } catch {}
    return ""
}
