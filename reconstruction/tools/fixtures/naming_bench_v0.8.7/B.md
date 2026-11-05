# Naming tasks: unnamed top-level code

Candidates are ordered leaf-first (a callee before the code that calls it) and grouped by subsystem, so a name
you give early is context for the later ones: when a later body calls a candidate you have already named, use
that name. Each group starts with its vocabulary: the real names already registered in the subsystem, the
CHANGELOG words paired to them, and the protocol package's type and field names that share a token with the code.
The body is printed with every known top-level name applied; only the candidates themselves are still short names.

For each candidate, in `toplevel.proposals.json` (a skeleton is written next to this file):
  1. `describe`: ONE sentence saying what the code does -- its inputs, the effect or value it produces -- from the
     property names, string literals, callers and callees. Write it before choosing a name, and never from a local's name.
  2. `names`: up to 3 candidate names, best first, in the spelling of the kind (a function camelCase, a module
     initialiser `init<Name>Module`, a literal constant UPPER_SNAKE), at least 8 and at most 40 characters, at most
     4 words, built from the vocabulary where it fits (the same verb for the same action: `resolve`, `render`,
     `build`, `ensure` as the subsystem uses them). Leave `names` empty for anything you cannot name with confidence.
  3. `subsystem`: keep the suggested directory or change it.
Then write the batch list (the first candidate of each) and check every proposal before writing it:

    node name_toplevel.mjs tsv toplevel.proposals.json toplevel.tsv
    node name_symbol.mjs --build <OUT> --dry-run <pretty.js> --batch toplevel.tsv

60 candidate(s) in 13 group(s), leaf-first.

## group 00-daemon-entry (9 candidates)

### vocabulary of 00-daemon-entry

registered names (25; the author's spelling -- reuse these verbs and nouns):
  create: createDaemon, createVoidAwareAttachmentCallbacks
  get: getCachedHostBootId, getPendingRestartReason
  is: isProcessAliveByPid, isRuntimeWriterLockStale
  parse: parseHostHeaderHostname, parseOriginHostname
  read: readEnvIntegerOrFallback, readStatus
  set: setPendingRestartReason, setSessionArchivedListener
  acquire: acquireRuntimeWriterLock
  build: buildInitialStatus
  claim: claimDaemonRestartReason
  compute: computeRuntimeId
  daemon: daemonRestartReasonPath
  deliver: deliverDaemonRestartWakes
  main: main
  reconcile: reconcileMainSession
  refresh: refreshRuntimeWriterLockHeartbeat
  release: releaseRuntimeWriterLock
  render: renderRestartWakeMessage
  resolve: resolveRuntimeWriterLockPath
  write: writeStatus
CHANGELOG words paired to this subsystem: --wake <session-or-alias>, -r "<what changed>", /rpc, duoduo daemon restart, main, maxPayload, [pid0] main session reconciliation error, ALADUO_SPINE_INDEX_RETENTION_DAYS, bodyLimit, bodyLimit: maxPayload, createDaemon, isVoidRuntimeSession, maxPayload = wsDefaultMaxPayload(), onAttach, pruneEventIdIndexByRetention, reconcileMainSession, void, wake_targets, wsDefaultMaxPayload
protocol types and fields (@openduo/protocol): SystemConfigResult.meta_prompt_path, type SessionConfigSettingsEnvConflict, SystemConfigResult.kernel_dir, SystemRuntimeInfo.kernel_dir, isChannelCommandParams(), isChannelRouteResult(), isSessionWakeParams(), SystemStatusResult.meta_session, type ChannelCommandParams, type ChannelRouteResult, type SessionWakeParams, type SessionWakeResult, ChannelCommandParams.command, ChannelIngressResult.gateway_response, describeMemoryReadProblem(), isMemoryReadParams(), OutboxRecord.routing, SessionCompactResult.candidates, SessionConfigResult.candidates, SessionConfigResult.settings_env_conflict, SessionConfigStats.history_post, SessionConfigStats.history_pre, SessionExecutionEvent.tool_use_id, SessionNotifyResult.candidates

### yR (literal constant, line 32682, leaf)

spell: UPPER_SNAKE with an underscore; suggested subsystem: 00-daemon-entry
used by: createDaemon [00-daemon-entry]
assigned in: nc (the body below is that assignment)
changelog: createDaemon (v0.7.0, changed): That interface now lives on a socket file that carries owner-only permissions, so the operating system enforces what nothing was enforcing before.
changelog: createDaemon (v0.8.7, changed): **Uploads over `/rpc` match WebSocket.** The full-access HTTP `/rpc` body limit now equals the WebSocket message limit, so an upload that works over WebSocket a

```js
yR = 104
```

### Cq (function, line 38142, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: createDaemon [00-daemon-entry], refreshSessionIndexEntry [02-gateway-rpc]
changelog: createDaemon (v0.7.0, changed): That interface now lives on a socket file that carries owner-only permissions, so the operating system enforces what nothing was enforcing before.
changelog: createDaemon (v0.8.7, changed): **Uploads over `/rpc` match WebSocket.** The full-access HTTP `/rpc` body limit now equals the WebSocket message limit, so an upload that works over WebSocket a
changelog: refreshSessionIndexEntry (v0.5.4, born): give a session a human label so it is legible in `list`

```js
function Cq(e, t, n, r) {
    let i = Unt(t, n, r);
    if (i === null) {
        e.remove(t);
        return
    }
    e.remove(t), e.upsert(i)
}
```

### gv (function, line 38355, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: createDaemon [00-daemon-entry], readGlobalUsageTotals [05-drain-turn]
changelog: createDaemon (v0.7.0, changed): That interface now lives on a socket file that carries owner-only permissions, so the operating system enforces what nothing was enforcing before.
changelog: createDaemon (v0.8.7, changed): **Uploads over `/rpc` match WebSocket.** The full-access HTTP `/rpc` body limit now equals the WebSocket message limit, so an upload that works over WebSocket a
changelog: readGlobalUsageTotals (v0.4.4, born): `usage.get` with `mode: "totals"` returns a single aggregate summary (~1KB vs ~230KB)

```js
function gv(e) {
    let t = createEmptyUsageSummary();
    for (let n of e) accumulateDrainRecordIntoSummary(t, n);
    return t
}
```

### NSt (function, line 92795, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: createDaemon [00-daemon-entry]
strings: "ambiguous", "not_found", "channel", "forbidden_kind", "void_session", " }; if (er(s.session_key)) return { ok: !1, reason: \"archiving\", target: o, sess", ", sourceName: i.source?.trim() || ", ", command: ", " }, { bus: t, gatewayCommands: r }); return u.routing.enqueued ? (t.emit(", ", { sessionKey: s.session_key, preempt: mK(", "delivery_failed", "command was not enqueued (gateway did not route /compact to the session mailbox)"
shares Gu: also used by createModelCommandResolvers, createSessionManager, appendBeforeExecuteGateway, scheduleSessionWakeRecord
related registered names: claimDaemonRestartReason, createVoidAwareAttachmentCallbacks, daemonRestartReasonPath, getPendingRestartReason, reconcileMainSession, renderRestartWakeMessage, setPendingRestartReason, setSessionArchivedListener
protocol: isChannelCommandParams(), isChannelRouteResult(), isSessionWakeParams(), type ChannelCommandParams, type ChannelRouteResult, type SessionWakeParams, type SessionWakeResult, ChannelCommandParams.command
changelog: createDaemon (v0.7.0, changed): That interface now lives on a socket file that carries owner-only permissions, so the operating system enforces what nothing was enforcing before.
changelog: createDaemon (v0.8.7, changed): **Uploads over `/rpc` match WebSocket.** The full-access HTTP `/rpc` body limit now equals the WebSocket message limit, so an upload that works over WebSocket a
changelog: resolveSessionByKeyOrAlias (v0.5.4, born): `duoduo session notify <target> -m "<msg>"` — wake another session by key or alias

```js
async function NSt(e, t, n, r, i) {
    let o = i.target.trim(),
        s = resolveSessionByKeyOrAlias(n, o);
    if (!s.ok) return s.reason === "ambiguous" ? {
        ok: !1,
        reason: "ambiguous",
        target: o,
        candidates: s.candidates
    } : {
        ok: !1,
        reason: "not_found",
        target: o
    };
    let a = classifySessionKey(s.session_key);
    if (a !== "channel") return {
        ok: !1,
        reason: "forbidden_kind",
        target: o,
        session_key: s.session_key,
        kind: a
    };
    if (await isVoidRuntimeSession(e, s.session_key)) return {
        ok: !1,
        reason: "void_session",
        target: o,
        session_key: s.session_key,
        error: `${Gu} It has no context to compact; nothing was queued.`
    };
    if (isSessionArchiving(s.session_key)) return {
        ok: !1,
        reason: "archiving",
        target: o,
        session_key: s.session_key
    };
    let u = await ingestChannelCommand(e, {
        sessionKey: s.session_key,
        sourceKind: "rpc",
        sourceName: i.source?.trim() || "session.compact",
        command: "/compact"
    }, {
        bus: t,
        gatewayCommands: r
    });
    return u.routing.enqueued ? (t.emit("session.wake", {
        sessionKey: s.session_key,
        preempt: resolvePreemptFromCommandText("/compact")
    }), {
        ok: !0,
        target: o,
        session_key: s.session_key,
        display_name: s.display_name ?? null,
        event_id: u.event.id
    }) : {
        ok: !1,
        reason: "delivery_failed",
        target: o,
        session_key: s.session_key,
        error: "command was not enqueued (gateway did not route /compact to the session mailbox)"
    }
}
```

### spt (function, line 90711, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: getCachedHostBootId [00-daemon-entry]
strings: "/proc/sys/kernel/random/boot_id", ").trim(); if (n) return `${e}:${n}` } catch {} try { let r = tpt(", "kern.boottime", ", stdio: [", "ignore", " } catch {} let t = Math.floor((Date.now() - LSe.uptime() * 1e3) / 6e4); return "
related registered names: parseHostHeaderHostname, parseOriginHostname
protocol: SpineCatParams.date, SystemConfigResult.kernel_dir, SystemRuntimeInfo.kernel_dir

```js
function spt() {
    let e = LSe.hostname();
    try {
        let n = rpt("/proc/sys/kernel/random/boot_id", "utf8").trim();
        if (n) return `${e}:${n}`
    } catch {}
    try {
        let r = tpt("sysctl", ["-n", "kern.boottime"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"]
        }).trim().match(/sec = (\d+)/);
        if (r?.[1]) return `${e}:${r[1]}`
    } catch {}
    let t = Math.floor((Date.now() - LSe.uptime() * 1e3) / 6e4);
    return `${e}:fallback-${t}`
}
```

### fI (function, line 34178, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: initializeRuntime [10-runtime-host], readStatus [00-daemon-entry], writeStatus [00-daemon-entry]
strings: "status.json"
related registered names: buildInitialStatus

```js
function fI(e) {
    return rle.join(e.registryDir, "status.json")
}
```

### Uue (function, line 33474, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 00-daemon-entry
used by: main [00-daemon-entry]
strings: "[spine] ", "), DU) }"
related registered names: readEnvIntegerOrFallback
protocol: SessionConfigResult.settings_env_conflict, type SessionConfigSettingsEnvConflict
changelog: main (v0.8.0, changed): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
changelog: main (v0.8.7, changed): **Main session.** One channel session holds the alias `main`; Notify takes `main` as an explicit target and resolves it at each delivery.

```js
function Uue(e = process.env) {
    let t = e[Fue];
    if (t === void 0 || t.trim() === "") return DU;
    let n = Number(t);
    return Number.isInteger(n) && n >= 1 ? n : (logWarnMessage(`[spine] ${Fue}=${JSON.stringify(t)} is not a positive integer; using ${DU}`), DU)
}
```

### mEe (module initialiser, line 71066, leaf)

spell: init<Name>Module; suggested subsystem: 00-daemon-entry
used by: main [00-daemon-entry]
strings: "use strict", "# Subconscious Playlist ## Current Round ## History ", ", xgt = \"\"; Rgt = new Set([\"memory\", \"config\"]), HW = new Set([\"var\", \"roles\"]), WW = new Set([\"meta-prompt.md\", \"da"
shares kgt: also used by initializeRuntime
shares xgt: also used by initializeRuntime
shares Rgt: also used by copyBootstrapIntoKernel
shares HW: also used by copyBootstrapIntoKernel
shares WW: also used by copyBootstrapIntoKernel
protocol: SystemConfigResult.meta_prompt_path, describeMemoryReadProblem(), isMemoryReadParams(), SessionConfigStats.history_post, SessionConfigStats.history_pre, SessionExecutionEvent.tool_use_id, SystemConfigResult.subconscious, SystemStatusResult.memory_check
changelog: main (v0.8.0, changed): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
changelog: main (v0.8.7, changed): **Main session.** One channel session holds the alias `main`; Notify takes `main` as an explicit target and resolves it at each delivery.

```js
mEe = A(() => {
    "use strict";
    Cr();
    UW();
    Ym();
    initLogLevelModule();
    initKernelGitModule();
    eEe();
    initPartitionRetirementModule();
    kgt = `# Subconscious Playlist

## Current Round

## History
`, xgt = "";
    Rgt = new Set(["memory", "config"]), HW = new Set(["var", "roles"]), WW = new Set(["meta-prompt.md", "dashboard.html"])
})
```

### STe (module initialiser, line 88038, calls 4 candidates)

spell: init<Name>Module; suggested subsystem: 00-daemon-entry
used by: main [00-daemon-entry]
calls candidates: To, Vg, jo, rp (named above; use the names you gave them)
strings: "use strict", "gradient-distiller", "intuition-weaver"
shares Vwt: also used by detectEmptyRequiredPartitionOutput
protocol: SessionExecutionEvent.tool_use_id
changelog: main (v0.8.0, changed): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).
changelog: main (v0.8.7, changed): **Main session.** One channel session holds the alias `main`; Notify takes `main` as an explicit target and resolves it at each delivery.

```js
STe = A(() => {
    "use strict";
    To();
    rp();
    Vg();
    vJ();
    SJ();
    xC();
    initRuntimeValidationModule();
    Ym();
    jo();
    initGapSpanModule();
    LG();
    FG();
    eJ();
    initChannelConfigLoaderModule();
    ul();
    initLogLevelModule();
    dI();
    Zu();
    initSubconsciousPlaylistModule();
    nc();
    initPartitionRunStateModule();
    Vwt = new Set(["gradient-distiller", "intuition-weaver"])
})
```

## group 01-spine-wal (1 candidate)

### vocabulary of 01-spine-wal

registered names (38; the author's spelling -- reuse these verbs and nouns):
  read: readEventAtIndexedOffset, readEventById, readPartitionByteRange, readPartitionTail, readSpineTail
  resolve: resolveConsumerOffsetPath, resolveEventIdIndexPath, resolveTailCursorEndOffset
  write: writeConsumerOffsetFile, writeFileAtomic, writeJsonFileAtomic
  append: appendEventIdIndexEntry, appendEventToPartition
  is: isIndexLoadStillCurrent, isUsableEventIndexEntry
  iterate: iteratePartitionLinesBackward, iterateStreamLines
  load: loadEventIdIndex, loadRegistryDedupStore
  atomic: atomicAppendEvent
  check: checkReservedRecordSource
  compute: computeDedupKey
  create: createSpineEvent
  enqueue: enqueuePartitionAppend
  ensure: ensureDirectoryExists
  format: formatEventPartitionName
  generate: generateSpineEventId
  get: getOrCreateEventIdIndexCache
  lookup: lookupEventIdIndexEntry
  memoize: memoizeIndexLoad
  prune: pruneEventIdIndexByRetention
  record: recordExternalSpineEvent
  redact: redactSpineEventForExternal
  scan: scanPartitionsForEventId
  should: shouldKeepRouteDeliverEvent
  spine: spineEventDedupStore
  (+2 more verbs)
CHANGELOG words paired to this subsystem: redact: "external", spine.cat, after_id, ALADUO_SPINE_INDEX_RETENTION_DAYS, external.record, redactSpineEventForExternal, source_id, spine.record, ${source.kind}:${source_id}, atomicAppendEvent, byte_len, byte_offset, computeDedupKey, createSpineEvent, is_error, isIndexLoadStillCurrent, lookupEventIdIndexEntry, readPartitionByteRange, readPartitionTail, reserved_source, resolveEventIdIndexPath, spine.tail, stringifyJsonlRecord, system.status, tool_name, tool_result, tool_use, writeFileAtomic

### zue (function, line 33460, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 01-spine-wal
used by: readEventAtIndexedOffset [01-spine-wal], scanPartitionsForEventId [01-spine-wal]
changelog: readEventAtIndexedOffset (v0.3.1, born): Cross-cutting runtime I/O optimizations — caching, append-only mailbox, sharded registry, and lazy reads across hot paths.
changelog: iterateStreamLines (v0.8.0, born): Log lines containing U+2028 were shredded on read, because the line reader treated it as a line break and JSON does not.

```js
async function zue(e, t) {
    try {
        let n = jU(e);
        for await (let r of iterateStreamLines(n)) {
            if (!r) continue;
            let i = MU(r);
            if (i?.id === t) return i
        }
    } catch {
        return null
    }
    return null
}
```

## group 02-gateway-rpc (9 candidates)

### vocabulary of 02-gateway-rpc

registered names (147; the author's spelling -- reuse these verbs and nouns):
  is: isAttachmentArray, isChannelAckParams, isChannelCapabilities, isChannelCommandParams, isChannelDescribeParams, isChannelFileDownloadParams, isChannelFileUploadParams, isChannelIngressParams, isChannelPullParams, isChannelSpawnParams (+30)
  resolve: resolveDeliveryCursorPath, resolveExistingDirRealpath, resolveIngressWorkspace, resolveOutboxByEventIndexPath, resolveOutboxByIdIndexPath, resolveOutboxPendingQueuePath, resolveOutboxRecordPath, resolveOutboxReplayDir, resolveOutboxReplayFilePath, resolveOutboxSentIdsPath (+4)
  read: readChannelDescriptor, readDeliveryCursorFile, readFileAsBase64, readLatestDeliveryCursorUpdate, readMemoryFileForRpc, readOrSetSessionEffort, readOrSetSessionModel, readOutboxRecord, readOutboxRecordsPastCursor, readRoutingTarget
  describe: describeChannelInstance, describeConversationProblem, describeMemoryReadProblem, describeSpineCatProblem, describeSpineRecordProblem
  init: initChannelProtocolModule, initOutboxStoreModule, initProtocolJobModule, initProtocolSystemModule
  list: listAllOutboxRecords, listMainAliasHolderKeys, listRetryableOutboxRecords, listVoidChannelSessions
  render: renderAmbiguousMainAliasNotice, renderFormerMainSessionNotice, renderNewMainSessionNotice, renderParamsProblem
  deliver: deliverExternalSessionNotify, deliverMainRoleNoticeSafely, deliverRouteEventToSession
  record: recordChannelCapabilityDeclaration, recordOutboxDeliveryAttempt, recordOutboxSentId
  append: appendBeforeExecuteGateway, appendOutboxByEventIndexEntry
  assert: assertValidChannelId, assertWsChannelIdentityParams
  check: checkChannelRuntimeRebindConflict, checkMainAliasCallerAuthority
  create: createOutboxRecord, createSessionSubscriptionRegistry
  ensure: ensureAbsoluteWorkspaceDir, ensureOutboxRecordInReplay
  has: hasNonEmptyDisplayName, hasUnqueuedPendingOutboxRecords
  ingest: ingestChannelCommand, ingestChannelMessage
  lookup: lookupInjectionPrompt, lookupOutboxByIdIndexEntry
  normalize: normalizeChannelCapabilityDeclarations, normalizeReturnMask
  parse: parseGatewayCommandText, parseInjectionPromptCommand
  replay: replayIdempotentSessionNotify, replayOutboxBacklogToSubscriber
  run: runSessionSetAliasRpc, runSpineCatRpc
  set: setSessionAliasAndReindex, setSessionAliasWithMainRole
  write: writeIngressSnapshot, writeVoidSessionOutboxRecord
  advance: advanceOptimisticDeliveryCursor
  (+31 more verbs)
CHANGELOG words paired to this subsystem: main, session_key, channel.spawn, duoduo session alias <key> main --move, duoduo session effort, duoduo session model, by_id, channel.describe, list, /loop, /rpc, channel_id, duoduo daemon status, duoduo prompts, duoduo session alias <key> "<name>", duoduo session notify <target> -m "<msg>", evaluateNotifyConsumerRefusal, external.record, forbidden_kind, kernel_dir, redact: "external", session.list, spine.cat, spine.record, stream_end, void, after_id, claude, codex, declared_by, dedup_key, deliverable: true, duoduo job list | read | archive | interrupt | reschedule, duoduo session archive <session_key>, duoduo session list [--kind …] [--named] [--all] [--json], main_since, maxPayload, move, mv, Notify
protocol types and fields (@openduo/protocol): type SessionOutputNotification, type SessionStreamEndNotification, ChannelIngressResult.gateway_response, ChannelOutboundCapabilities.accept_stream_end_reasons, SessionExecutionEvent.input_summary, SessionExecutionEvent.tool_use_id, SystemConfigResult.sdk_debug, type JsonRpcNotification, type JsonRpcResponse, type OutboxRecordStatus, type SessionListEntry, isSpineCatParams(), type SessionConfigAliasEntry, type SessionConfigEntry, type SessionConfigProfileEntry, type SessionConfigSettingsEnvConflict, type SessionConfigStats, type SpineCatParams, describeSpineCatProblem(), isAgentRuntime(), OutboxRecord.in_reply_to_event_id, SystemRuntimeInfo.runtime_mode, type AgentRuntime, type OutboxRecord

### Vu (function, line 34159, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 02-gateway-rpc
used by: appendBeforeExecuteGateway [02-gateway-rpc], createMetaSession [03-session-actor], runCadenceTick [08-cadence-subconscious]
protocol: ChannelSessionBinding.updated_at, TenantChannelSettings.updated_at
changelog: appendBeforeExecuteGateway (v0.8.0, changed): Identical text sent twice was silently suppressed as a duplicate. Ingress de-duplication now keys only on an explicit source id, so resending a message always g
changelog: createMetaSession (v0.3.1, changed): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
changelog: runCadenceTick (v0.5.5, changed): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions.

```js
async function Vu(e, t, n, r = new Date) {
    let i = await lookupEventIdIndexEntry(e, n);
    return i ? (await writeConsumerOffsetFile(e, t, {
        updated_at: r.toISOString(),
        partition: i.partition,
        byte_offset: i.byte_offset,
        last_event_id: n
    }), !0) : !1
}
```

### Hu (function, line 34220, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 02-gateway-rpc
used by: appendBeforeExecuteGateway [02-gateway-rpc], createMetaSession [03-session-actor], runCadenceTick [08-cadence-subconscious]
changelog: appendBeforeExecuteGateway (v0.8.0, changed): Identical text sent twice was silently suppressed as a duplicate. Ingress de-duplication now keys only on an explicit source id, so resending a message always g
changelog: createMetaSession (v0.3.1, changed): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
changelog: runCadenceTick (v0.5.5, changed): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions.

```js
async function Hu(e, t, n = new Date) {
    let r = await readStatus(e) ?? buildInitialStatus(e, n),
        i = t(r);
    return i.generated_at = n.toISOString(), await writeStatus(e, i), i
}
```

### Knt (function, line 89060, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 02-gateway-rpc
used by: appendBeforeExecuteGateway [02-gateway-rpc]
strings: "gateway:offline", "gateway_command", ") ? o.split(", "agent.result", "gateway", "session.output", "spine.event"
related registered names: parseGatewayCommandText, classifyGatewayCommandIntent, describeSpineRecordProblem, bindSessionSourceChannel, hasUnqueuedPendingOutboxRecords, isSessionListKind, renderFormerMainSessionNotice, renderNewMainSessionNotice, resolveOutboxPendingQueuePath, deliverMainRoleNoticeSafely
protocol: ChannelIngressResult.gateway_response, OutboxRecord.in_reply_to_event_id, type OutboxRecord, type OutboxRecordStatus, isChannelCommandParams(), type ChannelCommandParams, type ChannelDescribeDescriptorSummary, type OutboundChannelPayload
changelog: appendBeforeExecuteGateway (v0.8.0, changed): Identical text sent twice was silently suppressed as a duplicate. Ingress de-duplication now keys only on an explicit source id, so resending a message always g
changelog: executeGatewayCommand (v0.8.3, changed): On a Claude model without `max` support the request runs as `high`, and the `/effort max` reply says so.

```js
async function Knt(e, t, n, r) {
    let i = Znt(t);
    if (!i) return {
        handled: !1
    };
    let o = t.session_key ?? "gateway:offline",
        s = await executeGatewayCommand(e, i, o, r, {
            sourceKind: t.source.kind,
            sourceChannelId: t.source.channel_id
        });
    s.noticeSummary && await patchSessionRuntimeState(e, o, {
        pending_gateway_notice: {
            source: "gateway_command",
            command: i.raw,
            command_name: i.name,
            result_summary: s.noticeSummary,
            created_at: new Date().toISOString()
        }
    });
    let a = o.includes(":") ? o.split(":")[0] : t.source.kind,
        u = createOutboxRecord({
            channel_kind: a,
            session_key: o,
            in_reply_to_event_id: t.id,
            payload: {
                text: s.responseText,
                data: {
                    ...s.data ?? {},
                    gateway_command: i.name
                }
            }
        });
    await persistOutboxRecord(e, u);
    let l = createSpineEvent({
        type: "agent.result",
        source: {
            kind: "gateway",
            name: "gateway"
        },
        session_key: o,
        payload: {
            outbox_id: u.id,
            text: s.responseText,
            command: i.raw,
            command_name: i.name
        }
    });
    return await atomicAppendEvent(e, l), n && (n.emit("session.output", {
        sessionKey: o,
        record: u
    }), n.emit("spine.event", l)), {
        handled: !0,
        responseText: s.responseText,
        outboxId: u.id
    }
}
```

### rt (function, line 36871, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 02-gateway-rpc
used by: applySessionConfigVerb [02-gateway-rpc], checkChannelRuntimeRebindConflict [02-gateway-rpc], collectInstructionsInputs [03-session-actor], createClaudeStreamingSessionFactory [06-runtime-claude], createDaemon [00-daemon-entry], createModelCommandResolvers [03-session-actor], createSessionManager [03-session-actor], describeChannelInstance [02-gateway-rpc], drainSessionMailbox [03-session-actor], executeGatewayCommand [02-gateway-rpc], hasSkipRewindRecordSince [05-drain-turn], readPendingOutboundAttachments [05-drain-turn] (+7)
related registered names: parseGatewayCommandText, parseInjectionPromptCommand
protocol: describeMemoryReadProblem(), isChannelFileDownloadParams(), isChannelFileUploadParams(), isMemoryReadParams(), SessionConfigSettingsEnvConflict.file, type ChannelFileDownloadParams, type ChannelFileUploadParams, type MemoryReadParams
changelog: applySessionConfigVerb (v0.5.10, born): enable and tune per conversation with `duoduo session config <session> set auto_compact_idle_minutes=50 auto_compact_min_context_tokens=100000`.
changelog: checkChannelRuntimeRebindConflict (v0.8.3, born): **Changing a session's runtime needs `/clear` first.** A session is now bound to the runtime that created its history.
changelog: collectInstructionsInputs (v0.5.1, born): The per-session sticky-mission guard now fingerprints identity + kind prompt + instance prompt + memory board + mission, not just the mission.

```js
async function rt(e, t) {
    try {
        let n = await Ja.readFile(resolveSessionStatePath(e, t), "utf8");
        return JSON.parse(n)
    } catch {
        return null
    }
}
```

### vU (module initialiser, line 32732, leaf)

spell: init<Name>Module; suggested subsystem: 02-gateway-rpc
used by: initProtocolSystemModule [02-gateway-rpc]
strings: "use strict", "medium"
shares Gi: also used by isEffortLevel, parseJobFileFrontmatter, runManageJobTool, executeGatewayCommand, validateConfigValue
related registered names: wsDefaultMaxPayload
protocol: SessionExecutionEvent.tool_use_id

```js
vU = A(() => {
    "use strict";
    Gi = ["low", "medium", "high", "xhigh", "max"]
})
```

### Ofe (function, line 88768, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 02-gateway-rpc
used by: parseGatewayCommandText [02-gateway-rpc]
strings: "/status", "/config", "/debug", "#debug", "/cancel", "/clear", "/reset", "/stats", ") return ", "; if (e === "
related registered names: applySessionConfigVerb, isModelRuntime, isSessionCompactParams, isSessionConfigParams, isSessionEffortParams, isSessionModelParams, isSystemConfigParams, isSystemStatusParams, readOrSetSessionEffort, readOrSetSessionModel
protocol: type SessionConfigStats, SessionConfigResult.stats, SystemConfigResult.sdk_debug

```js
function Ofe(e) {
    if (e === "/status") return "/status";
    if (e === "/config") return "/config";
    if (e === "/debug" || e === "#debug") return "/debug";
    if (e === "/cancel") return "/cancel";
    if (e === "/clear" || e === "/reset") return "/clear";
    if (e === "/stats") return "/stats";
    if (e === "/task") return "/task";
    if (e === "/compact") return "/compact";
    if (e === "/model") return "/model";
    if (e === "/effort") return "/effort"
}
```

### To (module initialiser, line 57104, calls 4 candidates)

spell: init<Name>Module; suggested subsystem: 02-gateway-rpc
used by: describeChannelInstance [02-gateway-rpc], initInstructionsFingerprintModule [03-session-actor], initMailboxDrainRunnerModule [05-drain-turn], initManageJobToolModule [08-cadence-subconscious], main [00-daemon-entry]
calls candidates: Eg, FV, sC, tl (named above; use the names you gave them)
strings: "use strict", "TaskStop", "ToolSearch", "TaskCreate", "TaskGet", "TaskUpdate", "TaskList", "SendMessage", "]; l_e = ", ", Cat = ", "[[slug]]", " links in this board are dossier entry points, not footnotes. When a line's trigger fires in your current task and the i"
shares Eg: also used by listDefaultClaudeToolNames
shares FV: also used by createMetaSession
shares l_e: also used by renderPromptLayers
shares Cat: also used by renderPromptLayers
shares Oat: also used by renderPromptLayers
shares m_e: also used by __resetClaudeProbeCacheForTest
related registered names: MemoryReadRpcError, readLatestDeliveryCursorUpdate, appendOutboxByEventIndexEntry, createOutboxRecord, createSessionSubscriptionRegistry, describeSpineCatProblem, ingestChannelMessage, isJobCreateParams, JsonRpcInvalidParamsError, lookupOutboxByIdIndexEntry
protocol: SessionExecutionEvent.tool_use_id, type SessionListEntry, AGENT_RUNTIMES(), describeMemoryReadProblem(), describeSpineCatProblem(), isAgentRuntime(), isJobCreateParams(), isMemoryReadParams()
changelog: describeChannelInstance (v0.5.0, born): descriptors carry `runtime` (`claude`|`codex`) and spawn provenance; new `channel.describe` / `channel.spawn` RPCs expose the instance lifecycle to channel plug
changelog: describeChannelInstance (v0.5.3, changed): Setup cards only show runtime choices the daemon can actually run.
changelog: main (v0.8.0, changed): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).

```js
To = A(() => {
    "use strict";
    initLogLevelModule();
    Bu();
    tl();
    sC();
    hC();
    Eg = ["Bash", "Read", "Write", "Edit", "Grep", "Glob", "Agent", "TaskStop", "Skill", "ToolSearch", "TaskCreate", "TaskGet", "TaskUpdate", "TaskList", "SendMessage"], FV = ["Bas …
    l_e = "Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior and you MUST follow  …
        constructor(t = "SDK turn interrupted during execution") {
            super(t), this.name = "AgentSdkTurnInterruptedError"
        }
    }, AgentSdkPromptNotAcceptedAbortError = class extends Error {
        constructor(t = "SDK query aborted before the prompt was accepted") {
            super(t), this.name = "AgentSdkPromptNotAcceptedAbortError"
        }
    };
    m_e = () => verifyClaudeCodeRuntimeAvailable(), zV = m_e, d_e = 5e3;
    zat = 2147483647
})
```

### rp (module initialiser, line 64309, calls 3 candidates)

spell: init<Name>Module; suggested subsystem: 02-gateway-rpc
used by: describeChannelInstance [02-gateway-rpc], initManageJobToolModule [08-cadence-subconscious], main [00-daemon-entry]
calls candidates: rc, tl, uO (named above; use the names you gave them)
strings: "use strict", "aladuo", "features.code_mode.direct_only_tool_namespaces", ", env: {}, sandbox: ", ", serviceName: ", "app-server", ", n => { this.alive = !1; let r = n.code === ", "Codex CLI ('", ") : n; this.rejectAllPending(r) }), this.proc.on(\"exit\", (n, r) => { this.al", "codex app-server exited (code=", "); this.rejectAllPending(i) }), this.rl = rc(this.proc.stdout, n => this.handleLine(n)), rc(", "[codex-stderr]"
shares uO: also used by buildCodexDirectOnlyToolConfig, buildDeveloperInstructions, createCodexAppServerAdapter
shares zct: also used by buildCodexDirectOnlyToolConfig
shares Vct: also used by createCodexAppServerAdapter
shares aO: also used by createCodexAppServerAdapter
related registered names: JsonRpcInvalidParamsError, isJsonRpcRequest, isModelRuntime, parseGatewayCommandText, MemoryReadRpcError, SpineRpcParamsError, readOrSetSessionEffort, readOrSetSessionModel, resolveOutboxPendingQueuePath, resolveRemoteListenerConfig
protocol: ChannelOutboundCapabilities.accept_stream_end_reasons, SessionExecutionEvent.tool_use_id, type SessionStreamEndNotification, type JsonRpcNotification, SystemRuntimeInfo.runtime_mode, type ReportedRuntimeMode, type RuntimeMode, isMemoryReadParams()
changelog: describeChannelInstance (v0.5.0, born): descriptors carry `runtime` (`claude`|`codex`) and spawn provenance; new `channel.describe` / `channel.spawn` RPCs expose the instance lifecycle to channel plug
changelog: describeChannelInstance (v0.5.3, changed): Setup cards only show runtime choices the daemon can actually run.
changelog: main (v0.8.0, changed): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).

```js
rp = A(() => {
    "use strict";
    ic();
    initLogLevelModule();
    initInterruptMarkerTextModule();
    tl();
    uO = "aladuo", zct = "features.code_mode.direct_only_tool_namespaces";
    Vct = {
        codexBinary: "codex",
        env: {},
        sandbox: "read-only",
        serviceName: "duoduo_runtime",
        model: null,
        effort: null,
        ephemeral: !0,
        dynamicTools: []
    }, aO = class extends Fct {
        constructor(n, r, i) {
            super();
            this.binary = n;
            this.cwd = r;
            this.env = i
        }
        binary;
        cwd;
        env;
        proc = null;
        rl = null;
        nextId = 1;
        pending = new Map;
        alive = !1;
        start() {
            this.alive || (this.proc = Mct(this.binary, ["app-server"], {
                cwd: this.cwd,
                stdio: ["pipe", "pipe", "pipe"],
                env: {
                    ...process.env,
                    ...this.env
                },
                detached: !0
            }), this.alive = !0, this.proc.on("error", n => {
                this.alive = !1;
                let r = n.code === "ENOENT" ? new Error(`Codex CLI ('${this.binary}') not found. Install it from https://github.com/openai/codex and run 'codex login'.`) : n;
                this.rejectAllPending(r)
            }), this.proc.on("exit", (n, r) => {
                this.alive = !1;
                let i = new Error(`codex app-server exited (code=${n} signal=${r})`);
                this.rejectAllPending(i)
            }), this.rl = rc(this.proc.stdout, n => this.handleLine(n)), rc(this.proc.stderr, n => {
                logDebugMessage("[codex-stderr]", n)
            }))
        }
        request(n, r, i) {
            if (!this.alive || !this.proc?.stdin?.writable) return Promise.reject(new Error("codex app-server is not running"));
            if (i?.aborted) {
                let s = new Error(`request ${n} aborted`);
                return s.name = "AbortError", Promise.reject(s)
            }
            let o = this.nextId++;
            return new Promise((s, a) => {
… (211 lines)
```

### Vg (module initialiser, line 65266, calls 5 candidates)

spell: init<Name>Module; suggested subsystem: 02-gateway-rpc
used by: describeChannelInstance [02-gateway-rpc], initManageJobToolModule [08-cadence-subconscious], main [00-daemon-entry]
calls candidates: Hve, To, aS, qve, tl (named above; use the names you gave them)
strings: "use strict", "scheduler_create", "scheduler_list", "scheduler_delete", "monitor", "workflow", "update_goal", "duoduo", "duoduo session", "; Uve = aS(", "), qve = aS(", "), Bve = "
shares qve: also used by createGrokAcpAdapter
shares Hve: also used by createGrokAcpAdapter
shares n6: also used by createGrokAcpAdapter
related registered names: listVoidChannelSessions, createSessionSubscriptionRegistry, isSessionCompactParams, writeVoidSessionOutboxRecord, createOutboxRecord, describeConversationProblem, isJobCreateParams, isJsonRpcRequest, readLatestDeliveryCursorUpdate, updateDeliveryCursorFile
protocol: resolveMainSession(), describeConversationProblem(), isJobCreateParams(), JsonRpcRequest.method, SessionConfigResult.claude_tools, SessionExecutionEvent.tool_use_id, SessionExecutionNotification.method, SessionOutputNotification.method
changelog: describeChannelInstance (v0.5.0, born): descriptors carry `runtime` (`claude`|`codex`) and spawn provenance; new `channel.describe` / `channel.spawn` RPCs expose the instance lifecycle to channel plug
changelog: describeChannelInstance (v0.5.3, changed): Setup cards only show runtime choices the daemon can actually run.
changelog: main (v0.8.0, changed): The by-id index is now a bounded recency cache keyed on event date and compacted at boot (`ALADUO_SPINE_INDEX_RETENTION_DAYS`, 7 days by default).

```js
Vg = A(() => {
    "use strict";
    ic();
    initLogLevelModule();
    To();
    initInterruptMarkerTextModule();
    tl();
    Qct = 5e3;
    GROK_DISALLOWED_TOOLS = ["scheduler_create", "scheduler_list", "scheduler_delete", "monitor", "workflow", "update_goal"], GROK_AGENT_PROFILE = {
        name: "duoduo",
        description: "duoduo session",
        disallowedTools: [...GROK_DISALLOWED_TOOLS]
    }, GROK_ACP_EXT_PREFIX = "_x.ai";
    GROK_ACP_SDK_CALL = aS("mcp/sdk_call"), qve = aS("compact_conversation"), GROK_MCP_SDK_META = "x.ai/mcp/sdk", GROK_MCP_SERVERS_META = "x.ai/mcp/servers", Hve = "aladuo";
    n6 = class {
        onmessage;
        onclose;
        onerror;
        replies = new Map;
        async start() {}
        async close() {
            let t = new Error("aladuo MCP transport closed");
            for (let n of this.replies.values()) n.reject(t);
            this.replies.clear(), this.onclose?.()
        }
        async send(t) {
            if (!("id" in t) || t.id === void 0 || t.id === null) return;
            let n = this.replies.get(String(t.id));
            n && (this.replies.delete(String(t.id)), n.resolve(t))
        }
        dispatch(t, n = 3e4) {
            if (!("id" in t) || t.id === void 0 || t.id === null) return this.onmessage?.(t), Promise.resolve({
                jsonrpc: "2.0",
                id: 0,
                result: {}
            });
            let r = String(t.id);
            return new Promise((i, o) => {
                let s = setTimeout(() => {
                    this.replies.delete(r);
                    let a = "method" in t ? String(t.method) : "request";
                    o(new Error(`MCP ${a} timed out after ${n}ms`))
                }, n);
                this.replies.set(r, {
                    resolve: a => {
                        clearTimeout(s), i(a)
                    },
                    reject: a => {
                        clearTimeout(s), o(a)
                    }
                }), this.onmessage?.(t)
            })
        }
    }
})
```

## group 03-session-actor (11 candidates)

### vocabulary of 03-session-actor

registered names (127; the author's spelling -- reuse these verbs and nouns):
  resolve: resolveArchivedSessionDir, resolveIsolatedPlaneKind, resolveMainSession, resolveMainSessionFromIndex, resolvePiAgentDir, resolvePreemptFromCommandText, resolveSessionChannelRuntime, resolveSessionDir, resolveSessionDrainLockPath, resolveSessionInboxDir (+6)
  is: isAvailableWorkspacePath, isLiveStreamRebuildRequired, isMailboxMergeReadError, isMainSessionCandidate, isReservedMainAliasChange, isSessionArchived, isSessionArchiving, isUserVisibleSessionKey, isVoidRuntimeSession
  create: createEmptySessionIndex, createIdleCompactSweeper, createJobSessionFinalizer, createMapBackedSessionIndex, createMetaSession, createModelCommandResolvers, createSessionManager
  read: readAllSessionStateFiles, readAllSessionSummaries, readDrainLockFile, readLiveStreamContextToken, readPiAgentSettings, readSessionMetaFile, readStateSourceChannelId
  init: initInstructionsFingerprintModule, initMainSessionAliasModule, initReservedMainAliasModule, initSessionLockAndArchivingModule, initViewSessionsToolModule, initVoidRuntimeModule
  build: buildPiConfigSignature, buildSessionExecutionPayload, buildSessionIndexEntry, buildSessionIndexFromDisk, buildSessionInfoFromState
  classify: classifySessionKey, classifySessionKeyOrUnknown, classifySessionPlane, classifySessionPlaneByKey, classifySessionPoolKind
  clear: clearPendingGatewayNotice, clearPendingInterruptedContext, clearPendingSkipRewind, clearSessionArchiving, clearSessionRuntimeStateField
  compute: computeInstructionsFingerprint, computeMissionFingerprint, computeNonBoardInstructionsFingerprint, computeStreamEventDedupKey, computeStreamingConfigSignature
  list: listArchivedCopiesNewestFirst, listDefaultClaudeToolNames, listMailboxPendingItems, listPendingInboxFiles, listSessionIndexSummaries
  archive: archiveLegacyRegistrySessionsDir, archiveSessionAndArtifacts, archiveSessionDirUnlessAlreadyArchiving
  run: runInstructionsFingerprintGuard, runViewSessionsTool, runWithSessionMutex
  assert: assertJobWorkspaceUsable, assertSessionNotArchiving
  ensure: ensureSessionDescriptorAndStateFiles, ensureSessionMailboxPendingDir
  extract: extractJobSdkConfig, extractUrlHost
  move: moveFileIntoDirectory, moveSessionDirToArchive
  render: renderActiveSessionsListing, renderSessionMailboxFile
  request: requestBoundaryAwarePreempt, requestPiWorkerCatalog
  acquire: acquireSessionDrainLock
  append: appendSessionMailboxNote
  canonicalize: canonicalizeJsonValue
  channel: channelKindFromSessionKey
  collect: collectInstructionsInputs
  delete: deleteMailboxPendingItemsByEventIds
  (+33 more verbs)
CHANGELOG words paired to this subsystem: main, main_since, archiveSessionDir, enqueueMailboxItem, updateSessionRuntimeState, session_key, instructions_fingerprint, mission_fingerprint, SessionIndex, var/sessions/<hash>/state.json, /compact, /model, ManageSession, rolePrompt, var/sessions-archive/, ViewSessions, --json, /effort, archiveSessionAndArtifacts, archiveSessionIfQuiescent, assertSessionNotArchiving, discoverChannelId, display_name, duoduo session list, ensureSessionDescriptor, ManageJob(archive), owner_session, resolveMain, resolveMetaPromptText, runWithSessionMutex, stand_in_for_owner, tool_input_delta, var/registry/sessions/, void, writeSessionMeta, "candidate", acquireSessionDrainLock, auto_compact_idle_minutes, auto_compact_min_context_tokens, buildSystemPromptForChannelConfig
protocol types and fields (@openduo/protocol): SessionExecutionEvent.tool_use_id, SystemConfigResult.log_runner_tool_events, SystemConfigResult.meta_prompt_path, type SessionConfigSettingsEnvConflict, isChannelFileDownloadParams(), isChannelFileUploadParams(), isSessionArchiveParams(), SystemConfigResult.log_session_lifecycle, SystemStatusResult.meta_session, type ChannelFileDownloadParams, type ChannelFileUploadParams, type NormalizedChannelMessage, type SessionArchiveParams, type SessionArchiveResult, AGENT_RUNTIMES(), ChannelFileDownloadParams.path, ChannelFileUploadParams.mime, ChannelIngressParams.text, ChannelOutboundCapabilities.accept_mime, describeMemoryReadProblem(), isAgentRuntime(), isJobArchiveParams(), isJobCreateParams(), isMemoryReadParams()

### Fo (function, line 33558, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: archiveSessionAndArtifacts [03-session-actor], drainSessionMailbox [03-session-actor], executeGatewayCommand [02-gateway-rpc], rehydrateSessionState [03-session-actor], resolveArchivedSessionDir [03-session-actor], resolveSessionDir [03-session-actor], writeIngressSnapshot [02-gateway-rpc]
strings: "sha256"
related registered names: updateSessionDisplayName
protocol: isJobCreateParams(), type JobCreateParams
changelog: archiveSessionAndArtifacts (v0.5.0, born): `session.archive` RPC + `duoduo session archive <session_key>` CLI retired the old ad-hoc deletion paths. Archive moves the session dir to `var/sessions-archive
changelog: archiveSessionAndArtifacts (v0.6.0, changed): Archiving now refuses unless the session is provably empty of pending work (checking every shape of in-flight work), ignores channel placeholder actors, and tre
changelog: drainSessionMailbox (v0.5.4, changed): surfaces a per-session "runtime unavailable" error instead of failing silently.

```js
function Fo(e) {
    return gXe.createHash("sha256").update(e).digest("hex")
}
```

### RIe (function, line 81811, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: createJobSessionFinalizer [03-session-actor]
strings: " || e.startsWith("
changelog: createJobSessionFinalizer (v0.8.0, born): Job results went nowhere when the job had no explicit audience; the owner is now the default, and a job can no longer disappear without a trace.
changelog: createJobSessionFinalizer (v0.8.7, changed): A job outcome whose owner cannot take it goes to main, marked as a stand-in delivery.

```js
function RIe(e) {
    return e === "once" || e.startsWith("@in ")
}
```

### FV (literal constant, line 57111, leaf)

spell: UPPER_SNAKE with an underscore; suggested subsystem: 03-session-actor
used by: createMetaSession [03-session-actor]
assigned in: To (the body below is that assignment)
protocol: describeMemoryReadProblem(), isMemoryReadParams(), type MemoryReadParams, type MemoryReadResult
changelog: createMetaSession (v0.3.1, changed): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.

```js
FV = ["Bash", "Read", "Write", "Edit", "Grep", "Glob"]
```

### Fc (function, line 64563, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: createMetaSession [03-session-actor], createSessionManager [03-session-actor], primeGrokAvailability [11-runtime-grok], runManageJobTool [08-cadence-subconscious]
strings: ") { let { execFile: t } = await import(", "), { promisify: n } = await import(", "), r = n(t); try { await r(e, [", "Grok CLI ('", " } } return { ok: !0 } }"
related registered names: moveFileIntoDirectory, notifySessionFileChanged, readDrainLockFile, readSessionMetaFile, renderSessionMailboxFile, runInstructionsFingerprintGuard, runViewSessionsTool, runWithSessionMutex, waitForWakeOrIdleTimeout
protocol: ChannelFileDownloadParams.path, isChannelFileDownloadParams(), isChannelFileUploadParams(), SessionConfigSettingsEnvConflict.file, SessionNotifyResult.mailbox_path, SystemConfigResult.meta_prompt_path, SystemRuntimeInfo.version, type ChannelFileDownloadParams
changelog: createMetaSession (v0.3.1, changed): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.
changelog: createSessionManager (v0.8.7, changed): **Every channel session gets a role.** The session aliased `main` reads a short main-role text, every other channel session a member-role text.
changelog: primeGrokAvailability (v0.7.1, born): Availability is checked against the Grok CLI you already have installed

```js
async function Fc(e = "grok") {
    let {
        execFile: t
    } = await import("node:child_process"), {
        promisify: n
    } = await import("node:util"), r = n(t);
    try {
        await r(e, ["--version"], {
            timeout: Qct
        })
    } catch {
        return {
            ok: !1,
            reason: `Grok CLI ('${e}') is not installed or not in PATH. Install it and run 'grok login'.`
        }
    }
    return {
        ok: !0
    }
}
```

### VSe (function, line 67781, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: createMetaSession [03-session-actor]
strings: "[playlist] all partitions are disabled, meta-session will idle", "Edit partition CLAUDE.md files to set 'enabled: true' in frontmatter, or add new partitions", "# Subconscious Playlist ## Current Round ## History ", " } let i = r.split(", "), o = i.findIndex(s => s.trim() === \"## Current Round\"); if (o === -1) { let s = n.map(a => ", "- [ ] ", "); i.push(\"## Current Round\", ...s) } else { let s = i.length; for (let u = o + 1; u < i.len", ") && i[u].trim() !== ", "); i.splice(o + 1, s - o - 1, ...a, \"\") } return await Dt(e.subconsciousPlaylistPath, ", ").replace(/\\s+", ")} `), xe("
related registered names: readAllSessionStateFiles, readSessionMetaFile, listDefaultClaudeToolNames, createMapBackedSessionIndex, readAllSessionSummaries, resolveSessionMetaPath, readDrainLockFile, ensureSessionDescriptorAndStateFiles, notifySessionFileChanged, renderSessionMailboxFile
protocol: SystemConfigResult.meta_prompt_path, SystemStatusResult.meta_session, ChannelFileDownloadParams.path, describeMemoryReadProblem(), isChannelFileDownloadParams(), isChannelFileUploadParams(), isMemoryReadParams(), OutboxRecord.fanout_index
changelog: createMetaSession (v0.3.1, changed): **cadence**: Settle subconscious partition scheduling — fix round-robin stalls and idle-tick fanout.

```js
async function VSe(e) {
    let t = await loadSubconsciousPartitions(e),
        n = t.filter(s => s.schedule.enabled);
    if (n.length === 0 && t.length > 0) {
        let s = t.map(a => a.name);
        logWarnMessage("[playlist] all partitions are disabled, meta-session will idle", {
            totalPartitions: t.length,
            disabledPartitions: s,
            recoveryHint: "Edit partition CLAUDE.md files to set 'enabled: true' in frontmatter, or add new partitions"
        })
    }
    let r;
    try {
        r = await ll.readFile(e.subconsciousPlaylistPath, "utf8")
    } catch {
        r = `# Subconscious Playlist

## Current Round

## History
`
    }
    let i = r.split(`
`),
        o = i.findIndex(s => s.trim() === "## Current Round");
    if (o === -1) {
        let s = n.map(a => `- [ ] ${a.name}`);
        i.push("## Current Round", ...s)
    } else {
        let s = i.length;
        for (let u = o + 1; u < i.length; u++)
            if (i[u].trim().startsWith("## ") && i[u].trim() !== "## Current Round") {
                s = u;
                break
            } let a = n.map(u => `- [ ] ${u.name}`);
        i.splice(o + 1, s - o - 1, ...a, "")
    }
    return await writeFileAtomic(e.subconsciousPlaylistPath, `${i.join(`
`).replace(/\s+$/,"")}
`), logDebugMessage("[playlist] rebuilt round", {
        count: n.length,
        names: n.map(s => s.name)
    }), n.length
}
```

### sTe (function, line 84143, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: createSessionManager [03-session-actor]
strings: "channel", " && n.session_key === e ? ", "member"
related registered names: readStateSourceChannelId, channelKindFromSessionKey, resolveSessionChannelRuntime
changelog: createSessionManager (v0.8.7, changed): **Every channel session gets a role.** The session aliased `main` reads a short main-role text, every other channel session a member-role text.
changelog: resolveRolePromptText (v0.8.7, born): **Every channel session gets a role.** The session aliased `main` reads a short main-role text, every other channel session a member-role text.

```js
function sTe(e, t) {
    if (classifySessionKey(e) !== "channel") return;
    let n = t(),
        r = n.state === "held" && n.session_key === e ? "main" : "member";
    return resolveRolePromptText(r)
}
```

### mJ (function, line 72875, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: drainSessionMailbox [03-session-actor], prepareDrainTurnContext [05-drain-turn]
strings: "); i && n.push({ path: i, mime: Xt(r, "
protocol: ChannelFileDownloadParams.path, ChannelFileUploadParams.mime, ChannelOutboundCapabilities.accept_mime, SessionNotifyResult.mailbox_path, SystemConfigResult.meta_prompt_path
changelog: drainSessionMailbox (v0.5.4, changed): surfaces a per-session "runtime unavailable" error instead of failing silently.
changelog: drainSessionMailbox (v0.5.5, changed): Parallel worker-completion notifications are coalesced into one turn.
changelog: drainSessionMailbox (v0.8.7, changed): **Every channel session gets a role.** The session aliased `main` reads a short main-role text, every other channel session a member-role text.

```js
function mJ(e) {
    if (!isNonNullObject(e)) return;
    let t = e.media;
    if (!Array.isArray(t)) return;
    let n = [];
    for (let r of t) {
        if (!isNonNullObject(r)) continue;
        let i = readStringProperty(r, "path");
        i && n.push({
            path: i,
            mime: readStringProperty(r, "mime")
        })
    }
    return n.length > 0 ? n : void 0
}
```

### nTe (module initialiser, line 83930, leaf)

spell: init<Name>Module; suggested subsystem: 03-session-actor
used by: initInstructionsFingerprintModule [03-session-actor]
strings: "use strict", ".scala", ".swift", ".config", ".properties", ".graphql", ".proto", ".svelte", ".astro", ".cmake", ".makefile", ".gradle"
shares XIe: also used by stripBoardIncludeFrontmatter
shares ywt: also used by resolveBoardIncludes
shares _wt: also used by resolveBoardIncludes
shares KIe: also used by collectBoardIncludePaths
shares QIe: also used by stripBoardHtmlComments, collectBoardIncludePaths
shares bwt: also used by renderTranscludedFiles
related registered names: diffStreamingConfigSignature, buildPiConfigSignature, canonicalizeJsonValue, collectInstructionsInputs, computeInstructionsFingerprint, computeNonBoardInstructionsFingerprint, computeStreamingConfigSignature, extractJobSdkConfig, patchSessionRuntimeState, resolvePreemptFromCommandText
protocol: type SessionConfigSettingsEnvConflict, ChannelIngressParams.text, NormalizedChannelMessage.text, OutboundChannelPayload.text, OutboxRecord.text, SessionConfigResult.settings_env_conflict, SessionExecutionEvent.text, SessionExecutionEvent.tool_use_id

```js
nTe = A(() => {
    "use strict";
    XIe = Zn(xs(), 1);
    ni();
    GIe();
    ywt = 5, _wt = new Set([".md", ".txt", ".text", ".json", ".yaml", ".yml", ".toml", ".xml", ".csv", ".html", ".htm", ".css", ".scss", ".sass", ".less", ".js", ".ts", ".tsx", ".j …
})
```

### Eg (literal constant, line 57111, leaf)

spell: UPPER_SNAKE with an underscore; suggested subsystem: 03-session-actor
used by: listDefaultClaudeToolNames [03-session-actor]
assigned in: To (the body below is that assignment)
strings: "TaskStop", "ToolSearch", "TaskCreate", "TaskGet", "TaskUpdate", "TaskList", "SendMessage"
related registered names: readPiAgentSettings, formatViewSessionsListLine, initViewSessionsToolModule, issueWorkerToolContextToken, listArchivedCopiesNewestFirst, listMailboxPendingItems, listPendingInboxFiles, listSessionIndexSummaries, resolvePiAgentDir, runViewSessionsTool
protocol: AGENT_RUNTIMES(), describeMemoryReadProblem(), isAgentRuntime(), isJobCreateParams(), isMemoryReadParams(), SessionExecutionEvent.tool_name, SessionExecutionEvent.tool_use_id, SessionNotifyParams.message

```js
Eg = ["Bash", "Read", "Write", "Edit", "Grep", "Glob", "Agent", "TaskStop", "Skill", "ToolSearch", "TaskCreate", "TaskGet", "TaskUpdate", "TaskList", "SendMessage"]
```

### yXe (function, line 33566, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 03-session-actor
used by: resolveArchivedSessionDir [03-session-actor]
strings: "sessions-archive"
related registered names: archiveLegacyRegistrySessionsDir, archiveSessionDirUnlessAlreadyArchiving, moveSessionDirToArchive, archiveSessionAndArtifacts, formatViewSessionsListLine, initViewSessionsToolModule, renderActiveSessionsListing, runViewSessionsTool
protocol: isJobArchiveParams(), isSessionArchiveParams(), SpineCatParams.sessions, SystemConfigResult.sessions, SystemStatusResult.sessions, type JobArchiveParams, type SessionArchiveParams, type SessionArchiveResult
changelog: resolveArchivedSessionDir (v0.4.5, born): **Archive session tombstone** (#44): `ManageJob(archive)` now moves the session directory to `var/sessions-archive/`

```js
function yXe(e) {
    return ei.join(e.varDir, "sessions-archive")
}
```

### Oy (literal constant, line 81849, leaf)

spell: UPPER_SNAKE with an underscore; suggested subsystem: 03-session-actor
used by: runInstructionsFingerprintGuard [03-session-actor]
assigned in: UG (the body below is that assignment)
changelog: runInstructionsFingerprintGuard (v0.4.5, born): **Runtime-aware mission fingerprint guard**: when a job's mission file is edited (per the "everything is a file" design), the change takes effect on the next dr
changelog: runInstructionsFingerprintGuard (v0.5.1, changed): Instructions fingerprint guard generalized to full surface (schema v1 → v2)

```js
Oy = 2
```

## group 04-cognition-prompt (2 candidates)

### vocabulary of 04-cognition-prompt

registered names (39; the author's spelling -- reuse these verbs and nouns):
  render: renderBoardUpdatedHint, renderDaemonRestartHint, renderForOwnerAttribute, renderJobCompleteReceiptGuidance, renderJobFailureNotification, renderJobMissionBlock, renderJobTickBlock, renderMailboxEventPrompt, renderPromptLayers, renderSkipRewindBlock (+2)
  resolve: resolveBoardIncludePath, resolveBoardIncludes, resolveMetaPromptText, resolvePendingCompactNotice, resolveRolePromptText
  build: buildSystemPromptForChannelConfig, buildTransientUserBlocks
  decide: decideBoardUpdatedInjection, decideRestartHintInjection
  extract: extractStandInOwnerInfo, extractSystemPromptAppend
  format: formatElapsedDuration, formatLocalTimestampWithZone
  normalize: normalizeBoardIncludeToken, normalizeIncludePathKey
  strip: stripBoardHtmlComments, stripBoardIncludeFrontmatter
  collect: collectBoardIncludePaths
  compose: composeIdentityLayer
  compute: computeTimeGapContext
  describe: describeStandInJobOwner
  escape: escapeXmlText
  is: isBoardIncludePathCandidate
  parse: parseBoardFileContent
  project: projectJobPromptContext
  realpath: realpathOrSelf
  transclude: transcludeBroadcastBoard
CHANGELOG words paired to this subsystem: @<file>, <job-tick>, main, rolePrompt, <skip-rewind>, <time-context>, previous_run_at, resolveBoardIncludes, run_number, smart-compaction, triggered_at, -r "<what changed>", formatLocalTimestampWithZone, parseBoardFileContent, renderTimeGapContextBlock, and, collectBoardIncludePaths, collectInstructionsInputs, compact_stats, compactNotice, composeIdentityLayer, createCodexAppServerAdapter, delivered_at, describeStandInJobOwner, extractStandInOwnerInfo, for_owner, for_owner="...", getPendingRestartReason, it reached you as the main session, last_compact_at, renderDaemonRestartHint, renderForOwnerAttribute, renderJobTickBlock, renderPromptLayers, renderSkipRewindBlock, renderSmartCompactNoticeBlock, renderTranscludedFiles, roles/${role}.md, send, sent_at
protocol types and fields (@openduo/protocol): ChannelBindRequest.daemon_url, ChannelRouteResult.daemon_url, ChannelSessionBinding.daemon_url, SessionConfigResult.scope, SystemConfigResult.daemon_host, SystemConfigResult.work_dir, SystemRuntimeInfo.work_dir, SystemStatusResult.done, TenantChannelSettings.default_daemon_url

### ryt (function, line 73162, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 04-cognition-prompt
used by: buildTransientUserBlocks [04-cognition-prompt]
strings: "<time-context last_interaction=\"", " current_time=", "Approximately ", "], s = NA(e.currentEventAt); return s && o.push(", "Daemon wall-clock time: ", "), o.push(\"</time-context>\"), o.join("
related registered names: computeTimeGapContext, projectJobPromptContext, renderDaemonRestartHint, renderMailboxEventPrompt
protocol: ChannelBindRequest.daemon_url, ChannelRouteResult.daemon_url, ChannelSessionBinding.daemon_url, SystemConfigResult.daemon_host, TenantChannelSettings.default_daemon_url
changelog: buildTransientUserBlocks (v0.3.0, changed): **runner**: Add configurable time-gap session context and upgrade runtime prompt assembly to structured content blocks.
changelog: buildTransientUserBlocks (v0.5.10, changed): A one-line notice on the session's next reply reports what was compacted and its measured stats, so retuning is based on real numbers rather than guesswork. See
changelog: buildTransientUserBlocks (v0.6.2, changed): `-r "<what changed>"` reaches every session that wakes after the restart

```js
function ryt(e) {
    if (!e) return;
    let t = new Date(e.lastEventAt).getTime(),
        n = new Date(e.currentEventAt).getTime();
    if (!Number.isFinite(t) || !Number.isFinite(n)) return;
    let r = n - t;
    if (r < e.thresholdMs) return;
    let i = formatElapsedDuration(r),
        o = [`<time-context last_interaction="${escapeXmlText(e.lastEventAt)}" current_time="${escapeXmlText(e.currentEventAt)}">`, `Approximately ${i} have elapsed since your last …
        s = formatLocalTimestampWithZone(e.currentEventAt);
    return s && o.push(`Daemon wall-clock time: ${s}.`), o.push("</time-context>"), o.join(`
`)
}
```

### Mat (function, line 56666, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 04-cognition-prompt
used by: renderJobMissionBlock [04-cognition-prompt]
strings: "This job is done when all of the following hold. Verify them before you", "finish, and say which ones you could not satisfy rather than finishing", "silently. Work these do not ask for is out of scope.", "<acceptance>", "</acceptance>"
related registered names: describeStandInJobOwner, projectJobPromptContext, renderJobCompleteReceiptGuidance, renderJobFailureNotification, renderJobTickBlock
protocol: SessionConfigResult.scope, SystemConfigResult.work_dir, SystemRuntimeInfo.work_dir, SystemStatusResult.done
changelog: renderJobMissionBlock (v0.4.5, born): **Periodic job mission as system prompt** (#45): job instructions are no longer re-sent as user messages on every cron tick. The mission is injected into the sy
changelog: renderJobMissionBlock (v0.5.4, changed): Stateless runs receive an explicit contract: state is not retained, any dependency must be persisted, and the run must end with an acceptance rubric.

```js
function Mat(e) {
    let t = e?.trim();
    if (t) return ["This job is done when all of the following hold. Verify them before you", "finish, and say which ones you could not satisfy rather than finishing", "silently. W …
`)
}
```

## group 05-drain-turn (3 candidates)

### vocabulary of 05-drain-turn

registered names (74; the author's spelling -- reuse these verbs and nouns):
  render: renderCoalescedDrainPrompt, renderDrainErrorRuntimeHint, renderJobCompletionReceipt, renderManualCompactNotice, renderRuntimeMismatchGuidance, renderRuntimeUnavailableGuidance, renderTurnOutputText, renderWorkspaceUnavailableNotice
  is: isAbortLikeError, isChannelMessageEvent, isMergeableChannelMessageBatch, isMergeableDrainBatch, isNonNullObject, isStaleIdleCompactEvent, isWorkerTaskNotifyDelivery
  read: readDrainRecords, readGlobalUsageTotals, readNonNegativeNumberField, readPendingOutboundAttachments, readRecentDrainRecords, readStringProperty
  resolve: resolveDrainContextProfileOrRefuse, resolveEventSourceChannelId, resolvePendingModelFork, resolveReplyTargetSessionKeys, resolveTurnEffortWithLayer, resolveTurnModelWithLayer
  run: runDrainQueryAndCollectOutboundAttachments, runDrainTurnWithResumeFallback, runHistoryControlCommand, runQueueOutboundAttachmentTool, runSkipTool, runTimedDrainPhase
  extract: extractJobCompletePayload, extractJobCompletionJobId, extractServedModelFromUsage, extractSessionKeyChannelKind
  init: initInterruptMarkerTextModule, initMailboxDrainRunnerModule, initQueueOutboundAttachmentModule
  build: buildCompactStatsRecord, buildTurnSdkRunConfig
  clear: clearModelOverrideOnRuntimeFlip, clearPendingOutboundAttachments
  compute: computeCacheHitRate, computeCodexTurnUsage
  create: createDrainExecutionEventRecorder, createEmptyUsageSummary
  has: hasSkipRewindRecordSince, hasUniformDrainCoalesceKey
  merge: mergeInterruptedContextTexts, mergeOutboundAttachmentLists
  normalize: normalizeInputTokenTotals, normalizeTurnAbortReason
  accumulate: accumulateDrainRecordIntoSummary
  add: addToNumericField
  aggregate: aggregateSessionDrainSummary
  append: appendDrainRecord
  batch: batchDrainItems
  classify: classifyDrainBatchClass
  collect: collectJobCompletionReceipts
  count: countCompactGapIntervals
  describe: describeWorkspaceProblem
  detect: detectInProcessBreak
  (+10 more verbs)
CHANGELOG words paired to this subsystem: /model <id>, /model reset, drainSessionMailbox, pending_model_fork, runtime_mismatch, [duoduo:drain-error], /clear, /compact, /undo, ↑ in · cache% · ↓ out · $cost, agent.error, buildSystemPromptForChannelConfig, classifyDrainBatchClass, computeDrainCoalesceKey, context_used_tokens, createDaemon, createSessionManager, ctx Nk, describeStandInJobOwner, extractJobCompletionJobId, extractStandInOwnerInfo, forkFrom, isMergeableDrainBatch, main, mergeOutboundAttachmentLists, mode: "totals", model_profiles, model_runtime, options.rolePrompt, pending_skip_rewind, prepareClaudeContextProfile, readRuntimeModelSetting, renderForOwnerAttribute, resolveTurnModelWithLayer, rolePrompt, runtime_unavailable, skipped_at, source_event_type, task_id, usage.get
protocol types and fields (@openduo/protocol): OutboxRecord.fanout_index, OutboxRecord.fanout_total, SessionExecutionEvent.tool_use_id

### wfe (literal constant, line 38420, leaf)

spell: UPPER_SNAKE with an underscore; suggested subsystem: 05-drain-turn
used by: detectInProcessBreak [05-drain-turn]
assigned in: Zu (the body below is that assignment)

```js
wfe = .5
```

### gyt (function, line 73431, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 05-drain-turn
used by: hasUniformDrainCoalesceKey [05-drain-turn]
related registered names: aggregateSessionDrainSummary, extractSessionKeyChannelKind
protocol: OutboxRecord.fanout_index, OutboxRecord.fanout_total
changelog: hasUniformDrainCoalesceKey (v0.5.5, born): Parallel worker-completion notifications are coalesced into one turn.

```js
function gyt(e, t, n) {
    let {
        primaryTargetSessionKey: r,
        fanoutTargets: i
    } = resolveReplyTargetSessionKeys(e, t, n);
    return `${r}|${i.join(",")}|${resolveEventSourceChannelId(t)}`
}
```

### jo (module initialiser, line 33522, leaf)

spell: init<Name>Module; suggested subsystem: 05-drain-turn
used by: initMailboxDrainRunnerModule [05-drain-turn]
strings: "use strict", "ALADUO_SPINE_INDEX_RETENTION_DAYS"
shares Lue: also used by enqueuePartitionAppend
shares sXe: also used by scanPartitionsForEventId
shares QR: also used by appendEventIdIndexEntry, lookupEventIdIndexEntry, getOrCreateEventIdIndexCache
protocol: OutboxRecord.fanout_index, SessionExecutionEvent.tool_use_id

```js
jo = A(() => {
    "use strict";
    ic();
    YR();
    Cr();
    Xn();
    initLogLevelModule();
    Lue = new Map;
    sXe = /^\d{4}-\d{2}-\d{2}\.jsonl$/;
    QR = new Map;
    DU = 7, Fue = "ALADUO_SPINE_INDEX_RETENTION_DAYS"
})
```

## group 06-runtime-claude (4 candidates)

### vocabulary of 06-runtime-claude

registered names (50; the author's spelling -- reuse these verbs and nouns):
  create: createAbortErrorWithCause, createAgentSdkAdapter, createAladuoMcpServer, createClaudeStreamingSessionFactory
  extract: extractProfiledEndpointFields, extractSdkMessageTextChunks, extractStreamTextDeltas, extractStreamThinkingText
  is: isAgentSdkPromptNotAcceptedAbortError, isAgentSdkTurnInterruptedError, isClaudeAvailable, isClaudeRuntimeOrDefault
  resolve: resolveAdditionalDirClaudeMdAutoload, resolveClaudeContextRequirement, resolveClaudeCostBaseline
  agent: AgentSdkPromptNotAcceptedAbortError, AgentSdkTurnInterruptedError
  build: buildClaudeSettingsEnvOverrides, buildProfiledExternalRequirement
  init: initAbortableAsyncQueueModule, initMaterializedClaudeSettingsModule
  normalize: normalizeDirPathForCompare, normalizeOptionalEnvString
  parse: parseInputJsonDelta, parsePositiveMsEnv
  select: selectDominantModelByInputTokens, selectProfileIssuesForModel
  apply: applyJobSdkConfigOverride
  classify: classifyModelContextRequirement
  claude: claudeUnavailableReason
  compute: computeContextProfileSignature
  describe: describeContextProfileSource
  disable: disableSystemPromptSnapshot
  event: eventToMessageGenerator
  find: findDeadAllowedToolEntries
  has: hasParentToolUseId
  list: listSortedAliasKeys
  map: mapClaudeResultToDrainUsage
  materialize: materializeClaudeSettingsFile
  merge: mergeClaudeToolLists
  prepare: prepareClaudeContextProfile
  (+9 more verbs)
CHANGELOG words paired to this subsystem: additionalDirectories, disallowedTools, prevTotalCostUsd, tool_input_delta, baselineUnknown, CLAUDE_CODE_EXECUTABLE, mcp__, modelUsage, .env, buildClaudeSettingsEnvOverrides, classifyModelContextRequirement, claude.tools, claudeModelAliases, claudeModelProfiles, content_block_delta, createAgentSdkAdapter, duoduo onboard, env.CLAUDE_CODE_FORK_SUBAGENT = "0", hostDotEnvPath, initializeRuntime, input_json_delta, model_profiles, node_modules, npm install --omit=optional, NPM_CONFIG_OPTIONAL=false, parent_tool_use_id, prepareClaudeContextProfile, prevModelUsage, probeClaudeAvailability, session.execution, total_cost_usd, writeFileAtomic
protocol types and fields (@openduo/protocol): TurnMeta.total_cost_usd, SessionConfigProfilesView.host_max_context_tokens, SessionExecutionEvent.tool_use_id, TurnMeta.total_input_tokens, type ClaudeModelProfileAuthFieldName, ChannelBindRequest.bind_code_used_by_session_key, SessionConfigParams.profile_max_context_tokens, SessionConfigProfileEntry.max_context_tokens, ChannelBindRequest.bind_code_expires_at, ChannelBindRequest.bind_code_used_at, ChannelFileUploadParams.content_base64, OutboxRecord.fanout_index, OutboxRecord.fanout_total, SessionConfigParams.profile_auth_token, SessionConfigResult.claude_tools, SessionConfigStats.post_total, SessionConfigStats.pre_total, SessionExecutionEvent.tool_name, SystemConfigResult.daemon_host, SystemConfigResult.log_runner_tool_events, SystemConfigResult.sdk, SystemConfigResult.sdk_debug, SystemStatusResult.tool_name, TenantChannelSettings.bind_code_ttl_minutes

### cC (function, line 56365, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 06-runtime-claude
used by: createAgentSdkAdapter [06-runtime-claude], createClaudeStreamingSessionFactory [06-runtime-claude]
strings: "object", "content_block_start", "number", "tool_use", "string"
related registered names: hasParentToolUseId, stringifyToolResultContent, findDeadAllowedToolEntries, mergeClaudeToolLists
protocol: SessionExecutionEvent.tool_use_id, ChannelFileUploadParams.content_base64, OutboxRecord.fanout_index, SessionExecutionEvent.tool_name, SystemConfigResult.log_runner_tool_events, SystemStatusResult.tool_name
changelog: createAgentSdkAdapter (v0.8.4, changed): **Claude Code's own auto memory is off** in every Claude session duoduo starts, because it would keep a second memory store beside duoduo's.
changelog: createAgentSdkAdapter (v0.8.6, changed): Fork subagents stay off. Agent SDK 0.3.302 started offering "fork" subagents by default: a subagent that inherits the whole conversation and always runs on the 

```js
function cC(e) {
    if (!e || typeof e != "object" || e.type !== "content_block_start") return null;
    let n = e.index;
    if (typeof n != "number") return null;
    let r = e.content_block;
    if (!r || typeof r != "object" || r.type !== "tool_use") return null;
    let o = r.id,
        s = r.name;
    return typeof o != "string" || typeof s != "string" ? null : {
        index: n,
        toolUseId: o,
        toolName: s
    }
}
```

### mC (function, line 56461, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 06-runtime-claude
used by: createAgentSdkAdapter [06-runtime-claude], createClaudeStreamingSessionFactory [06-runtime-claude]
strings: "number", "object"
related registered names: classifyModelContextRequirement, mapClaudeResultToDrainUsage, resolveClaudeCostBaseline, selectDominantModelByInputTokens, selectProfileIssuesForModel
protocol: TurnMeta.total_cost_usd, OutboxRecord.fanout_total, SessionConfigStats.post_total, SessionConfigStats.pre_total, SystemConfigResult.sdk, SystemConfigResult.sdk_debug, TurnMeta.total_input_tokens
changelog: createAgentSdkAdapter (v0.8.4, changed): **Claude Code's own auto memory is off** in every Claude session duoduo starts, because it would keep a second memory store beside duoduo's.
changelog: createAgentSdkAdapter (v0.8.6, changed): Fork subagents stay off. Agent SDK 0.3.302 started offering "fork" subagents by default: a subagent that inherits the whole conversation and always runs on the 

```js
function mC(e, t, n) {
    if (!(!e || typeof t != "number") && !(!n || typeof n != "object")) return {
        sdk_session_id: e,
        total_cost_usd: t,
        model_usage: n
    }
}
```

### lp (function, line 71096, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 06-runtime-claude
used by: createClaudeStreamingSessionFactory [06-runtime-claude], createModelCommandResolvers [03-session-actor], runDrainTurnWithResumeFallback [05-drain-turn]
strings: "profiled-external", "native-claude", "explicit-1m"
related registered names: buildProfiledExternalRequirement, resolveClaudeContextRequirement, classifyModelContextRequirement, prepareClaudeContextProfile, writeHostClaudeCodeExecutableEnvConfig, computeContextProfileSignature, describeContextProfileSource, extractProfiledEndpointFields, selectDominantModelByInputTokens
protocol: SessionConfigProfilesView.host_max_context_tokens, SessionConfigParams.profile_max_context_tokens, SessionConfigProfileEntry.max_context_tokens, SessionConfigParams.profile_auth_token, SessionConfigResult.claude_tools, SystemConfigResult.daemon_host, type ClaudeModelProfileAuthFieldName
changelog: createModelCommandResolvers (v0.8.4, changed): Model commands (`/model`, `/effort`, `/compact`) refuse it.

```js
function lp(e) {
    let t = Ogt(e.hostMaxContextTokens),
        n = e.requirement;
    return n?.kind === "profiled-external" ? String(n.requiredMaxContextTokens) : n?.kind === "native-claude" || n?.kind === "explicit-1m" ? e.liveGenerationToken === void 0 ? t :  …
}
```

### xW (literal constant, line 70412, leaf)

spell: UPPER_SNAKE with an underscore; suggested subsystem: 06-runtime-claude
used by: writeHostClaudeCodeExecutableEnvConfig [06-runtime-claude]
assigned in: IW (the body below is that assignment)
strings: "CLAUDE_CODE_EXECUTABLE"
related registered names: verifyClaudeCodeRuntimeAvailable
protocol: ChannelBindRequest.bind_code_expires_at, ChannelBindRequest.bind_code_used_at, ChannelBindRequest.bind_code_used_by_session_key, SessionConfigResult.claude_tools, TenantChannelSettings.bind_code_ttl_minutes, type ClaudeModelProfileAuthFieldName
changelog: writeHostClaudeCodeExecutableEnvConfig (v0.5.1, born): When `duoduo onboard` runs with `CLAUDE_CODE_EXECUTABLE` set in the environment … the override is now persisted into the host `.env` so the daemon picks it up o

```js
xW = "CLAUDE_CODE_EXECUTABLE"
```

## group 07-runtime-codex (5 candidates)

### vocabulary of 07-runtime-codex

registered names (24; the author's spelling -- reuse these verbs and nouns):
  build: buildBaseInstructions, buildCodexDirectOnlyToolConfig, buildCodexDynamicTools, buildCodexTurnInput, buildDeveloperInstructions
  is: isCodexAvailable, isCodexPlainObject, isImageGenerationItemType
  codex: codexNotificationFilterDecision, codexUnavailableReason
  generate: generateAllPartitionCodexAgents, generatePartitionCodexAgents
  resolve: resolveCodexSandbox, resolveCodexSandboxForPermissionMode
  capitalize: capitalizeFirstChar
  check: checkCodexAvailability
  create: createCodexAppServerAdapter
  ensure: ensureAgentsMdSymlink
  extract: extractCodexGeneratedImageAttachment
  has: hasImageGenerationRecord
  parse: parseAgentMarkdown
  prime: primeCodexAvailability
  render: renderAgentToml
  set: __setCodexAvailabilityForTests
CHANGELOG words paired to this subsystem: ALADUO_CODEX_ENABLED, ALADUO_CODEX_SANDBOX, s_e, AGENTS.md, checkCodexAvailability, CLAUDE.md, codex --version, codex login status, hasImageGenerationRecord, imageGeneration, localImage, QueueOutboundAttachment, runManageJobTool, runNotifyTool, runSkipTool, send, Skip, thread/fork, thread/start
protocol types and fields (@openduo/protocol): SystemConfigResult.meta_prompt_path, SessionExecutionEvent.input_summary, SessionExecutionEvent.tool_use_id, ChannelBindRequest.bind_code_used_by_session_key, SystemStatusResult.meta_session, type SessionConfigProfilesView, type SessionExecutionEvent, type SessionExecutionNotification, type SessionOutputNotification, AGENT_RUNTIMES(), ChannelBindRequest.bind_code_expires_at, ChannelBindRequest.bind_code_used_at, ChannelCommandParams.command, ChannelFileDownloadParams.path, ChannelIngressParams.text, DEFAULT_PULL_WAIT_MS(), isAgentRuntime(), isChannelCommandParams(), isChannelFileDownloadParams(), isChannelFileUploadParams(), NormalizedChannelMessage.text, OutboundChannelPayload.text, OutboxRecord.text, SessionConfigProfilesView.entries

### uO (literal constant, line 64315, leaf)

spell: UPPER_SNAKE with an underscore; suggested subsystem: 07-runtime-codex
used by: buildCodexDirectOnlyToolConfig [07-runtime-codex], buildDeveloperInstructions [07-runtime-codex], createCodexAppServerAdapter [07-runtime-codex]
assigned in: rp (the body below is that assignment)
strings: "aladuo"
changelog: buildCodexDirectOnlyToolConfig (v0.7.1, born): duoduo's tools are mounted under their own namespace and pinned to the top level, so they no longer get demoted out of the model's directly-visible tool list
changelog: buildDeveloperInstructions (v0.4.4, born): feat(codex): Codex app-server adapter (Phase 1) for running job sessions on GPT-5.4
changelog: createCodexAppServerAdapter (v0.4.4, born): feat(codex): Codex app-server adapter (Phase 1) for running job sessions on GPT-5.4

```js
uO = "aladuo"
```

### AO (function, line 66542, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 07-runtime-codex
used by: buildCodexDynamicTools [07-runtime-codex], createAladuoMcpServer [06-runtime-claude]
strings: "foreground", ": return oft(); case ", ": return sft(); case ", ": return _we(); case "
protocol: SystemStatusResult.meta_session, DEFAULT_PULL_WAIT_MS(), SystemConfigResult.meta_prompt_path, TenantChannelSettings.default_daemon_url, type TurnMeta
changelog: buildCodexDynamicTools (v0.4.4, born): Dynamic tools bridge: aladuo MCP tools available to Codex sessions
changelog: buildCodexDynamicTools (v0.5.1, changed): Codex foreground: register missing tools (`Skip`, `QueueOutboundAttachment`)
changelog: buildCodexDynamicTools (v0.8.7, changed): **Skip texts name what was withheld.** The Skip tool and the notice after a skipped turn now say that the turn's text reply was not delivered, rather than every

```js
function AO(e) {
    let {
        sessionKey: t,
        sessionContextKind: n
    } = e;
    switch (n ?? (isJobSessionKeyKind(t) ? "job" : "foreground")) {
        case "job":
            return oft();
        case "meta":
            return renderMetaNotifyModeGuidance();
        case "foreground":
            return renderChannelNotifyModeGuidance();
        case "system":
            return renderSystemNotifyModeGuidance();
        default:
            return renderChannelNotifyModeGuidance()
    }
}
```

### Cy (function, line 81618, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 07-runtime-codex
used by: buildCodexDynamicTools [07-runtime-codex]
strings: "string", "object"
related registered names: parseAgentMarkdown
protocol: SessionConfigProfilesView.entries
changelog: buildCodexDynamicTools (v0.4.4, born): Dynamic tools bridge: aladuo MCP tools available to Codex sessions
changelog: buildCodexDynamicTools (v0.5.1, changed): Codex foreground: register missing tools (`Skip`, `QueueOutboundAttachment`)
changelog: buildCodexDynamicTools (v0.8.7, changed): **Skip texts name what was withheld.** The Skip tool and the notice after a skipped turn now say that the turn's text reply was not delivered, rather than every

```js
function Cy(e) {
    let t = {},
        n = [];
    for (let [r, i] of Object.entries(e)) {
        let o = i,
            s = o.description ?? o.unwrap?.()?.description;
        o.safeParse?.(void 0)?.success === !0 || n.push(r), t[r] = {
            type: "string",
            ...s ? {
                description: s
            } : {}
        }
    }
    return {
        type: "object",
        properties: t,
        required: n
    }
}
```

### Dve (function, line 64125, calls 1 candidate)

spell: camelCase (a class: PascalCase); suggested subsystem: 07-runtime-codex
used by: createCodexAppServerAdapter [07-runtime-codex]
calls candidates: Nve (named above; use the names you gave them)
strings: "commandExecution", "tool_use", ", input: { command: e.command } }; case ", ": return { type: ", ", toolUseId: n, toolName: ", ", input: { files: e.changes?.map(r => r.path) } }; case ", ", toolUseId: n, toolName: `mcp__${e.server}__${e.tool}`, input: {} }; case ", ", toolUseId: n, toolName: e.tool ?? ", ", input: {} }; case ", ", input: { text: e.text } }; case ", ": { let r = typeof e.tool == ", " ? e.tool : "
related registered names: hasImageGenerationRecord, isImageGenerationItemType, buildCodexDirectOnlyToolConfig, buildCodexDynamicTools, buildCodexTurnInput, extractCodexGeneratedImageAttachment, resolveCodexSandboxForPermissionMode, parseAgentMarkdown, renderAgentToml
protocol: SessionExecutionEvent.tool_use_id, SystemConfigResult.meta_prompt_path, AGENT_RUNTIMES(), ChannelCommandParams.command, ChannelFileDownloadParams.path, ChannelIngressParams.text, DEFAULT_PULL_WAIT_MS(), isAgentRuntime()
changelog: createCodexAppServerAdapter (v0.4.4, born): feat(codex): Codex app-server adapter (Phase 1) for running job sessions on GPT-5.4
changelog: createCodexAppServerAdapter (v0.5.1, changed): The new behavior calls `thread/fork` from the parent rollout when one is available … Falls back to `thread/start` if the parent rollout has been GC'd.

```js
function Dve(e) {
    let t = e.type,
        n = e.id;
    switch (t) {
        case "commandExecution":
            return {
                type: "tool_use", toolUseId: n, toolName: "Bash", input: {
                    command: e.command
                }
            };
        case "fileChange":
            return {
                type: "tool_use", toolUseId: n, toolName: "Write", input: {
                    files: e.changes?.map(r => r.path)
                }
            };
        case "mcpToolCall":
            return {
                type: "tool_use", toolUseId: n, toolName: `mcp__${e.server}__${e.tool}`, input: {}
            };
        case "dynamicToolCall":
            return {
                type: "tool_use", toolUseId: n, toolName: e.tool ?? "unknown", input: {}
            };
        case "webSearch":
            return {
                type: "tool_use", toolUseId: n, toolName: "WebSearch", input: {
                    query: e.query,
                    action: e.action ?? null
                }
            };
        case "plan":
            return {
                type: "tool_use", toolUseId: n, toolName: "Plan", input: {
                    text: e.text
                }
            };
        case "collabAgentToolCall": {
            let r = typeof e.tool == "string" ? e.tool : "unknown";
            return {
                type: "tool_use",
                toolUseId: n,
                toolName: `CollabAgent${capitalizeFirstChar(r)}`,
                input: {
                    tool: r,
                    receiverThreadIds: e.receiverThreadIds,
                    prompt: e.prompt,
                    model: e.model,
                    reasoningEffort: e.reasoningEffort
                }
            }
        }
        case "imageView":
            return {
                type: "tool_use", toolUseId: n, toolName: "ImageView", input: {
                    path: e.path
                }
            };
        case "sleep":
            return {
… (110 lines)
```

### Mve (function, line 64236, calls 1 candidate)

spell: camelCase (a class: PascalCase); suggested subsystem: 07-runtime-codex
used by: createCodexAppServerAdapter [07-runtime-codex]
calls candidates: Nve (named above; use the names you gave them)
strings: "commandExecution", "tool_result", ", isError: e.exitCode !== 0, summary: `exit=${e.exitCode}` }; case ", ": return { type: ", ", toolUseId: n, toolName: ", ", isError: !1, summary: `files=${JSON.stringify(e.changes?.map(r=>r.path))}` }; case ", ", toolUseId: n, toolName: `mcp__${e.server}__${e.tool}`, isError: e.status === ", ", summary: `status=${e.status}` }; case ", ", toolUseId: n, toolName: e.tool ?? ", ", isError: e.status === ", ", isError: !1, summary: Wct(e.action, e.query ?? ", ") }; case "
related registered names: buildCodexDirectOnlyToolConfig, buildCodexDynamicTools, parseAgentMarkdown, renderAgentToml
protocol: SessionExecutionEvent.tool_use_id, AGENT_RUNTIMES(), ChannelBindRequest.bind_code_expires_at, ChannelBindRequest.bind_code_used_at, ChannelBindRequest.bind_code_used_by_session_key, ChannelCommandParams.command, ChannelFileDownloadParams.path, ChannelIngressParams.text
changelog: createCodexAppServerAdapter (v0.4.4, born): feat(codex): Codex app-server adapter (Phase 1) for running job sessions on GPT-5.4
changelog: createCodexAppServerAdapter (v0.5.1, changed): The new behavior calls `thread/fork` from the parent rollout when one is available … Falls back to `thread/start` if the parent rollout has been GC'd.

```js
function Mve(e) {
    let t = e.type,
        n = e.id;
    switch (t) {
        case "commandExecution":
            return {
                type: "tool_result", toolUseId: n, toolName: "Bash", isError: e.exitCode !== 0, summary: `exit=${e.exitCode}`
            };
        case "fileChange":
            return {
                type: "tool_result", toolUseId: n, toolName: "Write", isError: !1, summary: `files=${JSON.stringify(e.changes?.map(r=>r.path))}`
            };
        case "mcpToolCall":
            return {
                type: "tool_result", toolUseId: n, toolName: `mcp__${e.server}__${e.tool}`, isError: e.status === "failed", summary: `status=${e.status}`
            };
        case "dynamicToolCall":
            return {
                type: "tool_result", toolUseId: n, toolName: e.tool ?? "unknown", isError: e.status === "failed", summary: `status=${e.status}`
            };
        case "webSearch":
            return {
                type: "tool_result", toolUseId: n, toolName: "WebSearch", isError: !1, summary: Wct(e.action, e.query ?? "")
            };
        case "plan":
            return {
                type: "tool_result", toolUseId: n, toolName: "Plan", isError: !1, summary: String(e.text ?? "")
            };
        case "collabAgentToolCall": {
            let r = typeof e.tool == "string" ? e.tool : "unknown";
            return {
                type: "tool_result",
                toolUseId: n,
                toolName: `CollabAgent${capitalizeFirstChar(r)}`,
                isError: e.status === "failed",
                summary: `status=${e.status} receivers=${JSON.stringify(e.receiverThreadIds??[])}`
            }
        }
        case "imageView":
            return {
                type: "tool_result", toolUseId: n, toolName: "ImageView", isError: !1, summary: `path=${String(e.path??"")}`
            };
        case "sleep":
            return {
                type: "tool_result", toolUseId: n, toolName: "Sleep", isError: !1, summary: `durationMs=${e.durationMs}`
            };
        case "subAgentActivity":
            return null;
        case "enteredReviewMode":
        case "exitedReviewMode":
            return null;
        case "agentMessage":
            return null;
        case "reasoning":
            return null;
        case "userMessage":
            return null;
        case "hookPrompt":
            return null;
        case "contextCompaction":
… (73 lines)
```

## group 08-cadence-subconscious (1 candidate)

### vocabulary of 08-cadence-subconscious

registered names (90; the author's spelling -- reuse these verbs and nouns):
  render: renderChannelNotifyModeGuidance, renderJobExtraToolsDescription, renderJobFileMarkdown, renderJobPromptModeDescription, renderJobSessionToolDescription, renderManageJobToolDescription, renderMetaNotifyModeGuidance, renderNotifyDeliveryReport, renderNotifyRefusalMessage, renderNotifyTargetCandidateLines (+3)
  init: initJobManagerModule, initJobSchedulerModule, initManageJobToolModule, initNotifyConsumerStalenessModule, initNotifyToolModule, initPartitionRetirementModule, initPartitionRunStateModule, initRemindDuoduoToolModule, initSubconsciousPlaylistModule
  is: isJobOrMetaOutboxRecord, isJobSessionKeyKind, isOneShotJobSchedule, isOrphanJobSessionKey, isPartitionBackedOff, isPathWithinDir, isProviderQualifiedModelId
  resolve: resolveCadenceIntervalMs, resolveJobCwdRel, resolveJobExecutionWorkspace, resolveJobOwnerNotifyTarget, resolveNotifyTargetSessionKey, resolveNotifyUnconsumedHours, resolvePartitionStatePath
  build: buildJobPromptModeExtraToolsSchema, buildJobRuntimeSchemaField, buildJobSessionInputSchema, buildJobSessionKey, buildManageJobInputSchema, buildNotifyInputSchema
  parse: parseJobFileFrontmatter, parseJobRearmTime, parsePartitionDefinition, parsePlaylistCurrentRound, parseScheduleDurationMs
  read: readLatestExternalEventId, readNewestMtimeRecursive, readPartitionInboxEntries, readPartitionRunState, readPlaylistRound
  run: runCadenceTick, runManageJobTool, runNotifyTool, runRemindDuoduoTool
  classify: classifyConsumerStaleness, classifyJobScheduleType, classifyNotifySessionKind
  compute: computeBoundedEditDistance, computeLegacyJobSessionKey, computePartitionBackoffUntil
  normalize: normalizeJobCwdRelText, normalizeNotifyChannelTarget, normalizePartitionOutputText
  create: createJobScheduler, createOutboxDeliveryManager
  list: listSelectableJobRuntimes, listSessionsWithRecentConsumer
  retire: retireListedPartitions, retirePartitionOnce
  append: appendPartitionToolEvent
  assert: assertScheduleDurationRepresentable
  contains: containsWhitespaceChar
  detect: detectEmptyRequiredPartitionOutput
  evaluate: evaluateNotifyConsumerRefusal
  fire: fireDueWakeRecords
  group: groupNotifyTargetCandidates
  hash: hashActivityFingerprint
  load: loadSubconsciousPartitions
  mark: markPlaylistItemExecuted
  (+9 more verbs)
CHANGELOG words paired to this subsystem: main, cwd_rel, session_key, correlation_id, reply_to, @every, @in, 1d6h4m, 2h30m, ALADUO_NOTIFY_UNCONSUMED_HOURS, allowedTools, memory-weaver, prompt_mode, runtime, ..x, additionalDirectories, disallowedTools, finalSubscriberCount, ManageJob, owner_session, RemindDuoduo, resolveMain, runManageJobTool, .., ../, "claude", "codex", action, assertScheduleDurationRepresentable, attached, buildJobRuntimeSchemaField, classifyConsumerStaleness, claude: { tools }, CLAUDE.md, claudeModelProfiles, consumer attached now, createJobSessionFinalizer, deliverRouteEventToSession, delivery_cursors, duoduo job archive <id>
protocol types and fields (@openduo/protocol): JobCreateParams.cron, SpineCatParams.date

### dve (function, line 62626, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 08-cadence-subconscious
used by: scanAndSpawnDueJobs [08-cadence-subconscious]
strings: "string", " || e.startsWith(", ")) && t === null) return !1 } } let o = typeof r == ", " && r.length > 0 ? new Date(r).getTime() : Number.NaN, s = Number.isFinite(o); if (e === ", " || e === ", ") return t !== null ? !1 : s ? n.getTime() >= o : !0; if (e.startsWith(", "@every "
shares Xw: also used by validateJobScheduleExpression
related registered names: parseJobRearmTime, parsePlaylistCurrentRound, parseJobFileFrontmatter, parsePartitionDefinition, retirePartitionOnce, validateJobScheduleExpression
protocol: JobCreateParams.cron, SpineCatParams.date
changelog: scanAndSpawnDueJobs (v0.5.0, changed): Cadence scheduler skips due jobs whose session is being archived
changelog: parseScheduleDurationMs (v0.6.1, born): `@in` and `@every` now accept composite durations such as `2h30m` and `1d6h4m`. Invalid cron strings, malformed durations, and delays outside the representable 

```js
function dve(e, t, n = new Date, r, i) {
    if (typeof i == "string" && i.length > 0) {
        let a = new Date(i).getTime();
        if (Number.isFinite(a)) {
            if (n.getTime() >= a) return !0;
            if ((e === "once" || e.startsWith("@in ")) && t === null) return !1
        }
    }
    let o = typeof r == "string" && r.length > 0 ? new Date(r).getTime() : Number.NaN,
        s = Number.isFinite(o);
    if (e === "once" || e === "keepalive") return t !== null ? !1 : s ? n.getTime() >= o : !0;
    if (e.startsWith("@in ")) {
        let a = e.substring(4).trim();
        try {
            let u = parseScheduleDurationMs(a);
            return t !== null ? !1 : s ? n.getTime() - o >= u : !0
        } catch {
            return !1
        }
    }
    if (e.startsWith("@every ")) {
        let a = e.substring(7).trim();
        try {
            let u = parseScheduleDurationMs(a);
            if (!t) return s ? n.getTime() >= o : !0;
            let l = new Date(t).getTime();
            return n.getTime() - l >= u
        } catch {
            return !1
        }
    }
    try {
        if (!t) return s ? Xw.CronExpressionParser.parse(e, {
            currentDate: new Date(o),
            tz: "UTC"
        }).next().toDate().getTime() <= n.getTime() : (Xw.CronExpressionParser.parse(e, {
            currentDate: n,
            tz: "UTC"
        }), !0);
        let u = Xw.CronExpressionParser.parse(e, {
                currentDate: new Date(t),
                tz: "UTC"
            }).next().toDate(),
            l = new Date(t).getTime();
        return Number.isNaN(l) ? !0 : u.getTime() <= n.getTime()
    } catch {
        return !1
    }
}
```

## group 09-memory (4 candidates)

### vocabulary of 09-memory

registered names (112; the author's spelling -- reuse these verbs and nouns):
  init: initActivationLintModule, initBoardLintModule, initBroadcastBudgetLintModule, initBroadcastFlattenLintModule, initBroadcastLinkLintModule, initEntityLintModule, initFoldGapLintModule, initGapLintModule, initGapSpanModule, initKernelGitModule (+5)
  run: runActivationLint, runBoardLint, runBroadcastBudgetLint, runBroadcastFlattenLint, runBroadcastLinkLint, runEntityLint, runFoldGapLint, runKernelGitCommand, runMemoryCheckSubStep, runMemoryCheckTick (+2)
  build: buildBoardLintTarget, buildGapReadFaultResult, buildKernelGitEnv, buildMemoryCheckStatus, buildOrphanIslandsSignal, buildOrphanNewbornSignals, buildSafeDirectoryGitArgs, buildScanGapSignal
  is: isAllowedNodeSection, isKernelGitToplevel, isMemoryPathDirectory, isMemoryPathFile, isOrphanWarningDeliverable, isPlainJsonObject, isSafeMemorySlug, isTruthyEnvFlag
  render: renderActivationReportBody, renderActivationReportHeader, renderBoardTemperatureSection, renderEntityConvergeSignalBody, renderFoldGapBody, renderHotOrphansSection, renderOrphanIslandsBody, renderScanGapSignalBody
  read: readGapLintDayEvents, readIntuitionWeaverLastFinishedMs, readMemoryFileSyncOrNull, readMemoryMaxLinesLimit, readOrSeedGapHandedDays, readPartitionContract
  list: listEventPartitionDates, listMarkdownSlugsSync, listMemoryFragmentDates, listMemorySlugReferrers
  resolve: resolveGitToplevelSync, resolveMemoryCheckFlags, resolveMemoryDirs, resolveMemoryLinkTargets
  compute: computeBoardLayerHash, computeMemoryLinkIndegree, computeOrphanTopicNodes
  count: countDatedStampLines, countNewlineChars, countUnreadableMemoryPaths
  parse: parseEffectivenessCounts, parseEffectivenessTrajectory, parseUpdaterGuidanceVerdict
  classify: classifyTopicNodeFormat, classifyTopicNodeType
  compare: compareBoardLintTargets, compareStringsAscending
  find: findBoardHeadingLines, findNewestFragmentMtimeMs
  format: formatForgetCommitMessage, formatSlugLinkLocations
  merge: mergeContiguousHourRanges, mergeKernelGitignoreEntries
  partition: partitionInboxDir, partitionInboxDirFromVar
  record: recordUnreadableMemoryPath, recordUnreadableUnlessMissing
  scan: scanActivationWindowTouches, scanWikiLinkOccurrences
  bytes: bytesToKibCeil
  collect: collectBoardLintReport
  create: createMemorySlugReader
  deliver: deliverScanGapSignal
  detect: detectOrphanMemory
  (+17 more verbs)
CHANGELOG words paired to this subsystem: ALADUO_EXP_MEMORY_CHECK=1, .pending, contract:, ALADUO_EXP_MEMORY_FORGET=1, enforceContractGate, forgetMemoryEntry, runGapLint, buildBoardLintTarget, duoduo memory check, last_finished_at, readPartitionContract, routeContractDecision, runBoardLint, runMemoryCheckTick, scanActivationWindowTouches, tool_use, walkReachableMemory
protocol types and fields (@openduo/protocol): describeMemoryReadProblem(), isMemoryReadParams(), type MemoryReadParams, type MemoryReadResult, ChannelOutboundCapabilities.accept_stream_end_reasons, isChannelFileDownloadParams(), isChannelFileUploadParams(), OutboxRecord.format, SessionConfigSettingsEnvConflict.file, SpineCatParams.count_only, SpineCatParams.date, SystemConfigResult.log_runner_tool_events, SystemStatusResult.final_subscriber_count, SystemStatusResult.memory_check, type ChannelFileDownloadParams, type ChannelFileUploadParams, type SessionStreamEndNotification

### vke (function, line 69065, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 09-memory
used by: deliverScanGapSignal [09-memory]
strings: "memory", ", \"utf8\") }"
shares Rke: also used by readOrSeedGapHandedDays
related registered names: readMemoryFileSyncOrNull, isMemoryPathFile, listMarkdownSlugsSync, measureUtf8ByteLength, resolveGitToplevelSync
protocol: describeMemoryReadProblem(), isChannelFileDownloadParams(), isChannelFileUploadParams(), isMemoryReadParams(), SessionConfigSettingsEnvConflict.file, SystemStatusResult.memory_check, type ChannelFileDownloadParams, type ChannelFileUploadParams
changelog: deliverScanGapSignal (v0.8.0, born): one distils raw experience into fragments

```js
function vke(e, t) {
    let n = Wc.join(e, "memory");
    du.mkdirSync(n, {
        recursive: !0
    }), du.appendFileSync(Wc.join(n, Rke), `${cke(t)}
`, "utf8")
}
```

### cmt (function, line 69166, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 09-memory
used by: deliverScanGapSignal [09-memory]
strings: "), a = bke(t, o), u = rmt(a); if (u < ya && i.dates.includes(o)) { let d = wke(Wc.join(e, ", ")); if (d.readFault) return uA(null); let f = -1; for (let p of d.events) p.interaction && p.msO", ")); return c.readFault ? uA(l) : uW(l, kke(Ske(c.events, l))) }"
related registered names: listEventPartitionDates, listMemoryFragmentDates, measureUtf8ByteLength, parseEffectivenessCounts, parseEffectivenessTrajectory, parseUpdaterGuidanceVerdict
protocol: ChannelOutboundCapabilities.accept_stream_end_reasons, describeMemoryReadProblem(), isMemoryReadParams(), SpineCatParams.date, SystemConfigResult.log_runner_tool_events, type MemoryReadParams, type MemoryReadResult, type SessionStreamEndNotification
changelog: deliverScanGapSignal (v0.8.0, born): one distils raw experience into fragments
changelog: readGapLintDayEvents (v0.8.0, born): one distils raw experience into fragments
changelog: mergeContiguousHourRanges (v0.5.8, born): It now works one bounded day at a time, picked by a program-computed gap check (`duoduo memory check` reports the chosen gap)

```js
function cmt(e, t, n, r) {
    let i = tmt(e);
    if (i.readFault) return buildGapReadFaultResult(null);
    let o = new Date(n).toISOString().slice(0, 10),
        s = Date.parse(`${o}T00:00:00.000Z`),
        a = bke(t, o),
        u = rmt(a);
    if (u < ya && i.dates.includes(o)) {
        let d = readGapLintDayEvents(Wc.join(e, `${o}.jsonl`));
        if (d.readFault) return buildGapReadFaultResult(null);
        let f = -1;
        for (let p of d.events) p.interaction && p.msOfDay > u && p.msOfDay > f && (f = p.msOfDay);
        if (f >= 0 && n - (s + f) >= r) {
            let p = {
                date: o,
                startMs: u,
                endMs: f
            };
            return uW(p, mergeContiguousHourRanges(Ske(d.events, p)))
        }
    }
    let l = null;
    for (let d = i.dates.length - 1; d >= 0; d -= 1) {
        let f = i.dates[d];
        if (f >= o) continue;
        let p = imt(f, bke(t, f));
        if (p.length > 0) {
            l = p[p.length - 1];
            break
        }
    }
    if (l === null) return uW(null, []);
    let c = readGapLintDayEvents(Wc.join(e, `${l.date}.jsonl`));
    return c.readFault ? buildGapReadFaultResult(l) : uW(l, mergeContiguousHourRanges(Ske(c.events, l)))
}
```

### eA (function, line 68529, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 09-memory
used by: runNodeLint [09-memory]
related registered names: createMemorySlugReader, extractBoardSlugLinks, formatSlugLinkLocations, isSafeMemorySlug, listMemorySlugReferrers
changelog: runNodeLint (v0.5.5, born): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the

```js
function eA(e) {
    return `${e.type}-${e.slug}`
}
```

### Lpt (function, line 68468, calls 1 candidate)

spell: camelCase (a class: PascalCase); suggested subsystem: 09-memory
used by: runNodeLint [09-memory]
calls candidates: eA (named above; use the names you gave them)
strings: "[node-converge] [[", "node: topics/", "]; if (e.lines > Q6 && n.push(", "lines: ", "), e.unexpectedSectionCount > 0) { n.push(", "unexpected-sections: ", "); for (let r of e.unexpectedSections) n.push(", " - ## ", ") } return n.push(", "reachable: ", "}`), e.escalated && n.push(", "action: revisit per your Node Format + Revisit discipline — converge to the bounded callable rule (## Condition / ## Pro"
shares Q6: also used by runNodeLint
related registered names: classifyTopicNodeFormat, countDatedStampLines, isAllowedNodeSection, classifyTopicNodeType, countNewlineChars, countUnreadableMemoryPaths, findBoardHeadingLines, formatForgetCommitMessage, formatSlugLinkLocations, initNodeLintModule
protocol: OutboxRecord.format, SpineCatParams.count_only, SystemStatusResult.final_subscriber_count
changelog: runNodeLint (v0.5.5, born): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the

```js
function Lpt(e) {
    let t = eA(e),
        n = [`[node-converge] [[${t}]]`, `node: topics/${t}.md`];
    if (e.lines > Q6 && n.push(`lines: ${e.lines} (over ${Q6})`), e.unexpectedSectionCount > 0) {
        n.push(`unexpected-sections: ${e.unexpectedSectionCount}`);
        for (let r of e.unexpectedSections) n.push(`  - ## ${r}`)
    }
    return n.push(`reachable: ${e.reachable?"yes":"no"}`), e.escalated && n.push("escalated: WASTED-COMPUTE — walked-off AND board-unreachable; consider whether this node should ex …
`) + `
`
}
```

## group 10-runtime-host (3 candidates)

### vocabulary of 10-runtime-host

registered names (90; the author's spelling -- reuse these verbs and nouns):
  is: isAgentRuntime, isBusinessSourceKind, isClaudeAuthSource, isDirEmptyOrMissing, isEffortLevel, isHostModelEnvKey, isKnownRuntimeValue, isLogLevelEnabled, isSessionLifecycleLoggingEnabled, isSupportedRuntime (+1)
  resolve: resolveChannelConfigBySession, resolveDefaultRuntime, resolveEffectiveChannelConfig, resolveEffectiveChannelConfigForEvent, resolveEnvConfigEntry, resolveLayeredChannelRuntime, resolveLogLevel, resolvePiWorkerCommand, resolveRuntimePaths
  log: logAlwaysAtLevel, logDebugMessage, logErrorMessage, logInfoMessage, logLatencyStageTelemetry, logSessionLifecycleMessage, logTraceMessage, logWarnMessage
  parse: parseChannelConfigFields, parseChannelRuntimeField, parseClaudeFrontmatterBlock, parseDotEnv, parseEnvBooleanFlag, parseLogLevelName, parsePiToolResultDetails
  build: buildEffectiveChannelConfig, buildEffectiveRuntimeFields, buildPiSystemPromptSpec, buildSdkConfigReport, buildSystemConfigReport
  read: readClaudeAuthSourceEnv, readHostDaemonToken, readHostDotEnvFile, readRuntimeEffortSetting, readRuntimeModelSetting
  write: writeHostDaemonToken, writeHostDotEnvLines, writeHostModelEnvConfig, writeInstanceModelAlias, writeLogLine
  format: formatLayerModelAliases, formatLogPrefix, formatModelConfigIssues, formatYamlErrorMessage
  append: appendConfigChangedEvent, appendPiConfigIssues, appendTelemetryRecord
  copy: copyBootstrapIntoKernel, copyDirTreeMissingOnly, copyDirTreeOverwrite
  init: initChannelConfigLoaderModule, initLogLevelModule, initRuntimeValidationModule
  load: loadChannelKindConfig, loadGlobalRuntimeConfig, loadHostDotEnv
  merge: mergeGlobalModelConfigLayers, mergeRuntimeEffortLayers, mergeRuntimeModelLayers
  validate: validateConfigValue, validateKnownRuntimeValue, validateRunnableRuntimeValue
  clear: clearHostModelEnvConfig, clearHostModelEnvVars
  host: HOST_MODEL_ENV_KEYS, hostDotEnvPath
  remove: removeDotEnvKeyLines, removeHostModelEnvLines
  apply: applyHostModelEnvVars
  channel: CHANNEL_CONFIG_KEY_TYPES
  create: createPiWorkerAdapter
  encode: encodePiWorkerFrame
  fold: foldConfigLayersByKey
  handle: handlePiToolEndObservation
  initialize: initializeRuntime
  (+5 more verbs)
CHANGELOG words paired to this subsystem: auto_compact_idle_minutes, auto_compact_min_context_tokens, model_aliases, system.config, validateRunnableRuntimeValue, .env, ALADUO_DEFAULT_RUNTIME, ALADUO_TELEMETRY_ENABLED, claude, claude_code_local, default, env, false, resolveDefaultRuntime, runtimeRefusal, unset, validateKnownRuntimeValue, var/telemetry/*.jsonl, void, /compact, anthropic_api_key, applyHostModelEnvVars, buildJobRuntimeSchemaField, claudeModelProfileIssues, compatible_endpoint, createIdleCompactSweeper, createPiWorkerAdapter, duoduo daemon token new, foldConfigLayersByKey, handlePiToolEndObservation, hostDotEnvPath, isClaudeAuthSource, isKnownRuntimeValue, isTelemetryEnabled, kernel_dir, kernelDir, loadHostDotEnv, macOS, mergeRuntimeModelLayers, model_profiles
protocol types and fields (@openduo/protocol): SystemConfigResult.bootstrap_dir, ChannelBindRequest.daemon_url, ChannelRouteResult.daemon_url, ChannelSessionBinding.daemon_url, isChannelFileDownloadParams(), isChannelFileUploadParams(), SessionArchiveResult.archived_paths, SessionConfigParams.profile_auth_token, SessionConfigResult.claude_tools, SessionConfigSettingsEnvConflict.file, SpineCatParams.types, SystemConfigResult.daemon_host, SystemConfigResult.paths, SystemStatusResult.in_flight_tools, TenantChannelSettings.default_daemon_url, type ChannelFileDownloadParams, type ChannelFileUploadParams

### Igt (function, line 70980, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 10-runtime-host
used by: initializeRuntime [10-runtime-host]
strings: "DUODUO.md"
related registered names: copyBootstrapIntoKernel, copyDirTreeMissingOnly, copyDirTreeOverwrite, CHANNEL_CONFIG_KEY_TYPES, isDirEmptyOrMissing, readHostDotEnvFile
protocol: SystemConfigResult.bootstrap_dir, isChannelFileDownloadParams(), isChannelFileUploadParams(), SessionConfigSettingsEnvConflict.file, SpineCatParams.types, type ChannelFileDownloadParams, type ChannelFileUploadParams

```js
async function Igt(e) {
    let t = cr.join(e.bootstrapDir, "var");
    if (!await pathExistsAsync(t)) return;
    async function n(r, i) {
        let o = await lr.readdir(r, {
            withFileTypes: !0
        });
        for (let s of o) {
            let a = cr.join(r, s.name),
                u = cr.join(i, s.name);
            s.isDirectory() ? await n(a, u) : s.isFile() && s.name === "DUODUO.md" && (await ensureDirectoryExists(i), await lr.copyFile(a, u))
        }
    }
    await n(t, e.varDir)
}
```

### fq (function, line 36652, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 10-runtime-host
used by: parseChannelConfigFields [10-runtime-host], parseJobFileFrontmatter [08-cadence-subconscious]
shares mf: also used by listFrontmatterKeyAliases, parseChannelConfigFields
related registered names: resolveRuntimePaths
protocol: SessionArchiveResult.archived_paths, SessionConfigResult.claude_tools, SystemConfigResult.paths, SystemStatusResult.in_flight_tools
changelog: parseChannelConfigFields (v0.5.10, born): enable and tune per conversation with `duoduo session config <session> set auto_compact_idle_minutes=50 auto_compact_min_context_tokens=100000`.
changelog: parseJobFileFrontmatter (v0.6.2, changed): A job's frontmatter now accepts `prompt_mode`, `allowedTools`, `disallowedTools`, `additionalDirectories` and a nested `claude: { tools }`
changelog: parseClaudeFrontmatterBlock (v0.7.0, born): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no lo

```js
function fq(e) {
    return {
        allowedTools: sq(e, mf.allowedTools),
        disallowedTools: sq(e, mf.disallowedTools),
        additionalDirectories: sq(e, mf.additionalDirectories, {
            expandPaths: !0
        }),
        ...parseClaudeFrontmatterBlock(e),
        ...snt(e),
        ...cq(e),
        ...dq(e)
    }
}
```

### fA (literal constant, line 70413, leaf)

spell: UPPER_SNAKE with an underscore; suggested subsystem: 10-runtime-host
used by: readHostDaemonToken [10-runtime-host], writeHostDaemonToken [10-runtime-host]
assigned in: IW (the body below is that assignment)
strings: "ALADUO_DAEMON_TOKEN"
protocol: ChannelBindRequest.daemon_url, ChannelRouteResult.daemon_url, ChannelSessionBinding.daemon_url, SessionConfigParams.profile_auth_token, SystemConfigResult.daemon_host, TenantChannelSettings.default_daemon_url
changelog: readHostDaemonToken (v0.7.0, born): The remote listener starts only when a host, a port and a token are all present, and every request must carry the token.
changelog: writeHostDaemonToken (v0.7.0, born): If you genuinely need to reach a daemon from another machine, `duoduo daemon token new` generates a bearer token and stores it with owner-only permissions.

```js
fA = "ALADUO_DAEMON_TOKEN"
```

## group 11-runtime-grok (5 candidates)

### vocabulary of 11-runtime-grok

registered names (14; the author's spelling -- reuse these verbs and nouns):
  grok: GROK_ACP_EXT_PREFIX, GROK_ACP_SDK_CALL, GROK_AGENT_PROFILE, GROK_DISALLOWED_TOOLS, GROK_MCP_SDK_META, GROK_MCP_SERVERS_META, grokUnavailableReason
  is: isGrokAvailable, isGrokSkipToolCall
  coerce: coerceToPlainObject
  create: createGrokAcpAdapter
  map: mapGrokUsageToDrainUsage
  prime: primeGrokAvailability
  set: __setGrokAvailabilityForTests
CHANGELOG words paired to this subsystem: checkGrokAvailability, collectGrokToolCallNames, set_model
protocol types and fields (@openduo/protocol): ChannelOutboundCapabilities.accept_stream_end_reasons, describeConversationProblem(), SessionExecutionEvent.tool_name, SessionExecutionEvent.tool_use_id, SpineRecordParams.conversation, SystemConfigResult.log_runner_tool_events, SystemConfigResult.meta_prompt_path, SystemStatusResult.meta_session, SystemStatusResult.tool_name, type SessionStreamEndNotification, type TurnMeta

### rc (function, line 33078, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 11-runtime-grok
used by: createGrokAcpAdapter [11-runtime-grok], createPiWorkerAdapter [10-runtime-host], requestPiWorkerCatalog [03-session-actor]
strings: ", o), e.off(", ", s), e.off(", ", s) }; return e.on(", ", o), e.on(", ", s), e.on("
protocol: ChannelOutboundCapabilities.accept_stream_end_reasons, type SessionStreamEndNotification
changelog: createGrokAcpAdapter (v0.7.1, born): It sits behind the same seam as Claude and Codex rather than beside it: one long-lived agent process per session, duoduo's own tools reachable from it, mid-turn
changelog: createPiWorkerAdapter (v0.8.0, born): pi joins Claude, Codex and Grok as a fourth agent runtime.

```js
function rc(e, t, n) {
    let r = Due(t),
        i = !1,
        o = u => {
            r.write(u)
        },
        s = () => {
            i || (i = !0, r.flush(), a(), n?.onEof?.())
        },
        a = () => {
            e.off("data", o), e.off("end", s), e.off("close", s)
        };
    return e.on("data", o), e.on("end", s), e.on("close", s), {
        close() {
            i || (i = !0, a())
        }
    }
}
```

### aS (function, line 64584, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 11-runtime-grok
used by: createGrokAcpAdapter [11-runtime-grok]
changelog: createGrokAcpAdapter (v0.7.1, born): It sits behind the same seam as Claude and Codex rather than beside it: one long-lived agent process per session, duoduo's own tools reachable from it, mid-turn

```js
function aS(e) {
    let t = e.replace(/^_?x\.ai\//, "");
    return `${GROK_ACP_EXT_PREFIX}/${t}`
}
```

### Hve (literal constant, line 65279, leaf)

spell: UPPER_SNAKE with an underscore; suggested subsystem: 11-runtime-grok
used by: createGrokAcpAdapter [11-runtime-grok]
assigned in: Vg (the body below is that assignment)
strings: "aladuo"
changelog: createGrokAcpAdapter (v0.7.1, born): It sits behind the same seam as Claude and Codex rather than beside it: one long-lived agent process per session, duoduo's own tools reachable from it, mid-turn

```js
Hve = "aladuo"
```

### Wve (function, line 64636, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: 11-runtime-grok
used by: isGrokSkipToolCall [11-runtime-grok]
strings: "x.ai/tool", "string"
related registered names: GROK_MCP_SDK_META, GROK_MCP_SERVERS_META
protocol: SessionExecutionEvent.tool_name, SessionExecutionEvent.tool_use_id, SystemConfigResult.log_runner_tool_events, SystemConfigResult.meta_prompt_path, SystemStatusResult.meta_session, SystemStatusResult.tool_name, type TurnMeta
changelog: isGrokSkipToolCall (v0.7.1, born): duoduo's own tools reachable from it

```js
function Wve(e) {
    let t = coerceToPlainObject(e._meta);
    return [coerceToPlainObject(t["x.ai/tool"]).name, e.name, e.toolName, e.title, e.kind].filter(i => typeof i == "string" && i.length > 0)
}
```

### qve (literal constant, line 65279, calls 1 candidate)

spell: UPPER_SNAKE with an underscore; suggested subsystem: 11-runtime-grok
used by: createGrokAcpAdapter [11-runtime-grok]
calls candidates: aS (named above; use the names you gave them)
assigned in: Vg (the body below is that assignment)
strings: "compact_conversation"
protocol: describeConversationProblem(), SpineRecordParams.conversation
changelog: createGrokAcpAdapter (v0.7.1, born): It sits behind the same seam as Claude and Codex rather than beside it: one long-lived agent process per session, duoduo's own tools reachable from it, mid-turn

```js
qve = aS("compact_conversation")
```

## group - (3 candidates)

### vocabulary of -

protocol types and fields (@openduo/protocol): SessionExecutionEvent.tool_use_id, type SessionExecutionEvent, isSystemRuntimeInfo(), OutboxRecord.in_reply_to_event_id, type SystemRuntimeInfo, SessionNotifyParams.caller_session, SessionSetAliasParams.caller_in_session, SessionSetAliasParams.caller_session, type NormalizedChannelMessage, type SessionExecutionNotification, type SessionOutputNotification, type SessionStreamEndNotification, ChannelIngressParams.text, ChannelOutboundCapabilities.accept_stream_end_reasons, isRuntimeInfoParams(), NormalizedChannelMessage.text, OutboundChannelPayload.text, OutboxRecord.text, SessionConfigStats.g_5m1h_since_prev_compact, SessionConfigStats.g_gt1h_since_prev_compact, SessionExecutionEvent.text, SessionExecutionEvent.tool_name, SessionListEntry.main_since, SessionListParams.named_only

### tl (module initialiser, line 56256, leaf)

spell: init<Name>Module; suggested subsystem: -
used by: 
strings: "use strict", ", Ic = ", ", MV = [", "Calling Skip immediately ends this turn. Skip is the only way to produce", "silence — any text you emit is user-visible output, including", "received", "no need to reply", "In a turn you decide to skip, write no text before Skip — text streamed before Skip", "can still reach the user. Tool calls before Skip are fine: do the work, or send what", "belongs elsewhere, then call Skip.", "Give a specific reason. On your next turn, a <skip-rewind> block returns:", "- The reason you provided"
shares $s: also used by createCodexAppServerAdapter, handlePiToolEndObservation, createAladuoMcpServer, buildCodexDynamicTools
shares Ic: also used by createAgentSdkAdapter, createClaudeStreamingSessionFactory, createSessionManager
shares MV: also used by createAladuoMcpServer
shares s_e: also used by buildCodexDynamicTools
shares iC: also used by createAladuoMcpServer, buildCodexDynamicTools
protocol: SessionExecutionEvent.tool_use_id, type NormalizedChannelMessage, ChannelIngressParams.text, ChannelOutboundCapabilities.accept_stream_end_reasons, NormalizedChannelMessage.text, OutboundChannelPayload.text, OutboxRecord.in_reply_to_event_id, OutboxRecord.text

```js
tl = A(() => {
    "use strict";
    Rc();
    initLogLevelModule();
    initReservedMainAliasModule();
    $s = "Skip", Ic = "mcp__aladuo__Skip", MV = ["End this turn with no output to the user/channel.", "", "Calling Skip immediately ends this turn. Skip is the only way to produce" …
`), s_e = MV.replace("Calling Skip immediately ends this turn.", "After you call Skip, nothing further you produce this turn will be delivered."), iC = {
        reason: ht.string().describe("Why you are skipping this turn. Be specific — this reason will be shown to you on your next turn via <skip-rewind> so you can maintain continu …
    }
})
```

### sC (module initialiser, line 56266, leaf)

spell: init<Name>Module; suggested subsystem: -
used by: 
strings: "use strict", "ALADUO_CALLER_SESSION"
shares nl: also used by createAgentSdkAdapter, createSessionManager, main
protocol: SessionNotifyParams.caller_session, SessionSetAliasParams.caller_in_session, SessionSetAliasParams.caller_session, SessionExecutionEvent.tool_use_id

```js
sC = A(() => {
    "use strict";
    nl = "ALADUO_CALLER_SESSION"
})
```

### Nve (function, line 64117, leaf)

spell: camelCase (a class: PascalCase); suggested subsystem: -
used by: 
strings: "; xve.has(n) || (xve.add(n), wt(\"info\", \"[codex] item/\" + e + \" has no execution-event mapping — dropping silently\","
protocol: type SessionExecutionEvent, isRuntimeInfoParams(), isSystemRuntimeInfo(), type RuntimeInfoParams, type SessionExecutionNotification, type SystemRuntimeInfo

```js
function Nve(e, t) {
    let n = `${e}:${t}`;
    xve.has(n) || (xve.add(n), logAlwaysAtLevel("info", "[codex] item/" + e + " has no execution-event mapping — dropping silently", {
        phase: e,
        type: t
    }))
}
```
