// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: createAgentSdkAdapter  (minified: jf, daemon.pretty.js:55529)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in v0.6.0, v0.6.2, v0.7.0, v0.8.0, v0.8.1, v0.8.4 (maps/history_daemon.json)
// locals: 104 renamed — 25 from the code at the binding (rule), 79 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): **Claude Code's own auto memory is off** in every Claude session duoduo starts, because it would keep a second memory store beside duoduo's.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createAgentSdkAdapter() {
    let buildQueryOptions = (input, queryFlags) => {
        let options = {},
            sdkDebug = !!process.env.ALADUO_SDK_DEBUG;
        sdkDebug && (options.debug = !0, options.stderr = line => {
            logAlwaysAtLevel("debug", "[claude-sdk stderr]", line)
        }), input.sessionId && (options.resume = input.sessionId), input.abortController && (options.abortController = input.abortController), input.cwd && (options.cwd = input.cwd), input.settingSources && (options.settingSources = input.settingSources), input.persistSession !== void 0 && (options.persistSession = input.persistSession), "outputFormat" in input && input.outputFormat && (options.outputFormat = input.outputFormat), "model" in input && input.model && (options.model = input.model), "effort" in input && input.effort && (options.effort = input.effort);
        let permissionMode = input.permissionMode ?? process.env.ALADUO_PERMISSION_MODE ?? "bypassPermissions";
        if (permissionMode && (options.permissionMode = permissionMode), input.systemPrompt !== void 0) options.systemPrompt = input.systemPrompt;
        else {
            let optionalEnvString = normalizeOptionalEnvString(process.env.SYSTEM_PROMPT),
                optionalEnvString2 = normalizeOptionalEnvString(process.env.APPEND_SYSTEM_PROMPT),
                trimmed = [resolveMetaPromptText(), optionalEnvString2].filter(part => !!part).join(`

`).trim();
            optionalEnvString && trimmed ? options.systemPrompt = `${optionalEnvString}

${trimmed}` : optionalEnvString ? options.systemPrompt = optionalEnvString : trimmed && (options.systemPrompt = {
                type: "preset",
                preset: "claude_code",
                append: trimmed
            })
        }
        if (options.systemPrompt !== void 0 && (options.systemPrompt = disableSystemPromptSnapshot(options.systemPrompt)), input.allowedTools !== void 0 && (options.allowedTools = input.allowedTools), input.tools !== void 0) {
            let tools = [...new Set(input.tools)];
            if (options.tools = tools, logAlwaysAtLevel("info", `[claude-sdk] built-in tool surface (${tools.length}): ${tools.join(",")}`), input.allowedTools?.length) {
                let deadAllowedToolEntries = findDeadAllowedToolEntries(input.allowedTools, tools);
                deadAllowedToolEntries.length > 0 && logWarnMessage(`[claude-sdk] allowedTools no longer adds built-in tools to the surface (allowlist-only via claude.tools); not on this session's surface: ${deadAllowedToolEntries.join(",")} — move them to the descriptor's claude: { tools: [...] } if you meant to enable them`)
            }
        }
        if (input.disallowedTools !== void 0) {
            let {
                mcpTools,
                builtIns
            } = splitDisallowedToolsForClaude(input.disallowedTools);
            builtIns.length > 0 && logWarnMessage(`[claude-sdk] disallowedTools no longer governs built-in tools (allowlist-only via claude.tools); ignoring: ${builtIns.join(",")}`), mcpTools.length > 0 && (options.disallowedTools = mcpTools)
        }
        input.mcpServers && (options.mcpServers = input.mcpServers), input.additionalDirectories !== void 0 && (options.additionalDirectories = input.additionalDirectories);
        let env = {
            ...process.env
        };
        delete env.CLAUDECODE, (input.additionalDirectories?.length ?? 0) > 0 && input.autoloadAdditionalDirectoryClaudeMd !== !1 ? env.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = "1" : input.autoloadAdditionalDirectoryClaudeMd === !1 && delete env.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD, env.CLAUDE_CODE_DISABLE_AUTO_MEMORY = "1", input.callerSession ? env[tl] = input.callerSession : delete env[tl], options.env = env, "claudeSettingsPath" in input && input.claudeSettingsPath && (options.settings = input.claudeSettingsPath);
        let CLAUDECODEEXECUTABLE = process.env.CLAUDE_CODE_EXECUTABLE;
        if (CLAUDECODEEXECUTABLE && CLAUDECODEEXECUTABLE.trim().length > 0 && (options.pathToClaudeCodeExecutable = CLAUDECODEEXECUTABLE), "hooks" in input && input.hooks && (options.hooks = input.hooks), queryFlags?.includePartialMessages && (options.includePartialMessages = !0), sdkDebug) {
            let debugOptions = {
                cwd: options.cwd,
                settingSources: options.settingSources,
                persistSession: options.persistSession,
                permissionMode: options.permissionMode,
                allowedTools: options.allowedTools,
                disallowedTools: options.disallowedTools,
                tools: options.tools,
                includePartialMessages: options.includePartialMessages
            };
            logAlwaysAtLevel("debug", "[claude-sdk debug] execPath:", process.execPath), logAlwaysAtLevel("debug", "[claude-sdk debug] PATH:", process.env.PATH), logAlwaysAtLevel("debug", "[claude-sdk debug] options:", JSON.stringify(debugOptions))
        }
        return options
    };
    return {
        async run(runInput) {
            Jge();
            let sessionId = runInput.sessionId,
                resultText, structured, streamedText = "",
                turnStreamedText = "",
                now = Date.now(),
                firstTokenSeen = !1,
                firstTokenLatencyMs, usage, claudeCostBaseline = resolveClaudeCostBaseline(runInput.sessionId, runInput.costBaseline),
                lastResult, skipActive = !1,
                skipCalled = !1,
                hasResultOutput = !1,
                sdkDebug = !!process.env.ALADUO_SDK_DEBUG,
                queryOptions = buildQueryOptions(runInput, {
                    includePartialMessages: !!runInput.onStream
                });
            {
                let hooks = queryOptions.hooks ?? {},
                    preToolUseHooks = hooks.PreToolUse ?? [];
                preToolUseHooks.push({
                    matcher: wc,
                    hooks: [async hookInput => (hookInput?.agent_id !== void 0 || (skipCalled = !0, skipActive = !0, logInfoMessage("[claude-sdk] Skip detected via PreToolUse hook (non-streaming)")), {
                        continue: !1,
                        stopReason: "The agent intentionally ended this turn silently by calling Skip."
                    })]
                }), hooks.PreToolUse = preToolUseHooks, queryOptions.hooks = hooks
            }
            let emitStream = (text, isDelta, isSidechain = !1) => {
                    if (!(!runInput.onStream || !text) && !skipActive) {
                        if (firstTokenSeen || (firstTokenSeen = !0, firstTokenLatencyMs = Date.now() - now, logLatencyStageTelemetry("sdk_first_token", runInput.sessionId ?? "new", {
                                ttftMs: firstTokenLatencyMs
                            })), isSidechain) {
                            runInput.onStream(text, !0);
                            return
                        }
                        if (isDelta) {
                            streamedText += text, turnStreamedText += text, runInput.onStream(text, !1);
                            return
                        }
                        if (turnStreamedText && text.startsWith(turnStreamedText)) {
                            let suffix = text.slice(turnStreamedText.length);
                            suffix && (streamedText += suffix, turnStreamedText = text, runInput.onStream(suffix, !1));
                            return
                        }
                        if (text.startsWith(streamedText)) {
                            let suffix = text.slice(streamedText.length);
                            suffix && (streamedText = text, turnStreamedText += suffix, runInput.onStream(suffix, !1));
                            return
                        }
                        streamedText += text, turnStreamedText += text, runInput.onStream(text, !1)
                    }
                },
                map = new Map,
                map2 = new Map,
                emitExecutionEvent = event => {
                    if (runInput.onExecutionEvent) try {
                        runInput.onExecutionEvent(event)
                    } catch {}
                },
                emitAssistantToolUses = message => {
                    let messageContent = message.message?.content;
                    if (Array.isArray(messageContent))
                        for (let block of messageContent) {
                            if (!block || typeof block != "object") continue;
                            if (block.type === "tool_use") {
                                let id = block.id,
                                    name = block.name,
                                    input = block.input;
                                id && name && (map.set(id, name), emitExecutionEvent({
                                    type: "tool_use",
                                    toolUseId: id,
                                    toolName: name,
                                    input
                                }))
                            }
                        }
                },
                positiveMsEnv = parsePositiveMsEnv(process.env.ALADUO_ABORT_CLOSE_TIMEOUT_MS, 1e4),
                abortCloseTimer = null,
                forceClosed = !1,
                holdInputOpen = runInput.holdInputOpenForBackgroundAgents === !0,
                inFlightAgentTaskIds = new Set,
                resultSeen = !1,
                inputReleased = !holdInputOpen,
                releaseInput = () => {},
                inputHoldPromise = holdInputOpen ? new Promise(resolve => {
                    releaseInput = resolve
                }) : Promise.resolve(),
                positiveMsEnv2 = parsePositiveMsEnv(process.env.ALADUO_HOLD_INPUT_IDLE_TIMEOUT_MS, 6e5),
                idleTimer = null,
                clearIdleTimer = () => {
                    idleTimer && (clearTimeout(idleTimer), idleTimer = null)
                },
                maybeReleaseInput = () => {
                    inputReleased || resultSeen && inFlightAgentTaskIds.size === 0 && (inputReleased = !0, clearIdleTimer(), releaseInput())
                },
                forceReleaseInput = () => {
                    inputReleased || (inputReleased = !0, clearIdleTimer(), releaseInput())
                },
                armIdleWatchdog = () => {
                    !holdInputOpen || inputReleased || (clearIdleTimer(), resultSeen && (idleTimer = setTimeout(() => {
                        inputReleased || (logAlwaysAtLevel("warn", "[claude-sdk] hold-input idle watchdog fired — SDK went silent with background Agent task(s) still tracked; force-releasing stdin to avoid an unbounded hang. If this was a legitimate long-running task, its continuation's in-process MCP call may fail; investigate.", JSON.stringify({
                            idleTimeoutMs: positiveMsEnv2,
                            inFlightAgentTaskIds: Array.from(inFlightAgentTaskIds)
                        })), forceReleaseInput())
                    }, positiveMsEnv2), typeof idleTimer == "object" && idleTimer?.unref && idleTimer.unref()))
                };
            async function* heldPromptGenerator() {
                let promptStream = typeof runInput.prompt == "string" ? stringToMessageGenerator(runInput.prompt) : runInput.prompt;
                for await (let promptMessage of promptStream) yield promptMessage;
                await inputHoldPromise
            }
            let query = Hge({
                    prompt: holdInputOpen ? heldPromptGenerator() : runInput.prompt,
                    options: queryOptions
                }),
                onAbort = () => {
                    abortCloseTimer = setTimeout(() => {
                        forceClosed = !0, logDebugMessage("[claude-sdk] abort close timeout reached, closing query"), query.close()
                    }, positiveMsEnv)
                };
            runInput.abortController?.signal.aborted ? onAbort() : runInput.abortController?.signal.addEventListener("abort", onAbort, {
                once: !0
            });
            let turnAcknowledged = !1,
                acknowledgeTurn = () => {
                    if (!turnAcknowledged) {
                        turnAcknowledged = !0;
                        try {
                            runInput.onTurnAcknowledged?.()
                        } catch {}
                    }
                };
            try {
                for await (let sdkMessage of query) {
                    let msg = sdkMessage;
                    if (msg.type === "system" && msg.subtype === "init" || acknowledgeTurn(), msg.type === "system") {
                        if (msg.subtype === "init" && (sessionId = msg.session_id ?? sessionId), holdInputOpen && msg.subtype === "task_started") {
                            let taskStarted = msg,
                                taskType = typeof taskStarted.task_type == "string" ? taskStarted.task_type : void 0,
                                isAgentTask = taskStarted.subagent_type !== void 0 && taskStarted.subagent_type !== null || taskType !== void 0 && taskType !== "local_bash";
                            typeof taskStarted.task_id == "string" && taskStarted.task_id.length > 0 && isAgentTask && inFlightAgentTaskIds.add(taskStarted.task_id)
                        }
                        if (holdInputOpen && msg.subtype === "task_notification") {
                            let taskNotification = msg;
                            typeof taskNotification.task_id == "string" && inFlightAgentTaskIds.delete(taskNotification.task_id)
                        }
                        emitExecutionEvent({
                            type: "system",
                            subtype: msg.subtype ?? "unknown",
                            data: msg.subtype === "init" ? {
                                session_id: msg.session_id
                            } : void 0
                        })
                    }
                    if (msg.type === "stream_event") {
                        let isSidechain = hasParentToolUseId(msg),
                            streamTextDeltas = extractStreamTextDeltas(msg.event);
                        for (let chunk of streamTextDeltas) emitStream(chunk.text, chunk.isDelta, isSidechain);
                        let streamThinkingText = extractStreamThinkingText(msg.event);
                        for (let thought of streamThinkingText) emitExecutionEvent({
                            type: "thought_chunk",
                            text: thought
                        });
                        let toolUseBlockStart = parseToolUseBlockStart(msg.event);
                        toolUseBlockStart && (map2.set(toolUseBlockStart.index, {
                            toolUseId: toolUseBlockStart.toolUseId,
                            toolName: toolUseBlockStart.toolName
                        }), map.set(toolUseBlockStart.toolUseId, toolUseBlockStart.toolName), emitExecutionEvent({
                            type: "tool_use",
                            toolUseId: toolUseBlockStart.toolUseId,
                            toolName: toolUseBlockStart.toolName,
                            input: void 0,
                            ephemeral: !0
                        }));
                        let inputJsonDelta = parseInputJsonDelta(msg.event);
                        if (inputJsonDelta) {
                            let toolBlock = map2.get(inputJsonDelta.index);
                            toolBlock && emitExecutionEvent({
                                type: "tool_input_delta",
                                toolUseId: toolBlock.toolUseId,
                                toolName: toolBlock.toolName,
                                partialJson: inputJsonDelta.partialJson
                            })
                        }
                    }
                    if (typeof msg.type == "string" && msg.type.includes("assistant")) {
                        let isSidechain = hasParentToolUseId(msg),
                            sdkMessageTextChunks = extractSdkMessageTextChunks(msg);
                        for (let chunk of sdkMessageTextChunks) emitStream(chunk.text, chunk.isDelta, isSidechain);
                        emitAssistantToolUses(msg)
                    }
                    if (msg.type === "user") {
                        let messageContent = msg.message?.content;
                        if (Array.isArray(messageContent))
                            for (let block of messageContent) {
                                if (!block || typeof block != "object") continue;
                                if (block.type === "tool_result") {
                                    let toolUseId = block.tool_use_id,
                                        isError = block.is_error ?? !1,
                                        content = block.content;
                                    toolUseId && (emitExecutionEvent({
                                        type: "tool_result",
                                        toolUseId,
                                        toolName: map.get(toolUseId),
                                        isError,
                                        summary: stringifyToolResultContent(content)
                                    }), turnStreamedText = "")
                                }
                            }
                    }
                    if (msg.type === "result" && msg.subtype === "success")
                        if (skipActive) usage = mapClaudeResultToDrainUsage(msg, claudeCostBaseline);
                        else {
                            let resultString = typeof msg.result == "string" ? msg.result : "";
                            resultString.length > 0 && (resultText = resultString, hasResultOutput = !0), msg.structured_output !== void 0 && (structured = msg.structured_output, hasResultOutput = !0), usage = mapClaudeResultToDrainUsage(msg, claudeCostBaseline)
                        } msg.type === "result" && (skipActive = !1, lastResult = msg), holdInputOpen && msg.type === "result" && (resultSeen = !0, maybeReleaseInput()), holdInputOpen && !inputReleased && armIdleWatchdog()
                }
                if (forceClosed) throw createAbortErrorWithCause("SDK run force-closed after abort timeout", new Error("abort close timeout"))
            } catch (err) {
                throw sdkDebug && logAlwaysAtLevel("error", "[claude-sdk error]", err instanceof Error ? err.stack ?? err.message : String(err)), runInput.abortController?.signal.aborted && !isAbortLikeError(err) ? createAbortErrorWithCause("SDK run aborted", err) : err
            } finally {
                abortCloseTimer && clearTimeout(abortCloseTimer), runInput.abortController?.signal.removeEventListener("abort", onAbort), forceReleaseInput()
            }
            let skipped = skipCalled && !hasResultOutput;
            return {
                sessionId,
                text: skipped ? void 0 : resultText ?? (streamedText || void 0),
                structured: skipped ? void 0 : structured,
                usage,
                costBaseline: buildClaudeCostBaseline(sessionId, lastResult?.total_cost_usd, lastResult?.modelUsage),
                firstTokenLatencyMs,
                skipped: skipped || void 0
            }
        },
        createStreamingQuery(streamInput) {
            return Jge(), {
                query: Hge({
                    prompt: streamInput.prompt,
                    options: buildQueryOptions(streamInput, {
                        includePartialMessages: !0
                    })
                })
            }
        }
    }
}
