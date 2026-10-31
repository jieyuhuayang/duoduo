// duoduo reconstruction — subsystem: 03-session-actor
// symbol: diffStreamingConfigSignature  (minified: qN, daemon.pretty.js:83957)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 24 renamed — 2 from the code at the binding (rule), 22 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function diffStreamingConfigSignature(oldSignature, newSignature) {
    let parseJson = text => {
            try {
                return JSON.parse(text)
            } catch {
                return {}
            }
        },
        oldConfig = parseJson(oldSignature),
        newConfig = parseJson(newSignature),
        keys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]),
        preview = value => {
            let text = typeof value == "string" ? value : JSON.stringify(value) ?? "undefined";
            return text.length > 48 ? `${text.slice(0,48)}…` : text
        },
        changes = [];
    for (let key of keys) {
        let oldValue = oldConfig[key],
            newValue = newConfig[key];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue))
            if (Array.isArray(oldValue) || Array.isArray(newValue)) {
                let oldArray = Array.isArray(oldValue) ? oldValue : [],
                    newArray = Array.isArray(newValue) ? newValue : [],
                    oldItems = new Set(oldArray.map(item => JSON.stringify(item))),
                    newItems = new Set(newArray.map(item => JSON.stringify(item))),
                    length = [...newItems].filter(item => !oldItems.has(item)).length,
                    length2 = [...oldItems].filter(item => !newItems.has(item)).length;
                changes.push(`${key}: len ${oldArray.length}→${newArray.length} (+${length}/-${length2})`)
            } else changes.push(`${key}: ${preview(oldValue)} → ${preview(newValue)}`)
    }
    return changes
}
