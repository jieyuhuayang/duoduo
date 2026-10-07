// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseSdkConfigFrontmatter  (minified: HU, daemon.pretty.js:35454)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.10, v0.8.0, v0.8.1 (maps/history_daemon.json)
// changelog v0.5.10 (medium): anything else ... is off unless explicitly added via a new nested `claude.tools` key in a channel's kind or instance descriptor.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseSdkConfigFrontmatter(e) {
    return {
        allowedTools: FU(e, of.allowedTools),
        disallowedTools: FU(e, of.disallowedTools),
        additionalDirectories: FU(e, of.additionalDirectories, {
            expandPaths: !0
        }),
        ...parseClaudeFrontmatterBlock(e),
        ...BQe(e),
        ...BU(e),
        ...VU(e)
    }
}
