// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: archiveSessionIfQuiescent  (minified: byt, daemon.pretty.js:89418)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveSessionIfQuiescent(e, t, n, r) {
    let i = r.session_key.trim();
    if (i.length === 0) return {
        archived: !1,
        reason: "not_found",
        archived_paths: [],
        hint: "session_key is empty"
    };
    if (!tryMarkSessionArchiving(i)) return {
        archived: !1,
        reason: "active",
        archived_paths: [],
        hint: "Another session.archive for this session is already in flight. Retry after the in-flight call returns."
    };
    let o = !1;
    try {
        let s = t?.getActorView(i);
        if (s && s.status !== "ended") return {
            archived: !1,
            reason: "active",
            archived_paths: [],
            hint: `Session has a live actor (status=${s.status}). Cancel it first via channel.command '/cancel' or session.interrupt, then retry.`
        };
        if (t?.hasQueuedWake?.(i) ?? !1) return {
            archived: !1,
            reason: "active",
            archived_paths: [],
            hint: "Session has queued work waiting for a concurrency slot. Let that work finish and the actor end before retrying."
        };
        let a = await sb(e, i);
        if (a !== "clear") return {
            archived: !1,
            reason: "active",
            archived_paths: [],
            hint: a === "unreadable" ? "Session's inbox or mailbox could not be read, so it cannot be shown to be empty. Fix the directory permissions or I/O fault, then retry." : "Session has unprocessed items in its inbox or mailbox. Let the runtime drain them before retrying."
        };
        let u = await archiveSessionAndArtifacts(e, i);
        return u.reason === "unreadable" ? {
            archived: !1,
            reason: "active",
            archived_paths: [],
            hint: "Session's inbox or mailbox became unreadable while the archive was in flight. Nothing was archived."
        } : u.reason === "pending_work" ? {
            archived: !1,
            reason: "active",
            archived_paths: [],
            hint: "Session received work while the archive was in flight. Nothing was archived; let the runtime drain it before retrying."
        } : (o = u.archived, u.archived ? (te("[session.archive] session archived", {
            session_key: i,
            archived_paths: u.archivedPaths
        }), {
            archived: !0,
            archived_paths: u.archivedPaths,
            hint: "Archived — to recover, `mv` the archived directory back to its original location. To permanently delete, remove the archived directory by hand."
        }) : (n.remove(i), {
            archived: !1,
            reason: "not_found",
            archived_paths: [],
            hint: `No artifacts found for session_key=${i}. Already archived, or never materialized on disk.`
        }))
    } finally {
        if (clearSessionArchiving(i), !o) try {
            await sb(e, i) !== "clear" && t?.wakeSession(i, {
                preempt: "never"
            })
        } catch (s) {
            Z("[session.archive] post-refusal wake re-dispatch failed", {
                session_key: i,
                error: s instanceof Error ? s.message : String(s)
            })
        }
    }
}
