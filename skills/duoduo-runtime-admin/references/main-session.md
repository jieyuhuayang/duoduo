# The main session

Finding, setting, moving and untangling the main session, and why
something landed in it.

## Contents

- What it is, and what lands there
- How a session becomes main; who may move or clear it
- Moving main (handover); two sessions aliased `main`
- Hosts that already used a `main` alias

## What it is

The main session is the owner's own conversation and the **fallback sink**:
the place a delivery lands when it has no better target. It is not a more
powerful session. It runs the same tools and the same runtime rules as any
other channel session. Its only extra authority is over the role itself and
over Feishu forwards (who is main, and which outside chat reaches which
session).

There is no separate setting. The main session is the one **channel** session
whose alias is `main`. The alias is the pointer, and there is at most one. A
job named `main` is not a candidate; only channel sessions (Feishu, stdio,
ACP, ambient, tether, …) can hold the role.

## What lands there

Each of these is a fallback; an explicit target always wins.

| Delivery | When it goes to main |
| --- | --- |
| Job outcome | The job's owner session is missing, archived, or nobody has read it for the unread window (`ALADUO_NOTIFY_UNCONSUMED_HOURS`, default 1 hour). The receipt names the owner session it stands in for. If main itself is absent, ambiguous, or unread, the outcome goes to the live owner as before; with no live owner either, it goes only to the log — check the main chat is open. `job.fail` wakes main; `job.complete` queues. |
| `Notify` / `duoduo session notify` with target `main` | Always, resolved at delivery time, so it follows a move. There is no targetless default: a session that wants the owner writes `main`. With main absent or ambiguous the call fails with the usual error. |
| A Feishu chat forwarded to `main` | Every mention in that chat (every message in a forwarded DM). See `duoduo-channel-admin` → `references/feishu-forward.md`. |
| A setup-card request | A member of an unconfigured Feishu chat clicked "Hand to an existing session". Main asks the owner which session should take the chat. |
| Role notices | "You are now the main session" when it gains the role, and a handover notice to the session that lost it. |

A daemon restart without `--wake` does not go to main; every channel session
learns the restart reason on its next turn, as before.

## How a session becomes main

| Situation | What happens | Action |
| --- | --- | --- |
| Feishu default instance, `FEISHU_BOT_OWNER` (or the first `FEISHU_ALLOW_FROM` entry) set, owner sends the first DM | The owner's DM session is created at the default workspace and claims `main` if no session holds it. | None. The session is told it is main and tells the owner itself. |
| Same, but the owner DM already exists and main is absent | At every start of the default instance, if main is absent, the owner DM at the default workspace claims it (only when exactly one such session exists). | None, or `duoduo channel feishu stop && duoduo channel feishu start` to trigger it now. |
| Zero-config Feishu (no owner configured), a second Feishu/Lark app (`--instance`) | Never claims automatically. | Set it by hand (next row). |
| Pure CLI / ACP / tether / ambient (Pocket) host | Never claims automatically. Until someone sets it, fallbacks behave as if there were no main. | Set it by hand. |
| Any host, choose explicitly | — | `duoduo session alias <session_key> main --move` |

`duoduo session list` is how to find the session key. When any row carries
the role, the table gains a `MAIN` column: `main since <ISO time>` on the
holder, `main? (ambiguous)` on every candidate when there are several. In
`--json` the row carries `main: "held" | "candidate"` and `main_since`.

## Who may move or clear it

| Caller | Claim / move / clear `main` |
| --- | --- |
| The owner at their own terminal | Allowed. |
| The current main session (through Bash) | Allowed: this is how main hands the role over. |
| Any other session | Refused (`not_main`), naming the current main and the command for the owner to run. |
| A session that cannot be identified | Refused (`no_caller`). |
| Any session while main is absent | Refused: there is no current main to authorize it, so only the owner's terminal (or an automatic claim) can fill the role. |

Commands:

```bash
duoduo session alias <new_key> main --move   # make <new_key> main, clearing the old holder
duoduo session alias <new_key> main          # claim when no one holds it (refused as main_held otherwise)
duoduo session alias <main_key> --clear      # leave the role empty
```

`--move` is only valid with the name `main`. Renaming the holder to another
name also clears the role. Archiving the main session leaves the role empty;
fallbacks then behave as if there were no main.

If the owner's own terminal is refused with a note that duoduo "could not tell
whether this command runs inside a session", the daemon was not started with
`duoduo daemon start`. Start it that way and run the command again.
`forward` and `send` from such a terminal are refused as an unidentified
session with no hint; the cause is the same.

## Moving main (handover)

1. The owner says which session should be main (for example, a new Feishu
   app's DM).
2. The current main runs `duoduo session alias <new_key> main --move`. The
   daemon moves the alias in one step, stamps `main_since`, tells the new
   holder it is main, and tells the old one about the handover.
3. The old main sends the new one what it carries — open requests,
   commitments, jobs it owns — with `Notify`. The CLI writes no summary; the
   handover is the old session's own work.
4. Forwards that target `main` follow the move with no edit. Forwards to a
   specific session key do not change.

## Two sessions aliased `main`

This only happens on a host that set the alias twice before the role existed.
While it lasts, **no** session is used as main: every fallback behaves as if
main were absent. `duoduo daemon status` prints
`main: ambiguous — N sessions are aliased main` with the keys, and
`duoduo session list` marks each candidate. At every daemon start each
candidate is told the same and asked to have the owner pick.

Fix, from the owner's terminal:

```bash
duoduo session alias <the_one_to_keep> main --move   # clears every other candidate
```

Do not repeat the candidate list in a chat other people can read; it is for
the owner.

## Hosts that already used a `main` alias

A host that aliased a channel session `main` before this release keeps it.
At the first daemon start after the upgrade the holder is recognized, stamped
with `main_since`, and told once that it is the main session and what that
means. Scripts and watchers that already run `duoduo session notify main …`
keep working and now reach exactly that session. If the old alias sits on a
job session, it is not main; set a channel session.
