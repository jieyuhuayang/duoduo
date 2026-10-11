// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: computeHostBootId  (minified: Lct, daemon.pretty.js:89226)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeHostBootId() {
    let hostname = ywe.hostname();
    try {
        let trimmed = Dct("/proc/sys/kernel/random/boot_id", "utf8").trim();
        if (trimmed) return `${hostname}:${trimmed}`
    } catch {}
    try {
        let bootTimeMatch = Act("sysctl", ["-n", "kern.boottime"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"]
        }).trim().match(/sec = (\d+)/);
        if (bootTimeMatch?.[1]) return `${hostname}:${bootTimeMatch[1]}`
    } catch {}
    let bootMinute = Math.floor((Date.now() - ywe.uptime() * 1e3) / 6e4);
    return `${hostname}:fallback-${bootMinute}`
}
