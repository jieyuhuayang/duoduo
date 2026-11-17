// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: createDashboardShareManager  (minified: jxe, daemon.pretty.js:91271)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.9 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 3 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createDashboardShareManager(e) {
    let deps = e.deps ?? Kht,
        n = null;

    function r(i) {
        i.timer && clearTimeout(i.timer), n === i && (n = null), i.child.kill("SIGTERM")
    }
    return {
        async share(i = DASHBOARD_SHARE_DEFAULT_TTL_MINUTES) {
            if (!Number.isInteger(i) || i <= 0) throw new DashboardShareError("ttl_minutes must be a positive integer");
            let o = i * 6e4;
            if (o > Mxe) throw new DashboardShareError(`ttl_minutes must be at most ${Math.floor(Mxe/6e4)}`);
            let trimmed = (await deps.readTailcatVersion()).trim();
            if (trimmed !== TAILCAT_PINNED_VERSION) throw new DashboardShareError(`tailcat ${trimmed||"(unknown version)"} does not match the pinned ${TAILCAT_PINNED_VERSION} the remote page is built from; install tailcat ${TAILCAT_PINNED_VERSION}`);
            let a = e.tcpPort();
            n && r(n);
            let u = deps.spawnTailcat(Jht(a)),
                l = {
                    child: u
                };
            n = l, u.once("exit", () => {
                l.timer && clearTimeout(l.timer), n === l && (n = null)
            });
            let c;
            try {
                c = await Zht(u)
            } catch (err) {
                throw r(l), err
            }
            if (n !== l) throw new DashboardShareError("the share was stopped or replaced while it was starting");
            let d = new Date(deps.now() + o).toISOString();
            return l.expiresAt = d, l.timer = setTimeout(() => r(l), o), l.timer.unref?.(), {
                address: c,
                links: Ght(c),
                expires_at: d
            }
        },
        status() {
            return n?.expiresAt ? {
                active: !0,
                expires_at: n.expiresAt
            } : {
                active: !1
            }
        },
        stop() {
            return n ? (r(n), {
                stopped: !0
            }) : {
                stopped: !1
            }
        }
    }
}
