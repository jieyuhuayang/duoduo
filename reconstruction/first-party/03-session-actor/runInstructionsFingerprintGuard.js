// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runInstructionsFingerprintGuard  (minified: LB, daemon.pretty.js:74138)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runInstructionsFingerprintGuard(e, t, n, r, i, o) {
    let s = computeInstructionsFingerprint(n),
        a = i.instructions_fingerprint ?? i.mission_fingerprint,
        l = i.schema_version ?? 0,
        u = o?.jobId,
        c = computeBoardLayerHash(n.memoryBoard),
        d = computeNonBoardInstructionsFingerprint(n),
        p = i.board_layer_hash !== void 0 && i.instructions_nonboard_fingerprint !== void 0 && i.board_layer_hash !== c && i.instructions_nonboard_fingerprint === d;
    if (l < SESSION_SCHEMA_VERSION) return await ut(e, t, {
        sdk_session_id: null,
        pending_fork_to: null,
        pending_undo: null,
        instructions_fingerprint: s,
        mission_fingerprint: null,
        schema_version: SESSION_SCHEMA_VERSION,
        board_layer_hash: c,
        instructions_nonboard_fingerprint: d
    }), K(`[session-upgrade] v${l} → v${SESSION_SCHEMA_VERSION} rebuild`, {
        sessionKey: t,
        jobId: u,
        runtime: r,
        fp_new: s
    }), {
        gate1Fired: !0,
        gate2Fired: !1,
        fpNew: s,
        fpOld: a,
        clearedSdkSessionId: !0,
        requestedFork: !1,
        boardOnlyDrift: !1,
        boardLayerHash: c,
        nonBoardFingerprint: d
    };
    if (a !== s) {
        if (r === "codex") {
            if (p && rs(t) === "channel") return await ut(e, t, {
                instructions_fingerprint: s,
                board_layer_hash: c,
                instructions_nonboard_fingerprint: d
            }), K("[instructions-fingerprint] codex board-only drift — fork skipped", {
                sessionKey: t,
                jobId: u,
                fp_old: a ?? null,
                fp_new: s,
                runtime: "codex",
                cleared_sdk_session_id: !1,
                board_only_drift: !0
            }), {
                gate1Fired: !1,
                gate2Fired: !0,
                fpNew: s,
                fpOld: a,
                clearedSdkSessionId: !1,
                requestedFork: !1,
                boardOnlyDrift: p,
                boardLayerHash: c,
                nonBoardFingerprint: d
            };
            let m = i.sdk_session_id;
            return m ? (await ut(e, t, {
                pending_fork_to: m,
                instructions_fingerprint: s,
                board_layer_hash: c,
                instructions_nonboard_fingerprint: d
            }), K("[instructions-fingerprint] codex thread fork", {
                sessionKey: t,
                jobId: u,
                fp_old: a ?? null,
                fp_new: s,
                runtime: "codex",
                parent_thread_id: m,
                cleared_sdk_session_id: !1
            }), {
                gate1Fired: !1,
                gate2Fired: !0,
                fpNew: s,
                fpOld: a,
                clearedSdkSessionId: !1,
                requestedFork: !0,
                boardOnlyDrift: p,
                boardLayerHash: c,
                nonBoardFingerprint: d
            }) : (await ut(e, t, {
                sdk_session_id: null,
                pending_fork_to: null,
                pending_undo: null,
                instructions_fingerprint: s,
                board_layer_hash: c,
                instructions_nonboard_fingerprint: d
            }), K("[instructions-fingerprint] codex thread reset (no parent to fork)", {
                sessionKey: t,
                jobId: u,
                fp_old: a ?? null,
                fp_new: s,
                runtime: "codex",
                cleared_sdk_session_id: !0
            }), {
                gate1Fired: !1,
                gate2Fired: !0,
                fpNew: s,
                fpOld: a,
                clearedSdkSessionId: !0,
                requestedFork: !1,
                boardOnlyDrift: p,
                boardLayerHash: c,
                nonBoardFingerprint: d
            })
        }
        return await ut(e, t, {
            instructions_fingerprint: s,
            board_layer_hash: c,
            instructions_nonboard_fingerprint: d
        }), K(`[instructions-fingerprint] ${r} instructions updated`, {
            sessionKey: t,
            jobId: u,
            fp_old: a ?? null,
            fp_new: s,
            runtime: r,
            cleared_sdk_session_id: !1,
            board_only_drift: p
        }), {
            gate1Fired: !1,
            gate2Fired: !0,
            fpNew: s,
            fpOld: a,
            clearedSdkSessionId: !1,
            requestedFork: !1,
            boardOnlyDrift: p,
            boardLayerHash: c,
            nonBoardFingerprint: d
        }
    }
    return (i.board_layer_hash === void 0 || i.instructions_nonboard_fingerprint === void 0) && await ut(e, t, {
        board_layer_hash: c,
        instructions_nonboard_fingerprint: d
    }), {
        gate1Fired: !1,
        gate2Fired: !1,
        fpNew: s,
        fpOld: a,
        clearedSdkSessionId: !1,
        requestedFork: !1,
        boardOnlyDrift: !1,
        boardLayerHash: c,
        nonBoardFingerprint: d
    }
}
