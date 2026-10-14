// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: initGrokAcpRuntimeModule  (minified: Og, daemon.pretty.js:63996)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0, v0.8.2 (maps/history_daemon.json)
// locals: 13 renamed — 1 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.1 (high): one long-lived agent process per session, duoduo's own tools reachable from it
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var A6, N6, Lut, GROK_DISALLOWED_TOOLS, GROK_AGENT_PROFILE, GROK_ACP_EXT_PREFIX, GROK_ACP_SDK_CALL, GROK_ACP_COMPACT, GROK_MCP_SDK_META, GROK_MCP_SERVERS_META, GROK_MCP_SERVER_NAME, O6, initGrokAcpRuntimeModule = O(() => {
    "use strict";
    Ql();
    initLogLevelModule();
    initAgentSdkAdapterModule();
    initInterruptMarkerTextModule();
    initSkipToolModule();
    Lut = 5e3;
    GROK_DISALLOWED_TOOLS = ["scheduler_create", "scheduler_list", "scheduler_delete", "monitor", "workflow", "update_goal"], GROK_AGENT_PROFILE = {
        name: "duoduo",
        description: "duoduo session",
        disallowedTools: [...GROK_DISALLOWED_TOOLS]
    }, GROK_ACP_EXT_PREFIX = "_x.ai";
    GROK_ACP_SDK_CALL = grokAcpExtMethod("mcp/sdk_call"), GROK_ACP_COMPACT = grokAcpExtMethod("compact_conversation"), GROK_MCP_SDK_META = "x.ai/mcp/sdk", GROK_MCP_SERVERS_META = "x.ai/mcp/servers", GROK_MCP_SERVER_NAME = "aladuo";
    O6 = class {
        onmessage;
        onclose;
        onerror;
        replies = new Map;
        async start() {}
        async close() {
            let error = new Error("aladuo MCP transport closed");
            for (let pending of this.replies.values()) pending.reject(error);
            this.replies.clear(), this.onclose?.()
        }
        async send(message) {
            if (!("id" in message) || message.id === void 0 || message.id === null) return;
            let pending = this.replies.get(String(message.id));
            pending && (this.replies.delete(String(message.id)), pending.resolve(message))
        }
        dispatch(message, timeoutMs = 3e4) {
            if (!("id" in message) || message.id === void 0 || message.id === null) return this.onmessage?.(message), Promise.resolve({
                jsonrpc: "2.0",
                id: 0,
                result: {}
            });
            let requestId = String(message.id);
            return new Promise((resolve, reject) => {
                let timer = setTimeout(() => {
                    this.replies.delete(requestId);
                    let method = "method" in message ? String(message.method) : "request";
                    reject(new Error(`MCP ${method} timed out after ${timeoutMs}ms`))
                }, timeoutMs);
                this.replies.set(requestId, {
                    resolve: response => {
                        clearTimeout(timer), resolve(response)
                    },
                    reject: err => {
                        clearTimeout(timer), reject(err)
                    }
                }), this.onmessage?.(message)
            })
        }
    }
});
