// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: initAbortableAsyncQueueModule  (minified: qTe, daemon.pretty.js:85181)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 0 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var HN, initAbortableAsyncQueueModule = N(() => {
    "use strict";
    HN = class {
        items = [];
        waiters = [];
        enqueue(item) {
            let waiter = this.waiters.shift();
            if (waiter) {
                waiter.cleanup?.(), waiter.resolve(item);
                return
            }
            this.items.push(item)
        }
        dequeue(signal) {
            if (signal?.aborted) return Promise.reject(UTe());
            let item = this.items.shift();
            return item !== void 0 ? Promise.resolve(item) : new Promise((resolve, reject) => {
                let waiter = {
                    resolve,
                    reject
                };
                if (this.waiters.push(waiter), !signal) return;
                let onAbort = () => {
                    let index = this.waiters.indexOf(waiter);
                    index >= 0 && this.waiters.splice(index, 1), reject(UTe())
                };
                signal.addEventListener("abort", onAbort, {
                    once: !0
                }), waiter.cleanup = () => {
                    signal.removeEventListener("abort", onAbort)
                }
            })
        }
        drain() {
            let items = [...this.items];
            return this.items.length = 0, items
        }
    }
});
