// duoduo reconstruction — subsystem: 03-session-actor
// symbol: requestPiWorkerCatalog  (minified: oEe, daemon.pretty.js:72985)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function requestPiWorkerCatalog(e) {
    return new Promise(t => {
        let n = !1,
            r = o => {
                n || (n = !0, t(o))
            },
            i = iEe(e.workerCommand.command, e.workerCommand.args, {
                cwd: e.cwd,
                stdio: ["pipe", "pipe", "pipe"]
            });
        i.on("error", () => r([])), i.on("close", () => r([])), i.stdin.once("error", () => r([])), i.stderr.on("data", o => e.logDebug?.(String(o).trimEnd())), attachStreamLineReader(i.stdout, o => {
            let s = LW(o);
            s?.type === "catalog_result" && r(s.providers)
        }), i.stdin.write(encodePiWorkerFrame({
            type: "catalog",
            cwd: e.cwd,
            agent_dir: e.agentDir,
            auth_path: e.authPath,
            models_path: e.modelsPath,
            models_store_path: e.modelsStorePath,
            settings_seed: e.settingsSeed,
            resources: e.resources
        }))
    })
}
