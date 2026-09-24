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
//    So substitution happens ONLY in unambiguous symbol-reference positions: a
//    code span that is exactly an identifier, or the `realName (mangled)` form.
//    Quoted expressions are never touched.
//  * ENGLISH. Short names like `am`, `nn`, `dc` — and `the`, which really is a
//    symbol in this bundle — collide with ordinary words. The identifier-only
//    rule handles this too: prose is never a bare identifier span.
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
// A code span that is exactly one identifier has no real name to check, so it
// is rewritten by whichever migration is given. That is why the docs are told
// not to write bare short names.
//
// Usage:
//   node retarget_symbols.mjs [--dry-run] --migration <old2new.json> <doc.md...>
//   node retarget_symbols.mjs [--dry-run] <old_rename.json> <new_rename.json> <doc.md...>
// The --migration form takes a plain {oldMangled: newMangled} map, e.g. built
// from fingerprint_match.mjs (covers every declaration, not just first-party).
// The two-rename-map form derives the migration from stable real names only.
import fs from "node:fs";
import { slashPair } from "./anchor_forms.mjs";

let args = process.argv.slice(2);
const DRY = args[0] === "--dry-run" || args[0] === "-n";
if (DRY) args = args.slice(1);

let migration = {}, dropped = [];
let oldMap = null; // old short name -> real name; two-rename-map form only
let files;
if (args[0] === "--migration") {
  migration = JSON.parse(fs.readFileSync(args[1], "utf8"));
  files = args.slice(2);
} else {
  const [OLDMAP, NEWMAP, ...rest] = args;
  if (!OLDMAP || !NEWMAP || !rest.length) {
    console.error("usage: node retarget_symbols.mjs [--dry-run] --migration <old2new.json> <doc.md...>\n" +
                  "       node retarget_symbols.mjs [--dry-run] <old_rename.json> <new_rename.json> <doc.md...>");
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
// `realName (mangled)` — the docs' citation convention
const NAMED = /^([A-Za-z_$][A-Za-z0-9_$]*)\s+\(([A-Za-z_$][A-Za-z0-9_$]*)\)$/;
// inline code spans (single or double backtick) and fenced blocks
const CODE = /```[\s\S]*?```|``[^`\n]*(?:`[^`\n]*)*?``|`[^`\n]+`/g;

const counts = new Map();
let spansSeen = 0, spansEligible = 0;

let slashSeen = 0, slashRewritten = 0, pairsForeign = 0;

// The BUNDLES identity: does the old map pair this real name with this short
// name? Own-property lookup, so a short name like `constructor` is not found
// on Object.prototype.
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const pairedInOld = (real, short) => oldMap !== null && own(oldMap, short) && oldMap[short] === real;
const moveTo = (short) => own(migration, short) ? migration[short] : null;

// Every substitution is decided on the ORIGINAL text and then applied at once
// (the CHAINS hazard): code-span edits and slash-pair edits never overlap -- a
// span that is exactly an identifier or `real (short)` holds no slash.
function rewrite(text) {
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
    if (IDENT.test(trimmed)) replaced = sub(trimmed);              // `ple`
    else {
      const n = NAMED.exec(trimmed);                                // `drainSessionMailbox (Vde)`
      if (n) {
        // BUNDLES: only a pair the old map vouches for; any other pair,
        // e.g. a cli one under the daemon maps, stays exactly as written
        if (!pairedInOld(n[1], n[2])) { if (moveTo(n[2])) pairsForeign++; continue; }
        replaced = `${n[1]} (${sub(n[2])})`;
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
  const after = rewrite(before);
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
