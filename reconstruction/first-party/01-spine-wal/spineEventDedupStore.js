// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: spineEventDedupStore  (minified: lI, daemon.pretty.js:88526)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// locals: 12 renamed — 1 from the code at the binding (rule), 11 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var spineEventDedupStore = class {
    filePath;
    entries = new Map;
    cache = {};
    constructor(filePath) {
        this.filePath = filePath
    }
    async ensureLoaded() {
        await memoizeIndexLoad(this.cache, () => this.load(), () => this.entries.clear())
    }
    async load() {
        let skippedCount = 0;
        try {
            let stream = DXe(this.filePath);
            for await (let line of iterateStreamLines(stream)) {
                if (!line.trim()) continue;
                let entry;
                try {
                    entry = JSON.parse(line)
                } catch {
                    skippedCount++;
                    continue
                }
                if (typeof entry?.key != "string" || !entry.key) {
                    skippedCount++;
                    continue
                }
                this.entries.set(entry.key, entry)
            }
        } catch (err) {
            if (err.code === "ENOENT") return;
            throw err
        }
        skippedCount > 0 && logWarnMessage(`[spine] dedup store ${this.filePath}: skipped ${skippedCount} unreadable line(s)`)
    }
    has(key) {
        return this.entries.has(key)
    }
    get(key) {
        return this.entries.get(key)
    }
    async record(entry) {
        this.entries.set(entry.key, entry), await ensureDirectoryExists(jXe.dirname(this.filePath));
        let line = `${JSON.stringify(entry)}
`;
        await MXe.appendFile(this.filePath, line)
    }
    async checkAndRecord(entry) {
        return (await this.checkAndRecordDetailed(entry)).duplicate
    }
    async checkAndRecordDetailed(entry) {
        return this.entries.has(entry.key) ? {
            duplicate: !0,
            existing: this.entries.get(entry.key)
        } : (await this.record(entry), {
            duplicate: !1
        })
    }
};
