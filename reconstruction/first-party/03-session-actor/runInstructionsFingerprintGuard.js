// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runInstructionsFingerprintGuard  (minified: O2, daemon.pretty.js:71312)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runInstructionsFingerprintGuard(e, t, n, r, i, s) {
    let o = computeInstructionsFingerprint(n),
        a = i.instructions_fingerprint ?? i.mission_fingerprint,
        u = i.schema_version ?? 0,
        c = s?.jobId,
        l = computeBoardLayerHash(n.memoryBoard),
        d = computeNonBoardInstructionsFingerprint(n),
        p = i.board_layer_hash !== void 0 && i.instructions_nonboard_fingerprint !== void 0 && i.board_layer_hash !== l && i.instructions_nonboard_fingerprint === d;
    if (u < SESSION_SCHEMA_VERSION) return await dt(e, t, {
        sdk_session_id: null,
        pending_fork_to: null,
        pending_undo: null,
        instructions_fingerprint: o,
        mission_fingerprint: null,
        schema_version: SESSION_SCHEMA_VERSION,
        board_layer_hash: l,
        instructions_nonboard_fingerprint: d
    }), J(`[session-upgrade] v${u} → v${SESSION_SCHEMA_VERSION} rebuild`, {
        sessionKey: t,
        jobId: c,
        runtime: r,
        fp_new: o
    }), {
        gate1Fired: !0,
        gate2Fired: !1,
        fpNew: o,
        fpOld: a,
        clearedSdkSessionId: !0,
        requestedFork: !1,
        boardOnlyDrift: !1,
        boardLayerHash: l,
        nonBoardFingerprint: d
    };
    if (a !== o) {
        if (r === "codex") {
            let m = i.sdk_session_id;
            return m ? (await dt(e, t, {
                pending_fork_to: m,
                instructions_fingerprint: o,
                board_layer_hash: l,
                instructions_nonboard_fingerprint: d
            }), J("[instructions-fingerprint] codex thread fork", {
                sessionKey: t,
                jobId: c,
                fp_old: a ?? null,
                fp_new: o,
                runtime: "codex",
                parent_thread_id: m,
                cleared_sdk_session_id: !1
            }), {
                gate1Fired: !1,
                gate2Fired: !0,
                fpNew: o,
                fpOld: a,
                clearedSdkSessionId: !1,
                requestedFork: !0,
                boardOnlyDrift: p,
                boardLayerHash: l,
                nonBoardFingerprint: d
            }) : (await dt(e, t, {
                sdk_session_id: null,
                pending_fork_to: null,
                pending_undo: null,
                instructions_fingerprint: o,
                board_layer_hash: l,
                instructions_nonboard_fingerprint: d
            }), J("[instructions-fingerprint] codex thread reset (no parent to fork)", {
                sessionKey: t,
                jobId: c,
                fp_old: a ?? null,
                fp_new: o,
                runtime: "codex",
                cleared_sdk_session_id: !0
            }), {
                gate1Fired: !1,
                gate2Fired: !0,
                fpNew: o,
                fpOld: a,
                clearedSdkSessionId: !0,
                requestedFork: !1,
                boardOnlyDrift: p,
                boardLayerHash: l,
                nonBoardFingerprint: d
            })
        }
        return await dt(e, t, {
            instructions_fingerprint: o,
            board_layer_hash: l,
            instructions_nonboard_fingerprint: d
        }), J("[instructions-fingerprint] claude instructions updated", {
            sessionKey: t,
            jobId: c,
            fp_old: a ?? null,
            fp_new: o,
            runtime: "claude",
            cleared_sdk_session_id: !1,
            board_only_drift: p
        }), {
            gate1Fired: !1,
            gate2Fired: !0,
            fpNew: o,
            fpOld: a,
            clearedSdkSessionId: !1,
            requestedFork: !1,
            boardOnlyDrift: p,
            boardLayerHash: l,
            nonBoardFingerprint: d
        }
    }
    return (i.board_layer_hash === void 0 || i.instructions_nonboard_fingerprint === void 0) && await dt(e, t, {
        board_layer_hash: l,
        instructions_nonboard_fingerprint: d
    }), {
        gate1Fired: !1,
        gate2Fired: !1,
        fpNew: o,
        fpOld: a,
        clearedSdkSessionId: !1,
        requestedFork: !1,
        boardOnlyDrift: !1,
        boardLayerHash: l,
        nonBoardFingerprint: d
    }
}
