// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: attachStreamLineReader  (minified: rc, daemon.pretty.js:33078)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 0 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): pi joins Claude, Codex and Grok as a fourth agent runtime.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function attachStreamLineReader(stream, onLine, options) {
    let lineBuffer = Due(onLine),
        closed = !1,
        onData = chunk => {
            lineBuffer.write(chunk)
        },
        onEnd = () => {
            closed || (closed = !0, lineBuffer.flush(), detach(), options?.onEof?.())
        },
        detach = () => {
            stream.off("data", onData), stream.off("end", onEnd), stream.off("close", onEnd)
        };
    return stream.on("data", onData), stream.on("end", onEnd), stream.on("close", onEnd), {
        close() {
            closed || (closed = !0, detach())
        }
    }
}
