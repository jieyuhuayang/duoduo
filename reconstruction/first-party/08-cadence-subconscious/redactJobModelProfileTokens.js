// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: redactJobModelProfileTokens  (minified: tp, daemon.pretty.js:63350)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function redactJobModelProfileTokens(job) {
    let claudeModelProfiles = job.frontmatter.claudeModelProfiles,
        redactedProfiles = Pde(claudeModelProfiles);
    return redactedProfiles === claudeModelProfiles ? job : {
        ...job,
        frontmatter: {
            ...job.frontmatter,
            claudeModelProfiles: redactedProfiles
        }
    }
}
