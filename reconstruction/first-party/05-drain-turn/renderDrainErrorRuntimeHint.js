// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderDrainErrorRuntimeHint  (minified: Eft, daemon.pretty.js:72210)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderDrainErrorRuntimeHint(e, t = {}) {
    let n = e.toLowerCase(),
        r = t.runtime === "codex";
    if (n.includes("process exited with code") || n.includes("process terminated by signal") || n.includes("failed to spawn") || n.includes("pi worker exited") || n.includes("spawn") && n.includes("enoent")) return r ? `The local Codex runtime process exited abnormally. duoduo shells out to the \`codex\` CLI it finds on PATH — reinstalling duoduo will not help. The common causes are a missing/upgraded/broken \`codex\` install or an expired login. Check both, then restart the daemon:
  codex --version
  codex login status
  duoduo daemon restart -r "recovering from a codex runtime crash"

If it persists, please file an issue at github.com/openduo/duoduo.` : t.runtime === "grok" ? `The local Grok runtime process exited abnormally. duoduo shells out to the \`grok\` CLI it finds on PATH — reinstalling duoduo or Claude will not help. The common causes are a missing/upgraded/broken \`grok\` install or a lapsed login. Check both, then restart the daemon:
  grok --version
  grok login
  duoduo daemon restart -r "recovering from a grok runtime crash"

If it persists, please file an issue at github.com/openduo/duoduo.` : t.runtime === "pi" ? `The local pi worker process exited abnormally. The pi runtime is embedded in duoduo — there is no separate CLI to probe — so a broken/partial duoduo install is the usual cause (a provider error would have been reported in the provider's own words instead of a worker exit). Reinstall/upgrade duoduo (npm -g shown here; use your manager/prefix if that is how you installed it), then restart the daemon:
  npm install -g @openduo/duoduo@latest
  duoduo daemon restart -r "reinstalled duoduo after a pi worker crash"

If it persists, please file an issue at github.com/openduo/duoduo.` : `The local Claude runtime process exited abnormally. The two common causes are a broken/partial install — the Claude Code native binary (shipped via the SDK's npm optional dependency) failed to download or is corrupt — or a flaky model endpoint that reset the connection mid-request. If you have not changed endpoints, a reinstall/upgrade is the usual fix; adjust the command for how you installed duoduo (npm -g shown here; use your manager/prefix if that is how you installed it), then restart the daemon:
  npm install -g @openduo/duoduo@latest
  duoduo daemon restart -r "reinstalled duoduo after a claude runtime crash"

If it persists after reinstalling, or recurs on an official Anthropic endpoint, please file an issue at github.com/openduo/duoduo.`;
    let o = t.modelOverride ? `This session runs under a /model override (\`${t.modelOverride}\`). If that is the id being rejected, \`/model reset\` puts the session back on the runtime default, starting with your next message.

` : "";
    return r ? o + "The error above came from the Codex backend in its own words — it is not a duoduo message. Codex runs under the account you authorized with `codex login`, and a model id has to be one that account can actually serve. The DISABLE_THINKING/DISABLE_ADAPTIVE knobs in ~/.config/duoduo/.env are Claude-only and have no effect here. If the message does not explain itself, please file an issue at github.com/openduo/duoduo." : t.runtime === "grok" ? o + "The error above came from the Grok backend in its own words — it is not a duoduo message. Grok runs under the account you authorized with `grok login`, and a model id has to be one that account can actually serve. The DISABLE_THINKING/DISABLE_ADAPTIVE knobs in ~/.config/duoduo/.env are Claude-only and have no effect here. If the message does not explain itself, please file an issue at github.com/openduo/duoduo." : t.runtime === "pi" ? o + "The error above came from the model provider in pi's own words — it is not a duoduo message. pi talks to the providers configured in your pi agent dir — `models.json`, `auth.json`, or an extension that registers them — and a model id has to be one those credentials can actually serve. The DISABLE_THINKING/DISABLE_ADAPTIVE knobs in ~/.config/duoduo/.env are Claude-only and have no effect here. If the message does not explain itself, please file an issue at github.com/openduo/duoduo." : o + "If this error is from your model endpoint (HTTP 4xx, validation errors, etc.), the endpoint likely doesn't accept the exact wire format Claude Code uses for this version. For third-party compatible endpoints, the most common cause is the `thinking` feature; setting DISABLE_ADAPTIVE=1 DISABLE_THINKING=1 DISABLE_INTERLEAVED_THINKING=1 MAX_THINKING_TOKENS=0 in ~/.config/duoduo/.env and restarting the daemon is the usual fix. If this error recurs on an official Anthropic endpoint, please file an issue at github.com/openduo/duoduo."
}
