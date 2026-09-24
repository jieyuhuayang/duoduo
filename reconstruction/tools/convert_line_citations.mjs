// Retire legacy line-number citations by rewriting them into the two line-free
// forms, and prove every rewrite before it is written.
//
// Why this exists: a line number is the one part of a citation that every
// release breaks. esbuild re-mangles and the formatter reflows on each bump, so
// every `…`（`N`） in docs/ has to be moved (remap_doc_anchors -> retarget_docs
// -> verify_citations --fix), and at v0.8.3 about two hundred could not be
// moved at all and were dropped. CLAUDE.md therefore lets the line numbers only
// disappear (maps/bare_anchor_baseline.json), and most of them can disappear
// mechanically, because the fact they carry is already held by something that
// survives a release:
//
//   F1  `real (short)`（`N`）       -> `real (short)`        the pair is the claim;
//       `N` (`short`=real)             `real (short)`        the line only locates it
//   F2  `short`（`N`）, `short`@N    -> `real (short)`        when the index names short
//       `N` (short)
//   F3  `code`（`N`[/`M`…]）        -> `code`（`realName`）   when one indexed symbol
//                                                            holds every cited line and
//                                                            the snippet passes the
//                                                            strict name-bound test
//
// (shapes: anchor_forms.mjs). Anything else is left byte for byte and listed
// with the reason, so what remains is a to-do list, not noise: an F2/F3 whose
// function, module initialiser or literal constant has no real name yet is
// reported with the short name to give name_symbol.mjs, ranked by how many
// citations naming it would convert.
//
// Each rewrite is gated twice:
//   1. before: the old citation must hold today by its own checker's rule (a
//      stale citation is not laundered into a line-free one that nobody can
//      compare with the old line any more), and the new one must hold by the
//      rule that will check it from now on (anchor_forms.mjs snippetHolds,
//      the function check_bare_anchors.mjs itself runs);
//   2. after: the converted docs are written to a temp dir and the real
//      checkers run on them (check_bare_anchors.mjs --list, verify_citations.mjs,
//      check_doc_anchors.mjs). Every failure they report that they did not
//      report on the original text reverts the rewrites on that doc line, and
//      the round repeats. The test in (1) only picks candidates; what is
//      written is what the shipped checkers accept, so the two cannot drift
//      into writing something the build then refutes.
//
// Rewrites never add or remove a newline, so a doc line number means the same
// line before and after, which is how a checker's complaint is traced back to
// the rewrite that caused it. Converted text carries no line number and no
// recognisable site, so a second run finds only what the first one left and
// changes nothing.
//
// F2 needs one more guard than "the index names it". The F2 claim is "short
// name X is on line N"; turning it into `real (X)` asserts that the X there is
// the top-level binding. esbuild never gives a nested local the name of a
// top-level symbol, but a property can be spelled the same (`process.on`,
// `{on: …}`, a class method `on(…)`), and the old substring checker passed
// those. So each cited line must lie inside the symbol, or use X as a binding.
//
// Usage:
//   node convert_line_citations.mjs --index <symbols_daemon.json>[,<symbols_cli.json>]
//        --bundle daemon=<daemon.pretty.js> [--bundle cli=<cli.pretty.js>]
//        [--write] [--report <out.json>] [--top <n>] <doc.md...>
// Default is a dry run: per-doc counts (converted F1/F2/F3, left by reason,
// line numbers before -> after). --write rewrites the docs in place; lower the
// ceilings afterwards with check_bare_anchors.mjs --write-baseline.
// Exit: 2 usage / bundle-index mismatch, 1 a checker failure that could not be
// traced to a rewrite (nothing is written then).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import { codeSpans, lineSpans, looseLineNumbers, identRe, snippetHolds, looksReal, nameBound, namePair } from "./anchor_forms.mjs";
import { assertBundleMatchesIndex, loadIndex } from "./bundle_guard.mjs";
import { topLevelDeclarations, isNameable, isFunctionLike } from "./verify_inferred.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
const INDEX = opt("--index");
const REPORT = opt("--report");
const TOP = Number(opt("--top") || 20);
const WRITE = flag("--write");
const bundlePaths = new Map();
for (let v; (v = opt("--bundle")); ) {
  const [n, p] = v.split("=");
  if (!n || !p) { console.error(`--bundle wants <name>=<pretty.js>, got ${v}`); process.exit(2); }
  bundlePaths.set(n, p);
}
const DOCS = argv;
const USAGE = "usage: node convert_line_citations.mjs --index s_daemon.json[,s_cli.json] --bundle daemon=<p> [--bundle cli=<p>] [--write] [--report o.json] [--top n] <doc.md...>";
if (!INDEX || !bundlePaths.has("daemon") || !DOCS.length || DOCS.some(d => d.startsWith("--"))) { console.error(USAGE); process.exit(2); }
// The checkers report a doc by its basename (check_bare_anchors.mjs --list),
// and the temp copies they run on are named after it.
const base = DOCS.map(d => path.basename(d));
if (new Set(base).size !== base.length) { console.error("two docs share a basename; run them separately"); process.exit(2); }

// ---- index and bundles -----------------------------------------------------
const indexes = new Map();
for (const p of INDEX.split(",").filter(Boolean)) { const ix = loadIndex(p); indexes.set(ix.bundle, ix); }
for (const b of bundlePaths.keys()) if (!indexes.has(b)) { console.error(`--bundle ${b} has no --index; a rewrite into it could not be checked`); process.exit(2); }

const B = new Map(); // name -> { lines, src, symbols, realOf, top() }
function bundle(name) {
  if (B.has(name)) return B.get(name);
  const p = bundlePaths.get(name), ix = indexes.get(name);
  if (!p || !ix) { B.set(name, null); return null; }
  const src = fs.readFileSync(p, "utf8");
  const lines = src.split("\n");
  assertBundleMatchesIndex(lines, ix, p);
  let top = null;
  const b = {
    name, lines, symbols: ix.symbols,
    realOf: new Map(Object.entries(ix.symbols).map(([r, e]) => [e.mangled, r])),
    // Top-level declarations, parsed on first use: only a citation the index
    // cannot resolve needs them (is `Du` an unnamed function, or a word?).
    // One entry per declarator, from its own line to the statement's end, or
    // to its own end for a value — symbol_index.mjs's convention, so
    // "innermost" picks the right one of `var a = …, b = …`. An uninitialised
    // var covers only itself here: the index lets its span run to the end of
    // `var a, b, X = __esm(() => {…})` so that a citation of its assigned
    // value can be checked, but the lines of that body belong to X, and with
    // every declarator tied on the same span "innermost" answered `a`.
    // `nameable` is the kind name_symbol.mjs can name (verify_inferred.mjs
    // topLevelDeclarations): function-like, moduleInit or value, else null.
    top() {
      if (top) return top;
      top = [];
      const ast = parse(src, { sourceType: "module", attachComment: false });
      const kinds = topLevelDeclarations(ast);
      const nameable = (n) => { const d = kinds.get(n); return !d || !isNameable(d) ? null : isFunctionLike(d) ? "function" : d.kind; };
      for (const s of ast.program.body) {
        if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id)
          top.push({ name: s.id.name, a: s.loc.start.line, b: s.loc.end.line, fn: true, nameable: "function" });
        else if (s.type === "VariableDeclaration")
          for (const d of s.declarations) if (d.id.type === "Identifier") {
            const k = nameable(d.id.name);
            top.push({ name: d.id.name, a: d.loc.start.line, b: (k === "value" || !d.init ? d : s).loc.end.line, fn: k === "function", nameable: k });
          }
      }
      top.byName = new Map(top.map(d => [d.name, d]));
      return top;
    },
  };
  B.set(name, b);
  return b;
}
if (!bundle("daemon")) { console.error("the daemon bundle and its index are required"); process.exit(2); }
const innermost = (decls, a, b) => { let best = null; for (const d of decls) if (d.a <= a && b <= d.b && (!best || d.a > best.a || (d.a === best.a && d.b < best.b))) best = d; return best; };

// The indexed symbol whose declaration holds lines a..b. An uninitialised var
// is not a candidate: its index span is the `var x, y, z;` list, and its value
// is assigned somewhere else entirely, so "this snippet is inside X" would be
// true of the list and say nothing about X.
function enclosingSymbol(bd, a, b) {
  let best = null;
  for (const [real, e] of Object.entries(bd.symbols)) {
    if (e.kind === "var (uninitialised)" || e.line > a || b > e.endLine) continue;
    if (!best || e.line > best.e.line || (e.line === best.e.line && e.endLine < best.e.endLine)) best = { real, e };
  }
  return best;
}

// snippetHolds (F3 on a line: strict = false; name-bound: strict = true) is
// check_bare_anchors.mjs's own rule, imported from anchor_forms.mjs. This tool
// used to carry a verbatim copy of it, marked "mirrors exactly" in a comment.
// It only nominates candidates; the real checker has the last word on every
// rewrite (see the header).

// Does `line` use `name` as a binding, not only as a property, key, string or
// method name? (See the header: the F2 guard.)
function refersToBinding(line, name) {
  for (const m of line.matchAll(new RegExp(identRe(name).source, "g"))) {
    const before = line.slice(0, m.index), after = line.slice(m.index + name.length);
    if (/(?<!\.)\.$/.test(before)) continue;                                  // x.on, x?.on (not ...on)
    if (/[{,]\s*$/.test(before) && /^\s*:(?!:)/.test(after)) continue;         // { on: … }
    const q = before.slice(-1);
    if (/["'`]/.test(q) && after.startsWith(q)) continue;                       // "on"
    if (/^\s*(?:(?:async|static|get|set)\s+)*$/.test(before) && /^\s*\([^)]*\)\s*\{\s*$/.test(after)) continue; // on(e) {
    return true;
  }
  return false;
}

// ---- sites -----------------------------------------------------------------
// A site is one citation: its subject, the line numbers it carries, and, if
// it converts, the edits that convert it. Code spans come from anchor_forms.mjs
// codeSpans (CommonMark tokenisation, fences excluded), so text inside a fence
// is never a site and never edited.
const LINE = /^(?:(daemon|cli|stdio)(?:\.pretty)?(?:\.js)?:)?([1-9]\d{3,5})(?:\s*[-–]\s*(\d{4,6}))?$/;
const BARE_LINE = /(?:(daemon|cli|stdio)(?:\.pretty)?\.js:)?([1-9]\d{3,5})(?:\s*[-–]\s*(\d{4,6}))?(?!\d)/y;
const PAIR = /^([A-Za-z_$][A-Za-z0-9_$]*)\s*\(\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\)$/;
const F2NAME = /^[A-Za-z_$][A-Za-z0-9_$]{1,5}$/;
const bundleOf = (q) => q || "daemon";
const sticky = (re, s, at) => { re.lastIndex = at; return re.exec(s); };

// A short name the index does not have but the bundle declares at top level.
// A function, a module initialiser or a literal constant wants a name
// (name_symbol.mjs), and then a re-run converts every citation of it; anything
// else (an uninitialised var, a call result) is not something name_symbol.mjs
// names, and is not counted as work it would unlock. ("Up to": name_symbol.mjs
// still refuses a constant another one shares its literal with, or state.)
function unnamed(bd, short) {
  const d = bd.top().byName.get(short);
  if (!d) return null;
  if (d.nameable === "function") return { reason: "F2 short name needs a real name", unnamed: short };
  if (d.nameable) return { reason: `F2 short name needs a real name (${d.nameable === "value" ? "a literal constant" : "a module initialiser"})`, unnamed: short };
  return { reason: "F2 short name is an unnamed declaration name_symbol.mjs cannot name", detail: short };
}

// What a code span claims, before any line is looked at. Mirrors the owners:
// verify_citations.mjs handle() for `x (y)`, check_doc_anchors.mjs for a bare
// short name; everything else is a snippet (F3).
function classify(content, bd) {
  const p = content.match(PAIR);
  if (p) {
    const [, real, short] = p;
    const e = bd.symbols[real];
    if (e) return e.mangled === short ? { kind: "F1", real, short }
      : { kind: "left", reason: "F1 pair is stale", detail: `${real} is ${e.mangled}, cited as ${short}` };
    // `ike(e)`: the first half is a short name, so this is a call — a snippet
    if (!bd.realOf.has(real) && looksReal(real)) return { kind: "left", reason: "F1 names a symbol not in the index", detail: real };
    return { kind: "F3" };
  }
  if (F2NAME.test(content)) {
    if (bd.realOf.has(content)) return { kind: "F2", real: bd.realOf.get(content), short: content };
    const u = unnamed(bd, content);
    if (u) return { kind: "left", ...u };
    return { kind: "F3" }; // `join`, `append`: a word of code, i.e. a snippet
  }
  return { kind: "F3" };
}

function sitesOf(t) {
  const spans = codeSpans(t);
  const at = new Map(spans.map(s => [s.start, s]));
  const single = (s) => s.end - s.start - s.content.length === 2;
  const lineOf = (s) => { const m = single(s) && s.content.match(LINE); return m ? { bundle: bundleOf(m[1]), from: +m[2], to: m[3] ? +m[3] : null } : null; };
  const sites = [];

  for (const s of spans) {
    const L = lineOf(s);
    if (L) {
      // reversed: `N` (`short`=real)  /  `N` (short)
      let m = sticky(/[ \t]*[（(][ \t]*`([A-Za-z_$][A-Za-z0-9_$]*)`[ \t]*=[ \t]*([A-Za-z_$][A-Za-z0-9_$]*)[ \t]*[)）]/y, t, s.end);
      if (m) { sites.push({ shape: "reversed", subject: { real: m[2], short: m[1] }, start: s.start, end: s.end + m[0].length, items: [{ ...L, start: s.start, end: s.end }] }); continue; }
      m = sticky(/[ \t]*[（(][ \t]*([A-Za-z_$][A-Za-z0-9_$]{1,5})[ \t]*[)）]/y, t, s.end);
      if (m) sites.push({ shape: "reversedShort", subject: { short: m[1] }, start: s.start, end: s.end + m[0].length, items: [{ ...L, start: s.start, end: s.end }] });
      continue;
    }
    // `subject`@N / `subject`@`N`
    let m = sticky(/[ \t]*@[ \t]*/y, t, s.end);
    if (m) {
      const p = s.end + m[0].length;
      const n = at.get(p);
      const item = n && lineOf(n) ? { ...lineOf(n), start: n.start, end: n.end } : (() => {
        const b = sticky(BARE_LINE, t, p);
        return b && { bundle: bundleOf(b[1]), from: +b[2], to: b[3] ? +b[3] : null, start: p, end: p + b[0].length, bare: true };
      })();
      if (item) sites.push({ shape: "at", span: s, start: s.start, end: item.end, items: [item] });
      continue;
    }
    // `subject`（`N`[sep `M`…][…]）
    m = sticky(/[ \t]*([（(])/y, t, s.end);
    if (!m) continue;
    const open = s.end + m[0].length - 1;
    let p = open + 1, items = [], rest = null, sepd = false;
    for (;;) {
      const ws = sticky(/[ \t]*/y, t, p); const q = p + ws[0].length;
      const n = at.get(q);
      const L2 = n && lineOf(n);
      if (!L2) { rest = p; break; }
      items.push({ ...L2, start: n.start, end: n.end });
      p = n.end;
      const sep = sticky(/[ \t]*[/、,，;；][ \t]*/y, t, p);
      sepd = !!sep;
      if (!sep) { rest = p; break; }
      p += sep[0].length;
    }
    if (!items.length) continue;
    const close = sticky(/[ \t]*[)）]/y, t, rest);
    if (close) { sites.push({ shape: "paren", span: s, open, close: rest + close[0].length - 1, pure: true, start: s.start, end: rest + close[0].length, items }); continue; }
    // prose follows the numbers: `x`（`N`，参数 …）. The separator after the
    // numbers goes with them. Without an explicit one (`N`=`name`, `N` 同行)
    // the prose may be about the number itself; restAt stays null and plan()
    // leaves the site alone.
    const sep = sepd ? [""] : sticky(/[ \t]*[，,；;：:][ \t]*/y, t, rest);
    sites.push({ shape: "paren", span: s, open, pure: false, restAt: sep ? rest + sep[0].length : null, start: s.start, end: rest, items });
  }
  return sites;
}

const cite = (real, short) => "`" + real + " (" + short + ")`";
// A real name both bundles have (`main`) means the daemon's symbol to every
// citation that does not name its bundle (verify_citations.mjs), so a pair
// written for a cli site of such a name keeps its bundle as a prefix:
// `cli:main (QXe)`. A cli-only name needs none, and gets none, so a cli pair
// reads the same as before unless the prefix is needed.
const qualify = (bname, real) => bname !== "daemon" && Object.hasOwn(indexes.get("daemon").symbols, real) ? `${bname}:${real}` : real;
// the count check_bare_anchors.mjs keeps per doc: each number once (a fenced
// one belongs to looseLineNumbers, not to lineSpans)
const lineCount = (t) => lineSpans(t).length + looseLineNumbers(t).length;

// ---- plan: which sites convert, and how ------------------------------------
// -> { edits: [{start, end, text}], kind, ... } or { reason }
function plan(site, t) {
  const bnames = new Set(site.items.map(i => i.bundle));
  if (bnames.size > 1) return { reason: "line numbers in different bundles" };
  const bname = [...bnames][0];
  const bd = bundle(bname);
  if (!bd) return { reason: `no ${bname} bundle/index given` };
  if (site.items.some(i => i.to !== null && i.to < i.from)) return { reason: "range runs backwards" };
  const lines = site.items.flatMap(i => i.to === null ? [i.from] : [i.from, i.to]);
  const lo = Math.min(...lines), hi = Math.max(...lines);
  if (hi > bd.lines.length) return { reason: "line is past the end of the bundle" };
  // An F1/F2 line outside the symbol is a call site. The pair survives the
  // rewrite, the location does not, and prose such as "调用点 `x (y)`" then
  // names a place it no longer points at: flagged for the doc pass.
  const callSite = (real) => { const e = bd.symbols[real]; return lines.some(n => n < e.line || n > e.endLine); };

  // F2: short -> `real (short)`, if every cited line is inside the symbol or
  // uses the name as a binding (header)
  const f2 = (real, short) => {
    const e = bd.symbols[real];
    const bad = lines.filter(n => !((e.line <= n && n <= e.endLine) || refersToBinding(bd.lines[n - 1] ?? "", short)));
    if (!bad.length) return null;
    return lines.every(n => identRe(short).test(bd.lines[n - 1] ?? "") || (e.line <= n && n <= e.endLine))
      ? { reason: "F2 short name is only a property/key/string on the cited line", detail: `${short} @ ${bad.join(",")}` }
      : { reason: "F2 does not hold on its line today", detail: `${short} @ ${bad.join(",")}` };
  };

  if (site.shape === "reversed") {
    const { real, short } = site.subject;
    const e = bd.symbols[real];
    if (!e) return { reason: "F1 names a symbol not in the index", detail: real };
    if (e.mangled !== short) return { reason: "F1 pair is stale", detail: `${real} is ${e.mangled}, cited as ${short}` };
    return { kind: "F1", edits: [{ start: site.start, end: site.end, text: cite(qualify(bname, real), short) }], real, short, as: qualify(bname, real), callSite: callSite(real) };
  }
  if (site.shape === "reversedShort") {
    const { short } = site.subject;
    const real = bd.realOf.get(short);
    if (!real) return unnamed(bd, short) || { reason: "F2 name is no top-level symbol", detail: short };
    const no = f2(real, short); if (no) return no;
    return { kind: "F2", edits: [{ start: site.start, end: site.end, text: cite(qualify(bname, real), short) }], real, short, as: qualify(bname, real), callSite: callSite(real) };
  }

  const s = site.span;
  if (s.end - s.start - s.content.length !== 2) return { reason: "subject is a multi-backtick span" };
  const c = classify(s.content, bd);
  if (c.kind === "left") return { reason: c.reason, detail: c.detail, unnamed: c.unnamed };
  // F1/F2 keep the prose after the numbers, unless that prose is about the
  // line itself: `Nu`（`87291`，同行） would be left saying "same line" of nothing
  if (c.kind !== "F3" && site.shape === "paren" && !site.pure) {
    if (site.restAt === null) return { reason: `${c.kind} numbers run into the prose after them`, detail: t.slice(s.start, site.end + 20) };
    if (/^[^)）]*?(?:同行|同一行|本行|该行|此行|same line)/.test(t.slice(site.restAt, t.indexOf("\n", site.restAt))))
      return { reason: `${c.kind} prose after the number refers to the line`, detail: t.slice(s.start, site.end + 20) };
  }
  // the numbers, and the separator after them when prose follows
  const dropNumbers = site.shape === "at" || site.pure
    ? { start: s.end, end: site.end, text: "" }
    : { start: site.items[0].start, end: site.restAt, text: "" };
  // the subject span rewritten to `real (short)` (with its bundle prefix when
  // one is needed), merged with the number removal when the two are adjacent
  const withSubject = (real, short) => {
    const e = [{ start: s.start, end: s.end, text: cite(qualify(bname, real), short) }];
    if (dropNumbers.start === s.end) e[0] = { start: s.start, end: dropNumbers.end, text: e[0].text };
    else e.push(dropNumbers);
    return e;
  };
  if (c.kind === "F1") {
    const as = qualify(bname, c.real);
    return { kind: "F1", edits: as === c.real ? [dropNumbers] : withSubject(c.real, c.short), real: c.real, short: c.short, as, callSite: callSite(c.real) };
  }
  if (c.kind === "F2") {
    const no = f2(c.real, c.short); if (no) return no;
    return { kind: "F2", edits: withSubject(c.real, c.short), real: c.real, short: c.short, as: qualify(bname, c.real), callSite: callSite(c.real) };
  }
  // F3
  const code = s.content;
  if (site.shape === "at") return { reason: "`code`@N is no F3 shape", detail: code };
  if (!site.pure) return { reason: "F3 parenthetical also carries prose", detail: code };
  for (const i of site.items) {
    const r = snippetHolds(code, bd.lines, i.from, i.to ?? i.from);
    if (!r.checkable) return { reason: "F3 snippet has no checkable token", detail: code };
    if (!r.ok) return { reason: "F3 does not hold on its line today", detail: code };
  }
  const sym = enclosingSymbol(bd, lo, hi);
  if (!sym) {
    const top = innermost(bd.top(), lo, hi);
    if (top && top.fn) return { reason: "F3 lines are in an unnamed function", unnamed: top.name };
    // name_symbol.mjs names these too: the module's constants are cited
    // through its initialiser, a literal constant by its own name
    if (top && top.nameable === "moduleInit") return { reason: "F3 lines are in an unnamed module initialiser", unnamed: top.name };
    if (top && top.nameable === "value") return { reason: "F3 lines are in an unnamed literal constant", unnamed: top.name };
    if (!top && innermost(bd.top(), lo, lo) !== innermost(bd.top(), hi, hi)) return { reason: "F3 lines fall in different declarations" };
    // a CommonJS wrapper, an uninitialised var's list, a statement
    return { reason: "F3 lines are in module-level code (nothing name_symbol.mjs can name)", detail: top ? top.name : null };
  }
  const r = snippetHolds(code, bd.lines, sym.e.line, sym.e.endLine, true);
  if (!r.checkable) return { reason: "F3 snippet has no strict-checkable token", detail: code };
  if (!r.ok) return { reason: "F3 snippet fails the strict name-bound test", detail: `${code} in ${sym.real}` };
  const name = (bname === "daemon" ? "" : bname + ":") + sym.real;
  return { kind: "F3", edits: [{ start: site.open + 1, end: site.close, text: "`" + name + "`" }], real: sym.real, code, bundle: bname };
}

function apply(t, edits) {
  let out = t;
  for (const e of [...edits].sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}

// ---- the real checkers, on temp copies --------------------------------------
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "convert-lines-"));
process.on("exit", () => fs.rmSync(TMP, { recursive: true, force: true }));
// Vendor classification only refutes a line number that lands in library code.
// A conversion removes line numbers and never adds or moves one, so the
// before/after comparison below needs no vendor list: empty inputs keep the
// tool's CLI to what it really needs.
fs.writeFileSync(path.join(TMP, "blocks.json"), '{"blocks":[]}');
fs.writeFileSync(path.join(TMP, "modules.json"), '{"vendor":[]}');
// check_bare_anchors.mjs and check_doc_anchors.mjs take the daemon bundle as a
// positional argument and every other one as --bundle; verify_citations.mjs
// takes them all as --bundle.
const others = [...bundlePaths].filter(([n]) => n !== "daemon").flatMap(([n, p]) => ["--bundle", `${n}=${p}`]);
const all = [...bundlePaths].flatMap(([n, p]) => ["--bundle", `${n}=${p}`]);
// The gate reads the checkers' output, so a change in that output (a renamed
// --list field, a reworded FATAL line) would leave it seeing no failures at all
// and passing every rewrite. A canary doc rides along in every run with one
// failure per checker; if the parsed result does not contain all three, the
// gate is blind and nothing is written.
const CANARY = "__convert_line_citations_canary__.md";
if (base.includes(CANARY)) { console.error(`${CANARY} is this tool's canary; rename the doc`); process.exit(2); }
const [cReal, cSym] = Object.entries(indexes.get("daemon").symbols).find(([, e]) => e.kind !== "var (uninitialised)");
const canaryText = [
  "`zzCanaryTokenNowhere`（`" + cReal + "`）",   // check_bare_anchors: name-bound snippet not inside
  "`" + cReal + " (Zz9q)`",                      // verify_citations: wrong short name
  "`Zz9q`（`" + cSym.line + "`）",               // check_doc_anchors: short name not on its line
  ""].join("\n\n");
let round = 0;
// -> { fails: Set of "doc\tdocLine\tchecker\twhat…", notHold: F2 failures }
function check(texts) {
  const dir = path.join(TMP, `r${round++}`);
  fs.mkdirSync(dir);
  const files = base.map((b, k) => { const f = path.join(dir, b); fs.writeFileSync(f, texts[k]); return f; });
  files.push(path.join(dir, CANARY));
  fs.writeFileSync(files.at(-1), canaryText);
  const run = (tool, args) => {
    const r = spawnSync(process.execPath, [path.join(HERE, tool), ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
    if (r.status === 2 || r.error) { console.error(`${tool} could not run:\n${r.stderr || r.error}`); process.exit(2); }
    return r;
  };
  const fails = new Set();
  // every refuted or unbound number, and every refuted name-bound snippet
  const list = path.join(dir, "list.json");
  run("check_bare_anchors.mjs", ["--index", INDEX, ...others, "--list", list,
    bundlePaths.get("daemon"), path.join(TMP, "blocks.json"), path.join(TMP, "modules.json"), ...files]);
  for (const e of JSON.parse(fs.readFileSync(list, "utf8")))
    fails.add(`${e.doc}\t${e.docLine}\tbare\t${e.status}\t${e.snippet ?? e.anchor ?? ""}\t${e.symbol ?? ""}`);
  // every FATAL pair (a missing symbol or a wrong short name)
  const vc = run("verify_citations.mjs", [INDEX, ...all, ...files]);
  for (const m of vc.stderr.matchAll(/^\s+FATAL\s+(.+?):(\d+)\s+(.*)$/gm)) fails.add(`${path.basename(m[1])}\t${m[2]}\tcite\t${m[3]}`);
  // F2 short names this tool leaves in place: a count is enough, since no
  // rewrite creates an F2 or edits one it did not convert
  const da = run("check_doc_anchors.mjs", ["--resolve", "--index", INDEX, ...others, bundlePaths.get("daemon"), ...files]);
  const notHold = +(da.stderr.match(/(\d+) do NOT hold/) || [0, 0])[1] + +(da.stderr.match(/(\d+) range\(s\) run backwards/) || [0, 0])[1];
  const seen = (k) => [...fails].some(f => f.startsWith(`${CANARY}\t`) && f.split("\t")[2] === k);
  if (!seen("bare") || !seen("cite") || notHold < 1) {
    console.error(`the canary's failures were not all seen (check_bare_anchors ${seen("bare")}, verify_citations ${seen("cite")}, check_doc_anchors ${notHold >= 1}): a checker's output format changed and this gate can no longer see a refutation. Nothing written.`);
    process.exit(2);
  }
  return { fails, notHold };
}

// ---- main ------------------------------------------------------------------
const texts = DOCS.map(d => fs.readFileSync(d, "utf8"));
const perDoc = base.map((name, k) => {
  const t = texts[k];
  const starts = [0];
  for (let i = t.indexOf("\n"); i >= 0; i = t.indexOf("\n", i + 1)) starts.push(i + 1);
  const docLine = (off) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= off) lo = mid; else hi = mid - 1; } return lo + 1; };
  const sites = sitesOf(t).map(s => ({ ...s, docLine: docLine(s.start), text: t.slice(s.start, Math.min(s.end, s.start + 160)), ...plan(s, t) }));
  // a site's edits are all taken or none; one overlapping an earlier site's
  // (a number that is both a reversed citation and an item of a parenthesis)
  // stays as it is
  const taken = [];
  for (const s of sites) {
    if (!s.edits) continue;
    if (s.edits.some(e => e.text.includes("\n") || t.slice(e.start, e.end).includes("\n"))) { s.reason = "rewrite would span a newline"; delete s.edits; continue; }
    if (s.edits.some(e => taken.some(x => e.start < x.end && x.start < e.end))) { s.reason = "overlaps another citation's rewrite"; delete s.edits; continue; }
    taken.push(...s.edits);
  }
  return { name, t, sites, docLine };
});

// Does the converted text still show each rewrite in the form its checker
// reads? (A code span next to it could make nameBound()/namePair() read
// something else, and then the checker would be checking another claim.)
function readBack(d, out) {
  const lines = out.split("\n");
  const bad = [];
  for (const s of d.sites) {
    if (!s.edits) continue;
    const L = lines[s.docLine - 1] ?? "";
    const ok = s.kind === "F3"
      ? [...L.matchAll(nameBound())].some(m => m[1] === s.code && m[3] === s.real && (m[2] || "daemon") === s.bundle)
      : [...L.matchAll(namePair())].some(m => m[1] === s.real && m[2] === s.short
          && (s.as === s.real || L.slice(0, m.index).endsWith(s.as.slice(0, -s.real.length))));
    if (!ok) bad.push(s);
  }
  return bad;
}

const before = check(texts);
let outs;
for (let r = 0; ; r++) {
  outs = perDoc.map(d => apply(d.t, d.sites.flatMap(s => s.edits || [])));
  let reverted = 0;
  perDoc.forEach((d, k) => { for (const s of readBack(d, outs[k])) { s.reason = "converted form does not read back as intended"; delete s.edits; reverted++; } });
  if (reverted) { outs = perDoc.map(d => apply(d.t, d.sites.flatMap(s => s.edits || []))); }
  const after = check(outs);
  if (after.notHold > before.notHold) { console.error(`check_doc_anchors.mjs: ${after.notHold} short-name citations fail after conversion, ${before.notHold} before — a rewrite broke an F2 it did not touch`); process.exit(1); }
  const fresh = [...after.fails].filter(f => !before.fails.has(f));
  if (!fresh.length) break;
  const orphans = [];
  for (const f of fresh) {
    const [doc, ln, kind, what] = f.split("\t");
    const d = perDoc.find(x => x.name === doc);
    const here = d ? d.sites.filter(s => s.edits && s.docLine === +ln) : [];
    // narrowest attribution first: the rewrite the complaint names (a pair
    // complaint quotes the pair: "… cited as `real (short)`")
    const citedAs = kind === "cite" && (what.match(/cited as `([^`]+)`/) || [])[1];
    const named = here.filter(s => kind === "bare" ? s.kind === "F3" && f.includes(`\t${s.code}\t`)
      : s.kind !== "F3" && (citedAs ? citedAs === `${s.as} (${s.short})` : what.includes(s.real)));
    const guilty = named.length ? named : here;
    if (!guilty.length) { orphans.push(f); continue; }
    for (const s of guilty) { s.reason = `reverted: the checker refuted it (${kind === "bare" ? "check_bare_anchors" : "verify_citations"})`; s.checker = what; delete s.edits; }
  }
  if (orphans.length) {
    console.error("checker failures after conversion that no rewrite on their line explains (nothing written):");
    for (const o of orphans) console.error("  " + o.replace(/\t/g, "  "));
    process.exit(1);
  }
  if (r >= 5) { console.error("checkers still refuting rewrites after 6 rounds; nothing written"); process.exit(1); }
}

// ---- report ----------------------------------------------------------------
const report = { docs: {}, unnamed: [] };
const unlocks = new Map(); // "bundle:short" -> citations naming it would unlock
for (const [k, d] of perDoc.entries()) {
  const conv = { F1: 0, F2: 0, F3: 0 }, retired = { F1: 0, F2: 0, F3: 0 }, left = {};
  let calls = 0;
  for (const s of d.sites) {
    if (s.edits) { conv[s.kind]++; retired[s.kind] += s.items.length; calls += !!s.callSite; continue; }
    left[s.reason] = (left[s.reason] || 0) + 1;
    if (s.unnamed) { const key = `${s.items[0].bundle}:${s.unnamed}`; unlocks.set(key, (unlocks.get(key) || 0) + 1); }
  }
  const nBefore = lineCount(d.t), nAfter = lineCount(outs[k]);
  // numbers check_bare_anchors.mjs counts that no site carries: a shape this
  // tool does not parse (a number in prose after the parenthesis opens, a
  // subject on the previous line, …). Listed, so the count adds up.
  const inSite = new Set(d.sites.flatMap(s => s.items.map(i => i.start)));
  const stray = [...lineSpans(d.t).map(m => m.index), ...looseLineNumbers(d.t).map(n => n.index)]
    .filter(i => !inSite.has(i)).map(i => ({ docLine: d.docLine(i), text: d.t.slice(i, i + 80).split("\n")[0] }));
  report.docs[d.name] = {
    lineNumbers: { before: nBefore, after: nAfter }, converted: conv, lineNumbersRetired: retired, left, notInASite: stray,
    sites: d.sites.map(s => {
      if (!s.edits) return { docLine: s.docLine, shape: s.shape, lineNumbers: s.items.length, text: s.text, left: s.reason, detail: s.detail, unnamed: s.unnamed, checker: s.checker };
      const a = Math.min(s.start, ...s.edits.map(e => e.start));
      let b = Math.max(s.end, ...s.edits.map(e => e.end));
      // a partial rewrite keeps the prose after the numbers: show some of it
      if (s.pure === false) { const eol = d.t.indexOf("\n", b); b = Math.min(eol < 0 ? d.t.length : eol, b + 40); }
      return { docLine: s.docLine, shape: s.shape, lineNumbers: s.items.length, converted: s.kind, ...(s.callSite ? { callSite: true } : {}), text: d.t.slice(a, b), to: apply(d.t.slice(a, b), s.edits.map(e => ({ ...e, start: e.start - a, end: e.end - a }))) };
    }),
  };
  console.log(`${d.name}: line numbers ${nBefore} -> ${nAfter}`);
  console.log(`  converted  F1 ${conv.F1}  F2 ${conv.F2}  F3 ${conv.F3}  (sites; ${retired.F1 + retired.F2 + retired.F3} line numbers retired)`);
  if (calls) console.log(`             ${calls} of the F1/F2 cited a call site; check the prose around them (report: callSite)`);
  for (const [r, n] of Object.entries(left).sort((a, b) => b[1] - a[1])) console.log(`  left ${String(n).padStart(5)}  ${r}`);
  if (stray.length) console.log(`  left ${String(stray.length).padStart(5)}  line numbers in no citation site this tool parses (report: notInASite)`);
}
report.unnamed = [...unlocks].sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ symbol: k, citations: n }));
if (report.unnamed.length) {
  const total = report.unnamed.reduce((a, u) => a + u.citations, 0);
  const topN = report.unnamed.slice(0, TOP);
  // "up to": a re-run still applies every gate to them
  console.log(`\n${total} citations are left in ${report.unnamed.length} unnamed functions, module initialisers and constants; naming the top ${topN.length} with name_symbol.mjs makes up to ${topN.reduce((a, u) => a + u.citations, 0)} of them convertible on a re-run:`);
  console.log("  " + topN.map(u => `${u.symbol} ${u.citations}`).join(", "));
}
if (REPORT) fs.writeFileSync(REPORT, JSON.stringify(report, null, 1) + "\n");
if (WRITE) {
  let n = 0;
  perDoc.forEach((d, k) => { if (outs[k] !== d.t) { fs.writeFileSync(DOCS[k], outs[k]); n++; } });
  console.log(`\n${n} doc(s) rewritten.` + (n ? " Lower the ceilings: check_bare_anchors.mjs … --baseline maps/bare_anchor_baseline.json --write-baseline" : ""));
} else console.log("\ndry run: nothing written (--write to apply)");
