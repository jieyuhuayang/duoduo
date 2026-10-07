// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: initAbortableAsyncQueueModule  (minified: JRe, daemon.pretty.js:83053)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var TN, initAbortableAsyncQueueModule = O(() => {
    "use strict";
    TN = class {
        items = [];
        waiters = [];
        enqueue(t) {
            let n = this.waiters.shift();
            if (n) {
                n.cleanup?.(), n.resolve(t);
                return
            }
            this.items.push(t)
        }
        dequeue(t) {
            if (t?.aborted) return Promise.reject(WRe());
            let n = this.items.shift();
            return n !== void 0 ? Promise.resolve(n) : new Promise((r, i) => {
                let o = {
                    resolve: r,
                    reject: i
                };
                if (this.waiters.push(o), !t) return;
                let s = () => {
                    let a = this.waiters.indexOf(o);
                    a >= 0 && this.waiters.splice(a, 1), i(WRe())
                };
                t.addEventListener("abort", s, {
                    once: !0
                }), o.cleanup = () => {
                    t.removeEventListener("abort", s)
                }
            })
        }
        drain() {
            let t = [...this.items];
            return this.items.length = 0, t
        }
    }
});
