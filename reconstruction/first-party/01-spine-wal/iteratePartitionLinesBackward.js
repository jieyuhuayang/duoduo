// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: iteratePartitionLinesBackward  (minified: cpt, daemon.pretty.js:90823)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 2 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): bounds event tail reads.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function* iteratePartitionLinesBackward(handle, startOffset, endOffset, chunkSize) {
    let position = endOffset,
        pendingChunks = [];
    for (; position > startOffset;) {
        let chunkStart = Math.max(startOffset, position - chunkSize),
            partitionByteRange = await readPartitionByteRange(handle, chunkStart, position),
            length = partitionByteRange.length;
        for (let i = partitionByteRange.length - 1; i >= 0; i--) partitionByteRange[i] === 10 && (pendingChunks.push(partitionByteRange.subarray(i + 1, length)), yield Buffer.concat(pendingChunks.reverse()).toString("utf8"), pendingChunks = [], length = i);
        length > 0 && pendingChunks.push(partitionByteRange.subarray(0, length)), position = chunkStart
    }
    pendingChunks.length > 0 && (yield Buffer.concat(pendingChunks.reverse()).toString("utf8"))
}
