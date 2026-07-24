// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAgentSdkAdapter  (minified: Xc, daemon.pretty.js:57295)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAgentSdkAdapter() {
 let e = (t, n) => {
  let r = {},
   i = !!process.env.ALADUO_SDK_DEBUG;
  i && (r.debug = !0, r.stderr = c => {
   Br("debug", "[claude-sdk stderr]", c)
  }), t.sessionId && (r.resume = t.sessionId), t.abortController && (r.abortController = t.abortController), t.cwd && (r.cwd = t.cwd), t.settingSources && (r.settingSources = t.settingSources), t.persistSession !== void 0 && (r.persistSession = t.persistSession), "outputFormat" in t && t.outputFormat && (r.outputFormat = t.outputFormat), "model" in t && t.model && (r.model = t.model);
  let o = t.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? (Ho(process.env) === "host" ? "bypassPermissions" : void 0);
  if (o && (r.permissionMode = o), t.systemPrompt !== void 0) r.systemPrompt = t.systemPrompt;
  else {
   let c = h_(process.env.SYSTEM_PROMPT),
    u = h_(process.env.APPEND_SYSTEM_PROMPT),
    p = [resolveMetaPromptText(), u].filter(f => !!f)
    .join(`

`)
    .trim();
   c && p ? r.systemPrompt = `${c}

${p}` : c ? r.systemPrompt = c : p && (r.systemPrompt = {
    type: "preset",
    preset: "claude_code",
    append: p
   })
  }
  t.allowedTools !== void 0 && (r.allowedTools = t.allowedTools), t.disallowedTools !== void 0 && (r.disallowedTools = t.disallowedTools), t.mcpServers && (r.mcpServers = t.mcpServers), t.additionalDirectories !== void 0 && (r.additionalDirectories = t.additionalDirectories);
  let s = {
   ...process.env
  };
  delete s.CLAUDECODE, (t.additionalDirectories?.length ?? 0) > 0 && t.autoloadAdditionalDirectoryClaudeMd !== !1 ? s.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1" : t.autoloadAdditionalDirectoryClaudeMd === !1 && delete s.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD, r.env = s;
  let a = process.env.CLAUDE_CODE_EXECUTABLE;
  if (a && a.trim()
   .length > 0 && (r.pathToClaudeCodeExecutable = a), "hooks" in t && t.hooks && (r.hooks = t.hooks), n?.includePartialMessages && (r.includePartialMessages = !0, r.maxThinkingTokens = 0), i) {
   let c = {
    cwd: r.cwd,
    settingSources: r.settingSources,
    persistSession: r.persistSession,
    permissionMode: r.permissionMode,
    allowedTools: r.allowedTools,
    disallowedTools: r.disallowedTools,
    includePartialMessages: r.includePartialMessages
   };
   Br("debug", "[claude-sdk debug] execPath:", process.execPath), Br("debug", "[claude-sdk debug] PATH:", process.env.PATH), Br("debug", "[claude-sdk debug] options:", JSON.stringify(c))
  }
  return r
 };
 return {
  async run(t) {
   Gue();
   let n = t.sessionId,
    r, i, o = "",
    s = "",
    a = Date.now(),
    c = !1,
    u, l, d = !1,
    p = !!process.env.ALADUO_SDK_DEBUG,
    f = e(t, {
     includePartialMessages: !!t.onStream
    });
   {
    let ae = f.hooks ?? {},
     C = ae.PreToolUse ?? [];
    C.push({
     matcher: f_,
     hooks: [async () => (d = !0, ee("[claude-sdk] Skip detected via PreToolUse hook (non-streaming)"), {})]
    }), ae.PreToolUse = C, f.hooks = ae
   }
   let m = !1,
    h = (ae, C, L = !1) => {
     if (!(!t.onStream || !ae) && !d) {
      if (c || (c = !0, u = Date.now() - a, Si("sdk_first_token", t.sessionId ?? "new", {
        ttftMs: u
       })), L) {
       t.onStream(ae, !0);
       return
      }
      if (C) {
       o += ae, s += ae, t.onStream(ae, !1);
       return
      }
      if (s && ae.startsWith(s)) {
       let ne = ae.slice(s.length);
       ne && (o += ne, s = ae, t.onStream(ne, !1));
       return
      }
      if (ae.startsWith(o)) {
       let ne = ae.slice(o.length);
       ne && (o = ae, s += ne, t.onStream(ne, !1));
       return
      }
      o += ae, s += ae, t.onStream(ae, !1)
     }
    },
    g = new Map,
    v = new Map,
    S = ae => {
     if (t.onExecutionEvent) try {
      t.onExecutionEvent(ae)
     } catch {}
    },
    _ = ae => {
     let C = ae.message?.content;
     if (Array.isArray(C))
      for (let L of C) {
       if (!L || typeof L != "object") continue;
       if (L.type === "tool_use") {
        let Q = L.id,
         $e = L.name,
         ke = L.input;
        Q && $e && (g.set(Q, $e), S({
         type: "tool_use",
         toolUseId: Q,
         toolName: $e,
         input: ke
        }))
       }
      }
    },
    b = parsePositiveMsEnv(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4),
    w = null,
    x = !1,
    R = t.holdInputOpenForBackgroundAgents === !0,
    T = new Set,
    P = !1,
    E = !R,
    O = () => {},
    A = R ? new Promise(ae => {
     O = ae
    }) : Promise.resolve(),
    D = parsePositiveMsEnv(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5),
    H = null,
    K = () => {
     H && (clearTimeout(H), H = null)
    },
    te = () => {
     E || P && T.size === 0 && (E = !0, K(), O())
    },
    z = () => {
     E || (E = !0, K(), O())
    },
    xe = () => {
     !R || E || (K(), P && (H = setTimeout(() => {
      E || (Br("warn", "[claude-sdk] hold-input idle watchdog fired — SDK went silent with background Agent task(s) still tracked; force-releasing stdin to avoid an unbounded hang. If this was a legitimate long-running task, its continuation's in-process MCP call may fail; investigate.", JSON.stringify({
       idleTimeoutMs: D,
       inFlightAgentTaskIds: Array.from(T)
      })), z())
     }, D), typeof H == "object" && H?.unref && H.unref()))
    };
   async function* Ne() {
    let ae = typeof t.prompt == "string" ? JT(t.prompt) : t.prompt;
    for await (let C of ae) yield C;
    await A
   }
   let ve = Wue({
     prompt: R ? Ne() : t.prompt,
     options: f
    }),
    Tt = () => {
     w = setTimeout(() => {
      x = !0, Ue("[claude-sdk] abort close timeout reached, closing query"), ve.close()
     }, b)
    };
   t.abortController?.signal.aborted ? Tt() : t.abortController?.signal.addEventListener("abort", Tt, {
    once: !0
   });
   let Ht = !1,
    _e = () => {
     if (!Ht) {
      Ht = !0;
      try {
       t.onTurnAcknowledged?.()
      } catch {}
     }
    };
   try {
    for await (let ae of ve) {
     let C = ae;
     if (C.type === "system" && C.subtype === "init" || _e(), C.type === "system") {
      if (C.subtype === "init" && (n = C.session_id ?? n), R && C.subtype === "task_started") {
       let L = C,
        ne = typeof L.task_type == "string" ? L.task_type : void 0,
        $e = L.subagent_type !== void 0 && L.subagent_type !== null || ne !== void 0 && ne !== "local_bash";
       typeof L.task_id == "string" && L.task_id.length > 0 && $e && T.add(L.task_id)
      }
      if (R && C.subtype === "task_notification") {
       let L = C;
       typeof L.task_id == "string" && T.delete(L.task_id)
      }
      S({
       type: "system",
       subtype: C.subtype ?? "unknown",
       data: C.subtype === "init" ? {
        session_id: C.session_id
       } : void 0
      })
     }
     if (C.type === "stream_event") {
      let L = Vp(C),
       ne = qT(C.event);
      for (let Fe of ne) h(Fe.text, Fe.isDelta, L);
      let Q = BT(C.event);
      for (let Fe of Q) S({
       type: "thought_chunk",
       text: Fe
      });
      let $e = HT(C.event);
      $e && (v.set($e.index, {
       toolUseId: $e.toolUseId,
       toolName: $e.toolName
      }), g.set($e.toolUseId, $e.toolName), S({
       type: "tool_use",
       toolUseId: $e.toolUseId,
       toolName: $e.toolName,
       input: void 0,
       ephemeral: !0
      }));
      let ke = VT(C.event);
      if (ke) {
       let Fe = v.get(ke.index);
       Fe && S({
        type: "tool_input_delta",
        toolUseId: Fe.toolUseId,
        toolName: Fe.toolName,
        partialJson: ke.partialJson
       })
      }
     }
     if (typeof C.type == "string" && C.type.includes("assistant")) {
      let L = Vp(C),
       ne = UT(C);
      for (let Q of ne) h(Q.text, Q.isDelta, L);
      _(C)
     }
     if (C.type === "user") {
      let L = C.message?.content,
       ne = !1;
      if (Array.isArray(L))
       for (let Q of L) {
        if (!Q || typeof Q != "object") continue;
        if (Q.type === "tool_result") {
         ne = !0;
         let ke = Q.tool_use_id,
          Fe = Q.is_error ?? !1,
          Be = Q.content;
         ke && (S({
          type: "tool_result",
          toolUseId: ke,
          toolName: g.get(ke),
          isError: Fe,
          summary: ZT(Be)
         }), s = "")
        }
       }
      ne && d && !m && (m = !0, typeof ve.interrupt == "function" && (ee("[claude-sdk] Skip called — interrupting turn (non-streaming)"), Promise.resolve(ve.interrupt())
       .catch(Q => {
        ee("[claude-sdk] skip interrupt failed (non-streaming)", {
         error: Q instanceof Error ? Q.message : String(Q)
        })
       })))
     }
     C.type === "result" && C.subtype === "success" && (typeof C.result == "string" && (r = C.result), C.structured_output !== void 0 && (i = C.structured_output), l = m_(C)), R && C.type === "result" && (P = !0, te()), R && !E && xe()
    }
    if (x) throw Zp("SDK run force-closed after abort timeout", new Error("abort close timeout"))
   } catch (ae) {
    throw p && Br("error", "[claude-sdk error]", ae instanceof Error ? ae.stack ?? ae.message : String(ae)), t.abortController?.signal.aborted && !Z9e(ae) ? Zp("SDK run aborted", ae) : ae
   } finally {
    w && clearTimeout(w), t.abortController?.signal.removeEventListener("abort", Tt), z()
   }
   return {
    sessionId: n,
    text: d ? void 0 : r ?? (o || void 0),
    structured: d ? void 0 : i,
    usage: l,
    firstTokenLatencyMs: u,
    skipped: d || void 0
   }
  },
  createStreamingQuery(t) {
   return Gue(), {
    query: Wue({
     prompt: t.prompt,
     options: e(t, {
      includePartialMessages: !0
     })
    })
   }
  },
  async undo(t) {
   let n = new Date()
    .toISOString();
   if (!Number.isInteger(t.numTurns) || t.numTurns < 1) return {
    kind: "noop",
    runtime: "claude",
    reason: `invalid numTurns: ${t.numTurns}`,
    triggered_at: n
   };
   let r = process.env.CLAUDE_CONFIG_DIR ?? Wp.join(B9e(), ".claude"),
    i = Wp.join(r, "projects"),
    o = [];
   try {
    o = await U9e(i)
   } catch (m) {
    return {
     kind: "failed",
     runtime: "claude",
     error: `failed to scan claude projects dir: ${m instanceof Error?m.message.split(`
`)[0]:String(m)}`,
     triggered_at: n
    }
   }
   let s;
   for (let m of o) {
    let h = Wp.join(i, m, `${t.sessionId}.jsonl`);
    try {
     if (!(await q9e(h))
      .isFile()) continue;
     if (s) return {
      kind: "failed",
      runtime: "claude",
      error: "ambiguous session file lookup (multiple matches)",
      triggered_at: n
     };
     s = h
    } catch {}
   }
   if (!s) return {
    kind: "failed",
    runtime: "claude",
    error: `session file not found for sdk_session_id=${t.sessionId}`,
    triggered_at: n
   };
   if (t.abortController?.signal.aborted) return {
    kind: "failed",
    runtime: "claude",
    error: "aborted",
    triggered_at: n
   };
   let a;
   try {
    a = await F9e(s, "utf8")
   } catch (m) {
    return {
     kind: "failed",
     runtime: "claude",
     error: `failed to read session file: ${m instanceof Error?m.message.split(`
`)[0]:String(m)}`,
     triggered_at: n
    }
   }
   let c = [],
    u = [],
    l = m => {
     if (m.type !== "user") return !1;
     let g = m.message?.content;
     return typeof g == "string" ? !0 : Array.isArray(g) ? g.some(v => !v || typeof v != "object" ? !0 : v.type !== "tool_result") : !0
    };
   for (let m of a.split(`
`)) {
    let h = m.trim();
    if (!h) continue;
    let g;
    try {
     g = JSON.parse(h)
    } catch {
     continue
    }
    if (g.isSidechain === !0 || typeof g.type != "string" || typeof g.uuid != "string" || g.uuid.length === 0) continue;
    let v = c.length;
    c.push({
     uuid: g.uuid,
     type: g.type
    }), l(g) && u.push(v)
   }
   if (u.length === 0) return {
    kind: "noop",
    runtime: "claude",
    reason: "session has no real user turns to undo",
    triggered_at: n
   };
   if (t.numTurns >= u.length) return {
    kind: "noop",
    runtime: "claude",
    reason: "would drop entire conversation; use /clear instead",
    triggered_at: n
   };
   let p = u[u.length - t.numTurns] - 1;
   if (p < 0) return {
    kind: "noop",
    runtime: "claude",
    reason: "no entries before the first dropped turn; use /clear instead",
    triggered_at: n
   };
   let f = c[p].uuid;
   return {
    kind: "succeeded",
    runtime: "claude",
    sessionIdChanged: !0,
    droppedTurns: t.numTurns,
    cutoff_message_uuid: f,
    triggered_at: n
   }
  }
 }
}
