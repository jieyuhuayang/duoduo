// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: executeGatewayCommand  (minified: Fet, daemon.pretty.js:87857)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.4.0, v0.5.0, v0.5.3, v0.5.5, v0.5.6, v0.5.7, v0.6.0, v0.7.0, v0.7.1, v0.8.0, v0.8.1, v0.8.3, v0.8.4 (maps/history_daemon.json)
// locals: 92 renamed — 12 from the code at the binding (rule), 80 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.3 (high): On a Claude model without `max` support the request runs as `high`, and the `/effort max` reply says so.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function executeGatewayCommand(paths, command, sessionKey, gatewayCommands, callerContext) {
    if (command.name === "unsupported") return logWarnMessage("[gateway] unsupported command", {
        command: command.raw,
        command_name: command.name
    }), {
        responseText: [`Unsupported command: ${command.raw}`, cde].join(`
`)
    };
    if (command.name === "injection-usage") return {
        responseText: command.usage
    };
    if (command.name === "/clear") {
        if (!gatewayCommands?.clearSession) return {
            responseText: ["Session clear is unavailable.", "This daemon instance has no active session manager."].join(`
`)
        };
        let clearResult = await gatewayCommands.clearSession(sessionKey);
        return clearResult.cleared ? {
            responseText: ["SDK session cleared.", `- session_key: ${sessionKey}`, `- previous_session_id: ${clearResult.previousSessionId??"none"}`, "- status: new session will start on next message"].join(`
`),
            noticeSummary: clearResult.previousSessionId !== void 0 ? `This session was reset — start fresh, do not resume the prior session's pending work. Previous session id ${clearResult.previousSessionId} is retained: if the user recalls something from before the reset, use it to look up that session's history.` : "This session was reset — start fresh, do not resume the prior session's pending work. There was no prior agent session to retain."
        } : {
            responseText: ["Session clear failed.", `- session_key: ${sessionKey}`, clearResult.reason ? `- reason: ${clearResult.reason}` : "- reason: unknown"].join(`
`)
        }
    }
    if (command.name === "/cancel") {
        if (!gatewayCommands?.cancelSession) return {
            responseText: ["Cancellation control is unavailable.", "This daemon instance has no active session interrupt controller."].join(`
`)
        };
        let cancelResult = await gatewayCommands.cancelSession(sessionKey);
        return cancelResult.interrupted ? {
            responseText: ["Cancellation requested.", `- session_key: ${sessionKey}`, "- status: interrupted active turn"].join(`
`)
        } : {
            responseText: ["No active turn to cancel.", `- session_key: ${sessionKey}`, cancelResult.reason ? `- reason: ${cancelResult.reason}` : "- reason: idle"].join(`
`)
        }
    }
    if (command.name === "/status") {
        let status = await readStatus(paths),
            actors = gatewayCommands?.listActors?.(),
            persistentSessions = gatewayCommands?.listPersistentSessions?.() ?? [],
            liveSessionKeys = new Set,
            activeCount = 0,
            idleCount = 0,
            errorCount = 0;
        if (actors)
            for (let actor of actors.values()) actor.status !== "ended" && (liveSessionKeys.add(actor.sessionKey), actor.status === "active" ? activeCount++ : actor.status === "idle" && idleCount++, actor.health === "error" && errorCount++);
        let persistedOnlyCount = 0;
        for (let persistentSession of persistentSessions) liveSessionKeys.has(persistentSession.session_key) || (persistedOnlyCount++, idleCount++, persistentSession.last_error && errorCount++);
        let totalCount = liveSessionKeys.size + persistedOnlyCount;
        return {
            responseText: ["ALADUO Status", `- gateway: ${status?.health.gateway??"unknown"}`, `- meta_session: ${status?.health.meta_session??"unknown"}`, `- cadence_last_tick: ${status?.cadence.last_tick??"never"}`, `- sessions: total=${totalCount}, active=${activeCount}, idle=${idleCount}, error=${errorCount}`].join(`
`)
        }
    }
    if (command.name === "/stats") {
        let {
            readAllSessionSummaries
        } = await Promise.resolve().then(() => (Zu(), pq)), date = new Date(Date.now() - 1440 * 60 * 1e3), sessionSummaries = await readAllSessionSummaries(paths, date), totalDrains = 0, totalInputTokens = 0, totalOutputTokens = 0, totalCostUsd = 0, totalSdkSeconds = 0;
        for (let summary of Object.values(sessionSummaries)) totalDrains += summary.total_drains, totalInputTokens += summary.total_input_tokens, totalOutputTokens += summary.total_output_tokens, totalCostUsd += summary.total_cost_usd, totalSdkSeconds += summary.total_sdk_duration_ms / 1e3;
        return {
            responseText: ["ALADUO Usage Statistics (Last 24h)", `- Drains (Tasks): ${totalDrains}`, `- Tokens: Input (${totalInputTokens.toLocaleString()}) | Output (${totalOutputTokens.toLocaleString()})`, `- Cost (USD): $${totalCostUsd.toFixed(4)}`, `- SDK Duration: ${totalSdkSeconds.toFixed(1)}s`].join(`
`)
        }
    }
    if (command.name === "/task") {
        let {
            readRecentDrainRecords
        } = await Promise.resolve().then(() => (Zu(), pq)), taskActors = gatewayCommands?.listActors?.(), taskPersistentSessions = gatewayCommands?.listPersistentSessions?.() ?? [], map = new Map(taskPersistentSessions.map(session => [session.session_key, session])), activeTasks = [];
        if (taskActors)
            for (let actor of taskActors.values()) {
                if (actor.status !== "active" || actor.sessionKey === sessionKey) continue;
                let persistentSession = map.get(actor.sessionKey);
                activeTasks.push({
                    session_key: actor.sessionKey,
                    last_event_at: persistentSession?.last_event_at ?? null
                })
            }
        activeTasks.sort((left, right) => left.session_key.localeCompare(right.session_key));
        let parts = command.args.trim().split(/\s+/);
        if (parts.length > 0 && parts[0] === "kill") {
            let taskNumberText = parts[1],
                taskNumber = parseInt(taskNumberText, 10);
            if (isNaN(taskNumber) || taskNumber < 1 || taskNumber > activeTasks.length) return {
                responseText: `Invalid task number: ${taskNumberText}. Use /task to see valid numbers.`
            };
            let task = activeTasks[taskNumber - 1];
            if (gatewayCommands?.cancelSession) {
                let killResult = await gatewayCommands.cancelSession(task.session_key);
                return killResult.interrupted ? {
                    responseText: `Cancellation requested for task ${taskNumber} (${task.session_key}).`
                } : {
                    responseText: `Could not cancel task ${taskNumber} (${task.session_key}): ${killResult.reason??"unknown"}.`
                }
            }
            return {
                responseText: "Session cancel is unavailable."
            }
        }
        let recentDrains = await readRecentDrainRecords(paths, 10),
            activeTaskRows = activeTasks.map((task, i) => ({
                index: i + 1,
                session_key: task.session_key,
                last_event_at: task.last_event_at
            })),
            recentTaskRows = recentDrains.map((drain, i) => ({
                index: activeTasks.length + i + 1,
                session_key: drain.session_key,
                started_at: drain.drain_started_at,
                duration_ms: drain.drain_duration_ms,
                cost_usd: drain.usage?.total_cost_usd ?? 0,
                tool_calls: drain.tool_calls
            })),
            lines = ["ALADUO Tasks"];
        return lines.push(`
### Active Running Tasks`), activeTasks.length === 0 ? lines.push("No active tasks.") : (activeTaskRows.forEach(row => {
            lines.push(`${row.index}. [${row.session_key}] (started ${row.last_event_at||"unknown"})`)
        }), lines.push("\nTo cancel a task, use `/task kill <number>`.")), lines.push(`
### Recent Finished Tasks (Top 10)`), recentDrains.length === 0 ? lines.push("No recent tasks.") : recentTaskRows.forEach(row => {
            lines.push(`- [${row.session_key}] cost: $${row.cost_usd.toFixed(4)}, tools: ${row.tool_calls}, time: ${row.started_at}`)
        }), {
            responseText: lines.join(`
`),
            data: {
                type: "task",
                active: activeTaskRows,
                recent: recentTaskRows
            }
        }
    }
    if (command.name === "/config") return {
        responseText: ["ALADUO Config (Safe View)", "- channels: stdio, lark, dingtalk", `- cadence_interval_ms: ${process.env.ALADUO_CADENCE_INTERVAL_MS??"2220000"}`, `- permission_mode: ${process.env.ALADUO_PERMISSION_MODE??"default"}`, `- model_opus: ${process.env.ANTHROPIC_DEFAULT_OPUS_MODEL??"unset"}`, `- model_sonnet: ${process.env.ANTHROPIC_DEFAULT_SONNET_MODEL??"unset"}`, `- model_haiku: ${process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL??"unset"}`].join(`
`)
    };
    if (command.name === "/model") {
        if (!gatewayCommands?.getSessionModel || !gatewayCommands?.setSessionModel) return {
            responseText: "Model switching is not available (no session manager attached)."
        };
        let formatModelList = models => (models ?? []).map(model => `- ${model.value}${model.displayName?` — ${model.displayName}`:""}`),
            switchHint = "Switch: `/model <model-id>` · Reset: `/model reset`",
            trimmed = command.args.trim(),
            describeSessionModel = modelInfo => {
                if (modelInfo.storedModel) return `Session model: ${modelInfo.storedModel}`;
                let configModel = modelInfo.configModel;
                if (configModel) return `Session model: (${configModel.model}, from the ${configModel.source} config)`;
                let cliDefaultModel = modelInfo.cliDefaultModel;
                if (!cliDefaultModel) return "Session model: (runtime default)";
                let originLabel = cliDefaultModel.origin === "env" ? "via ANTHROPIC_MODEL" : `via ${cliDefaultModel.origin} settings`;
                return `Session model: (runtime default → ${cliDefaultModel.model} ${originLabel})`
            },
            lastServedModelLines = modelInfo => modelInfo.lastServedModel ? [`Last served model: ${modelInfo.lastServedModel}`] : [];
        if (!trimmed) {
            let sessionModel = await gatewayCommands.getSessionModel(sessionKey, callerContext);
            if (sessionModel.refusal) return {
                responseText: sessionModel.refusal
            };
            if (sessionModel.runtime === "pi") return {
                responseText: [sessionModel.storedModel ? `Session model: ${sessionModel.storedModel}` : sessionModel.configModel ? `Session model: (${sessionModel.configModel.model}, from the ${sessionModel.configModel.source} config)` : "Session model: (none set — a pi session cannot run a turn until one is set)", ...lastServedModelLines(sessionModel), ...jet(sessionModel.piProviders), "", "Pi session — a switch is stored and the worker rebuilds with it on the next turn.", "", "Switch: `/model <provider>/<modelId>` · Reset: `/model reset`"].join(`
`)
            };
            let extraModelLines = Let(sessionModel);
            if (sessionModel.runtime === "grok") return {
                responseText: [describeSessionModel(sessionModel), ...lastServedModelLines(sessionModel), "", "Grok session — a switch applies to the live session.", "", switchHint].join(`
`)
            };
            if (sessionModel.runtime === "codex") return {
                responseText: [describeSessionModel(sessionModel), ...lastServedModelLines(sessionModel), ...extraModelLines, "", "Codex session — a switch takes effect from the next message.", "", switchHint].join(`
`)
            };
            let lines = [describeSessionModel(sessionModel), ...lastServedModelLines(sessionModel)];
            return sessionModel.available && sessionModel.available.length > 0 ? (lines.push("", "Known models (other valid model ids are accepted too):"), lines.push(...formatModelList(sessionModel.available))) : sessionModel.hasLiveQuery || lines.push("", "No model list yet — send a message to start the session, then run /model again. You can still switch by id."), lines.push(...extraModelLines), lines.push("", switchHint), {
                responseText: lines.join(`
`)
            }
        }
        if (containsWhitespaceChar(trimmed)) return {
            responseText: `Invalid model id: "${trimmed}" — a model id has no spaces. ${switchHint}`
        };
        let setResult = await gatewayCommands.setSessionModel(sessionKey, trimmed === "reset" ? null : trimmed, callerContext);
        if (!setResult.ok) return setResult.reason === "runtime_rejected" ? {
            responseText: `Model not changed: ${setResult.detail}`
        } : setResult.reason === "unsupported_runtime" ? {
            responseText: "/model is not supported on this runtime. Model not changed."
        } : setResult.reason === "profile_error" ? {
            responseText: `Model not changed: this session's model context profile config could not be resolved.

${setResult.detail}

Fix the offending claude.model_profiles entry (global = kernel/config/runtime.md, kind = kernel/config/<kind>.md, instance = the channel descriptor), then run /model again.`
        } : {
            responseText: "Session manager is not running; model not changed."
        };
        let rebuildNote = "Model stored; the Claude runtime will rebuild before the next turn because the context profile changed.";
        if (setResult.model === null) {
            let sessionModelAfter = gatewayCommands.getSessionModel ? await gatewayCommands.getSessionModel(sessionKey, callerContext) : void 0,
                resetConfigModel = sessionModelAfter?.configModel,
                configDefaultLabel = resetConfigModel ? `the ${resetConfigModel.source} config default (${resetConfigModel.model})` : void 0;
            return setResult.applied === "stored_pending_rebuild" ? {
                responseText: `Session model reset to ${configDefaultLabel??"the runtime default"}. ${rebuildNote}`
            } : setResult.applied === "stored" && sessionModelAfter?.runtime === "grok" ? {
                responseText: "Session model override cleared. The live grok session keeps its current model until the session is recreated (`/clear`)."
            } : configDefaultLabel ? {
                responseText: setResult.applied === "live" ? `Session model reset to ${configDefaultLabel}, applied to the live session.` : `Session model override cleared. ${fde(configDefaultLabel)} applies from the next turn.`
            } : {
                responseText: setResult.applied === "live" ? "Session model reset to the runtime default (applied to the live session)." : "Session model override cleared. The runtime default applies from the next turn."
            }
        }
        let unlistedNote = setResult.listed === !1 ? "\n\nNote: this id is not in the session's known-models list (run /model to see it). If it is invalid, the next turn will say so — `/model reset` recovers." : "",
            contextNote = setResult.contextWindow ? ` ${Met(setResult.contextWindow)}` : setResult.contextProfile === "unprofiled" ? " No context profile is known; using the host/Claude CLI default." : "";
        return setResult.applied === "stored_pending_rebuild" ? {
            responseText: `Session model set to ${setResult.model}. ${rebuildNote}${contextNote}${unlistedNote}`
        } : {
            responseText: (setResult.applied === "live" ? `Session model set to ${setResult.model}. Takes effect from the next turn.${contextNote}` : `Session model stored as ${setResult.model}. It is applied when the session next starts a turn; if the id is invalid, that turn will say so — \`/model reset\` recovers.${contextNote}`) + unlistedNote
        }
    }
    if (command.name === "/effort") {
        if (!gatewayCommands?.getSessionEffort || !gatewayCommands?.setSessionEffort) return {
            responseText: "Effort switching is not available (no session manager attached)."
        };
        let effortSwitchHint = "Switch: `/effort <level>` · Reset: `/effort reset`",
            levelLines = qi.map(level => `- ${level}`),
            requestedEffort = command.args.trim().toLowerCase(),
            describeSessionEffort = effortInfo => {
                if (effortInfo.storedEffort) return `Session effort: ${effortInfo.storedEffort}`;
                let configEffort = effortInfo.configEffort;
                return configEffort ? `Session effort: (${configEffort.effort}, from the ${configEffort.source} config)` : "Session effort: (runtime default)"
            };
        if (!requestedEffort) {
            let sessionEffort = await gatewayCommands.getSessionEffort(sessionKey, callerContext);
            if (sessionEffort.refusal) return {
                responseText: sessionEffort.refusal
            };
            if (sessionEffort.runtime === "pi") return {
                responseText: [describeSessionEffort(sessionEffort), "", "Levels:", ...levelLines, "", "Pi session — a switch is stored and the worker rebuilds with it on the next turn.", "", effortSwitchHint].join(`
`)
            };
            if (sessionEffort.runtime === "grok") return {
                responseText: [describeSessionEffort(sessionEffort), "", "Levels:", ...levelLines, "", "Grok session — a switch applies to the live session.", "", effortSwitchHint].join(`
`)
            };
            let effortLines = [describeSessionEffort(sessionEffort), "", "Levels:"];
            return effortLines.push(...levelLines), sessionEffort.runtime === "codex" && effortLines.push("", "Codex session — a switch takes effect from the next message."), effortLines.push("", effortSwitchHint), {
                responseText: effortLines.join(`
`)
            }
        }
        if (requestedEffort === "reset") {
            let resetResult = await gatewayCommands.setSessionEffort(sessionKey, null);
            if (!resetResult.ok) return resetResult.reason === "runtime_rejected" ? {
                responseText: `Effort not changed: ${resetResult.detail}`
            } : resetResult.reason === "unsupported_runtime" ? {
                responseText: "/effort is not supported on this runtime. Effort not changed."
            } : {
                responseText: "Session manager is not running; effort not changed."
            };
            let sessionEffortAfter = await gatewayCommands.getSessionEffort(sessionKey, callerContext);
            if (resetResult.applied === "stored" && sessionEffortAfter?.runtime === "grok") return {
                responseText: "Session effort override cleared. The live grok session keeps its current effort until the session is recreated (`/clear`)."
            };
            let defaultConfigEffort = sessionEffortAfter?.configEffort;
            if (defaultConfigEffort) {
                let configDefaultLabel = `the ${defaultConfigEffort.source} config default (${defaultConfigEffort.effort})`;
                return {
                    responseText: resetResult.applied === "live" ? `Session effort reset to ${configDefaultLabel}, applied to the live session.` : `Session effort override cleared. ${fde(configDefaultLabel)} applies from the next message.`
                }
            }
            return {
                responseText: resetResult.applied === "live" ? "Session effort reset to the runtime default (applied to the live session)." : "Session effort override cleared. The runtime default applies from the next message."
            }
        }
        if (!isEffortLevel(requestedEffort)) return {
            responseText: `Invalid effort level: "${command.args.trim()}". Valid levels: ${qi.join(", ")}. ${effortSwitchHint}`
        };
        let effortSetResult = await gatewayCommands.setSessionEffort(sessionKey, requestedEffort);
        if (!effortSetResult.ok) return effortSetResult.reason === "runtime_rejected" ? {
            responseText: `Effort not changed: ${effortSetResult.detail}`
        } : effortSetResult.reason === "unsupported_runtime" ? {
            responseText: "/effort is not supported on this runtime. Effort not changed."
        } : {
            responseText: "Session manager is not running; effort not changed."
        };
        let appliedText = effortSetResult.applied === "live" ? `Session effort set to ${requestedEffort} (applied to the live session).` : `Session effort set to ${requestedEffort}. Takes effect from the next message.`;
        return requestedEffort === "max" && (await gatewayCommands.getSessionEffort(sessionKey, callerContext)).runtime === "claude" ? {
            responseText: `${appliedText} On a model without max support the Claude SDK runs it as high.`
        } : {
            responseText: appliedText
        }
    }
    if (command.name === "/debug") {
        let sessionMetaFile = await readSessionMetaFile(paths, sessionKey),
            sessionRuntimeState = await readSessionRuntimeState(paths, sessionKey),
            sessionKeyHash = hashSessionKey(sessionKey);
        return {
            responseText: ["ALADUO Session Debug", `- session_key: ${sessionKey}`, `- current_cwd: ${sessionRuntimeState?.cwd??paths.workDir}`, `- workspace_rel: ${sessionMetaFile?.workspace_rel??"(default work root)"}`, `- sdk_session_id: ${sessionRuntimeState?.sdk_session_id??"unknown"}`, `- pending_gateway_notice: ${sessionRuntimeState?.pending_gateway_notice?"yes":"no"}`, "", "Filesystem Pointers", `- session_meta: ${resolveSessionMetaPath(paths,sessionKey)}`, `- session_state: ${resolveSessionStatePath(paths,sessionKey)}`, `- ingress_snapshots: ${mf.join(paths.varIngressDir,sessionKeyHash)}`, `- work_root: ${paths.workDir}`, `- jobs_active: ${mf.join(paths.jobsDir,"active")}`].join(`
`)
        }
    }
    return logWarnMessage("[gateway] unsupported command", {
        command: command.raw,
        command_name: command.name
    }), {
        responseText: [`Unsupported command: ${command.raw}`, cde].join(`
`)
    }
}
