// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: initJobManagerModule  (minified: ol, daemon.pretty.js:61640)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.1, v0.4.0, v0.5.6, v0.6.1, v0.6.2, v0.7.0, v0.8.0, v0.8.1, v0.8.2 (maps/history_daemon.json)
// locals: 137 renamed — 30 from the code at the binding (rule), 107 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var nbe, hut, UC, S6, k6, Br, initJobManagerModule = O(() => {
    "use strict";
    nbe = yi(bs(), 1);
    hs();
    Tr();
    Kn();
    yU();
    initLogLevelModule();
    Kr();
    Fw();
    v6();
    zw();
    $r();
    hut = ["claude", "claudeTools", "claudeModelProfiles", "claudeModelProfileIssues", "claudeModelAliases", "claudeModelAliasIssues", "prompt_mode", ...listFrontmatterKeyAliases("allowedTools"), ...listFrontmatterKeyAliases("disallowedTools"), ...listFrontmatterKeyAliases("additionalDirectories")];
    UC = new Map;
    S6 = "gone", k6 = "stale", Br = class {
        constructor(paths) {
            this.paths = paths
        }
        paths;
        get activeDir() {
            return Hf.join(this.paths.varDir, "jobs", "active")
        }
        get archiveDir() {
            return Hf.join(this.paths.varDir, "jobs", "archive")
        }
        getJobPath(jobId) {
            return Hf.join(this.activeDir, `${Ig(jobId)}.md`)
        }
        getStatePath(jobId) {
            return Hf.join(this.activeDir, `${Ig(jobId)}.state.json`)
        }
        getArchiveJobPath(jobId) {
            return Hf.join(this.archiveDir, `${Ig(jobId)}.md`)
        }
        getArchiveStatePath(jobId) {
            return Hf.join(this.archiveDir, `${Ig(jobId)}.state.json`)
        }
        async init() {
            await ensureDirectoryExists(this.activeDir), await ensureDirectoryExists(this.archiveDir)
        }
        async createJob(jobId, frontmatterInput, body) {
            if (await this.init(), Ig(jobId), !frontmatterInput.cron || !frontmatterInput.cron.trim()) throw new Error(`Job ${jobId} has invalid cron schedule`);
            let trimmed = frontmatterInput.cron.trim();
            try {
                validateJobScheduleExpression(trimmed)
            } catch (err) {
                let message = err instanceof Error ? err.message : String(err);
                throw new Error(`Job ${jobId} has an unparsable cron schedule "${frontmatterInput.cron}": ${message}`)
            }
            let cwdResolution = await Q_e(this.paths, jobId, frontmatterInput.cwd_rel),
                frontmatter = {
                    type: "job",
                    created_at: new Date().toISOString(),
                    ...frontmatterInput,
                    cron: trimmed,
                    cwd_rel: cwdResolution.cwdRel ?? void 0
                },
                sessionKey = this.buildSessionKey(jobId, frontmatter),
                jobFileMarkdown = renderJobFileMarkdown(frontmatter, body),
                staleSidecarQuarantined;
            return await Oc(jobId, async () => {
                if (await this.exists(jobId)) throw new Error(`Job ${jobId} already exists`);
                if (await this.pathExists(this.getStatePath(jobId))) {
                    let quarantinedPath = await moveFileIntoDirectory(this.getStatePath(jobId), this.archiveDir, ".orphan");
                    staleSidecarQuarantined = quarantinedPath, logErrorMessage(`[JobManager] stale pre-existing sidecar quarantined at create for job ${jobId}: ${quarantinedPath}`)
                }
                await writeFileAtomic(this.getJobPath(jobId), jobFileMarkdown, lce(frontmatter.claudeModelProfiles) ? {
                    mode: rc
                } : {}), await writeJsonFileAtomic(this.getStatePath(jobId), qC())
            }), await ensureSessionDescriptorAndStateFiles(this.paths, {
                session_key: sessionKey,
                display_name: jobId,
                kind: "job",
                owner_session: frontmatter.owner_session
            }), logInfoMessage(`[JobManager] Created job ${jobId}`, {
                cron: frontmatterInput.cron
            }), {
                staleSidecarQuarantined
            }
        }
        async rescheduleJob(jobId, when, now = new Date) {
            let jobRearmTime = parseJobRearmTime(when, now);
            return Oc(jobId, async () => {
                if (!await this.exists(jobId)) throw await this.pathExists(this.getArchiveJobPath(jobId)) ? new Error(`Job ${jobId} is archived — no longer active. Reschedule only applies to active jobs.`) : new Error(`Job ${jobId} not found`);
                let statePath = this.getStatePath(jobId),
                    state = await this.readStateStrict(statePath);
                return await writeJsonFileAtomic(statePath, {
                    ...state,
                    run_at: jobRearmTime
                }), logInfoMessage(`[JobManager] Rescheduled job ${jobId}`, {
                    run_at: jobRearmTime
                }), jobRearmTime
            })
        }
        async archiveJob(jobId) {
            return Oc(jobId, () => this.archiveJobHoldingLock(jobId))
        }
        async archiveJobHoldingLock(jobId) {
            if (!await this.exists(jobId)) throw await this.pathExists(this.getArchiveJobPath(jobId)) ? new Error(`Job ${jobId} is archived — no longer active. It is already off the schedule.`) : new Error(`Job ${jobId} not found`);
            let jobPath = this.getJobPath(jobId),
                statePath = this.getStatePath(jobId),
                archiveJobPath = this.getArchiveJobPath(jobId),
                archiveStatePath = this.getArchiveStatePath(jobId);
            await Wo.rename(jobPath, archiveJobPath);
            try {
                await Wo.rename(statePath, archiveStatePath)
            } catch (err) {
                if (err.code !== "ENOENT") {
                    try {
                        let suffix = await this.pathExists(archiveStatePath) ? ".orphan" : "",
                            movedPath = await moveFileIntoDirectory(statePath, this.archiveDir, suffix);
                        return logErrorMessage(`[JobManager] sidecar archive rename failed for job ${jobId}; sidecar moved to ${movedPath} on immediate retry`, err), logInfoMessage(`[JobManager] Archived job ${jobId}`), {}
                    } catch (err) {
                        logErrorMessage(`[JobManager] sidecar archive retry also failed for job ${jobId} — .md archived anyway (degraded cancel), orphan sidecar left at ${statePath}`, err)
                    }
                    return {
                        sidecarOrphanPath: statePath
                    }
                }
            }
            return logInfoMessage(`[JobManager] Archived job ${jobId}`), {}
        }
        async renameSidecarOrRollback(jobId, fromPath, toPath, rollbackFromPath, rollbackToPath) {
            try {
                await Wo.rename(fromPath, toPath)
            } catch (err) {
                if (err.code === "ENOENT") return;
                try {
                    await Wo.rename(rollbackFromPath, rollbackToPath)
                } catch (err) {
                    logErrorMessage(`[JobManager] sidecar-rename rollback failed for job ${jobId}`, err)
                }
                throw err
            }
        }
        async archiveJobIfNotRearmed(jobId) {
            return Oc(jobId, async () => {
                if (!await this.exists(jobId)) throw new Error(`Job ${jobId} not found`);
                let state = await this.readStateStrict(this.getStatePath(jobId));
                return typeof state.run_at == "string" && state.run_at.length > 0 ? {
                    archived: !1,
                    runAt: state.run_at
                } : (await Wo.rename(this.getJobPath(jobId), this.getArchiveJobPath(jobId)), await this.renameSidecarOrRollback(jobId, this.getStatePath(jobId), this.getArchiveStatePath(jobId), this.getArchiveJobPath(jobId), this.getJobPath(jobId)), logInfoMessage(`[JobManager] Archived job ${jobId} (finalize auto-archive, not re-armed)`), {
                    archived: !0,
                    runAt: null
                })
            })
        }
        async createWakeRecord(params) {
            await this.init();
            let now = params.now ?? new Date,
                jobRearmTime = parseJobRearmTime(params.when, now),
                trimmed = params.ownerSession.trim();
            if (!trimmed) throw new Error("A wake record needs an owner session — the caller is always the target.");
            let baseId = `wake-${now.getTime().toString(36)}`,
                frontmatter = {
                    type: "wake",
                    owner_session: trimmed,
                    created_at: now.toISOString()
                },
                markdown = ["---", 'type: "wake"', `owner_session: "${trimmed.replace(/"/g,'\\"')}"`, `created_at: "${frontmatter.created_at}"`, "---", "", params.context].join(`
`);
            for (let attempt = 0;; attempt++) {
                let wakeId = attempt === 0 ? baseId : `${baseId}-${attempt}`;
                if (Ig(wakeId), await Oc(wakeId, async () => await this.exists(wakeId) ? !1 : (await writeFileAtomic(this.getJobPath(wakeId), markdown), await writeJsonFileAtomic(this.getStatePath(wakeId), {
                        ...qC(),
                        run_at: jobRearmTime
                    }), !0))) return logInfoMessage(`[JobManager] Created wake record ${wakeId}`, {
                    owner: trimmed,
                    run_at: jobRearmTime
                }), {
                    id: wakeId,
                    runAt: jobRearmTime
                }
            }
        }
        async getWakeRecord(wakeId) {
            let jobPath = this.getJobPath(wakeId),
                source;
            try {
                source = await Wo.readFile(jobPath, "utf8")
            } catch (err) {
                if (err.code === "ENOENT") return null;
                throw err
            }
            let {
                data,
                content
            } = parseJobFileFrontmatter(source, jobPath);
            if (data.type !== "wake") return null;
            let ownerSession = typeof data.owner_session == "string" ? data.owner_session.trim() : "",
                createdAt = typeof data.created_at == "string" ? data.created_at : "";
            if (!ownerSession || !createdAt) throw new Error(`Wake record ${wakeId} is missing ${ownerSession?"created_at":"owner_session"} — it cannot be delivered.`);
            return {
                id: wakeId,
                path: jobPath,
                frontmatter: {
                    type: "wake",
                    owner_session: ownerSession,
                    created_at: createdAt
                },
                context: content.trim(),
                state: await this.readStateStrict(this.getStatePath(wakeId))
            }
        }
        async listWakeRecords() {
            await this.init();
            let fileNames;
            try {
                fileNames = (await Wo.readdir(this.activeDir)).filter(fileName => fileName.endsWith(".md"))
            } catch (err) {
                return logErrorMessage("[JobManager] Failed to list wake records", err), []
            }
            let records = [];
            for (let fileName of fileNames) {
                let recordId = fileName.slice(0, -3);
                try {
                    let record = await this.getWakeRecord(recordId);
                    record && records.push(record)
                } catch (err) {
                    logErrorMessage(`[JobManager] Skipping unreadable record ${recordId} while listing wakes`, {
                        jobId: recordId,
                        error: formatYamlErrorMessage(err)
                    })
                }
            }
            return records
        }
        async fireWakeRecord(wakeId, now, deliver) {
            return Oc(wakeId, async () => {
                let record = await this.getWakeRecord(wakeId);
                if (!record) return {
                    outcome: "cancelled"
                };
                let runAt = record.state.run_at,
                    runAtMs = typeof runAt == "string" ? Date.parse(runAt) : Number.NaN;
                if (!Number.isFinite(runAtMs) || now.getTime() < runAtMs) return {
                    outcome: "not_due"
                };
                let deliveryResult = await deliver(record);
                return await this.archiveJobHoldingLock(wakeId), deliveryResult.success ? {
                    outcome: "delivered"
                } : {
                    outcome: "undeliverable",
                    error: deliveryResult.error
                }
            })
        }
        async getJob(jobId) {
            return this.readJobByPath(jobId, this.getJobPath(jobId), this.getStatePath(jobId))
        }
        async getArchivedJob(jobId) {
            return this.readJobByPath(jobId, this.getArchiveJobPath(jobId), this.getArchiveStatePath(jobId))
        }
        async classifyActiveJob(jobId) {
            let source;
            try {
                source = await Wo.readFile(this.getJobPath(jobId), "utf8")
            } catch (err) {
                if (err.code === "ENOENT") return {
                    kind: "missing"
                };
                throw err
            }
            let job;
            try {
                job = await this.buildJobDefinition(jobId, this.getJobPath(jobId), this.getStatePath(jobId), source)
            } catch (err) {
                return {
                    kind: "invalid",
                    reason: `frontmatter does not parse: ${formatYamlErrorMessage(err)}`
                }
            }
            return job ? {
                kind: "active",
                job
            } : {
                kind: "invalid",
                reason: 'frontmatter is missing type: "job"'
            }
        }
        async readJobByPath(jobId, jobPath, statePath) {
            try {
                let content = await Wo.readFile(jobPath, "utf8");
                return await this.buildJobDefinition(jobId, jobPath, statePath, content)
            } catch (err) {
                if (err.code === "ENOENT") return null;
                throw new Error(formatYamlErrorMessage(err))
            }
        }
        async buildJobDefinition(jobId, jobPath, statePath, source) {
            let {
                data,
                content
            } = parseJobFileFrontmatter(source, jobPath);
            if (data.type === "wake") return null;
            if (!data.type || data.type !== "job") return logErrorMessage(`[JobManager] Invalid job file ${jobId}: missing type=job`), null;
            let state;
            try {
                let content = await Wo.readFile(statePath, "utf8");
                state = JSON.parse(content)
            } catch {
                state = {
                    last_run_at: null,
                    last_result: "unknown",
                    run_count: 0
                }
            }
            let executionInfo = X_e(this.paths, jobId, data.cwd_rel),
                frontmatter = {
                    ...data
                };
            return delete frontmatter.notify, {
                id: jobId,
                path: jobPath,
                frontmatter,
                content,
                state,
                session_key: this.buildSessionKey(jobId, frontmatter),
                execution_context: executionInfo.context,
                execution_cwd: executionInfo.cwd,
                runtime_workspace_dir: executionInfo.runtimeWorkspaceDir
            }
        }
        async listJobs() {
            await this.init();
            let fileNames;
            try {
                fileNames = (await Wo.readdir(this.activeDir)).filter(fileName => fileName.endsWith(".md"))
            } catch (err) {
                return logErrorMessage("[JobManager] Failed to list jobs", err), []
            }
            let jobs = [],
                failedJobIds = [];
            for (let fileName of fileNames) {
                let jobId = fileName.slice(0, -3);
                try {
                    let job = await this.getJob(jobId);
                    job && jobs.push(job)
                } catch (err) {
                    failedJobIds.push(jobId), logErrorMessage(`[JobManager] Skipping unreadable job file ${jobId} — the other jobs still load`, {
                        jobId,
                        error: formatYamlErrorMessage(err)
                    })
                }
            }
            return failedJobIds.length > 0 && logErrorMessage(`[JobManager] ${failedJobIds.length} job file(s) failed to parse and are NOT scheduled: ${failedJobIds.join(", ")}`), jobs
        }
        async updateState(jobId, patch, options) {
            await Oc(jobId, async () => {
                if (!await this.exists(jobId)) throw await this.quarantineOrphanSidecarIfPresent(jobId), new Error(`Job ${jobId} is not active (archived or removed) — state writes are active-only`);
                let statePath = this.getStatePath(jobId),
                    state = await this.readStateStrict(statePath);
                if (options && "expectedClaimCursor" in options) {
                    let currentCursor = state.last_scheduled_at ?? null,
                        expectedCursor = options.expectedClaimCursor ?? null;
                    if (currentCursor !== expectedCursor) return
                }
                await writeJsonFileAtomic(statePath, {
                    ...state,
                    ...patch
                })
            })
        }
        async finalizeJobState(jobId, patch, options) {
            return Oc(jobId, async () => {
                if (!await this.exists(jobId)) return await this.quarantineOrphanSidecarIfPresent(jobId), S6;
                let statePath = this.getStatePath(jobId),
                    state = await this.readStateStrict(statePath);
                if (options && "expectedClaimCursor" in options) {
                    let currentCursor = state.last_scheduled_at ?? null,
                        expectedCursor = options.expectedClaimCursor ?? null;
                    if (currentCursor !== expectedCursor) return k6
                }
                let nextState = {
                    ...state,
                    ...patch
                };
                if (nextState.run_count = patch.last_result === "success" ? (state.run_count ?? 0) + 1 : state.run_count ?? 0, options?.consumeRunAt !== !1 && typeof nextState.run_at == "string" && nextState.run_at.length > 0) {
                    let runAtMs = new Date(nextState.run_at).getTime(),
                        lastScheduledMs = nextState.last_scheduled_at ? new Date(nextState.last_scheduled_at).getTime() : Number.NaN;
                    Number.isFinite(runAtMs) && Number.isFinite(lastScheduledMs) && runAtMs <= lastScheduledMs && (nextState.run_at = null)
                }
                return await writeJsonFileAtomic(statePath, nextState), {
                    run_at: nextState.run_at ?? null
                }
            })
        }
        async quarantineOrphanSidecarIfPresent(jobId) {
            let statePath = this.getStatePath(jobId);
            if (await this.pathExists(statePath)) try {
                let quarantinedPath = await moveFileIntoDirectory(statePath, this.archiveDir, ".orphan");
                logErrorMessage(`[JobManager] orphan sidecar quarantined for job ${jobId} (no active .md): ${quarantinedPath}`)
            } catch (err) {
                logErrorMessage(`[JobManager] failed to quarantine orphan sidecar for job ${jobId}`, err)
            }
        }
        async readStateStrict(statePath) {
            let source;
            try {
                source = await Wo.readFile(statePath, "utf8")
            } catch (err) {
                if (err.code === "ENOENT") return qC();
                throw err
            }
            try {
                return JSON.parse(source)
            } catch (err) {
                try {
                    let quarantinedPath = await moveFileIntoDirectory(statePath, Hf.dirname(statePath), `.corrupt-${Date.now()}`);
                    logErrorMessage(`[JobManager] corrupt state sidecar quarantined: ${statePath} → ${quarantinedPath}`, err)
                } catch (err) {
                    logErrorMessage(`[JobManager] failed to quarantine corrupt sidecar: ${statePath}`, err)
                }
                return qC()
            }
        }
        async pathExists(filePath) {
            try {
                return await Wo.access(filePath), !0
            } catch (err) {
                if (err.code === "ENOENT") return !1;
                throw err
            }
        }
        async exists(jobId) {
            return this.pathExists(this.getJobPath(jobId))
        }
        buildSessionKey(jobId, frontmatter) {
            return buildJobSessionKey({
                jobId,
                cron: frontmatter.cron,
                cwdRel: frontmatter.cwd_rel
            })
        }
    }
});
