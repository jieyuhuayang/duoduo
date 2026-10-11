// duoduo reconstruction — subsystem: 09-memory
// symbol: scanActivationWindowTouches  (minified: aft, daemon.pretty.js:68200)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 22 renamed — 3 from the code at the binding (rule), 19 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): The activation window counts days on which someone actually interacted, so a quiet week no longer ages memories out.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function scanActivationWindowTouches(eventsDir, memoryDir, nowMs) {
    let entitiesPrefix = uu.join(memoryDir, "entities") + uu.sep,
        topicsPrefix = uu.join(memoryDir, "topics") + uu.sep,
        regExp = new RegExp(`${gSe(memoryDir+uu.sep)}(?:entities|topics)${gSe(uu.sep)}[^\\s"']+\\.md(?=[\\s"']|$)`, "g"),
        result = {
            dates: [],
            interactionDays: 0,
            foregroundToolEvents: 0,
            foregroundWrites: 0,
            touches: new Map
        },
        today = new Date(nowMs).toISOString().slice(0, 10),
        eventPartitionDates = listEventPartitionDates(eventsDir);
    for (let i = eventPartitionDates.length - 1; i >= 0; i -= 1) {
        let date = eventPartitionDates[i];
        if (date > today) continue;
        result.dates.push(date);
        let content;
        try {
            content = FH.readFileSync(uu.join(eventsDir, `${date}.jsonl`), "utf8")
        } catch (err) {
            recordUnreadableMemoryPath(err);
            continue
        }
        let hasInteraction = !1;
        for (let line of content.split(`
`)) {
            if (!hasInteraction && line.includes('"channel.message"') && sft(line) && (hasInteraction = !0), !line.includes('"agent.tool_use"') || !line.includes('"kind":"runner"') || (result.foregroundToolEvents += 1, !line.includes(entitiesPrefix) && !line.includes(topicsPrefix))) continue;
            let event;
            try {
                event = JSON.parse(line)
            } catch {
                continue
            }
            let inputSummary = event.payload?.input_summary;
            if (typeof inputSummary != "string") continue;
            let matches = inputSummary.match(regExp);
            if (matches === null) continue;
            let relPaths = new Set;
            for (let matchPath of matches) relPaths.add(uu.relative(memoryDir, matchPath));
            let toolName = event.payload?.tool_name;
            if (typeof toolName == "string" && ift.has(toolName)) {
                result.foregroundWrites += 1;
                continue
            }
            for (let relPath of relPaths) result.touches.set(relPath, (result.touches.get(relPath) ?? 0) + 1)
        }
        if (hasInteraction && (result.interactionDays += 1, result.interactionDays >= LH)) break
    }
    return result.dates.reverse(), result
}
