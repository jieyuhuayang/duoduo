// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runInstructionsFingerprintGuard  (minified: OA, daemon.pretty.js:82402)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runInstructionsFingerprintGuard(e, t, n, r, i, o) {
    let s = computeInstructionsFingerprint(n),
        a = i.instructions_fingerprint ?? i.mission_fingerprint,
        u = i.schema_version ?? 0,
        l = o?.jobId,
        c = computeBoardLayerHash(n.memoryBoard),
        d = computeNonBoardInstructionsFingerprint(n),
        f = i.board_layer_hash !== void 0 && i.instructions_nonboard_fingerprint !== void 0 && i.board_layer_hash !== c && i.instructions_nonboard_fingerprint === d;
    if (u < SESSION_SCHEMA_VERSION) return await et(e, t, {
        sdk_session_id: null,
        sdk_session_runtime: null,
        pending_fork_to: null,
        instructions_fingerprint: s,
        mission_fingerprint: null,
        schema_version: SESSION_SCHEMA_VERSION,
        board_layer_hash: c,
        instructions_nonboard_fingerprint: d
    }), te(`[session-upgrade] v${u} → v${SESSION_SCHEMA_VERSION} rebuild`, {
        sessionKey: t,
        jobId: l,
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
            if (f && to(t) === "channel") return await et(e, t, {
                instructions_fingerprint: s,
                board_layer_hash: c,
                instructions_nonboard_fingerprint: d
            }), te("[instructions-fingerprint] codex board-only drift — fork skipped", {
                sessionKey: t,
                jobId: l,
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
                boardOnlyDrift: f,
                boardLayerHash: c,
                nonBoardFingerprint: d
            };
            let m = i.sdk_session_id;
            return m ? (await et(e, t, {
                pending_fork_to: m,
                instructions_fingerprint: s,
                board_layer_hash: c,
                instructions_nonboard_fingerprint: d
            }), te("[instructions-fingerprint] codex thread fork", {
                sessionKey: t,
                jobId: l,
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
                boardOnlyDrift: f,
                boardLayerHash: c,
                nonBoardFingerprint: d
            }) : (await et(e, t, {
                sdk_session_id: null,
                sdk_session_runtime: null,
                pending_fork_to: null,
                instructions_fingerprint: s,
                board_layer_hash: c,
                instructions_nonboard_fingerprint: d
            }), te("[instructions-fingerprint] codex thread reset (no parent to fork)", {
                sessionKey: t,
                jobId: l,
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
                boardOnlyDrift: f,
                boardLayerHash: c,
                nonBoardFingerprint: d
            })
        }
        return await et(e, t, {
            instructions_fingerprint: s,
            board_layer_hash: c,
            instructions_nonboard_fingerprint: d
        }), te(`[instructions-fingerprint] ${r} instructions updated`, {
            sessionKey: t,
            jobId: l,
            fp_old: a ?? null,
            fp_new: s,
            runtime: r,
            cleared_sdk_session_id: !1,
            board_only_drift: f
        }), {
            gate1Fired: !1,
            gate2Fired: !0,
            fpNew: s,
            fpOld: a,
            clearedSdkSessionId: !1,
            requestedFork: !1,
            boardOnlyDrift: f,
            boardLayerHash: c,
            nonBoardFingerprint: d
        }
    }
    return (i.board_layer_hash === void 0 || i.instructions_nonboard_fingerprint === void 0) && await et(e, t, {
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
