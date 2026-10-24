// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: ALADUO_TOOL_NAMESPACE  (minified: sO, daemon.pretty.js:65121)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var ALADUO_TOOL_NAMESPACE, wft, u6, l6, Eft, oO, ewe, initCodexAppServerModule = N(() => {
    "use strict";
    nc();
    initLogLevelModule();
    initInterruptMarkerTextModule();
    initSkipToolModule();
    ALADUO_TOOL_NAMESPACE = "aladuo", wft = "features.code_mode.direct_only_tool_namespaces";
    Eft = {
        codexBinary: "codex",
        env: {},
        sandbox: "read-only",
        serviceName: "duoduo_runtime",
        model: null,
        effort: null,
        ephemeral: !0,
        dynamicTools: []
    }, oO = class extends vft {
        constructor(binary, cwd, env) {
            super();
            this.binary = binary;
            this.cwd = cwd;
            this.env = env
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
            this.alive || (this.proc = yft(this.binary, ["app-server"], {
                cwd: this.cwd,
                stdio: ["pipe", "pipe", "pipe"],
                env: {
                    ...process.env,
                    ...this.env
                },
                detached: !0
            }), this.alive = !0, this.proc.on("error", err => {
                this.alive = !1;
                let startError = err.code === "ENOENT" ? new Error(`Codex CLI ('${this.binary}') not found. Install it from https://github.com/openai/codex and run 'codex login'.`) : err;
                this.rejectAllPending(startError)
            }), this.proc.on("exit", (code, signal) => {
                this.alive = !1;
                let error = new Error(`codex app-server exited (code=${code} signal=${signal})`);
                this.rejectAllPending(error)
            }), this.rl = attachStreamLineReader(this.proc.stdout, line => this.handleLine(line)), attachStreamLineReader(this.proc.stderr, line => {
                logDebugMessage("[codex-stderr]", line)
            }))
        }
        request(method, params, signal) {
            if (!this.alive || !this.proc?.stdin?.writable) return Promise.reject(new Error("codex app-server is not running"));
            if (signal?.aborted) {
                let error = new Error(`request ${method} aborted`);
                return error.name = "AbortError", Promise.reject(error)
            }
            let id = this.nextId++;
            return new Promise((resolve, reject) => {
                if (this.pending.set(id, {
                        method,
                        resolve,
                        reject
                    }), this.send({
                        id,
                        method,
                        params
                    }), signal) {
                    let onAbort = () => {
                        let pendingRequest = this.pending.get(id);
                        if (pendingRequest) {
                            this.pending.delete(id);
                            let error = new Error(`request ${method} aborted`);
                            error.name = "AbortError", pendingRequest.reject(error)
                        }
                    };
                    signal.addEventListener("abort", onAbort, {
                        once: !0
                    })
                }
            })
        }
        notify(method, params = {}) {
            this.send({
                method,
                params
            })
        }
        async shutdown() {
            this.alive = !1, this.rl?.close(), this.rl = null;
            let proc = this.proc;
            if (this.proc = null, this.rejectAllPending(new Error("codex app-server shut down")), !proc || proc.exitCode !== null || proc.signalCode !== null) return;
            let promise = new Promise(resolve => {
                proc.once("exit", () => resolve())
            });
            if (proc.stdin?.end(), proc.pid) try {
                process.kill(-proc.pid, "SIGTERM")
            } catch {
                proc.kill("SIGTERM")
            } else proc.kill("SIGTERM");
            await promise
        }
        get isAlive() {
            return this.alive
        }
        send(message) {
            this.proc?.stdin?.writable && this.proc.stdin.write(JSON.stringify(message) + `
`)
        }
        handleLine(line) {
            let trimmed = line.trim();
            if (!trimmed) return;
            let message;
            try {
                message = JSON.parse(trimmed)
            } catch {
                logWarnMessage("[codex-transport] unparseable line:", trimmed.slice(0, 200));
                return
            }
            if (message.id != null && (message.result !== void 0 || message.error !== void 0)) {
                let pendingRequest = this.pending.get(message.id);
                pendingRequest && (this.pending.delete(message.id), message.error ? pendingRequest.reject(Object.assign(new Error(message.error.message || `codex rpc error: ${pendingRequest.method}`), {
                    code: message.error.code,
                    data: message.error.data
                })) : pendingRequest.resolve(message.result ?? {}));
                return
            }
            if (message.method && message.id != null) {
                this.handleServerRequest(message);
                return
            }
            message.method && this.emit("notification", message)
        }
        setToolHandlers(handlers) {
            this.toolHandlers = handlers
        }
        toolHandlers = new Map;
        onToolCallObserved;
        setToolCallObserved(callback) {
            this.onToolCallObserved = callback
        }
        onToolCallSettled;
        setToolCallSettled(callback) {
            this.onToolCallSettled = callback
        }
        handleServerRequest(request) {
            if (logDebugMessage("[codex-transport] server request:", request.method), request.method === "item/tool/call") {
                let params = request.params,
                    toolName = params?.tool,
                    toolArgs = params?.arguments ?? {},
                    observedTurnId = toolName ? this.onToolCallObserved?.(toolName) : void 0,
                    handler = toolName ? this.toolHandlers.get(toolName) : void 0;
                if (handler) {
                    handler(toolArgs).then(result => {
                        toolName && this.onToolCallSettled?.(toolName, result.success, observedTurnId), this.respond(request.id, {
                            success: result.success,
                            contentItems: [{
                                type: "inputText",
                                text: result.text
                            }]
                        })
                    }).catch(err => {
                        toolName && this.onToolCallSettled?.(toolName, !1, observedTurnId), this.respond(request.id, {
                            success: !1,
                            contentItems: [{
                                type: "inputText",
                                text: `Error: ${err instanceof Error?err.message:String(err)}`
                            }]
                        })
                    });
                    return
                }
            }
            if (request.method === "mcpServer/elicitation/request") {
                this.respond(request.id, {
                    action: "accept"
                });
                return
            }
            if (request.method?.includes("Approval") || request.method?.includes("approval")) {
                this.respond(request.id, {
                    decision: "approve"
                });
                return
            }
            this.respondError(request.id, -32601, `duoduo adapter does not handle ${request.method}`)
        }
        respond(id, result) {
            this.proc?.stdin?.writable && this.proc.stdin.write(JSON.stringify({
                id,
                result
            }) + `
`)
        }
        respondError(id, code, message) {
            this.proc?.stdin?.writable && this.proc.stdin.write(JSON.stringify({
                id,
                error: {
                    code,
                    message
                }
            }) + `
`)
        }
        rejectAllPending(error) {
            for (let [id, pendingRequest] of this.pending) pendingRequest.reject(error), this.pending.delete(id)
        }
    };
    ewe = new Set
});
