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
// Usage:
//   node retarget_symbols.mjs [--dry-run] --migration <old2new.json> <doc.md...>
//   node retarget_symbols.mjs [--dry-run] <old_rename.json> <new_rename.json> <doc.md...>
// The --migration form takes a plain {oldMangled: newMangled} map, e.g. built
// from fingerprint_match.mjs (covers every declaration, not just first-party).
// The two-rename-map form derives the migration from stable real names only.
import fs from "node:fs";

let args = process.argv.slice(2);
const DRY = args[0] === "--dry-run" || args[0] === "-n";
if (DRY) args = args.slice(1);

let migration = {}, dropped = [];
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
  const oldByReal = invert(JSON.parse(fs.readFileSync(OLDMAP, "utf8")));
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

function rewrite(text) {
  return text.replace(CODE, (span) => {
    spansSeen++;
    const ticks = span.startsWith("```") ? null : span.match(/^`+/)[0];
    if (!ticks) return span;                      // fenced block: quoted code, leave alone
    const inner = span.slice(ticks.length, span.length - ticks.length);
    const trimmed = inner.trim();

    const sub = (name) => {
      const to = migration[name];
      if (!to) return name;
      counts.set(name, (counts.get(name) || 0) + 1);
      return to;
    };

    let replaced = null;
    if (IDENT.test(trimmed)) replaced = sub(trimmed);              // `ple`
    else {
      const m = NAMED.exec(trimmed);                                // `drainSessionMailbox (Vde)`
      if (m) replaced = `${m[1]} (${sub(m[2])})`;
    }
    if (replaced == null) return span;             // quoted expression — locals live here
    spansEligible++;
    return ticks + inner.replace(trimmed, replaced) + ticks;
  });
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
              ` (${spansEligible}/${spansSeen} code spans were symbol references)`);
for (const [k, n] of [...counts].sort((a, b) => b[1] - a[1])) console.error(`  ${k} -> ${migration[k]}  (${n}x)`);
if (dropped.length) console.error(`not present in the new build (left alone): ${dropped.join(", ")}`);
