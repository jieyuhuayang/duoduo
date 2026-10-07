// Retarget minified symbol names (`ZE`, `Vde`, `ple`, …) in docs/ across a bump.
//
// The docs cite runtime symbols in the form `realName (mangled)` and then use the
// short name inline. Real names are stable; short names are re-mangled on every
// esbuild run — v0.6.1 -> v0.6.2 moved 1445 of the daemon's ~1970 top-level
// declarations, 205 of which the analysis docs actually name.
//
// Three hazards, and what is done about each:
//
//  * CHAINS. The migration is full of pairs like `rle -> ple` and `ple -> kle`.
//    Sequential replacement would carry `rle` all the way to `kle`. Every
//    substitution is therefore applied in ONE pass over the text.
//  * LOCALS. The docs quote minified code — `[i,s,o,u,a,c]`, `t.permissionMode ??
//    …`, `e.readableName`. Those identifiers are function-local and have nothing
//    to do with the top-level migration; rewriting them would be pure corruption.
//    So substitution happens ONLY in symbol-reference positions: the
//    `realName (mangled)` form and the slash pair below. Quoted expressions
//    are never touched.
//  * ENGLISH. Short names like `am`, `nn`, `dc`, `cat`, `ps`, `no` -- and
//    `the`, which really is a symbol in this bundle -- collide with ordinary
//    words, shell commands and subcommand names, and those are routinely
//    quoted as a code span of their own. See BARE below.
//
// One more position is rewritten: the slash pair `real/short` (anchor_forms.mjs
// slashPair), a shorthand diagrams in the docs use, in and out of code spans
// and fences alike. verify_citations.mjs checks it as strictly as
// `real (short)`.
//
// BUNDLES. A pair names its real name, and a rename map belongs to one bundle.
// The daemon and the cli are mangled independently, so the same short name is
// routinely a symbol in both (`nU` is the daemon's resolveOutboxByIdIndexPath
// and the cli's jobHelp). Moving a pair because its SHORT name is in the
// migration would rewrite `jobHelp (nU)` to whatever the daemon's
// resolveOutboxByIdIndexPath is called next. So both pair forms are rewritten
// only on an identity: the OLD map given here pairs exactly that real name with
// exactly that short name (`drainSessionMailbox (KSe)` with KSe =
// drainSessionMailbox in the old map). A pair of another bundle never
// satisfies it and is left alone for verify_citations.mjs to report; the same
// identity keeps a slash pair safe inside quoted code, where `a / b` is
// division. It needs real names, i.e. the two-rename-map form: --migration
// carries only short names and leaves both pair forms alone.
//
// So the docs are retargeted by running the tool once per bundle, daemon maps
// then cli maps: each run moves only the pairs its old map vouches for. A
// pair written with a bundle prefix (`cli:main (dZe)`, needed for a real name
// both bundles have) is moved only by a run given that bundle with --bundle;
// without --bundle prefixed pairs are left alone.
//
// BARE. A code span that is exactly one identifier has no real name to check.
// Until v0.8.4 such spans were rewritten by whichever migration was given, and
// at v0.8.3 -> v0.8.4 that turned the spine subcommand `cat` into `ilt`, the
// command `ps` into `_s` and a historical example (`v0.8.3 reused \`AXe\``)
// into a different name: 5 of the 8 bare spans it moved were not citations at
// all, and every check passed, because nothing can check a bare span. So by
// default a bare span is never rewritten; each one whose identifier the
// migration moves is listed with its file and line, and a person decides
// (write the `真名 (短名)` pair if it is a citation, leave it if it is a
// word). --bare restores the old rewrite, for a --migration run over text
// known to hold only short names.
//
// Usage:
//   node retarget_symbols.mjs [--dry-run] [--bare] --migration <old2new.json> <doc.md...>
//   node retarget_symbols.mjs [--dry-run] [--bare] [--bundle daemon|cli] <old_rename.json> <new_rename.json> <doc.md...>
// The --migration form takes a plain {oldMangled: newMangled} map, e.g. built
// from fingerprint_match.mjs (covers every declaration, not just first-party).
// The two-rename-map form derives the migration from stable real names only.
import fs from "node:fs";
import { slashPair } from "./anchor_forms.mjs";

let args = process.argv.slice(2);
let DRY = false, BARE = false, BUNDLE = null;
for (;;) {
  if (args[0] === "--dry-run" || args[0] === "-n") DRY = true;
  else if (args[0] === "--bare") BARE = true;
  else if (args[0] === "--bundle" && /^(daemon|cli)$/.test(args[1] ?? "")) { BUNDLE = args[1]; args = args.slice(1); }
  else break;
  args = args.slice(1);
}

let migration = {}, dropped = [];
let oldMap = null; // old short name -> real name; two-rename-map form only
let files;
if (args[0] === "--migration") {
  migration = JSON.parse(fs.readFileSync(args[1], "utf8"));
  files = args.slice(2);
} else {
  const [OLDMAP, NEWMAP, ...rest] = args;
  if (!OLDMAP || !NEWMAP || !rest.length) {
    console.error("usage: node retarget_symbols.mjs [--dry-run] [--bare] --migration <old2new.json> <doc.md...>\n" +
                  "       node retarget_symbols.mjs [--dry-run] [--bare] [--bundle daemon|cli] <old_rename.json> <new_rename.json> <doc.md...>");
    process.exit(2);
  }
  files = rest;
  const invert = (m) => { const o = {}; for (const [k, v] of Object.entries(m)) if (!(v in o)) o[v] = k; return o; };
  oldMap = JSON.parse(fs.readFileSync(OLDMAP, "utf8"));
  const oldByReal = invert(oldMap);
  const newByReal = invert(JSON.parse(fs.readFileSync(NEWMAP, "utf8")));
  for (const [real, oldMangled] of Object.entries(oldByReal)) {
    const nm = newByReal[real];
    if (!nm) { dropped.push(real); continue; }
    if (nm !== oldMangled) migration[oldMangled] = nm;
  }
}
if (!files.length) { console.error("no input files"); process.exit(2); }
if (!Object.keys(migration).length) { console.error("no symbol drift"); process.exit(0); }

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
// `realName (mangled)` — the docs' citation convention, optionally `cli:`/`daemon:`-prefixed
const NAMED = /^(?:(daemon|cli):)?([A-Za-z_$][A-Za-z0-9_$]*)\s+\(([A-Za-z_$][A-Za-z0-9_$]*)\)$/;
// inline code spans (single or double backtick) and fenced blocks
const CODE = /```[\s\S]*?```|``[^`\n]*(?:`[^`\n]*)*?``|`[^`\n]+`/g;

const counts = new Map();
let spansSeen = 0, spansEligible = 0;

let slashSeen = 0, slashRewritten = 0, pairsForeign = 0;
const bareLeft = []; // BARE: spans a person has to decide, never rewritten by default

// The BUNDLES identity: does the old map pair this real name with this short
// name? Own-property lookup, so a short name like `constructor` is not found
// on Object.prototype.
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const pairedInOld = (real, short) => oldMap !== null && own(oldMap, short) && oldMap[short] === real;
const moveTo = (short) => own(migration, short) ? migration[short] : null;

// Every substitution is decided on the ORIGINAL text and then applied at once
// (the CHAINS hazard): code-span edits and slash-pair edits never overlap -- a
// span that is exactly an identifier or `real (short)` holds no slash.
function rewrite(text, file) {
  const sub = (name) => {
    const to = moveTo(name);
    if (!to) return name;
    counts.set(name, (counts.get(name) || 0) + 1);
    return to;
  };
  const edits = [];
  for (const m of text.matchAll(CODE)) {
    const span = m[0];
    spansSeen++;
    const ticks = span.startsWith("```") ? null : span.match(/^`+/)[0];
    if (!ticks) continue;                         // fenced block: quoted code, leave alone
    const inner = span.slice(ticks.length, span.length - ticks.length);
    const trimmed = inner.trim();

    let replaced = null;
    if (IDENT.test(trimmed)) {                                      // `ple`
      if (!BARE) {
        const to = moveTo(trimmed);
        if (to) bareLeft.push({ file, line: text.slice(0, m.index).split("\n").length, from: trimmed, to,
                                real: oldMap && own(oldMap, trimmed) ? oldMap[trimmed] : null });
        continue;
      }
      replaced = sub(trimmed);
    } else {
      const n = NAMED.exec(trimmed);                                // `drainSessionMailbox (Vde)`
      if (n) {
        const [, prefix, real, short] = n;
        // a prefixed pair belongs to the bundle it names: only that bundle's run moves it
        if (prefix && prefix !== BUNDLE) continue;
        // BUNDLES: only a pair the old map vouches for; any other pair,
        // e.g. a cli one under the daemon maps, stays exactly as written
        if (!pairedInOld(real, short)) { if (moveTo(short)) pairsForeign++; continue; }
        replaced = `${prefix ? prefix + ":" : ""}${real} (${sub(short)})`;
      }
    }
    if (replaced == null) continue;                // quoted expression — locals live here
    spansEligible++;
    const next = ticks + inner.replace(trimmed, replaced) + ticks;
    if (next !== span) edits.push({ start: m.index, end: m.index + span.length, text: next });
  }
  // real/short, anywhere (header): only an identity with the old map moves it
  if (oldMap) for (const m of text.matchAll(slashPair())) {
    const [, real, short] = m;
    if (!pairedInOld(real, short)) continue;
    slashSeen++;
    const to = moveTo(short);
    if (!to) continue;
    sub(short);
    slashRewritten++;
    const at = m.index + m[0].lastIndexOf(short);
    edits.push({ start: at, end: at + short.length, text: to });
  }
  let out = text;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}

for (const f of files) {
  const before = fs.readFileSync(f, "utf8");
  const after = rewrite(before, f);
  if (after === before) { console.error(`unchanged ${f}`); continue; }
  if (!DRY) fs.writeFileSync(f, after);
  console.error(`${DRY ? "would rewrite" : "rewrote"} ${f}`);
}

const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.error(`\n${total} substitutions across ${counts.size} distinct symbols` +
              ` (${spansEligible}/${spansSeen} code spans were symbol references;` +
              (oldMap ? ` ${slashRewritten}/${slashSeen} real/short pairs moved)` : " both pair forms need the two-rename-map form, left alone)"));
if (pairsForeign) console.error(`${pairsForeign} \`real (short)\` span(s) with a migrated short name left alone: ` +
  (oldMap ? "the old map does not pair that real name with that short name (another bundle's symbol, or already stale)"
          : "--migration carries no real names to check the pair against") +
  "; verify_citations.mjs reports any that are wrong");
for (const [k, n] of [...counts].sort((a, b) => b[1] - a[1])) console.error(`  ${k} -> ${migration[k]}  (${n}x)`);
if (dropped.length) console.error(`not present in the new build (left alone): ${dropped.join(", ")}`);
if (bareLeft.length) {
  console.error(`\n${bareLeft.length} code span(s) that are exactly one migrated identifier, left as written` +
                " (no real name to check; a word, a command or a citation alike). Rewrite a citation as" +
                " `真名 (新短名)`; leave the rest:");
  for (const b of bareLeft)
    console.error(`  ${b.file}:${b.line}  \`${b.from}\`${b.real ? ` (old map: ${b.real})` : ""} -> ${b.to}`);
}
