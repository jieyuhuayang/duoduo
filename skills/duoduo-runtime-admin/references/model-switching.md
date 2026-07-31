# Model Switching (`/model`)

Use this reference when the user wants to switch the model for a running
session, list available models, or recover from an invalid model id.

## Commands

```
/model                    # show current model + available models
/model <model-id>         # switch to a specific model
/model reset              # revert to the daemon's default model
```

All three forms flow through the normal channel message pipeline —
they are typed as a chat message, not a CLI call.

## Claude Runtime

`/model` with no args shows:

- The currently stored model override (or `(runtime default)` if none).
  When nothing is stored and the Claude CLI would pick a **profiled** model
  for itself — a `.claude/settings.json` in the session's workspace or in
  `~` naming one — the line names it too:
  `Session model: (runtime default → deepseek-v4-flash via project settings)`.
  That model gets its profile (window, endpoint, credential) just as if the
  user had typed it. An unprofiled default stays a plain `(runtime default)`.
- A list of known model ids populated from the live session.
- **Profiled models** — the ids this session's scope defines a context
  profile for, merged instance > kind > global, each with its window,
  the layer that won it, and the endpoint host when the profile routes
  it somewhere other than the host's own endpoint. Alias tiers and any
  rejected config entries follow in their own sections. Nothing is shown
  when the scope profiles nothing, and a profile's credential never
  appears — not even masked.

The two lists answer different questions: the known-model list is the
endpoint's menu, while the profiled list is the local catalog of windows
and routes. An id can be in either, both, or neither — a third-party
model is usually profiled and *not* on the endpoint menu.

The known-model list only appears after the session has processed at
least one message. If the session has not started yet, `/model` notes
this and tells the user to send a message first. The list is a
convenience menu — valid model ids not on it are also accepted.

A switch (`/model <id>`) is stored immediately and takes effect from
the **next turn**. The currently running streaming subprocess is not
interrupted.

If the target model has a **context profile** with a different physical
window than the live subprocess, the acknowledgement says the runtime
will rebuild before the next turn — see
[model-context-profiles.md](model-context-profiles.md) for what that
means and what it costs.

The acknowledgement also states the window the switch landed on:

```
Context window 1,000,000 tokens (global profile, routed endpoint).
```

`routed endpoint` appears only when the profile sends this model to its
own endpoint. A `[1m]` id that has no profile of its own inherits the
base id's, and the ack names it (`…, from deepseek-v4-pro, …`). An
acknowledgement ending in "No context profile is known" means no layer
defines a window, so the model runs on the host/CLI default; that
reference covers adding a profile.

## Codex Runtime

`/model` with no args shows the stored override (or `(runtime default)`)
plus the scope's `codex.model_profiles` entries — window and layer only,
since codex profiles carry no endpoint. No known-model list is returned;
the Codex runtime does not expose one. A switch to a profiled codex model
echoes its window the same way the Claude ack does, never with `routed
endpoint`.

A switch takes effect from the **next message** via an internal thread
fork — the conversation state is preserved and the new model is applied
transparently. From the user's perspective this is invisible.

## `/model reset`

Clears any stored override and restores the daemon's effective default
(set by `ALADUO_DEFAULT_RUNTIME` and the channel kind descriptor, or the
compiled-in baseline if neither is set). Takes effect on the next turn.

Reset does not mean "unprotected": if a settings file names a profiled
model, the session goes back to running that model *with* its profile.
The stored override is what reset clears — not the protection.

> **Older duoduo (before the settings-default fix):** a session that had
> never run `/model` ran whatever the CLI's own settings chose, with none
> of that model's routing — the tell is every turn failing with "There's
> an issue with the selected model". The workaround was to type the id
> explicitly (`/model <id>`), which is still valid on those builds.

## Unknown / Unlisted Model Id

Any id without spaces is accepted and stored. The runtime decides whether
it is valid when the next turn runs. If the id is invalid:

- The turn will return an explanatory error message naming the invalid id.
- Billing stays on the previously effective model for that turn.
- Run `/model reset` (or `/model <correct-id>`) to recover.

## Finding Valid Model Ids

Use `/model` after starting a Claude session to see the ids the session
has observed. For a programmatic list, call the `system.config` RPC
method — the response includes the effective runtime and model settings
visible to the daemon.

## Cross-Runtime Cheat Sheet

| Behavior | Claude | Codex |
| --- | --- | --- |
| Model list with `/model` | yes (after first turn) | no |
| Profiled models in `/model` | yes (`claude.model_profiles`) | yes (`codex.model_profiles`) |
| Window echoed in the switch ack | yes, + routing | yes, window only |
| Switch takes effect | next turn | next message (thread fork) |
| `/model reset` timing | next turn | next message |
| Invalid id detection | next turn reply | next turn reply |
| Session disruption on switch | none | none |

## Related: `/effort` (a separate, independent axis)

`/model` chooses *which* model runs; `/effort` chooses *how hard* it
reasons (`low | medium | high | xhigh`). They are independent per-session
runtime knobs — set either without touching the other. Two differences
worth calling out against `/model`:

- **Timing**: an effort change applies **live** on Claude (immediately,
  no next-turn wait) and from the **next message** on Codex — whereas a
  `/model` change is always next-turn / next-message on both runtimes.
- **Runtime flips**: the four effort levels are valid on both runtimes,
  so switching a session's runtime with `/model` never strands or resets
  the effort setting.

See the `/effort` section of [slash-commands.md](slash-commands.md) for
the full syntax, the level vocabulary, and reset semantics.
