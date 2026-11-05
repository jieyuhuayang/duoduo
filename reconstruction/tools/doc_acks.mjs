// Acknowledgements: which paragraph of the docs was last read against which
// version of the code it cites, so that a bump can tell "the code this
// paragraph rests on did not change" from "nobody has looked".
//
// After a bump, impact_report.mjs lists every citation of a changed
// declaration, and tier 4 lists every paragraph that shares a keyword with an
// uncited change. Both lists are built from the code alone; nothing records
// that a paragraph was already checked, so a paragraph whose cited code is
// identical to what it was read against is listed again on every release that
// touches a neighbouring word. docsync's answer to this is an acknowledgement
// bound to the sentence and to a hash of the code it refers to (research
// record §6): the ack holds while both are unchanged, and lapses when either
// moves. This tool keeps that record, maps/doc_acks.json, written only by it.
//
// What is recorded (`record`): for every paragraph of the given docs that
// carries at least one citation (`真名 (短名)`, `代码片段`（`真名`）, or a
// backticked real name; anchor_forms.mjs decides the shapes), its doc, its
// `## ` section title, a hash of its normalised text, and the symbols it
// cites. For every cited symbol, a profile of its current declaration:
//   - tokens: sha1 of the declaration's token stream with every identifier
//     that is not a member name or an object key spelled `_` (the same
//     normalisation align_releases.mjs aligns statements by, so esbuild's
//     re-mangling of locals and top-level names does not count as a change);
//   - arity: the parameter count of a function, null otherwise;
//   - callees: the real names of the top-level declarations it calls, and how
//     many unnamed ones;
//   - strings: sha1 of the sorted set of its string literals.
// The paragraph hash ignores what a bump rewrites mechanically: short names in
// `真名 (短名)` pairs, identifiers of 1-4 characters inside code spans (what
// retarget_snippets.mjs re-derives) and 4-6 digit line numbers. So the
// retargeted v(N+1) docs hash the same as the v(N) docs they were made from,
// and a hash that differs means a person edited the paragraph.
//
// What is reported (`check`, against a new bundle): for every current
// paragraph with citations, one verdict:
//   unchanged     every cited declaration's token hash equals the recorded one
//   body-only     some cited declaration's body changed, but its arity, its
//                 named callees and its string literals did not (the
//                 stability policy: a reordering, a renamed local, a changed
//                 condition on the same data; impact_report.mjs reads this as
//                 tier 3 unless a snippet sits on a changed line)
//   changed       a cited declaration changed in signature, callees or strings
//   edited        the paragraph's hash differs from the recorded one: the ack
//                 no longer applies, whatever the code did
//   missing       a cited symbol is not in the new bundle's names
//   no-ack        the paragraph (doc, section, cited set) was never recorded
// Exit 0 always: this is a report for impact_report.mjs and for a reader, not
// a gate. `--json` writes every verdict; the summary goes to stderr.
//
// A third command, `briefs`, serves the upgrade-docs workflow's verifier: from
// impact.json (whose citations carry `ack` and `stability` once
// impact_report.mjs has read this record) it lists, per citation of the given
// work units, the cited declaration's readable diff, the ack verdict and the
// stability, so the verifier judges one claim against one diff instead of a
// whole section against the writer's summary.
//
// Usage:
//   node doc_acks.mjs record <symbols.json[,...]> --bundle daemon=<pretty.js> [--bundle cli=<pretty.js>]
//        --version v<X.Y.Z> [--out maps/doc_acks.json] <doc.md...>
//   node doc_acks.mjs check <symbols.json[,...]> --bundle daemon=<pretty.js> [--bundle cli=<pretty.js>]
//        [--rename <bundle>=<rename.json>]... [--acks maps/doc_acks.json] [--json <o.json>] <doc.md...>
//   node doc_acks.mjs briefs --impact <impact.json> [--units docs/X.md#N,...] [--diff-lines N] [--json <o.json>]
// The symbols index may be replaced by a rename map (`rename_<bundle>.json`,
// mangled -> real) for a release that has no index yet (bump.sh's
// rename_<bundle>.new.json): the declaration spans are then read from the
// pretty bundle with @babel/parser, the way symbol_index.mjs reads them. Docs
// are recorded by their path relative to the repository root, so a record made
// on a copy of the docs (the replay fixture) applies to the committed ones.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import { nameBound, namePair, codeSpans, fencedRanges, looksRealName, isShortName } from "./anchor_forms.mjs";
import { tokenize } from "./retarget_snippets.mjs";
import { canonicalLiteral } from "./verify_inferred.mjs";
import { assertBundleMatchesIndex } from "./bundle_guard.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);
// a doc's key: its path relative to the repository root; a copy elsewhere (the
// replay fixture's <v>/docs/X.md) is keyed as docs/X.md too, so one record
// applies to both
export const relDoc = (p) => {
  const r = path.relative(ROOT, path.resolve(p)).split(path.sep).join("/");
  if (!r.startsWith("..")) return r;
  const m = path.resolve(p).split(path.sep).join("/").match(/\/(docs|reconstruction)\/([^/]+\.md)$/);
  return m ? `${m[1]}/${m[2]}` : path.basename(p);
};

// --- declaration spans and profiles --------------------------------------------
// mangled -> { line, endLine } for every top-level declaration, as
// symbol_index.mjs spans them (a var's line is its declarator's; its span ends
// with the statement, or with the declarator when its value is a literal)
export function declSpans(src) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const out = new Map();
  const put = (name, anchor, end) => { if (!out.has(name)) out.set(name, { line: anchor.loc.start.line, endLine: end.loc.end.line }); };
  for (const stmt of ast.program.body) {
    if ((stmt.type === "FunctionDeclaration" || stmt.type === "ClassDeclaration") && stmt.id) put(stmt.id.name, stmt.id, stmt);
    else if (stmt.type === "VariableDeclaration") for (const d of stmt.declarations) {
      if (d.id.type !== "Identifier") continue;
      put(d.id.name, d.id, d.init && canonicalLiteral(d.init) !== null ? d : stmt);
    }
  }
  return out;
}

const PARSE_OPTS = { tokens: true, errorRecovery: true, sourceType: "script", allowReturnOutsideFunction: true,
                     allowAwaitOutsideFunction: true, allowSuperOutsideMethod: true, allowNewTargetOutsideFunction: true };
const FALLBACK = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|[A-Za-z_$][A-Za-z0-9_$]*|\d[\w.]*|\S/g;

// The profile of one declaration's text. `topLevel`: mangled -> real (or null
// for an unnamed top-level declaration), to tell a callee from a local.
export function declProfile(span, topLevel) {
  let toks, ast = null;
  try {
    ast = parse(span, PARSE_OPTS);
    toks = [];
    for (const t of ast.tokens) {
      if (typeof t.type === "string" || t.end === t.start) continue;
      const label = t.type.label;
      toks.push({ text: span.slice(t.start, t.end), name: label === "name", string: label === "string" || label === "template" });
    }
  } catch {
    toks = [...span.matchAll(FALLBACK)].map((m) => ({ text: m[0], name: /^[A-Za-z_$][\w$]*$/.test(m[0]), string: /^["'`]/.test(m[0]) }));
  }
  const norm = [], strings = new Set(), callees = new Set();
  let unnamed = 0;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i], prev = toks[i - 1]?.text, next = toks[i + 1]?.text;
    if (t.string) { strings.add(t.text); norm.push(t.text); continue; }
    if (!t.name) { norm.push(t.text); continue; }
    const member = prev === "." || prev === "?.";
    const key = next === ":" && (prev === "{" || prev === ",");
    if (member || key) { norm.push(t.text); continue; }
    norm.push("_");
    if (next === "(" && topLevel && topLevel.has(t.text)) { const r = topLevel.get(t.text); if (r) callees.add(r); else unnamed++; }
  }
  let arity = null;
  if (ast) {
    const fn = (() => {
      for (const s of ast.program.body) {
        if (s.type === "FunctionDeclaration") return s;
        if (s.type === "ExpressionStatement" && s.expression.type === "AssignmentExpression" && /Function/.test(s.expression.right.type)) return s.expression.right;
        if (s.type === "ExpressionStatement" && /Function/.test(s.expression.type)) return s.expression;
      }
      return null;
    })();
    if (fn) arity = fn.params.length;
  }
  return {
    tokens: sha1(norm.join(" ")),
    arity,
    callees: [...callees].sort(),
    unnamedCallees: unnamed,
    strings: sha1([...strings].sort().join("\n")),
  };
}

// changed | body-only | unchanged, from two profiles. `shared`: the real
// names both releases know; a callee named on one side only (an inferred name
// not yet re-anchored, a name registered later) is folded into the unnamed
// count on that side, so the comparison does not depend on which side has
// more names.
export function compareProfiles(a, b, shared = null) {
  if (!a || !b) return "missing";
  if (a.tokens === b.tokens) return "unchanged";
  const fold = (p) => {
    if (!shared) return { named: p.callees, unnamed: p.unnamedCallees };
    const named = p.callees.filter((c) => shared.has(c));
    return { named, unnamed: p.unnamedCallees + (p.callees.length - named.length) };
  };
  const x = fold(a), y = fold(b);
  const same = a.arity === b.arity && a.strings === b.strings && x.unnamed === y.unnamed &&
    x.named.length === y.named.length && x.named.every((c, i) => c === y.named[i]);
  return same ? "body-only" : "changed";
}

// --- the docs --------------------------------------------------------------------
// paragraphs: [{ line, endLine, section, text }], outside and inside fences
// alike (a table row is its own paragraph)
export function docParagraphs(text) {
  const lines = text.split("\n");
  const offs = []; { let o = 0; for (const l of lines) { offs.push(o); o += l.length + 1; } }
  const inFence = new Array(lines.length).fill(false);
  const lineAt = (off) => { let lo = 0, hi = offs.length - 1, a = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (offs[m] <= off) { a = m; lo = m + 1; } else hi = m - 1; } return a; };
  for (const [a, b] of fencedRanges(text)) for (let l = lineAt(a); l <= lineAt(b) && l < lines.length; l++) inFence[l] = true;
  const out = [];
  let section = "(preamble)";
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!inFence[i] && /^## /.test(l)) { section = l.slice(3).trim(); continue; }
    if (!l.trim() || (!inFence[i] && /^#{1,6} /.test(l))) continue;
    if (/^\s*\|/.test(l)) { out.push({ line: i + 1, endLine: i + 1, section, text: l }); continue; }
    let b = i;
    const same = (j) => j < lines.length && lines[j].trim() !== "" && inFence[j] === inFence[i] && !/^#{1,6} /.test(lines[j]) && !/^\s*\|/.test(lines[j]);
    while (same(b + 1)) b++;
    out.push({ line: i + 1, endLine: b + 1, section, text: lines.slice(i, b + 1).join("\n") });
    i = b;
  }
  return out;
}

// the symbols a paragraph cites: ["daemon:real", ...]. `known`: bundle -> Set
// of real names (a pair or mention of a name no index has is prose)
export function paragraphCites(text, known) {
  const cites = new Set();
  const has = (qual, real) => {
    const bundles = qual ? [qual] : ["daemon", "cli"];
    for (const b of bundles) if (known[b]?.has(real)) return b;
    return null;
  };
  const covered = [];
  const inCovered = (i) => covered.some(([a, b]) => a <= i && i < b);
  for (const m of text.matchAll(nameBound())) { covered.push([m.index, m.index + m[0].length]); const b = has(m[2], m[3]); if (b) cites.add(`${b}:${m[3]}`); }
  for (const m of text.matchAll(namePair())) {
    if (inCovered(m.index)) continue;
    covered.push([m.index, m.index + m[0].length]);
    const q = (text.slice(Math.max(0, m.index - 8), m.index).match(/(daemon|cli):`?$/) || [])[1];
    const b = has(q, m[1]); if (b) cites.add(`${b}:${m[1]}`);
  }
  for (const sp of codeSpans(text)) {
    if (inCovered(sp.start)) continue;
    const mm = sp.content.trim().match(/^(?:(daemon|cli):)?([A-Za-z_$][A-Za-z0-9_$]*)$/);
    if (mm && looksRealName(mm[2])) { const b = has(mm[1], mm[2]); if (b) cites.add(`${b}:${mm[2]}`); }
  }
  return [...cites].sort();
}

// the text a paragraph is hashed by: whitespace collapsed; short names of
// `real (short)` pairs, 1-4 character identifiers inside code spans (locals and
// top-level short names, which every build re-mangles) and 4-6 digit numbers in
// code spans replaced by `_`
export function normaliseParagraph(text) {
  let out = "";
  let from = 0;
  for (const sp of codeSpans(text)) {
    out += text.slice(from, sp.start);
    const toks = tokenize(sp.content);
    let code = "", at = 0;
    for (const t of toks) {
      code += sp.content.slice(at, t.at);
      code += t.role === "var" ? "_" : /^\d{4,6}$/.test(t.text) ? "_" : t.text;
      at = t.at + t.text.length;
    }
    out += "`" + code + sp.content.slice(at) + "`";
    from = sp.end;
  }
  out += text.slice(from);
  out = out.replace(namePair(), (m, real, short) => (isShortName(short) ? m.replace(short, "_") : m));
  return out.replace(/\s+/g, " ").trim();
}
export const paragraphHash = (text) => sha1(normaliseParagraph(text));

// --- the record ------------------------------------------------------------------
export function loadAcks(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Which recorded paragraph a current one is: first the one in the same doc
// and section with the same hash (the text is unchanged, so the ack applies
// whatever the cited set now resolves to); else, in order of appearance, one
// with the same cited set (two evidence-table rows may cite the same symbol),
// whose hash then differs: edited.
function indexAcks(acks) {
  const byHash = new Map(), byCites = new Map();
  for (const [doc, d] of Object.entries(acks?.docs || {})) for (const p of d.paragraphs) {
    const h = [doc, p.section, p.hash].join("\0"), c = [doc, p.section, p.cites.join(",")].join("\0");
    if (!byHash.has(h)) byHash.set(h, []);
    byHash.get(h).push(p);
    if (!byCites.has(c)) byCites.set(c, []);
    byCites.get(c).push(p);
  }
  return { byHash, byCites };
}

// The verdict of every current paragraph with citations, against the record
// and the new profiles. profileOf("daemon:real") -> profile | null. `known`
// is widened by the record's own symbols, so a cited name the new bundle no
// longer has (dropped upstream, or an inferred name not yet re-anchored) is
// reported `missing` rather than silently left out of the cited set.
// -> [{ doc, line, endLine, section, cites, hash, verdict, symbols: { cite: kind } }]
export function checkDocs(acks, docs, known, profileOf) {
  const { byHash, byCites } = indexAcks(acks);
  const wide = {};
  for (const [b, set] of Object.entries(known)) wide[b] = new Set(set);
  for (const c of Object.keys(acks?.symbols || {})) { const [b, real] = c.split(/:(.*)/s); (wide[b] ??= new Set()).add(real); }
  // the names both releases have: the record's name list and the new bundle's
  const shared = {};
  for (const [b, set] of Object.entries(known)) shared[b] = new Set((acks?.names?.[b] || Object.keys(acks?.symbols || {}).filter((c) => c.startsWith(b + ":")).map((c) => c.slice(b.length + 1))).filter((r) => set.has(r)));
  const used = new Set();
  const out = [];
  for (const docPath of docs) {
    const doc = relDoc(docPath);
    const text = fs.readFileSync(docPath, "utf8");
    for (const p of docParagraphs(text)) {
      const cites = paragraphCites(p.text, wide);
      if (!cites.length) continue;
      const hash = paragraphHash(p.text);
      const entry = { doc, line: p.line, endLine: p.endLine, section: p.section, cites, hash, verdict: null, symbols: {} };
      const rec = (byHash.get([doc, p.section, hash].join("\0")) || []).find((r) => !used.has(r)) || null;
      if (!rec) {
        const alt = (byCites.get([doc, p.section, cites.join(",")].join("\0")) || []).find((r) => !used.has(r)) || null;
        if (alt) { used.add(alt); entry.verdict = "edited"; entry.ackVersion = acks.version; out.push(entry); continue; }
        entry.verdict = "no-ack"; out.push(entry); continue;
      }
      used.add(rec);
      entry.ackVersion = acks.version;
      let worst = "unchanged";
      const rank = { unchanged: 0, "body-only": 1, changed: 2, missing: 3 };
      for (const c of cites) {
        const [b, real] = c.split(/:(.*)/s);
        const kind = known[b]?.has(real) ? compareProfiles(acks.symbols[c], profileOf(c), shared[b]) : "missing";
        entry.symbols[c] = kind;
        if (rank[kind] > rank[worst]) worst = kind;
      }
      entry.verdict = worst;
      out.push(entry);
    }
  }
  return out;
}

// --- bundles: index or rename map ----------------------------------------------------
// -> { bundle: { lines, spans: real -> {line,endLine}, topLevel: mangled -> real|null, version } }
export function loadBundles(indexArg, bundleArgs, renameArgs = {}) {
  const B = {};
  for (const p of indexArg.split(",").filter(Boolean)) {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!j.symbols) throw new Error(`${p} is not a symbol index (no .symbols); pass a rename map with --rename <bundle>=<rename.json>`);
    if (!bundleArgs[j.bundle]) continue;
    const src = fs.readFileSync(bundleArgs[j.bundle], "utf8"), lines = src.split("\n");
    assertBundleMatchesIndex(lines, j, bundleArgs[j.bundle]);
    const spans = new Map(), topLevel = new Map();
    for (const [real, e] of Object.entries(j.symbols)) { spans.set(real, { line: e.line, endLine: e.endLine }); topLevel.set(e.mangled, real); }
    for (const [m] of declSpans(src)) if (!topLevel.has(m)) topLevel.set(m, null);
    B[j.bundle] = { lines, spans, topLevel, version: j.version };
  }
  for (const [bundle, renameP] of Object.entries(renameArgs)) {
    if (B[bundle] || !bundleArgs[bundle]) continue;
    const rename = JSON.parse(fs.readFileSync(renameP, "utf8"));
    const src = fs.readFileSync(bundleArgs[bundle], "utf8"), lines = src.split("\n");
    const all = declSpans(src);
    const spans = new Map(), topLevel = new Map();
    for (const [m] of all) topLevel.set(m, null);
    for (const [m, real] of Object.entries(rename)) { if (all.has(m)) { spans.set(real, all.get(m)); topLevel.set(m, real); } }
    B[bundle] = { lines, spans, topLevel, version: null };
  }
  return B;
}
export const knownNames = (B) => Object.fromEntries(Object.entries(B).map(([b, x]) => [b, new Set(x.spans.keys())]));
export function profiler(B) {
  const cache = new Map();
  return (cite) => {
    if (cache.has(cite)) return cache.get(cite);
    const [bundle, real] = cite.split(/:(.*)/s);
    const b = B[bundle], e = b?.spans.get(real);
    const prof = e ? declProfile(b.lines.slice(e.line - 1, e.endLine).join("\n"), b.topLevel) : null;
    cache.set(cite, prof);
    return prof;
  };
}

// one paragraph and one symbol per line, so a diff of the record reads
function serialiseRecord(out) {
  const L = ["{", ` "generatedBy": ${JSON.stringify(out.generatedBy)},`, ` "version": ${JSON.stringify(out.version)},`, ` "names": {`];
  const bundles = Object.keys(out.names);
  bundles.forEach((b, i) => L.push(`  ${JSON.stringify(b)}: ${JSON.stringify(out.names[b])}${i < bundles.length - 1 ? "," : ""}`));
  L.push(" },", ` "docs": {`);
  const docs = Object.keys(out.docs);
  docs.forEach((d, i) => {
    L.push(`  ${JSON.stringify(d)}: { "paragraphs": [`);
    out.docs[d].paragraphs.forEach((p, j) => L.push(`   ${JSON.stringify(p)}${j < out.docs[d].paragraphs.length - 1 ? "," : ""}`));
    L.push(`  ] }${i < docs.length - 1 ? "," : ""}`);
  });
  L.push(" },", ` "symbols": {`);
  const syms = Object.keys(out.symbols);
  syms.forEach((c, i) => L.push(`  ${JSON.stringify(c)}: ${JSON.stringify(out.symbols[c])}${i < syms.length - 1 ? "," : ""}`));
  L.push(" }", "}", "");
  return L.join("\n");
}

// `briefs`: what a verifier needs per citation of a work group, from
// impact.json (which carries each citation's tier, reason, ack verdict and
// stability since impact_report.mjs read the record): the cited declaration's
// readable diff, cut to --diff-lines lines. The upgrade-docs workflow hands
// this to the verifier instead of the whole section text, so the judgement
// is local to one claim and one diff (DocPrism's lesson, research record §6).
function briefs(multi, argv) {
  const IMPACT = multi("--impact")[0];
  const UNITS = (multi("--units")[0] || "").split(",").filter(Boolean);
  const DIFF_LINES = Number(multi("--diff-lines")[0] ?? 120);
  const JSON_OUT = multi("--json")[0];
  if (!IMPACT || argv.length) { console.error("usage: node doc_acks.mjs briefs --impact <impact.json> [--units docs/X.md#N,...] [--diff-lines N] [--json <o.json>]"); process.exit(2); }
  const impact = JSON.parse(fs.readFileSync(IMPACT, "utf8"));
  const changes = new Map(impact.changes.map((c) => [c.id, c]));
  const diffs = new Map();
  const diffOf = (p) => {
    if (!p) return null;
    if (!diffs.has(p)) {
      const abs = path.isAbsolute(p) ? p : path.join(ROOT, p);
      if (!fs.existsSync(abs)) diffs.set(p, null);
      else { const ls = fs.readFileSync(abs, "utf8").split("\n"); diffs.set(p, ls.length > DIFF_LINES ? ls.slice(0, DIFF_LINES).join("\n") + `\n… (${ls.length - DIFF_LINES} more lines in ${p})` : ls.join("\n")); }
    }
    return diffs.get(p);
  };
  const want = new Set(UNITS);
  const out = [];
  for (const c of impact.citations) {
    if (want.size && !want.has(`${c.doc}#${c.section}`)) continue;
    const ch = c.change ? changes.get(c.change) : null;
    const diffPaths = ch ? [ch.diff] : [...new Set((c.callees || []).map((k) => k.diff))];
    out.push({ doc: c.doc, line: c.line, section: c.section, sectionTitle: c.sectionTitle, tier: c.tier, form: c.form ?? "keyword", real: c.real ?? null,
      code: c.code ?? null, why: c.why, ack: c.ack ?? null, stability: c.stability ?? null, text: c.text,
      change: c.change ?? null, changed: ch ? { real: ch.real, kind: ch.kind, strAdded: ch.strAdded, strRemoved: ch.strRemoved, propAdded: ch.propAdded, propRemoved: ch.propRemoved } : null,
      callees: c.callees ?? null, diff: diffPaths.filter(Boolean).map((p) => ({ file: p, text: diffOf(p) })) });
  }
  out.sort((a, b) => (a.doc < b.doc ? -1 : a.doc > b.doc ? 1 : a.line - b.line));
  const text = JSON.stringify({ impact: IMPACT, units: UNITS, citations: out }, null, 1) + "\n";
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, text); else process.stdout.write(text);
  console.error(`briefs: ${out.length} citations${want.size ? ` in ${want.size} unit(s)` : ""}, ${[...new Set(out.flatMap((c) => c.diff.map((d) => d.file)))].length} diffs`);
}

function main() {
  const argv = process.argv.slice(2);
  const mode = argv.shift();
  const multi = (name) => { const out = []; for (let i; (i = argv.indexOf(name)) >= 0;) { out.push(argv[i + 1]); argv.splice(i, 2); } return out; };
  if (mode === "briefs") return briefs(multi, argv);
  const BUNDLES = Object.fromEntries(multi("--bundle").map((s) => s.split(/=(.*)/s).slice(0, 2)));
  const RENAMES = Object.fromEntries(multi("--rename").map((s) => s.split(/=(.*)/s).slice(0, 2)));
  const VERSION = multi("--version")[0];
  const OUTP = multi("--out")[0] || path.join(HERE, "../maps/doc_acks.json");
  const ACKS = multi("--acks")[0] || path.join(HERE, "../maps/doc_acks.json");
  const JSON_OUT = multi("--json")[0];
  const INDEX = argv.shift() || "";
  const DOCS = argv;
  const usage = () => { console.error("usage: node doc_acks.mjs record <symbols.json[,...]> --bundle daemon=<pretty.js> [--bundle cli=<pretty.js>] --version v<X.Y.Z> [--out <doc_acks.json>] <doc.md...>\n" +
    "       node doc_acks.mjs check  <symbols.json[,...]> --bundle daemon=<pretty.js> [--bundle cli=<pretty.js>] [--rename <bundle>=<rename.json>] [--acks <doc_acks.json>] [--json <o.json>] <doc.md...>\n" +
    "       node doc_acks.mjs briefs --impact <impact.json> [--units docs/X.md#N,...] [--diff-lines N] [--json <o.json>]"); process.exit(2); };
  if (!["record", "check"].includes(mode) || !BUNDLES.daemon || !DOCS.length || (mode === "record" && !VERSION)) usage();
  const B = loadBundles(INDEX === "-" ? "" : INDEX, BUNDLES, RENAMES);
  if (!B.daemon) { console.error("no daemon index or rename map"); process.exit(2); }
  const known = knownNames(B), profileOf = profiler(B);

  if (mode === "record") {
    const out = { generatedBy: "tools/doc_acks.mjs", version: VERSION,
                  names: Object.fromEntries(Object.entries(known).map(([b, set]) => [b, [...set].sort()])), docs: {}, symbols: {} };
    let paragraphs = 0;
    for (const docPath of DOCS) {
      const doc = relDoc(docPath);
      const text = fs.readFileSync(docPath, "utf8");
      const list = [];
      for (const p of docParagraphs(text)) {
        const cites = paragraphCites(p.text, known);
        if (!cites.length) continue;
        list.push({ section: p.section, line: p.line, hash: paragraphHash(p.text), cites });
        for (const c of cites) if (!out.symbols[c]) out.symbols[c] = profileOf(c);
        paragraphs++;
      }
      out.docs[doc] = { paragraphs: list };
    }
    out.symbols = Object.fromEntries(Object.entries(out.symbols).sort(([a], [b]) => (a < b ? -1 : 1)));
    fs.writeFileSync(OUTP, serialiseRecord(out));
    console.error(`doc_acks: recorded ${paragraphs} paragraphs with citations in ${DOCS.length} docs, ${Object.keys(out.symbols).length} symbols, at ${VERSION} -> ${OUTP}`);
    return;
  }
  const acks = loadAcks(ACKS);
  if (!acks) { console.error(`no record at ${ACKS}: run \`doc_acks.mjs record\` first`); process.exit(2); }
  const results = checkDocs(acks, DOCS, known, profileOf);
  const tally = new Map();
  for (const r of results) tally.set(r.verdict, (tally.get(r.verdict) || 0) + 1);
  const changedSymbols = new Map();
  for (const r of results) for (const [c, k] of Object.entries(r.symbols)) if (k !== "unchanged") changedSymbols.set(c, k);
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ acks: acks.version, paragraphs: results, symbols: Object.fromEntries(changedSymbols) }, null, 1) + "\n");
  for (const r of results) if (r.verdict !== "unchanged" && r.verdict !== "no-ack")
    console.log(`  ${r.verdict.padEnd(10)} ${r.doc}:${r.line} [${r.section}] ${Object.entries(r.symbols).filter(([, k]) => k !== "unchanged").map(([c, k]) => `${c} (${k})`).join(", ")}`);
  console.error(`doc_acks: ${results.length} paragraphs with citations against the ${acks.version} record: ` +
    ["unchanged", "body-only", "changed", "edited", "missing", "no-ack"].map((k) => `${tally.get(k) || 0} ${k}`).join(", ") +
    `; ${changedSymbols.size} cited symbols changed (${[...changedSymbols.values()].filter((k) => k === "body-only").length} body-only)` + (JSON_OUT ? ` -> ${JSON_OUT}` : ""));
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) main();
