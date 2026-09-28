// Which statements in the docs a release delta touches, and what in the delta
// no doc covers yet.
//
// After bump.sh the question is no longer "is every claim still true" but
// "which claims rest on code that changed". The docs cite code by real name --
// `real (short)`, `snippet`（`real`）, or a backticked real name -- and
// diff_decls.mjs records, for every changed declaration, its real names on both
// sides and the pretty-bundle lines its readable diff changed. Joining the two
// puts every citation of a changed declaration in one of three tiers:
//
//   1 re-read  a name-bound snippet on a changed line (or at an insertion),
//              or one whose tokens the new version no longer has (in full or
//              at all)
//   2 check    a citation of the whole declaration whose paragraph shares a
//              distinctive token with the change (a string, a property, a name
//              on a changed line), or of a declaration short enough to re-read
//              whole (<= SHORT lines)
//   3 skim     a citation of a long declaration whose paragraph shares nothing
//              distinctive with the change, or a snippet in an unchanged part
//
// Nothing is dropped: every citation of a changed declaration is listed, and
// the tier only orders the reading. What no tier can see: a claim about an
// unchanged function whose callee changed (so cite the callee too), and a
// claim with no citation at all.
//
// Also reported: what no doc covers yet (declarations with no old
// counterpart; strings and properties the release added that no doc
// mentions), inferred names that lost their anchor, with the declaration the
// positional pairing suggests; the plain-text delta (plaintext_delta.mjs) with
// the doc lines that mention each file; and the affected doc sections (`## `
// headings) packed into at most --groups work packages, each section in exactly
// one -- the unit the upgrade workflow hands to one agent.
//
// Usage: node impact_report.mjs --bump <bump.sh OUT> [--old <dir>] [--new <dir>]
//          [--maps <maps dir>] [--old-label <v>] [--new-label <v>] [--groups <K>]
//          [--out <impact.json>] [--md <impact.md>] <doc.md...>
// --old/--new: the dirs holding each release's {daemon,cli}.pretty.js (default
// <bump>/pretty_old, <bump>/pretty_new, where bump.sh beautifies a PKG_*).
// --maps: the maps the OLD release was generated from (default ../maps), for
// the inferred names that were not carried across.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { namePair, nameBound, codeSpans, fencedRanges, snippetTokens, identRe, looksMangled } from "./anchor_forms.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(name); if (i < 0) return dflt; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const BUMP = opt("--bump");
const OLDD = opt("--old", BUMP && path.join(BUMP, "pretty_old"));
const NEWD = opt("--new", BUMP && path.join(BUMP, "pretty_new"));
const MAPS = opt("--maps", path.join(HERE, "../maps"));
const OLD_LABEL = opt("--old-label", "old"), NEW_LABEL = opt("--new-label", "new");
const K = Math.max(1, Number(opt("--groups", 4)));
const OUT = opt("--out", BUMP && path.join(BUMP, "impact.json"));
const MD = opt("--md", BUMP && path.join(BUMP, "impact.md"));
const DOCS = argv;
if (!BUMP || !DOCS.length) {
  console.error("usage: node impact_report.mjs --bump <dir> [--old <dir>] [--new <dir>] [--maps <dir>] [--old-label <v>] [--new-label <v>] [--groups <K>] [--out <json>] [--md <md>] <doc.md...>");
  process.exit(2);
}
// lines: how far from a changed line a snippet still counts as on it. 0: a
// hunk's range already spans the lines around a pure insertion, and one line of
// slack put unchanged neighbours of a change (the other handlers of an RPC
// switch) in tier 1
const NEAR = 0;
const SHORT = 150;  // lines: a declaration this short is re-read whole
const PLACES = 3;   // a snippet whose best match is on more lines than this has no one location
const rel = (p) => { const r = path.relative(ROOT, path.resolve(p)); return r.startsWith("..") ? path.resolve(p) : r; };
const clip = (s, n = 80) => { const one = s.replace(/\s+/g, " "); return one.length > n ? one.slice(0, n - 1) + "…" : one; };
const readJSON = (p, d) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : d);

// --- the changed declarations -------------------------------------------------
const changes = [];
for (const bundle of ["daemon", "cli"]) {
  for (const r of readJSON(path.join(BUMP, "diff", bundle, "_index.json"), [])) {
    const names = [...new Set([...r.realOld, ...(r.realByPairing || r.realNew)].filter(Boolean))];
    changes.push({ ...r, bundle, id: `${bundle}:${r.base}`, names, diffPath: r.diff?.file ? rel(path.join(BUMP, "diff", bundle, r.diff.file)) : null });
  }
}
if (!changes.length) console.error(`no declaration diffs under ${BUMP}/diff -- nothing changed, or bump.sh has not run`);
// "bundle:real" -> [{change, side, short, range}]
const byReal = new Map();
const note = (bundle, real, e) => { if (!real) return; const k = `${bundle}:${real}`; if (!byReal.has(k)) byReal.set(k, []); byReal.get(k).push(e); };
for (const c of changes) {
  c.oldNames.forEach((s, i) => note(c.bundle, c.realOld[i], { change: c, side: "old", short: s, range: c.oldRanges?.[s] }));
  c.newNames.forEach((s, i) => note(c.bundle, (c.realByPairing || c.realNew)[i], { change: c, side: "new", short: s, range: c.newRanges?.[s] }));
}
const resolve = (qual, real) => byReal.get(`${qual || "daemon"}:${real}`) || (!qual && byReal.get(`cli:${real}`)) || null;

const bundleLines = new Map();
const linesOf = (side, bundle) => {
  const k = side + ":" + bundle;
  if (!bundleLines.has(k)) {
    const p = path.join(side === "old" ? OLDD : NEWD, `${bundle}.pretty.js`);
    bundleLines.set(k, fs.existsSync(p) ? fs.readFileSync(p, "utf8").split("\n") : null);
  }
  return bundleLines.get(k);
};
const hunkRanges = (c, side) => (c.diff?.hunks || []).map((h) => h[side]);
const near = (lines, ranges) => lines.some((l) => ranges.some(([a, b]) => l >= a - NEAR && l <= b + NEAR));

// The tokens that can find a snippet in EITHER release: its string literals and
// identifiers longer than 3 characters. A short or mangled-looking identifier
// (`lyt`, `KSe`, `u0e`) is a short name, which esbuild re-assigns every build:
// the old release has it and the new one does not, so it would make every
// snippet that quotes a callee look weaker in the new version.
const locators = (code) => snippetTokens(code).filter((tk) => !/^[A-Za-z_$][\w$]*$/.test(tk) || (tk.length > 3 && !looksMangled(tk)));

// the lines of [a, b] holding the most of a snippet's locator tokens
function locate(code, lines, [a, b]) {
  const toks = locators(code);
  if (!toks.length || !lines) return null;
  const tests = toks.map((tk) => (/^[A-Za-z_$][\w$]*$/.test(tk) ? ((re) => (s) => re.test(s))(identRe(tk)) : (s) => s.includes(tk)));
  let best = 0, at = [];
  for (let l = a; l <= b; l++) {
    const s = lines[l - 1] ?? "";
    const n = tests.reduce((k, f) => k + (f(s) ? 1 : 0), 0);
    if (n > best) { best = n; at = [l]; } else if (n && n === best) at.push(l);
  }
  return { score: best, of: toks.length, lines: at };
}

// --- the docs -----------------------------------------------------------------
const WORD = /[A-Za-z_$][A-Za-z0-9_$]{2,}/g;
const docs = DOCS.map((p) => {
  const text = fs.readFileSync(p, "utf8");
  const lines = text.split("\n");
  const offs = []; { let o = 0; for (const l of lines) { offs.push(o); o += l.length + 1; } }
  const lineAt = (off) => { let lo = 0, hi = offs.length - 1, a = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (offs[m] <= off) { a = m; lo = m + 1; } else hi = m - 1; } return a + 1; };
  // headings and paragraphs, outside fences
  const inFence = new Array(lines.length).fill(false);
  for (const [a, b] of fencedRanges(text)) for (let l = lineAt(a); l <= lineAt(b); l++) inFence[l - 1] = true;
  const section = [], sub = [], titles = ["(preamble)"];
  let si = 0, ss = null;
  lines.forEach((l, i) => {
    if (!inFence[i] && /^## /.test(l)) { si = titles.length; titles.push(l.slice(3).trim()); ss = null; }
    else if (!inFence[i] && /^### /.test(l)) ss = l.slice(4).trim();
    section.push(si); sub.push(ss);
  });
  const block = (line) => { // a table row is its own paragraph
    const i = line - 1;
    if (/^\s*\|/.test(lines[i])) return [line, line];
    let a = i, b = i;
    const same = (j) => j >= 0 && j < lines.length && lines[j].trim() !== "" && inFence[j] === inFence[i] && !/^#{1,6} /.test(lines[j]);
    while (same(a - 1)) a--;
    while (same(b + 1)) b++;
    return [a + 1, b + 1];
  };
  return { path: p, rel: rel(p), text, lines, lineAt, section, sub, titles, block };
});

// how many paragraphs a word appears in, to tell a distinctive word from one
// every paragraph uses (runtime, session, model)
const df = new Map();
let paragraphs = 0;
for (const d of docs) {
  for (let l = 1; l <= d.lines.length; l++) {
    const [a] = d.block(l);
    if (a !== l || !d.lines[l - 1].trim()) continue;
    paragraphs++;
    const words = new Set(d.lines.slice(a - 1, d.block(l)[1]).join("\n").match(WORD) || []);
    for (const w of words) df.set(w, (df.get(w) || 0) + 1);
  }
}
const GENERIC = Math.max(15, Math.round(paragraphs * 0.02));
const distinctive = (w) => (df.get(w) || 0) <= GENERIC;

const citations = [];
for (const d of docs) {
  const covered = [];
  const inCovered = (i) => covered.some(([a, b]) => a <= i && i < b);
  const push = (m, form, qual, real, code) => {
    const hits = resolve(qual, real);
    if (!hits) return;
    const line = d.lineAt(m.index);
    citations.push({ doc: d.rel, line, section: d.section[line - 1], sectionTitle: d.titles[d.section[line - 1]], subsection: d.sub[line - 1],
      form, real: (qual ? qual + ":" : "") + real, code: code ?? null, hits, text: d.lines[line - 1].trim().slice(0, 240), d });
  };
  for (const m of d.text.matchAll(nameBound())) { covered.push([m.index, m.index + m[0].length]); push(m, "snippet", m[2], m[3], m[1]); }
  for (const m of d.text.matchAll(namePair())) {
    if (inCovered(m.index)) continue;
    covered.push([m.index, m.index + m[0].length]);
    const q = (d.text.slice(Math.max(0, m.index - 8), m.index).match(/(daemon|cli):`?$/) || [])[1];
    push(m, "pair", q, m[1], null);
  }
  for (const sp of codeSpans(d.text)) {
    if (inCovered(sp.start)) continue;
    const mm = sp.content.trim().match(/^(?:(daemon|cli):)?([A-Za-z_$][A-Za-z0-9_$]*)$/);
    if (mm) push({ index: sp.start }, "mention", mm[1], mm[2], null);
  }
}

// --- tiers --------------------------------------------------------------------
const changeTokens = (c) => new Set([...(c.changedTokens || []), ...c.strAdded, ...c.strRemoved, ...c.propAdded, ...c.propRemoved]);
for (const ct of citations) {
  const { d } = ct;
  const [pa, pb] = d.block(ct.line);
  const para = d.lines.slice(pa - 1, pb).join("\n");
  ct.paragraph = [pa, pb];
  const change = ct.hits[0].change;
  ct.change = change.id;
  // a snippet with no locator token (`if (a !== void 0 && !Ei(a))`) cannot be
  // found, so it is weighed as a citation of the whole declaration
  if (ct.form === "snippet" && locators(ct.code).length) {
    const found = ct.hits.map((h) => ({ h, loc: h.range ? locate(ct.code, linesOf(h.side, change.bundle), h.range) : null }));
    const o = found.find((f) => f.h.side === "old")?.loc, n = found.find((f) => f.h.side === "new")?.loc;
    // only the side(s) with the strongest match say where the snippet is: a
    // one-token match on dozens of old lines must not outvote an exact line
    const top = Math.max(0, ...found.map((f) => f.loc?.score || 0));
    const best = found.filter((f) => top && f.loc?.score === top);
    const onChanged = (sides) => sides.some((f) => near(f.loc.lines, hunkRanges(change, f.h.side)));
    const precise = best.filter((f) => f.loc.lines.length <= PLACES);
    if (best.length) ct.at = best.map((f) => ({ side: f.h.side, lines: f.loc.lines.slice(0, PLACES + 1), tokens: `${f.loc.score}/${f.loc.of}` }));
    if (!top) [ct.tier, ct.why] = [1, "snippet found in neither version"];
    else if (o?.score && (!n || n.score < o.score)) [ct.tier, ct.why] = [1, n?.score ? `the new version has ${n.score} of the ${o.score} tokens the old one had` : "snippet only in the old version"];
    else if (onChanged(precise)) [ct.tier, ct.why] = [1, "snippet on a changed line"];
    else if (onChanged(best)) [ct.tier, ct.why] = [2, `snippet matches ${Math.min(...best.map((f) => f.loc.lines.length))} places, one of them on a changed line`];
    else [ct.tier, ct.why] = [3, "snippet in an unchanged part"];
  } else {
    const own = new Set(change.names);
    const words = new Set([...(para.match(WORD) || []), ...[...para.matchAll(/"([^"\n]{2,})"/g)].map((m) => m[1])]);
    const shared = [...changeTokens(change)].filter((w) => words.has(w) && !own.has(w) && distinctive(w));
    const size = Math.max(...ct.hits.map((h) => (h.range ? h.range[1] - h.range[0] + 1 : 0)));
    if (shared.length) [ct.tier, ct.why] = [2, `paragraph shares ${shared.slice(0, 6).map((w) => "`" + w + "`").join(", ")} with the change`];
    else if (size <= SHORT) [ct.tier, ct.why] = [2, `whole declaration, ${size} lines`];
    else [ct.tier, ct.why] = [3, `whole declaration (${size} lines); paragraph shares nothing distinctive with the change`];
  }
}

// --- what no doc covers yet ---------------------------------------------------
const allText = docs.map((d) => d.text).join("\n");
const cited = new Set(citations.map((c) => c.change));
const uncoveredDecls = [], uncoveredLiterals = [];
const paired = Object.fromEntries(["daemon", "cli"].map((b) => [b, new Set(Object.values(readJSON(path.join(BUMP, `pairs_${b}.json`), { pairs: {} }).pairs))]));
for (const c of changes) {
  const fresh = c.newNames.filter((s, i) => !(c.realByPairing || c.realNew)[i] && !paired[c.bundle].has(s));
  if (fresh.length) uncoveredDecls.push({ change: c.id, bundle: c.bundle, names: fresh, diff: c.diffPath, kind: c.oldNames.length ? "new in a reshaped block" : "added" });
  const missing = (list) => list.filter((w) => w.length >= 3 && !(/^[A-Za-z_$][\w$]*$/.test(w) ? identRe(w).test(allText) : allText.includes(w)));
  const s = missing(c.strAdded), p = missing(c.propAdded);
  if (s.length || p.length) uncoveredLiterals.push({ change: c.id, real: c.names, diff: c.diffPath, strings: s, properties: p, cited: cited.has(c.id) });
}

// --- inferred names that lost their anchor ------------------------------------
const reanchor = [];
for (const bundle of ["daemon", "cli"]) {
  const oldInf = readJSON(path.join(MAPS, `inferred_${bundle}.json`), null);
  const carriedMap = readJSON(path.join(BUMP, `inferred_${bundle}.json`), null);
  // no carried map: the bundle was byte-identical (bump.sh skipped it), so
  // every name is where it was
  if (!oldInf || !carriedMap) continue;
  const carried = new Set(Object.values(carriedMap));
  const P = readJSON(path.join(BUMP, `pairs_${bundle}.json`), { pairs: {}, blocks: [] });
  for (const [short, real] of Object.entries(oldInf)) {
    if (carried.has(real)) continue;
    const block = (P.blocks || []).find((b) => b.oldNames.includes(short));
    reanchor.push({ bundle, real, oldShort: short, suggestion: P.pairs?.[short] ? [P.pairs[short]] : block ? block.newNames : [],
      basis: P.pairs?.[short] ? "positional pair" : block ? "the reshaped block it sat in" : "none" });
  }
}

// --- plain text ---------------------------------------------------------------
const GENERIC_FILES = /^(?:README\.md|SKILL\.md|CLAUDE\.md|package\.json|index\.\w+)$/;
const plaintext = readJSON(path.join(BUMP, "plaintext", "files.json"), []).map((f) => {
  const parts = f.path.split("/");
  const needles = new Set();
  if (parts.length > 1) needles.add(parts.slice(-2).join("/"));
  if (!GENERIC_FILES.test(parts.at(-1))) needles.add(parts.at(-1));
  if (parts[0] === "skills" && parts[1]) needles.add(parts[1]);
  // a whole path component: `runtime.md` is not a mention of `codex-runtime.md`
  const tests = [...needles].map((n) => new RegExp("(?<![A-Za-z0-9_.-])" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![A-Za-z0-9_-])"));
  const refs = [];
  for (const d of docs) d.lines.forEach((l, i) => { if (tests.some((re) => re.test(l))) refs.push({ doc: d.rel, line: i + 1 }); });
  return { ...f, diff: rel(path.join(BUMP, "plaintext", f.source === "package" ? "package.diff" : "upstream.diff")), docRefs: refs };
});

// --- work units and groups ----------------------------------------------------
const units = new Map();
for (const c of citations) {
  const key = `${c.doc}#${c.section}`;
  if (!units.has(key)) units.set(key, { key, doc: c.doc, section: c.section, title: c.sectionTitle, tiers: [0, 0, 0], changes: new Set(), weight: 0 });
  const u = units.get(key);
  u.tiers[c.tier - 1]++; u.changes.add(c.change); u.weight += [4, 2, 0.5][c.tier - 1];
}
const unitList = [...units.values()].sort((a, b) => b.weight - a.weight);
const total = unitList.reduce((s, u) => s + u.weight, 0);
const groups = Array.from({ length: Math.min(K, unitList.length) }, (_, i) => ({ id: `g${i + 1}`, units: [], changes: new Set(), weight: 0 }));
const cap = (total / Math.max(1, groups.length)) * 1.3;
for (const u of unitList) {
  const affinity = (g) => [...u.changes].filter((c) => g.changes.has(c)).length;
  const open = groups.filter((g) => g.weight + u.weight <= cap || !g.units.length);
  const pick = (open.length ? open : groups).sort((a, b) => affinity(b) - affinity(a) || a.weight - b.weight)[0];
  pick.units.push(u); u.changes.forEach((c) => pick.changes.add(c)); pick.weight += u.weight;
}

// --- output -------------------------------------------------------------------
const tierCount = (t) => citations.filter((c) => c.tier === t).length;
const report = {
  from: OLD_LABEL, to: NEW_LABEL,
  summary: {
    changedDeclarations: changes.length,
    changedLines: changes.reduce((s, c) => s + (c.diff?.changedLines || 0), 0),
    hunks: changes.reduce((s, c) => s + (c.diff?.hunks?.length || 0), 0),
    citations: { total: citations.length, reread: tierCount(1), check: tierCount(2), skim: tierCount(3) },
    uncoveredDeclarations: uncoveredDecls.length, reanchor: reanchor.length, plaintextFiles: plaintext.length,
  },
  changes: changes.map((c) => ({ id: c.id, bundle: c.bundle, real: c.names, oldNames: c.oldNames, newNames: c.newNames, diff: c.diffPath,
    changedLines: c.diff?.changedLines ?? null, hunks: c.diff?.hunks?.length ?? null, localOnly: c.localOnly,
    strAdded: c.strAdded, strRemoved: c.strRemoved, propAdded: c.propAdded, propRemoved: c.propRemoved,
    citations: citations.filter((x) => x.change === c.id).length })),
  citations: citations.map(({ d, hits, ...c }) => c),
  uncovered: { declarations: uncoveredDecls, literals: uncoveredLiterals },
  reanchor, plaintext,
  units: unitList.map((u) => ({ ...u, changes: [...u.changes] })),
  groups: groups.map((g) => ({ id: g.id, weight: Math.round(g.weight * 10) / 10, changes: [...g.changes],
    units: g.units.map((u) => ({ key: u.key, doc: u.doc, section: u.section, title: u.title, tiers: u.tiers })) })),
};
if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1) + "\n");

if (MD) {
  const L = [];
  const s = report.summary;
  L.push(`# Upgrade impact ${OLD_LABEL} -> ${NEW_LABEL}`, "");
  L.push(`${s.changedDeclarations} declaration diffs (a changed declaration, or a block of them), ${s.changedLines} changed lines in ${s.hunks} hunks (readable diffs, local-name churn removed). ` +
    `${s.citations.total} doc citations name changed code: ${s.citations.reread} to re-read, ${s.citations.check} to check, ${s.citations.skim} to skim. ` +
    `${plaintext.length} plain-text files changed.`, "");
  if (plaintext.length) {
    L.push("## Plain text (read first: it states intent)", "", "| source | file | change | mentioned in |", "|---|---|---|---|");
    for (const f of plaintext) L.push(`| ${f.source} | \`${f.path}\` | ${f.status} +${f.added}/-${f.removed} | ${f.docRefs.slice(0, 6).map((r) => `${r.doc}:${r.line}`).join(", ") || "-"}${f.docRefs.length > 6 ? ` (+${f.docRefs.length - 6})` : ""} |`);
    L.push("");
  }
  L.push("## Declaration diffs", "", "| declaration | diff | changed lines | added strings / properties | citations |", "|---|---|---|---|---|");
  for (const c of report.changes) L.push(`| ${c.real.join(", ") || c.newNames.join(", ")} (${c.bundle}) | \`${c.diff ?? "-"}\` | ${c.changedLines ?? "?"} in ${c.hunks ?? "?"} hunks${c.localOnly ? " (local names only)" : ""} | ${[...c.strAdded.map((x) => `"${clip(x, 60)}"`), ...c.propAdded].slice(0, 8).join(", ").replace(/\|/g, "\\|") || "-"} | ${c.citations} |`);
  L.push("");
  for (const [t, title] of [[1, "Re-read"], [2, "Check"], [3, "Skim"]]) {
    const list = report.citations.filter((c) => c.tier === t);
    L.push(`## Tier ${t}: ${title} (${list.length})`, "");
    for (const c of list) L.push(`- ${c.doc}:${c.line} [${c.sectionTitle}] \`${c.real}\` ${c.form}${c.code ? ` \`${c.code.slice(0, 60)}\`` : ""}: ${c.why}`);
    L.push("");
  }
  if (uncoveredDecls.length || uncoveredLiterals.length) {
    L.push("## Not covered by any doc yet", "");
    for (const u of uncoveredDecls) L.push(`- ${u.kind}: ${u.names.join(", ")} (${u.bundle}) \`${u.diff}\``);
    for (const u of uncoveredLiterals) L.push(`- ${u.real.join(", ") || u.change}: ${[...u.strings.map((x) => `"${clip(x)}"`), ...u.properties].join(", ")}${u.cited ? "" : " (declaration not cited either)"}`);
    L.push("");
  }
  if (reanchor.length) {
    L.push("## Inferred names to re-anchor", "", "Confirm each suggestion against the old body with locate_by_anchor.mjs before writing it into maps/.", "");
    for (const r of reanchor) L.push(`- ${r.real} (${r.bundle}, was \`${r.oldShort}\`): ${r.suggestion.length ? r.suggestion.map((x) => "`" + x + "`").join(" or ") + ` (${r.basis})` : "no suggestion"}`);
    L.push("");
  }
  L.push(`## Work groups (${report.groups.length})`, "");
  for (const g of report.groups) L.push(`- ${g.id} (weight ${g.weight}): ${g.units.map((u) => `${u.doc} § ${u.title} [${u.tiers.join("/")}]`).join("; ")}`);
  fs.writeFileSync(MD, L.join("\n") + "\n");
}
const s = report.summary;
console.error(`impact: ${s.changedDeclarations} declaration diffs (${s.changedLines} lines in ${s.hunks} hunks); ` +
  `${s.citations.total} citations of changed code -- tier 1 re-read ${s.citations.reread}, tier 2 check ${s.citations.check}, tier 3 skim ${s.citations.skim}; ` +
  `${uncoveredDecls.length} uncovered declaration sets, ${uncoveredLiterals.length} with undocumented literals, ${reanchor.length} to re-anchor, ${plaintext.length} plain-text files; ` +
  `${report.groups.length} work groups` + (OUT ? ` -> ${OUT}` : ""));
