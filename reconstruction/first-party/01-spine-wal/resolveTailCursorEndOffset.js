// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: resolveTailCursorEndOffset  (minified: dpt, daemon.pretty.js:90835)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 4 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): bounds event tail reads.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function resolveTailCursorEndOffset(paths, partition, handle, fileSize, cursorId) {
    let eventIdIndexEntry = await lookupEventIdIndexEntry(paths, cursorId, {
        load: !1
    });
    if (!eventIdIndexEntry || eventIdIndexEntry.partition !== partition) return;
    let {
        byte_offset: byteOffset,
        byte_len: byteLen
    } = eventIdIndexEntry;
    if (!Number.isSafeInteger(byteOffset) || !Number.isSafeInteger(byteLen) || byteOffset < 0 || byteLen <= 0 || byteOffset + byteLen > fileSize || byteOffset > 0 && (await readPartitionByteRange(handle, byteOffset - 1, byteOffset))[0] !== 10) return;
    let partitionByteRange = await readPartitionByteRange(handle, byteOffset, byteOffset + byteLen);
    if (!(partitionByteRange.length !== byteLen || partitionByteRange[partitionByteRange.length - 1] !== 10)) try {
        if (JSON.parse(partitionByteRange.toString("utf8"))?.id === cursorId) return byteOffset + byteLen
    } catch {}
}
