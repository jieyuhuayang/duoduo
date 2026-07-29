// Retarget the `<bundle>.pretty.js:LINE` anchors in docs/ to a new upstream release.
//
// The analysis docs anchor every mechanism claim to a line in the beautified
// bundle — that is what makes each claim re-checkable, and it is also what an
// upstream release invalidates wholesale. This tool rewrites the anchors using
// the maps produced by remap_doc_anchors.mjs (one per bundle).
//
// It only touches numbers in the two forms the docs actually use for anchors:
//   (a) a backticked span that is pure number soup, optionally prefixed by the
//       bundle name — `48090`, `30575/30913`, `daemon.pretty.js:48138-48162`
//   (b) a bare `<bundle>.pretty.js:` followed by numbers/separators, which is
//       how the evidence tables cite them
// Everything else is left alone, so port numbers (`:20233/rpc`), byte counts and
// intervals are never mistaken for line references.
//
// SCOPE MATTERS. The docs cite three different bundles, and a line number means
// nothing without knowing which. A bare `` `46112` `` in a sentence that opened
// with `stdio.pretty.js:46109` is an stdio line — feeding it the daemon map
// would silently relocate it into a different program. So each line's scope is
// taken from the last bundle named on that line (default: daemon), and a bundle
// with no supplied map is left untouched rather than guessed at.
//
// APPLY IS ONE-SHOT PER BUMP, and cannot be made idempotent: after a rewrite the
// docs hold NEW line numbers, and a new number that happens to also be an old
// key would be remapped a second time. Pass `--stamp <version>` and the tool
// records what the docs are targeting in docs/.pretty-anchor-target, then
// refuses to run again against the same target.
//
// Usage:
//   node retarget_docs.mjs collect [--scope <bundle>] <doc.md...>   > lines.txt
//   node retarget_docs.mjs apply [--stamp <ver>] <bundle>=<map.json>[,...] <doc.md...>
// e.g. node retarget_docs.mjs apply --stamp v0.6.2 daemon=daemon_map.json docs/*.md
// Unresolved lines are left untouched and reported — a stale anchor is visible,
// a wrong one is not.
import fs from "node:fs";
import path from "node:path";

const BUNDLES = ["daemon", "cli", "stdio"];
const MIN = 1000, MAX = 999999;

// inline code spans (single or double backtick) and fenced blocks
// double-backtick spans exist in these docs to quote text containing backticks
const CODE = /```[\s\S]*?```|``[^`\n]*(?:`[^`\n]*)*?``|`[^`\n]+`/g;
const NUM = /\b\d{4,6}\b/g;
const NUMBER_SOUP = /^(?:(?:daemon|cli|stdio)\.pretty\.js:)?[0-9][0-9\s,、\-/]*$/;
const BARE = /(?:daemon|cli|stdio)\.pretty\.js:[0-9][0-9\s,\-/]*/g;
const SCOPE_MENTION = /(daemon|cli|stdio)\.pretty\.js/g;

// Rewrite one line. `pick(bundle)` returns the substitution fn for that bundle,
// or null when that bundle has no map (leave everything alone).
function rewriteLine(line, pick) {
  // the line's default scope: the last bundle it names, else daemon
  let lineScope = "daemon";
  for (const m of line.matchAll(SCOPE_MENTION)) lineScope = m[1];

  const subst = (text, bundle) => {
    const fn = pick(bundle);
    if (!fn) return text;
    return text.replace(NUM, (n) => {
      const v = Number(n);
      if (v < MIN || v > MAX) return n;
      const r = fn(v);
      return r == null ? n : String(r);
    });
  };

  // pass 1: code spans. A span that names a bundle is scoped to it; a span that
  // is pure number soup inherits the line's scope; anything else is not an anchor.
  let out = line.replace(CODE, (span) => {
    const inner = span.replace(/^`+|`+$/g, "");
    const named = BUNDLES.find((b) => inner.startsWith(`${b}.pretty.js:`));
    if (named) return "`".repeat(span.length - span.trimStart().length || 1).slice(0, 0) + span.replace(inner, subst(inner, named));
    if (!NUMBER_SOUP.test(inner.trim())) return span;
    return span.replace(inner, subst(inner, lineScope));
  });

  // pass 2: bare `<bundle>.pretty.js:NNN` outside code spans (evidence tables).
  // Skip anything already inside a code span — pass 1 consumed those.
  const spans = [...out.matchAll(CODE)].map((m) => [m.index, m.index + m[0].length]);
  const inSpan = (i) => spans.some(([a, b]) => i >= a && i < b);
  out = out.replace(BARE, (m, off) => {
    if (inSpan(off)) return m;
    const bundle = BUNDLES.find((b) => m.startsWith(`${b}.pretty.js:`));
    const colon = m.indexOf(":") + 1;
    return m.slice(0, colon) + subst(m.slice(colon), bundle);
  });
  return out;
}

const MODE = process.argv[2];
if (MODE === "collect") {
  let args = process.argv.slice(3);
  let only = null;
  if (args[0] === "--scope") { only = args[1]; args = args.slice(2); }
  const seen = new Map(); // bundle -> Set
  for (const f of args) {
    for (const line of fs.readFileSync(f, "utf8").split("\n")) {
      rewriteLine(line, (bundle) => (n) => {
        if (!seen.has(bundle)) seen.set(bundle, new Set());
        seen.get(bundle).add(n);
        return null;
      });
    }
  }
  for (const [bundle, set] of seen) {
    if (only && bundle !== only) continue;
    if (!only) console.log(`# ${bundle} (${set.size})`);
    console.log([...set].sort((a, b) => a - b).join("\n"));
  }
  console.error([...seen].map(([b, s]) => `${b}=${s.size}`).join("  "));
  process.exit(0);
}

if (MODE !== "apply") {
  console.error("usage: node retarget_docs.mjs collect [--scope <bundle>] <doc.md...>\n" +
                "       node retarget_docs.mjs apply [--stamp <ver>] <bundle>=<map.json>[,...] <doc.md...>");
  process.exit(2);
}

let applyArgs = process.argv.slice(3);
let stamp = null;
if (applyArgs[0] === "--stamp") { stamp = applyArgs[1]; applyArgs = applyArgs.slice(2); }
const [mapSpec, ...docFiles] = applyArgs;

const maps = {};
for (const spec of (mapSpec || "").split(",").filter(Boolean)) {
  const i = spec.indexOf("=");
  const bundle = i < 0 ? "daemon" : spec.slice(0, i);
  const path = i < 0 ? spec : spec.slice(i + 1);
  if (!BUNDLES.includes(bundle)) { console.error(`unknown bundle "${bundle}"`); process.exit(2); }
  maps[bundle] = JSON.parse(fs.readFileSync(path, "utf8"));
}
if (!Object.keys(maps).length) { console.error("no maps given"); process.exit(2); }

const unresolved = new Map(), rewritten = new Map(), untouchedScope = new Set();
const pick = (bundle) => {
  const m = maps[bundle];
  if (!m) { untouchedScope.add(bundle); return null; }
  return (n) => {
    const e = m[String(n)];
    if (!e || e.new == null) { unresolved.set(`${bundle}:${n}`, (unresolved.get(`${bundle}:${n}`) || 0) + 1); return null; }
    rewritten.set(`${bundle}:${n}`, e.new);
    return e.new;
  };
};

// one-shot guard: line-number remapping is not idempotent
const stampFile = docFiles.length ? path.join(path.dirname(docFiles[0]), ".pretty-anchor-target") : null;
if (stamp && stampFile && fs.existsSync(stampFile)) {
  const current = fs.readFileSync(stampFile, "utf8").trim();
  if (current === stamp) {
    console.error(`refusing to run: ${stampFile} already says "${stamp}".`);
    console.error("These anchors are already retargeted. Re-running would remap them a second time");
    console.error("(a new line number that is also an old key gets moved again). Revert the docs first.");
    process.exit(1);
  }
  console.error(`retargeting anchors: ${current} -> ${stamp}`);
}

for (const f of docFiles) {
  const before = fs.readFileSync(f, "utf8");
  const after = before.split("\n").map((l) => rewriteLine(l, pick)).join("\n");
  if (after !== before) { fs.writeFileSync(f, after); console.error(`rewrote ${f}`); }
  else console.error(`unchanged ${f}`);
}
if (stamp && stampFile) fs.writeFileSync(stampFile, stamp + "\n");
console.error(`\n${rewritten.size} distinct anchors retargeted`);
if (untouchedScope.size) console.error(`left alone (no map supplied): ${[...untouchedScope].join(", ")}`);
if (unresolved.size) {
  console.error(`${unresolved.size} left untouched (no confident mapping) — re-anchor these by hand:`);
  for (const [k, c] of [...unresolved].sort()) console.error(`  ${k}  (${c} occurrence${c > 1 ? "s" : ""})`);
}
