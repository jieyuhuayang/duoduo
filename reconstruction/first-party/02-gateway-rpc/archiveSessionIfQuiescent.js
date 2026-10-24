// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: archiveSessionIfQuiescent  (minified: nxt, daemon.pretty.js:92970)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.6.0 (maps/history_daemon.json)
// locals: 10 renamed — 2 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): `session.archive` RPC + `duoduo session archive <session_key>` CLI retired the old ad-hoc deletion paths. Archive moves the session dir to `var/sessions-archive/`; recovery is `mv` back.
// changelog v0.6.0 (high): Archiving now refuses unless the session is provably empty of pending work (checking every shape of in-flight work), ignores channel placeholder actors, and treats the archive marker as a real "about to disappear" signal.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveSessionIfQuiescent(paths, sessionManager, sessionIndex, params) {
    let trimmed = params.session_key.trim();
    if (trimmed.length === 0) return {
        archived: !1,
        reason: "not_found",
        archived_paths: [],
        hint: "session_key is empty"
    };
    if (!tryMarkSessionArchiving(trimmed)) return {
        archived: !1,
        reason: "active",
        archived_paths: [],
        hint: "Another session.archive for this session is already in flight. Retry after the in-flight call returns."
    };
    let archived = !1;
    try {
        let actorView = sessionManager?.getActorView(trimmed);
        if (actorView && actorView.status !== "ended") return {
            archived: !1,
            reason: "active",
            archived_paths: [],
            hint: `Session has a live actor (status=${actorView.status}). Cancel it first via channel.command '/cancel' or session.interrupt, then retry.`
        };
        if (sessionManager?.hasQueuedWake?.(trimmed) ?? !1) return {
            archived: !1,
            reason: "active",
            archived_paths: [],
            hint: "Session has queued work waiting for a concurrency slot. Let that work finish and the actor end before retrying."
        };
        let pendingWork = await probeSessionPendingWork(paths, trimmed);
        if (pendingWork !== "clear") return {
            archived: !1,
            reason: "active",
            archived_paths: [],
            hint: pendingWork === "unreadable" ? "Session's inbox or mailbox could not be read, so it cannot be shown to be empty. Fix the directory permissions or I/O fault, then retry." : "Session has unprocessed items in its inbox or mailbox. Let the runtime drain them before retrying."
        };
        let archiveResult = await archiveSessionAndArtifacts(paths, trimmed);
        return archiveResult.reason === "unreadable" ? {
            archived: !1,
            reason: "active",
            archived_paths: [],
            hint: "Session's inbox or mailbox became unreadable while the archive was in flight. Nothing was archived."
        } : archiveResult.reason === "pending_work" ? {
            archived: !1,
            reason: "active",
            archived_paths: [],
            hint: "Session received work while the archive was in flight. Nothing was archived; let the runtime drain it before retrying."
        } : (archived = archiveResult.archived, archiveResult.archived ? (logInfoMessage("[session.archive] session archived", {
            session_key: trimmed,
            archived_paths: archiveResult.archivedPaths
        }), {
            archived: !0,
            archived_paths: archiveResult.archivedPaths,
            hint: "Archived — to recover, `mv` the archived directory back to its original location. To permanently delete, remove the archived directory by hand."
        }) : (sessionIndex.remove(trimmed), {
            archived: !1,
            reason: "not_found",
            archived_paths: [],
            hint: `No artifacts found for session_key=${trimmed}. Already archived, or never materialized on disk.`
        }))
    } finally {
        if (clearSessionArchiving(trimmed), !archived) try {
            await probeSessionPendingWork(paths, trimmed) !== "clear" && sessionManager?.wakeSession(trimmed, {
                preempt: "never"
            })
        } catch (err) {
            logWarnMessage("[session.archive] post-refusal wake re-dispatch failed", {
                session_key: trimmed,
                error: err instanceof Error ? err.message : String(err)
            })
        }
    }
}
