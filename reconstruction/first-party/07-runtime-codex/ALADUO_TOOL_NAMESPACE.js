// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: ALADUO_TOOL_NAMESPACE  (minified: zI, daemon.pretty.js:59649)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var ALADUO_TOOL_NAMESPACE, AXe, R2, T2, jXe, FI, Gpe, jd = $(() => {
    "use strict";
    Zt();
    Sd();
    ALADUO_TOOL_NAMESPACE = "aladuo", AXe = "features.code_mode.direct_only_tool_namespaces";
    jXe = {
        codexBinary: "codex",
        env: {},
        sandbox: "read-only",
        serviceName: "duoduo_runtime",
        model: null,
        effort: null,
        ephemeral: !0,
        dynamicTools: []
    }, FI = class extends $Xe {
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
        stderrRl = null;
        nextId = 1;
        pending = new Map;
        alive = !1;
        start() {
            this.alive || (this.proc = PXe(this.binary, ["app-server"], {
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
            }), this.rl = Zpe({
                input: this.proc.stdout
            }), this.rl.on("line", n => this.handleLine(n)), this.stderrRl = Zpe({
                input: this.proc.stderr
            }), this.stderrRl.on("line", n => {
                Ae("[codex-stderr]", n)
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
                if (this.pending.set(o, {
                        method: n,
                        resolve: s,
                        reject: a
                    }), this.send({
                        id: o,
                        method: n,
                        params: r
                    }), i) {
                    let l = () => {
                        let u = this.pending.get(o);
                        if (u) {
                            this.pending.delete(o);
                            let c = new Error(`request ${n} aborted`);
                            c.name = "AbortError", u.reject(c)
                        }
                    };
                    i.addEventListener("abort", l, {
                        once: !0
                    })
                }
            })
        }
        notify(n, r = {}) {
            this.send({
                method: n,
                params: r
            })
        }
        async shutdown() {
            this.alive = !1, this.rl?.close(), this.rl = null, this.stderrRl?.close(), this.stderrRl = null;
            let n = this.proc;
            if (this.proc = null, this.rejectAllPending(new Error("codex app-server shut down")), !n || n.exitCode !== null || n.signalCode !== null) return;
            let r = new Promise(i => {
                n.once("exit", () => i())
            });
            if (n.stdin?.end(), n.pid) try {
                process.kill(-n.pid, "SIGTERM")
            } catch {
                n.kill("SIGTERM")
            } else n.kill("SIGTERM");
            await r
        }
        get isAlive() {
            return this.alive
        }
        send(n) {
            this.proc?.stdin?.writable && this.proc.stdin.write(JSON.stringify(n) + `
`)
        }
        handleLine(n) {
            let r = n.trim();
            if (!r) return;
            let i;
            try {
                i = JSON.parse(r)
            } catch {
                Ae("[codex-transport] unparseable line:", r.slice(0, 200));
                return
            }
            if (i.id != null && (i.result !== void 0 || i.error !== void 0)) {
                let o = this.pending.get(i.id);
                o && (this.pending.delete(i.id), i.error ? o.reject(Object.assign(new Error(i.error.message || `codex rpc error: ${o.method}`), {
                    code: i.error.code,
                    data: i.error.data
                })) : o.resolve(i.result ?? {}));
                return
            }
            if (i.method && i.id != null) {
                this.handleServerRequest(i);
                return
            }
            i.method && this.emit("notification", i)
        }
        setToolHandlers(n) {
            this.toolHandlers = n
        }
        toolHandlers = new Map;
        onToolCallObserved;
        setToolCallObserved(n) {
            this.onToolCallObserved = n
        }
        onToolCallSettled;
        setToolCallSettled(n) {
            this.onToolCallSettled = n
        }
        handleServerRequest(n) {
            if (Ae("[codex-transport] server request:", n.method), n.method === "item/tool/call") {
                let r = n.params,
                    i = r?.tool,
                    o = r?.arguments ?? {},
                    s = i ? this.onToolCallObserved?.(i) : void 0,
                    a = i ? this.toolHandlers.get(i) : void 0;
                if (a) {
                    a(o).then(l => {
                        i && this.onToolCallSettled?.(i, l.success, s), this.respond(n.id, {
                            success: l.success,
                            contentItems: [{
                                type: "inputText",
                                text: l.text
                            }]
                        })
                    }).catch(l => {
                        i && this.onToolCallSettled?.(i, !1, s), this.respond(n.id, {
                            success: !1,
                            contentItems: [{
                                type: "inputText",
                                text: `Error: ${l instanceof Error?l.message:String(l)}`
                            }]
                        })
                    });
                    return
                }
            }
            if (n.method === "mcpServer/elicitation/request") {
                this.respond(n.id, {
                    action: "accept"
                });
                return
            }
            if (n.method?.includes("Approval") || n.method?.includes("approval")) {
                this.respond(n.id, {
                    decision: "approve"
                });
                return
            }
            this.respondError(n.id, -32601, `duoduo adapter does not handle ${n.method}`)
        }
        respond(n, r) {
            this.proc?.stdin?.writable && this.proc.stdin.write(JSON.stringify({
                id: n,
                result: r
            }) + `
`)
        }
        respondError(n, r, i) {
            this.proc?.stdin?.writable && this.proc.stdin.write(JSON.stringify({
                id: n,
                error: {
                    code: r,
                    message: i
                }
            }) + `
`)
        }
        rejectAllPending(n) {
            for (let [r, i] of this.pending) i.reject(n), this.pending.delete(r)
        }
    };
    Gpe = new Set
});
