// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: iterateStreamLines  (minified: gs, daemon.pretty.js:31898)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 17 renamed — 0 from the code at the binding (rule), 17 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): Log lines containing U+2028 were shredded on read, because the line reader treated it as a line break and JSON does not.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function* iterateStreamLines(stream, options) {
    let hasOnEof = options?.onEof !== void 0,
        lines = [],
        done = !1,
        streamError, pendingWake = null,
        wake = () => {
            let wakeFn = pendingWake;
            pendingWake = null, wakeFn?.()
        },
        lineSplitter = yae(line => lines.push(line)),
        onData = chunk => {
            lineSplitter.write(chunk), hasOnEof || stream.pause(), wake()
        },
        onEnd = () => {
            done || (lineSplitter.flush(), done = !0, wake(), options?.onEof?.())
        },
        onError = err => {
            done || (streamError = err ?? new Error("stream error"), done = !0, wake())
        };
    stream.on("data", onData), stream.on("end", onEnd), stream.on("close", onEnd), stream.on("error", onError);
    try {
        for (;;) {
            for (; lines.length > 0;) yield lines.shift();
            if (done) break;
            stream.resume(), await new Promise(resolve => {
                pendingWake = resolve
            })
        }
        if (streamError !== void 0) throw streamError
    } finally {
        stream.off("data", onData), stream.off("end", onEnd), stream.off("close", onEnd), stream.off("error", onError), stream.destroy()
    }
}
