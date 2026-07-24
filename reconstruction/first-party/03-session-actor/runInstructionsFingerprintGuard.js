// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runInstructionsFingerprintGuard  (minified: l2, daemon.pretty.js:71894)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runInstructionsFingerprintGuard(e, t, n, r, i, o) {
 let s = computeInstructionsFingerprint(n),
  a = i.instructions_fingerprint ?? i.mission_fingerprint,
  c = i.schema_version ?? 0,
  u = o?.jobId;
 if (c < SESSION_SCHEMA_VERSION) return await It(e, t, {
  sdk_session_id: null,
  pending_fork_to: null,
  pending_undo: null,
  instructions_fingerprint: s,
  mission_fingerprint: null,
  schema_version: SESSION_SCHEMA_VERSION
 }), ee(`[session-upgrade] v${c} → v${SESSION_SCHEMA_VERSION} rebuild`, {
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
  requestedFork: !1
 };
 if (a !== s) {
  if (r === "codex") {
   let l = i.sdk_session_id;
   return l ? (await It(e, t, {
    pending_fork_to: l,
    instructions_fingerprint: s
   }), ee("[instructions-fingerprint] codex thread fork", {
    sessionKey: t,
    jobId: u,
    fp_old: a ?? null,
    fp_new: s,
    runtime: "codex",
    parent_thread_id: l,
    cleared_sdk_session_id: !1
   }), {
    gate1Fired: !1,
    gate2Fired: !0,
    fpNew: s,
    fpOld: a,
    clearedSdkSessionId: !1,
    requestedFork: !0
   }) : (await It(e, t, {
    sdk_session_id: null,
    pending_fork_to: null,
    pending_undo: null,
    instructions_fingerprint: s
   }), ee("[instructions-fingerprint] codex thread reset (no parent to fork)", {
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
    requestedFork: !1
   })
  }
  return await It(e, t, {
   instructions_fingerprint: s
  }), ee("[instructions-fingerprint] claude instructions updated", {
   sessionKey: t,
   jobId: u,
   fp_old: a ?? null,
   fp_new: s,
   runtime: "claude",
   cleared_sdk_session_id: !1
  }), {
   gate1Fired: !1,
   gate2Fired: !0,
   fpNew: s,
   fpOld: a,
   clearedSdkSessionId: !1,
   requestedFork: !1
  }
 }
 return {
  gate1Fired: !1,
  gate2Fired: !1,
  fpNew: s,
  fpOld: a,
  clearedSdkSessionId: !1,
  requestedFork: !1
 }
}
