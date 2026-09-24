// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: executeGatewayCommand  (minified: BXe, daemon.pretty.js:87485)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function executeGatewayCommand(e, t, n, r, i) {
    if (t.name === "unsupported") return Z("[gateway] unsupported command", {
        command: t.raw,
        command_name: t.name
    }), {
        responseText: [`Unsupported command: ${t.raw}`, Ble].join(`
`)
    };
    if (t.name === "injection-usage") return {
        responseText: t.usage
    };
    if (t.name === "/clear") {
        if (!r?.clearSession) return {
            responseText: ["Session clear is unavailable.", "This daemon instance has no active session manager."].join(`
`)
        };
        let o = await r.clearSession(n);
        return o.cleared ? {
            responseText: ["SDK session cleared.", `- session_key: ${n}`, `- previous_session_id: ${o.previousSessionId??"none"}`, "- status: new session will start on next message"].join(`
`),
            noticeSummary: o.previousSessionId !== void 0 ? `This session was reset — start fresh, do not resume the prior session's pending work. Previous session id ${o.previousSessionId} is retained: if the user recalls something from before the reset, use it to look up that session's history.` : "This session was reset — start fresh, do not resume the prior session's pending work. There was no prior agent session to retain."
        } : {
            responseText: ["Session clear failed.", `- session_key: ${n}`, o.reason ? `- reason: ${o.reason}` : "- reason: unknown"].join(`
`)
        }
    }
    if (t.name === "/cancel") {
        if (!r?.cancelSession) return {
            responseText: ["Cancellation control is unavailable.", "This daemon instance has no active session interrupt controller."].join(`
`)
        };
        let o = await r.cancelSession(n);
        return o.interrupted ? {
            responseText: ["Cancellation requested.", `- session_key: ${n}`, "- status: interrupted active turn"].join(`
`)
        } : {
            responseText: ["No active turn to cancel.", `- session_key: ${n}`, o.reason ? `- reason: ${o.reason}` : "- reason: idle"].join(`
`)
        }
    }
    if (t.name === "/status") {
        let o = await db(e),
            s = r?.listActors?.(),
            a = r?.listPersistentSessions?.() ?? [],
            u = new Set,
            l = 0,
            c = 0,
            d = 0;
        if (s)
            for (let h of s.values()) h.status !== "ended" && (u.add(h.sessionKey), h.status === "active" ? l++ : h.status === "idle" && c++, h.health === "error" && d++);
        let f = 0;
        for (let h of a) u.has(h.session_key) || (f++, c++, h.last_error && d++);
        let p = u.size + f;
        return {
            responseText: ["ALADUO Status", `- gateway: ${o?.health.gateway??"unknown"}`, `- meta_session: ${o?.health.meta_session??"unknown"}`, `- cadence_last_tick: ${o?.cadence.last_tick??"never"}`, `- sessions: total=${p}, active=${l}, idle=${c}, error=${d}`].join(`
`)
        }
    }
    if (t.name === "/stats") {
        let {
            readAllSessionSummaries: o
        } = await Promise.resolve().then(() => (Lu(), cU)), s = new Date(Date.now() - 1440 * 60 * 1e3), a = await o(e, s), u = 0, l = 0, c = 0, d = 0, f = 0;
        for (let m of Object.values(a)) u += m.total_drains, l += m.total_input_tokens, c += m.total_output_tokens, d += m.total_cost_usd, f += m.total_sdk_duration_ms / 1e3;
        return {
            responseText: ["ALADUO Usage Statistics (Last 24h)", `- Drains (Tasks): ${u}`, `- Tokens: Input (${l.toLocaleString()}) | Output (${c.toLocaleString()})`, `- Cost (USD): $${d.toFixed(4)}`, `- SDK Duration: ${f.toFixed(1)}s`].join(`
`)
        }
    }
    if (t.name === "/task") {
        let {
            readRecentDrainRecords: o
        } = await Promise.resolve().then(() => (Lu(), cU)), s = r?.listActors?.(), a = r?.listPersistentSessions?.() ?? [], u = new Map(a.map(h => [h.session_key, h])), l = [];
        if (s)
            for (let h of s.values()) {
                if (h.status !== "active" || h.sessionKey === n) continue;
                let g = u.get(h.sessionKey);
                l.push({
                    session_key: h.sessionKey,
                    last_event_at: g?.last_event_at ?? null
                })
            }
        l.sort((h, g) => h.session_key.localeCompare(g.session_key));
        let c = t.args.trim().split(/\s+/);
        if (c.length > 0 && c[0] === "kill") {
            let h = c[1],
                g = parseInt(h, 10);
            if (isNaN(g) || g < 1 || g > l.length) return {
                responseText: `Invalid task number: ${h}. Use /task to see valid numbers.`
            };
            let y = l[g - 1];
            if (r?.cancelSession) {
                let v = await r.cancelSession(y.session_key);
                return v.interrupted ? {
                    responseText: `Cancellation requested for task ${g} (${y.session_key}).`
                } : {
                    responseText: `Could not cancel task ${g} (${y.session_key}): ${v.reason??"unknown"}.`
                }
            }
            return {
                responseText: "Session cancel is unavailable."
            }
        }
        let d = await o(e, 10),
            f = l.map((h, g) => ({
                index: g + 1,
                session_key: h.session_key,
                last_event_at: h.last_event_at
            })),
            p = d.map((h, g) => ({
                index: l.length + g + 1,
                session_key: h.session_key,
                started_at: h.drain_started_at,
                duration_ms: h.drain_duration_ms,
                cost_usd: h.usage?.total_cost_usd ?? 0,
                tool_calls: h.tool_calls
            })),
            m = ["ALADUO Tasks"];
        return m.push(`
### Active Running Tasks`), l.length === 0 ? m.push("No active tasks.") : (f.forEach(h => {
            m.push(`${h.index}. [${h.session_key}] (started ${h.last_event_at||"unknown"})`)
        }), m.push("\nTo cancel a task, use `/task kill <number>`.")), m.push(`
### Recent Finished Tasks (Top 10)`), d.length === 0 ? m.push("No recent tasks.") : p.forEach(h => {
            m.push(`- [${h.session_key}] cost: $${h.cost_usd.toFixed(4)}, tools: ${h.tool_calls}, time: ${h.started_at}`)
        }), {
            responseText: m.join(`
`),
            data: {
                type: "task",
                active: f,
                recent: p
            }
        }
    }
    if (t.name === "/config") return {
        responseText: ["ALADUO Config (Safe View)", "- channels: stdio, lark, dingtalk", `- cadence_interval_ms: ${process.env.ALADUO_CADENCE_INTERVAL_MS??"2220000"}`, `- permission_mode: ${process.env.ALADUO_PERMISSION_MODE??"default"}`, `- model_opus: ${process.env.ANTHROPIC_DEFAULT_OPUS_MODEL??"unset"}`, `- model_sonnet: ${process.env.ANTHROPIC_DEFAULT_SONNET_MODEL??"unset"}`, `- model_haiku: ${process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL??"unset"}`].join(`
`)
    };
    if (t.name === "/model") {
        if (!r?.getSessionModel || !r?.setSessionModel) return {
            responseText: "Model switching is not available (no session manager attached)."
        };
        let o = m => (m ?? []).map(h => `- ${h.value}${h.displayName?` — ${h.displayName}`:""}`),
            s = "Switch: `/model <model-id>` · Reset: `/model reset`",
            a = t.args.trim(),
            u = m => {
                if (m.storedModel) return `Session model: ${m.storedModel}`;
                let h = m.configModel;
                if (h) return `Session model: (${h.model}, from the ${h.source} config)`;
                let g = m.cliDefaultModel;
                if (!g) return "Session model: (runtime default)";
                let y = g.origin === "env" ? "via ANTHROPIC_MODEL" : `via ${g.origin} settings`;
                return `Session model: (runtime default → ${g.model} ${y})`
            },
            l = m => m.lastServedModel ? [`Last served model: ${m.lastServedModel}`] : [];
        if (!a) {
            let m = await r.getSessionModel(n, i);
            if (m.runtime === "pi") return {
                responseText: [m.storedModel ? `Session model: ${m.storedModel}` : m.configModel ? `Session model: (${m.configModel.model}, from the ${m.configModel.source} config)` : "Session model: (none set — a pi session cannot run a turn until one is set)", ...l(m), ...UXe(m.piProviders), "", "Pi session — a switch is stored and the worker rebuilds with it on the next turn.", "", "Switch: `/model <provider>/<modelId>` · Reset: `/model reset`"].join(`
`)
            };
            let h = qXe(m);
            if (m.runtime === "grok") return {
                responseText: [u(m), ...l(m), "", "Grok session — a switch applies to the live session.", "", s].join(`
`)
            };
            if (m.runtime === "codex") return {
                responseText: [u(m), ...l(m), ...h, "", "Codex session — a switch takes effect from the next message.", "", s].join(`
`)
            };
            let g = [u(m), ...l(m)];
            return m.available && m.available.length > 0 ? (g.push("", "Known models (other valid model ids are accepted too):"), g.push(...o(m.available))) : m.hasLiveQuery || g.push("", "No model list yet — send a message to start the session, then run /model again. You can still switch by id."), g.push(...h), g.push("", s), {
                responseText: g.join(`
`)
            }
        }
        if (zR(a)) return {
            responseText: `Invalid model id: "${a}" — a model id has no spaces. ${s}`
        };
        let c = await r.setSessionModel(n, a === "reset" ? null : a, i);
        if (!c.ok) return c.reason === "runtime_rejected" ? {
            responseText: `Model not changed: ${c.detail}`
        } : c.reason === "unsupported_runtime" ? {
            responseText: "/model is not supported on this runtime. Model not changed."
        } : c.reason === "profile_error" ? {
            responseText: `Model not changed: this session's model context profile config could not be resolved.

${c.detail}

Fix the offending claude.model_profiles entry (global = kernel/config/runtime.md, kind = kernel/config/<kind>.md, instance = the channel descriptor), then run /model again.`
        } : {
            responseText: "Session manager is not running; model not changed."
        };
        let d = "Model stored; the Claude runtime will rebuild before the next turn because the context profile changed.";
        if (c.model === null) {
            let m = r.getSessionModel ? await r.getSessionModel(n, i) : void 0,
                h = m?.configModel,
                g = h ? `the ${h.source} config default (${h.model})` : void 0;
            return c.applied === "stored_pending_rebuild" ? {
                responseText: `Session model reset to ${g??"the runtime default"}. ${d}`
            } : c.applied === "stored" && m?.runtime === "grok" ? {
                responseText: "Session model override cleared. The live grok session keeps its current model until the session is recreated (`/clear`)."
            } : g ? {
                responseText: c.applied === "live" ? `Session model reset to ${g}, applied to the live session.` : `Session model override cleared. ${Hle(g)} applies from the next turn.`
            } : {
                responseText: c.applied === "live" ? "Session model reset to the runtime default (applied to the live session)." : "Session model override cleared. The runtime default applies from the next turn."
            }
        }
        let f = c.listed === !1 ? "\n\nNote: this id is not in the session's known-models list (run /model to see it). If it is invalid, the next turn will say so — `/model reset` recovers." : "",
            p = c.contextWindow ? ` ${zXe(c.contextWindow)}` : c.contextProfile === "unprofiled" ? " No context profile is known; using the host/Claude CLI default." : "";
        return c.applied === "stored_pending_rebuild" ? {
            responseText: `Session model set to ${c.model}. ${d}${p}${f}`
        } : {
            responseText: (c.applied === "live" ? `Session model set to ${c.model}. Takes effect from the next turn.${p}` : `Session model stored as ${c.model}. It is applied when the session next starts a turn; if the id is invalid, that turn will say so — \`/model reset\` recovers.${p}`) + f
        }
    }
    if (t.name === "/effort") {
        if (!r?.getSessionEffort || !r?.setSessionEffort) return {
            responseText: "Effort switching is not available (no session manager attached)."
        };
        let o = "Switch: `/effort <level>` · Reset: `/effort reset`",
            s = qi.map(d => `- ${d}`),
            a = t.args.trim().toLowerCase(),
            u = d => {
                if (d.storedEffort) return `Session effort: ${d.storedEffort}`;
                let f = d.configEffort;
                return f ? `Session effort: (${f.effort}, from the ${f.source} config)` : "Session effort: (runtime default)"
            };
        if (!a) {
            let d = await r.getSessionEffort(n, i);
            if (d.runtime === "pi") return {
                responseText: [u(d), "", "Levels:", ...s, "", "Pi session — a switch is stored and the worker rebuilds with it on the next turn.", "", o].join(`
`)
            };
            if (d.runtime === "grok") return {
                responseText: [u(d), "", "Levels:", ...s, "", "Grok session — a switch applies to the live session.", "", o].join(`
`)
            };
            let f = [u(d), "", "Levels:"];
            return f.push(...s), d.runtime === "codex" && f.push("", "Codex session — a switch takes effect from the next message."), f.push("", o), {
                responseText: f.join(`
`)
            }
        }
        if (a === "reset") {
            let d = await r.setSessionEffort(n, null);
            if (!d.ok) return d.reason === "runtime_rejected" ? {
                responseText: `Effort not changed: ${d.detail}`
            } : d.reason === "unsupported_runtime" ? {
                responseText: "/effort is not supported on this runtime. Effort not changed."
            } : {
                responseText: "Session manager is not running; effort not changed."
            };
            let f = await r.getSessionEffort(n, i);
            if (d.applied === "stored" && f?.runtime === "grok") return {
                responseText: "Session effort override cleared. The live grok session keeps its current effort until the session is recreated (`/clear`)."
            };
            let p = f?.configEffort;
            if (p) {
                let m = `the ${p.source} config default (${p.effort})`;
                return {
                    responseText: d.applied === "live" ? `Session effort reset to ${m}, applied to the live session.` : `Session effort override cleared. ${Hle(m)} applies from the next message.`
                }
            }
            return {
                responseText: d.applied === "live" ? "Session effort reset to the runtime default (applied to the live session)." : "Session effort override cleared. The runtime default applies from the next message."
            }
        }
        if (!isEffortLevel(a)) return {
            responseText: `Invalid effort level: "${t.args.trim()}". Valid levels: ${qi.join(", ")}. ${o}`
        };
        let l = await r.setSessionEffort(n, a);
        if (!l.ok) return l.reason === "runtime_rejected" ? {
            responseText: `Effort not changed: ${l.detail}`
        } : l.reason === "unsupported_runtime" ? {
            responseText: "/effort is not supported on this runtime. Effort not changed."
        } : {
            responseText: "Session manager is not running; effort not changed."
        };
        let c = l.applied === "live" ? `Session effort set to ${a} (applied to the live session).` : `Session effort set to ${a}. Takes effect from the next message.`;
        return a === "max" && (await r.getSessionEffort(n, i)).runtime === "claude" ? {
            responseText: `${c} On a model without max support the Claude SDK runs it as high.`
        } : {
            responseText: c
        }
    }
    if (t.name === "/debug") {
        let o = await Qs(e, n),
            s = await ct(e, n),
            a = hashSessionKey(n);
        return {
            responseText: ["ALADUO Session Debug", `- session_key: ${n}`, `- current_cwd: ${s?.cwd??e.workDir}`, `- workspace_rel: ${o?.workspace_rel??"(default work root)"}`, `- sdk_session_id: ${s?.sdk_session_id??"unknown"}`, `- pending_gateway_notice: ${s?.pending_gateway_notice?"yes":"no"}`, "", "Filesystem Pointers", `- session_meta: ${resolveSessionMetaPath(e,n)}`, `- session_state: ${resolveSessionStatePath(e,n)}`, `- ingress_snapshots: ${ef.join(e.varIngressDir,a)}`, `- work_root: ${e.workDir}`, `- jobs_active: ${ef.join(e.jobsDir,"active")}`].join(`
`)
        }
    }
    return Z("[gateway] unsupported command", {
        command: t.raw,
        command_name: t.name
    }), {
        responseText: [`Unsupported command: ${t.raw}`, Ble].join(`
`)
    }
}
