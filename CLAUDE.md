# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository actually is

This is **not** the source of the `duoduo` runtime. Two layers live here:

1. **Upstream `openduo/duoduo` GitHub scaffold** (tracked in git): `README.md`, `CHANGELOG.md`, `skills/` (host-mode ops skills), `subconscious/` (partition prompt scaffold), `contrib/` (dashboard helpers), `assets/`. The upstream project **deliberately publishes no runtime source** — the real runtime ships as **minified JavaScript** in the npm package `@openduo/duoduo` (author's stance: "the code is written for agents, minification is compression not obfuscation"). So there is nothing to "build" here in the usual sense.

2. **Local reverse-engineering / analysis work** (added on top): `docs/` (deep analysis) and `reconstruction/` (the minified runtime reconstructed into readable, provably-equivalent source + the tooling that produced it). This is the actual working material of this repo.

When someone says "analyze duoduo's logic" or "restore the source," they mean working within layers 2 — reading the reconstructed source and refining the analysis docs, **not** editing the upstream scaffold.

## Repository map (the parts that matter)

- `docs/AGENT_INTERNALS_ANALYSIS.md` — the primary artifact: 8 runtime subsystems reverse-engineered from the minified bundle (note: this doc's §1–§8 taxonomy and `first-party/`'s 12 `NN-` directories are two different groupings of the same symbols, numbered independently — neither is derived from the other), pyramid-structured, every mechanism claim carries a `file:line` anchor into `daemon.pretty.js` and a `confirmed` / `未证实推测` confidence tag. Cross-validated against the reconstructed source.
- `docs/ARCHITECTURE_ANALYSIS.md` — system/deployment-level view (process model, filesystem layout, crash recovery, RPC/dashboard), backed by live-daemon observation.
- `docs/DUODUO_FRAMEWORK_GUIDE.md` — the entry point for product managers: a first-principles explanation of the runtime ("what the model lacks, the runtime supplies"), written for a reader who only knows what an LLM is. Deliberately carries **no** line anchors or short names; its Appendix C maps each section to the evidence sections of `AGENT_INTERNALS_ANALYSIS.md`, and Appendix D lists the upstream changes it absorbed.
- `docs/SOURCE_RECONSTRUCTION.md` — the reconstruction methodology.
- `reconstruction/recon/daemon.recon.js` — runnable reconstructed source, **provably semantically identical** to the shipped bundle (only first-party symbols renamed). `cli.recon.js` is gitignored: 3.7 MB carrying 34 renames, regenerated on demand by `rebuild.sh`.
- `reconstruction/first-party/<NN-subsystem>/*.js` — the first-party functions extracted into a readable per-subsystem tree (real names, original `daemon.pretty.js` line in header). **Read-only reference — not independently runnable.**
- `reconstruction/maps/modules_<bundle>.json` — **the one hand-made judgement in the pipeline**: which esbuild `__export` block (= which source module) is duoduo's own and which is a vendored library. Everything else is derived.
- `reconstruction/maps/symbols_<bundle>.json` — generated symbol index: real name → mangled name, declaration line, and a structural signature of the body. This is the authority for "where is symbol X"; line numbers are derived from it, never hand-written.
- `reconstruction/maps/pipeline_report.json` — **generated**; the authoritative counts for a run (blocks, first-party names, rename entries, AST nodes). Cite it rather than restating numbers in prose: the hand-copied versions of these had drifted into three contradictory values.
- `reconstruction/maps/RENAME_TABLE.md` — the mangled↔real name map (also mirrored in `docs/AGENT_INTERNALS_ANALYSIS.md` Appendix A.0).
- `reconstruction/tools/*.mjs` — the Babel-based reconstruction pipeline.

## Core discipline: the reconstruction must stay *provably equivalent*

The reconstruction is a chain of **semantics-preserving** transforms (beautify → byte-lossless de-bundle → scope-safe rename), never a hand-rewrite. Four invariants must hold and are machine-checkable (exact counts: `maps/pipeline_report.json`):

- **Lossless split**: concatenating the split module files reproduces the beautified bundle **byte-for-byte** (`cmp`). Segment files are named case-insensitively unique — minified identifiers routinely differ only by case (`Rw` vs `rW`), and on macOS or Windows the second write would otherwise overwrite the first and quietly falsify this proof.
- **Rename equivalence**: `recon/*.recon.js` and the beautified source have **identical ASTs modulo the rename map** (`tools/ast_equiv.mjs`, ~520k nodes for daemon).
- **First-party tree honesty**: every `first-party/**/*.js` extract is a verbatim slice of `recon/daemon.recon.js`, its header agrees with the rename map, and its cited line IS the symbol's declaration line (`tools/verify_first_party.mjs`). Nothing else checks this tree, and every way it can be wrong is silent.
- **Citation identity**: every doc citation of the form `真名 (短名)`(line) names a symbol that still exists and still has that short name (`tools/verify_citations.mjs`). A drifted *line* is not a failure — it is regenerable with `--fix`.

Do **not** hand-edit `recon/*.recon.js` as if it were source you can freely change — any edit must preserve AST equivalence, or the "runs identically" guarantee is void. Real symbol names come from esbuild's `__export` helper, which is authoritative; a minority of internal function names are RE-*inferred* (flagged in `RENAME_TABLE.md`) — an inferred name being slightly off never affects correctness because renaming is scope-safe. For how many of each, read `maps/pipeline_report.json`; do not copy the number into prose.

## Checking whether upstream has anything new (run this before anything else)

A sync check that compares against **unfetched** refs is comparing against the past, not
the present. In an ephemeral container the clone happened at container start, and other
sessions push to `origin` in between — so `origin/main` on disk can be many commits stale
while looking perfectly authoritative. A scheduled run is exactly where this bites: nobody
is watching, and the stale picture is self-consistent. Fetch first, always:

```bash
# 0) the clone only has `origin`; add upstream idempotently, then refresh EVERYTHING
git remote get-url upstream >/dev/null 2>&1 || git remote add upstream https://github.com/openduo/duoduo.git
git fetch --all --prune --tags

cat docs/.pretty-anchor-target                  # 1) version this repo last reconstructed to
git describe --tags --abbrev=0 upstream/main    # 2) latest upstream release tag
npm view @openduo/duoduo version                # 3) latest published runtime (the thing reconstructed)
git merge-base --is-ancestor upstream/main origin/main   # 4) has upstream fully landed in main?
git log origin/main..upstream/main --oneline    # 4b) if (4) is false: exactly what is missing
```

**Decision rule**: (4) true **and** the three version strings agree ⇒ nothing to do, stop and
say so. Any disagreement ⇒ the delta is real; merge, retarget the reconstruction, update
`docs/`. Each signal is authoritative for a different question and they are not
interchangeable: (4) alone answers "is there new upstream work", (2)/(3) answer "which
version would we be retargeting to". A tag can lag the branch tip, so never let a matching
tag stand in for the ancestry check.

**"Did this work already land?" is answered by ancestry, never by PR metadata.** A PR shows
`merged:false, state:closed` whenever its content reached the base by a direct push or a
local merge instead of the GitHub merge button — both are normal here (PRs #1 and #2 both
look unmerged in the API and both are fully in `main`). Reading that as "the work never
landed" once produced a confident, wrong report that `main` was 13 commits behind, because
it agreed with an equally stale `origin/main` — two signals that look independent but share
one root cause. Only `git merge-base --is-ancestor <commit> origin/main`, against a
freshly fetched ref, settles it.

When a run reports its findings out of band (a push notification, an issue, a PR comment),
every claim in it must have been verified in that same run against freshly fetched refs.
Anything not re-verified does not go in.

## Reconstruction workflow (commands)

The pipeline needs the **beautified bundles** as input (`{daemon,cli,stdio}.pretty.js`). These are *not committed* (multi-MB) — regenerate them from the installed npm package:

```bash
# 0) tooling: Node is at ~/.local/node-v22.17.0-linux-x64/bin (NOT on default PATH — export it)
export PATH="$HOME/.local/node-v22.17.0-linux-x64/bin:$PATH"
cd reconstruction/tools && npm install        # installs @babel/{parser,traverse,generator,types}

# 1) get the shipped bundles into a SCRATCH install.
#    Do not point PKG at the global install: the runtime-verification section below
#    copies the reconstruction into $PKG, and the global install is the one the live
#    daemon was started from.
npm install --prefix /tmp/duoduo-pkg @openduo/duoduo@latest
PKG="/tmp/duoduo-pkg/node_modules/@openduo/duoduo/dist/release"

# 2) run the full pipeline: beautify → per bundle split → reassemble+cmp → export
#    blocks → module gate → rename → node --check → AST-equivalence → symbol index,
#    then verify the first-party tree, the citations and the legacy line anchors,
#    and write maps/pipeline_report.json. Bundles run concurrently; JOBS=1 forces
#    sequential when bisecting a failure. BEAUTIFIED=<dir> skips the beautify step.
PKG="$PKG" PKG_VERSION=v0.8.1 bash rebuild.sh
```

Beautification is now *inside* the pipeline, with `js-beautify` pinned to an exact version
in `tools/package.json`. It used to be a manual `npx` prerequisite — which meant every line
anchor in `docs/` rested on whatever version npm resolved that day, and a formatter release
would have shifted all of them at once with no signal but a red anchor check.

**Only bundles with a first-party export table are worth running**, currently `daemon` and
`cli`. `stdio`, `pi-worker`, `channel-acp` and `feishu-gateway` recover 9, 0, 0 and 1 real
name respectively — the latter three are entry bundles whose own modules are inlined, so
their 621 recovered names are 100% vendored zod. Renaming nothing and then proving the
nothing is AST-equivalent is not evidence. Naming those bundles needs the hand-derived
route (`locate_by_anchor.mjs` → `maps/inferred_<bundle>.json`).

**The module gate is the step that fails loudly on a version bump.** esbuild emits one
`__export` block per source module, so a block *is* a module; `maps/modules_<bundle>.json`
records, per module, whether it is ours. A block matching neither list stops the build — one
decision per new upstream module, not per unknown name.

This replaced a per-name keyword allowlist that failed in both directions at v0.8.1: it
missed 8 first-party symbols living in our own modules (`diffStreamingConfigSignature`,
`detectInProcessBreak`, `mapItemCompletedToExecEvent`, …), and once those were swept into
the accepted-vendor baseline nothing could ever flag them again. The failure was structural,
not a missing word — the entire Grok module exports only `GROK_ACP_*` constants, which is
how v0.7.1 lost 19 symbols in silence, and `pi` cannot be a substring rule because it
matches `pipeline` and `api`.

Individual tools (all take explicit paths, all read-only except writing outputs):

```bash
node tools/split.mjs <pretty.js> <outdir>            # AST byte-slice de-bundle → modules/ + manifest.json
node tools/reassemble.mjs <splitdir> <out.js>        # concat back; must cmp-match original
node tools/export_blocks.mjs <pretty.js> --json <o>  # __export names GROUPED BY SOURCE MODULE + entry exports
node tools/build_rename.mjs <blocks> <modules> <inferred> <out>   # module gate → mangled→real map
node tools/rename.mjs <pretty.js> <rename.json> <out.js> [report] # scope-safe, formatting-preserving rename
node tools/ast_equiv.mjs <original.js> <renamed.js> <rename.json> # prove semantic equivalence
node tools/symbol_index.mjs <pretty.js> <rename.json> <out.json>  # name → line + structural signature
node tools/verify_citations.mjs <symbols.json> <doc.md...> [--fix]  # check docs by symbol identity
```

## Running / verifying the actual runtime

The reconstructed daemon boots as a real daemon. To verify it **without disturbing a live instance**, isolate `HOME` (the data home is `homedir()/.aladuo`, not overridable via `ALADUO_WORK_DIR`) and pick a non-default RPC port:

```bash
cp reconstruction/recon/daemon.recon.js "$PKG/"     # $PKG = the scratch install from step 1, never the
cd "$PKG"                                           # global one; must run from a package dir so Node
                                                    # resolves the peer dep @anthropic-ai/claude-agent-sdk
ISO=/tmp/iso && mkdir -p "$ISO" && chmod 700 "$ISO"   # keep it SHORT: the daemon refuses to boot
                                                      # if <HOME>/.aladuo/run/daemon.sock exceeds the
                                                      # 104-byte unix-socket limit (fatal, not a warning)
HOME="$ISO" ALADUO_PORT=20333 ALADUO_BOOTSTRAP_DIR="$PKG/../../bootstrap" \
  ALADUO_RUNTIME_MODE=host ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local \
  ALADUO_LOG_LEVEL=info \
  node daemon.recon.js        # starts socket + read-only TCP + cadence + WAL; SIGTERM to stop

# probe the READ-ONLY TCP surface (6 allowlisted methods; writes get -32601)
curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20333/rpc \
  -d '{"jsonrpc":"2.0","id":1,"method":"system.status","params":{}}'
# probe the FULL control plane — it lives on the unix socket
curl -s -H 'Content-Type: application/json' \
  --unix-socket "$ISO/.aladuo/run/daemon.sock" http://localhost/rpc \
  -XPOST -d '{"jsonrpc":"2.0","id":2,"method":"session.list","params":{}}'
```

Two things silently break these probes: omitting `-H 'Content-Type: application/json'` (curl defaults to form-encoding, so fastify answers `415` before JSON-RPC dispatch — it reads like a dead endpoint), and writing `"$HOME/.aladuo/run/daemon.sock"` for the socket path (the `HOME=` prefix applied only to `node`, so `$HOME` expands to your **real** home and you probe the live daemon instead of the isolated one). Default log level is `warn`; set `ALADUO_LOG_LEVEL=info` or boot-time behaviour looks like dead code.

Deploying the shipped runtime (non-TTY onboarding requires these env vars, else `onboard` exits code 2):

```bash
npm install -g @openduo/duoduo
export DUODUO_NODE_BIN="$(command -v node)" ALADUO_RUNTIME_MODE=host \
       ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local DUODUO_ONBOARD_YES=1
duoduo onboard && duoduo daemon start && duoduo daemon status
```

The daemon is a **detached background process that does not hot-reload** — restart with `duoduo daemon restart` after config changes. Two different persistence homes, do not conflate them. `ALADUO_CLAUDE_AUTH_SOURCE` and the other `ALADUO_*` keys go in `~/.config/duoduo/.env`, which the daemon itself reads at boot (`loadHostDotEnv`, fills only unset keys). `DUODUO_NODE_BIN` does **not**: its only reader in the shipped package is the `bin/duoduo` bash wrapper (`NODE_BIN="${DUODUO_NODE_BIN:-node}"`), which runs before any JavaScript and never sources `.env` — none of the four `dist/release/*.js` bundles contain the literal, and the CLI spawns the daemon and channel processes via `process.execPath`. So to survive a PATH reset (`bash -lc`, GUI process managers), export it in the shell startup file or the process manager's environment that launches `duoduo`. Putting it in `.env` only propagates it to the sessions the daemon spawns; it does not help the wrapper find node.

## duoduo runtime architecture (the big picture the docs decode)

A **thin runtime + foundation model**: the runtime owns only what the model can't (persistence, lifecycle, scheduling, concurrency); all reasoning is delegated to the model. Read `docs/AGENT_INTERNALS_ANALYSIS.md` for the full treatment; the load-bearing ideas:

- **Event-sourced, append-before-execute**: every inbound event is written to the WAL (`~/.aladuo/var/events/YYYY-MM-DD.jsonl`) *before* it is enqueued or executed. All other state is a derived view rebuildable from "log + pointers". A single append = WAL line + `by_id` index, unconditionally and always exactly those two writes — there is no `by_session` index (the string appears nowhere in the bundle; session-scoped retrieval goes through the mailbox `- [ ] @evt(<id>)` pointers instead). Entry points: `createSpineEvent`/`atomicAppendEvent` (Spine), `appendBeforeExecuteGateway` (Gateway).
- **One external identity → many session actors**: one key ⇒ one in-memory actor (`createSessionManager`), two-layer locking (process write-lock + async per-key mutex), bounded yieldable pools. Backends are routed on a `claude`|`codex`|`grok`|`pi` four-value enum (grok added v0.7.1, pi added v0.8.0; the enum itself was refactored from three independently-scoped duplicate constants into one canonical array at v0.7.1). **Shared assembler, forked execution**. Codex falling back to claude when unavailable is silent; grok never falls back — it fails closed with an error at drain time. Unlike the other three, pi requires no external CLI or login — it ships embedded in the npm package (`dist/release/pi-worker.js`, not yet covered by `reconstruction/`) and is unconditionally listed as available.
- **Two orthogonal context injection faces** (`buildSystemPromptForChannelConfig` = system-prompt face for stable cognition + prompt-cache friendliness; `buildTransientUserBlocks` = per-turn user-message face for volatile embodied state). Claude and Codex share the same assembler; Codex only wraps one extra `<aladuo:system-context>` shell.
- **Dual-loop cognition**: foreground Cortex + background Subconscious on a cadence heartbeat (default `2220000ms` ≈ 37 min, `ALADUO_CADENCE_INTERVAL_MS`). The subconscious runs stateless one-shot LLM partition sessions; the memory system does read-only measurement + soft-delete GC and delegates all content rewriting back to the model (`runCadenceTick`, `runMemoryCheckTick`).
- **Two runtime homes** (don't confuse): `~/aladuo` = kernel/"inner world" (git-managed, self-programming rollback points); `~/.aladuo` = mutable runtime data (`var/`, `run/`). Control plane is JSON-RPC 2.0, but since v0.7.0 it no longer lives on the TCP port alone: full control (state-changing RPC methods, `/ws`) is served only on a unix socket at `<runDir>/daemon.sock` (mode 0600, parent dir 0700 — filesystem permissions are the actual access control), while `:20233/rpc` stays up as a **read-only** endpoint (an allowlist of read-only methods; everything else gets a JSON-RPC `-32601`) plus `/healthz`/`/dashboard`/`/readyz`. An explicit opt-in (`ALADUO_DAEMON_HOST` set to a non-loopback host) can open a third, bearer-token-gated remote TCP listener.

## Writing / editing the analysis docs

- Anchor every mechanism claim with a `file:line` into `daemon.pretty.js` (default) and a `confirmed` / `未证实推测` tag; **always use the "真名 (短名)" form**, e.g. `atomicAppendEvent (Xt)`. Never present an unverified inference as fact.
- **The name is the anchor; the line is derived.** Only the 真名 form is machine-checkable — `verify_citations.mjs` resolves it through `maps/symbols_daemon.json`, fails the build if the symbol is gone or the short name is wrong, and repairs a drifted line with `--fix`. A bare line number carries no redundancy, so nothing can check it: ~1600 of them predate the symbol index and only a small refutable subset is reachable by `check_bare_anchors.mjs`. Write new citations in the 真名 form so they self-maintain; do not add bare numbers.
- If a hand-derived name for a non-exported function is used in prose, record it in `maps/inferred_daemon.json` first. An unrecorded one is unverifiable and invisible to the readable tree — that is how `classifyModelContextRequirement` sat in the docs for versions without existing anywhere in the reconstruction.
- **Exception: `docs/DUODUO_FRAMEWORK_GUIDE.md` carries no anchors and no short names, on purpose.** It is the product-manager guide: plain literal language (no metaphors, flourish, or coined labels — say what the mechanism does), every term explained at first use, conclusion-first. Its credibility comes from Appendix C (section → `AGENT_INTERNALS_ANALYSIS.md` evidence section), not from inline citations. When upstream changes a mechanism, update the prose and Appendix D (version delta); do not "fix" it by adding line numbers.
- Docs are written **conclusion-first (Pyramid Principle)**: central idea → MECE key sentences → answer-first sections. Preserve that when extending.
- When a claim is corrected, update the doc **in place to the latest verified conclusion** — no errata notes, strikethroughs, or revision-history appendices in `docs/`. Credibility comes from every claim staying re-checkable against the reconstructed source via its `file:line` anchor (git history preserves the old wording if ever needed).
