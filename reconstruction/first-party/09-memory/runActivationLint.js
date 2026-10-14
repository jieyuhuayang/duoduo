// duoduo reconstruction — subsystem: 09-memory
// symbol: runActivationLint  (minified: SSe, daemon.pretty.js:68306)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 42 renamed — 6 from the code at the binding (rule), 36 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): On top of that sits an activation report: it counts which memories are actually being read during real work, so the pipeline gets told about dead weight and unreachable material instead of accumulating both silently.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runActivationLint(eventsDir, memoryDir, nowMs) {
    let memoryDirs = resolveMemoryDirs(memoryDir),
        scan = scanActivationWindowTouches(eventsDir, memoryDir, nowMs),
        dates = scan.dates,
        inventory = [...vSe(memoryDir, memoryDirs.entitiesDir, "entities"), ...vSe(memoryDir, memoryDirs.topicsDir, "topics")],
        map = new Map(inventory.map(file => [file.rel, file])),
        map2 = new Map;
    for (let [rel, count] of scan.touches) map.has(rel) && map2.set(rel, count);
    let windowStart = dates.length > 0 ? dates[0] : null,
        windowEnd = dates.length > 0 ? dates[dates.length - 1] : null,
        windowStartMs = windowStart === null ? null : Date.parse(`${windowStart}T00:00:00.000Z`),
        coldCount = 0;
    if (windowStartMs !== null)
        for (let inventoryFile of inventory) map2.has(inventoryFile.rel) || inventoryFile.birthtimeMs > 0 && inventoryFile.birthtimeMs < windowStartMs && (coldCount += 1);
    let memoryFile = readMemoryFileSyncOrNull(memoryDirs.boardPath),
        reachable = memoryFile === null ? new Set : walkReachableMemory(memoryFile, createMemorySlugReader(memoryDirs)),
        hotOrphans = [];
    if (memoryFile !== null) {
        for (let [rel, touches] of map2) {
            let slug = uu.basename(rel, ".md");
            reachable.has(slug) || hotOrphans.push({
                rel,
                touches
            })
        }
        hotOrphans.sort((a, b) => a.touches !== b.touches ? b.touches - a.touches : compareStringsAscending(a.rel, b.rel))
    }
    let topHotOrphans = hotOrphans.slice(0, wSe),
        memoryMaxLinesLimit = readMemoryMaxLinesLimit(),
        allTemperatureRows = [];
    if (memoryFile !== null) {
        let boardLines = splitLinesDropTrailingEmpty(memoryFile);
        for (let i = 0; i < boardLines.length; i += 1)
            for (let occurrence of scanWikiLinkOccurrences(boardLines[i])) {
                let twins = [];
                for (let tree of ["entities", "topics"]) {
                    let twinRel = `${tree}/${occurrence.slug}.md`;
                    map.has(twinRel) && twins.push({
                        rel: twinRel,
                        touches: map2.get(twinRel) ?? 0
                    })
                }
                allTemperatureRows.push({
                    line: i + 1,
                    slug: occurrence.slug,
                    touches: twins.length === 0 ? null : twins.reduce((sum, twin) => sum + twin.touches, 0),
                    twins
                })
            }
    }
    let temperature = allTemperatureRows.slice(0, memoryMaxLinesLimit),
        truncatedCount = allTemperatureRows.length - temperature.length,
        memoryTouches = 0;
    for (let count of map2.values()) memoryTouches += count;
    let metrics = {
            windowDays: FH,
            windowStart,
            windowEnd,
            partitionFiles: dates.length,
            interactionDays: scan.interactionDays,
            foregroundToolEvents: scan.foregroundToolEvents,
            memoryTouches,
            filesTouched: map2.size,
            inventory: inventory.length,
            foregroundWrites: scan.foregroundWrites,
            coldCount,
            hotOrphanCount: hotOrphans.length,
            expansionRate: LH(memoryTouches, scan.foregroundToolEvents),
            liveRatio: LH(map2.size, inventory.length),
            wiringIncompleteness: LH(hotOrphans.length, map2.size)
        },
        touchWindow = {
            windowDays: FH,
            windowStart,
            windowEnd,
            interactionDays: scan.interactionDays,
            touches: map2
        };
    return memoryFile === null ? {
        selected: [],
        metrics,
        touchWindow,
        hotOrphans: topHotOrphans,
        temperature,
        temperatureTruncated: truncatedCount
    } : {
        selected: [{
            kind: Vn.ACTIVATION_REPORT,
            partition: ift,
            pendingFilename: "activation-report.md.pending",
            pendingBody: renderActivationReportBody(metrics, temperature, truncatedCount, topHotOrphans)
        }],
        metrics,
        touchWindow,
        hotOrphans: topHotOrphans,
        temperature,
        temperatureTruncated: truncatedCount
    }
}
