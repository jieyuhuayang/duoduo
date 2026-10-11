// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: parseInjectionPromptCommand  (minified: xI, daemon.pretty.js:87455)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.7 (medium): The recurring `/loop` capability is now one entry in a general mechanism for named prompt injections, with a self-describing `duoduo prompts` CLI to list what's available.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseInjectionPromptCommand(text) {
    if (!text) return;
    let trimmed = text.trim(),
        commandToken = pde(trimmed);
    if (!commandToken || !commandToken.startsWith("/")) return;
    let name = commandToken.slice(1),
        injectionPrompt = lookupInjectionPrompt(name);
    if (injectionPrompt) return {
        name,
        prompt: injectionPrompt.prompt,
        usage: injectionPrompt.usage,
        args: trimmed.slice(commandToken.length).trim()
    }
}
