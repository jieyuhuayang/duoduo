// Confirm (or refute) where each RE-ANCHOR inferred name moved, before it is
// written into the bump's inferred map.
//
// remap_inferred.mjs carries most inferred names by fingerprint; the ones whose
// body changed are RE-ANCHOR, and impact_report.mjs ranks a candidate for each
// (anchor_candidates.mjs). The step CLAUDE.md asks for next -- "pick a string
// literal unique to that function body and confirm it with locate_by_anchor" --
// was, at v0.8.6 -> v0.8.7, a throwaway script run over all 34 names at once.
// This is that script:
//
//   - every string literal (and cooked template chunk) of 6+ characters that
//     occurs in the OLD declaration and in no other old declaration is a
//     witness; it is looked up in NEW, and the declarations it lands in are
//     tallied. All witnesses that still exist landing in the candidate alone is
//     `confirmed`; a witness that lands only in another declaration is
//     `contradicted`; no witness at all is `read bodies` (both bodies are
//     printed, shortened, for the person who decides);
//   - the kinds must agree (verify_inferred.mjs' kinds: a function's name on a
//     function, a module initialiser's on a module initialiser, a constant's on
//     a constant). An old literal constant whose literal NEW assigns inside a
//     module initialiser is `constant moved into initialiser`: an uninitialised
//     var cannot carry an inferred name, so the entry is dropped and the value
//     is cited through that initialiser (CLI_DAEMON_TOKEN_ENV_KEY at v0.8.7);
//   - the parameter counts are printed, because verify_inferred.mjs check warns
//     on every change of them and the reader settles that warning here.
//
// Replayed on v0.8.6 -> v0.8.7: the witnesses confirm 20 of the 34 candidates,
// 13 have none (all 13 were confirmed by reading both bodies), the cli constant
// is reported as moved into an initialiser, none is contradicted, and --write
// with the 13 accepted gives the map that was reviewed by hand, entry for entry.
//
// Usage:
//   node confirm_reanchor.mjs --impact <impact.json> --bundle <daemon|cli>
//        [--proposed <inferred_<bundle>.proposed.json>] [--md <out.md>] [--json <out.json>]
//        [--write <bump's inferred_<bundle>.json> [--accept <oldShort>[=<newShort>]]...]
//        <old.pretty.js> <new.pretty.js>
// The candidate for each name is its proposal (remap_inferred.mjs) when there is
// one, else impact.json's top-ranked pick. --write adds every `confirmed` entry
// to the bump's inferred map, plus each --accept (a name the reader confirmed by
// the bodies; `=<newShort>` overrides the candidate), refusing a key or a real
// name already present. Nothing else is written; exit 0, or 1 on a refusal.
import fs from "node:fs";
import crypto from "node:crypto";
import { parse } from "@babel/parser";
import { topLevelDeclarations, isFunctionLike } from "./verify_inferred.mjs";

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const multi = (name) => { const out = []; for (let i; (i = argv.indexOf(name)) >= 0;) { out.push(argv[i + 1]); argv.splice(i, 2); } return out; };
const IMPACT = opt("--impact"), BUNDLE = opt("--bundle"), PROPOSED = opt("--proposed");
const MD = opt("--md"), JSON_OUT = opt("--json"), WRITE = opt("--write");
const ACCEPT = new Map(multi("--accept").map((a) => { const [o, n] = a.split("="); return [o, n]; }));
const [OLD, NEW] = argv;
if (!IMPACT || !BUNDLE || !OLD || !NEW) {
  console.error("usage: node confirm_reanchor.mjs --impact <impact.json> --bundle <daemon|cli> [--proposed <p.json>] [--md <o.md>] [--json <o.json>]\n" +
                "         [--write <inferred.json> [--accept <old>[=<new>]]...] <old.pretty.js> <new.pretty.js>");
  process.exit(2);
}

const MIN = 6;
function load(file) {
  const src = fs.readFileSync(file, "utf8");
  const ast = parse(src, { sourceType: "module", ranges: true });
  const kinds = topLevelDeclarations(ast);
  const tops = [];
  for (const s of ast.program.body) {
    if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) tops.push({ name: s.id.name, start: s.start, end: s.end });
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") tops.push({ name: d.id.name, start: d.start, end: d.end });
  }
  tops.sort((a, b) => a.start - b.start);
  const enclosing = (off) => {
    let lo = 0, hi = tops.length - 1, ans = null;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (tops[m].start <= off) { if (off <= tops[m].end) ans = tops[m]; lo = m + 1; } else hi = m - 1; }
    return ans?.name ?? null;
  };
  // literal -> Map(declaration -> occurrences)
  const lits = new Map();
  const stack = [ast.program];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== "object") continue;
    if (Array.isArray(n)) { for (const x of n) stack.push(x); continue; }
    let v = null;
    if (n.type === "StringLiteral") v = n.value;
    else if (n.type === "TemplateElement") v = n.value?.cooked ?? null;
    if (v !== null && v.length >= MIN) {
      const d = enclosing(n.start);
      if (d) { if (!lits.has(v)) lits.set(v, new Map()); const m = lits.get(v); m.set(d, (m.get(d) || 0) + 1); }
    }
    for (const k in n) { if (k === "loc" || k === "leadingComments" || k === "trailingComments" || k === "innerComments") continue; const c = n[k]; if (c && typeof c === "object") stack.push(c); }
  }
  const byName = new Map(tops.map((t) => [t.name, t]));
  return { src, kinds, lits, byName };
}

const nameableKind = (d) => !d ? "missing" : isFunctionLike(d) ? "function" : d.kind === "moduleInit" ? "module initialiser" : d.kind === "value" ? "literal constant" : d.kind;
const body = (B, name, lines = 14) => {
  const t = B.byName.get(name);
  if (!t) return "(not found)";
  const text = B.src.slice(t.start, t.end).split("\n");
  return text.slice(0, lines).map((l) => l.slice(0, 160)).join("\n") + (text.length > lines ? `\n… (${text.length} lines)` : "");
};

const impact = JSON.parse(fs.readFileSync(IMPACT, "utf8"));
const proposed = PROPOSED && fs.existsSync(PROPOSED) ? JSON.parse(fs.readFileSync(PROPOSED, "utf8")) : {};
const proposalOf = new Map(Object.entries(proposed).map(([n, v]) => [v.old, n]));
const entries = (impact.reanchor || []).filter((r) => r.bundle === BUNDLE);
if (!entries.length) { console.log(`confirm_reanchor: no RE-ANCHOR entries for ${BUNDLE}`); process.exit(0); }

const O = load(OLD), N = load(NEW);
const results = [];
for (const r of entries) {
  const cand = ACCEPT.get(r.oldShort) || proposalOf.get(r.oldShort) || r.ranking?.[0]?.name || null;
  const od = O.kinds.get(r.oldShort), nd = cand ? N.kinds.get(cand) : null;
  const res = { real: r.real, old: r.oldShort, candidate: cand, source: ACCEPT.get(r.oldShort) ? "accepted" : proposalOf.has(r.oldShort) ? "proposal" : "ranking",
                oldKind: nameableKind(od), newKind: nameableKind(nd), params: [od?.params ?? null, nd?.params ?? null] };
  // witnesses: literals that only the old declaration has
  const witnesses = [...O.lits].filter(([, m]) => m.size === 1 && m.has(r.oldShort)).map(([v]) => v);
  const tally = new Map();
  let gone = 0;
  for (const v of witnesses) {
    const m = N.lits.get(v);
    if (!m) { gone++; continue; }
    const key = [...m.keys()].sort().join("|");
    tally.set(key, (tally.get(key) || 0) + 1);
  }
  res.witnesses = witnesses.length; res.gone = gone;
  res.landing = [...tally].sort((a, b) => b[1] - a[1]).map(([k, c]) => ({ in: k, count: c }));
  const inCand = cand ? (tally.get(cand) || 0) : 0;
  const elsewhere = res.landing.filter((l) => l.in !== cand && !l.in.split("|").includes(cand));
  // a literal constant is its literal: the candidate must hold the same one
  if (od?.kind === "value" && nd?.kind === "value" && nd.canonical === od.canonical) res.verdict = "confirmed";
  else if (od?.kind === "value") {
    // where does NEW assign the old constant's literal?
    // the same hash verify_inferred.mjs gives a module initialiser's assigned literals
    const h = crypto.createHash("sha256").update(od.canonical).digest("hex").slice(0, 16);
    const holders = [...N.kinds].filter(([, d]) => d.kind === "moduleInit" && (d.values || []).includes(h));
    if (holders.length) { res.verdict = "constant moved into initialiser"; res.note = `assigned in ${holders.map(([n]) => n).join(", ")}: drop the name, cite the value through the initialiser`; }
    else { res.verdict = "contradicted"; res.note = `the candidate does not hold the literal ${od.canonical.slice(0, 40)}`; }
  }
  if (!res.verdict) {
    if (!cand || !nd) res.verdict = "no candidate";
    else if (res.oldKind !== res.newKind) res.verdict = "kind mismatch";
    else if (elsewhere.length && elsewhere[0].count > inCand) res.verdict = "contradicted";
    else if (inCand > 0 && !elsewhere.length) res.verdict = "confirmed";
    else if (inCand > 0) res.verdict = "mostly confirmed";
    else res.verdict = "read bodies";
  }
  if (ACCEPT.has(r.oldShort) && res.verdict !== "confirmed") res.accepted = true;
  results.push(res);
}

const counts = new Map();
for (const r of results) counts.set(r.verdict, (counts.get(r.verdict) || 0) + 1);
console.log(`confirm_reanchor ${BUNDLE}: ${results.length} RE-ANCHOR name(s): ` + [...counts].map(([k, v]) => `${v} ${k}`).join(", "));
for (const r of results) if (r.verdict !== "confirmed") console.log(`  ${r.verdict.padEnd(31)} ${r.real} (${r.old} -> ${r.candidate ?? "?"}, ${r.source})${r.note ? "  " + r.note : ""}`);

if (MD) {
  const L = [`# RE-ANCHOR confirmation (${BUNDLE})`, "",
    "Witnesses are string literals (6+ characters) that only the old declaration has; `landing` is where they are in NEW. " +
    "`confirmed`: every witness still present is in the candidate alone. `read bodies`: no witness; decide from the two bodies below, then pass `--accept <old>`.", "",
    "| name | old → candidate | source | verdict | witnesses (gone) | landing | kind | params |", "|---|---|---|---|---|---|---|---|"];
  for (const r of results) L.push(`| ${r.real} | \`${r.old}\` → \`${r.candidate ?? "?"}\` | ${r.source} | ${r.verdict}${r.note ? ": " + r.note : ""} | ${r.witnesses} (${r.gone}) | ${r.landing.slice(0, 3).map((l) => `\`${l.in}\`:${l.count}`).join(" ") || "-"} | ${r.oldKind === r.newKind ? r.oldKind : `${r.oldKind} → ${r.newKind}`} | ${r.params[0]} → ${r.params[1]} |`);
  for (const r of results.filter((x) => x.verdict !== "confirmed")) {
    L.push("", `## ${r.real}: ${r.verdict}`, "", "old:", "```js", body(O, r.old), "```", "new candidate:", "```js", r.candidate ? body(N, r.candidate) : "(none)", "```");
  }
  fs.writeFileSync(MD, L.join("\n") + "\n");
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(results, null, 2) + "\n");

if (WRITE) {
  const map = JSON.parse(fs.readFileSync(WRITE, "utf8"));
  const reals = new Set(Object.values(map));
  const add = results.filter((r) => r.candidate && (r.verdict === "confirmed" || ACCEPT.has(r.old)));
  const problems = [];
  for (const r of add) {
    if (map[r.candidate] && map[r.candidate] !== r.real) problems.push(`${r.real}: key ${r.candidate} already names ${map[r.candidate]}`);
    else if (reals.has(r.real) && map[r.candidate] !== r.real) problems.push(`${r.real}: already in the map under another key`);
  }
  if (problems.length) { console.error("REFUSED -- nothing written:\n  " + problems.join("\n  ")); process.exit(1); }
  for (const r of add) map[r.candidate] = r.real;
  fs.writeFileSync(WRITE, JSON.stringify(map, null, 2) + "\n");
  const left = results.filter((r) => !add.includes(r));
  console.log(`wrote ${add.length} entr${add.length === 1 ? "y" : "ies"} into ${WRITE}` + (left.length ? `; not written (${left.length}): ${left.map((r) => r.real).join(", ")}` : ""));
}
