// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readPartitionTail  (minified: hke, daemon.pretty.js:91493)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 16 renamed — 2 from the code at the binding (rule), 14 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): The dashboard streams usage summaries and bounds event tail reads.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPartitionTail(paths, partition, limit, cursorId, scanToCursor = !1) {
    let handle;
    try {
        handle = await Lmt.open(Fmt.join(paths.eventsDir, partition), "r");
        let {
            size,
            blksize
        } = await handle.stat(), cursorEndOffset = cursorId ? await resolveTailCursorEndOffset(paths, partition, handle, size, cursorId) : void 0, foundCursor = cursorEndOffset !== void 0, events = [], maxEvents = Number.isNaN(limit) ? 1 / 0 : Math.ceil(limit), isFirstLine = !0;
        for await (let line of iteratePartitionLinesBackward(handle, cursorEndOffset ?? 0, size, blksize)) {
            let text = isFirstLine ? line.trimEnd() : line;
            if (!text) continue;
            isFirstLine = !1;
            let event;
            try {
                event = JSON.parse(text)
            } catch {
                continue
            }
            if (cursorId && event?.id === cursorId) {
                foundCursor = !0;
                break
            }
            if (events.length <= maxEvents && events.push(event), events.length > limit && (foundCursor || !scanToCursor)) break
        }
        return {
            events: events.slice(0, maxEvents).reverse(),
            has_more: events.length > limit || foundCursor && Number.isNaN(limit),
            foundCursor
        }
    } catch {
        return {
            events: [],
            has_more: !1,
            foundCursor: !1
        }
    } finally {
        await handle?.close()
    }
}
