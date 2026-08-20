# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository actually is

This is **not** the source of the `duoduo` runtime. Two layers live here:

1. **Upstream `openduo/duoduo` GitHub scaffold** (tracked in git): `README.md`, `CHANGELOG.md`, `skills/` (host-mode ops skills), `subconscious/` (partition prompt scaffold), `contrib/` (dashboard helpers), `assets/`. The upstream project **deliberately publishes no runtime source** — the real runtime ships as **minified JavaScript** in the npm package `@openduo/duoduo` (author's stance: "the code is written for agents, minification is compression not obfuscation"). So there is nothing to "build" here in the usual sense.

2. **Local reverse-engineering / analysis work** (added on top): `docs/` (deep analysis) and `reconstruction/` (the minified runtime reconstructed into readable, provably-equivalent source + the tooling that produced it). This is the actual working material of this repo.

When someone says "analyze duoduo's logic" or "restore the source," they mean working within layers 2 — reading the reconstructed source and refining the analysis docs, **not** editing the upstream scaffold.

## Repository map (the parts that matter)

- `docs/AGENT_INTERNALS_ANALYSIS.md` — the primary artifact: 8 runtime subsystems reverse-engineered from the minified bundle, pyramid-structured, every mechanism claim carries a `file:line` anchor into `daemon.pretty.js` and a `confirmed` / `未证实推测` confidence tag. Cross-validated against the reconstructed source.
- `docs/ARCHITECTURE_ANALYSIS.md` — system/deployment-level view (process model, filesystem layout, crash recovery, RPC/dashboard), backed by live-daemon observation.
- `docs/SOURCE_RECONSTRUCTION.md` — the reconstruction methodology.
- `reconstruction/recon/{daemon,cli,stdio}.recon.js` — runnable reconstructed source, **provably semantically identical** to the shipped bundles (only first-party symbols renamed).
- `reconstruction/first-party/<NN-subsystem>/*.js` — the 139 first-party functions extracted into a readable per-subsystem tree (real names, original `daemon.pretty.js` line in header). **Read-only reference — not independently runnable.**
- `reconstruction/maps/RENAME_TABLE.md` — the mangled↔real name map (also mirrored in `docs/AGENT_INTERNALS_ANALYSIS.md` Appendix A.0).
- `reconstruction/tools/*.mjs` — the Babel-based reconstruction pipeline.

## Core discipline: the reconstruction must stay *provably equivalent*

The reconstruction is a chain of **semantics-preserving** transforms (beautify → byte-lossless de-bundle → scope-safe rename), never a hand-rewrite. Three invariants must hold and are machine-checkable:

- **Lossless split**: concatenating the split module files reproduces the beautified bundle **byte-for-byte** (`cmp`).
- **Rename equivalence**: `recon/*.recon.js` and the beautified source have **identical ASTs modulo the rename map** (`tools/ast_equiv.mjs`, ~505k nodes for daemon).
- **First-party tree honesty**: every `first-party/**/*.js` extract is a verbatim slice of `recon/daemon.recon.js`, its header agrees with the rename map, and its cited line IS the symbol's declaration line (`tools/verify_first_party.mjs`). Nothing else checks this tree, and every way it can be wrong is silent.

Do **not** hand-edit `recon/*.recon.js` as if it were source you can freely change — any edit must preserve AST equivalence, or the "runs identically" guarantee is void. Real symbol names come from esbuild's `__export` helper (authoritative, 739 recovered for daemon); a minority of internal function names are RE-*inferred* (flagged in `RENAME_TABLE.md`) — an inferred name being slightly off never affects correctness because renaming is scope-safe.

## Reconstruction workflow (commands)

The pipeline needs the **beautified bundles** as input (`{daemon,cli,stdio}.pretty.js`). These are *not committed* (multi-MB) — regenerate them from the installed npm package:

```bash
# 0) tooling: Node is at ~/.local/node-v22.17.0-linux-x64/bin (NOT on default PATH — export it)
export PATH="$HOME/.local/node-v22.17.0-linux-x64/bin:$PATH"
cd reconstruction/tools && npm install        # installs @babel/{parser,traverse,generator,types}

# 1) get the shipped bundles into a SCRATCH install and beautify them.
#    Do not point PKG at the global install: step 3 below copies the reconstruction
#    into $PKG, and the global install is the one the live daemon was started from.
npm install --prefix /tmp/duoduo-pkg @openduo/duoduo@latest
PKG="/tmp/duoduo-pkg/node_modules/@openduo/duoduo/dist/release"
mkdir -p /tmp/beautified
for b in daemon cli stdio; do npx js-beautify "$PKG/$b.js" > /tmp/beautified/$b.pretty.js; done

# 2) run the full pipeline: per bundle split → reassemble+cmp → recover names →
#    coverage gate → rename → node --check → AST-equivalence, then verify the
#    first-party tree and the doc anchors. The three bundles run concurrently;
#    JOBS=1 forces sequential when bisecting a failure.
BEAUTIFIED=/tmp/beautified bash rebuild.sh
```

The coverage gate is the step that fails loudly on a version bump: any export name that
is neither classified first-party nor recorded in `maps/vendor_baseline_<bundle>.json`
stops the build. That is deliberate — at v0.7.1 the keyword heuristic silently skipped the
entire new Grok subsystem, and nothing failed. Classify what it reports (add a keyword for
first-party, or re-run `build_rename.mjs` with `--accept-vendor` to record vendor names).

Individual tools (all take explicit paths, all read-only except writing outputs):

```bash
node tools/split.mjs <pretty.js> <outdir>           # AST byte-slice de-bundle → modules/ + manifest.json
node tools/reassemble.mjs <splitdir> <out.js>        # concat back; must cmp-match original
node tools/exports_map.mjs <pretty.js>               # recover __export original names (auto-detects helper)
node tools/rename.mjs <pretty.js> <rename.json> <out.js> [report]   # scope-safe, formatting-preserving rename
node tools/ast_equiv.mjs <original.js> <renamed.js> <rename.json>   # prove semantic equivalence
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

The daemon is a **detached background process that does not hot-reload** and may lose PATH on restart — persist `DUODUO_NODE_BIN` + `ALADUO_CLAUDE_AUTH_SOURCE` in `~/.config/duoduo/.env`, and restart with `duoduo daemon restart` after config changes.

## duoduo runtime architecture (the big picture the docs decode)

A **thin runtime + foundation model**: the runtime owns only what the model can't (persistence, lifecycle, scheduling, concurrency); all reasoning is delegated to the model. Read `docs/AGENT_INTERNALS_ANALYSIS.md` for the full treatment; the load-bearing ideas:

- **Event-sourced, append-before-execute**: every inbound event is written to the WAL (`~/.aladuo/var/events/YYYY-MM-DD.jsonl`) *before* it is enqueued or executed. All other state is a derived view rebuildable from "log + pointers". A single append = WAL line + `by_id` index (+ `by_session` index **only when the event has a session_key**). Entry points: `createSpineEvent`/`atomicAppendEvent` (Spine), `appendBeforeExecuteGateway` (Gateway).
- **One external identity → many session actors**: one key ⇒ one in-memory actor (`createSessionManager`), two-layer locking (process write-lock + async per-key mutex), bounded yieldable pools. Backends are routed on a `claude`|`codex`|`grok` three-value enum (grok added v0.7.1; the enum itself was refactored from three independently-scoped duplicate constants into one canonical array); **shared assembler, forked execution**. Codex falling back to claude when unavailable is silent; grok never falls back — it fails closed with an error at drain time.
- **Two orthogonal context injection faces** (`buildSystemPromptForChannelConfig` = system-prompt face for stable cognition + prompt-cache friendliness; `buildTransientUserBlocks` = per-turn user-message face for volatile embodied state). Claude and Codex share the same assembler; Codex only wraps one extra `<aladuo:system-context>` shell.
- **Dual-loop cognition**: foreground Cortex + background Subconscious on a cadence heartbeat (default `2220000ms` ≈ 37 min, `ALADUO_CADENCE_INTERVAL_MS`). The subconscious runs stateless one-shot LLM partition sessions; the memory system does read-only measurement + soft-delete GC and delegates all content rewriting back to the model (`runCadenceTick`, `runMemoryCheckTick`).
- **Two runtime homes** (don't confuse): `~/aladuo` = kernel/"inner world" (git-managed, self-programming rollback points); `~/.aladuo` = mutable runtime data (`var/`, `run/`). Control plane is JSON-RPC 2.0, but since v0.7.0 it no longer lives on the TCP port alone: full control (state-changing RPC methods, `/ws`) is served only on a unix socket at `<runDir>/daemon.sock` (mode 0600, parent dir 0700 — filesystem permissions are the actual access control), while `:20233/rpc` stays up as a **read-only** endpoint (an allowlist of read-only methods; everything else gets a JSON-RPC `-32601`) plus `/healthz`/`/dashboard`/`/readyz`. An explicit opt-in (`ALADUO_DAEMON_HOST` set to a non-loopback host) can open a third, bearer-token-gated remote TCP listener.

## Writing / editing the analysis docs

- Anchor every mechanism claim with a `file:line` into `daemon.pretty.js` (default) and a `confirmed` / `未证实推测` tag; prefer the "真名 (短名)" form, e.g. `atomicAppendEvent (Qt)`. Never present an unverified inference as fact.
- Docs are written **conclusion-first (Pyramid Principle)**: central idea → MECE key sentences → answer-first sections. Preserve that when extending.
- When a claim is corrected, update the doc **in place to the latest verified conclusion** — no errata notes, strikethroughs, or revision-history appendices in `docs/`. Credibility comes from every claim staying re-checkable against the reconstructed source via its `file:line` anchor (git history preserves the old wording if ever needed).
