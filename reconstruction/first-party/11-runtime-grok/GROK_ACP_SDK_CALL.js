// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: GROK_ACP_SDK_CALL  (minified: ywe, daemon.pretty.js:66078)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var p6, m6, Nft, GROK_DISALLOWED_TOOLS, GROK_AGENT_PROFILE, GROK_ACP_EXT_PREFIX, GROK_ACP_SDK_CALL, GROK_ACP_COMPACT, GROK_MCP_SDK_META, GROK_MCP_SERVERS_META, GROK_MCP_SERVER_NAME, f6, initGrokAcpRuntimeModule = N(() => {
    "use strict";
    nc();
    initLogLevelModule();
    initAgentSdkAdapterModule();
    initInterruptMarkerTextModule();
    initSkipToolModule();
    Nft = 5e3;
    GROK_DISALLOWED_TOOLS = ["scheduler_create", "scheduler_list", "scheduler_delete", "monitor", "workflow", "update_goal"], GROK_AGENT_PROFILE = {
        name: "duoduo",
        description: "duoduo session",
        disallowedTools: [...GROK_DISALLOWED_TOOLS]
    }, GROK_ACP_EXT_PREFIX = "_x.ai";
    GROK_ACP_SDK_CALL = grokAcpExtMethod("mcp/sdk_call"), GROK_ACP_COMPACT = grokAcpExtMethod("compact_conversation"), GROK_MCP_SDK_META = "x.ai/mcp/sdk", GROK_MCP_SERVERS_META = "x.ai/mcp/servers", GROK_MCP_SERVER_NAME = "aladuo";
    f6 = class {
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
