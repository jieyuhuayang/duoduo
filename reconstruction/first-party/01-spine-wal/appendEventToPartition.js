// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: appendEventToPartition  (minified: W8e, daemon.pretty.js:32111)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendEventToPartition(e, t, n = new Date(t.ts)) {
    await ensureDirectoryExists(e.eventsDir);
    let r = formatEventPartitionName(n),
        i = FR.join(e.eventsDir, r),
        o = `${stringifyJsonlRecord(t)}
`;
    return enqueuePartitionAppend(i, async () => {
        let s = await LR.open(i, "a");
        try {
            let u = (await s.stat()).size,
                c = (await s.write(o)).bytesWritten;
            return {
                event: t,
                partition: r,
                byteOffset: u,
                byteLength: c
            }
        } finally {
            await s.close()
        }
    })
}
