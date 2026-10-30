# Diagnose a Feishu channel

Load this file when the user reports Feishu bot behaving unexpectedly
and the symptom isn't obvious. Walk the tree top-down; take the
first match.

## Decision tree

### Symptom: card click does nothing / shows error 200340

1. Check subscription & release state first:
   ```bash
   duoduo channel feishu stop
   duoduo channel feishu doctor
   ```
2. `doctor` walks three invisible layers (subscription enabled / app
   released / encryption config). Fix whichever it flags.
3. If `doctor` reports clean, grep `duoduo channel feishu logs` for
   `card.action.trigger` frames and handler stack traces — the
   handler might be crashing or exceeding Feishu's ~3s response
   budget.

### Symptom: "Setup failed: channel already configured (stale card)"

The click used a card that was rendered before someone else bound
the channel. Resolution: have the user send `/setup` to get a fresh
card. This error is a v0.5 guard, not a bug.

### Symptom: "/setup does nothing on my DM" or "This is the owner's DM, bound to …"

This is owner-DM refusal by design. Check:

1. Read the descriptor:
   ```bash
   cat ~/.aladuo/var/channels/feishu-<chat_id>/descriptor.md
   ```
2. If `bound_by` matches `FEISHU_BOT_OWNER` (or
   `FEISHU_ALLOW_FROM[0]` when `FEISHU_BOT_OWNER` unset), it's the
   locked owner DM. To rebind it, run the reset script —
   there's no in-chat path. (Moving the main role is separate and
   needs no reset: `duoduo-runtime-admin` → `references/main-session.md`.)
3. If `bound_by` does NOT match the current owner, the descriptor
   drifted (zero-config era or stale env). The owner's `/setup`
   should already route to the secondary card — verify by having
   them try.

### Symptom: "Bot responded with old conversation context after I reset"

Ingress / outbox / replay artifacts persisted across the naive reset.
Use the full reset script:

```bash
bash scripts/reset-feishu-session.sh --channel-id feishu-<chat_id>
duoduo channel feishu stop && duoduo channel feishu start
```

The script calls `duoduo session archive <session_key>` per matched
session; the daemon atomically moves session + ingress + outbox-record +
outbox-replay + descriptor to their `var/<kind>-archive/` siblings
(timestamped, reversible via `mv`). See
[reset-feishu-session.md](reset-feishu-session.md) for what it does
and why each step matters.

### Symptom: "Strangers can DM my bot and it responds"

Zero-config mode is active (no `FEISHU_BOT_OWNER`, default
`dmPolicy=open`). Any first DM sender auto-spawns an owner-style DM
session (it never becomes the main session in this mode).
Fix:

```bash
# in ~/.config/duoduo/.env
FEISHU_BOT_OWNER=ou_yourOpenId
FEISHU_ALLOW_FROM=ou_you,ou_friend,…
FEISHU_DM_POLICY=allowlist
```

Then restart:

```bash
duoduo channel feishu stop
duoduo channel feishu start
```

If a stranger already auto-spawned the descriptor, their open_id is
NOT stamped as `bound_by` (zero-config omits it). The descriptor is
safe to continue using — but reset + re-bind if the project choice
was wrong.

### Symptom: "Group /setup shows compact card but I want to change project"

v0.5 design: once a group is bound, project/runtime are frozen —
only `require_mention` is editable via `/setup`. To reassign
project, run the reset script and start fresh. This is intentional:
changing a live group's project conflates workstreams.

### Symptom: "Group bound to wrong project after we both clicked"

Known v0.5 limit: concurrent first-time clicks race. The later writer
wins. Fix: reset + bind deliberately (one operator clicks, others
wait).

### Symptom: "My bot lost its owner DM after I edited .env"

Check whether `FEISHU_BOT_OWNER` is currently set:

```bash
grep FEISHU_BOT_OWNER ~/.config/duoduo/.env
```

If the line is missing/typo'd, the owner-DM refusal gate lifted. The
DM may have been reassigned via `/setup`. Recovery:

1. Restore `FEISHU_BOT_OWNER` in `.env`
2. `duoduo channel feishu stop && duoduo channel feishu start`
3. If the descriptor was rewritten in the unlocked window, run the
   reset script

### Symptom: a chat of a second app, or a forwarded chat, does not answer

Name the instance in every command (`--instance <name>`). Check
`duoduo channel feishu status` (lists every instance), then
`duoduo channel feishu forward --instance <name>` (is the chat
forwarded, and to whom), then the instance log for
`forwarded mention not delivered` (the chat also got a "This message was not
delivered" reply) or `forwarded mention notify failed`. The full table is in
[feishu-forward.md](feishu-forward.md) → Troubleshooting.

## When to escalate to a product bug

Treat as a likely duoduo bug (and prepare a public issue) if all of
these hold:

- `doctor` reports clean on the dev console side
- logs show `card.action.trigger` frames arriving but no handler error
- `descriptor.md` looks correct for the user's intent
- reset + re-bind reproduces the same wrong behavior

See [../../duoduo-admin/references/issue-reporting.md](../../duoduo-admin/references/issue-reporting.md).
