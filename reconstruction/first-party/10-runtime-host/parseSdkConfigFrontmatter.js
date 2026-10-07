// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: parseSdkConfigFrontmatter  (minified: HU, daemon.pretty.js:35454)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
