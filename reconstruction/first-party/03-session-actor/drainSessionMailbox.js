// duoduo reconstruction — subsystem: 03-session-actor
// symbol: drainSessionMailbox  (minified: cde, daemon.pretty.js:60019)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function drainSessionMailbox(e, t, n = {}) {
 let r = Ai(t);
 if (!(await Cle(e, r))
  .acquired) return {
  processed: 0,
  skipped: 0,
  lockAcquired: !1,
  cancelled: !1
 };
 let o = n.lockHeartbeatIntervalMs ?? 3e4,
  s = setInterval(async () => {
   try {
    await Ale(e, r)
   } catch {}
  }, o);
 s.unref?.(), Si("drain_started", t, {
  sessionKey: t
 });
 let a = Date.now(),
  c = 0,
  u = 0,
  l = 0,
  d, p, f = {};

 function m(S) {
  if (S) {
   if (!p) {
    p = {
     ...S
    };
    return
   }
   p.input_tokens = (p.input_tokens ?? 0) + (S.input_tokens ?? 0), p.output_tokens = (p.output_tokens ?? 0) + (S.output_tokens ?? 0), p.cache_creation_input_tokens = (p.cache_creation_input_tokens ?? 0) + (S.cache_creation_input_tokens ?? 0), p.cache_read_input_tokens = (p.cache_read_input_tokens ?? 0) + (S.cache_read_input_tokens ?? 0), p.total_cost_usd = (p.total_cost_usd ?? 0) + (S.total_cost_usd ?? 0), !p.protocol && S.protocol && (p.protocol = S.protocol), !p.model && S.model && (p.model = S.model), S.context_used_tokens !== void 0 && (p.context_used_tokens = S.context_used_tokens)
  }
 }
 async function h(S) {
  try {
   await appendDrainRecord(e, {
    id: sde.randomUUID(),
    session_key: t,
    sdk_session_id: d,
    drain_started_at: new Date(a)
     .toISOString(),
    drain_duration_ms: Date.now() - a,
    sdk_duration_ms: c,
    events_processed: S.processedCount,
    events_skipped: S.skippedCount,
    tool_calls: u,
    tool_errors: l,
    output_chars: S.replyText?.length ?? 0,
    cancelled: S.cancelled,
    usage: p,
    perf: Object.keys(f)
     .length > 0 ? f : void 0
   })
  } catch {}
 }
 let g = {
  input_tokens: 0,
  cache_read: 0,
  cache_create: 0,
  output_tokens: 0,
  total_cost_usd: 0
 };

 function v() {
  if (!p) return;
  let S = p.input_tokens ?? 0,
   _ = p.cache_read_input_tokens ?? 0,
   b = p.cache_creation_input_tokens ?? 0,
   w = p.output_tokens ?? 0,
   x = p.total_cost_usd ?? 0,
   R = nR({
    protocol: p.protocol,
    input_tokens: S - g.input_tokens,
    cache_read_input_tokens: _ - g.cache_read,
    cache_creation_input_tokens: b - g.cache_create
   }),
   T = {
    elapsed_ms: Date.now() - a,
    total_input_tokens: p.input_tokens === void 0 ? void 0 : R.totalInput,
    cache_hit_rate: rR(R),
    output_tokens: p.output_tokens === void 0 ? void 0 : w - g.output_tokens,
    total_cost_usd: p.total_cost_usd === void 0 ? void 0 : x - g.total_cost_usd,
    model: p.model,
    context_used_tokens: p.context_used_tokens,
    protocol: p.protocol
   };
  return g = {
   input_tokens: S,
   cache_read: _,
   cache_create: b,
   output_tokens: w,
   total_cost_usd: x
  }, T
 }
 try {
  try {
   await $i(f, "mailbox_merge_ms", async () => YS(e, t))
  } catch (F) {
   if (qX(F)) return {
    processed: 0,
    skipped: 0,
    lockAcquired: !0,
    cancelled: !1,
    mergeTransientFailure: !0
   };
   throw F
  }
  let S = await $i(f, "mailbox_parse_ms", async () => Rg(e, t));
  if (S.length === 0) return {
   processed: 0,
   skipped: 0,
   lockAcquired: !0,
   cancelled: !1
  };
  if (S.some(F => !F.eventId)) {
   let F = await VX(e, t);
   if (F.removed > 0) {
    await Bo(e, t, `orphan_cleanup=${F.removed}`);
    let B = await Rg(e, t);
    if (B.length === 0) return {
     processed: 0,
     skipped: 0,
     lockAcquired: !0,
     cancelled: !1
    };
    S = B
   }
  }
  await $i(f, "mailbox_render_ms", async () => XS(e, t, S));
  let b = n.batchSize ?? f5e,
   w = n.mergeWindowMs ?? p5e,
   x = n.sdk ?? createAgentSdkAdapter();
  await Yp(e), await Qp(e);
  let R = await batchDrainItems(e, S, {
    fallbackBatchSize: b,
    mergeWindowMs: w,
    perf: f
   }),
   T = R.items,
   P = [],
   E = 0,
   O = !1,
   A, D, H, K = [],
   te = await $i(f, "session_state_ms", async () => Mt(e, t)),
   z = PU(e, t, te ?? void 0),
   xe = n.jobContext?.stateless === !0;
  if (z.forkFrom && (n.runtime !== "codex" || xe) && (z.forkFrom = void 0, await Is(e, t, "pending_fork_to")
    .catch(() => {})), await M5e(e, t, {
    snapshotModel: te?.model,
    snapshotModelRuntime: te?.model_runtime,
    activeRuntime: n.runtime ?? "claude",
    sessionInfo: z
   }), te?.pending_model_fork && await z5e(e, t, {
    snapshotModel: te.model,
    runtime: n.runtime,
    statelessJob: xe,
    sessionInfo: z
   }), z.pendingUndo && (n.runtime === "claude" || n.runtime === void 0)) {
   let F = z.pendingUndo;
   try {
    let {
     sessionId: B
    } = await d5e(F.from, {
     upToMessageId: F.upToMessageUuid
    });
    await It(e, t, {
     sdk_session_id: B,
     pending_undo: null
    }), z.sessionId = B, z.pendingUndo = void 0, ee("[runner] pending_undo materialized via forkSession", {
     sessionKey: t,
     from: F.from,
     upToMessageUuid: F.upToMessageUuid,
     forkedSessionId: B
    }), n.bus?.emit("session.streaming_invalidated", {
     sessionKey: t,
     reason: "fork"
    })
   } catch (B) {
    let J = B instanceof Error ? B.message.split(`
`)[0] : String(B);
    return fe("[runner] pending_undo forkSession failed; LEAVING pending_undo set for retry, aborting drain", {
      sessionKey: t,
      from: F.from,
      upToMessageUuid: F.upToMessageUuid,
      error: J
     }), await It(e, t, {
      last_error: {
       message: `pending_undo forkSession failed: ${J}`,
       at: new Date()
        .toISOString()
      }
     })
     .catch(() => {}), await hU(e, t), {
      processed: 0,
      skipped: 0,
      lockAcquired: !0,
      cancelled: !1,
      lastReplyText: void 0,
      lastOutboxId: void 0,
      lastOutboxRecord: void 0,
      outboxRecords: []
     }
   }
  } else z.pendingUndo && n.runtime !== "claude" && (z.pendingUndo = void 0, await Is(e, t, "pending_undo")
   .catch(() => {}));
  let Ne = te?.pending_gateway_notice,
   ve = te?.pending_interrupted_context,
   Tt = te?.pending_skip_rewind,
   Ht = !1,
   _e = !1,
   Ze = !1,
   ae = !1,
   C = Gle({
    currentDaemonStartedAt: vU,
    sessionKey: t,
    lastEventAt: te?.last_event_at,
    lastSeenDaemonStartedAt: te?.last_seen_daemon_started_at
   });
  C.writeLastSeenAtEntry && await It(e, t, {
    last_seen_daemon_started_at: C.writeLastSeenAtEntry
   })
   .catch(() => {});
  let L = C.inject ? {
    startedAt: vU
   } : void 0,
   ne = C.writeLastSeenOnInjectSuccess,
   Q = !1,
   ke = te?.last_event_at,
   Fe = !1,
   Be = [],
   wn, gt;
  for (let F of T) {
   if (!F.eventId) {
    E += 1;
    continue
   }
   let B = F.eventId;
   if (n.excludeEventIds?.has(B)) {
    E += 1;
    continue
   }
   let J = await $i(f, "outbox_lookup_ms", async () => jf(e, B));
   if (J) {
    P.push(B), A = J.payload.text, D = J.id;
    continue
   }
   let Le = R.events.get(B) ?? await $i(f, "event_read_ms", async () => readEventByIdSeek(e, B));
   if (!Le) {
    E += 1;
    continue
   }
   Be.push({
    item: F,
    event: Le,
    prompt: RU(Le, t)
   })
  }
  if (n.onBatchContext && Be.length > 0) {
   let F = 0;
   for (let J of Be)
    if (J.event.type === "route.deliver") {
     let Le = So(J.event.payload) ? J.event.payload : void 0,
      Dn = So(Le?.payload) ? Le.payload : void 0,
      Ye = typeof Dn?.notify_depth == "number" ? Dn.notify_depth : 0;
     Ye > F && (F = Ye)
    } let B = Be.map(J => J.item.eventId)
    .filter(J => !!J);
   n.onBatchContext({
    maxNotifyDepth: F,
    eventIds: B
   })
  }
  let y = F5e(z.cwd);
  if (Be.length > 0 && y) {
   let F = U5e(t, z.cwd, y);
   if (Oa(t) === "channel") {
    for (let B of Be) {
     let J = await es(e, t, {
      item: B.item,
      event: B.event,
      outputText: F,
      sdkSessionId: z.sessionId
     });
     K.push(...J.records), J.primaryRecord && (A = J.primaryRecord.payload.text, D = J.primaryRecord.id, H = J.primaryRecord), B.item.eventId && P.push(B.item.eventId)
    }
    return await lr(e, t, P), await Bo(e, t, `processed=${P.length} skipped=${E} workspace_unavailable=true`), {
     processed: P.length,
     skipped: E,
     lockAcquired: !0,
     cancelled: !1,
     lastReplyText: A,
     lastOutboxId: D,
     lastOutboxRecord: H,
     outboxRecords: K
    }
   }
   throw await handleDrainError(e, t, {
    anchor: Be[0],
    error: new Error(F),
    stage: "workspace_unavailable",
    userText: F,
    payloadExtra: {
     outcome: "workspace_unavailable",
     cwd: z.cwd,
     reason: y
    }
   }), new Error(F)
  }
  let I = claudeUnavailableReason();
  if (Be.length > 0 && n.runtime === "claude" && I) {
   let F = q5e(I);
   if (Oa(t) === "channel") {
    for (let J of Be) {
     let Le = await es(e, t, {
      item: J.item,
      event: J.event,
      outputText: F,
      sdkSessionId: z.sessionId
     });
     K.push(...Le.records), Le.primaryRecord && (A = Le.primaryRecord.payload.text, D = Le.primaryRecord.id, H = Le.primaryRecord), J.item.eventId && P.push(J.item.eventId)
    }
    return await lr(e, t, P), await Bo(e, t, `processed=${P.length} skipped=${E} runtime_unavailable=claude`), {
     processed: P.length,
     skipped: E,
     lockAcquired: !0,
     cancelled: !1,
     lastReplyText: A,
     lastOutboxId: D,
     lastOutboxRecord: H,
     outboxRecords: K
    }
   }
   throw await handleDrainError(e, t, {
    anchor: Be[0],
    error: new Error(F),
    stage: "runtime_unavailable",
    userText: F,
    payloadExtra: {
     outcome: "runtime_unavailable",
     runtime: "claude",
     runtime_source: n.runtime ? "explicit" : "default"
    }
   }), new Error(F)
  }
  let j = F => async B => {
   if (B.type === "system" && B.subtype === "init" && B.data && typeof B.data.session_id == "string" && (wn = B.data.session_id, z.sessionId && wn !== z.sessionId && fe("[runner] SDK session ID mismatch — context lost", {
     sessionKey: t,
     requestedSessionId: z.sessionId,
     actualSessionId: wn
    })), B.type === "system" && B.subtype === "compact_boundary" && B.data && typeof B.data == "object") {
    let J = B.data,
     Le = J.trigger;
    (Le === "manual" || Le === "auto") && (gt = {
     trigger: Le,
     pre_tokens: typeof J.pre_tokens == "number" ? J.pre_tokens : void 0,
     post_tokens: typeof J.post_tokens == "number" ? J.post_tokens : void 0
    })
   }
   return B.type === "tool_use" ? u += 1 : B.type === "tool_result" && B.isError && (l += 1), F(B)
  }, W = async () => {
   let F = wn ?? z.sessionId;
   !F || n.skipSessionIdUpdate || xe || await It(e, t, {
    sdk_session_id: F
   })
  }, Y = async (F, B) => {
   await W(), !(await Mt(e, t))
    ?.pending_skip_rewind && await E5e(e, t, x5e(F, B ? ve : void 0))
  }, q = async F => {
   F.gatewayNoticeInjected && !Ht && (await pde(e, t), Ht = !0), F.interruptedContextInjected && !_e && (await mde(e, t), _e = !0), F.skipRewindInjected && !Ze && (await hde(e, t), Ze = !0)
  };
  if (I5e(Be, t)) {
   let F = await EU(e, t, n, Be, z, {
     pendingGatewayNotice: Ne,
     pendingInterruptedContext: ve,
     pendingSkipRewind: Tt,
     lastEventAtWatermark: ke,
     timeGapConsumed: ae,
     daemonRestartHint: Q ? void 0 : L
    }, f, j),
    {
     anchor: B,
     resumeSessionId: J,
     forkFromSessionId: Le,
     handleExecutionEvent: Dn,
     attachments: Ye,
     batchEventIds: xn,
     coalescedPromptText: it,
     injectionResult: ot,
     systemPrompt: Lt,
     sdkRunConfig: Fn
    } = F;
   ae = F.timeGapConsumed, !Q && F.injectionResult.daemonRestartHintInjected && (Q = !0, ne && await It(e, t, {
     last_seen_daemon_started_at: ne
    })
    .catch(() => {})), Si("sdk_start", B.event.id, {
    eventIds: xn,
    coalesced: Be.length > 1
   });
   let G = Date.now(),
    V;
   try {
    let pe = F.isNotifyOnly || F.anchorChannelConfig?.stream === !1;
    V = await ode(e, t, x, {
     prompt: ot.blocks,
     abortController: n.abortController,
     onStream: pe ? void 0 : n.onStream,
     onExecutionEvent: Dn,
     onTurnAcknowledged: n.onSdkTurnStarted,
     onTurnRejected: n.onSdkTurnRejected,
     sessionId: J,
     forkFrom: Le,
     model: n.jobContext?.model ?? z.model,
     cwd: z.cwd,
     settingSources: z.settingSources,
     persistSession: n.persistSession,
     permissionMode: Fn.permissionMode,
     allowedTools: Fn.allowedTools,
     disallowedTools: Fn.disallowedTools,
     mcpServers: n.mcpServers,
     mcpServersFactory: n.mcpServersFactory,
     holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
     additionalDirectories: Fn.additionalDirectories,
     autoloadAdditionalDirectoryClaudeMd: Qle(n.runtime, n.memoryBoard, Fn.additionalDirectories, e.memoryDir),
     attachments: Ye,
     systemPrompt: Lt
    })
   } catch (pe) {
    if (isAgentSdkTurnInterruptedError(pe)) {
     await q(ot);
     for (let X of Be) X.item.eventId && P.push(X.item.eventId);
     return await lr(e, t, P), await Bo(e, t, `processed=${P.length} skipped=${E} cancelled=true`), await h({
      cancelled: !0,
      processedCount: P.length,
      skippedCount: E,
      replyText: A
     }), {
      processed: P.length,
      skipped: E,
      lockAcquired: !0,
      cancelled: !0,
      lastReplyText: A,
      lastOutboxId: D,
      lastOutboxRecord: H,
      outboxRecords: K
     }
    }
    if (isAgentSdkPromptNotAcceptedAbortError(pe)) return await lr(e, t, P), await Bo(e, t, `processed=${P.length} skipped=${E} cancelled=true`), await h({
     cancelled: !0,
     processedCount: P.length,
     skippedCount: E,
     replyText: A
    }), {
     processed: P.length,
     skipped: E,
     lockAcquired: !0,
     cancelled: !0,
     lastReplyText: A,
     lastOutboxId: D,
     lastOutboxRecord: H,
     outboxRecords: K
    };
    if (xU(pe)) {
     for (let X of Be) X.item.eventId && P.push(X.item.eventId);
     return await Y(it, ot.interruptedContextInjected), await lr(e, t, P), await Bo(e, t, `processed=${P.length} skipped=${E} cancelled=true`), await h({
      cancelled: !0,
      processedCount: P.length,
      skippedCount: E,
      replyText: A
     }), {
      processed: P.length,
      skipped: E,
      lockAcquired: !0,
      cancelled: !0,
      lastReplyText: A,
      lastOutboxId: D,
      lastOutboxRecord: H,
      outboxRecords: K
     }
    }
    throw await handleDrainError(e, t, {
     anchor: B,
     error: pe,
     stage: "sdk_turn"
    }), pe
   }
   let ge = V.sdkResult;
   if (c += Date.now() - G, n.runtime === "codex" && !ge.skipped && await tde(e, t, a) && (ge.skipped = !0), ge.sessionId && (d = ge.sessionId), m(ge.usage), typeof ge.firstTokenLatencyMs == "number" && (wU(f, "sdk_ttft_ms_total", ge.firstTokenLatencyMs), f.sdk_ttft_samples = (f.sdk_ttft_samples ?? 0) + 1), Si("sdk_end", B.event.id, {
     eventIds: xn,
     sdkDurationMs: Date.now() - G,
     usedFallback: ge.usedFallback
    }), n.abortController?.signal.aborted) {
    await Y(it, ot.interruptedContextInjected);
    for (let pe of Be) pe.item.eventId && P.push(pe.item.eventId);
    return await lr(e, t, P), await Bo(e, t, `processed=${P.length} skipped=${E} cancelled=true`), await h({
     cancelled: !0,
     processedCount: P.length,
     skippedCount: E,
     replyText: A
    }), {
     processed: P.length,
     skipped: E,
     lockAcquired: !0,
     cancelled: !0,
     lastReplyText: A,
     lastOutboxId: D,
     lastOutboxRecord: H,
     outboxRecords: K
    }
   }
   if (await q(ot), ge.skipped) O = !0, ee("[runner] Skip called — suppressing outbox", {
    sessionKey: t,
    eventId: B.event.id
   });
   else {
    let pe = ide(B.event, ge),
     X = await $i(f, "outbox_emit_ms", async () => es(e, t, {
      item: B.item,
      event: B.event,
      outputText: pe,
      sdkSessionId: ge.sessionId,
      batchedEventIds: Be.map(De => De.event.id),
      attachments: V.outboundAttachments,
      turnMeta: v()
     }));
    if (K.push(...X.records), X.primaryRecord) {
     Si("outbox_written", B.event.id, {
      outboxId: X.primaryRecord.id,
      eventIds: xn
     }), A = X.primaryRecord.payload.text, D = X.primaryRecord.id, H = X.primaryRecord;
     for (let De of Be.slice(0, -1)) De.item.eventId && await x1(e, De.item.eventId, X.primaryRecord)
    }
   }
   for (let pe of Be) pe.item.eventId && P.push(pe.item.eventId);
   if (ge.skipped) {
    let pe = Be.map(X => X.item.eventId)
     .filter(X => !!X);
    pe.length > 0 && await lr(e, t, pe)
     .catch(X => {
      fe("[runner] Skip-turn mailbox finalize failed (will retry at drain end)", {
       sessionKey: t,
       error: String(X)
      })
     })
   }
   if (ge.usedFallback && ge.resumeError) {
    let pe = createSpineEvent({
     type: "agent.error",
     source: {
      kind: "runner",
      name: "runner"
     },
     session_key: B.event.session_key ?? t,
     payload: {
      stage: "resume",
      session_id: z.sessionId,
      error: ge.resumeError
     }
    });
    await atomicAppendEvent(e, pe)
   }
   await $i(f, "session_upsert_ms", async () => {
    let pe = {
     cwd: z.cwd,
     plane: z.plane,
     permission_profile: z.permissionProfile,
     last_event_id: B.event.id,
     last_event_at: B.event.ts
    };
    ge.sessionId && !xe && (pe.sdk_session_id = ge.sessionId), Le && (pe.pending_fork_to = null), await It(e, t, pe)
   }), B.event.ts && (ke = B.event.ts)
  } else {
   let F = n.resume === !1 || xe ? void 0 : z.sessionId,
    B = n.resume === !1 || n.runtime !== "codex" || xe ? void 0 : z.forkFrom;
   for (let J of Be) {
    let Le = !1;
    if (J.event.routing_hint?.intent === "history-control") {
     let je = So(J.event.payload) ? J.event.payload : void 0,
      Hi = (je?.text ?? je?.command ?? "")
      .trim(),
      rt = /^(\S+)(?:\s+(.*))?$/.exec(Hi),
      Zt = rt?.[1]?.toLowerCase() ?? "",
      ei = rt?.[2]?.trim() ?? "";
     if (Zt === "/compact" && (n.runtime === "claude" || n.runtime === void 0))
      if (Oa(t) === "channel") Le = !0;
      else {
       let Ma = "ℹ️ /compact is only available in interactive sessions.",
        tr = await es(e, t, {
         item: J.item,
         event: J.event,
         outputText: Ma,
         sdkSessionId: F
        });
       K.push(...tr.records), tr.primaryRecord && (D = tr.primaryRecord.id, H = tr.primaryRecord, A = Ma), J.item.eventId && (P.push(J.item.eventId), await lr(e, t, [J.item.eventId])
        .catch(Un => {
         fe("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
          sessionKey: t,
          eventId: J.item.eventId,
          error: Un instanceof Error ? Un.message : String(Un)
         })
        })), J.event.ts && (ke = J.event.ts);
       continue
      } if (!Le) {
      let Ma = n.sdk ?? createAgentSdkAdapter(),
       tr = await j5e({
        paths: e,
        sessionKey: t,
        sdk: Ma,
        sessionInfo: {
         ...z,
         sessionId: F
        },
        cmdToken: Zt,
        cmdArgs: ei
       }),
       Un = await es(e, t, {
        item: J.item,
        event: J.event,
        outputText: tr,
        sdkSessionId: F
       });
      K.push(...Un.records), Un.primaryRecord && (D = Un.primaryRecord.id, H = Un.primaryRecord, A = tr);
      let ht = await Mt(e, t);
      if (ht && (z.sessionId = ht.sdk_session_id, z.pendingUndo = ht.pending_undo, F = ht.sdk_session_id), J.item.eventId && (P.push(J.item.eventId), await lr(e, t, [J.item.eventId])
        .catch(lu => {
         fe("[runner] history-control mailbox finalize failed (will be retried at drain end)", {
          sessionKey: t,
          eventId: J.item.eventId,
          error: lu instanceof Error ? lu.message : String(lu)
         })
        })), J.event.ts && (ke = J.event.ts), ht?.pending_undo && !ht.sdk_session_id) {
       ee("[runner] pending_undo set during drain — bailing batch to let next drain materialize fork", {
        sessionKey: t,
        pending_undo: ht.pending_undo
       });
       break
      }
      continue
     }
    }
    let Dn = B,
     Ye = n.resume === !1 || Dn || xe ? void 0 : F,
     xn = j(vde(e, t, J.event.session_key ?? t, n.onExecutionEvent)),
     it = So(J.event.payload) ? J.event.payload : void 0,
     ot = it ? TU(it) : void 0,
     Lt = await $i(f, "effective_config_ms", async () => z1(e, J.event)),
     Fn = Oa(t) === "channel",
     G = J.event.type === "channel.message",
     ge = (Lt?.time_gap_minutes ?? lde) * 60 * 1e3,
     pe = !ae && ge > 0 && Fn && G && ke ? {
      lastEventAt: ke,
      currentEventAt: J.event.ts ?? new Date()
       .toISOString(),
      thresholdMs: ge
     } : void 0,
     X, De = J.prompt;
    if (J.event.type === "job.spawn" && n.jobContext) {
     let je = So(it?.tick) ? it.tick : void 0;
     if (je) {
      let Vt = je.run_number,
       Hi = je.triggered_at,
       rt = je.previous_run_at;
      typeof Vt == "number" && typeof Hi == "string" && (X = {
       run_number: Vt,
       triggered_at: Hi,
       previous_run_at: typeof rt == "string" ? rt : null,
       cron: n.jobContext.cron
      })
     }
     X && (De = S5e)
    }
    let se = !Q && L ? L : void 0,
     lt = !Ht || !_e || !Ze || !!pe || !!X || !!se ? buildTransientUserBlocks(De, {
      gatewayNotice: Ht ? void 0 : Ne,
      interruptedContext: _e ? void 0 : ve,
      skipRewind: Ze ? void 0 : Tt,
      isUserMessage: G,
      timeGap: pe,
      jobTick: X,
      daemonRestartHint: se
     }, z) : {
      blocks: [{
       type: "text",
       text: De,
       tag: "user-input"
      }],
      gatewayNoticeInjected: !1,
      interruptedContextInjected: !1,
      skipRewindInjected: !1,
      timeGapInjected: !1,
      jobTickInjected: !1,
      daemonRestartHintInjected: !1
     };
    ae = ae || lt.timeGapInjected, !Q && lt.daemonRestartHintInjected && (Q = !0, ne && await It(e, t, {
      last_seen_daemon_started_at: ne
     })
     .catch(() => {}));
    let rn = buildSystemPromptForChannelConfig(Lt, t, n.jobContext ? {
      content: n.jobContext.content,
      jobId: n.jobContext.jobId,
      cron: n.jobContext.cron,
      stateless: n.jobContext.stateless
     } : void 0, n.memoryBoard),
     Yt = ade(n, Lt),
     tt, mn = Date.now();
    try {
     tt = await ode(e, t, x, {
      prompt: lt.blocks,
      abortController: n.abortController,
      onStream: n.onStream,
      onExecutionEvent: xn,
      onTurnAcknowledged: n.onSdkTurnStarted,
      onTurnRejected: n.onSdkTurnRejected,
      sessionId: Ye,
      forkFrom: Dn,
      model: n.jobContext?.model ?? z.model,
      cwd: z.cwd,
      settingSources: z.settingSources,
      persistSession: n.persistSession,
      permissionMode: Yt.permissionMode,
      allowedTools: Yt.allowedTools,
      disallowedTools: Yt.disallowedTools,
      mcpServers: n.mcpServers,
      mcpServersFactory: n.mcpServersFactory,
      holdInputOpenForBackgroundAgents: n.holdInputOpenForBackgroundAgents,
      additionalDirectories: Yt.additionalDirectories,
      autoloadAdditionalDirectoryClaudeMd: Qle(n.runtime, n.memoryBoard, Yt.additionalDirectories, e.memoryDir),
      attachments: ot,
      systemPrompt: rn
     })
    } catch (je) {
     if (isAgentSdkTurnInterruptedError(je)) {
      await q(lt), J.item.eventId && P.push(J.item.eventId), Fe = !0;
      break
     }
     if (isAgentSdkPromptNotAcceptedAbortError(je)) {
      Fe = !0;
      break
     }
     if (xU(je)) {
      J.item.eventId && P.push(J.item.eventId), await Y(J.prompt, lt.interruptedContextInjected), Fe = !0;
      break
     }
     throw await handleDrainError(e, t, {
      anchor: J,
      error: je,
      stage: "sdk_turn"
     }), je
    }
    let We = tt.sdkResult;
    if (n.runtime === "codex" && !We.skipped && await tde(e, t, mn) && (We.skipped = !0), c += Date.now() - mn, We.sessionId && (d = We.sessionId), m(We.usage), typeof We.firstTokenLatencyMs == "number" && (wU(f, "sdk_ttft_ms_total", We.firstTokenLatencyMs), f.sdk_ttft_samples = (f.sdk_ttft_samples ?? 0) + 1), n.abortController?.signal.aborted) {
     await Y(J.prompt, lt.interruptedContextInjected), Fe = !0, J.item.eventId && P.push(J.item.eventId);
     break
    }
    if (await q(lt), !We.skipped && !Le) {
     let je = ide(J.event, We),
      Vt = await $i(f, "outbox_emit_ms", async () => es(e, t, {
       item: J.item,
       event: J.event,
       outputText: je,
       sdkSessionId: We.sessionId,
       attachments: tt.outboundAttachments,
       turnMeta: v()
      }));
     K.push(...Vt.records), Vt.primaryRecord && (A = Vt.primaryRecord.payload.text, D = Vt.primaryRecord.id, H = Vt.primaryRecord)
    } else Le ? ee("[runner] in-band /compact turn — suppressing empty outbox", {
     sessionKey: t,
     eventId: J.event.id
    }) : (O = !0, ee("[runner] Skip called — suppressing outbox", {
      sessionKey: t,
      eventId: J.event.id
     }), J.item.eventId && await lr(e, t, [J.item.eventId])
     .catch(je => {
      fe("[runner] Skip-turn mailbox finalize failed (will retry at drain end)", {
       sessionKey: t,
       eventId: J.item.eventId,
       error: String(je)
      })
     }));
    if (gt) {
     let je = gt;
     if (gt = void 0, je.trigger === "manual") {
      let Vt = D5e(je),
       Hi = await es(e, t, {
        item: J.item,
        event: J.event,
        outputText: Vt,
        sdkSessionId: We.sessionId ?? F
       });
      K.push(...Hi.records), Hi.primaryRecord && (A = Vt, D = Hi.primaryRecord.id, H = Hi.primaryRecord)
     } else ee("[runner] auto compact_boundary — telemetry only, no channel ack", {
      sessionKey: t,
      eventId: J.event.id,
      pre_tokens: je.pre_tokens,
      post_tokens: je.post_tokens
     })
    } else if (Le) {
     let je = "ℹ️ Nothing to compact.",
      Vt = await es(e, t, {
       item: J.item,
       event: J.event,
       outputText: je,
       sdkSessionId: We.sessionId ?? F
      });
     K.push(...Vt.records), Vt.primaryRecord && (A = je, D = Vt.primaryRecord.id, H = Vt.primaryRecord)
    }
    if (J.item.eventId && P.push(J.item.eventId), We.usedFallback && We.resumeError) {
     let je = createSpineEvent({
      type: "agent.error",
      source: {
       kind: "runner",
       name: "runner"
      },
      session_key: J.event.session_key ?? t,
      payload: {
       stage: "resume",
       session_id: z.sessionId,
       error: We.resumeError
      }
     });
     await atomicAppendEvent(e, je)
    }
    await $i(f, "session_upsert_ms", async () => {
     let je = {
      cwd: z.cwd,
      plane: z.plane,
      permission_profile: z.permissionProfile,
      last_event_id: J.event.id,
      last_event_at: J.event.ts
     };
     We.sessionId && !xe && (je.sdk_session_id = We.sessionId), Dn && (je.pending_fork_to = null), await It(e, t, je)
    }), Dn && (B = void 0), We.sessionId && !xe && (F = We.sessionId), J.event.ts && (ke = J.event.ts)
   }
  }
  return await $i(f, "mailbox_finalize_ms", async () => {
   if (await lr(e, t, P), P.length > 0 || E > 0) {
    let F = `processed=${P.length} skipped=${E}${D?` outbox=${D}`:""}`;
    await Bo(e, t, F)
   }
  }), await h({
   cancelled: Fe,
   processedCount: P.length,
   skippedCount: E,
   replyText: A
  }), {
   processed: P.length,
   skipped: E,
   lockAcquired: !0,
   cancelled: Fe,
   turnSkipped: O,
   lastReplyText: A,
   lastOutboxId: D,
   lastOutboxRecord: H,
   outboxRecords: K
  }
 } finally {
  clearInterval(s), await hU(e, r)
 }
}
