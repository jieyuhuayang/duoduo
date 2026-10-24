// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseSdkConfigFrontmatter  (minified: Eq, daemon.pretty.js:37536)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.10, v0.8.0, v0.8.1 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.10 (medium): anything else ... is off unless explicitly added via a new nested `claude.tools` key in a channel's kind or instance descriptor.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseSdkConfigFrontmatter(frontmatter) {
    return {
        allowedTools: bq(frontmatter, df.allowedTools),
        disallowedTools: bq(frontmatter, df.disallowedTools),
        additionalDirectories: bq(frontmatter, df.additionalDirectories, {
            expandPaths: !0
        }),
        ...parseClaudeFrontmatterBlock(frontmatter),
        ...Hrt(frontmatter),
        ...kq(frontmatter),
        ...xq(frontmatter)
    }
}
