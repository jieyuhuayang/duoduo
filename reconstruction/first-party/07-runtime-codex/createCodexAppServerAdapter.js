// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: createCodexAppServerAdapter  (minified: S_, daemon.pretty.js:57880)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createCodexAppServerAdapter(e, t) {
 let n = {
   ...oKe,
   ...e
  },
  r = null,
  i = !1,
  o = null,
  s = null;
 async function a(c, u, l) {
  if ((!r || !r.isAlive) && (r = new KT(n.codexBinary, u, n.env), r.start(), i = !1, o = null), !i) {
   if (await r.request("initialize", {
     clientInfo: {
      title: "duoduo-runtime",
      name: "duoduo",
      version: "0.1.0"
     },
     capabilities: {
      experimentalApi: !!n.dynamicTools?.length,
      optOutNotificationMethods: ["item/reasoning/summaryTextDelta", "item/reasoning/summaryPartAdded", "item/reasoning/textDelta"]
     }
    }, l), r.notify("initialized", {}), n.dynamicTools?.length) {
    let d = new Map;
    for (let p of n.dynamicTools) d.set(p.name, p.handler);
    r.setToolHandlers(d)
   }
   i = !0
  }
  o !== c && (await r.request("thread/resume", {
   threadId: c
  }, l), o = c)
 }
 return {
  async run(c) {
   let u;
   if (typeof c.prompt == "string") u = c.prompt;
   else {
    let ae = [];
    for await (let C of c.prompt) if (typeof C.message.content == "string") ae.push(C.message.content);
    else if (Array.isArray(C.message.content))
     for (let L of C.message.content) L.type === "text" && ae.push(L.text);
    u = ae.join(`

`)
   }
   if (!u.trim()) return {
    text: "",
    usage: void 0
   };
   let l = c.cwd || process.cwd();
   if ((!r || !r.isAlive) && (r = new KT(n.codexBinary, l, n.env), r.start(), i = !1), !i) {
    if (await r.request("initialize", {
      clientInfo: {
       title: "duoduo-runtime",
       name: "duoduo",
       version: "0.1.0"
      },
      capabilities: {
       experimentalApi: !!n.dynamicTools?.length,
       optOutNotificationMethods: ["item/reasoning/summaryTextDelta", "item/reasoning/summaryPartAdded", "item/reasoning/textDelta"]
      }
     }, c.abortController?.signal), r.notify("initialized", {}), n.dynamicTools?.length) {
     let ae = new Map;
     for (let C of n.dynamicTools) ae.set(C.name, C.handler);
     r.setToolHandlers(ae)
    }
    i = !0
   }
   let d = extractSystemPromptAppend(c.systemPrompt),
    p = buildBaseInstructions(t ?? {}, d),
    f = buildDeveloperInstructions(t ?? {}),
    m = sKe(c.permissionMode, n.sandbox);
   c.disallowedTools?.length && Ue("[codex-adapter] disallowedTools ignored — Codex built-in tools cannot be disabled", {
    disallowedTools: c.disallowedTools
   });
   let h = c.persistSession !== void 0 ? !c.persistSession : n.ephemeral,
    g = c.model !== void 0 ? c.model : n.model,
    v = () => {
     let ae = {
      cwd: l,
      model: g,
      approvalPolicy: "never",
      sandbox: m,
      serviceName: n.serviceName,
      ephemeral: h,
      experimentalRawEvents: !1,
      persistExtendedHistory: !1
     };
     return p && (ae.baseInstructions = p), f && (ae.developerInstructions = f), n.dynamicTools?.length && (ae.dynamicTools = n.dynamicTools.map(C => ({
      name: C.name,
      description: C.description,
      inputSchema: C.inputSchema
     }))), ae
    },
    S = ae => ({
     cwd: l,
     model: g,
     approvalPolicy: "never",
     sandbox: m,
     threadId: ae
    }),
    _ = ae => {
     let C = {
      cwd: l,
      model: g,
      approvalPolicy: "never",
      sandbox: m,
      threadId: ae,
      persistExtendedHistory: !1
     };
     return p && (C.baseInstructions = p), f && (C.developerInstructions = f), C
    },
    b, w;
   c.forkFrom ? (b = "thread/fork", w = _(c.forkFrom)) : c.sessionId ? (b = "thread/resume", w = S(c.sessionId)) : (b = "thread/start", w = v());
   let x;
   try {
    x = await r.request(b, w, c.abortController?.signal)
   } catch (ae) {
    let C = ae instanceof Error && ae.name === "AbortError" || c.abortController?.signal.aborted === !0;
    if (b === "thread/fork" && !C) ee("[codex-adapter] thread/fork failed, falling back to thread/start", {
     cwd: l,
     forkFrom: c.forkFrom,
     error: ae instanceof Error ? ae.message : String(ae)
    }), b = "thread/start", w = v(), x = await r.request(b, w, c.abortController?.signal);
    else throw ae
   }
   let T = x.thread.id;
   o = T;
   let P = [],
    E = new Map,
    O = {},
    A, D = Date.now(),
    H = !1,
    K, te, z = new Promise(ae => {
     te = ae
    }),
    xe = !1,
    Ne = ae => {
     if (!K) return;
     let C = extractCodexGeneratedImageAttachment(ae);
     if (!C) {
      !xe && hasImageGenerationRecord(ae) && (xe = !0, fe("[codex] image-generation record present but no attachment extracted", {
       threadId: T,
       turnId: K,
       hint: "codex image-event schema may have changed (saved_path/result/type/wrapper-key)"
      }));
      return
     }
     let L = "path" in C ? `path:${C.path}` : `call:${C.callId}`;
     E.set(L, C)
    },
    ve = !1,
    Tt = new Promise((ae, C) => {
     let L = $e => {
       ve || (ve = !0, Q(), $e())
      },
      ne = $e => {
       if (ve) return;
       let ke = $e.params ?? {},
        Fe = ke.threadId,
        Be = ke.turnId;
       if (codexNotificationFilterDecision({
         method: $e.method,
         msgThreadId: Fe,
         msgTurnId: Be,
         ownThreadId: T,
         ownTurnId: K
        }) !== "process") return;
       let wn = ke.item;
       switch (Ne(ke), $e.method) {
        case "item/agentMessage/delta": {
         let gt = ke.delta ?? "";
         gt && (H || (A = Date.now() - D, H = !0), P.push(gt), c.onStream?.(gt));
         break
        }
        case "item/started": {
         if (!wn) break;
         let gt = aKe(wn);
         gt && c.onExecutionEvent?.(gt);
         break
        }
        case "item/completed": {
         if (!wn) break;
         Ne(wn);
         let gt = cKe(wn);
         gt && c.onExecutionEvent?.(gt);
         break
        }
        case "item/reasoning/summaryTextDelta":
        case "item/reasoning/textDelta": {
         let gt = ke.delta ?? "";
         gt && c.onExecutionEvent?.({
          type: "thought_chunk",
          text: gt
         });
         break
        }
        case "thread/tokenUsage/updated": {
         let gt = ke.tokenUsage;
         O = computeCodexTurnUsage(O, gt?.total, gt?.last);
         break
        }
        case "turn/completed": {
         Fe === T && L(() => ae());
         break
        }
        case "error": {
         let y = ke.error?.message ?? "";
         if (/^(Reconnecting|Connecting)\b/.test(y)) {
          ee("[codex-transport] transient reconnect notice", {
           message: y,
           threadId: T,
           turnId: K
          });
          break
         }
         L(() => C(new Error(y || "codex app-server error notification")));
         break
        }
       }
      },
      Q = () => {
       r?.removeListener("notification", ne)
      };
     if (r.on("notification", ne), c.abortController) {
      let $e = () => {
       let ke = new Promise((Be, wn) => setTimeout(() => wn(new Error("turnId timeout on abort")), 2e3));
       Promise.race([z, ke])
        .then(Be => {
         r?.request("turn/interrupt", {
           threadId: T,
           turnId: Be
          })
          .catch(() => {})
        })
        .catch(() => {});
       let Fe = new Error("turn aborted");
       Fe.name = "AbortError", L(() => C(Fe))
      };
      c.abortController.signal.addEventListener("abort", $e, {
       once: !0
      })
     }
    });
   try {
    c.onTurnAcknowledged?.()
   } catch {}
   let Ht;
   try {
    Ht = await r.request("turn/start", {
     threadId: T,
     input: [{
      type: "text",
      text: u,
      text_elements: []
     }],
     model: g,
     effort: n.effort,
     outputSchema: c.outputFormat ?? null
    }, c.abortController?.signal)
   } catch (ae) {
    if (typeof ae.code == "number" && ae.name !== "AbortError") try {
     c.onTurnRejected?.()
    } catch {}
    throw ae
   }
   K = Ht.turn?.id, K && te?.(K), K && (s = {
     threadId: T,
     turnId: K,
     abortSignal: c.abortController?.signal
    }), c.abortController?.signal.aborted && K && r.request("turn/interrupt", {
     threadId: T,
     turnId: K
    })
    .catch(() => {});
   try {
    await Tt
   } finally {
    s && s.turnId === K && (s = null)
   }
   let _e = P.join(""),
    Ze = O.usage ? {
     ...O.usage,
     model: g ?? "default"
    } : void 0;
   return {
    sessionId: T,
    text: _e || void 0,
    attachments: E.size > 0 ? Array.from(E.values()) : void 0,
    usage: Ze,
    firstTokenLatencyMs: A
   }
  },
  async compact(c) {
   let u = new Date()
    .toISOString(),
    l = new AbortController,
    d;
   c.abortController && (d = () => l.abort(), c.abortController.signal.addEventListener("abort", d, {
    once: !0
   }));
   try {
    await a(c.sessionId, c.cwd ?? process.cwd(), l.signal)
   } catch (h) {
    return d && c.abortController?.signal.removeEventListener("abort", d), c.abortController?.signal.aborted === !0 || h instanceof Error && h.name === "AbortError" ? {
     kind: "failed",
     runtime: "codex",
     error: "aborted",
     triggered_at: u
    } : {
     kind: "failed",
     runtime: "codex",
     error: `failed to attach to thread: ${h instanceof Error?h.message.split(`
`)[0]:String(h)}`,
     triggered_at: u
    }
   }
   let p, f = h => {
     p || (p = h)
    },
    m = new Promise(h => {
     let g = S => {
       let _ = S.params ?? {};
       if (S.method === "thread/compacted") {
        f({
         kind: "succeeded",
         runtime: "codex",
         triggered_at: u
        }), v(), h();
        return
       }
       if (S.method === "item/completed" && _.item?.type === "contextCompaction") {
        f({
         kind: "succeeded",
         runtime: "codex",
         triggered_at: u
        }), v(), h();
        return
       }
       if (S.method === "error") {
        let b = (_.error?.message ?? "") || "unknown error";
        if (/^(Reconnecting|Connecting)\b/.test(b)) return;
        f({
         kind: "failed",
         runtime: "codex",
         error: b,
         triggered_at: u
        }), v(), h()
       }
      },
      v = () => {
       r?.removeListener("notification", g)
      };
     r.on("notification", g), l.signal.addEventListener("abort", () => {
      v(), p || f({
       kind: "failed",
       runtime: "codex",
       error: "aborted",
       triggered_at: u
      }), h()
     }, {
      once: !0
     })
    });
   try {
    await r.request("thread/compact/start", {
     threadId: c.sessionId
    }, l.signal)
   } catch (h) {
    return d && c.abortController?.signal.removeEventListener("abort", d), c.abortController?.signal.aborted === !0 || h instanceof Error && h.name === "AbortError" ? {
     kind: "failed",
     runtime: "codex",
     error: "aborted",
     triggered_at: u
    } : {
     kind: "failed",
     runtime: "codex",
     error: h instanceof Error ? h.message.split(`
`)[0] : String(h),
     triggered_at: u
    }
   }
   return await m, d && c.abortController?.signal.removeEventListener("abort", d), p ?? {
    kind: "noop",
    runtime: "codex",
    reason: "no compaction notification received before stream end",
    triggered_at: u
   }
  },
  async undo(c) {
   let u = new Date()
    .toISOString();
   if (!Number.isInteger(c.numTurns) || c.numTurns < 1) return {
    kind: "noop",
    runtime: "codex",
    reason: `invalid numTurns: ${c.numTurns}`,
    triggered_at: u
   };
   let l = new AbortController,
    d;
   c.abortController && (d = () => l.abort(), c.abortController.signal.addEventListener("abort", d, {
    once: !0
   }));
   try {
    await a(c.sessionId, c.cwd ?? process.cwd(), l.signal)
   } catch (p) {
    return d && c.abortController?.signal.removeEventListener("abort", d), c.abortController?.signal.aborted === !0 || p instanceof Error && p.name === "AbortError" ? {
     kind: "failed",
     runtime: "codex",
     error: "aborted",
     triggered_at: u
    } : {
     kind: "failed",
     runtime: "codex",
     error: `failed to attach to thread: ${p instanceof Error?p.message.split(`
`)[0]:String(p)}`,
     triggered_at: u
    }
   }
   try {
    return await r.request("thread/rollback", {
     threadId: c.sessionId,
     numTurns: c.numTurns
    }, l.signal), d && c.abortController?.signal.removeEventListener("abort", d), {
     kind: "succeeded",
     runtime: "codex",
     newSessionId: c.sessionId,
     sessionIdChanged: !1,
     droppedTurns: c.numTurns,
     triggered_at: u
    }
   } catch (p) {
    if (d && c.abortController?.signal.removeEventListener("abort", d), c.abortController?.signal.aborted === !0 || p instanceof Error && p.name === "AbortError") return {
     kind: "failed",
     runtime: "codex",
     error: "aborted",
     triggered_at: u
    };
    let m = p instanceof Error ? p.message : String(p),
     h = m.toLowerCase();
    return ["no turns", "nothing to roll back", "past system prompt", "rollback past", "history shorter", "out of range"].some(v => h.includes(v)) ? {
     kind: "noop",
     runtime: "codex",
     reason: m.split(`
`)[0],
     triggered_at: u
    } : {
     kind: "failed",
     runtime: "codex",
     error: m.split(`
`)[0],
     triggered_at: u
    }
   }
  },
  activeTurnId() {
   return s?.turnId
  },
  async steerActiveTurn(c, u) {
   let l = s;
   if (!r || !r.isAlive || !l || l.turnId !== u) return !1;
   try {
    return await r.request("turn/steer", {
     threadId: l.threadId,
     expectedTurnId: u,
     input: [{
      type: "text",
      text: c,
      text_elements: []
     }]
    }, l.abortSignal), !0
   } catch (d) {
    return ee("[codex] turn/steer failed — falling back to new turn", {
     threadId: l.threadId,
     expectedTurnId: u,
     error: d instanceof Error ? d.message : String(d)
    }), !1
   }
  },
  async shutdown() {
   await r?.shutdown(), r = null, i = !1
  }
 }
}
