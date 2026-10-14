// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runInstructionsFingerprintGuard  (minified: xN, daemon.pretty.js:82750)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.5.1, v0.5.2, v0.5.10, v0.7.1, v0.8.0, v0.8.3 (maps/history_daemon.json)
// locals: 14 renamed — 4 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.5 (high): **Runtime-aware mission fingerprint guard**: when a job's mission file is edited (per the "everything is a file" design), the change takes effect on the next drain. On the Claude runtime, conversation history is fully preserved (zero cost). On the Codex runtime, the thread is rebuilt
// changelog v0.5.1 (high): Instructions fingerprint guard generalized to full surface (schema v1 → v2)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runInstructionsFingerprintGuard(paths, sessionKey, instructions, runtime, sessionState, context) {
    let instructionsFingerprint = computeInstructionsFingerprint(instructions),
        previousFingerprint = sessionState.instructions_fingerprint ?? sessionState.mission_fingerprint,
        schemaVersion = sessionState.schema_version ?? 0,
        jobId = context?.jobId,
        boardLayerHash = computeBoardLayerHash(instructions.memoryBoard),
        nonBoardInstructionsFingerprint = computeNonBoardInstructionsFingerprint(instructions),
        boardOnlyDrift = sessionState.board_layer_hash !== void 0 && sessionState.instructions_nonboard_fingerprint !== void 0 && sessionState.board_layer_hash !== boardLayerHash && sessionState.instructions_nonboard_fingerprint === nonBoardInstructionsFingerprint;
    if (schemaVersion < SESSION_SCHEMA_VERSION) return await patchSessionRuntimeState(paths, sessionKey, {
        sdk_session_id: null,
        sdk_session_runtime: null,
        pending_fork_to: null,
        instructions_fingerprint: instructionsFingerprint,
        mission_fingerprint: null,
        schema_version: SESSION_SCHEMA_VERSION,
        board_layer_hash: boardLayerHash,
        instructions_nonboard_fingerprint: nonBoardInstructionsFingerprint
    }), logInfoMessage(`[session-upgrade] v${schemaVersion} → v${SESSION_SCHEMA_VERSION} rebuild`, {
        sessionKey,
        jobId,
        runtime,
        fp_new: instructionsFingerprint
    }), {
        gate1Fired: !0,
        gate2Fired: !1,
        fpNew: instructionsFingerprint,
        fpOld: previousFingerprint,
        clearedSdkSessionId: !0,
        requestedFork: !1,
        boardOnlyDrift: !1,
        boardLayerHash,
        nonBoardFingerprint: nonBoardInstructionsFingerprint
    };
    if (previousFingerprint !== instructionsFingerprint) {
        if (runtime === "codex") {
            if (boardOnlyDrift && classifySessionKeyOrUnknown(sessionKey) === "channel") return await patchSessionRuntimeState(paths, sessionKey, {
                instructions_fingerprint: instructionsFingerprint,
                board_layer_hash: boardLayerHash,
                instructions_nonboard_fingerprint: nonBoardInstructionsFingerprint
            }), logInfoMessage("[instructions-fingerprint] codex board-only drift — fork skipped", {
                sessionKey,
                jobId,
                fp_old: previousFingerprint ?? null,
                fp_new: instructionsFingerprint,
                runtime: "codex",
                cleared_sdk_session_id: !1,
                board_only_drift: !0
            }), {
                gate1Fired: !1,
                gate2Fired: !0,
                fpNew: instructionsFingerprint,
                fpOld: previousFingerprint,
                clearedSdkSessionId: !1,
                requestedFork: !1,
                boardOnlyDrift,
                boardLayerHash,
                nonBoardFingerprint: nonBoardInstructionsFingerprint
            };
            let sdkSessionId = sessionState.sdk_session_id;
            return sdkSessionId ? (await patchSessionRuntimeState(paths, sessionKey, {
                pending_fork_to: sdkSessionId,
                instructions_fingerprint: instructionsFingerprint,
                board_layer_hash: boardLayerHash,
                instructions_nonboard_fingerprint: nonBoardInstructionsFingerprint
            }), logInfoMessage("[instructions-fingerprint] codex thread fork", {
                sessionKey,
                jobId,
                fp_old: previousFingerprint ?? null,
                fp_new: instructionsFingerprint,
                runtime: "codex",
                parent_thread_id: sdkSessionId,
                cleared_sdk_session_id: !1
            }), {
                gate1Fired: !1,
                gate2Fired: !0,
                fpNew: instructionsFingerprint,
                fpOld: previousFingerprint,
                clearedSdkSessionId: !1,
                requestedFork: !0,
                boardOnlyDrift,
                boardLayerHash,
                nonBoardFingerprint: nonBoardInstructionsFingerprint
            }) : (await patchSessionRuntimeState(paths, sessionKey, {
                sdk_session_id: null,
                sdk_session_runtime: null,
                pending_fork_to: null,
                instructions_fingerprint: instructionsFingerprint,
                board_layer_hash: boardLayerHash,
                instructions_nonboard_fingerprint: nonBoardInstructionsFingerprint
            }), logInfoMessage("[instructions-fingerprint] codex thread reset (no parent to fork)", {
                sessionKey,
                jobId,
                fp_old: previousFingerprint ?? null,
                fp_new: instructionsFingerprint,
                runtime: "codex",
                cleared_sdk_session_id: !0
            }), {
                gate1Fired: !1,
                gate2Fired: !0,
                fpNew: instructionsFingerprint,
                fpOld: previousFingerprint,
                clearedSdkSessionId: !0,
                requestedFork: !1,
                boardOnlyDrift,
                boardLayerHash,
                nonBoardFingerprint: nonBoardInstructionsFingerprint
            })
        }
        return await patchSessionRuntimeState(paths, sessionKey, {
            instructions_fingerprint: instructionsFingerprint,
            board_layer_hash: boardLayerHash,
            instructions_nonboard_fingerprint: nonBoardInstructionsFingerprint
        }), logInfoMessage(`[instructions-fingerprint] ${runtime} instructions updated`, {
            sessionKey,
            jobId,
            fp_old: previousFingerprint ?? null,
            fp_new: instructionsFingerprint,
            runtime,
            cleared_sdk_session_id: !1,
            board_only_drift: boardOnlyDrift
        }), {
            gate1Fired: !1,
            gate2Fired: !0,
            fpNew: instructionsFingerprint,
            fpOld: previousFingerprint,
            clearedSdkSessionId: !1,
            requestedFork: !1,
            boardOnlyDrift,
            boardLayerHash,
            nonBoardFingerprint: nonBoardInstructionsFingerprint
        }
    }
    return (sessionState.board_layer_hash === void 0 || sessionState.instructions_nonboard_fingerprint === void 0) && await patchSessionRuntimeState(paths, sessionKey, {
        board_layer_hash: boardLayerHash,
        instructions_nonboard_fingerprint: nonBoardInstructionsFingerprint
    }), {
        gate1Fired: !1,
        gate2Fired: !1,
        fpNew: instructionsFingerprint,
        fpOld: previousFingerprint,
        clearedSdkSessionId: !1,
        requestedFork: !1,
        boardOnlyDrift: !1,
        boardLayerHash,
        nonBoardFingerprint: nonBoardInstructionsFingerprint
    }
}
