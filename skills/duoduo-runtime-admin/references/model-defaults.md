# Model and Effort Defaults (`<runtime>.model`, `<runtime>.effort`)

Use this reference when the user wants a model or a reasoning effort to apply to
**more than one session** — every Feishu session, every session on the host, or
one channel permanently — rather than switching a single running session with
`/model` or `/effort`.

Requires duoduo 0.8.1 or newer. On older builds these keys are rejected as
unknown, and the only controls are `/model`, `/effort` and job frontmatter.

## The four keys

```
claude.model      codex.model      pi.model      grok.model
```

Each names the model a session of **that runtime** runs when nothing closer to
it names one. They are namespaced per runtime on purpose: a channel that
overrides its runtime while inheriting a default must never carry a GPT id into
Claude.

Without one of these keys, the runtime's own configuration decides — the
Claude settings file, the Codex config, Pi's settings. That is one knob serving
two purposes: raising your own interactive default also raises every duoduo
session that never pinned a model. Setting a key here separates the two.

## Setting one

Three layers, lowest to highest. Nothing new to learn — the same command and
the same layer flags as every other setting:

```bash
# host-wide, for every session of that runtime
duoduo session config --global set codex.model=<model-id>

# every session of one channel kind
duoduo session config --kind feishu set claude.model=<model-id>

# one channel only
duoduo session config <target> set pi.model=<provider>/<model-id>

# remove a layer's key; the next layer down takes over again
duoduo session config --global unset codex.model
```

A more specific layer wins, and the merge is **per key**: setting
`codex.model` on a kind leaves a host-wide `claude.model` in force for that
kind's Claude sessions.

Reading them back is the ordinary `get`, which names the layer each value came
from:

```bash
duoduo session config <target> get
```

## What outranks what

Highest first:

1. A session's own `/model`, or `duoduo session model <target> <id>`.
2. A job's or a subconscious partition's frontmatter `model`.
3. The channel's own `<runtime>.model`.
4. The channel kind's.
5. The host-wide one.
6. Nothing set anywhere: the runtime's own configuration decides, exactly as
   before these keys existed.

Two consequences the user will notice. `/model reset` now lands on whichever
config layer applies rather than on the runtime's own default, because that
layer IS the session's default. And a session that never ran `/model` is no
longer at the mercy of the host's interactive settings.

## Validation is deliberately loose

Any model id without whitespace is accepted. The list of known models is a
menu, not the universe, and refusing an unlisted id would block every
compatible endpoint the host can reach. An id no backend serves fails when the
next turn runs, with an error naming the id — the same way a bad `/model` does.

These keys decide **which** model, not how it is reached. Credentials and
endpoints still come from the runtime's own configuration, and on Claude a
model may additionally be routed by a model profile. See
[model-context-profiles.md](model-context-profiles.md).

## What `/model` shows once a default is set

`/model` with no argument gains two lines' worth of new information.

When a config layer decided the model, the session line names the layer, so
the user knows which command to run to change it:

```
Session model: (claude-opus-5, from the kind config)
```

A stored `/model` still wins and still prints plainly, because that is what is
running. The config layer is what a `reset` would fall back to.

And when the session has run at least one turn, a second line reports what
actually served it:

```
Last served model: gpt-5.6-sol
```

That answers a different question from every other line. The rest say what
*should* run; this one says what *did*. The two can legitimately differ — most
often on Codex, where a resumed conversation keeps the model it started with
until it forks, so a freshly-set default shows up only on the next fork. If a
user reports "I set the model but it is still using the old one", these two
lines together are the diagnosis: compare them before changing anything.

The line is absent for a session that has not completed a turn since the
feature landed, and absent when the runtime did not report a model.

## The effort keys work the same way

```
claude.effort     codex.effort     pi.effort     grok.effort
```

Each names the reasoning effort a session of that runtime runs when nothing
closer to it names one. Same three layers, same command, same per-key merge, and
the same problem solved: without them, every duoduo session inherits whatever
effort the user set for their own interactive work.

```bash
duoduo session config --global set codex.effort=xhigh
duoduo session config --kind feishu set claude.effort=high
duoduo session config --global unset codex.effort
```

Two differences from the model keys, both deliberate.

**Validation is strict.** The vocabulary is four words — `low`, `medium`,
`high`, `xhigh` — so anything else is a typo and is refused at the command. A
model id had to stay open because ids are an open universe; an effort level does
not, and a silently-wrong level would be rejected on every turn with nothing
naming the config line that caused it.

**A job may name one, or leave it out.** `model` is required on every job
because a job without one used to run the user's own harness default. With these
keys a job without an effort runs duoduo's configured default, which is the
inheritance the user wants, so the field is optional.

What outranks what, highest first: a session's own `/effort`, then a job's or a
partition's frontmatter `effort`, then the channel, kind and host-wide
`<runtime>.effort`, then the runtime's own configuration. `/effort` with no
argument names the deciding layer the same way `/model` does:

```
Session effort: (high, from the kind config)
```

Every runtime applies the value its own way, and none of that changed. Claude
applies it to the live conversation, Codex on each turn, Grok on the live
session, and Pi when its worker is built, which means a Pi session picks up a
change on its next turn rather than mid-turn.

Match the effort to the model tier rather than to the runtime: a top-tier model
runs `high`, every other model runs `xhigh`. Because the config layers cannot
know which model a session's own `/model` selected, a session moved to a top
tier by hand needs `duoduo session effort <target> high` by hand too.

## Phrasebook — say it like this

- "That sets it for this one session. Want it for every Feishu session? That is
  the kind layer."
- "`/model` now tells you which file the default is coming from, so you know
  which layer to edit."
- "It says the default is X but the last turn ran Y — that session is still on
  a conversation that started before the change. It will pick X up on its next
  fresh thread."
- "Any id without spaces is accepted. If the backend does not serve it, the
  next turn fails and names it — nothing silently falls back."
- "Effort is the same three layers as the model, but the level has to be one of
  four words, so a typo is refused right at the command."
- "Match the effort to the model, not the runtime: top tier runs high, anything
  else runs xhigh."

## Relationship to the other model surfaces

| Surface | Scope | Use when |
| --- | --- | --- |
| `/model` in chat | one session, now | switching a live conversation |
| `duoduo session model` | one session, from ops | fixing a session without entering its chat |
| `<runtime>.model` config | a host, a kind, or a channel | setting a default for many sessions |
| `/effort` in chat, `duoduo session effort` | one session | changing how long one session reasons |
| `<runtime>.effort` config | a host, a kind, or a channel | setting an effort default for many sessions |
| Job frontmatter `model` | one scheduled job | that job needs a specific model |
| Job frontmatter `effort` | one scheduled job | that job's work differs from the host norm |
| Model profiles | Claude context window, endpoint, credentials | teaching duoduo a third-party model |
