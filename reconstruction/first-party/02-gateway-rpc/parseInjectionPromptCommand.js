// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: parseInjectionPromptCommand  (minified: xI, daemon.pretty.js:87455)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseInjectionPromptCommand(e) {
    if (!e) return;
    let t = e.trim(),
        n = pde(t);
    if (!n || !n.startsWith("/")) return;
    let r = n.slice(1),
        i = lookupInjectionPrompt(r);
    if (i) return {
        name: r,
        prompt: i.prompt,
        usage: i.usage,
        args: t.slice(n.length).trim()
    }
}
