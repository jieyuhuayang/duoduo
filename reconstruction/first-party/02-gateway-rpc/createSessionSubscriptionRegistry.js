// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: createSessionSubscriptionRegistry  (minified: B6, daemon.pretty.js:91148)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.7, v0.5.0, v0.5.6, v0.5.7, v0.5.10, v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 69 renamed — 16 from the code at the binding (rule), 53 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSessionSubscriptionRegistry() {
    let map = new Map,
        map2 = new Map,
        bus = null,
        attachmentCallbacks = {},
        defaultReturnMask = ["final", "stream"],
        acceptsKind = (subscriber, kind) => (subscriber.returnMask ?? defaultReturnMask).includes(kind);

    function publishOutput(sessionKey, record) {
        let subscriberIds = map2.get(sessionKey);
        if (!subscriberIds || subscriberIds.size === 0) return 0;
        let message = {
                jsonrpc: "2.0",
                method: "session.output",
                params: {
                    session_key: sessionKey,
                    record
                }
            },
            deliveredCount = 0;
        for (let subscriberId of subscriberIds) {
            let subscriber = map.get(subscriberId);
            if (subscriber && acceptsKind(subscriber, "final")) try {
                subscriber.send(message), deliveredCount += 1
            } catch {
                unsubscribe(subscriberId)
            }
        }
        return deliveredCount
    }
    let onStream = streamEvent => {
            let {
                sessionKey,
                chunk,
                isSidechain,
                anchorEventId
            } = streamEvent, subscriberIds = map2.get(sessionKey);
            if (!subscriberIds || subscriberIds.size === 0) return;
            let message = {
                jsonrpc: "2.0",
                method: "session.stream",
                params: {
                    session_key: sessionKey,
                    chunk,
                    is_sidechain: isSidechain,
                    anchor_event_id: anchorEventId
                }
            };
            for (let subscriberId of subscriberIds) {
                let subscriber = map.get(subscriberId);
                if (subscriber && acceptsKind(subscriber, "stream")) try {
                    subscriber.send(message)
                } catch {
                    unsubscribe(subscriberId)
                }
            }
        },
        onExecution = executionEvent => {
            let {
                sessionKey,
                event,
                anchorEventId,
                isSidechain
            } = executionEvent, subscriberIds = map2.get(sessionKey);
            if (!subscriberIds || subscriberIds.size === 0) return;
            let message = {
                jsonrpc: "2.0",
                method: "session.execution",
                params: {
                    session_key: sessionKey,
                    event,
                    is_sidechain: isSidechain,
                    anchor_event_id: anchorEventId
                }
            };
            for (let subscriberId of subscriberIds) {
                let subscriber = map.get(subscriberId);
                if (subscriber && acceptsKind(subscriber, "tool")) try {
                    subscriber.send(message)
                } catch {
                    unsubscribe(subscriberId)
                }
            }
        },
        onStreamEnd = streamEndEvent => {
            let {
                sessionKey,
                reason,
                anchorEventId
            } = streamEndEvent, subscriberIds = map2.get(sessionKey);
            if (!(!subscriberIds || subscriberIds.size === 0))
                for (let subscriberId of subscriberIds) {
                    let subscriber = map.get(subscriberId);
                    if (subscriber && acceptsKind(subscriber, "stream_end")) {
                        let deliveredReason = reason === "interrupted" || subscriber.acceptStreamEndReasons?.includes(reason) ? reason : "interrupted",
                            message = {
                                jsonrpc: "2.0",
                                method: "session.stream_end",
                                params: {
                                    session_key: sessionKey,
                                    reason: deliveredReason,
                                    anchor_event_id: anchorEventId
                                }
                            };
                        try {
                            subscriber.send(message)
                        } catch {
                            unsubscribe(subscriberId)
                        }
                    }
                }
        };

    function subscribe(subscriber) {
        let {
            id,
            sessionKey
        } = subscriber;
        map.has(id) && unsubscribe(id), map.set(id, subscriber);
        let sessionSubscriberIds = map2.get(sessionKey);
        sessionSubscriberIds || (sessionSubscriberIds = new Set, map2.set(sessionKey, sessionSubscriberIds)), sessionSubscriberIds.add(id), attachmentCallbacks.onAttach && attachmentCallbacks.onAttach(sessionKey, id)
    }

    function unsubscribe(subscriberId) {
        let subscriber = map.get(subscriberId);
        if (!subscriber) return;
        let {
            sessionKey
        } = subscriber, sessionSubscriberIds = map2.get(sessionKey);
        sessionSubscriberIds && (sessionSubscriberIds.delete(subscriberId), sessionSubscriberIds.size === 0 && map2.delete(sessionKey)), map.delete(subscriberId), attachmentCallbacks.onDetach && attachmentCallbacks.onDetach(sessionKey, subscriberId)
    }
    return {
        subscribe,
        unsubscribe,
        getSubscribers(sessionKey) {
            let subscriberIds = map2.get(sessionKey);
            return subscriberIds ? Array.from(subscriberIds).map(subscriberId => map.get(subscriberId)).filter(subscriber => subscriber !== void 0) : []
        },
        publishOutput,
        finalSubscriberCount(sessionKey) {
            let subscriberIds = map2.get(sessionKey);
            if (!subscriberIds) return 0;
            let count = 0;
            for (let subscriberId of subscriberIds) {
                let subscriber = map.get(subscriberId);
                subscriber && acceptsKind(subscriber, "final") && (count += 1)
            }
            return count
        },
        subscriberCount() {
            return map.size
        },
        start(eventBus) {
            bus || (bus = eventBus, bus.on("session.stream", onStream), bus.on("session.stream_end", onStreamEnd), bus.on("session.execution", onExecution))
        },
        stop() {
            if (bus) {
                if (bus.off("session.stream", onStream), bus.off("session.stream_end", onStreamEnd), bus.off("session.execution", onExecution), bus = null, attachmentCallbacks.onDetach)
                    for (let subscriber of map.values()) attachmentCallbacks.onDetach(subscriber.sessionKey, subscriber.id);
                for (let subscriber of map.values()) try {
                    subscriber.close()
                } catch {}
                map.clear(), map2.clear()
            }
        },
        setAttachmentCallbacks(callbacks) {
            attachmentCallbacks = callbacks
        }
    }
}
