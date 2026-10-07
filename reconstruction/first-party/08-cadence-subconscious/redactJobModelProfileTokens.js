// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: redactJobModelProfileTokens  (minified: Wf, daemon.pretty.js:62079)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function redactJobModelProfileTokens(e) {
    let t = e.frontmatter.claudeModelProfiles,
        n = cce(t);
    return n === t ? e : {
        ...e,
        frontmatter: {
            ...e.frontmatter,
            claudeModelProfiles: n
        }
    }
}
