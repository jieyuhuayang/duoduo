// duoduo reconstruction — subsystem: 09-memory
// symbol: scanActivationWindowTouches  (minified: fct, daemon.pretty.js:67909)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function scanActivationWindowTouches(e, t, n) {
    let r = Qa.join(t, "entities") + Qa.sep,
        i = Qa.join(t, "topics") + Qa.sep,
        o = new RegExp(`${ewe(t+Qa.sep)}(?:entities|topics)${ewe(Qa.sep)}[^\\s"']+\\.md(?=[\\s"']|$)`, "g"),
        s = {
            dates: [],
            interactionDays: 0,
            foregroundToolEvents: 0,
            foregroundWrites: 0,
            touches: new Map
        },
        a = new Date(n).toISOString().slice(0, 10),
        u = listEventPartitionDates(e);
    for (let l = u.length - 1; l >= 0; l -= 1) {
        let c = u[l];
        if (c > a) continue;
        s.dates.push(c);
        let d;
        try {
            d = F6.readFileSync(Qa.join(e, `${c}.jsonl`), "utf8")
        } catch (p) {
            recordUnreadableMemoryPath(p);
            continue
        }
        let f = !1;
        for (let p of d.split(`
`)) {
            if (!f && p.includes('"channel.message"') && dct(p) && (f = !0), !p.includes('"agent.tool_use"') || !p.includes('"kind":"runner"') || (s.foregroundToolEvents += 1, !p.includes(r) && !p.includes(i))) continue;
            let m;
            try {
                m = JSON.parse(p)
            } catch {
                continue
            }
            let h = m.payload?.input_summary;
            if (typeof h != "string") continue;
            let g = h.match(o);
            if (g === null) continue;
            let y = new Set;
            for (let b of g) y.add(Qa.relative(t, b));
            let v = m.payload?.tool_name;
            if (typeof v == "string" && lct.has(v)) {
                s.foregroundWrites += 1;
                continue
            }
            for (let b of y) s.touches.set(b, (s.touches.get(b) ?? 0) + 1)
        }
        if (f && (s.interactionDays += 1, s.interactionDays >= L6)) break
    }
    return s.dates.reverse(), s
}
