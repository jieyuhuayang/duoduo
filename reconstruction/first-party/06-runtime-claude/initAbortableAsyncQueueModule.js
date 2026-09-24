// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: initAbortableAsyncQueueModule  (minified: r0e, daemon.pretty.js:82753)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var MA, initAbortableAsyncQueueModule = O(() => {
    "use strict";
    MA = class {
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
            if (t?.aborted) return Promise.reject(n0e());
            let n = this.items.shift();
            return n !== void 0 ? Promise.resolve(n) : new Promise((r, i) => {
                let o = {
                    resolve: r,
                    reject: i
                };
                if (this.waiters.push(o), !t) return;
                let s = () => {
                    let a = this.waiters.indexOf(o);
                    a >= 0 && this.waiters.splice(a, 1), i(n0e())
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
