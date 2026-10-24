// Re-derive stale name-bound snippets `代码片段`（`真名`） after a bump.
//
// retarget_symbols.mjs moves the short name of a `真名 (短名)` pair, and
// deliberately leaves identifiers inside quoted code alone: in a snippet they
// are mostly function-locals, which esbuild renames on every build without any
// map saying to what. So after a bump every snippet that quotes a local or a
// top-level short name is refuted by check_bare_anchors.mjs (since the
// verbatim rule, it must be in its symbol as written). At v0.8.3 -> v0.8.4 that
// was several hundred snippets, re-derived by scripts and by hand. This tool is
// that script.
//
// For each name-bound snippet that no longer holds, it builds a pattern from
// the snippet's tokens and searches the bound symbol's current declaration:
//   - string literals, numbers, punctuation, keywords, globals, property names
//     (after `.` or `?.`) and identifiers of 5+ characters stay as written;
//   - a short identifier the migration maps (an old top-level short name, from
//     fingerprint_match.mjs and/or the two rename maps) is pinned to its new
//     short name;
//   - every other identifier of 1-4 characters is a wildcard, and the same
//     identifier written twice must match the same name twice (a backreference),
//     so `e => e.id` cannot become `t => n.id`;
//   - `…` is a gap, as in snippetVerbatim.
// The snippet is rewritten only when every match in the declaration gives the
// same rewrite and the rewrite then passes snippetHolds -- the same strict rule
// check_bare_anchors.mjs applies. A snippet whose string literal, property or
// structure changed has no match: it is reported, because what it claimed may
// have changed with it. The rewrite keeps the snippet's own spacing and
// abbreviations; only identifiers change.
//
// Three attempts, the first unique one wins: migration pins on with object keys
// (`ok:`) literal; pins on with keys as wildcards (`a ? b : c` reads like a
// key); pins off (a local that happens to share an old top-level short name).
//
// Before those, with --old <bundle>=<old pretty.js>,<old symbols.json> (the
// release the docs were written against: bump.sh's pretty_old and the
// not-yet-promoted maps/symbols_<bundle>.json), a snippet whose declaration did
// not change is rewritten exactly instead of by pattern. The declaration is
// unchanged when its old and new token streams are equal with every identifier
// that is not a member name spelled `_`; then token k of the old declaration
// is token k of the new one. The snippet is located in the OLD declaration
// (it held there, as written), and each of its identifiers is replaced by the
// token at the same position in the new declaration; a snippet that occurs
// more than once is rewritten when every occurrence gives the same text. This
// needs no guessing about which local is which, so it settles the snippets
// the pattern finds more than once in the declaration: at v0.8.4 -> v0.8.5
// all 9 that the pattern left `ambiguous` quoted unchanged code, and were
// rewritten by hand exactly this way.
//
// Usage:
//   node retarget_snippets.mjs --index <symbols_daemon.json>[,<symbols_cli.json>]
//        --bundle daemon=<new daemon.pretty.js> [--bundle cli=<new cli.pretty.js>]
//        [--fp daemon=<fp_daemon.json>] [--fp cli=<fp_cli.json>]
//        [--rename daemon=<old rename.json>,<new rename.json>] [--rename cli=...]
//        [--old daemon=<old daemon.pretty.js>,<old symbols_daemon.json>] [--old cli=...]
//        [--write] [--report <out.json>] <doc.md...>
// The index and bundles are the NEW release's (the step-2 check-mode run's
// .build); --fp is bump.sh's fingerprint match; --rename the old maps/ and new
// .build rename maps. Without --write it changes nothing.
import fs from "node:fs";
import { parse } from "@babel/parser";
import { fileURLToPath } from "node:url";
import { nameBound, snippetHolds } from "./anchor_forms.mjs";
import { assertBundleMatchesIndex, loadIndex } from "./bundle_guard.mjs";

const KEYWORDS = new Set(("async await break case catch class const continue default delete do else export extends " +
  "false finally for function if import in instanceof let new null of return super switch this throw true try typeof " +
  "undefined var void while yield get set static NaN Infinity").split(" "));
const GLOBALS = new Set("Date JSON Math Object Array Promise Error Set Map Number String Boolean Symbol RegExp URL process require console Buffer globalThis".split(" "));
// whole string literals (all three quotes), identifiers, numbers, `…`, any other non-space character
const TOKEN = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|[A-Za-z_$][A-Za-z0-9_$]*|\d[\w.]*|…|\S/g;
const isIdent = (t) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(t);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// -> [{ text, at, role }] with role "lit" | "gap" | "var"
export function tokenize(code) {
  const toks = [...code.matchAll(TOKEN)].map((m) => ({ text: m[0], at: m.index }));
  return toks.map((t, i) => {
    if (t.text === "…") return { ...t, role: "gap" };
    if (!isIdent(t.text)) return { ...t, role: "lit" };
    const prev = toks[i - 1]?.text, prev2 = toks[i - 2]?.text, next = toks[i + 1]?.text;
    const property = prev === "." && !(prev2 === "." && toks[i - 3]?.text === ".");  // `...e` is a spread, not a property
    if (property || KEYWORDS.has(t.text) || GLOBALS.has(t.text) || t.text.length > 4) return { ...t, role: "lit" };
    return { ...t, role: "var", key: next === ":" && prev !== "?" };
  });
}

// One attempt: a regex over the declaration text; returns the distinct rewrites
function attempt(code, toks, migration, { pins, keysLiteral }) {
  const groups = new Map();          // identifier -> group name (backreference on reuse)
  const pinned = new Map();          // identifier -> its new short name
  let re = "", prevWord = false, afterGap = true, n = 0;
  for (const t of toks) {
    if (t.role === "gap") { re += "[\\s\\S]*?"; prevWord = false; afterGap = true; continue; }
    const word = /^[\w$]/.test(t.text);
    if (!afterGap) re += word && prevWord ? "\\s+" : "\\s*";
    afterGap = false;
    prevWord = word;
    if (t.role === "lit" || (t.role === "var" && t.key && keysLiteral)) {
      re += word ? `(?<![\\w$])${esc(t.text)}(?![\\w$])` : esc(t.text);
      continue;
    }
    if (pins && migration.has(t.text)) { pinned.set(t.text, migration.get(t.text)); re += `(?<![\\w$])${esc(migration.get(t.text))}(?![\\w$])`; continue; }
    if (groups.has(t.text)) { re += `\\k<${groups.get(t.text)}>(?![\\w$])`; continue; }
    const g = `v${n++}`;
    groups.set(t.text, g);
    re += `(?<![\\w$])(?<${g}>[A-Za-z_$][\\w$]*)(?![\\w$])`;
  }
  return { re, groups, pinned };
}

export function rederive(code, span, migration) {
  const toks = tokenize(code);
  if (!toks.some((t) => t.role === "var")) return { status: "nothing to re-derive" };
  const counts = [];
  for (const opts of [{ pins: true, keysLiteral: true }, { pins: true, keysLiteral: false }, { pins: false, keysLiteral: true }]) {
    const { re, groups, pinned } = attempt(code, toks, migration, opts);
    let rx;
    try { rx = new RegExp(re, "g"); } catch { return { status: "pattern error" }; }
    const outs = new Set();
    for (const m of span.matchAll(rx)) {
      const sub = new Map(pinned);
      for (const [id, g] of groups) sub.set(id, m.groups[g]);
      let out = "", from = 0;
      for (const t of toks) {
        if (t.role !== "var" || !sub.has(t.text)) continue;
        out += code.slice(from, t.at) + sub.get(t.text);
        from = t.at + t.text.length;
      }
      outs.add(out + code.slice(from));
      if (outs.size > 1) break;
    }
    counts.push(outs.size);
    if (outs.size === 1) return { status: "rewritten", to: [...outs][0] };
  }
  return { status: counts.some((c) => c > 1) ? "ambiguous" : "no match" };
}

// The rewrite of a snippet from an unchanged declaration: token k of oldSpan is
// token k of newSpan. Returns { status, to? }.
//
// Both spans are tokenized by @babel/parser, not by TOKEN: TOKEN reads a
// template literal as one token, so a local inside `${...}`, which esbuild
// renames like any other, made the two streams differ and the declaration read
// as changed. At v0.8.5 -> v0.8.6 that sent 27 snippets of unchanged
// declarations (drainSessionMailbox, createSessionManager, createDaemon, ...)
// back to the pattern, which found each more than once (`ambiguous`). The
// snippet is read by lexSnippet, which splits a template the same way.
export function fromUnchangedDecl(code, oldSpan, newSpan) {
  const O = lexSpan(oldSpan), N = lexSpan(newSpan);
  const norm = (toks) => toks.map((t) => (t.name && !t.member ? "_" : t.text));
  if (O.length !== N.length) return { status: "declaration changed" };
  const no = norm(O), nn = norm(N);
  for (let i = 0; i < no.length; i++) if (no[i] !== nn[i]) return { status: "declaration changed" };
  const toks = lexSnippet(code);
  let re = "", prevWord = false, afterGap = true, n = 0;
  const groupOf = [];
  for (const t of toks) {
    if (t.text === "…") { re += "[\\s\\S]*?"; prevWord = false; afterGap = true; continue; }
    const word = /^[\w$]/.test(t.text);
    if (!afterGap) re += word && prevWord ? "\\s+" : "\\s*";
    afterGap = false; prevWord = word;
    if (t.ident) { const g = `i${n++}`; groupOf.push([t, g]); re += `(?<![\\w$])(?<${g}>${esc(t.text)})(?![\\w$])`; }
    else re += esc(t.text);
  }
  if (!groupOf.length) return { status: "nothing to re-derive" };
  let rx;
  try { rx = new RegExp(re, "gd"); } catch { return { status: "pattern error" }; }
  const hits = [...oldSpan.matchAll(rx)];
  if (!hits.length) return { status: "not in old declaration" };
  // the token whose text holds an offset (the last one starting at or before it)
  const holding = (at) => {
    let lo = 0, hi = O.length - 1, k = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (O[mid].at <= at) { k = mid; lo = mid + 1; } else hi = mid - 1; }
    return k;
  };
  // the snippet may occur more than once (`w.agentNotifiedThisDrain = !0` is set
  // in three places); it is rewritten when every occurrence gives the same text
  const outs = new Set();
  for (const hit of hits) {
    let out = "", from = 0;
    for (const [t, g] of groupOf) {
      const at = hit.indices.groups[g][0], k = holding(at);
      if (k < 0 || at >= O[k].at + O[k].text.length) return { status: "token mismatch" };
      // an identifier token of the old release is the one at the same index in the
      // new; anything else (a keyword, a word inside a template chunk or a string,
      // the `$` of `${`) was compared verbatim above, so it is the same in both
      const to = O[k].name && O[k].at === at && O[k].text === t.text ? N[k].text : t.text;
      out += code.slice(from, t.at) + to;
      from = t.at + t.text.length;
    }
    outs.add(out + code.slice(from));
  }
  if (outs.size > 1) return { status: "ambiguous in old declaration" };
  return { status: "rewritten", to: [...outs][0], how: "unchanged declaration" };
}

// A declaration span's tokens -> [{ text, at, name, member }]: comments, eof and
// empty template chunks dropped; an identifier token (Babel's `name`, which
// includes contextual keywords such as `let` and `of`) is `name`, and one right
// after `.` or `?.` is also `member`. Falls back to TOKEN when the span does not
// parse.
const spanCache = new Map();
function lexSpan(span) {
  if (spanCache.has(span)) return spanCache.get(span);
  let toks;
  try {
    const ast = parse(span, { tokens: true, errorRecovery: true, sourceType: "script", allowReturnOutsideFunction: true,
                              allowAwaitOutsideFunction: true, allowSuperOutsideMethod: true, allowNewTargetOutsideFunction: true });
    toks = [];
    for (const t of ast.tokens) {
      if (typeof t.type === "string" || t.end === t.start) continue;  // CommentLine / CommentBlock, eof, empty chunk
      const name = t.type.label === "name", prev = toks[toks.length - 1]?.text;
      toks.push({ text: span.slice(t.start, t.end), at: t.start, name, member: name && (prev === "." || prev === "?.") });
    }
  } catch {
    const raw = [...span.matchAll(TOKEN)].map((m) => ({ text: m[0], at: m.index }));
    const member = (i) => raw[i - 1]?.text === "." && !(raw[i - 2]?.text === "." && raw[i - 3]?.text === ".");
    toks = raw.map((t, i) => ({ ...t, name: isIdent(t.text), member: isIdent(t.text) && member(i) }));
  }
  spanCache.set(span, toks);
  return toks;
}

// A snippet's tokens -> [{ text, at, ident }], as TOKEN reads them except that a
// template literal is split: its text pieces ("`a=${", "}b`") are literal tokens
// and the code inside each `${...}` is read again, so the identifiers there are
// rewritten like any others. An unterminated template (the snippet stops inside
// one) is literal to its end. A snippet that starts inside a template has no
// backtick to see; fromUnchangedDecl keeps the words it then reads as
// identifiers as written, because they fall inside a template chunk token.
export function lexSnippet(code) {
  const out = [];
  const one = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[A-Za-z_$][A-Za-z0-9_$]*|\d[\w.]*|…|\S/y;
  const push = (text, at, ident = false) => out.push({ text, at, ident });
  const plain = (i) => { one.lastIndex = i; const m = one.exec(code); push(m[0], i, isIdent(m[0])); return m[0]; };
  // i is just past a backtick; -> the index past the closing one
  const template = (i) => {
    let piece = i - 1;
    while (i < code.length) {
      if (code[i] === "\\") { i += 2; continue; }
      if (code[i] === "`") { push(code.slice(piece, i + 1), piece); return i + 1; }
      if (code[i] === "$" && code[i + 1] === "{") {
        push(code.slice(piece, i + 2), piece);
        i = expr(i + 2);
        if (i >= code.length) return i;
        piece = i++;  // the closing `}` opens the next piece
        continue;
      }
      i++;
    }
    push(code.slice(piece), piece);
    return i;
  };
  // the code inside `${`; -> the index of its closing `}`
  const expr = (i) => {
    let depth = 0;
    while (i < code.length) {
      if (/\s/.test(code[i])) { i++; continue; }
      if (code[i] === "`") { i = template(i + 1); continue; }
      if (code[i] === "}" && depth === 0) return i;
      const t = plain(i);
      if (t === "{") depth++;
      if (t === "}") depth--;
      i += t.length;
    }
    return i;
  };
  for (let i = 0; i < code.length;) {
    if (/\s/.test(code[i])) { i++; continue; }
    if (code[i] === "`") { i = template(i + 1); continue; }
    i += plain(i).length;
  }
  return out;
}

// Is the snippet's code in a span, whatever its identifiers of 1-4 characters
// are called? (every such identifier a wildcard, the same one twice the same
// name; literals, properties and long names as written). impact_report.mjs asks
// this of both releases: when the quoted code is in both, only names changed.
export function skeletonIn(code, span) {
  const toks = tokenize(code.replace(/\\\|/g, "|"));
  const { re } = attempt(code, toks, new Map(), { pins: false, keysLiteral: true });
  try { return new RegExp(re).test(span); } catch { return false; }
}

function main() {
  const argv = process.argv.slice(2);
  const multi = (name) => { const out = []; for (let i; (i = argv.indexOf(name)) >= 0;) { out.push(argv[i + 1]); argv.splice(i, 2); } return out; };
  const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
  const INDEX = multi("--index").join(",");
  const BUNDLES = Object.fromEntries(multi("--bundle").map((s) => s.split(/=(.*)/s).slice(0, 2)));
  const FPS = multi("--fp").map((s) => s.split(/=(.*)/s).slice(0, 2));
  const RENAMES = multi("--rename").map((s) => s.split(/=(.*)/s).slice(0, 2));
  const OLDS = multi("--old").map((s) => s.split(/=(.*)/s).slice(0, 2));
  const REPORT = multi("--report")[0];
  const WRITE = flag("--write");
  const DOCS = argv;
  if (!INDEX || !BUNDLES.daemon || !DOCS.length) {
    console.error("usage: node retarget_snippets.mjs --index <symbols.json>[,...] --bundle daemon=<pretty.js> [--bundle cli=<pretty.js>]\n" +
                  "         [--fp <bundle>=<fp.json>]... [--rename <bundle>=<old.json>,<new.json>]... [--write] [--report <o.json>] <doc.md...>");
    process.exit(2);
  }

  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

  // per bundle: index, lines, migration (old short -> new short)
  const B = {};
  for (const p of INDEX.split(",").filter(Boolean)) {
    const ix = loadIndex(p);
    if (!BUNDLES[ix.bundle]) continue;
    const lines = fs.readFileSync(BUNDLES[ix.bundle], "utf8").split("\n");
    assertBundleMatchesIndex(lines, ix, BUNDLES[ix.bundle]);
    B[ix.bundle] = { ix, lines, migration: new Map() };
  }
  // bump.sh writes no fp_<bundle>.json for a bundle that did not change; nothing moved there
  for (const [b, p] of FPS) {
    if (!B[b] || !fs.existsSync(p)) continue;
    for (const [o, m] of Object.entries(readJSON(p).matched)) if (m.unique && typeof m.new === "string") B[b].migration.set(o, m.new);
  }
  // the release the docs were written against, for snippets of unchanged declarations
  for (const [b, pair] of OLDS) {
    if (!B[b]) continue;
    const [prettyP, indexP] = pair.split(",");
    const ix = loadIndex(indexP);
    const lines = fs.readFileSync(prettyP, "utf8").split("\n");
    assertBundleMatchesIndex(lines, ix, prettyP);
    B[b].old = { ix, lines };
  }
  for (const [b, pair] of RENAMES) {
    if (!B[b]) continue;
    const [oldP, newP] = pair.split(",");
    const newByReal = new Map(Object.entries(readJSON(newP)).map(([s, r]) => [r, s]));
    for (const [o, r] of Object.entries(readJSON(oldP))) if (newByReal.has(r)) B[b].migration.set(o, newByReal.get(r));
  }

  const report = [];
  const tally = new Map();
  for (const doc of DOCS) {
    const text = fs.readFileSync(doc, "utf8");
    const edits = [];
    for (const m of text.matchAll(nameBound())) {
      const [whole, raw, qual, name] = m;
      const bundle = qual || "daemon";
      const b = B[bundle];
      const e = b && own(b.ix.symbols, name) ? b.ix.symbols[name] : null;
      if (!e) continue;  // check_bare_anchors.mjs reports unknown symbols
      if (/^(?:(?:daemon|cli|stdio)(?:\.pretty)?(?:\.js)?:)?\d{4,6}/.test(raw)) continue;
      const r0 = snippetHolds(raw, b.lines, e.line, e.endLine, true);
      if (r0.checkable && r0.ok) continue;
      const escaped = raw.includes("\\|");
      const code = escaped ? raw.replace(/\\\|/g, "|") : raw;
      const span = b.lines.slice(e.line - 1, e.endLine).join("\n");
      let r = { status: "no old release given" }, viaOld = null;
      const oe = b.old && own(b.old.ix.symbols, name) ? b.old.ix.symbols[name] : null;
      if (oe) {
        r = fromUnchangedDecl(code, b.old.lines.slice(oe.line - 1, oe.endLine).join("\n"), span);
        if (r.status === "rewritten") {
          const to = escaped ? r.to.replace(/\|/g, "\\|") : r.to;
          if (to === raw || to.includes("`") || !snippetHolds(to, b.lines, e.line, e.endLine, true)?.ok) r = { status: "exact rewrite refuted" };
        }
        viaOld = r.status;  // why the exact rewrite did not apply, kept for the report
      }
      if (r.status !== "rewritten") r = rederive(code, span, b.migration);
      if (r.status === "rewritten") {
        const to = escaped ? r.to.replace(/\|/g, "\\|") : r.to;
        const ok = to !== raw && !to.includes("`") && snippetHolds(to, b.lines, e.line, e.endLine, true);
        if (!ok?.ok) r = { status: to === raw ? "no change" : "rewrite still refuted" };
        else {
          r.to = to;
          const at = m.index + 1;  // the snippet starts after the opening backtick
          edits.push({ start: at, end: at + raw.length, text: to });
        }
      }
      const line = text.slice(0, m.index).split("\n").length;
      tally.set(r.status, (tally.get(r.status) || 0) + 1);
      report.push({ doc, line, symbol: (qual ? qual + ":" : "") + name, from: raw, ...(r.to ? { to: r.to } : {}), status: r.status,
                   ...(viaOld && r.status !== "rewritten" ? { old: viaOld } : {}) });
      if (r.status !== "rewritten") console.log(`  ${r.status.padEnd(22)} ${doc}:${line}  \`${raw.slice(0, 70)}\`（\`${name}\`）` + (viaOld ? `  [--old: ${viaOld}]` : ""));
      else console.log(`  rewritten              ${doc}:${line}  \`${raw.slice(0, 50)}\` -> \`${r.to.slice(0, 50)}\``);
    }
    if (WRITE && edits.length) {
      let out = text;
      for (const x of edits.sort((a, c) => c.start - a.start)) out = out.slice(0, x.start) + x.text + out.slice(x.end);
      fs.writeFileSync(doc, out);
    }
  }
  if (REPORT) fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n");
  const total = report.length;
  console.error(`\n${total} refuted name-bound snippet(s): ` + [...tally].map(([k, v]) => `${v} ${k}`).join(", ") +
    (WRITE ? "" : "  (dry run: --write applies the rewrites)"));
  if (total - (tally.get("rewritten") || 0)) console.error("the rest need a person: re-read the declaration and quote what proves the claim now (prefer string literals)");
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) main();
