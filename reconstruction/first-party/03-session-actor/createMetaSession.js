// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createMetaSession  (minified: _Qe, daemon.pretty.js:74659)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createMetaSession(e) {
 let {
  paths: t,
  bus: n,
  sessionManager: r
 } = e, i = e.sdk, o = e.sessionKey ?? "meta:subconscious", s = e.codexAvailability ?? checkCodexAvailability, a = e.codexAdapterFactory ?? (() => createCodexAppServerAdapter({
  sandbox: resolveCodexSandbox(),
  ephemeral: !0,
  dynamicTools: bI({
   paths: t,
   sessionKey: o,
   bus: n,
   sessionContextKind: "meta"
  })
 })), c = e.maxPartitionsPerIdleTick ?? 2, u = e.cadenceIntervalMs ?? p2, l = !1, d = !1, p = null, f = !1, m = null, h = 0, g = new Map;
 async function v(x, R, T) {
  let P = await Promise.all(x.map(async O => [O.name, await uv(t, O.name)])),
   E = new Map(P);
  for (;;) {
   let O = await np(t);
   if (O.allDone) {
    if (await Wie(t) === 0) return null;
    O = await np(t)
   }
   let A = _(O.items, x, T, E, new Date);
   if (!A) return null;
   let D = x.find(z => z.name === A.name);
   if (!D || !D.schedule.enabled) {
    let z = O.items.filter(ve => !ve.done)
     .length;
    await zx(t, A.name);
    let Ne = (await np(t))
     .items.filter(ve => !ve.done)
     .length;
    if (Ne >= z) return fe("[meta-session] stale playlist item did not advance", {
     name: A.name,
     reason: D ? "disabled" : "removed",
     beforeUnchecked: z,
     afterUnchecked: Ne
    }), null;
    Ue("[meta-session] skipping unavailable partition, will retry next", {
     name: A.name,
     reason: D ? "disabled" : "removed"
    });
    continue
   }
   let H = await S(D, R, T),
    te = (await Promise.all(x.map(async z => [z.name, await uv(t, z.name)])))
    .filter(([, z]) => f2(z, new Date))
    .map(([z]) => z);
   return {
    ...H,
    backedOff: te
   }
  }
 }
 async function S(x, R, T) {
  let P = Date.now(),
   E, O, A = 0,
   D = 0,
   H = x.runtime,
   K = H ?? tl();
  ee("[v12-observe] partition runtime selected", {
   partition: x.name,
   runtime: K,
   requestedRuntime: H ?? null,
   sdkInjected: !!i
  });
  let te, z, xe = async q => {
   let F = Date.now() - P,
    B = createSpineEvent({
     type: "agent.error",
     source: {
      kind: "meta",
      name: `subconscious:${x.name}`
     },
     session_key: o,
     payload: {
      stage: "partition_execution",
      partition: x.name,
      outcome: "runtime_unavailable",
      runtime: K,
      runtime_source: H ? "explicit" : "default",
      error: `runtime '${K}' is unavailable: ${q}`
     }
    });
   await atomicAppendEvent(t, B), await advanceConsumerWatermark(t, "meta_session", B.id, new Date(B.ts)), fe("[meta-session] partition skipped: requested runtime unavailable", {
    partition: x.name,
    runtime: K,
    requestedFrom: H ? "frontmatter" : "default",
    reason: q
   }), await zx(t, x.name), g.set(x.name, T);
   let J = await uv(t, x.name),
    Le = new Date,
    Dn = {
     last_started_at: new Date(P)
      .toISOString(),
     last_finished_at: Le.toISOString(),
     last_result: "error",
     consecutive_failures: J.consecutive_failures + 1,
     backoff_until: m2("error", J.consecutive_failures + 1, Le, u)
    };
   return await d2(t, x.name, Dn), {
    name: x.name,
    outcome: "error",
    durationMs: F,
    backedOff: []
   }
  }, Ne = claudeUnavailableReason();
  if (K === "claude" && !i && Ne) return await xe(Ne);
  if (i && K === "claude") te = i;
  else if (K === "codex") {
   let q = await s();
   if (ee("[v12-observe] codex probe result", {
     partition: x.name,
     probeOk: q.ok,
     probeReason: q.ok ? null : q.reason
    }), !q.ok) return await xe(q.reason);
   ee("[v12-observe] codex adapter spawn", {
    partition: x.name,
    sandbox: resolveCodexSandbox()
   });
   let F = a();
   te = F, z = () => F.shutdown()
  } else te = createAgentSdkAdapter();
  let ve = [],
   Tt = !1,
   Ht = partitionInboxDir(t, x.name),
   _e = await Jie(t, x.name),
   Ze = yQe(x, Ht, _e),
   ae = `### Partition
- Name: ${x.name}
- cwd: ${x.dir}/
- Inbox: ${Ht}/
`,
   C = Ze ? `${x.promptContent}

${ae}
${R}

${Ze}` : `${x.promptContent}

${ae}
${R}`,
   L = vI(t, {
    sessionKey: o,
    bus: n,
    sessionContextKind: "meta"
   }),
   ne = [...DEFAULT_DISALLOWED_TOOLS],
   Q = new AbortController;
  ee("[meta-session] executing partition", {
   partition: x.name
  });
  let $e = te.run({
    prompt: JT(C),
    cwd: x.dir,
    settingSources: ["user", "project"],
    persistSession: !1,
    mcpServers: {
     aladuo: L
    },
    holdInputOpenForBackgroundAgents: !0,
    additionalDirectories: [t.memoryDir],
    autoloadAdditionalDirectoryClaudeMd: !1,
    disallowedTools: ne,
    abortController: Q,
    onStream: (q, F) => {
     Tt || n.emit("session.stream", {
      sessionKey: o,
      chunk: q,
      isSidechain: F
     })
    },
    onExecutionEvent: q => {
     Tt || (q.type === "tool_use" ? A += 1 : q.type === "tool_result" && q.isError && (D += 1), ve.push(dQe(t, o, x.name, q)
      .catch(F => {
       fe("[meta-session] failed to persist execution event", {
        partition: x.name,
        eventType: q.type,
        error: F instanceof Error ? F.message : String(F)
       })
      })))
    }
   }),
   ke = Math.max(1, x.schedule.max_duration_ms),
   Fe = new Error(`partition timeout: ${x.name} exceeded ${ke}ms`),
   Be, wn = new Promise((q, F) => {
    Be = setTimeout(() => F(Fe), ke)
   });
  try {
   O = await Promise.race([$e, wn])
  } catch (q) {
   Tt = !0, q === Fe ? (E = "timeout", Q.abort(), $e.catch(F => {
    fe("[meta-session] late sdk completion after timeout", {
     partition: x.name,
     error: F instanceof Error ? F.message : String(F)
    })
   })) : E = "error"
  } finally {
   Be && clearTimeout(Be)
  }
  if (!E) {
   let q = lme(O?.text);
   E = lQe(x.name, q) ? "invalid_output" : "success"
  }
  let gt = Date.now() - P,
   y = O?.usage;
  if (appendDrainRecord(t, {
    id: crypto.randomUUID(),
    session_key: `${o}:${x.name}`,
    sdk_session_id: O?.sessionId,
    drain_started_at: new Date(P)
     .toISOString(),
    drain_duration_ms: gt,
    sdk_duration_ms: gt,
    events_processed: 1,
    events_skipped: 0,
    tool_calls: A,
    tool_errors: D,
    output_chars: O?.text?.length ?? 0,
    cancelled: E === "timeout",
    usage: y
   })
   .catch(() => {}), ve.length > 0 && await Promise.all(ve), E === "success") {
   let q = lme(O?.text),
    F = createSpineEvent({
     type: "agent.result",
     source: {
      kind: "meta",
      name: `subconscious:${x.name}`
     },
     session_key: o,
     payload: {
      text: q,
      tick_type: "subconscious",
      partition: x.name,
      runtime: K,
      runtime_source: H ? "explicit" : "default"
     }
    });
   await atomicAppendEvent(t, F), await advanceConsumerWatermark(t, "meta_session", F.id, new Date(F.ts)), ee("[meta-session] partition completed", {
    partition: x.name,
    runtime: K,
    eventId: F.id
   })
  } else {
   let q = E === "timeout" ? `partition timeout: ${x.name} exceeded ${ke}ms` : E === "invalid_output" ? `invalid output from ${x.name}` : `partition error: ${x.name}`,
    F = createSpineEvent({
     type: "agent.error",
     source: {
      kind: "meta",
      name: `subconscious:${x.name}`
     },
     session_key: o,
     payload: {
      stage: "partition_execution",
      partition: x.name,
      outcome: E,
      error: q,
      output_preview: O?.text?.slice(0, 400),
      runtime: K,
      runtime_source: H ? "explicit" : "default"
     }
    });
   await atomicAppendEvent(t, F), await advanceConsumerWatermark(t, "meta_session", F.id, new Date(F.ts)), fe("[meta-session] partition settled with non-success outcome", {
    partition: x.name,
    runtime: K,
    outcome: E
   })
  }
  await zx(t, x.name), g.set(x.name, T);
  let I = await uv(t, x.name),
   j = E === "success" ? 0 : I.consecutive_failures + 1,
   W = new Date,
   Y = {
    last_started_at: new Date(P)
     .toISOString(),
    last_finished_at: W.toISOString(),
    last_result: E,
    consecutive_failures: j,
    backoff_until: m2(E, j, W, u)
   };
  if (await d2(t, x.name, Y), z) {
   ee("[v12-observe] codex adapter shutdown", {
    partition: x.name,
    outcome: E,
    durationMs: gt
   });
   try {
    await z()
   } catch (q) {
    fe("[meta-session] codex adapter shutdown threw", {
     partition: x.name,
     error: q instanceof Error ? q.message : String(q)
    })
   }
  }
  return {
   name: x.name,
   outcome: E,
   durationMs: gt,
   backedOff: []
  }
 }

 function _(x, R, T, P, E) {
  for (let O of x) {
   if (O.done) continue;
   let A = R.find(te => te.name === O.name);
   if (!A || !A.schedule.enabled) return O;
   let D = P.get(O.name);
   if (D && f2(D, E)) continue;
   let H = Math.max(0, A.schedule.cooldown_ticks),
    K = g.get(O.name);
   if (K === void 0 || T - K >= H) return O
  }
  return null
 }
 let b = async () => {
  if (l || d) {
   Ue("[meta-session] skipping tick", {
    processing: l,
    stopRequested: d
   });
   return
  }
  l = !0, ee("[meta-session] starting tick");
  try {
   h += 1;
   let [x, R, T, P, E] = await Promise.all([$I(t.memoryFragmentsDir), $I(t.memoryEntitiesDir), $I(t.memoryTopicsDir), mQe(t), hQe(t)]), O = [x, R, T, P, E].join(":"), A = fQe(O);
   if (m !== null && A === m) {
    Ue("[meta-session] activity gate: skipping tick (fingerprint unchanged)"), l = !1;
    return
   }
   m = A, await ha(t, te => ({
    ...te,
    health: {
     ...te.health,
     meta_session: "starting"
    }
   })), await Yp(t), await Qp(t);
   let D = await oy(t),
    H = await gQe(t, r),
    K = await v(D, H, h);
   if (K?.name && c > 1 && (!r || r.activeCount() <= 1))
    for (let z = 1; z < c && await v(D, H, h); z++);
   await ha(t, te => ({
    ...te,
    health: {
     ...te.health,
     meta_session: "ok"
    }
   })), ee("[meta-session] tick completed", {
    executed: K?.name ?? null,
    outcome: K?.outcome ?? null,
    durationMs: K?.durationMs ?? null,
    backedOff: K?.backedOff ?? []
   })
  } catch (x) {
   Xe("[meta-session] tick error:", x), m = null, await ha(t, T => ({
    ...T,
    health: {
     ...T.health,
     meta_session: "down"
    }
   }));
   let R = createSpineEvent({
    type: "agent.error",
    source: {
     kind: "meta",
     name: "meta-session"
    },
    session_key: o,
    payload: {
     stage: "tick",
     error: x instanceof Error ? x.message : String(x)
    }
   });
   await atomicAppendEvent(t, R), await advanceConsumerWatermark(t, "meta_session", R.id, new Date(R.ts))
  } finally {
   l = !1
  }
 }, w = () => {
  if (l || d) {
   b();
   return
  }
  let x = b();
  p = x;
  let R = () => {
   p === x && (p = null)
  };
  x.then(R, R)
 };
 return {
  start() {
   d || f || (n.on("cadence.tick", w), f = !0, ha(t, x => ({
    ...x,
    health: {
     ...x.health,
     meta_session: "starting"
    }
   })), Br("info", "[meta-session] started, listening for cadence ticks"))
  },
  async stop() {
   if (d = !0, f && (n.off("cadence.tick", w), f = !1), p) try {
    await p
   } catch {}
   Br("info", "[meta-session] stopped")
  },
  isProcessing() {
   return l
  }
 }
}
