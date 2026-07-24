// duoduo reconstruction — subsystem: 03-session-actor
// symbol: createSessionManager  (minified: nQe, daemon.pretty.js:72045)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSessionManager(e) {
 let {
  paths: t,
  bus: n,
  sdk: r,
  idleTimeoutMs: i = 36e5,
  heartbeatIntervalMs: o = 3e4
 } = e, s = r ?? createAgentSdkAdapter(), a = e.codexAvailability ?? checkCodexAvailability, c = e.codexAdapterFactory ?? createCodexAppServerAdapter, u = null, l = () => (u || (u = a()), u), d = y => y.map(I => ({
  value: I.value,
  displayName: I.displayName
 }));
 async function p(y, I) {
  if (I?.runtime === "codex") return "codex";
  let W = (await Mt(t, y)
    .catch(() => null))
   ?.source_channel_id;
  if (!W) return I?.runtime ?? "claude";
  let Y = await Ps(t, W)
   .catch(() => null),
   q = Y?.channel_kind,
   F = q ? await Ec(t.channelConfigDir, q)
   .catch(() => null) : null;
  return (Y?.runtime ?? F?.runtime) === "codex" && (await l())
   .ok ? "codex" : I?.runtime ?? "claude"
 }
 let f = e.maxConcurrentChannel ?? e.maxConcurrent ?? 10,
  m = e.maxConcurrentJob ?? 6,
  h = {
   name: "channel",
   activeCount: 0,
   maxConcurrent: f,
   wakeQueue: []
  },
  g = {
   name: "job",
   activeCount: 0,
   maxConcurrent: m,
   wakeQueue: []
  };

 function v(y, I) {
  return eQe(y, I) === "job" ? g : h
 }

 function S(y) {
  if (y.wakeQueue.length === 0 || !x) return;
  let I = y.wakeQueue.shift();
  pt("[session-manager] dequeue queued wake", {
   sessionKey: I,
   pool: y.name,
   queuedSessions: y.wakeQueue.length
  });
  let j = _.get(I);
  if (j && j.status === "idle" && !j.holdsPoolSlot && j.drainPromise) {
   j.pendingWake = !0, j.wakeResolver && (j.wakeResolver(), j.wakeResolver = null), pt("[session-manager] resuming idle actor from dequeue", {
    sessionKey: I,
    actorRunId: j.actorRunId,
    pool: y.name
   });
   return
  }
  if (y.activeCount >= y.maxConcurrent) {
   y.wakeQueue.unshift(I), pt("[session-manager] dequeue deferred: pool re-filled", {
    sessionKey: I,
    pool: y.name,
    activeCount: y.activeCount
   });
   return
  }
  if (j?.origin === "job" && j.jobId) {
   let W = j.jobId;
   ve(I, {
    origin: "job",
    jobId: W
   })
  } else {
   let W = c2(I);
   ve(I, W ?? void 0)
  }
 }
 let _ = new Map,
  b = new Map,
  w = new Map,
  x = !1,
  R = 0,
  T = ({
   sessionKey: y,
   displayName: I,
   preempt: j,
   preemptBoundary: W
  }) => {
   pt("[session-manager] wake", {
    sessionKey: y,
    preempt: j ?? "allow",
    preemptBoundary: W ?? "default"
   }), I && b.set(y, I), Ne(y, {
    preempt: j,
    preemptBoundary: W
   })
  },
  P = () => {
   wn()
  },
  E = ({
   sessionKey: y,
   reason: I
  }) => {
   let j = _.get(y);
   if (!j) return;
   let W = j.streamingAdapter !== null;
   j.streamingAdapter = null;
   let Y = !1;
   j.streamingState && !j.streamingState.closed && (j.streamingState.needsRecreation = !0, Y = !0), (W || Y) && ee("[session-manager] streamingAdapter torn down for session", {
    sessionKey: y,
    reason: I,
    hadAdapter: W,
    stateMarked: Y
   })
  };

 function O(y) {
  y.query?.interrupt()
   .catch(() => {})
 }

 function A(y) {
  if (y.query) {
   O(y);
   return
  }
  y.currentAbortController?.abort()
 }

 function D(y, I, j) {
  if (y.query) {
   if (j === "tool_result" && y.activeToolUseIds.size > 0) return y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_result", "defer_tool_result";
   let W = y.streamingState?.currentTurn;
   return W && !W.accepted ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "accept", "defer_accept") : (O(y), y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate")
  }
  return !y.currentAbortController || y.currentAbortController.signal.aborted ? "noop" : j === "tool_result" ? y.activeToolUseIds.size > 0 ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_result", "defer_tool_result") : (y.currentAbortController.abort(), y.currentAbortController = null, y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate") : j === "tool_use" ? y.isStreaming ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_use", "defer_tool_use") : (y.currentAbortController.abort(), y.currentAbortController = null, y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate") : I === "soft" && y.isStreaming ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_use", "defer_tool_use") : I === "soft" && y.activeToolUseIds.size > 0 ? (y.pendingPreempt = !0, y.pendingPreemptBoundary = "tool_result", "defer_tool_result") : (y.currentAbortController.abort(), y.currentAbortController = null, y.pendingPreempt = !1, y.pendingPreemptBoundary = null, "immediate")
 }

 function H(y) {
  return JSON.stringify({
   cwd: y.cwd,
   settingSources: y.settingSources ?? [],
   persistSession: y.persistSession,
   permissionMode: y.permissionMode,
   allowedTools: y.allowedTools ?? [],
   disallowedTools: y.disallowedTools ?? [],
   additionalDirectories: y.additionalDirectories ?? [],
   autoloadAdditionalDirectoryClaudeMd: y.autoloadAdditionalDirectoryClaudeMd
  })
 }
 async function K(y) {
  let I = y.streamingState;
  if (!I) return;
  let j = y.query;
  y.streamingState = null, y.query = null, y.streamAbortController = null, I.abortController.signal.aborted || I.abortController.abort(), typeof j?.close == "function" && j.close();
  try {
   await I.loopPromise
  } catch {}
 }
 async function te(y, I) {
  let j = I,
   W = String(j.task_id ?? "unknown"),
   Y = String(j.status ?? "completed"),
   q = String(j.summary ?? ""),
   F = String(j.output_file ?? ""),
   J = [Y === "failed" ? "Background agent task failed." : Y === "stopped" ? "Background agent task was stopped." : "Background agent task completed.", `Task ID: ${W}`, `Status: ${Y}`, q ? `Summary: ${q}` : "", F ? `Output file: ${F}` : ""].filter(Boolean)
   .join(`
`),
   Le = await wl(t, n, {
    traceId: `task-notify-${W}`,
    routeId: "task_notification",
    sourceName: "sdk_subagent",
    targetSessionKey: y,
    sourceSessionKey: y,
    eventType: "notify",
    payload: {
     notify_content: J,
     text: J,
     notify_source_kind: "job",
     notify_source_session_key: y,
     notify_job_schedule_type: "one-shot",
     task_id: W,
     task_status: Y
    }
   });
  return Ue("[session-manager] orphaned task_notification routed as notify", {
   sessionKey: y,
   taskId: W,
   status: Y
  }), {
   eventId: Le.success ? Le.eventId : void 0,
   inboxPath: Le.success ? Le.mailboxPath : void 0,
   notifyContent: J
  }
 }
 async function z(y, I) {
  if (!s.createStreamingQuery) throw new Error("Streaming query support unavailable");
  let j = H(I),
   W = I.sessionId;
  if (y.streamingState && !y.streamingState.closed && !y.streamingState.needsRecreation && y.streamingState.configSignature === j && (y.streamingState.hasAcceptedTurn || y.streamingState.initialSessionId === W)) return y.streamingState;
  await K(y);
  let Y = new II,
   q = new AbortController,
   F = I.mcpServersFactory ? I.mcpServersFactory() : I.mcpServers,
   B = {
    queue: Y,
    abortController: q,
    configSignature: j,
    initialSessionId: W,
    hasAcceptedTurn: !1,
    needsRecreation: !1,
    closed: !1,
    currentTurn: null,
    loopPromise: Promise.resolve(),
    orphanExecuting: null
   },
   J = G => {
    for (let V of Y.drain()) V.reject(G())
   };
  async function* Le() {
   for (; !q.signal.aborted;) {
    let G;
    try {
     G = await Y.dequeue(q.signal)
    } catch (ge) {
     if (ge instanceof Error && ge.name === "AbortError") return;
     throw ge
    }
    B.currentTurn !== null && B.currentTurn !== G && B.currentTurn.accepted || (B.currentTurn = G, G.accepted = !1, G.streamedText = "", G.turnStreamedText = "", G.toolUseMap.clear());
    for await (let ge of G.input.prompt) yield ge
   }
  }
  let Dn = I.sessionId,
   {
    query: Ye
   } = s.createStreamingQuery({
    prompt: Le(),
    abortController: q,
    sessionId: Dn,
    cwd: I.cwd,
    settingSources: I.settingSources,
    persistSession: I.persistSession,
    permissionMode: I.permissionMode,
    allowedTools: I.allowedTools,
    disallowedTools: I.disallowedTools,
    mcpServers: F,
    additionalDirectories: I.additionalDirectories,
    autoloadAdditionalDirectoryClaudeMd: I.autoloadAdditionalDirectoryClaudeMd,
    systemPrompt: I.systemPrompt,
    hooks: {
     PreToolUse: [{
      matcher: "Bash",
      hooks: [async G => G.tool_input?.run_in_background ? {
       decision: "block",
       reason: "Bash run_in_background has unreliable completion callbacks — only the first concurrent task receives its notification. Use Agent tool with run_in_background=true instead: wrap your bash command in an Agent and it will reliably notify when done.",
       hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Bash run_in_background has unreliable completion callbacks. Use Agent tool with run_in_background=true instead."
       }
      } : {}]
     }, {
      matcher: f_,
      hooks: [async () => {
       let G = B.currentTurn ?? (B.orphanExecuting && B.orphanExecuting !== "foreign" ? B.orphanExecuting.turn : null);
       return G && (G.skipCalled = !0), {}
      }]
     }],
     PostToolUse: [{
      matcher: "*",
      hooks: [async () => {
       let G = [],
        V = y.pendingSteer;
       if (V && (y.pendingSteer = null, !V.settled)) {
        V.settled = !0;
        try {
         await lr(t, y.sessionKey, V.eventIds)
        } catch (pe) {
         ee("[session-manager] steer hook markDone error", {
          sessionKey: y.sessionKey,
          error: String(pe)
         })
        }
        for (let pe of V.claimedEventIds) y.inflightEventIds.delete(pe);
        ee("[session-manager] steer hook: injected interjection mid-turn", {
         sessionKey: y.sessionKey,
         eventIds: V.eventIds
        }), G.push(V.steerText)
       }
       let ge = y.pendingNotifySteer;
       if (ge && !ge.settled && B.currentTurn === ge.spawningTurn) {
        y.pendingNotifySteer = null, ge.settled = !0;
        try {
         await HX(ge.inboxPaths), await lr(t, y.sessionKey, ge.eventIds)
        } catch (pe) {
         ee("[session-manager] notify-steer hook clear error", {
          sessionKey: y.sessionKey,
          error: String(pe)
         })
        }
        ee("[session-manager] notify-steer hook: surfaced background callback", {
         sessionKey: y.sessionKey,
         eventIds: ge.eventIds
        }), G.push(ge.notifyText)
       }
       return G.length === 0 ? {} : {
        hookSpecificOutput: {
         hookEventName: "PostToolUse",
         additionalContext: G.join(`

`)
        }
       }
      }]
     }]
    }
   });
  if (y.query = Ye, y.streamAbortController = q, y.streamingState = B, typeof Ye.setModel == "function") {
   let G = (await Mt(t, y.sessionKey)
     .catch(() => null))
    ?.model;
   if (G && !q.signal.aborted) try {
    await Ye.setModel(G)
   } catch (V) {
    fe("[session-manager] failed to re-apply session model override — clearing it", {
      sessionKey: y.sessionKey,
      model: G,
      error: V instanceof Error ? V.message : String(V)
     }), await It(t, y.sessionKey, {
      model: null,
      model_runtime: null
     })
     .catch(() => {})
   }
  }
  let xn = G => {
    typeof Ye.interrupt == "function" && (ee("[session-manager] Skip called — interrupting turn at tool_result boundary", {
      sessionKey: y.sessionKey,
      context: G
     }), Promise.resolve(Ye.interrupt())
     .catch(V => {
      fe("[session-manager] skip interrupt failed", {
       sessionKey: y.sessionKey,
       context: G,
       error: V instanceof Error ? V.message : String(V)
      })
     }))
   },
   it = (G, V) => {
    if (!G) return;
    let ge = nR({
     protocol: G.protocol,
     input_tokens: G.input_tokens ?? 0,
     cache_read_input_tokens: G.cache_read_input_tokens ?? 0,
     cache_creation_input_tokens: G.cache_creation_input_tokens ?? 0
    });
    return {
     elapsed_ms: V,
     total_input_tokens: G.input_tokens === void 0 ? void 0 : ge.totalInput,
     cache_hit_rate: rR(ge),
     output_tokens: G.output_tokens,
     total_cost_usd: G.total_cost_usd,
     model: G.model,
     context_used_tokens: G.context_used_tokens,
     protocol: G.protocol
    }
   },
   ot = async (G, V, ge, pe, X) => {
    let De = y.pendingAdmittedBatches.indexOf(G);
    De >= 0 && y.pendingAdmittedBatches.splice(De, 1);
    let se = typeof V.result == "string" && V.result.trim() ? V.result : void 0;
    try {
     for (let et of G.batch.batchEventIds) y.inflightEventIds.delete(et);
     if (!X && V.subtype === "success" && se) {
      let et = m_(V, {
        prevModelUsage: ge,
        prevTotalCostUsd: pe
       }),
       lt = it(et, Date.now() - G.admittedAt),
       rn = await es(t, y.sessionKey, {
        item: G.batch.anchor.item,
        event: G.batch.anchor.event,
        outputText: se,
        sdkSessionId: y.sdkSessionId,
        batchedEventIds: G.batch.batchEventIds,
        turnMeta: lt
       });
      for (let Yt of rn.records) n.emit("session.output", {
       sessionKey: Yt.session_key,
       record: Yt
      });
      ee("[session-manager] admitted turn result emitted", {
        sessionKey: y.sessionKey,
        anchorEventId: G.batch.anchor.event.id,
        textLen: se.length
       }), await appendDrainRecord(t, {
        id: crypto.randomUUID(),
        session_key: y.sessionKey,
        sdk_session_id: y.sdkSessionId,
        drain_started_at: new Date(G.admittedAt)
         .toISOString(),
        drain_duration_ms: Date.now() - G.admittedAt,
        sdk_duration_ms: Date.now() - G.admittedAt,
        events_processed: G.batch.batchEventIds.length,
        events_skipped: 0,
        tool_calls: 0,
        tool_errors: 0,
        output_chars: se.length,
        cancelled: !1,
        usage: et
       })
       .catch(() => {})
     } else n.emit("session.stream_end", {
      sessionKey: y.sessionKey,
      reason: X ? "skipped" : "interrupted"
     }), ee("[session-manager] admitted turn produced no output", {
      sessionKey: y.sessionKey,
      anchorEventId: G.batch.anchor.event.id,
      skipped: X
     });
     await yde(t, y.sessionKey, G.batch)
    } catch (et) {
     fe("[session-manager] admitted turn settle failed — requeueing to mailbox", {
      sessionKey: y.sessionKey,
      anchorEventId: G.batch.anchor.event.id,
      error: et instanceof Error ? et.message : String(et)
     });
     for (let lt of G.requeueLines) await qo(t, y.sessionKey, lt)
      .catch(rn => {
       fe("[session-manager] settle-failure requeue failed", {
        sessionKey: y.sessionKey,
        error: rn instanceof Error ? rn.message : String(rn)
       })
      });
     y.pendingWake = !0, y.wakeResolver?.()
    }
   }, Lt = (G, V, ge, pe = !1) => {
    if (V && !G.skipCalled) {
     if (pe) {
      G.input.onStream?.(V, !0);
      return
     }
     if (ge) {
      G.streamedText += V, G.turnStreamedText += V, G.input.onStream?.(V, !1);
      return
     }
     if (G.turnStreamedText && V.startsWith(G.turnStreamedText)) {
      let X = V.slice(G.turnStreamedText.length);
      X && (G.streamedText += X, G.turnStreamedText = V, G.input.onStream?.(X, !1));
      return
     }
     if (V.startsWith(G.streamedText)) {
      let X = V.slice(G.streamedText.length);
      X && (G.streamedText = V, G.turnStreamedText += X, G.input.onStream?.(X, !1));
      return
     }
     G.streamedText += V, G.turnStreamedText += V, G.input.onStream?.(V, !1)
    }
   }, Fn = async () => {
    let G = y.pendingSteer;
    if (G && (y.pendingSteer = null, !G.settled)) {
     if (B.closed) {
      G.settled = !0;
      let V = [];
      for (let pe = 0; pe < G.requeueLines.length; pe += 1) {
       let X = G.requeueLines[pe],
        De = G.requeueEventIds[pe];
       try {
        await qo(t, y.sessionKey, X), V.push(De)
       } catch (se) {
        fe("[session-manager] steer fallback closed-stream requeue failed", {
         sessionKey: y.sessionKey,
         eventId: De,
         error: se instanceof Error ? se.message : String(se)
        })
       }
      }
      let ge = [...V, ...G.processedEventIds];
      if (ge.length > 0) try {
       await lr(t, y.sessionKey, ge)
      } catch (pe) {
       ee("[session-manager] steer fallback closed markDone error", {
        sessionKey: y.sessionKey,
        error: String(pe)
       })
      }
      for (let pe of G.claimedEventIds) y.inflightEventIds.delete(pe);
      y.pendingWake = !0, ee("[session-manager] steer fallback requeued to inbox (stream closed)", {
       sessionKey: y.sessionKey,
       eventIds: G.eventIds,
       requeued: V.length,
       requeueFailed: G.requeueLines.length - V.length
      });
      return
     }
     G.settled = !0;
     try {
      await G.enqueueAsNewTurn()
     } catch (V) {
      ee("[session-manager] steer fallback enqueue error", {
       sessionKey: y.sessionKey,
       error: String(V)
      })
     }
    }
   };
  return B.loopPromise = (async () => {
   try {
    for await (let G of Ye) {
     let V = G,
      ge, pe;
     if (V.type === "result") {
      ge = B.lastModelUsage, pe = B.lastTotalCostUsd;
      let De = V.modelUsage;
      De !== void 0 && (B.lastModelUsage = De);
      let se = V.total_cost_usd;
      typeof se == "number" && (B.lastTotalCostUsd = se)
     }
     let X = B.currentTurn;
     if (!X) {
      if (V.type === "system" && V.subtype === "task_notification") {
       await te(y.sessionKey, V);
       continue
      }
      if (V.type === "system" && V.subtype === "init") {
       let De = y.pendingAdmittedBatches.find(se => !se.started);
       De ? (De.started = !0, B.orphanExecuting = De) : B.orphanExecuting = "foreign";
       continue
      }
      if (V.type === "user") {
       let De = B.orphanExecuting;
       De && De !== "foreign" && De.turn.skipCalled && !De.turn.interruptRequested && (De.turn.interruptRequested = !0, xn("admitted-turn skip"));
       continue
      }
      if (V.type === "result") {
       let De = B.orphanExecuting;
       if (B.orphanExecuting = null, ee("[session-manager] orphan result received", {
         sessionKey: y.sessionKey,
         subtype: V.subtype,
         executing: De === "foreign" ? "foreign" : De ? "admitted" : "unknown",
         pendingAdmitted: y.pendingAdmittedBatches.length
        }), De === "foreign") continue;
       let se = De ?? y.pendingAdmittedBatches[0];
       se ? await ot(se, V, ge, pe, se.turn.skipCalled) : (y.pendingWake = !0, y.wakeResolver?.());
       continue
      }
      continue
     }
     if (V.type === "system") {
      if (V.subtype === "task_notification") {
       let se = await te(y.sessionKey, V);
       if (X.accepted && se.eventId && se.inboxPath) {
        let et = `<background-task-notification>
${se.notifyContent}
</background-task-notification>`,
         lt = y.pendingNotifySteer;
        lt && !lt.settled && lt.spawningTurn === X ? (lt.notifyText = `${lt.notifyText}
${et}`, lt.eventIds.push(se.eventId), lt.inboxPaths.push(se.inboxPath)) : y.pendingNotifySteer = {
         notifyText: et,
         eventIds: [se.eventId],
         inboxPaths: [se.inboxPath],
         spawningTurn: X,
         settled: !1
        }
       }
      }
      if (V.subtype === "init") {
       B.hasAcceptedTurn = !0, X.accepted = !0;
       try {
        X.input.onTurnAcknowledged?.()
       } catch {}
       X.sessionId = V.session_id ?? X.sessionId, y.sdkSessionId = V.session_id ?? y.sdkSessionId, y.sdkSessionIdVerified = !0, Dn && V.session_id && Dn !== V.session_id && fe("[session-manager] SDK session ID mismatch — context lost", {
        sessionKey: y.sessionKey,
        requestedSessionId: Dn,
        actualSessionId: V.session_id
       }), V.session_id && y.jobStateless !== !0 && await It(t, y.sessionKey, {
        sdk_session_id: V.session_id
       }), y.pendingPreempt && y.pendingPreemptBoundary === "accept" && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, O(y))
      }
      let De;
      V.subtype === "init" ? De = {
       session_id: V.session_id
      } : V.subtype === "compact_boundary" && V.compact_metadata && (De = {
       trigger: V.compact_metadata.trigger,
       pre_tokens: V.compact_metadata.pre_tokens,
       post_tokens: V.compact_metadata.post_tokens
      }), X.input.onExecutionEvent?.({
       type: "system",
       subtype: V.subtype ?? "unknown",
       data: De
      });
      continue
     }
     if (V.type === "stream_event") {
      let De = Vp(V);
      for (let lt of qT(V.event)) Lt(X, lt.text, lt.isDelta, De);
      for (let lt of BT(V.event)) X.input.onExecutionEvent?.({
       type: "thought_chunk",
       text: lt
      });
      let se = HT(V.event);
      se && (X.toolBlockIndexMap.set(se.index, {
       toolUseId: se.toolUseId,
       toolName: se.toolName
      }), X.toolUseMap.set(se.toolUseId, se.toolName), X.input.onExecutionEvent?.({
       type: "tool_use",
       toolUseId: se.toolUseId,
       toolName: se.toolName,
       input: void 0,
       ephemeral: !0
      }));
      let et = VT(V.event);
      if (et) {
       let lt = X.toolBlockIndexMap.get(et.index);
       lt && X.input.onExecutionEvent?.({
        type: "tool_input_delta",
        toolUseId: lt.toolUseId,
        toolName: lt.toolName,
        partialJson: et.partialJson
       })
      }
      continue
     }
     if (typeof V.type == "string" && V.type.includes("assistant")) {
      let De = Vp(V);
      for (let et of UT(V)) Lt(X, et.text, et.isDelta, De);
      let se = V.message?.content;
      if (Array.isArray(se))
       for (let et of se) {
        if (!et || typeof et != "object" || et.type !== "tool_use") continue;
        let lt = et.id,
         rn = et.name;
        !lt || !rn || (X.toolUseMap.set(lt, rn), X.input.onExecutionEvent?.({
         type: "tool_use",
         toolUseId: lt,
         toolName: rn,
         input: et.input
        }))
       }
      continue
     }
     if (V.type === "user") {
      let De = V.message?.content,
       se = !1;
      if (Array.isArray(De))
       for (let et of De) {
        if (!et || typeof et != "object" || et.type !== "tool_result") continue;
        se = !0;
        let lt = et.tool_use_id;
        lt && (X.input.onExecutionEvent?.({
         type: "tool_result",
         toolUseId: lt,
         toolName: X.toolUseMap.get(lt),
         isError: et.is_error ?? !1,
         summary: ZT(et.content)
        }), X.turnStreamedText = "")
       }
      se && X.skipCalled && !X.interruptRequested && (X.interruptRequested = !0, xn("anchor-turn skip"));
      continue
     }
     if (V.type === "result") {
      if (!X.accepted && B.orphanExecuting && B.orphanExecuting !== "foreign") {
       let De = B.orphanExecuting;
       B.orphanExecuting = null, await ot(De, V, ge, pe, De.turn.skipCalled);
       continue
      }
      if (X.admittedEntry) {
       let De = X.admittedEntry;
       X.admittedEntry = void 0, await Fn(), B.currentTurn = null, await ot(De, V, ge, pe, X.skipCalled), X.resolve({
        sessionId: X.sessionId ?? y.sdkSessionId,
        text: void 0,
        skipped: X.skipCalled || void 0
       });
       continue
      }
      if (V.subtype === "success") {
       if (typeof V.result == "string" && (X.text = V.result), V.structured_output !== void 0 && (X.structured = V.structured_output), X.usage = m_(V, {
         prevModelUsage: ge,
         prevTotalCostUsd: pe
        }), X.usage && !X.skipCalled && typeof Ye.getContextUsage == "function") try {
        let se = (await Ye.getContextUsage())
         ?.totalTokens;
        typeof se == "number" && Number.isFinite(se) && se >= 0 && (X.usage.context_used_tokens = se)
       } catch {}
       if (await Fn(), B.currentTurn = null, X.skipCalled) X.resolve({
        sessionId: X.sessionId ?? y.sdkSessionId,
        text: void 0,
        skipped: !0,
        usage: X.usage
       });
       else {
        let De = X.text ?? (X.streamedText ? X.streamedText : void 0);
        X.resolve({
         sessionId: X.sessionId ?? y.sdkSessionId,
         text: De,
         structured: X.structured,
         usage: X.usage
        })
       }
       continue
      }
      if (V.subtype === "error_during_execution" && X.skipCalled) {
       await Fn(), B.currentTurn = null, X.resolve({
        sessionId: X.sessionId ?? y.sdkSessionId,
        text: void 0,
        skipped: !0,
        usage: X.usage
       });
       continue
      }
      X.accepted && n.emit("session.stream_end", {
       sessionKey: y.sessionKey,
       reason: "interrupted"
      }), await Fn(), B.currentTurn = null, V.subtype === "error_during_execution" ? X.accepted ? X.reject(new AgentSdkTurnInterruptedError) : y.pendingClear ? (B.needsRecreation = !0, X.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance"))) : (B.needsRecreation = !0, Dn && !y.sdkSessionIdVerified && (y.sdkSessionId = void 0, y.pendingWake = !0, await Is(t, y.sessionKey, "sdk_session_id")
       .catch(() => {}), fe("[session-manager] cleared stale sdk_session_id after resume failure", {
        sessionKey: y.sessionKey,
        staleSessionId: Dn
       })), X.reject(new AgentSdkPromptNotAcceptedAbortError)) : X.reject(new Error(`Unexpected streaming SDK result subtype: ${V.subtype??"unknown"}`))
     }
    }
   } catch (G) {
    let V = B.currentTurn;
    B.currentTurn = null, V && (V.accepted && n.emit("session.stream_end", {
     sessionKey: y.sessionKey,
     reason: "interrupted"
    }), q.signal.aborted && !V.accepted ? (B.needsRecreation = !0, y.pendingClear ? V.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : V.reject(new AgentSdkPromptNotAcceptedAbortError)) : q.signal.aborted ? V.reject(Zp("Streaming SDK run aborted", G)) : (V.accepted || (B.needsRecreation = !0), V.reject(G))), J(() => new AgentSdkPromptNotAcceptedAbortError)
   } finally {
    B.closed = !0, B.needsRecreation = !0;
    let G = B.currentTurn;
    if (B.currentTurn = null, G && (q.signal.aborted && !G.accepted ? y.pendingClear ? G.reject(new AgentSdkTurnInterruptedError("SDK turn cancelled before prompt acceptance")) : G.reject(new AgentSdkPromptNotAcceptedAbortError) : q.signal.aborted ? (G.accepted && n.emit("session.stream_end", {
      sessionKey: y.sessionKey,
      reason: "interrupted"
     }), G.reject(Zp("Streaming SDK run aborted"))) : G.accepted ? (n.emit("session.stream_end", {
      sessionKey: y.sessionKey,
      reason: "interrupted"
     }), G.reject(new AgentSdkTurnInterruptedError("Streaming SDK query ended during execution"))) : G.reject(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"))), J(() => new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted")), y.pendingAdmittedBatches.length > 0) {
     let V = y.pendingAdmittedBatches.splice(0);
     B.orphanExecuting = null;
     for (let ge of V) {
      for (let pe of ge.batch.batchEventIds) y.inflightEventIds.delete(pe);
      for (let pe of ge.requeueLines) try {
       await qo(t, y.sessionKey, pe)
      } catch (X) {
       fe("[session-manager] failed to requeue admitted batch item", {
        sessionKey: y.sessionKey,
        anchorEventId: ge.batch.anchor.event.id,
        error: X instanceof Error ? X.message : String(X)
       })
      }
      ee("[session-manager] requeued admitted batch after streaming teardown", {
       sessionKey: y.sessionKey,
       anchorEventId: ge.batch.anchor.event.id,
       items: ge.requeueLines.length
      })
     }
     y.pendingWake = !0, y.wakeResolver?.()
    }
    y.pendingSteer && (await Fn(), y.wakeResolver?.()), y.streamingState === B && (y.streamingState = null), y.query === Ye && (y.query = null), y.streamAbortController === q && (y.streamAbortController = null)
   }
  })(), B
 }

 function xe(y) {
  return y.runtime === "codex" && y.codexAdapter ? y.codexAdapter : y.origin !== "channel" || !s.createStreamingQuery ? s : (y.streamingAdapter || (y.streamingAdapter = {
   run: async I => {
    let j = await z(y, I);
    return await new Promise((W, Y) => {
     if (j.closed) {
      Y(new AgentSdkPromptNotAcceptedAbortError("Streaming SDK query ended before the prompt was accepted"));
      return
     }
     j.queue.enqueue({
      input: I,
      resolve: W,
      reject: Y,
      accepted: !1,
      sessionId: I.sessionId,
      text: void 0,
      structured: void 0,
      usage: void 0,
      streamedText: "",
      turnStreamedText: "",
      toolUseMap: new Map,
      toolBlockIndexMap: new Map,
      skipCalled: !1,
      interruptRequested: !1
     })
    })
   },
   createStreamingQuery: s.createStreamingQuery,
   undo: s.undo ? s.undo.bind(s) : void 0
  }), y.streamingAdapter)
 }

 function Ne(y, I) {
  if (!x) {
   pt("[session-manager] wake ignored, manager not running", {
    sessionKey: y
   });
   return
  }
  if (Ni(y)) {
   pt("[session-manager] wake suppressed, session is being archived", {
    sessionKey: y
   });
   return
  }
  let j = I?.preempt ?? "allow",
   W = I?.preemptBoundary,
   Y = _.get(y);
  if (Y && Y.wakeResolver) {
   pt("[session-manager] wake delivered to idle actor", {
    sessionKey: y,
    actorRunId: Y.actorRunId,
    status: Y.status,
    preemptBoundary: W ?? "default"
   }), Y.wakeResolver(), Y.wakeResolver = null;
   return
  }
  if (Y && Y.drainPromise && (Y.status === "active" || Y.status === "idle")) {
   let B = !!Y.query && Y.streamingState?.currentTurn?.accepted === !0,
    J = Y.runtime === "codex" && !!Y.codexAdapter?.activeTurnId?.();
   if (j === "allow" && (B || J) && Y.admissionCallback && !Y.admissionInProgress) {
    Y.pendingWake = !0, Y.admissionInProgress = !0;
    let Le = Y.admissionCallback;
    pt("[session-manager] wake: admitting to live streaming session", {
      sessionKey: y,
      actorRunId: Y.actorRunId
     }), Le()
     .then(() => {
      Y.admissionInProgress = !1
     }, () => {
      Y.admissionInProgress = !1
     });
    return
   }
   if (Y.status === "active" && Y.currentAbortController)
    if (j === "force") {
     let Le = D(Y, "immediate", W);
     Le === "immediate" ? pt("[session-manager] wake: forced preempt", {
      sessionKey: y,
      actorRunId: Y.actorRunId,
      preemptBoundary: W ?? "default"
     }) : Le === "defer_accept" ? pt("[session-manager] wake: forced preempt deferred until prompt acceptance", {
      sessionKey: y,
      actorRunId: Y.actorRunId
     }) : Le === "defer_tool_result" ? pt("[session-manager] wake: forced preempt deferred until tool_result", {
      sessionKey: y,
      actorRunId: Y.actorRunId
     }) : Le === "defer_tool_use" && pt("[session-manager] wake: forced preempt deferred until tool_use", {
      sessionKey: y,
      actorRunId: Y.actorRunId
     })
    } else if (j === "allow") {
    let Le = D(Y, "soft", W);
    Le === "defer_accept" ? pt("[session-manager] wake: soft preempt deferred until prompt acceptance", {
     sessionKey: y,
     actorRunId: Y.actorRunId
    }) : Le === "defer_tool_use" ? pt("[session-manager] wake: soft preempt pending (streaming)", {
     sessionKey: y,
     actorRunId: Y.actorRunId
    }) : Le === "defer_tool_result" ? pt("[session-manager] wake: soft preempt deferred until tool_result", {
     sessionKey: y,
     actorRunId: Y.actorRunId
    }) : Le === "immediate" && pt("[session-manager] wake: hard preempt (not streaming)", {
     sessionKey: y,
     actorRunId: Y.actorRunId
    })
   } else pt("[session-manager] wake: preempt disabled, queueing only", {
    sessionKey: y,
    actorRunId: Y.actorRunId
   });
   Y.pendingWake = !0, pt("[session-manager] wake marked pending", {
    sessionKey: y,
    actorRunId: Y.actorRunId,
    status: Y.status
   });
   return
  }
  let q = v(y, Y?.origin);
  if (q.activeCount >= q.maxConcurrent) {
   let B = q.wakeQueue.includes(y);
   B || q.wakeQueue.push(y), pt("[session-manager] wake queued", {
    sessionKey: y,
    pool: q.name,
    activeCount: q.activeCount,
    maxConcurrent: q.maxConcurrent,
    alreadyQueued: B,
    queuedSessions: q.wakeQueue.length
   });
   return
  }
  let F = c2(y);
  F ? (pt("[session-manager] wake starting actor with inferred origin", {
   sessionKey: y,
   ...F
  }), ve(y, F)) : (pt("[session-manager] wake starting actor", {
   sessionKey: y
  }), ve(y))
 }

 function ve(y, I) {
  let j = _.get(y),
   W = j?.attachedChannels ?? new Set,
   Y = ++R,
   q = {
    sessionKey: y,
    actorRunId: Y,
    sdkSessionId: j?.sdkSessionId,
    sdkSessionIdVerified: j?.sdkSessionIdVerified ?? !1,
    status: "active",
    currentAbortController: null,
    query: null,
    streamAbortController: null,
    streamingState: null,
    streamingAdapter: j?.streamingAdapter ?? null,
    drainPromise: null,
    wakeResolver: null,
    pendingWake: !1,
    isStreaming: !1,
    activeToolUseIds: new Set,
    pendingPreempt: !1,
    pendingPreemptBoundary: null,
    pendingClear: !1,
    attachedChannels: W,
    origin: I?.origin ?? j?.origin ?? "channel",
    jobId: I?.jobId ?? j?.jobId,
    jobStateless: j?.jobStateless ?? !1,
    holdsPoolSlot: !1,
    pendingAdmittedBatches: [],
    inflightEventIds: new Set,
    admissionInProgress: !1,
    pendingSteer: null,
    pendingNotifySteer: null,
    admissionCallback: null,
    idleSince: void 0,
    notifyCalledDuringDrain: !1,
    runtime: I?.runtime ?? j?.runtime ?? "claude",
    codexAdapter: j?.codexAdapter ?? null,
    consecutiveConservativeRedrive: j?.consecutiveConservativeRedrive ?? !1
   };
  _.set(y, q);
  let F = v(y, q.origin);
  F.activeCount++, q.holdsPoolSlot = !0;
  let B = b.get(y);
  if (B && b.delete(y), gk(t, {
    session_key: y,
    display_name: B,
    kind: q.origin === "job" ? "job" : q.origin === "system" ? "system" : y.startsWith("meta:") ? "meta" : "channel"
   })
   .catch(() => {}), ee("[session-manager] actor start", {
    sessionKey: y,
    actorRunId: Y,
    sdkSessionId: q.sdkSessionId,
    origin: q.origin,
    jobId: q.jobId,
    pool: F.name,
    activeCount: F.activeCount,
    attachedChannels: q.attachedChannels.size,
    queuedSessions: F.wakeQueue.length
   }), I?.preStart) {
   let J = I.preStart;
   q.drainPromise = J()
    .catch(Le => Xe("[session-manager] preStart failed", Le))
    .then(() => Tt(q))
  } else q.drainPromise = Tt(q)
 }
 async function Tt(y) {
  let {
   sessionKey: I
  } = y, j, W, Y = 0, q = 0, F = !1, B = [], J = 0, Le = !1, Dn = !1, Ye = null, xn;
  try {
   xn = await _e(I)
  } catch (it) {
   fe("[session-manager] drain-start inbox snapshot read failed — empty snapshot (everything fresh)", {
    sessionKey: I,
    error: it instanceof Error ? it.message : String(it)
   }), xn = new Set
  }
  pt("[session-manager] drain loop begin", {
   sessionKey: I,
   actorRunId: y.actorRunId,
   origin: y.origin,
   jobId: y.jobId
  });
  try {
   if (!y.sdkSessionId && !y.pendingClear) {
    let ge = await Mt(t, I);
    ge?.sdk_session_id && (y.sdkSessionId = ge.sdk_session_id, ee("[session-manager] loaded sdk_session_id from state.json", {
     sessionKey: I,
     sdkSessionId: ge.sdk_session_id
    }))
   }
   if ((await Mt(t, I))
    ?.session_key || await It(t, I, {
     session_key: I
    }), y.origin === "job" && !y.jobId) {
    await ae.init();
    let pe = (await ae.listJobs())
     .find(X => X.session_key === I);
    pe ? (y.jobId = pe.id, Ue("[session-manager] recovered jobId from active jobs", {
     sessionKey: I,
     jobId: pe.id
    })) : fe("[session-manager] job-origin actor has no matching active job", {
     sessionKey: I
    })
   }
   let it = !1,
    ot, Lt = !1,
    Fn, G = null,
    V = !1;
   if (y.jobStateless = !1, y.origin === "job" && y.jobId) {
    let ge = await ae.getJob(y.jobId);
    if (G = ge, Ye = ge?.state.last_scheduled_at ?? null, ge?.execution_cwd && (await eQ({
      cwdRel: ge.execution_context === "workspace" ? ge.frontmatter.cwd_rel ?? null : null,
      cwd: ge.execution_cwd,
      runtimeWorkspaceDir: ge.runtime_workspace_dir,
      context: ge.execution_context
     }), await ye(ge.execution_cwd), await It(t, I, {
      session_key: I,
      cwd: ge.execution_cwd,
      plane: "work",
      permission_profile: "work_default"
     })), ge) {
     it = !!ge.frontmatter.owner_session?.startsWith("job:"), ot = a2(ge.frontmatter.cron);
     let pe = ge.frontmatter.stateless === !0;
     if (pe && ge.frontmatter.cron === "keepalive") throw new Error(Vq);
     Lt = pe, y.jobStateless = Lt, Fn = ge.frontmatter.model;
     let X = ge.frontmatter.runtime ?? void 0,
      De = X ?? tl(),
      se = X ? "explicit" : "default";
     if (De === "codex") {
      let et = await l();
      et.ok ? y.runtime = "codex" : (y.runtime = "claude", fe("[session-manager] job requested codex but codex is unavailable; falling back to claude", {
       sessionKey: I,
       jobId: y.jobId,
       runtime_source: se,
       reason: et.reason
      }))
     } else y.runtime = "claude"
    }
   } else if (y.origin === "channel") {
    let pe = (await Mt(t, I))
     ?.source_channel_id;
    if (pe) {
     let X = await Ps(t, pe)
      .catch(() => null),
      De = X?.channel_kind,
      se = De ? await Ec(t.channelConfigDir, De)
      .catch(() => null) : null,
      lt = X?.runtime ?? se?.runtime ?? void 0 ?? tl(),
      rn = X?.runtime ? "explicit" : se?.runtime ? "inherited" : "default";
     if (lt === "codex") {
      let Yt = await l();
      Yt.ok ? y.runtime = "codex" : (y.runtime = "claude", fe("[session-manager] channel requested codex but codex is unavailable; falling back to claude", {
       sessionKey: I,
       sourceChannelId: pe,
       runtime_source: rn,
       reason: Yt.reason
      }))
     } else y.runtime = "claude"
    }
   }
   for (; y.status !== "ended" && x;) {
    y.pendingClear && (y.sdkSessionId = void 0, y.pendingClear = !1, await It(t, I, {
      sdk_session_id: null,
      pending_fork_to: null,
      pending_undo: null
     })
     .catch(() => {}));
    let ge, pe = null;
    y.origin === "job" && y.jobId && (V ? pe = await ae.getJob(y.jobId)
     .catch(() => null) : (V = !0, pe = G, G = null));
    let {
     instructions: X,
     missionContent: De
    } = await QXe(t, I, y, pe), se = await Mt(t, I), et = await runInstructionsFingerprintGuard(t, I, X, y.runtime, {
     instructions_fingerprint: se?.instructions_fingerprint,
     mission_fingerprint: se?.mission_fingerprint,
     schema_version: se?.schema_version,
     sdk_session_id: se?.sdk_session_id
    }, y.origin === "job" && y.jobId ? {
     jobId: y.jobId
    } : void 0);
    et.clearedSdkSessionId && (y.sdkSessionId = void 0), et.gate2Fired && y.runtime === "claude" && n.emit("session.streaming_invalidated", {
     sessionKey: I,
     reason: "instructions_drift"
    }), y.origin === "job" && y.jobId && (De !== void 0 ? ge = {
     content: De,
     jobId: y.jobId,
     cron: pe?.frontmatter.cron ?? "",
     stateless: Lt,
     model: pe?.frontmatter.model ?? Fn
    } : fe("[session-manager] job snapshot unavailable at drain start", {
     sessionKey: I,
     jobId: y.jobId
    })), y.status = "active", y.idleSince = void 0;
    let lt = new Set,
     rn = Date.now(),
     Yt = new AbortController;
    y.currentAbortController = Yt;
    let tt;
    try {
     let mn = !it,
      We = [...mn ? [upe] : [], mpe, Tpe];
     y.origin === "channel" && (We.push(gpe), We.push(f_));
     let je = y.origin === "job" ? "job" : y.origin === "system" ? "system" : "foreground",
      Vt = 0,
      Hi = KXe();
     if (y.admissionCallback = async () => {
       try {
        await YS(t, I);
        let rt = await Rg(t, I);
        if (rt.length === 0) return;
        await XS(t, I, rt);
        let Zt = {},
         ei = await batchDrainItems(t, rt, {
          fallbackBatchSize: 5,
          mergeWindowMs: 180 * 1e3,
          perf: Zt
         }),
         Jn = await Mt(t, I),
         Ma = PU(t, I, Jn ?? void 0),
         tr = [],
         Un = [];
        for (let zt of ei.items) {
         if (!zt.eventId) continue;
         if (y.inflightEventIds.has(zt.eventId)) {
          Un.push(zt.eventId);
          continue
         }
         if (await jf(t, zt.eventId)) {
          Un.push(zt.eventId);
          continue
         }
         let mr = ei.events.get(zt.eventId) ?? await readEventByIdSeek(t, zt.eventId);
         mr && tr.push({
          item: zt,
          event: mr,
          prompt: RU(mr, I)
         })
        }
        if (tr.length === 0) {
         Un.length > 0 && await lr(t, I, Un);
         return
        }
        let ht = await EU(t, I, {
          allowedTools: We,
          disallowedTools: Hi,
          additionalDirectories: [t.memoryDir],
          onExecutionEvent: zt => {
           zt.type === "tool_use" && (y.isStreaming = !1, y.activeToolUseIds.add(zt.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_use" && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, A(y))), zt.type === "tool_result" && (y.activeToolUseIds.delete(zt.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_result" && y.activeToolUseIds.size === 0 && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, A(y)));
           let Io = nme(zt);
           Io && n.emit("session.execution", {
            sessionKey: I,
            event: Io
           })
          },
          onStream: (zt, Io) => {
           y.isStreaming = !0, n.emit("session.stream", {
            sessionKey: I,
            chunk: zt,
            isSidechain: Io
           })
          }
         }, tr, Ma, {
          pendingGatewayNotice: Jn?.pending_gateway_notice,
          pendingInterruptedContext: Jn?.pending_interrupted_context,
          pendingSkipRewind: Jn?.pending_skip_rewind,
          lastEventAtWatermark: Jn?.last_event_at,
          timeGapConsumed: !1,
          daemonRestartHint: void 0
         }, Zt, zt => zt),
         lu = [...Un, ...tr.map(zt => zt.item.eventId)
          .filter(zt => !!zt)
         ];
        if (y.runtime === "codex") {
         let zt = y.codexAdapter?.steerActiveTurn,
          Io = !!ht.attachments && ht.attachments.length > 0,
          mr = ht.coalescedPromptText.trim(),
          td = y.codexAdapter?.activeTurnId?.();
         if (!!zt && !!td && !Io && !ht.isNotifyOnly && mr.length > 0 && zt && td) {
          let xm = ht.batchEventIds.filter(du => !y.inflightEventIds.has(du));
          for (let du of xm) y.inflightEventIds.add(du);
          if (await zt(mr, td)
           .catch(() => !1)) {
           await lr(t, I, lu);
           for (let du of xm) y.inflightEventIds.delete(du);
           ee("[session-manager] admission callback: codex turn/steer landed", {
            sessionKey: I,
            admittedItems: tr.length,
            batchEventIds: ht.batchEventIds
           })
          } else {
           for (let du of xm) y.inflightEventIds.delete(du);
           y.pendingWake = !0, ee("[session-manager] admission callback: codex steer fell back to redrain", {
            sessionKey: I,
            batchEventIds: ht.batchEventIds
           })
          }
         } else y.pendingWake = !0, ee("[session-manager] admission callback: codex no live turn, redraining", {
          sessionKey: I,
          admittedItems: tr.length,
          batchEventIds: ht.batchEventIds
         });
         return
        }
        let fv = y.streamingState;
        if (!fv || fv.closed) return;
        let b2 = async () => {
         let zt = Jp(ht.injectionResult.blocks, ht.attachments, {
           runtimeDir: t.runtimeDir
          }),
          Io = ht.isNotifyOnly || ht.anchorChannelConfig?.stream === !1,
          mr = {
           input: {
            prompt: zt,
            sessionId: ht.resumeSessionId,
            cwd: ht.sessionInfo.cwd,
            settingSources: ht.sessionInfo.settingSources,
            persistSession: !0,
            permissionMode: ht.sdkRunConfig.permissionMode,
            allowedTools: ht.sdkRunConfig.allowedTools,
            disallowedTools: ht.sdkRunConfig.disallowedTools,
            additionalDirectories: ht.sdkRunConfig.additionalDirectories,
            systemPrompt: ht.systemPrompt,
            onStream: Io ? void 0 : (nd, xm) => {
             y.isStreaming = !0, n.emit("session.stream", {
              sessionKey: I,
              chunk: nd,
              isSidechain: xm
             })
            },
            onExecutionEvent: ht.handleExecutionEvent
           },
           resolve: () => {},
           reject: () => {},
           accepted: !1,
           sessionId: ht.resumeSessionId,
           text: void 0,
           structured: void 0,
           usage: void 0,
           streamedText: "",
           turnStreamedText: "",
           toolUseMap: new Map,
           toolBlockIndexMap: new Map,
           skipCalled: !1,
           interruptRequested: !1
          },
          td = {
           batch: ht,
           admittedAt: Date.now(),
           turn: mr,
           requeueLines: tr.map(nd => nd.item.line),
           started: !1
          };
         mr.admittedEntry = td, fv.queue.enqueue(mr), await lr(t, I, lu), await Bo(t, I, `admitted=${tr.length} to live streaming session`), y.pendingAdmittedBatches.push(td);
         for (let nd of ht.batchEventIds) y.inflightEventIds.add(nd);
         await gde(t, I, ht.injectionResult), ee("[session-manager] admission callback: prompt enqueued", {
          sessionKey: I,
          admittedItems: tr.length,
          batchEventIds: ht.batchEventIds
         })
        }, w2 = fv.currentTurn, Dme = !!ht.attachments && ht.attachments.length > 0, S2 = ht.coalescedPromptText.trim(), jme = !!w2 && w2.accepted && !Dme && !ht.isNotifyOnly && S2.length > 0;
        if (!y.pendingSteer && jme) {
         let zt = ht.batchEventIds.filter(mr => !y.inflightEventIds.has(mr));
         for (let mr of zt) y.inflightEventIds.add(mr);
         let Io = {
          steerText: S2,
          eventIds: lu,
          claimedEventIds: zt,
          enqueueAsNewTurn: b2,
          requeueLines: tr.map(mr => mr.item.line),
          requeueEventIds: tr.map(mr => mr.item.eventId),
          processedEventIds: Un,
          settled: !1
         };
         y.pendingSteer = Io, ee("[session-manager] admission callback: parked claude steer", {
          sessionKey: I,
          admittedItems: tr.length,
          batchEventIds: ht.batchEventIds
         });
         return
        }
        await b2()
       } catch (rt) {
        ee("[session-manager] admission callback error", {
         sessionKey: I,
         error: String(rt)
        })
       }
      }, y.runtime === "codex" && !y.codexAdapter) {
      let rt = (await Mt(t, I))
       ?.cwd;
      rt && await ensureAgentsMdSymlink(rt)
       .catch(() => {}), y.codexAdapter = c({
        sandbox: resolveCodexSandbox(),
        ephemeral: !1,
        model: Fn,
        dynamicTools: bI({
         paths: t,
         sessionKey: I,
         bus: n,
         sessionContextKind: je,
         notifyDepth: Vt,
         jobScheduleType: ot,
         canManageJobs: mn,
         getSessionStatus: Zt => _.get(Zt)
          ?.status,
         onNotifyCalled: () => {
          y.notifyCalledDuringDrain = !0
         }
        })
       })
     }
     tt = await drainSessionMailbox(t, I, {
      sdk: xe(y),
      bus: n,
      abortController: Yt,
      runtime: y.runtime,
      excludeEventIds: y.runtime === "codex" ? y.inflightEventIds : void 0,
      holdInputOpenForBackgroundAgents: y.runtime === "claude" && y.origin !== "channel",
      jobContext: ge,
      memoryBoard: X.memoryBoard ? {
       path: t.memoryBroadcastPath,
       content: X.memoryBoard
      } : void 0,
      onBatchContext: rt => {
       if (Vt = rt.maxNotifyDepth, rt.eventIds)
        for (let Zt of rt.eventIds) y.inflightEventIds.add(Zt)
      },
      mcpServersFactory: () => ({
       aladuo: vI(t, {
        sessionKey: I,
        bus: n,
        sessionContextKind: je,
        notifyDepth: Vt,
        jobScheduleType: ot,
        canManageJobs: mn,
        getSessionStatus: rt => _.get(rt)
         ?.status,
        onNotifyCalled: () => {
         y.notifyCalledDuringDrain = !0
        }
       })
      }),
      allowedTools: We,
      disallowedTools: Hi,
      additionalDirectories: [t.memoryDir],
      lockHeartbeatIntervalMs: o,
      onSdkTurnStarted: () => {
       Y += 1;
       let rt = !F;
       if (F = Y > q, rt && F && y.origin === "job" && y.jobId) {
        let Zt = y.jobId;
        B.push(ae.updateState(Zt, {
          last_run_started_at: new Date()
           .toISOString()
         }, {
          expectedClaimCursor: Ye
         })
         .catch(ei => {
          fe("[session-manager] last_run_started_at stamp failed (best-effort)", {
           sessionKey: I,
           jobId: Zt,
           error: ei instanceof Error ? ei.message : String(ei)
          })
         }))
       }
      },
      onSdkTurnRejected: () => {
       q += 1;
       let rt = F && Y <= q;
       if (F = Y > q, rt && y.origin === "job" && y.jobId) {
        let Zt = y.jobId;
        B.push(ae.updateState(Zt, {
          last_run_started_at: null
         }, {
          expectedClaimCursor: Ye
         })
         .catch(ei => {
          fe("[session-manager] last_run_started_at rollback failed (best-effort)", {
           sessionKey: I,
           jobId: Zt,
           error: ei instanceof Error ? ei.message : String(ei)
          })
         }))
       }
      },
      onStream: (rt, Zt) => {
       y.isStreaming = !0, n.emit("session.stream", {
        sessionKey: I,
        chunk: rt,
        isSidechain: Zt
       })
      },
      onExecutionEvent: rt => {
       rt.type === "tool_use" && (y.isStreaming = !1, y.activeToolUseIds.add(rt.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_use" && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, A(y))), rt.type === "tool_result" && (y.activeToolUseIds.delete(rt.toolUseId), y.pendingPreempt && y.pendingPreemptBoundary === "tool_result" && y.activeToolUseIds.size === 0 && (y.pendingPreempt = !1, y.pendingPreemptBoundary = null, A(y)));
       let Zt = WXe(rt);
       if (Zt && lt.has(Zt)) return;
       Zt && lt.add(Zt);
       let ei = nme(rt);
       ei && n.emit("session.execution", {
        sessionKey: I,
        event: ei
       })
      }
     })
    } finally {
     y.admissionCallback = null, y.admissionInProgress || y.inflightEventIds.clear(), y.currentAbortController === Yt && (y.currentAbortController = null), y.isStreaming = !1, y.activeToolUseIds.clear(), y.pendingPreempt = !1, y.pendingPreemptBoundary = null
    }
    if (pt("[session-manager] drain result", {
      sessionKey: I,
      actorRunId: y.actorRunId,
      processed: tt.processed,
      skipped: tt.skipped,
      lockAcquired: tt.lockAcquired,
      outboxRecords: tt.outboxRecords?.length ?? (tt.lastOutboxRecord ? 1 : 0),
      durationMs: Date.now() - rn
     }), J += tt.processed, Le = tt.mergeTransientFailure === !0, tt.cancelled && (Dn = !0), tt.processed > 0 && await Is(t, I, "last_error")
     .catch(() => {}), y.pendingClear) y.sdkSessionId = void 0, y.pendingClear = !1, await It(t, I, {
      sdk_session_id: null,
      pending_fork_to: null,
      pending_undo: null
     })
     .catch(() => {}), ee("[session-manager] applied pending clear after drain", {
      sessionKey: I,
      actorRunId: y.actorRunId
     });
    else {
     let mn = await Mt(t, I);
     if (mn?.sdk_session_id) {
      let We = !y.sdkSessionId,
       je = y.sdkSessionId !== mn.sdk_session_id;
      y.sdkSessionId = mn.sdk_session_id, (We || je) && ee("[session-manager] sdk session bound", {
       sessionKey: I,
       actorRunId: y.actorRunId,
       sdkSessionId: y.sdkSessionId,
       isNewSession: We
      })
     }
    }
    if (tt.lastReplyText && (W = tt.lastReplyText), tt.outboxRecords && tt.outboxRecords.length > 0) {
     pt("[session-manager] emitting outbox records", {
      sessionKey: I,
      actorRunId: y.actorRunId,
      count: tt.outboxRecords.length
     });
     for (let mn of tt.outboxRecords) n.emit("session.output", {
      sessionKey: mn.session_key,
      record: mn
     })
    } else tt.lastOutboxRecord ? (pt("[session-manager] emitting single outbox record", {
     sessionKey: I,
     actorRunId: y.actorRunId,
     recordId: tt.lastOutboxRecord.id
    }), n.emit("session.output", {
     sessionKey: I,
     record: tt.lastOutboxRecord
    })) : y.origin === "channel" && tt.processed > 0 && !tt.cancelled && (pt("[session-manager] drain produced no output, emitting stream_end", {
     sessionKey: I,
     actorRunId: y.actorRunId,
     turnSkipped: tt.turnSkipped === !0
    }), n.emit("session.stream_end", {
     sessionKey: y.sessionKey,
     reason: tt.turnSkipped ? "skipped" : "interrupted"
    }));
    if (tt.processed === 0) {
     if (y.origin === "job" || y.origin === "system") {
      pt("[session-manager] job/system session drain complete, exiting", {
       sessionKey: I,
       actorRunId: y.actorRunId,
       origin: y.origin,
       jobId: y.jobId
      });
      break
     }
     if (y.pendingWake) {
      y.pendingWake = !1, pt("[session-manager] pending wake after empty drain, re-draining", {
       sessionKey: I,
       actorRunId: y.actorRunId
      });
      continue
     }
     if (y.status = "idle", y.idleSince = new Date()
      .toISOString(), y.pendingWake) {
      y.pendingWake = !1, pt("[session-manager] pending wake during idle transition, re-draining", {
       sessionKey: I,
       actorRunId: y.actorRunId
      });
      continue
     }
     if (pt("[session-manager] idle", {
       sessionKey: I,
       actorRunId: y.actorRunId,
       attachedChannels: y.attachedChannels.size
      }), y.holdsPoolSlot) {
      let We = v(I, y.origin);
      We.activeCount--, y.holdsPoolSlot = !1, pt("[session-manager] released pool slot (idle)", {
       sessionKey: I,
       pool: We.name,
       activeCount: We.activeCount
      }), S(We)
     }
     let mn = !1;
     for (; y.status === "idle";) {
      if (y.pendingWake) {
       y.pendingWake = !1, mn = !0;
       break
      }
      if (await Ht(y, i) || y.status !== "idle") {
       mn = !0;
       break
      }
      if (y.attachedChannels.size > 0) {
       pt("[session-manager] idle timeout but has attachments, continuing wait", {
        sessionKey: I,
        actorRunId: y.actorRunId,
        attachedChannels: y.attachedChannels.size
       });
       continue
      }
      break
     }
     if (!mn && y.status === "idle") {
      pt("[session-manager] idle timeout, no attachments, exiting", {
       sessionKey: I,
       actorRunId: y.actorRunId
      });
      break
     }
     if (mn && !y.holdsPoolSlot) {
      let We = v(I, y.origin);
      if (We.activeCount >= We.maxConcurrent) {
       We.wakeQueue.includes(I) || We.wakeQueue.unshift(I), pt("[session-manager] woken idle actor re-queued (pool full)", {
        sessionKey: I,
        pool: We.name,
        activeCount: We.activeCount
       }), y.pendingWake = !1;
       continue
      }
      We.activeCount++, y.holdsPoolSlot = !0, pt("[session-manager] re-acquired pool slot (woken)", {
       sessionKey: I,
       pool: We.name,
       activeCount: We.activeCount
      })
     }
    }
   }
  } catch (it) {
   Xe(`[session-manager] error in drain loop for ${I}:`, it), j = it, await It(t, I, {
     last_error: {
      message: it instanceof Error ? it.message : String(it),
      at: new Date()
       .toISOString()
     }
    })
    .catch(() => {})
  } finally {
   if (await K(y), y.currentAbortController = null, y.streamingAdapter = null, y.isStreaming = !1, y.activeToolUseIds.clear(), y.pendingPreempt = !1, y.pendingPreemptBoundary = null, y.codexAdapter) {
    let Lt = y.codexAdapter;
    y.codexAdapter = null, await Promise.resolve(Lt.shutdown())
     .catch(Fn => {
      fe("[session-manager] codex adapter shutdown failed", {
       sessionKey: I,
       error: Fn instanceof Error ? Fn.message : String(Fn)
      })
     })
   }
   let it = v(I, y.origin);
   if (y.holdsPoolSlot && (it.activeCount--, y.holdsPoolSlot = !1), y.origin === "job" && y.jobId) {
    B.length > 0 && await Promise.allSettled(B);
    try {
     await ne(y, {
      runStarted: F,
      cancelled: Dn,
      processedCount: J,
      claimCursor: Ye,
      error: j,
      resultText: W
     })
    } finally {
     y.status = "ended"
    }
   } else y.status = "ended";
   if (y.pendingWake = !1, x && rme(Pr(t, I)) && !Ni(I)) {
    let Lt = await Ze(I, xn);
    Lt === "fresh" ? (y.consecutiveConservativeRedrive = !1, pt("[session-manager] post-finalize wake re-check: fresh inbox arrival — re-entering wake path", {
     sessionKey: I,
     actorRunId: y.actorRunId
    }), Ne(I, {
     preempt: "never"
    })) : Lt === "conservative" || Le ? y.consecutiveConservativeRedrive ? fe("[session-manager] post-finalize conservative re-drive suppressed (cap spent) — parking for external wake", {
     sessionKey: I,
     actorRunId: y.actorRunId
    }) : (y.consecutiveConservativeRedrive = !0, pt("[session-manager] post-finalize wake re-check: conservative re-drive (transient read) — re-entering wake path once", {
     sessionKey: I,
     actorRunId: y.actorRunId
    }), Ne(I, {
     preempt: "never"
    })) : y.consecutiveConservativeRedrive = !1
   }
   ee("[session-manager] actor end", {
    sessionKey: I,
    actorRunId: y.actorRunId,
    sdkSessionId: y.sdkSessionId,
    pool: it.name,
    activeCount: it.activeCount,
    origin: y.origin,
    jobId: y.jobId,
    attachedChannels: y.attachedChannels.size,
    queuedSessions: it.wakeQueue.length
   }), S(it)
  }
 }

 function Ht(y, I) {
  return new Promise(j => {
   let W = null,
    Y = () => {
     W && (clearTimeout(W), W = null), y.wakeResolver = null
    };
   y.wakeResolver = () => {
    Y(), j(!0)
   }, W = setTimeout(() => {
    Y(), j(!1)
   }, I)
  })
 }
 async function _e(y) {
  return new Set(await ZS(kg(t, y)))
 }
 async function Ze(y, I) {
  let j;
  try {
   j = await _e(y)
  } catch (W) {
   return fe("[session-manager] inbox fresh-name read failed at finalize — conservative re-drive (capped)", {
    sessionKey: y,
    error: W instanceof Error ? W.message : String(W)
   }), "conservative"
  }
  for (let W of j)
   if (!I.has(W)) return "fresh";
  return "none"
 }
 let ae = new vo(t);

 function C(y) {
  return y.error ? y.runStarted ? "STARTED_FAILURE" : "NEVER_STARTED_FAILURE" : y.cancelled ? y.runStarted ? "CANCELLED_POST_ACK" : "CANCELLED_PRE_ACK" : !y.runStarted && y.processedCount === 0 ? "ZERO_FED" : "STARTED_SUCCESS"
 }
 async function L(y, I, j, W, Y, q) {
  try {
   let F = await ae.finalizeJobState(y, j, {
    consumeRunAt: W,
    expectedClaimCursor: Y
   });
   return F === Jj ? (ee(`[session-manager] job gone at finalize (${q}) — state frozen`, {
    jobId: y,
    sessionKey: I
   }), {
    kind: "gone"
   }) : F === Gj ? (fe(`[session-manager] stale finalize (${q}) — a fresh claim owns the sidecar; nothing written`, {
    jobId: y,
    sessionKey: I,
    claimCursor: Y
   }), {
    kind: "stale"
   }) : {
    kind: "written",
    runAt: F.run_at
   }
  } catch (F) {
   return Xe(`[session-manager] job state finalize failed (${q})`, F), {
    kind: "failed"
   }
  }
 }
 async function ne(y, I) {
  let j = y.jobId,
   {
    sessionKey: W
   } = y,
   {
    runStarted: Y,
    cancelled: q,
    processedCount: F,
    claimCursor: B,
    error: J,
    resultText: Le
   } = I,
   Dn = C({
    error: J,
    cancelled: q,
    runStarted: Y,
    processedCount: F
   });
  try {
   await ae.init();
   let Ye = await ae.getJob(j),
    xn = Ye?.frontmatter.cron ?? "";
   switch (Dn) {
    case "NEVER_STARTED_FAILURE": {
     let it = J instanceof Error ? J.message : String(J);
     await L(j, W, {
      last_result: "failure",
      last_error: it
     }, !1, B, "never-started failure"), await Q({
      jobId: j,
      sessionKey: W,
      job: Ye,
      cron: xn,
      errorMsg: it
     }), ee("[session-manager] job failed (never started, spawn-class) — job preserved", {
      jobId: j,
      sessionKey: W,
      cron: xn,
      error: it
     });
     break
    }
    case "STARTED_FAILURE": {
     let it = J instanceof Error ? J.message : String(J),
      ot = await L(j, W, {
       last_result: "failure",
       last_error: it
      }, !0, B, "started failure");
     await Q({
      jobId: j,
      sessionKey: W,
      job: Ye,
      cron: xn,
      errorMsg: it
     }), await $e({
      jobId: j,
      sessionKey: W,
      cron: xn,
      state: ot
     }), ee("[session-manager] job failed", {
      jobId: j,
      sessionKey: W,
      error: it
     });
     break
    }
    case "CANCELLED_POST_ACK": {
     let it = await L(j, W, {
      last_result: "failure",
      last_error: "cancelled"
     }, !0, B, "cancelled post-ack");
     await $e({
      jobId: j,
      sessionKey: W,
      cron: xn,
      state: it
     }), fe("[session-manager] job run cancelled after turn ack — consumed + failure marker, no delivery", {
      jobId: j,
      sessionKey: W
     });
     break
    }
    case "ZERO_FED": {
     await L(j, W, {
      last_result: "failure",
      last_error: "zero-fed run — no items merged"
     }, !1, B, "zero-fed"), fe("[session-manager] zero-fed job run — failure marker written, job preserved", {
      jobId: j,
      sessionKey: W
     });
     break
    }
    case "CANCELLED_PRE_ACK": {
     fe("[session-manager] job run ended without turn ack (cancelled before start) — finalize skipped, job preserved", {
      jobId: j,
      sessionKey: W,
      processedCount: F
     });
     break
    }
    case "STARTED_SUCCESS": {
     let it = await L(j, W, {
       last_result: "success",
       last_run_at: new Date()
        .toISOString(),
       last_error: void 0
      }, !0, B, "success"),
      ot = createSpineEvent({
       type: "job.complete",
       source: {
        kind: "job",
        name: j
       },
       session_key: W,
       payload: {
        job_id: j,
        result_summary: Le?.slice(0, 200)
       }
      });
     await atomicAppendEvent(t, ot);
     let Lt = Le?.slice(0, 200);
     n.emit("job.completed", {
      jobId: j,
      sessionKey: W,
      resultSummary: Lt
     }), y.notifyCalledDuringDrain ? Ue("[session-manager] skipping system job.complete delivery: agent called Notify", {
      jobId: j,
      sessionKey: W
     }) : await ke(Ye, W, "job.complete", {
      job_id: j,
      result_summary: Lt,
      result_text: Le?.slice(0, 2e3),
      agent_notified: !1,
      schedule_type: a2(xn),
      owner_session: Ye?.frontmatter.owner_session
     }), await $e({
      jobId: j,
      sessionKey: W,
      cron: xn,
      state: it
     }), ee("[session-manager] job completed", {
      jobId: j,
      sessionKey: W
     });
     break
    }
   }
  } catch (Ye) {
   Xe("[session-manager] error finalizing job session", Ye)
  }
 }
 async function Q(y) {
  let {
   jobId: I,
   sessionKey: j,
   job: W,
   cron: Y,
   errorMsg: q
  } = y, F = createSpineEvent({
   type: "job.fail",
   source: {
    kind: "job",
    name: I
   },
   session_key: j,
   payload: {
    job_id: I,
    error: q
   }
  });
  await atomicAppendEvent(t, F), n.emit("job.failed", {
   jobId: I,
   sessionKey: j,
   error: q
  }), await ke(W, j, "job.fail", {
   job_id: I,
   error: q,
   agent_notified: !1,
   schedule_type: a2(Y),
   owner_session: W?.frontmatter.owner_session
  })
 }
 async function $e(y) {
  let {
   jobId: I,
   sessionKey: j,
   cron: W,
   state: Y
  } = y;
  if (GXe(W)) {
   switch (Y.kind) {
    case "gone":
     ee("[session-manager] skip auto-archive: job already gone (archived mid-run)", {
      jobId: I,
      cron: W
     });
     return;
    case "stale":
     ee("[session-manager] skip auto-archive: stale finalize (a fresh claim owns the job)", {
      jobId: I,
      cron: W
     });
     return;
    case "failed":
     fe("[session-manager] skip auto-archive: job state unreadable at finalize (failing toward stale-active)", {
      jobId: I,
      cron: W
     });
     return;
    case "written":
     if (Y.runAt !== null) {
      ee("[session-manager] skip auto-archive: job re-armed via reschedule", {
       jobId: I,
       cron: W,
       runAt: Y.runAt
      });
      return
     }
     break;
    default:
     return Y
   }
   try {
    let q = await ae.archiveJobIfNotRearmed(I);
    if (!q.archived) {
     ee("[session-manager] skip auto-archive: job re-armed during finalize", {
      jobId: I,
      cron: W,
      runAt: q.runAt
     });
     return
    }
    if ((await Mne(t, j))
     .reason === "archive_in_flight") {
     fe("[session-manager] skip finalize session archive: archive already in flight", {
      jobId: I,
      sessionKey: j
     });
     return
    }
    ee("[session-manager] auto-archived one-shot job", {
     jobId: I,
     cron: W
    })
   } catch (q) {
    Xe("[session-manager] failed to auto-archive one-shot job", q)
   }
  }
 }
 async function ke(y, I, j, W) {
  if (!y) return;
  let Y = Ta(y.frontmatter.notify);
  if (Y.length !== 0)
   for (let q = 0; q < Y.length; q++) {
    let F = Yf(Y[q]);
    if (!F) {
     fe("[session-manager] invalid notify target in job, skipping delivery", {
      jobId: y.id,
      notify: Y[q]
     });
     continue
    }
    try {
     await wl(t, n, {
      traceId: `job-finalize_${y.id}_${q}`,
      routeId: `job-result-${q}`,
      sourceName: `job:${y.id}`,
      sourceSessionKey: I,
      targetSessionKey: F,
      eventType: j,
      payload: W
     }), Ue("[session-manager] job result delivered to notify target", {
      jobId: y.id,
      targetSessionKey: F,
      eventType: j
     })
    } catch (B) {
     fe("[session-manager] failed to deliver job result to notify target", {
      jobId: y.id,
      targetSessionKey: F,
      eventType: j,
      error: String(B)
     })
    }
   }
 }

 function Fe(y, I) {
  if (!x) return;
  let j = _.get(I);
  if (j && j.status !== "ended") {
   pt("[session-manager] skip duplicate job spawn", {
    jobId: y,
    sessionKey: I,
    actorStatus: j.status
   });
   return
  }
  if (g.activeCount >= g.maxConcurrent) {
   g.wakeQueue.includes(I) || g.wakeQueue.push(I), j ? (j.origin = "job", j.jobId = y) : _.set(I, {
    sessionKey: I,
    actorRunId: 0,
    sdkSessionId: void 0,
    sdkSessionIdVerified: !1,
    status: "idle",
    currentAbortController: null,
    query: null,
    streamAbortController: null,
    streamingState: null,
    streamingAdapter: null,
    drainPromise: null,
    wakeResolver: null,
    pendingWake: !1,
    isStreaming: !1,
    activeToolUseIds: new Set,
    pendingPreempt: !1,
    pendingPreemptBoundary: null,
    pendingClear: !1,
    attachedChannels: new Set,
    origin: "job",
    jobId: y,
    jobStateless: !1,
    holdsPoolSlot: !1,
    pendingAdmittedBatches: [],
    inflightEventIds: new Set,
    admissionInProgress: !1,
    pendingSteer: null,
    pendingNotifySteer: null,
    idleSince: void 0,
    notifyCalledDuringDrain: !1,
    runtime: "claude",
    codexAdapter: null,
    consecutiveConservativeRedrive: !1
   });
   return
  }
  ve(I, {
   origin: "job",
   jobId: y
  }), (async () => {
   try {
    let W = createSpineEvent({
     type: "job.spawn",
     source: {
      kind: "job",
      name: y
     },
     session_key: I,
     payload: {
      job_id: y
     }
    });
    await atomicAppendEvent(t, W), n.emit("job.spawned", {
     jobId: y,
     sessionKey: I
    })
   } catch (W) {
    Xe("[session-manager] error recording job spawn", W)
   }
  })()
 }
 async function Be(y, I) {
  let W = (w.get(y) ?? Promise.resolve())
   .catch(() => {})
   .then(async () => {
    if (y.startsWith("job:") || y.startsWith("meta:") || y.startsWith("system:") || y.startsWith("cadence:")) return;
    let Y = JXe(y),
     q = new Date()
     .toISOString(),
     F = createSpineEvent({
      type: "channel.attached",
      source: {
       kind: Y,
       name: "session-manager"
      },
      session_key: y,
      payload: {
       session_key: y,
       channel_kind: Y,
       channel_id: I,
       attached_at: q
      }
     });
    await atomicAppendEvent(t, F)
   })
   .finally(() => {
    w.get(y) === W && w.delete(y)
   });
  w.set(y, W), await W
 }

 function wn() {
  for (let y of _.values()) {
   if (y.status = "ended", y.codexAdapter) {
    let I = y.codexAdapter;
    y.codexAdapter = null, Promise.resolve(I.shutdown())
     .catch(j => {
      fe("[session-manager] codex adapter shutdown failed", {
       sessionKey: y.sessionKey,
       error: j instanceof Error ? j.message : String(j)
      })
     })
   }
   y.streamAbortController && !y.streamAbortController.signal.aborted && y.streamAbortController.abort(), typeof y.query?.close == "function" && y.query.close(), y.query = null, y.streamAbortController = null, y.currentAbortController && !y.currentAbortController.signal.aborted && y.currentAbortController.abort(), y.currentAbortController = null, y.wakeResolver && (y.wakeResolver(), y.wakeResolver = null)
  }
 }
 async function gt() {
  if (w.size === 0) return;
  let y = Array.from(w.values()),
   I = new Promise(j => setTimeout(j, 3e4));
  await Promise.race([Promise.allSettled(y)
   .then(() => {}), I
  ])
 }
 return {
  async start() {
   if (!x) {
    x = !0, n.on("session.wake", T), n.on("shutdown", P), n.on("session.streaming_invalidated", E);
    try {
     let y = await rehydrateSessionState(t);
     for (let I of y) {
      let W = (await Mt(t, I))
       ?.cwd;
      if (W && !tQe(W)) {
       fe("[session-manager] skip hydrating session with unavailable workspace", {
        sessionKey: I,
        cwd: W
       });
       continue
      }
      let Y = c2(I),
       q = v(I);
      q.activeCount < q.maxConcurrent ? ve(I, Y ?? void 0) : q.wakeQueue.push(I)
     }
    } catch (y) {
     Xe("[session-manager] error hydrating sessions:", y)
    }
    ee("[session-manager] started", {
     channelActive: h.activeCount,
     channelQueued: h.wakeQueue.length,
     jobActive: g.activeCount,
     jobQueued: g.wakeQueue.length
    })
   }
  },
  async stop() {
   if (!x) return;
   x = !1, n.off("session.wake", T), n.off("shutdown", P), n.off("session.streaming_invalidated", E), wn();
   let y = Array.from(_.values())
    .map(I => I.drainPromise)
    .filter(I => I !== null);
   if (y.length > 0) {
    let I = new Promise(j => setTimeout(j, 3e4));
    await Promise.race([Promise.all(y), I])
   }
   await gt(), _.clear(), h.wakeQueue.length = 0, h.activeCount = 0, g.wakeQueue.length = 0, g.activeCount = 0, ee("[session-manager] stopped")
  },
  wakeSession: Ne,
  getActor(y) {
   return _.get(y)
  },
  activeCount() {
   return h.activeCount + g.activeCount
  },
  activeChannelCount() {
   return h.activeCount
  },
  activeJobCount() {
   return g.activeCount
  },
  isRunning() {
   return x
  },
  attachChannel(y, I) {
   let j = _.get(y);
   j || (j = {
     sessionKey: y,
     actorRunId: 0,
     sdkSessionId: void 0,
     sdkSessionIdVerified: !1,
     status: "idle",
     currentAbortController: null,
     query: null,
     streamAbortController: null,
     streamingState: null,
     streamingAdapter: null,
     drainPromise: null,
     wakeResolver: null,
     pendingWake: !1,
     isStreaming: !1,
     activeToolUseIds: new Set,
     pendingPreempt: !1,
     pendingPreemptBoundary: null,
     pendingClear: !1,
     attachedChannels: new Set,
     origin: "channel",
     jobStateless: !1,
     holdsPoolSlot: !1,
     pendingAdmittedBatches: [],
     inflightEventIds: new Set,
     admissionInProgress: !1,
     pendingSteer: null,
     pendingNotifySteer: null,
     idleSince: void 0,
     notifyCalledDuringDrain: !1,
     runtime: "claude",
     codexAdapter: null,
     consecutiveConservativeRedrive: !1
    }, _.set(y, j)), j.attachedChannels.add(I), pt("[session-manager] channel attached", {
     sessionKey: y,
     channelId: I,
     totalAttachments: j.attachedChannels.size
    }), Be(y, I)
    .catch(W => {
     fe("[session-manager] failed to emit channel.attached event", {
      sessionKey: y,
      channelId: I,
      error: String(W)
     })
    })
  },
  detachChannel(y, I) {
   let j = _.get(y);
   j && (j.attachedChannels.delete(I), pt("[session-manager] channel detached", {
    sessionKey: y,
    channelId: I,
    remainingAttachments: j.attachedChannels.size
   }), j.attachedChannels.size === 0 && j.status === "idle" && j.wakeResolver && (j.wakeResolver(), j.wakeResolver = null))
  },
  hasAttachedChannels(y) {
   let I = _.get(y);
   return I ? I.attachedChannels.size > 0 : !1
  },
  spawnJobSession(y, I) {
   Fe(y, I)
  },
  async interruptSession(y) {
   if (!x) return {
    interrupted: !1,
    reason: "not_running"
   };
   let I = _.get(y);
   return I ? !I.query && (!I.currentAbortController || I.currentAbortController.signal.aborted) ? {
    interrupted: !1,
    reason: "idle"
   } : I.streamAbortController && !I.streamAbortController.signal.aborted ? (ee("[session-manager] interrupt: stopping streaming session", {
    sessionKey: y,
    actorRunId: I.actorRunId
   }), await K(I), {
    interrupted: !0,
    reason: "interrupted"
   }) : (D(I, "immediate") === "immediate" && ee("[session-manager] interrupt requested", {
    sessionKey: y,
    actorRunId: I.actorRunId
   }), {
    interrupted: !0,
    reason: "interrupted"
   }) : {
    interrupted: !1,
    reason: "not_found"
   }
  },
  async clearSdkSession(y) {
   if (!x) return {
    cleared: !1,
    reason: "not_running"
   };
   let I = _.get(y),
    j = I?.sdkSessionId;
   return I && (I.pendingClear = !0, I.sdkSessionId = void 0, I.sdkSessionIdVerified = !1), I?.streamAbortController && !I.streamAbortController.signal.aborted ? await K(I) : I?.currentAbortController && !I.currentAbortController.signal.aborted && D(I, "immediate"), await It(t, y, {
    sdk_session_id: null,
    pending_fork_to: null,
    pending_undo: null
   }), ee("[session-manager] SDK session cleared", {
    sessionKey: y,
    actorRunId: I?.actorRunId,
    previousSessionId: j
   }), {
    cleared: !0,
    previousSessionId: j
   }
  },
  async getSessionModelView(y) {
   let I = _.get(y),
    j = await Mt(t, y)
    .catch(() => null),
    W = {
     runtime: await p(y, I),
     storedModel: j?.model,
     hasLiveQuery: !!I?.query
    },
    Y = I?.query;
   if (Y && typeof Y.supportedModels == "function") try {
    W.available = d(await Y.supportedModels())
   } catch {}
   return W
  },
  async setSessionModel(y, I) {
   if (!x) return {
    ok: !1,
    reason: "not_running"
   };
   let j = _.get(y);
   if (await p(y, j) === "codex") return await It(t, y, {
    model: I ?? null,
    model_runtime: I !== null ? "codex" : null,
    pending_model_fork: !0
   }), ee("[session-manager] codex session model override updated", {
    sessionKey: y,
    model: I ?? "(reset to default)",
    pendingModelFork: !0
   }), {
    ok: !0,
    model: I,
    applied: "stored"
   };
   let W = j?.query,
    Y;
   if (I && W && typeof W.supportedModels == "function") try {
    Y = (await W.supportedModels())
     .some(B => B.value === I)
   } catch {}
   let q = "stored";
   if (W && typeof W.setModel == "function") try {
    await W.setModel(I ?? void 0), q = "live"
   } catch (F) {
    fe("[session-manager] live setModel failed — storing the override instead", {
     sessionKey: y,
     model: I ?? "(reset to default)",
     error: F instanceof Error ? F.message : String(F)
    })
   }
   return await It(t, y, {
    model: I ?? null,
    model_runtime: I !== null ? "claude" : null,
    pending_model_fork: null
   }), ee("[session-manager] session model override updated", {
    sessionKey: y,
    model: I ?? "(reset to default)",
    applied: q,
    listed: Y ?? "(no list consulted)"
   }), {
    ok: !0,
    model: I,
    applied: q,
    listed: Y
   }
  },
  getActorView(y) {
   let I = _.get(y);
   return I ? {
    sessionKey: I.sessionKey,
    status: I.status,
    health: "ok",
    idleSince: I.status === "idle" ? I.idleSince : void 0,
    attachedChannels: I.attachedChannels.size,
    sdkSessionId: I.sdkSessionId,
    origin: I.origin,
    jobId: I.jobId,
    runtime: I.runtime
   } : null
  },
  listActors() {
   let y = new Map;
   for (let [I, j] of _) y.set(I, {
    sessionKey: j.sessionKey,
    status: j.status,
    health: "ok",
    idleSince: j.status === "idle" ? j.idleSince : void 0,
    attachedChannels: j.attachedChannels.size,
    sdkSessionId: j.sdkSessionId,
    origin: j.origin,
    jobId: j.jobId,
    runtime: j.runtime
   });
   return y
  }
 }
}
