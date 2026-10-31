// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseDotEnv  (minified: pA, daemon.pretty.js:70244)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.3.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 3 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.3 (medium): **cli**: Host-side `.env` file support — daemon command auto-loads dotenv before starting.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseDotEnv(content) {
    let result = {};
    for (let line of content.split(`
`)) {
        let trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        let eqIndex = trimmed.indexOf("=");
        if (eqIndex < 1) continue;
        let trimmed2 = trimmed.slice(0, eqIndex).trim(),
            trimmed3 = trimmed.slice(eqIndex + 1).trim();
        (trimmed3.startsWith('"') && trimmed3.endsWith('"') || trimmed3.startsWith("'") && trimmed3.endsWith("'")) && (trimmed3 = trimmed3.slice(1, -1)), result[trimmed2] = trimmed3
    }
    return result
}
