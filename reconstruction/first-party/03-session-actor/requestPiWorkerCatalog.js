// duoduo reconstruction — subsystem: 03-session-actor
// symbol: requestPiWorkerCatalog  (minified: uEe, daemon.pretty.js:72986)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 0 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function requestPiWorkerCatalog(options) {
    return new Promise(resolve => {
        let settled = !1,
            finish = providers => {
                settled || (settled = !0, resolve(providers))
            },
            child = aEe(options.workerCommand.command, options.workerCommand.args, {
                cwd: options.cwd,
                stdio: ["pipe", "pipe", "pipe"]
            });
        child.on("error", () => finish([])), child.on("close", () => finish([])), child.stdin.once("error", () => finish([])), child.stderr.on("data", chunk => options.logDebug?.(String(chunk).trimEnd())), attachStreamLineReader(child.stdout, line => {
            let frame = FW(line);
            frame?.type === "catalog_result" && finish(frame.providers)
        }), child.stdin.write(encodePiWorkerFrame({
            type: "catalog",
            cwd: options.cwd,
            agent_dir: options.agentDir,
            auth_path: options.authPath,
            models_path: options.modelsPath,
            models_store_path: options.modelsStorePath,
            settings_seed: options.settingsSeed,
            resources: options.resources
        }))
    })
}
