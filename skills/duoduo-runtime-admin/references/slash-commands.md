# Slash Commands (`/compact`)

Reference for the chat-level history control that landed in v0.5.2.
Load this when the user asks about compacting a long conversation, or
about the command appearing not to work.

> **`/undo` was removed on 2026-08-20.** It shipped alongside `/compact`
> in v0.5.2 and rolled back the last N turns. It had no users, and on the
> Claude runtime it could not roll back in place — it queued the rollback
> until the user's next message, so the command never did anything at the
> moment it was typed. If a host still accepts `/undo`, it is running a
> build from before the removal; check `duoduo daemon status`.

## Commands

`/compact` is user-typed text in a channel session (Feishu DM, stdio
CLI, ACP editor — anywhere a session accepts messages). It flows
through the same spine → mailbox → drain pipeline as normal messages,
so the user gets a regular text reply when the command finishes.

### `/compact`

Compacts the conversation history in place. Keeps the same session
id; every runtime shrinks the context window by summarizing earlier
turns into a single compact boundary.

- **Claude runtime**: emits a `compact_boundary` system message; the
  session continues with the same `sdk_session_id`.
- **Grok runtime**: calls `_x.ai/compact_conversation`; the session
  continues with the same ACP session id. Idle auto-compact on grok
  is silent (no channel ack), same as Claude.
- **Codex runtime**: calls `thread/compact/start` natively; the
  session continues with the same `threadId`.
- **Pi runtime**: compacts in place through pi's own compaction; the
  session id does not change. Pi also keeps its native threshold
  compaction on (inherited from the user's pi settings) — the two
  layers coexist; see the smart-compaction skill.

User-visible reply: a short confirmation that compaction happened.
The next turn the user sends will run against the compacted history.

## What to tell the user when something looks off

**"I typed `/compact` but nothing happened."** — Check the running
version with `duoduo daemon status`. Before v0.5.2 the Claude SDK
silently ate `/compact` (compaction ran, but the gateway never
surfaced the boundary as a reply); on Codex it was treated as plain
text and ignored — v0.5.2 fixed both of those. There was a further
gap on **Claude channel streaming sessions**: `/compact` compacted the
on-disk history while the live streaming subprocess kept the full
in-memory prefix, so the token count never actually dropped and a long
session could still hit `too_many_total_tokens`. That is fixed in
**v0.5.5** (the compact is now routed in-band on the live streaming
subprocess). If a heavy Claude session still climbs in tokens after
`/compact`, confirm it is on v0.5.5+.

**"The reply landed in the wrong session."** — `/compact` routes
through the same channel mailbox as normal messages, so if a Feishu
DM is bound to session A, `/compact` applies to A. If the user
expected B, the channel is on the wrong binding — that is a
channel-binding question, not a slash-command question.

**Feishu groups + `/compact`**: in a multi-principal group, `/compact`
applies to the session bound to that chat_id. There is no per-user
compact; the whole group sees the same compacted history when the
next message arrives.

## Cross-runtime cheat sheet

| Behavior | Claude | Grok | Codex | Pi |
| --- | --- | --- | --- | --- |
| `/compact` execution | inline, SDK-side | `_x.ai/compact_conversation` | inline, `thread/compact/start` | in place, pi-native compaction |
| `/compact` session id change | none (`sdk_session_id` unchanged) | none (ACP id unchanged) | none (`threadId` unchanged) | none |

## Design rationale

See `docs/design/conversation-history-controls.md` in the source
repo for the full architectural decisions. The short version:
spine + mailbox is aladuo's only control plane, so slash commands
must flow through it like any other channel input — no second queue.

## `/clear` and `/reset` (session reset)

`/reset` is an alias for `/clear`. Both drop the session's agent memory:
the next message starts a fresh agent session with a new `sdk_session_id`.
These are gateway commands (interrupt-now, different runtime path from
`/compact` above).

As of **v0.5.5**, the fresh session's first turn carries a one-time notice
telling it that it was reset — start fresh, do not resume the prior
session's pending work — and the **previous** `sdk_session_id` is retained
in that notice. If the user recalls something from before the reset, the
new session can use that id to look up the prior session's history
(locating a session by its id is the runtime's own knowledge; the notice
deliberately does not spell out a path). The notice is runtime-neutral and
fires once. If the user's first post-reset message is itself a slash
command, the notice holds back to the next normal message (slash-prefixed
input skips runtime-context injection by design).

- **Pi runtime**: `/clear` also kills the session's worker process — pi
  holds the conversation in memory, so clearing the id alone would let
  the next message continue pre-clear history.

## `/model` (model switching)

Switch the model for the current session without restarting anything.

```
/model                    # show current model + available models
/model <model-id>         # switch to a specific model
/model reset              # revert to the daemon's default model
```

- **Claude runtime**: the list of known models is populated after the
  first message in a session. `/model` with no args before the first
  message shows the current override but no list; send any message
  first and then run `/model` again. A switch takes effect from the
  next turn (the current streaming subprocess is not interrupted).
- **Codex runtime**: no model list is available (`/model` with no args
  shows the stored override only). A switch takes effect from the next
  message via an internal thread fork — the model is applied without
  visible disruption.
- **Pi runtime**: store-only. The id must be the `provider/modelId`
  form (with the slash) — a bare id is rejected up front rather than
  guessing the provider. The stored value applies from the next
  message, when the session's worker process is rebuilt with it.
  `/model reset` clears the override, but a pi session still needs
  SOME model source afterwards (job frontmatter, kind/instance
  config); with none, the next message fails with an actionable
  error instead of running on a default.
- **Unknown model id**: accepted and stored. If the id is invalid, the
  next turn will report the error. Run `/model reset` to recover.
- **Validation**: a model id may not contain spaces. Any other string
  is accepted (on pi it must also carry the `provider/` prefix); the
  runtime is the authority on whether it is valid.

Read [model-switching.md](model-switching.md) for the full reference.

## `/effort` (reasoning-effort switch)

Set how hard the model reasons for the current session — a second,
independent axis from `/model`. Trade reasoning depth against cost and
latency: crank to `xhigh` for a hard analysis, drop to `low` for
chit-chat.

```
/effort                   # show the current effort + the level list
/effort <level>           # set the effort level for this session
/effort reset             # revert to the runtime default
```

- **Levels**: `low`, `medium`, `high`, `xhigh` — exactly these four.
  Unlike a model id, the level is validated up front: any other value
  (a typo, or `max` / `none` / `minimal`) is rejected with the valid
  list and nothing is changed.
- **Claude runtime**: a switch takes effect **live** — the running
  session picks up the new level immediately, with no restart and no
  next-turn wait. `/effort` with no args shows the stored level (or
  `(runtime default)`).
- **Codex runtime**: a switch takes effect from the **next message**.
  The no-arg view notes this.
- **Pi runtime**: a switch takes effect from the **next message** —
  the stored level rides the session's worker rebuild, and the four
  levels map 1:1 onto pi's native thinking levels.
- **`/effort reset`**: clears the override and returns to the runtime
  default — applied live on Claude, from the next message on Codex
  and Pi.
- **Survives a `/model` runtime flip**: the four levels are valid on
  every runtime, so switching a session's runtime with `/model` keeps
  the effort setting in effect — it is never stranded or reset by the
  runtime change.

## When this skill does NOT apply

- `/cancel` — interrupt-now semantics, bypasses the drain loop. Different
  runtime path; this skill does not cover it.
- Custom slash commands that an operator wires into their own
  channel — out of scope.
