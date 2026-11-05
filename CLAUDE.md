# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository actually is

This is **not** the source of the `duoduo` runtime. Two layers live here:

1. **Upstream `openduo/duoduo` GitHub scaffold** (tracked in git, merged from `upstream/main`): `README.md`, `CHANGELOG.md`, `skills/` (host-mode ops skills), `subconscious/` (partition prompt scaffold), `contrib/` (dashboard helpers), `assets/`. Upstream publishes **no runtime source**: the runtime ships as **minified JavaScript** in the npm package `@openduo/duoduo`. Upstream's license (FSL-1.1-Apache-2.0 with the agent addendum in `LICENSE.agents.yaml`) allows de-minifying, decompiling and analysing every published version and sharing patches, and forbids only competing commercial use; that is the licensing basis for the reconstruction. Do not edit this layer except by merging upstream.
2. **Local reverse-engineering and analysis work**: `docs/` (analysis) and `reconstruction/` (the minified runtime reconstructed into readable, provably equivalent source, and the tooling that produced and checks it). "Analyze duoduo's logic" or "restore the source" means work in this layer.

There is no build in the usual sense. The "build" is `reconstruction/tools/rebuild.sh`, a chain of proofs, and the "tests" are its gates (below).

## Repository map

Docs (`docs/README.md` is the reading map and the maintainers' conventions; read it first when you change a doc):

- `docs/AGENT_INTERNALS_ANALYSIS.md` (INTERNALS) — the primary artifact: every runtime mechanism with the code behind it, in sections 1–14 (1 端到端路径, 2 系统提示装配, 3 引擎, 4 自操作工具, 5 事件日志, 6 网关与控制面, 7 Drain 与 turn 控制, 8 会话 actor、锁与并发池, 9 渠道适配器, 10 job 调度, 11 心跳与后台分区, 12 记忆系统, 13 指令指纹与改动生效, 14 未证实与待实测). Each claim cites code by name and carries `confirmed` or `未证实推测`; no line numbers. These sections and the `NN-` directories of `first-party/` group the same symbols independently; neither is derived from the other. Appendix A links `reconstruction/maps/RENAME_TABLE.md`, Appendix B lists event types and RPC methods.
- `docs/ARCHITECTURE_ANALYSIS.md` — deployment and operations: install and onboarding, which env var or config file lives where and who reads it, the two directories and their locks, control-plane listeners, ops commands, channel-adapter lifecycle, live-daemon measurements (each labelled with the older release it was measured on), ops risks. Mechanism evidence stays in INTERNALS.
- `docs/DUODUO_FRAMEWORK_GUIDE.md` (GUIDE) — the product-manager entry point, written for a reader who only knows what an LLM is. **No anchors and no short names, on purpose**; Appendix C maps each section to INTERNALS sections, Appendix D lists the upstream changes it absorbed.
- `docs/SOURCE_RECONSTRUCTION.md` — why the reconstruction is credible and how doc citations are checked.
- `docs/AGENT_FRAMEWORKS_COMPARISON.md` (duoduo vs hermes-agent vs pi) and `docs/DUODUO_VS_BOTMUX.md` (how duoduo and botmux drive Claude Code and Codex) — comparisons; their duoduo facts rest on the three docs above.
- `docs/RECONSTRUCTION_EFFICIENCY_RESEARCH.md` — a research record, not an analysis of duoduo: what the internet offers for the two pain points of this reconstruction (names that cannot be recovered exactly; re-anchoring every release), by direction, with a ranked list of recommendations and the verification status of every claim. No code citations.

Reconstruction (`reconstruction/README.md` is the full reference: generated artifacts, hand-maintained maps, the bump procedure step by step with the measured results of each tool, the tool table; `reconstruction/VERIFICATION.md` is the evidence log per proof):

- `recon/daemon.recon.js` — runnable reconstructed daemon, identical AST to the shipped bundle modulo the rename map (first-party top-level symbols, plus the parameters and locals inside them), compared binding by binding. Outside the proof: code that reads a function's own name (`Function.prototype.name`, `constructor.name`, stack traces) and the one direct `eval()` in vendored gray-matter. The cli counterpart is not committed (`.build/cli.recon.js`).
- `first-party/<NN-subsystem>/<realName>.js` — one file per renamed daemon symbol, generated, read-only, not runnable. Headers give the short name, declaration line, `// name:` (upstream / INFERRED / published source / historical export), `// since:`, `// locals:`, and any CHANGELOG pairing with its confidence.
- `maps/` — generated indexes plus a few hand-maintained maps (table below). `maps/pipeline_report.json` is the authoritative record of a run (counts, every verdict, sha256 of each shipped and pretty bundle, toolchain): cite it, never copy its numbers into prose. `maps/symbols_<bundle>.json` is the authority for "where is symbol X"; `maps/xref_<bundle>.json` is the cross-reference index (callers, callees, env vars, log prefixes, RPC methods and event types, strings, inner closures as `outer>name`, the queue of unnamed code); query it through `tools/symbol_card.mjs`, not by grepping the bundle.
- `scenarios/` — runtime experiments: `run.sh` instruments `recon/daemon.recon.js` (`instrument.mjs`, enter/exit/fail per first-party function, `--inner` for closures), each `NN-*.sh` boots it in an isolated HOME on port 20300+NN via `lib.sh`, drives it over the socket and read-only TCP port, and `trace_report.mjs` writes the call tree per step to `.build/scenarios/<name>/report.md`. Conclusions are committed in `scenarios/findings/<name>.md`. The default auth source reaches no model.
- `tools/` — the Babel-based pipeline (`rebuild.sh`, `bump.sh`, and the `.mjs` tools listed under "Tool reference").
- `.claude/workflows/upgrade-docs.js` — the saved multi-agent workflow for bump step 3b (the `upgrade-docs` skill wraps it); `bump.sh` prints its args.

Hand-maintained maps. Everything else in `maps/` is generated and enters the repo only through `PROMOTE=1`. Write these with the tool named, not by hand (except `modules_`):

| Map | What it holds | Written by |
|---|---|---|
| `modules_<bundle>.json` | per esbuild `__export` block (= one source module): first-party or vendored, by marker export names | hand, one decision per new upstream module |
| `inferred_<bundle>.json` | our names for unnamed code (functions, `init<Name>Module` initialisers, UPPER_SNAKE constants), **keyed by mangled name**, so every release needs `bump.sh` | `name_symbol.mjs`, `confirm_reanchor.mjs --write` mid-bump |
| `inferred_<bundle>.shape.json` | the reviewed shape of each inferred name, compared at every rebuild | `verify_inferred.mjs record` after review |
| `inferred_<bundle>.asserted.json` | names registered with `--allow-unproven`; never evidence for a later registration | `name_symbol.mjs` |
| `published_daemon.json` | inferred names confirmed as upstream's spelling from `@openduo/protocol`'s TypeScript source | `name_symbol.mjs --published` |
| `historical_daemon.json` | inferred names confirmed as upstream's spelling from an older release's `__export` block | `name_symbol.mjs --historical` |
| `subsys_daemon.json` | the `NN-` directory of each renamed daemon symbol; must cover exactly the rename map or the build stops | `name_symbol.mjs` |
| `locals_daemon.json` | LLM-proposed names for locals the rules cannot derive, keyed by real name + `ctx` hash + `occ`; a stale ctx gives `localNames=warn` | `name_locals.mjs tasks` → `record` (or `prune`, `rekey`); use sonnet or better for the naming pass |
| `history_daemon.json` | per symbol `firstSeen`, `changedIn`, `untraceable` across every npm release | `tools/history.sh --write` (not part of `rebuild.sh`) |
| `changelog_daemon.json` | upstream CHANGELOG entries paired with the symbols they describe, with confidence; a reading, not a proof | `changelog_merge.mjs`; a bump writes only the new release's pairing file and merges with `--keep maps/changelog_daemon.json` (`.build` does not outlive a session) |
| `bare_anchor_baseline.json` | per-doc ceilings on legacy line numbers; may only fall | `check_bare_anchors.mjs --write-baseline` |
| `doc_acks.json` | per paragraph with citations: doc, `## ` section, normalised-text hash, cited symbols; per cited symbol a declaration profile (token-stream hash with identifiers as `_`, arity, named callees and the number of distinct unnamed ones, string-literal hash); the version it was read against. `impact_report.mjs` reads it (tier 4 → 3 when every cited declaration is unchanged) | `doc_acks.mjs record`, after the docs pass every check (last step of a bump, or after a doc edit) |

The cli has `inferred_cli.*` but no first-party tree, so no subsystem or locals map.

## Check whether upstream has anything new (run this first)

A sync check against **unfetched** refs compares against the past. In an ephemeral container or a scheduled run, `origin/main` on disk can be many commits stale and still look self-consistent, and the local branch can lag `origin/main` too. Fetch first, always:

```bash
git remote get-url upstream >/dev/null 2>&1 || git remote add upstream https://github.com/openduo/duoduo.git
git fetch --all --prune --tags
git status -sb | head -1                        # 0) is the local branch behind origin? fast-forward before working
cat docs/.pretty-anchor-target                  # 1) version this repo last reconstructed to
git describe --tags --abbrev=0 upstream/main    # 2) latest upstream release tag
npm view @openduo/duoduo version                # 3) latest published runtime (the thing reconstructed)
git merge-base --is-ancestor upstream/main origin/main   # 4) has upstream fully landed in main?
git log origin/main..upstream/main --oneline    # 4b) if (4) is false: exactly what is missing
```

**Decision rule**: (4) true **and** the three version strings agree ⇒ nothing to do; stop and say so. Any disagreement ⇒ the delta is real: merge, bump the reconstruction, update `docs/`. (4) answers "is there new upstream work"; (2)/(3) answer "which version to retarget to". A tag can lag the branch tip, so a matching tag never replaces the ancestry check.

**"Did this work already land?" is answered by ancestry, never by PR metadata.** A PR shows `merged:false, state:closed` whenever its content reached the base by a direct push or local merge, which is normal here. Only `git merge-base --is-ancestor <commit> origin/main` against a freshly fetched ref settles it. A report sent out of band (push notification, issue, PR comment) may contain only claims verified in that same run against fresh refs.

## Core discipline: the reconstruction must stay *provably equivalent*

The reconstruction is a chain of **semantics-preserving** transforms (beautify → byte-lossless de-bundle → scope-safe rename), never a hand-rewrite. **Never hand-edit `recon/`, `first-party/` or the generated `maps/`**: they are compared with what the pipeline generates, and any edit that breaks AST equivalence voids the "runs identically" guarantee. Real names come from esbuild's `__export` helper and are authoritative; inferred names are flagged in `RENAME_TABLE.md`, and an imprecise one never affects behaviour because renaming is scope-safe.

The gates `rebuild.sh` runs, each a verdict in `pipeline_report.json`:

- **Lossless split** (`<bundle>.lossless`): the split module files concatenate back to the beautified bundle byte for byte. Segment file names are case-insensitively unique, because minified names differ only by case and macOS/Windows would overwrite.
- **Beautify fidelity** (`<bundle>.beautifyEquivalent`): shipped minified bundle and `*.pretty.js` have identical ASTs. Needs `PKG`; without it the verdict is `skipped`.
- **Inferred names** (`<bundle>.inferredNames`): `verify_inferred.mjs check`, the only gate that catches a mis-anchored inferred name: right kind of code, right spelling for the kind, shape unchanged, no other recorded shape fitting better. Exit 0 pass, 1 fail, 3 warn (shape changed: re-read the body, then `record`).
- **Local names** (`daemon.localNames`): `warn` when a `locals_daemon.json` entry no longer matches its code.
- **Syntax and rename equivalence** (`<bundle>.syntax`, `<bundle>.astEquivalent`): identical ASTs modulo the rename map, identifiers compared by resolved binding; only mapped top-level bindings and the locals listed in `$OUT/locals_daemon.applied.json` may change name.
- **Committed = generated** (`committedInSync`, `anchorTargetMatches`): committed `recon/`, `maps/`, `first-party/` equal the generated ones for the version the committed report claims, that report is itself promotable, and `docs/.pretty-anchor-target` names the same release. A run for another version records `retarget-pending`; a run without `PKG`/`PKG_VERSION` or with `MAPS` records `unverified`.
- **First-party tree** (`firstPartyTree`, `verify_first_party.mjs`): every file is exactly its symbol's whole declaration, its header agrees with the maps, and the file set equals the renamed symbols in their subsystem directories. Nothing else checks this tree.
- **Citations and anchors** (`citations`, `lineAnchors`, `anchorCheckers`): see "Writing / editing the analysis docs". `anchorCheckers` is a mutation test that the checkers catch injected errors.
- **Appendix sets** (`appendixSets`, `check_appendix_sets.mjs`): the three enumerations of INTERNALS Appendix B (event types written through `createSpineEvent`, RPC methods `createDaemon`'s dispatcher recognises, the read-only TCP allowlist) equal the sets derived from the bundle; six mutants of the doc (a name added, removed, swapped) must each fail.

`PROMOTE=1` is the only way generated artifacts enter the repo, and it writes only a run in which **every** proof verdict is exactly `pass` (`skipped`, `warn`, `fail`, or a gate that never ran are all refused) and both hashes exist for every bundle. It is refused before anything is written unless `PKG` points at `dist/release` inside an installed `@openduo/duoduo` (version from its `package.json`, a release `vX.Y.Z`), `BEAUTIFIED` and `MAPS` are unset, and `docs/.pretty-anchor-target` already names that version.

## CI (`.github/workflows/verify.yml`)

On every PR and push to `main`: on the Node major in the repo-root `.nvmrc`, install the npm release that `maps/pipeline_report.json` records (not the latest) and run the full `rebuild.sh` with `PKG`, so every gate can fail a PR. `warn` and `skipped` do not fail the job (only `PROMOTE=1` refuses them); the run summary shows every verdict as a table and the `pipeline-report` artifact holds `pipeline_report.json` and `verdicts.txt`, so read the summary on a green run too. CI commits nothing; fix failures in a session.

## Commands

```bash
# 0) tooling, on the Node major in .nvmrc (rebuild.sh warns on another major)
cd reconstruction/tools && npm ci             # @babel/{parser,traverse,types} + pinned js-beautify

# 1) a SCRATCH install of the release the committed report records (the one CI installs).
#    Never point PKG at the global install: the runtime section copies files into $PKG,
#    and the global install is the one the live daemon runs from.
V="$(node -p 'require("../maps/pipeline_report.json").package.slice(1)')"
npm install --prefix /tmp/duoduo-pkg "@openduo/duoduo@$V"
PKG="/tmp/duoduo-pkg/node_modules/@openduo/duoduo/dist/release"

# 2) the full pipeline (about two minutes; writes only $OUT = reconstruction/.build).
#    Its last line before DONE/FAILED counts passed verdicts and names each that did not.
PKG="$PKG" bash rebuild.sh
JOBS=1 PKG="$PKG" bash rebuild.sh             # bundles and mutation checkers one at a time, to bisect a failure
PROMOTE=1 PKG="$PKG" bash rebuild.sh          # write the results into recon/, maps/, first-party/

# 3) after a doc edit: only the citation and anchor checks, against $OUT's index (seconds).
#    $OUT must index the release the docs claim; check_docs.sh refuses a mismatched bundle.
bash check_docs.sh [doc.md...]                # no args: docs/*.md, reconstruction/*.md, CLAUDE.md
```

Development overrides, both refused by `PROMOTE=1`: `BEAUTIFIED=<dir of *.pretty.js>` skips beautifying (and, without `PKG`, the fidelity proof); `MAPS=<dir>` reads the hand-maintained maps from a copy, to try a naming end to end (`name_symbol.mjs --maps <dir>`) without touching the repo. The beautifier is pinned in `tools/package.json` because every line number in `maps/`, `first-party/` and the docs is its output; a hand-given `BEAUTIFIED` may come from any formatter.

**Only bundles with a first-party export table are worth running**, currently `daemon` and `cli`. `stdio` has only entry exports, `feishu-gateway` one export block, and every export block of `pi-worker` and `channel-acp` is vendored zod; renaming nothing and proving the nothing equivalent is not evidence. Naming those needs the hand route (`locate_by_anchor.mjs` → `maps/inferred_<bundle>.json`); `bump.sh` covers their changes with a literal delta only.

**The module gate fails loudly on a bump, by design.** esbuild emits an `__export` block only for a module whose export object is needed at run time, and a block is always exactly one module. `build_rename.mjs` matches each block to a `maps/modules_<bundle>.json` record (`min(2, markers)` marker names present; highest share wins, then closest size). A block matching no record, or a first-party and a vendor record equally, stops the build: decide it in `modules_<bundle>.json`, using the evidence `bump.sh` prints from `module_owner_hint.mjs` (installed packages exporting the block's names; first-party bindings it refers to). This replaced a per-name keyword allowlist that silently dropped first-party symbols (the Grok module exports only `GROK_ACP_*` constants; `pi` matches `pipeline` and `api`).

## On a version bump, run `bump.sh` before `rebuild.sh`

`maps/inferred_<bundle>.json` is keyed by mangled names, and esbuild re-mangles every identifier on every build. Running `rebuild.sh` straight at a new release puts inferred names on the wrong declarations while every downstream gate still passes (at v0.8.1 → v0.8.2: 21 of 31). Run from `reconstruction/`; `bump.sh` prints every step with paths filled in, and `reconstruction/README.md` §跟随上游升级 explains each output and how well each tool did on past bumps.

```bash
# Scratch-install both releases; PKG_OLD must be the release maps/ describes.
# Writes only .build/bump. Read .build/bump/impact.md first, then reanchor_<bundle>.md.
PKG_OLD=<old dist/release> PKG_NEW=<new dist/release> bash tools/bump.sh
# 0. carry the RE-ANCHOR names: those confirmed by literal witnesses, plus each one you
#    accept after reading both bodies (bump.sh prints the full command per bundle)
node tools/confirm_reanchor.mjs --impact .build/bump/impact.json --bundle daemon \
  --proposed .build/bump/inferred_daemon.proposed.json --write .build/bump/inferred_daemon.json \
  [--accept <oldShort>[=<newShort>]]... .build/bump/pretty_old/daemon.pretty.js .build/bump/pretty_new/daemon.pretty.js
#    Review .build/bump/inferred_<bundle>.json (proposals in *.proposed.json: read each body),
#    run verify_inferred.mjs check on NEW against the OLD shape baseline and settle every
#    finding, add every name listed under "need a subsystem" to maps/subsys_daemon.json,
#    decide any module-gate failure in maps/modules_<bundle>.json. Copy LAST:
cp .build/bump/inferred_daemon.json maps/inferred_daemon.json   # (and inferred_cli.json)
#    From here maps/ is keyed by NEW; bump.sh refuses to rerun until maps/ is restored from origin/main.
# 1. record the reviewed shapes
PKG_VERSION=v<new> node tools/verify_inferred.mjs record \
  .build/bump/pretty_new/daemon.pretty.js maps/inferred_daemon.json maps/inferred_daemon.shape.json
# 2. check-mode run: produces the new index and pretty bundles. Expected here:
#    committedInSync=retarget-pending, failing firstPartyTree/citations/lineAnchors, and
#    daemon.localNames=warn for locals in changed code -> name_locals.mjs tasks/record on
#    .build/daemon.recon.top.js + .build/rename_daemon.json, or prune, before step 4.
PKG=<new dist/release> bash tools/rebuild.sh
# 3. retarget the doc citations mechanically (order below)
# 3b. bring the release's substance into the docs: split per `## ` section, then run the
#     saved workflow upgrade-docs (args printed by bump.sh). Name new code with
#     name_toplevel.mjs tasks -> name_symbol.mjs --batch --build .build (dry-run first).
node tools/doc_sections.mjs split .build/bump/chunks ../docs/*.md ../CLAUDE.md
# 3c. after the last name_symbol.mjs, extend the release history from the step-2 run
bash tools/history.sh --build .build --write
# 4. promote once every check passes
PROMOTE=1 PKG=<new dist/release> bash tools/rebuild.sh
```

**Step 3 has one correct order, because the line step is one-shot.** For each bundle that changed, `retarget_docs.mjs collect --scope <bundle>` → `remap_doc_anchors.mjs`; then `retarget_docs.mjs apply --stamp v<new>` (not idempotent; it stamps `docs/.pretty-anchor-target` next to the first doc argument, so pass `docs/*.md` first; if no bundle changed, write the stamp by hand) → `retarget_symbols.mjs --bundle daemon maps/rename_daemon.json .build/rename_daemon.json` and the same with `--bundle cli` → `retarget_snippets.mjs --write` (with the `--old` arguments bump.sh prints) → `verify_citations.mjs --fix` (residue). Pass `CLAUDE.md` and `reconstruction/*.md` to the citation tools too. Pass `--bundle daemon=<pretty.js>` to `verify_citations.mjs`: without it every line check passes **vacuously**. `retarget_symbols.mjs` moves a `real (short)` pair only where one code span is exactly that pair and the old map pairs exactly those two names, and a prefixed pair (`cli:main (sot)`) only in the run for that bundle; it never rewrites a bare one-identifier span (it lists them for you to decide) or identifiers inside quoted code. Stale snippets are `retarget_snippets.mjs`'s job: it writes a rewrite only when the quoted code is in the new declaration (token for token, by unique pattern, by ordinal, or non-contiguously with at most `--gap` inserted tokens and an inserted-token ratio below `--auto`), prints a `PROPOSED` candidate without writing it between `--auto` and `--propose`, and lists the rest in its report for re-reading. `impact_report.mjs` reads `maps/doc_acks.json` (`--acks`): a whole-declaration citation of a `body-only` change (same parameter count, named callees and strings) goes to tier 3, and so does a tier-4 keyword hit on a paragraph whose every cited declaration is unchanged since its ack; a tier-1 snippet never moves. After the docs pass, `doc_acks.mjs record … --version v<new> docs/*.md CLAUDE.md` writes the new record (the upgrade-docs workflow's last integration step does this).

**The work of a bump should scale with what upstream changed, not with the size of the docs.** Step 3 only makes citations point at the right code again. For step 3b, `impact.md` lists every doc citation of a changed declaration by tier: 1 re-read (a snippet on a changed line or gone), 2 check, 2c `callee-changed` (cites an unchanged declaration whose direct callee changed; one call deep only, so cite the callee too), 3 skim (including `respelled` snippets left to `retarget_snippets.mjs`), and 4 `keyword` (paragraphs sharing a distinctive word with a change no doc cites). It drops nothing; the tier orders the reading. Per changed declaration, `diff_decls.mjs` writes a readable `.diff` with locals spelled `_` so esbuild's renaming does not show as change; `plaintext_delta.mjs` and `bundle_literals.mjs` (`.build/bump/literals/`) cover the package's non-bundle files, upstream's repo between tags, and the four bundles outside the pipeline.

## Tool reference

Run from `reconstruction/`. Every tool takes explicit paths and writes only its named outputs, except these, which change repository files by design: `name_symbol.mjs` (`maps/`), `name_locals.mjs record|prune|rekey` (`maps/locals_daemon.json`), `history.sh --write` (`maps/history_daemon.json`), `convert_line_citations.mjs --write`, `retarget_snippets.mjs --write`, `retarget_symbols.mjs` (unless `--dry-run`), `verify_citations.mjs --fix`, `retarget_docs.mjs apply` (the docs given; `--stamp` also `.pretty-anchor-target`), `check_bare_anchors.mjs --write-baseline` (pass all of `../docs/*.md`), `doc_sections.mjs join` (refuses a doc changed since the split).

```bash
# query (start here instead of grepping the bundle)
node tools/symbol_card.mjs [--maps <dir>] [--build <OUT>] [--docs <dir>] [--body] [--inner] <real|short|env:VAR|log:prefix|dotted:a.b|path:text|string:text|unnamed[:N]|uncited[:NN-dir]>...
node tools/doc_coverage.mjs [--maps <dir>] [--build <OUT>] [--docs <dir>] <out.md>   # uncited symbols per subsystem, symbols per doc section, naming queue
node tools/locate_by_anchor.mjs <pretty.js> <string...>          # top-level declaration (and kind) holding each literal's first occurrence
node tools/extract_decl.mjs --pkg <dist/release> <realName...>   # $PKG/daemon.harness.mjs: recon bundle exporting those names + prepare() (their module initialisers)

# naming
node tools/name_symbol.mjs [--bundle daemon|cli] [--maps <dir>] [--build <dir>] [--published <report.json>] [--dry-run] [--allow-unproven] <pretty.js> <short> <realName> <NN-subsystem|->
node tools/name_symbol.mjs [--bundle daemon|cli] [--maps <dir>] [--build <dir>] [--historical <report.json>] [--dry-run] <pretty.js> --batch <list.tsv|list.json>
node tools/name_toplevel.mjs tasks <pretty.js> <xref.json> <rename.json> maps/subsys_daemon.json <outdir> [--new <fp.json>] [--limit N]   # unnamed code used by named code; TSV for --batch
node tools/match_published_source.mjs --src <dir of *.ts> --package <name@version> [--rename <rename.json>] [--inferred <inferred.json>] [--pick <short>=<name>]... [--report <o.json>] <pretty.js>
node tools/match_historical_exports.mjs [--history <dir>] [--maps <dir>] --out <report.json>   # needs history.sh's .build/history
node tools/name_locals.mjs tasks <top.js> <rename.json> maps/locals_daemon.json maps/subsys_daemon.json <outdir> [--only NN-dir,...]
node tools/name_locals.mjs record|prune|rekey <top.js> <rename.json> maps/locals_daemon.json [answers.json...]
node tools/verify_inferred.mjs check|record <pretty.js> <inferred.json> <shape.json>   # exit 0 pass, 3 warn, 1 fail

# doc checks and conversions
node tools/verify_citations.mjs <symbols.json>[,...] [--bundle <name>=<pretty.js>]... <doc.md...> [--fix]
node tools/check_doc_anchors.mjs [--resolve] [--index <symbols.json>[,...]] [--bundle cli=<cli.pretty.js>] <daemon.pretty.js> <doc.md...>
node tools/check_bare_anchors.mjs [--index <symbols.json>[,...]] [--bundle cli=<cli.pretty.js>] \
     [--baseline maps/bare_anchor_baseline.json [--write-baseline]] [--list <o.json>] \
     <daemon.pretty.js> maps/blocks_daemon.json maps/modules_daemon.json <doc.md...>
node tools/convert_line_citations.mjs --index <symbols_daemon.json>[,<symbols_cli.json>] --bundle daemon=<pretty.js> [--bundle cli=<pretty.js>] [--write] [--report <o.json>] <doc.md...>
node tools/doc_sections.mjs split <dir> <doc.md...>   |   node tools/doc_sections.mjs join <dir> [--force]
node tools/check_appendix_sets.mjs --index <symbols_daemon.json> --xref <xref_daemon.json> --bundle <daemon.pretty.js> [--mutate] [--json <o.json>] <AGENT_INTERNALS_ANALYSIS.md>
node tools/doc_acks.mjs record <symbols.json>[,...] --bundle daemon=<pretty.js> [--bundle cli=<pretty.js>] --version v<X.Y.Z> [--out maps/doc_acks.json] <doc.md...>   # writes maps/doc_acks.json
node tools/doc_acks.mjs check <symbols.json>[,...] --bundle daemon=<pretty.js> [--bundle cli=<pretty.js>] [--rename <bundle>=<rename.json>] [--acks maps/doc_acks.json] [--json <o.json>] <doc.md...>
node tools/doc_acks.mjs briefs --impact <impact.json> [--units docs/X.md#N,...] [--diff-lines N] [--json <o.json>]   # per-citation diff + ack + stability, for the upgrade-docs verifier

# runtime experiments
PKG=<dist/release> bash scenarios/run.sh [NN-name ...]            # instrument once, run scenarios; outputs under $OUT/scenarios/
node tools/instrument.mjs <daemon.recon.js> <symbols_daemon.json> <out.js> [--all] [--inner]
node tools/trace_report.mjs <trace.jsonl> [--depth N] [--filter regex] [--out report.md] [--json o.json]

# replay a past bump against the committed record of both releases and score the automatic
# re-anchoring against the hand-reviewed maps of the new one (baseline: reconstruction/VERIFICATION.md §5.1);
# run all four pairs (v0.8.3..v0.8.7) before and after changing any bump tool
bash tools/replay_bump.sh <vOLD> <vNEW> [--out <dir>] [--fixture <dir>]   # writes .build/replay/runs/<vOLD>__<vNEW>/{bump,score.json,score.md}
node tools/replay_score.mjs --old-maps <dir> --new-maps <dir> --bump <bump OUT> [--old-label v] [--new-label v] [--json <o.json>] [--md <o.md>]

# bump internals (bump.sh runs these; run by hand to inspect one step)
node tools/confirm_reanchor.mjs --impact <impact.json> --bundle <daemon|cli> [--proposed <p.json>] [--md <o.md>] [--json <o.json>] [--write <bump inferred.json> [--accept <oldShort>[=<newShort>]]...] <old.pretty.js> <new.pretty.js>
node tools/anchor_candidates.mjs <old.pretty.js> <new.pretty.js> <fp.json> [--pairs <pairs.json>] <oldShort>[=<cand>,...]...
node tools/align_releases.mjs <old.pretty.js> <new.pretty.js> <out.json>
node tools/pair_releases.mjs <old.pretty.js> <new.pretty.js> <fp.json> <pairs.json> <out.json>
node tools/diff_decls.mjs <old.pretty.js> <new.pretty.js> <pairs.json> <outdir> [old_rename] [new_rename] [--fp <fp.json>] [--old-label v] [--new-label v]
node tools/impact_report.mjs --bump <bump OUT> [--old <dir>] [--new <dir>] [--maps <dir>] [--groups <K>] <doc.md...>
node tools/retarget_snippets.mjs --index <symbols.json>[,...] --bundle daemon=<pretty.js> [--bundle cli=<pretty.js>] [--fp <bundle>=<fp.json>]... [--rename <bundle>=<old.json>,<new.json>]... [--old <bundle>=<old pretty.js>,<old symbols.json>]... [--write] [--report <o.json>] <doc.md...>
node tools/plaintext_delta.mjs --out <dir> [--pkg <old pkg root> <new pkg root>] [--git <repo> <old tag> <new tag>]
node tools/bundle_literals.mjs --old <dist/release> --new <dist/release> --out <dir> <doc.md...>
node tools/module_owner_hint.mjs <unmatched.json> <pretty.js> <node_modules dir>...
bash tools/history.sh [--build <OUT>] [--write]                    # every npm release -> .build/history (network)
node tools/history_chain.mjs <history dir> <rename_daemon.json> <out.json> [--min 0.5] [--lead 0.1] [--slim]
node tools/changelog_merge.mjs <pairs dir> <rename_daemon.json> <out.json> [--keep <existing changelog_daemon.json>]   # releases with no pairing file keep their entries

# pipeline steps (rebuild.sh runs these)
node tools/split.mjs <pretty.js> <outdir>  ;  node tools/reassemble.mjs <splitdir> <out.js>
node tools/export_blocks.mjs <pretty.js> --json <o>
node tools/build_rename.mjs [--unmatched <o.json>] <blocks> <modules> <inferred> <out>
node tools/rename.mjs <pretty.js> <rename.json> <out.js> [report]
node tools/name_locals.mjs apply <top.js> <rename.json> maps/locals_daemon.json <out.js> <applied.json>
node tools/ast_equiv.mjs <original.js> <renamed.js> [rename.json] [--locals <applied.json>]   # no map: beautify fidelity
node tools/symbol_index.mjs <pretty.js> <rename.json> <out.json> [--version <v>]
node tools/xref.mjs <pretty.js> <rename.json> <out.json> [--version <v>]
```

## Running / verifying the actual runtime

The reconstructed daemon boots as a real daemon. To run it **without disturbing a live instance**, isolate `HOME` and use a non-default port. `HOME` is the one variable that moves all three places the daemon reads or keeps state (`resolveRuntimePaths`, `hostDotEnvPath`): runtime data `<home>/.aladuo`, kernel `<home>/aladuo`, and `~/.config/duoduo/.env` (read at boot). `ALADUO_RUNTIME_DIR`, `ALADUO_KERNEL_DIR` and `ALADUO_HOME` move the first two but not `.env`. `ALADUO_WORK_DIR` moves none of them: it is the default session working directory (attachments land in `inbox/`), defaulting to the daemon's cwd.

```bash
cp reconstruction/recon/daemon.recon.js "$PKG/"     # the scratch install, never the global one; it must sit in
cd "$PKG"                                           # dist/release: Node resolves @anthropic-ai/claude-agent-sdk and
                                                    # the daemon derives the package root (bootstrap/, bin/duoduo) from it
ISO=/tmp/iso && mkdir -p "$ISO" && chmod 700 "$ISO"   # keep it SHORT: boot is fatal if <HOME>/.aladuo/run/daemon.sock
                                                      # exceeds the 104-byte unix-socket limit
# ALADUO_BOOTSTRAP_DIR is the only way (besides ALADUO_META_PROMPT_PATH) that meta-prompt.md and the
# role texts roles/{main,member}.md reach the system prompt; neither is copied into the kernel
HOME="$ISO" ALADUO_PORT=20333 ALADUO_BOOTSTRAP_DIR="$PKG/../../bootstrap" \
  ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local ALADUO_LOG_LEVEL=info \
  node daemon.recon.js        # socket + read-only TCP + cadence + WAL; SIGTERM to stop

# READ-ONLY TCP surface (allowlisted methods; writes get -32601)
curl -s -H 'Content-Type: application/json' -XPOST 127.0.0.1:20333/rpc \
  -d '{"jsonrpc":"2.0","id":1,"method":"system.status","params":{}}'
# FULL control plane, on the unix socket
curl -s -H 'Content-Type: application/json' \
  --unix-socket "$ISO/.aladuo/run/daemon.sock" http://localhost/rpc \
  -XPOST -d '{"jsonrpc":"2.0","id":2,"method":"session.list","params":{}}'
```

Three things silently break this. Without `-H 'Content-Type: application/json'`, fastify answers `415` before JSON-RPC dispatch and the endpoint looks dead. `"$HOME/.aladuo/run/daemon.sock"` expands to your **real** home (the `HOME=` prefix applied only to `node`), so you probe the live daemon. The default log level is `warn`, so boot-time behaviour looks like dead code without `ALADUO_LOG_LEVEL=info`.

A claim that a few calls of one function settle needs no daemon: `extract_decl.mjs` writes a harness that exports those functions; import it, call `prepare()`, call them, and say in the doc that the claim was checked by executing them. A claim that only a running daemon settles goes to `reconstruction/scenarios/`: write a scenario, run it, record the finding in `scenarios/findings/`, then change the doc, saying it was measured on the reconstructed daemon of that release.

**HOME isolation does not isolate the CLI's daemon commands on macOS.** Never run `duoduo daemon start|stop|restart|uninstall` (or the `cli.recon.js` equivalents) under an isolated `HOME`: the CLI drives launchd through the per-user label `ai.openduo.daemon`, so it stops and replaces the machine's real daemon, and `daemon status` reports the real daemon's pid. This is upstream behaviour, not a reconstruction defect.

**Deploying the shipped runtime** (details: ARCHITECTURE §2, §5). Non-TTY onboarding needs only `ALADUO_CLAUDE_AUTH_SOURCE` (`claude_code_local`, which needs a prior `claude login`; `anthropic_api_key`, which needs `ANTHROPIC_API_KEY`; `compatible_endpoint`, which needs `ANTHROPIC_BASE_URL`, with `ANTHROPIC_AUTH_TOKEN` optional); without it and without a TTY, `onboard` exits 2. `DUODUO_ONBOARD_YES=1` skips confirmations. `ALADUO_RUNTIME_MODE` needs no setting (the daemon never reads it).

```bash
npm install -g @openduo/duoduo
export DUODUO_NODE_BIN="$(command -v node)" ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local DUODUO_ONBOARD_YES=1
duoduo onboard && duoduo daemon start && duoduo daemon status
```

The daemon is detached and **does not hot-reload**: run `duoduo daemon restart` after a config change. Keep the two persistence homes apart. `~/.config/duoduo/config.json` holds `authSource`; only the CLI reads it and applies it to the daemon's environment at each start or restart. `~/.config/duoduo/.env` holds credentials and other `ALADUO_*` keys; the daemon reads it at boot (`loadHostDotEnv`, fills only unset keys). `DUODUO_NODE_BIN` is read only by the `bin/duoduo` bash wrapper, before any JavaScript and without sourcing `.env`, so export it in the shell startup file or the process manager's environment; in `.env` it reaches only the sessions the daemon spawns.

## duoduo runtime architecture (what the docs describe)

duoduo keeps a large language model running unattended. Runtime code does the deterministic work the model cannot do itself (storage, ordering, scheduling, concurrency, measurement, validation); the model does the judgement (reasoning, writing, deciding what to remember and what to change). INTERNALS holds the evidence (section numbers below are its sections); these are the facts the rest of the docs build on:

- **Append before execute** (§5): every inbound event is appended to the event log (upstream "Spine", a WAL of UTC-dated files `~/.aladuo/var/events/YYYY-MM-DD.jsonl`) *before* a mailbox pointer is written or anything runs (an event for a `void` session gets no pointer and is copied to the outbox instead). An append is exactly two writes, the WAL line and then the `by_id` index line, and the pair is not a transaction. There is no `by_session` index; session-scoped retrieval goes through the mailbox `- [ ] @evt(<id>)` pointers. Dedup is a separate registry keyed only by the channel's idempotency key. The log is not the whole state: on restart the runtime rebuilds the set of sessions with pending work from the session directories and their mailbox pointers and reads event bodies back by id; session state, the dedup table and the outbox are not reconstructed from the log, tool results are logged only as their summary, and the consumer-offset files under `run/queue_offsets/` are written and never read. Entry points: `createSpineEvent` and `atomicAppendEvent` (the log), `appendBeforeExecuteGateway` (gateway ingest).
- **One actor per session key** (§8): each session key has at most one in-memory actor (`createSessionManager`). A process write-lock keeps one daemon per data directory, an async per-key mutex serialises each session's state changes, and a per-session drain lease file (`acquireSessionDrainLock`, under `run/locks/`) marks the session being drained. Channel and job sessions draw from two separate concurrency pools (10 and 6 slots by default); a channel actor returns its slot as soon as it goes idle and releases its engine process after the idle timeout (default 1 h). Since v0.8.7 at most one channel session is the main session: the one whose display name is `main` (`resolveMainSession`; two such sessions make it ambiguous and neither counts). Only `session.set_alias` sets or moves that name, and from inside a session only the current main may; deliveries with no better home (a job outcome whose owner cannot take it, a Notify to `main`) go to it (§8.6, §10).
- **Four engines plus `void`, no fallback** (§3): the config field `runtime` takes one of five values defined in one place (`initChannelProtocolModule`): the engines `claude`, `codex`, `grok`, `pi`, and `void`, which only a channel may set and which never runs a model (inbound messages go to the event log and the outbox, never the mailbox; model commands, wake and compact are refused). An unknown value is refused wherever it is written, never replaced by the default (`validateKnownRuntimeValue`, `validateRunnableRuntimeValue`, the latter also refusing `void` for jobs, partitions and the host default): an unknown or `void` `ALADUO_DEFAULT_RUNTIME` stops the daemon at boot (`resolveDefaultRuntime` throws), and a refused channel, job or partition value stops that session or partition when it would run (`runtime_refused`). The actor is bound to the requested engine first and probed second; an unavailable engine is refused at drain time (`runtime_unavailable`) and re-probed with the next message, and a session whose history belongs to another engine is refused (`runtime_mismatch`; `/clear` first). Process model, same-named commands, permissions and thinking output branch per engine. pi ships inside the npm package (`dist/release/pi-worker.js`, not covered by `reconstruction/`), needs no external CLI or login, is always listed as available, and is refused only when no model is configured for it.
- **Two injection points** (§2): `renderPromptLayers` joins six stable system-prompt layers in a fixed order (identity: `meta-prompt.md`, followed for channel sessions by `roles/main.md` for the main session or `roles/member.md` for every other; channel kind; channel instance; the memory board `memory/CLAUDE.md` (upstream "broadcast board"); runtime context; job mission), and `buildSystemPromptForChannelConfig` only decides whether to wrap them in the Claude Code preset. No layer depends on the clock, so while identity (including role), channel prompts, memory board and job mission stay the same, consecutive turns send an identical system prompt, which the engine's prompt cache needs. Per-turn information (time gap, restart notice, interruption, job receipts, board-updated hint) goes into transient blocks that `buildTransientUserBlocks` places before the user message. All four engines receive the same system-prompt text; Codex wraps it in one extra `<aladuo:system-context>` block.
- **Foreground sessions and background partitions** (§10–§12; upstream "Cortex" and "Subconscious"): channel and job sessions answer messages and run jobs; jobs have their own 60-second scanner. The heartbeat (cadence, default `2220000` ms = 37 min, `ALADUO_CADENCE_INTERVAL_MS`) runs four deterministic maintenance steps that never call a model (`runCadenceTick`, starting with the read-only memory check `runMemoryCheckTick`). The same tick goes to the partition scheduler, which runs nothing when the activity fingerprint is unchanged; otherwise it runs the next playlist partition not in cooldown or backoff, and a second one only when at most one session is active. Each partition run is a one-shot session with no saved history. The runtime's only deletion of memory files is a default-off orphan GC that `git rm`s stale orphan topic files (unreachable from the memory board, no inbound links, unmodified for 48 h), so each stays recoverable from git history. All changes to memory content are made by the model inside the partitions (§12.4 lists which partition writes what).
- **Two directories** (do not confuse them): `~/aladuo` is the kernel, a git repository of prompts, config and memory where every commit is a revert point; `~/.aladuo` is mutable runtime data (`var/` for the event log, sessions and jobs; `run/` for locks, the socket and process output). The control plane (§6) is JSON-RPC 2.0 on up to three listeners sharing one router: full control (state-changing methods, `/ws`) on the unix socket `<runDir>/daemon.sock` (mode 0600, parent 0700; filesystem permissions are the access control); `:20233/rpc` is **read-only** (an allowlist; everything else gets `-32601`) plus `/healthz`, `/dashboard`, `/readyz`. A third, bearer-token-gated remote TCP listener with full access opens only when `ALADUO_DAEMON_HOST`, `ALADUO_DAEMON_TOKEN` and `ALADUO_REMOTE_PORT` are all set, a loopback host included (`resolveRemoteListenerConfig`); a non-loopback host without the token, or a token without a remote port, is an error at daemon start.

## Writing / editing the analysis docs

**Cite code by name, never add a line number.** Every mechanism claim names the code that implements it and carries `confirmed` or `未证实推测`; never present an inference as fact. Line numbers move on every release (esbuild re-mangles, the formatter reflows); real names survive. New text uses exactly two citation forms, both checked by the build (shapes in `reconstruction/tools/anchor_forms.mjs`):

- `` `真名 (短名)` `` — one code span, no line, e.g. `atomicAppendEvent (rn)`. `verify_citations.mjs` checks every such pair anywhere (prose, tables, fences) over `docs/*.md`, `reconstruction/*.md` and this file, and fails when the short name is not that symbol's, or when a real-name-shaped name (lowerCamelCase with a hump, UPPER_SNAKE with an underscore, PascalCase with two humps; ≥ 8 characters) next to a 1–4 character short name is in no index. A pair means the daemon's symbol, else the cli's; a name both bundles have (currently only `main`) needs the prefix for the cli: `cli:main (sot)`. Only a span that is exactly the pair is moved on a bump; a pair in plain prose or a fence is checked but not moved. Do not write the `real/short` shorthand in new text (it reads like "a or b").
- `` `代码片段`（`真名`） `` — "this statement proves it", e.g. `` `stage: "runtime_mismatch"`（`drainSessionMailbox`） ``; cli symbols as `（`cli:真名`）`. `check_bare_anchors.mjs` (over `docs/*.md`) requires the snippet to appear in that symbol's current declaration as written, whitespace aside (`…` marks an ordered gap, `\|` in a table reads as `|`, a one-string snippet may be part of a longer string), including every short name it calls, every number, and every `NAME = <number>` clause as that exact token sequence. **Quote string literals and property names where you can**: they survive releases, while every quoted mangled identifier is refuted at the next bump.

**A bare short name (`` `jXe` ``) is never a citation**: nothing can check it, and the next release reuses it for unrelated code. **Local variable names are reading aids, not evidence**: rule-derived or LLM-proposed (`// locals:` in each first-party header); base a claim on property names, string literals, real names and call relations, and never quote a reconstructed local in a snippet (snippets are checked against the pretty bundle).

**Start from the card, not the bundle.** `node reconstruction/tools/symbol_card.mjs <name>` (add `--build reconstruction/.build` right after a check-mode run) prints callers, callees, env vars, log prefixes, RPC methods and event types, name origin, first release, the CHANGELOG entry, and which doc sections cite it. `env:ALADUO_X`, `dotted:session.notify`, `string:text` answer the reverse questions; `unnamed` lists what to name next, `uncited:<NN-dir>` what no doc covers.

**Code with no real name gets one before it is cited**: `node reconstruction/tools/name_symbol.mjs <daemon.pretty.js> <short> <realName> <NN-subsystem>` (`--batch list.tsv` for several, `--dry-run` to check). The committed `recon/daemon.recon.js` can stand in for the pretty bundle (same lines, same short names for unnamed code). For the cli add `--bundle cli`, pass `.build/beautified/v<version>/cli.pretty.js` with `--build reconstruction/.build`, and write `-` for the subsystem. The rules the tool enforces:

- Spelling by kind: function camelCase (a class may be PascalCase), module initialiser `init<Name>Module`, literal constant UPPER_SNAKE; ≥ 8 characters, unused anywhere. An uninitialised `var` is refused: name the initialiser that assigns it and cite the value through it, as in `` `dJ = 5, fJ = 180 * 1e3`（`initMailboxDrainRunnerModule`） `` with `initMailboxDrainRunnerModule (HS)`.
- Evidence: the code must refer to or be referred to by first-party code; any vendor evidence refuses. Prefer upstream's own spelling: `--published <match_published_source.mjs report>` (TypeScript source of `@openduo/protocol`, accepted on a `unique` or `ordered` match, and able to rename one of ours to upstream's on `conflict`) or `--historical <match_historical_exports.mjs report>` (an older release's export block). `--allow-unproven` only after reading the body; it is recorded in `inferred_daemon.asserted.json`. A rename carries the real-name-keyed entries in `locals_`, `history_` and `changelog_daemon.json` along.
- Reaching the repo: the tool writes `maps/inferred_*.json`, `subsys_daemon.json` and the shape entries; the name reaches `recon/`, `first-party/` and `symbols_daemon.json` only through `PROMOTE=1 PKG=… bash rebuild.sh`. Commit the maps and the promoted artifacts together, or `committedInSync` fails. With `--build reconstruction/.build` the tool also updates that run's rename map and index, so `check_docs.sh` can check the new citation at once; mid-bump, `--build` is required (with `.build/beautified/v<new>/daemon.pretty.js`), because `maps/symbols_daemon.json` still indexes the old release.
- Many at once (code a bump added): `name_toplevel.mjs tasks` lists unnamed declarations that named code uses (`--new <fp.json>` for this release's), with callers, strings, shared variables and body, plus a TSV for `--batch`; fill it in one naming pass, `--dry-run` it, and spot-check the thin bodies by hand before the real run.

**Line numbers are legacy and may only disappear.** The older forms `` `真名 (短名)`（`N`） `` (F1), `` `短名`（`N`） `` (F2, `check_doc_anchors.mjs --resolve`: the short name on line N, or line N inside its declaration; `cli.pretty.js:N` checks the cli) and `` `代码片段`（`N`） `` (F3) are checked while they exist; any other line number is unbound. `maps/bare_anchor_baseline.json` caps each doc's `lineNumbers` and holds `unbound` at 0, so adding any line number, even a correct F1, fails the build. Retire them with `convert_line_citations.mjs --write` (it reverts any rewrite the checkers refute and ranks the unnamed code whose naming would convert the most), then lower the ceilings in the same commit with `check_bare_anchors.mjs … --baseline maps/bare_anchor_baseline.json --write-baseline` over all of `docs/*.md` (`--allow-raise` is for a genuinely new doc only). When a claim's evidence cannot be re-found, drop the citation and, if nothing else supports the claim, downgrade it to `未证实推测`. Diagrams in fences carry no citations: cite in the prose below them.

**Style and structure** (the owner's rules; sessions without the owner's personal settings, such as scheduled routines, CI auto-fix and workflow agents, get them only from here):

- `docs/` and `reconstruction/*.md` are written in Chinese, with technical terms kept in English, conclusion-first (Pyramid Principle: central idea → MECE key sentences → answer-first sections). Reasoning goes in connected paragraphs; use a list only for a genuine enumeration, a comparison table or steps.
- Say things literally: no metaphor, personification, slogan or coined label in place of a plain statement; use the established technical term ("验证工具", not "核对机制").
- `docs/DUODUO_FRAMEWORK_GUIDE.md` carries no anchors and no short names: plain language, every term defined at first use. When upstream changes a mechanism, update its prose and Appendix D; never add citations to it.
- When a claim is corrected, update the doc **in place to the latest verified conclusion**: no errata, strikethroughs or revision-history appendices in `docs/`. Git history keeps the old wording.
- When a fact in "duoduo runtime architecture" above changes, update it here as well as in `docs/README.md` (the `upgrade-docs` workflow does this at step 3b).
