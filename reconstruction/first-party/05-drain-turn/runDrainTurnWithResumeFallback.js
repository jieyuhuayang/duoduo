// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runDrainTurnWithResumeFallback  (minified: zyt, daemon.pretty.js:74008)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.5.1, v0.5.7, v0.6.0, v0.7.0, v0.7.1, v0.8.0 (maps/history_daemon.json)
// locals: 55 renamed — 16 from the code at the binding (rule), 39 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runDrainTurnWithResumeFallback(paths, sessionKey, sdk, request) {
    let {
        sessionId,
        forkFrom,
        prompt,
        mcpServers,
        mcpServersFactory,
        attachments,
        runtime,
        usesStreamingAdapter,
        ...runOptions
    } = request;
    isClaudeRuntimeOrDefault(runtime) && !usesStreamingAdapter && logAlwaysAtLevel("info", "[claude-context-profile] non-streaming subprocess spawned", {
        sessionKey,
        model: runOptions.model ?? "default",
        context_profile_source: describeContextProfileSource(runOptions.claudeContextRequirement),
        max_context_token: resolveContextCapToken({
            requirement: runOptions.claudeContextRequirement,
            hostMaxContextTokens: process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS,
            liveGenerationToken: void 0
        }),
        ...extractProfiledEndpointFields(runOptions.claudeContextRequirement),
        alias_tiers: listSortedAliasKeys(runOptions.claudeModelAliases)
    });
    let onStream = runOptions.onStream,
        onExecutionEvent = runOptions.onExecutionEvent,
        baseRunOptions = {
            ...runOptions
        },
        createThoughtSplitter = () => new AA(chunk => onStream?.(chunk), thought => onExecutionEvent?.({
            type: "thought_chunk",
            text: thought
        })),
        thoughtSplitter;
    onStream && (thoughtSplitter = createThoughtSplitter(), baseRunOptions.onStream = (chunk, isFinal) => {
        if (isFinal) {
            onStream(chunk, !0);
            return
        }
        thoughtSplitter.push(chunk)
    }, baseRunOptions.onExecutionEvent = event => {
        event.type === "tool_result" && thoughtSplitter.reset(), onExecutionEvent?.(event)
    });
    let finalizeResult = (result, extra) => {
            thoughtSplitter?.flush();
            let text = result.text;
            if (text) {
                let split = PEe(text);
                if (text = split.text, !onStream && split.thoughts.length > 0 && onExecutionEvent)
                    for (let thought of split.thoughts) onExecutionEvent({
                        type: "thought_chunk",
                        text: thought
                    })
            }
            return {
                ...result,
                text,
                ...extra
            }
        },
        messageOptions = {
            runtimeDir: paths.runtimeDir
        },
        isNonClaude = !isClaudeRuntimeOrDefault(runtime),
        claudeAttachments = isNonClaude ? void 0 : attachments,
        adapterAttachments = isNonClaude ? attachments : void 0,
        buildPrompt = () => runtime === "pi" ? jyt(prompt) : eventToMessageGenerator(prompt, claudeAttachments, messageOptions),
        promptInput = buildPrompt(),
        buildRunRequest = (promptArg, resumeSessionId, forkFromSessionId) => {
            let resolvedMcpServers = mcpServersFactory ? mcpServersFactory() : mcpServers,
                runRequest = {
                    prompt: promptArg,
                    sessionId: resumeSessionId,
                    forkFrom: forkFromSessionId,
                    ...adapterAttachments ? {
                        attachments: adapterAttachments
                    } : {},
                    ...baseRunOptions
                };
            return resolvedMcpServers === void 0 ? runRequest : {
                ...runRequest,
                mcpServers: resolvedMcpServers
            }
        };
    if (forkFrom) {
        let now = Date.now(),
            result = await sdk.run(buildRunRequest(promptInput, void 0, forkFrom));
        return finalizeResult(result, {
            usedFallback: !1,
            turnStartedAt: now
        })
    }
    if (!sessionId) {
        let now = Date.now(),
            result = await sdk.run(buildRunRequest(promptInput, sessionId));
        return finalizeResult(result, {
            usedFallback: !1,
            turnStartedAt: now
        })
    }
    let now = Date.now();
    try {
        let result = await sdk.run(buildRunRequest(promptInput, sessionId));
        return finalizeResult(result, {
            usedFallback: !1,
            turnStartedAt: now
        })
    } catch (err) {
        if (isAbortLikeError(err) || isAgentSdkTurnInterruptedError(err) || isAgentSdkPromptNotAcceptedAbortError(err)) throw err;
        if (thoughtSplitter && (thoughtSplitter.flush(), thoughtSplitter = createThoughtSplitter(), baseRunOptions.onStream = (chunk, isFinal) => {
                if (isFinal) {
                    onStream(chunk, !0);
                    return
                }
                thoughtSplitter.push(chunk)
            }), runtime === "codex") {
            let skippedAt = (await readSessionRuntimeState(paths, sessionKey).catch(() => null))?.pending_skip_rewind?.skipped_at;
            if (skippedAt) {
                let skippedAtMs = Date.parse(skippedAt);
                Number.isFinite(skippedAtMs) && skippedAtMs >= now && await clearSessionRuntimeStateField(paths, sessionKey, "pending_skip_rewind").catch(() => {})
            }
        }
        let freshPrompt = buildPrompt(),
            now2 = Date.now(),
            result = await sdk.run(buildRunRequest(freshPrompt));
        return finalizeResult(result, {
            usedFallback: !0,
            resumeError: err instanceof Error ? err.message : String(err),
            turnStartedAt: now2
        })
    }
}
