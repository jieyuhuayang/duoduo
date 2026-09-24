// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: initJobManagerModule  (minified: Ju, daemon.pretty.js:61321)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Dye, wst, o$, vV, wV, Ur, initJobManagerModule = O(() => {
    "use strict";
    Dye = hi(ms(), 1);
    jl();
    xr();
    Wn();
    gz();
    dt();
    Ii();
    pw();
    _V();
    mw();
    Dr();
    wst = ["claude", "claudeTools", "claudeModelProfiles", "claudeModelProfileIssues", "claudeModelAliases", "claudeModelAliasIssues", "prompt_mode", ...Mm("allowedTools"), ...Mm("disallowedTools"), ...Mm("additionalDirectories")];
    o$ = new Map;
    vV = "gone", wV = "stale", Ur = class {
        constructor(t) {
            this.paths = t
        }
        paths;
        get activeDir() {
            return Of.join(this.paths.varDir, "jobs", "active")
        }
        get archiveDir() {
            return Of.join(this.paths.varDir, "jobs", "archive")
        }
        getJobPath(t) {
            return Of.join(this.activeDir, `${ig(t)}.md`)
        }
        getStatePath(t) {
            return Of.join(this.activeDir, `${ig(t)}.state.json`)
        }
        getArchiveJobPath(t) {
            return Of.join(this.archiveDir, `${ig(t)}.md`)
        }
        getArchiveStatePath(t) {
            return Of.join(this.archiveDir, `${ig(t)}.state.json`)
        }
        async init() {
            await $e(this.activeDir), await $e(this.archiveDir)
        }
        async createJob(t, n, r) {
            if (await this.init(), ig(t), !n.cron || !n.cron.trim()) throw new Error(`Job ${t} has invalid cron schedule`);
            let i = n.cron.trim();
            try {
                validateJobScheduleExpression(i)
            } catch (c) {
                let d = c instanceof Error ? c.message : String(c);
                throw new Error(`Job ${t} has an unparsable cron schedule "${n.cron}": ${d}`)
            }
            let o = await Oye(this.paths, t, n.cwd_rel),
                s = {
                    type: "job",
                    created_at: new Date().toISOString(),
                    ...n,
                    cron: i,
                    cwd_rel: o.cwdRel ?? void 0
                },
                a = this.buildSessionKey(t, s),
                u = renderJobFileMarkdown(s, r),
                l;
            return await wc(t, async () => {
                if (await this.exists(t)) throw new Error(`Job ${t} already exists`);
                if (await this.pathExists(this.getStatePath(t))) {
                    let c = await jd(this.getStatePath(t), this.archiveDir, ".orphan");
                    l = c, Le(`[JobManager] stale pre-existing sidecar quarantined at create for job ${t}: ${c}`)
                }
                await Dt(this.getJobPath(t), u, Jue(s.claudeModelProfiles) ? {
                    mode: Bl
                } : {}), await Bt(this.getStatePath(t), s$())
            }), await ensureSessionDescriptorAndStateFiles(this.paths, {
                session_key: a,
                display_name: t,
                kind: "job",
                owner_session: s.owner_session
            }), te(`[JobManager] Created job ${t}`, {
                cron: n.cron
            }), {
                staleSidecarQuarantined: l
            }
        }
        async rescheduleJob(t, n, r = new Date) {
            let i = fw(n, r);
            return wc(t, async () => {
                if (!await this.exists(t)) throw await this.pathExists(this.getArchiveJobPath(t)) ? new Error(`Job ${t} is archived — no longer active. Reschedule only applies to active jobs.`) : new Error(`Job ${t} not found`);
                let o = this.getStatePath(t),
                    s = await this.readStateStrict(o);
                return await Bt(o, {
                    ...s,
                    run_at: i
                }), te(`[JobManager] Rescheduled job ${t}`, {
                    run_at: i
                }), i
            })
        }
        async archiveJob(t) {
            return wc(t, () => this.archiveJobHoldingLock(t))
        }
        async archiveJobHoldingLock(t) {
            if (!await this.exists(t)) throw await this.pathExists(this.getArchiveJobPath(t)) ? new Error(`Job ${t} is archived — no longer active. It is already off the schedule.`) : new Error(`Job ${t} not found`);
            let n = this.getJobPath(t),
                r = this.getStatePath(t),
                i = this.getArchiveJobPath(t),
                o = this.getArchiveStatePath(t);
            await qo.rename(n, i);
            try {
                await qo.rename(r, o)
            } catch (s) {
                if (s.code !== "ENOENT") {
                    try {
                        let u = await this.pathExists(o) ? ".orphan" : "",
                            l = await jd(r, this.archiveDir, u);
                        return Le(`[JobManager] sidecar archive rename failed for job ${t}; sidecar moved to ${l} on immediate retry`, s), te(`[JobManager] Archived job ${t}`), {}
                    } catch (u) {
                        Le(`[JobManager] sidecar archive retry also failed for job ${t} — .md archived anyway (degraded cancel), orphan sidecar left at ${r}`, u)
                    }
                    return {
                        sidecarOrphanPath: r
                    }
                }
            }
            return te(`[JobManager] Archived job ${t}`), {}
        }
        async renameSidecarOrRollback(t, n, r, i, o) {
            try {
                await qo.rename(n, r)
            } catch (s) {
                if (s.code === "ENOENT") return;
                try {
                    await qo.rename(i, o)
                } catch (u) {
                    Le(`[JobManager] sidecar-rename rollback failed for job ${t}`, u)
                }
                throw s
            }
        }
        async archiveJobIfNotRearmed(t) {
            return wc(t, async () => {
                if (!await this.exists(t)) throw new Error(`Job ${t} not found`);
                let n = await this.readStateStrict(this.getStatePath(t));
                return typeof n.run_at == "string" && n.run_at.length > 0 ? {
                    archived: !1,
                    runAt: n.run_at
                } : (await qo.rename(this.getJobPath(t), this.getArchiveJobPath(t)), await this.renameSidecarOrRollback(t, this.getStatePath(t), this.getArchiveStatePath(t), this.getArchiveJobPath(t), this.getJobPath(t)), te(`[JobManager] Archived job ${t} (finalize auto-archive, not re-armed)`), {
                    archived: !0,
                    runAt: null
                })
            })
        }
        async createWakeRecord(t) {
            await this.init();
            let n = t.now ?? new Date,
                r = fw(t.when, n),
                i = t.ownerSession.trim();
            if (!i) throw new Error("A wake record needs an owner session — the caller is always the target.");
            let o = `wake-${n.getTime().toString(36)}`,
                s = {
                    type: "wake",
                    owner_session: i,
                    created_at: n.toISOString()
                },
                a = ["---", 'type: "wake"', `owner_session: "${i.replace(/"/g,'\\"')}"`, `created_at: "${s.created_at}"`, "---", "", t.context].join(`
`);
            for (let u = 0;; u++) {
                let l = u === 0 ? o : `${o}-${u}`;
                if (ig(l), await wc(l, async () => await this.exists(l) ? !1 : (await Dt(this.getJobPath(l), a), await Bt(this.getStatePath(l), {
                        ...s$(),
                        run_at: r
                    }), !0))) return te(`[JobManager] Created wake record ${l}`, {
                    owner: i,
                    run_at: r
                }), {
                    id: l,
                    runAt: r
                }
            }
        }
        async getWakeRecord(t) {
            let n = this.getJobPath(t),
                r;
            try {
                r = await qo.readFile(n, "utf8")
            } catch (l) {
                if (l.code === "ENOENT") return null;
                throw l
            }
            let {
                data: i,
                content: o
            } = parseJobFileFrontmatter(r, n);
            if (i.type !== "wake") return null;
            let a = typeof i.owner_session == "string" ? i.owner_session.trim() : "",
                u = typeof i.created_at == "string" ? i.created_at : "";
            if (!a || !u) throw new Error(`Wake record ${t} is missing ${a?"created_at":"owner_session"} — it cannot be delivered.`);
            return {
                id: t,
                path: n,
                frontmatter: {
                    type: "wake",
                    owner_session: a,
                    created_at: u
                },
                context: o.trim(),
                state: await this.readStateStrict(this.getStatePath(t))
            }
        }
        async listWakeRecords() {
            await this.init();
            let t;
            try {
                t = (await qo.readdir(this.activeDir)).filter(r => r.endsWith(".md"))
            } catch (r) {
                return Le("[JobManager] Failed to list wake records", r), []
            }
            let n = [];
            for (let r of t) {
                let i = r.slice(0, -3);
                try {
                    let o = await this.getWakeRecord(i);
                    o && n.push(o)
                } catch (o) {
                    Le(`[JobManager] Skipping unreadable record ${i} while listing wakes`, {
                        jobId: i,
                        error: Wi(o)
                    })
                }
            }
            return n
        }
        async fireWakeRecord(t, n, r) {
            return wc(t, async () => {
                let i = await this.getWakeRecord(t);
                if (!i) return {
                    outcome: "cancelled"
                };
                let o = i.state.run_at,
                    s = typeof o == "string" ? Date.parse(o) : Number.NaN;
                if (!Number.isFinite(s) || n.getTime() < s) return {
                    outcome: "not_due"
                };
                let a = await r(i);
                return await this.archiveJobHoldingLock(t), a.success ? {
                    outcome: "delivered"
                } : {
                    outcome: "undeliverable",
                    error: a.error
                }
            })
        }
        async getJob(t) {
            return this.readJobByPath(t, this.getJobPath(t), this.getStatePath(t))
        }
        async getArchivedJob(t) {
            return this.readJobByPath(t, this.getArchiveJobPath(t), this.getArchiveStatePath(t))
        }
        async classifyActiveJob(t) {
            let n;
            try {
                n = await qo.readFile(this.getJobPath(t), "utf8")
            } catch (i) {
                if (i.code === "ENOENT") return {
                    kind: "missing"
                };
                throw i
            }
            let r;
            try {
                r = await this.buildJobDefinition(t, this.getJobPath(t), this.getStatePath(t), n)
            } catch (i) {
                return {
                    kind: "invalid",
                    reason: `frontmatter does not parse: ${Wi(i)}`
                }
            }
            return r ? {
                kind: "active",
                job: r
            } : {
                kind: "invalid",
                reason: 'frontmatter is missing type: "job"'
            }
        }
        async readJobByPath(t, n, r) {
            try {
                let i = await qo.readFile(n, "utf8");
                return await this.buildJobDefinition(t, n, r, i)
            } catch (i) {
                if (i.code === "ENOENT") return null;
                throw new Error(Wi(i))
            }
        }
        async buildJobDefinition(t, n, r, i) {
            let {
                data: o,
                content: s
            } = parseJobFileFrontmatter(i, n);
            if (o.type === "wake") return null;
            if (!o.type || o.type !== "job") return Le(`[JobManager] Invalid job file ${t}: missing type=job`), null;
            let u;
            try {
                let d = await qo.readFile(r, "utf8");
                u = JSON.parse(d)
            } catch {
                u = {
                    last_run_at: null,
                    last_result: "unknown",
                    run_count: 0
                }
            }
            let l = $ye(this.paths, t, o.cwd_rel),
                c = {
                    ...o
                };
            return delete c.notify, {
                id: t,
                path: n,
                frontmatter: c,
                content: s,
                state: u,
                session_key: this.buildSessionKey(t, c),
                execution_context: l.context,
                execution_cwd: l.cwd,
                runtime_workspace_dir: l.runtimeWorkspaceDir
            }
        }
        async listJobs() {
            await this.init();
            let t;
            try {
                t = (await qo.readdir(this.activeDir)).filter(o => o.endsWith(".md"))
            } catch (i) {
                return Le("[JobManager] Failed to list jobs", i), []
            }
            let n = [],
                r = [];
            for (let i of t) {
                let o = i.slice(0, -3);
                try {
                    let s = await this.getJob(o);
                    s && n.push(s)
                } catch (s) {
                    r.push(o), Le(`[JobManager] Skipping unreadable job file ${o} — the other jobs still load`, {
                        jobId: o,
                        error: Wi(s)
                    })
                }
            }
            return r.length > 0 && Le(`[JobManager] ${r.length} job file(s) failed to parse and are NOT scheduled: ${r.join(", ")}`), n
        }
        async updateState(t, n, r) {
            await wc(t, async () => {
                if (!await this.exists(t)) throw await this.quarantineOrphanSidecarIfPresent(t), new Error(`Job ${t} is not active (archived or removed) — state writes are active-only`);
                let i = this.getStatePath(t),
                    o = await this.readStateStrict(i);
                if (r && "expectedClaimCursor" in r) {
                    let s = o.last_scheduled_at ?? null,
                        a = r.expectedClaimCursor ?? null;
                    if (s !== a) return
                }
                await Bt(i, {
                    ...o,
                    ...n
                })
            })
        }
        async finalizeJobState(t, n, r) {
            return wc(t, async () => {
                if (!await this.exists(t)) return await this.quarantineOrphanSidecarIfPresent(t), vV;
                let i = this.getStatePath(t),
                    o = await this.readStateStrict(i);
                if (r && "expectedClaimCursor" in r) {
                    let a = o.last_scheduled_at ?? null,
                        u = r.expectedClaimCursor ?? null;
                    if (a !== u) return wV
                }
                let s = {
                    ...o,
                    ...n
                };
                if (s.run_count = n.last_result === "success" ? (o.run_count ?? 0) + 1 : o.run_count ?? 0, r?.consumeRunAt !== !1 && typeof s.run_at == "string" && s.run_at.length > 0) {
                    let a = new Date(s.run_at).getTime(),
                        u = s.last_scheduled_at ? new Date(s.last_scheduled_at).getTime() : Number.NaN;
                    Number.isFinite(a) && Number.isFinite(u) && a <= u && (s.run_at = null)
                }
                return await Bt(i, s), {
                    run_at: s.run_at ?? null
                }
            })
        }
        async quarantineOrphanSidecarIfPresent(t) {
            let n = this.getStatePath(t);
            if (await this.pathExists(n)) try {
                let r = await jd(n, this.archiveDir, ".orphan");
                Le(`[JobManager] orphan sidecar quarantined for job ${t} (no active .md): ${r}`)
            } catch (r) {
                Le(`[JobManager] failed to quarantine orphan sidecar for job ${t}`, r)
            }
        }
        async readStateStrict(t) {
            let n;
            try {
                n = await qo.readFile(t, "utf8")
            } catch (r) {
                if (r.code === "ENOENT") return s$();
                throw r
            }
            try {
                return JSON.parse(n)
            } catch (r) {
                try {
                    let i = await jd(t, Of.dirname(t), `.corrupt-${Date.now()}`);
                    Le(`[JobManager] corrupt state sidecar quarantined: ${t} → ${i}`, r)
                } catch (i) {
                    Le(`[JobManager] failed to quarantine corrupt sidecar: ${t}`, i)
                }
                return s$()
            }
        }
        async pathExists(t) {
            try {
                return await qo.access(t), !0
            } catch (n) {
                if (n.code === "ENOENT") return !1;
                throw n
            }
        }
        async exists(t) {
            return this.pathExists(this.getJobPath(t))
        }
        buildSessionKey(t, n) {
            return vc({
                jobId: t,
                cron: n.cron,
                cwdRel: n.cwd_rel
            })
        }
    }
});
