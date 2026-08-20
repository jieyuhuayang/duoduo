// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: GROK_DISALLOWED_TOOLS  (minified: cme, daemon.pretty.js:60700)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var O2, $2, GROK_DISALLOWED_TOOLS, GROK_AGENT_PROFILE, GROK_ACP_EXT_PREFIX, GROK_ACP_SDK_CALL, GROK_ACP_COMPACT, GROK_ACP_REWIND_POINTS, GROK_ACP_REWIND_EXECUTE, GROK_MCP_SDK_META, GROK_MCP_SERVERS_META, GROK_MCP_SERVER_NAME, C2, nh = $(() => {
    "use strict";
    Zt();
    ba();
    Sd();
    GROK_DISALLOWED_TOOLS = ["scheduler_create", "scheduler_list", "scheduler_delete", "monitor", "workflow", "update_goal"], GROK_AGENT_PROFILE = {
        name: "duoduo",
        description: "duoduo session",
        disallowedTools: [...GROK_DISALLOWED_TOOLS]
    }, GROK_ACP_EXT_PREFIX = "_x.ai";
    GROK_ACP_SDK_CALL = grokAcpExtMethod("mcp/sdk_call"), GROK_ACP_COMPACT = grokAcpExtMethod("compact_conversation"), GROK_ACP_REWIND_POINTS = grokAcpExtMethod("rewind/points"), GROK_ACP_REWIND_EXECUTE = grokAcpExtMethod("rewind/execute"), GROK_MCP_SDK_META = "x.ai/mcp/sdk", GROK_MCP_SERVERS_META = "x.ai/mcp/servers", GROK_MCP_SERVER_NAME = "aladuo";
    C2 = class {
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
});
