// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildSystemConfigReport  (minified: Jbt, daemon.pretty.js:90568)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function buildSystemConfigReport(e) {
    let t = await loadSubconsciousPartitions(e),
        n = {
            network: {
                port: resolveEnvConfigEntry("ALADUO_PORT", 20233),
                daemon_host: resolveEnvConfigEntry("ALADUO_DAEMON_HOST", "127.0.0.1")
            },
            sessions: {
                max_concurrent_channel: resolveEnvConfigEntry("ALADUO_SESSION_MAX_CONCURRENT_CHANNEL", Number(process.env.ALADUO_SESSION_MAX_CONCURRENT ?? 10)),
                max_concurrent_job: resolveEnvConfigEntry("ALADUO_SESSION_MAX_CONCURRENT_JOB", 6),
                idle_ms: resolveEnvConfigEntry("ALADUO_SESSION_IDLE_MS", 36e5),
                heartbeat_ms: resolveEnvConfigEntry("ALADUO_SESSION_HEARTBEAT_MS", 3e4)
            },
            cadence: {
                interval_ms: resolveEnvConfigEntry("ALADUO_CADENCE_INTERVAL_MS", 222e4),
                runtime_lock_heartbeat_ms: resolveEnvConfigEntry("ALADUO_RUNTIME_LOCK_HEARTBEAT_MS", 3e4)
            },
            transfer: {
                pull_limit: resolveEnvConfigEntry("ALADUO_PULL_LIMIT", 50),
                pull_wait_ms: resolveEnvConfigEntry("ALADUO_PULL_WAIT_MS", aU),
                subscribe_replay_limit: resolveEnvConfigEntry("ALADUO_SUBSCRIBE_REPLAY_LIMIT", 0),
                notify_unconsumed_hours: resolveEnvConfigEntry(z6, eO)
            },
            logging: {
                log_level: resolveEnvConfigEntry("ALADUO_LOG_LEVEL", "info"),
                sdk_debug: resolveEnvConfigEntry("ALADUO_SDK_DEBUG", !1),
                log_session_lifecycle: resolveEnvConfigEntry("ALADUO_LOG_SESSION_LIFECYCLE", !1),
                log_runner_tool_events: resolveEnvConfigEntry("ALADUO_LOG_RUNNER_TOOL_EVENTS", !1),
                log_runner_thought_chunks: resolveEnvConfigEntry("ALADUO_LOG_RUNNER_THOUGHT_CHUNKS", !1),
                log_latency_stages: resolveEnvConfigEntry("ALADUO_LOG_LATENCY_STAGES", !1),
                telemetry_enabled: resolveEnvConfigEntry("ALADUO_TELEMETRY_ENABLED", !0)
            },
            sdk: buildSdkConfigReport(),
            paths: {
                work_dir: resolveEnvConfigEntry("ALADUO_WORK_DIR", e.workDir),
                kernel_dir: resolveEnvConfigEntry("ALADUO_KERNEL_DIR", e.kernelDir),
                bootstrap_dir: resolveEnvConfigEntry("ALADUO_BOOTSTRAP_DIR", e.bootstrapDir),
                meta_prompt_path: resolveEnvConfigEntry("ALADUO_META_PROMPT_PATH", null)
            }
        };
    return t.length > 0 && (n.subconscious = {
        partitions: t.map(r => ({
            name: r.name,
            enabled: r.schedule.enabled,
            cooldown_ticks: r.schedule.cooldown_ticks,
            max_duration_ms: r.schedule.max_duration_ms
        }))
    }), n
}
