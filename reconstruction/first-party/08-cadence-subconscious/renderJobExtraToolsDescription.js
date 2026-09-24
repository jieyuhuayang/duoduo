// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderJobExtraToolsDescription  (minified: dat, daemon.pretty.js:63757)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderJobExtraToolsDescription() {
    return `EXTRA built-in tools to ADD for this job. This is NOT the job's tool list — the job already has the standard core (file, shell, Agent and task tools), and this only appends to it. ADDITIVE ONLY: it can add a tool, never remove one, so it cannot take Edit or Write away from a job; passing a short list does not narrow anything. In practice the useful additions are web/retrieval tools. Claude runtime only${isCodexAvailable()?" (codex built-ins are not restrictable)":""}. Unioned with kernel/config/job.md, and stored in the job file under the nested key \`claude: { tools }\`.`
}
