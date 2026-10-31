// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: writeHostDotEnvLines  (minified: mA, daemon.pretty.js:70298)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.3 — first release whose bundle holds this declaration; body changed in v0.7.0, v0.8.2 (maps/history_daemon.json)
// locals: 8 renamed — 0 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (medium): refactor: simplify host onboarding auth flow
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeHostDotEnvLines(lines, env) {
    let envPath = hostDotEnvPath(env),
        envDir = oxe.dirname(envPath);
    if (!lines.some(line => line.trim() !== "")) {
        await Fs.rm(envPath, {
            force: !0
        });
        return
    }
    await Fs.mkdir(envDir, {
        recursive: !0
    });
    let trimmedLines = [...lines];
    for (; trimmedLines.length > 0 && trimmedLines[trimmedLines.length - 1] === "";) trimmedLines.pop();
    let fileContent = trimmedLines.join(`
`) + `
`,
        tmpPath = `${envPath}.tmp`;
    await Fs.writeFile(tmpPath, fileContent, {
        encoding: "utf8",
        mode: 384
    }), await Fs.rename(tmpPath, envPath), await Fs.chmod(envPath, 384)
}
