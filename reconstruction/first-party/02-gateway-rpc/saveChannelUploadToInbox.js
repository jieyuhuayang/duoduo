// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: saveChannelUploadToInbox  (minified: bve, daemon.pretty.js:88230)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function saveChannelUploadToInbox(e, t, n, r, i, o = {}) {
    let s = sanitizeUploadFileName(n),
        a = Kf.join(e.workDir, "inbox", s);
    await ensureDirectoryExists(a);
    let u = Buffer.from(i, "base64"),
        l = uct.createHash("sha256").update(u).digest("hex"),
        c = Kf.extname(s),
        d = Kf.join(a, `${l}${c}`);
    return await writeFileAtomic(d, u), await dct({
        dir: a,
        safeName: s,
        digest: l,
        ext: c,
        mime: r,
        sessionKey: t,
        receivedVia: o.receivedVia,
        sourceName: o.sourceName,
        uploadedAt: o.uploadedAt ?? new Date
    }), {
        path: d,
        mime: r,
        name: s
    }
}
