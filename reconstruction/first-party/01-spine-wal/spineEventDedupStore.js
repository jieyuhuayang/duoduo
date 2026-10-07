// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: spineEventDedupStore  (minified: JR, daemon.pretty.js:87200)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var spineEventDedupStore = class {
    filePath;
    entries = new Map;
    cache = {};
    constructor(t) {
        this.filePath = t
    }
    async ensureLoaded() {
        await memoizeIndexLoad(this.cache, () => this.load(), () => this.entries.clear())
    }
    async load() {
        let t = 0;
        try {
            let n = vYe(this.filePath);
            for await (let r of iterateStreamLines(n)) {
                if (!r.trim()) continue;
                let i;
                try {
                    i = JSON.parse(r)
                } catch {
                    t++;
                    continue
                }
                if (typeof i?.key != "string" || !i.key) {
                    t++;
                    continue
                }
                this.entries.set(i.key, i)
            }
        } catch (n) {
            if (n.code === "ENOENT") return;
            throw n
        }
        t > 0 && logWarnMessage(`[spine] dedup store ${this.filePath}: skipped ${t} unreadable line(s)`)
    }
    has(t) {
        return this.entries.has(t)
    }
    get(t) {
        return this.entries.get(t)
    }
    async record(t) {
        this.entries.set(t.key, t), await ensureDirectoryExists(SYe.dirname(this.filePath));
        let n = `${JSON.stringify(t)}
`;
        await wYe.appendFile(this.filePath, n)
    }
    async checkAndRecord(t) {
        return (await this.checkAndRecordDetailed(t)).duplicate
    }
    async checkAndRecordDetailed(t) {
        return this.entries.has(t.key) ? {
            duplicate: !0,
            existing: this.entries.get(t.key)
        } : (await this.record(t), {
            duplicate: !1
        })
    }
};
