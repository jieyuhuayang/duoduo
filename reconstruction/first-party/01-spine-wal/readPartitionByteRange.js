// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: readPartitionByteRange  (minified: q6, daemon.pretty.js:90811)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): bounds event tail reads.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPartitionByteRange(handle, start, end) {
    let buffer = Buffer.allocUnsafe(end - start),
        offset = 0;
    for (; offset < buffer.length;) {
        let {
            bytesRead
        } = await handle.read(buffer, offset, buffer.length - offset, start + offset);
        if (bytesRead === 0) break;
        offset += bytesRead
    }
    return buffer.subarray(0, offset)
}
