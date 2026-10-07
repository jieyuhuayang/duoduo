// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: computeHostBootId  (minified: Lct, daemon.pretty.js:89226)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeHostBootId() {
    let e = ywe.hostname();
    try {
        let n = Dct("/proc/sys/kernel/random/boot_id", "utf8").trim();
        if (n) return `${e}:${n}`
    } catch {}
    try {
        let r = Act("sysctl", ["-n", "kern.boottime"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"]
        }).trim().match(/sec = (\d+)/);
        if (r?.[1]) return `${e}:${r[1]}`
    } catch {}
    let t = Math.floor((Date.now() - ywe.uptime() * 1e3) / 6e4);
    return `${e}:fallback-${t}`
}
