// Match the top-level declarations of a PUBLISHED TypeScript source (a sibling
// package of the same author that ships `src/*.ts`, e.g. @openduo/protocol,
// whose code esbuild inlined into the daemon bundle without a name) against the
// top-level declarations of a pretty bundle, so that the names the bundle lost
// can be registered as UPSTREAM's names rather than inferred ones.
//
// Why not a structural signature: esbuild --minify-syntax rewrites control flow
// (`if (…) return false; return true` becomes `return !(…)`), so the TS body
// and the bundled body are not the same AST modulo renaming. What the minifier
// cannot touch is the same as in structural_signature.mjs: literal values,
// non-computed property names and object keys, and references to globals
// (`Object`, `Array`, `Number`), plus a function's arity. A declaration is
// matched on exactly those, as a weighted Jaccard over tagged tokens
// (`p:` property, `s:` string, `n:` number, `g:` global), with arity required
// equal for functions, and a literal constant on its canonical literal
// (verify_inferred.mjs canonicalLiteral, after the TS type annotations are
// dropped). Short identifiers -- locals, and references to other top-level
// declarations of the same file -- are ignored on both sides, since they are
// what the minifier renames.
//
// Verdicts, per published declaration:
//   confirmed   the best bundle match already carries this real name
//   conflict    the best bundle match carries ANOTHER real name (an inferred
//               name upstream spells differently, or a wrong pin) -- read it
//   unique      one bundle declaration scores >= --min and leads the runner-up
//               by >= --lead: registrable with name_symbol.mjs --published
//   ambiguous   two or more bundle declarations tie (identical bodies, such as
//               isJobGetParams and isJobArchiveParams): the report lists each
//               candidate's referencing statements so a person can tell them
//               apart by who calls them; pick by hand, with --pick short=name
//   weak        best score below --min: probably inlined, split or rewritten
//   missing     no bundle declaration shares a token: tree-shaken or inlined
// A published declaration whose features are too thin to identify anything
// (no literal, no property, no global -- `isRecord` is `typeof v === "object"
// && v !== null && !Array.isArray(v)`, which has only `object` and `Array`)
// is still matched, but the verdict carries `thin` and name_symbol.mjs refuses
// to take it as evidence: a thin feature set fits too many functions.
//
// Usage:
//   node match_published_source.mjs --src <dir with *.ts> --package <name@version> \
//        [--rename <rename.json>] [--inferred <inferred.json>] [--min 0.6] [--lead 0.15] \
//        [--pick <short>=<name>]... [--report <out.json>] <pretty.js>
// Prints one line per published declaration; --report writes the full result,
// which name_symbol.mjs --published reads: {package, source: {dir, files:
// {file: sha256}}, bundle, matches: [{name, file, line, kind, exported, arity,
// features, verdict, thin, best: {short, line, score, named}, candidates: [...]}]}.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import { topLevelDeclarations, isFunctionLike, canonicalLiteral } from "./verify_inferred.mjs";
const traverse = _traverse.default || _traverse;

const argv = process.argv.slice(2);
const opt = (name, dflt = null) => { const i = argv.indexOf(name); if (i < 0) return dflt; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const multi = (name) => { const out = []; for (let i; (i = argv.indexOf(name)) >= 0;) { out.push(argv[i + 1]); argv.splice(i, 2); } return out; };
const SRC = opt("--src"), PACKAGE = opt("--package"), RENAME = opt("--rename"), INFERRED = opt("--inferred");
const MIN = +opt("--min", "0.6"), LEAD = +opt("--lead", "0.15"), REPORT = opt("--report");
const PICKS = new Map(multi("--pick").map(p => { const [s, n] = p.split("="); return [n, s]; })); // real name -> short
const [BUNDLE] = argv;
if (!SRC || !PACKAGE || !BUNDLE) { console.error("usage: node match_published_source.mjs --src <dir> --package <name@version> [--rename r.json] [--inferred i.json] [--min 0.6] [--lead 0.15] [--pick short=name]... [--report o.json] <pretty.js>"); process.exit(2); }

// ---- features of one declaration -------------------------------------------------
// `scopeOf` tells a reference to a binding outside the node apart from a global:
// on the bundle side, references to other top-level bindings; on the TS side,
// references to the file's other declarations and its imports. Both are dropped.
function featuresOf(node, isGlobal) {
  const f = { p: new Set(), s: new Set(), n: new Set(), g: new Set() };
  const visit = (n, parent, key) => {
    if (!n || typeof n.type !== "string") return;
    switch (n.type) {
      case "StringLiteral": if (!(parent && (parent.type === "ObjectProperty" || parent.type === "ClassProperty") && key === "key")) f.s.add(n.value); break;
      case "TemplateElement": if (n.value.cooked) f.s.add(n.value.cooked); break;
      case "NumericLiteral": f.n.add(String(n.value)); break;
      case "RegExpLiteral": f.s.add(`/${n.pattern}/${n.flags}`); break;
      case "MemberExpression": case "OptionalMemberExpression":
        if (!n.computed && n.property.type === "Identifier") f.p.add(n.property.name); break;
      case "ObjectProperty": case "ObjectMethod": case "ClassProperty": case "ClassMethod":
        if (!n.computed) { if (n.key.type === "Identifier") f.p.add(n.key.name); else if (n.key.type === "StringLiteral") f.p.add(n.key.value); } break;
      case "Identifier":
        if (parent && ((parent.type === "MemberExpression" || parent.type === "OptionalMemberExpression") && key === "property" && !parent.computed)) break;
        if (parent && (parent.type === "ObjectProperty" || parent.type === "ClassProperty" || parent.type === "ObjectMethod" || parent.type === "ClassMethod") && key === "key") break;
        if (isGlobal(n, parent)) f.g.add(n.name);
        break;
    }
    if (n.type.startsWith("TS")) { // type annotations carry no runtime feature
      if (n.type === "TSAsExpression" || n.type === "TSSatisfiesExpression" || n.type === "TSNonNullExpression" || n.type === "TSTypeAssertion") visit(n.expression, n, "expression");
      return;
    }
    for (const k of Object.keys(n)) {
      if (k === "loc" || k === "start" || k === "end" || k === "leadingComments" || k === "trailingComments" || k === "innerComments" || k === "extra" || k === "typeAnnotation" || k === "returnType" || k === "typeParameters") continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach(x => visit(x, n, k)); else if (v && typeof v.type === "string") visit(v, n, k);
    }
  };
  visit(node, null, null);
  return f;
}
const tokensOf = (f) => new Set([...[...f.p].map(x => "p:" + x), ...[...f.s].map(x => "s:" + x), ...[...f.n].map(x => "n:" + x), ...[...f.g].map(x => "g:" + x)]);
const WEIGHT = { p: 1, s: 1.5, n: 0.5, g: 0.5 };
function score(a, b) {
  let inter = 0, union = 0;
  for (const t of new Set([...a, ...b])) { const w = WEIGHT[t[0]]; union += w; if (a.has(t) && b.has(t)) inter += w; }
  return union ? inter / union : 0;
}
const isThin = (f) => f.p.size + f.s.size + f.n.size < 2;

// ---- strip TS from a literal initialiser so canonicalLiteral can read it --------------
function stripTS(n) {
  if (!n) return n;
  while (n && (n.type === "TSAsExpression" || n.type === "TSSatisfiesExpression" || n.type === "TSNonNullExpression" || n.type === "TSTypeAssertion")) n = n.expression;
  if (n && n.type === "ArrayExpression") return { ...n, elements: n.elements.map(stripTS) };
  if (n && n.type === "ObjectExpression") return { ...n, properties: n.properties.map(p => p.type === "ObjectProperty" ? { ...p, value: stripTS(p.value) } : p) };
  return n;
}

// ---- published side ----------------------------------------------------------------
const files = fs.readdirSync(SRC).filter(f => f.endsWith(".ts") && !f.endsWith(".d.ts")).sort();
const published = [], fileHashes = {};
for (const file of files) {
  const text = fs.readFileSync(path.join(SRC, file), "utf8");
  fileHashes[file] = crypto.createHash("sha256").update(text).digest("hex");
  const ast = parse(text, { sourceType: "module", plugins: ["typescript"], errorRecovery: true });
  const fileLevel = new Set();
  traverse(ast, { Program(p) { for (const name of Object.keys(p.scope.bindings)) fileLevel.add(name); p.stop(); } });
  const isGlobal = (id, parent) => !fileLevel.has(id.name) && !boundNames.has(id.name);
  let boundNames = new Set();
  const take = (decl, exported) => {
    if (decl.type === "FunctionDeclaration" && decl.id) {
      boundNames = collectBound(decl);
      const f = featuresOf(decl.body, isGlobal);
      published.push({ name: decl.id.name, file, line: decl.loc.start.line, kind: "function", exported, arity: decl.params.length, features: f, tokens: tokensOf(f), thin: isThin(f) });
    } else if (decl.type === "VariableDeclaration") {
      for (const d of decl.declarations) {
        if (d.id.type !== "Identifier" || !d.init) continue;
        const init = stripTS(d.init);
        if (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") {
          boundNames = collectBound(init);
          const f = featuresOf(init.body, isGlobal);
          published.push({ name: d.id.name, file, line: d.loc.start.line, kind: "function", exported, arity: init.params.length, features: f, tokens: tokensOf(f), thin: isThin(f) });
        } else {
          const c = canonicalLiteral(init);
          if (c !== null) published.push({ name: d.id.name, file, line: d.loc.start.line, kind: "value", exported, canonical: c });
          else { boundNames = new Set(); const f = featuresOf(init, isGlobal); published.push({ name: d.id.name, file, line: d.loc.start.line, kind: "expression", exported, features: f, tokens: tokensOf(f), thin: isThin(f) }); }
        }
      }
    }
  };
  for (const s of ast.program.body) {
    if (s.type === "ExportNamedDeclaration" && s.declaration) take(s.declaration, true);
    else if (s.type === "FunctionDeclaration" || s.type === "VariableDeclaration") take(s, false);
  }
}
function collectBound(fn) {
  const out = new Set();
  const walk = (n) => { if (!n || typeof n.type !== "string") return; if (n.type === "Identifier") out.add(n.name); for (const k of ["params", "declarations", "id", "left", "elements", "properties", "value", "argument", "param"]) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === "string") walk(v); } };
  fn.params.forEach(walk);
  // locals declared anywhere in the body
  const stack = [fn.body];
  while (stack.length) { const n = stack.pop(); if (!n || typeof n !== "object") continue; if (Array.isArray(n)) { stack.push(...n); continue; } if (n.type === "VariableDeclarator") walk(n.id); if (n.type === "FunctionDeclaration" || n.type === "ClassDeclaration") { if (n.id) out.add(n.id.name); n.params?.forEach(walk); } if ((n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression") && n.params) n.params.forEach(walk); if (n.type === "CatchClause" && n.param) walk(n.param); for (const k of Object.keys(n)) if (k !== "loc" && n[k] && typeof n[k] === "object") stack.push(n[k]); }
  return out;
}

// ---- bundle side -------------------------------------------------------------------
const src = fs.readFileSync(BUNDLE, "utf8");
const ast = parse(src, { sourceType: "module", ranges: true, allowReturnOutsideFunction: true });
const decls = topLevelDeclarations(ast);
const topNames = new Set(decls.keys());
for (const s of ast.program.body) if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") topNames.add(d.id.name);
const rename = RENAME ? JSON.parse(fs.readFileSync(RENAME, "utf8")) : {};
const inferred = INFERRED ? JSON.parse(fs.readFileSync(INFERRED, "utf8")) : {};
// a renamed recon bundle carries the real names themselves, so a top-level name
// that is a real name in the map is named by itself
const realSet = new Set(Object.values(rename));
const namedAs = (short) => rename[short] ?? inferred[short] ?? (realSet.has(short) ? short : null);
const bundleFns = [], bundleValues = [];
for (const [short, d] of decls) {
  if (isFunctionLike(d)) {
    const bound = d.node.type === "ClassDeclaration" || d.node.type === "ClassExpression" ? new Set() : collectBound(d.node);
    const f = featuresOf(d.node.type === "ClassDeclaration" || d.node.type === "ClassExpression" ? d.node : d.node.body, (id) => !bound.has(id.name) && !topNames.has(id.name));
    bundleFns.push({ short, line: d.line, arity: d.params, tokens: tokensOf(f) });
  } else if (d.kind === "value") bundleValues.push({ short, line: d.line, canonical: d.canonical });
}
// referencing statements of a short name, for telling twins apart
const refsOf = new Map();
traverse(ast, { ReferencedIdentifier(p) { const nm = p.node.name; if (!topNames.has(nm)) return; const b = p.scope.getBinding(nm); if (!b || b.scope.block.type !== "Program") return; let s = p; while (s.parentPath && s.parentPath.type !== "Program") s = s.parentPath; const st = s.node; const holder = st.id?.name ?? st.declarations?.[0]?.id?.name ?? `@${st.loc.start.line}`; const lineText = src.split("\n")[p.node.loc.start.line - 1].trim().slice(0, 120); if (!refsOf.has(nm)) refsOf.set(nm, []); if (refsOf.get(nm).length < 6) refsOf.get(nm).push({ in: namedAs(holder) ?? holder, line: p.node.loc.start.line, text: lineText }); } });

// ---- match -------------------------------------------------------------------------
const hashOf = (text) => crypto.createHash("sha256").update(text).digest("hex").slice(0, 16); // verify_inferred.mjs's
const initialisers = [...decls].filter(([, d]) => d.kind === "moduleInit").map(([short, d]) => ({ short, line: d.line, values: new Set(d.values) }));
const matches = [];
const byFile = new Map();
for (const pub of published) { if (!byFile.has(pub.file)) byFile.set(pub.file, []); byFile.get(pub.file).push(pub); }
const fileInits = {};
for (const [file, pubs] of byFile) {
  // the module initialiser that assigns this file's constants: esbuild hoists a
  // module's `const X = <literal>` into `var X; init_x = __esm(() => { X = ... })`,
  // so a published constant is found in an initialiser's assigned values, not
  // as a top-level declaration. A literal shared with another module (the same
  // regex in injection-prompts) is told apart by the initialiser that holds
  // the file's OTHER constants too.
  const hashes = pubs.filter(p => p.kind === "value").map(p => ({ p, h: hashOf(p.canonical) }));
  let fileInit = null;
  fileInits[file] = { runnersUp: [] };
  if (hashes.length) {
    const scored = initialisers.map(i => ({ ...i, hits: hashes.filter(x => i.values.has(x.h)).length })).filter(i => i.hits > 0).sort((a, b) => b.hits - a.hits || a.line - b.line);
    if (scored.length && (scored.length === 1 || scored[0].hits > scored[1].hits)) fileInit = scored[0];
    fileInits[file] = { initialiser: fileInit && { short: fileInit.short, line: fileInit.line, hits: fileInit.hits, of: hashes.length, named: namedAs(fileInit.short), suggestedName: `initProtocol${file.replace(/\.ts$/, "").split(/[-_]/).map(w => w[0].toUpperCase() + w.slice(1)).join("")}Module` }, runnersUp: scored.slice(1, 3).map(i => ({ short: i.short, line: i.line, hits: i.hits })) };
  }
  for (const pub of pubs) {
    let candidates = [];
    if (pub.kind === "value") {
      const h = hashOf(pub.canonical);
      if (fileInit && fileInit.values.has(h)) { matches.push({ ...pub, verdict: "in-initialiser", best: { short: fileInit.short, line: fileInit.line, score: 1, named: namedAs(fileInit.short), assigned: true }, candidates: bundleValues.filter(v => v.canonical === pub.canonical).map(v => ({ short: v.short, line: v.line, score: 1, named: namedAs(v.short), topLevelTwin: true })) }); continue; }
      for (const v of bundleValues) if (v.canonical === pub.canonical) candidates.push({ short: v.short, line: v.line, score: 1 });
    } else {
      for (const fn of bundleFns) {
        if (pub.kind === "function" && fn.arity !== pub.arity) continue;
        const s = score(pub.tokens, fn.tokens);
        if (s > 0) candidates.push({ short: fn.short, line: fn.line, score: +s.toFixed(3) });
      }
    }
    candidates.sort((a, b) => b.score - a.score || a.line - b.line);
    candidates = candidates.slice(0, 5);
    for (const c of candidates) { c.named = namedAs(c.short); c.refs = refsOf.get(c.short) ?? []; }
    const best = candidates[0] ?? null, second = candidates[1] ?? null;
    const entry = { ...pub, tokens: undefined, features: pub.features && { p: [...pub.features.p], s: [...pub.features.s], n: [...pub.features.n], g: [...pub.features.g] }, candidates };
    let verdict;
    if (PICKS.has(pub.name)) { const s = PICKS.get(pub.name); const c = candidates.find(c => c.short === s); if (!c) { console.error(`--pick ${s}=${pub.name}: ${s} is not among the candidates (${candidates.map(c => c.short).join(", ")})`); process.exit(2); } verdict = c.named === pub.name ? "confirmed" : c.named ? "conflict" : "picked"; matches.push({ ...entry, verdict, best: c }); continue; }
    if (!best) verdict = "missing";
    else if (best.named === pub.name) verdict = "confirmed"; // a twin elsewhere does not unsettle an existing name
    else if (best.score < MIN) verdict = "weak";
    else if (second && best.score - second.score < LEAD) verdict = "ambiguous";
    else if (best.named) verdict = "conflict";
    else verdict = "unique";
    if (pub.thin && (verdict === "unique" || verdict === "ambiguous")) verdict = "weak"; // too few features to identify anything
    matches.push({ ...entry, verdict, best });
  }
}
// ---- order pass: a module's declarations keep their order in the bundle -------------
// esbuild concatenates a module's top-level statements in source order and ends
// every lazily initialised ESM module with its initialiser (`var init_x =
// __esm(() => ...)`), and a CommonJS module is one `var x = __commonJS(...)`
// statement; so the function-like declarations of one published file are a
// contiguous, order-preserving run between two such boundaries. Anchors are
// the matches above (unique, confirmed, conflict, picked). The file's span is
// from the boundary before its first anchor to the boundary after its last; a
// candidate outside the span is dropped (a twin of isRecord 6000 lines away is
// another module's copy), and a published function in a gap between two
// anchors -- or between the span's edge and an anchor -- is assigned by order
// when the gap holds exactly as many function-like declarations as published
// ones, each with the published arity. That settles identical twins
// (isJobGetParams / isJobArchiveParams) and thin bodies (`return isRecord(v)`),
// which no feature could.
const fnByLine = [...bundleFns].sort((a, b) => a.line - b.line);
const boundaries = [...decls].filter(([, d]) => d.kind === "moduleInit" || d.kind === "var = call").map(([, d]) => d.line).sort((a, b) => a - b);
const boundaryBefore = (line) => { let b = -Infinity; for (const x of boundaries) { if (x < line) b = x; else break; } return b; };
const boundaryAfter = (line) => { for (const x of boundaries) if (x > line) return x; return Infinity; };
const ANCHOR = new Set(["unique", "confirmed", "conflict", "picked"]);
for (const [file, pubs] of byFile) {
  const fns = matches.filter(m => m.file === file && (m.kind === "function" || m.kind === "expression"));
  let anchors = fns.filter(m => ANCHOR.has(m.verdict));
  if (anchors.length < 1) continue;
  const monotone = anchors.every((a, i) => i === 0 || a.best.line > anchors[i - 1].best.line);
  if (!monotone) { for (const m of fns) m.orderNote = "anchors of this file are not in bundle order; no order pass"; continue; }
  const spanLo = boundaryBefore(anchors[0].best.line), spanHi = boundaryAfter(anchors[anchors.length - 1].best.line);
  fileInits[file] = { ...(fileInits[file] ?? {}), span: [spanLo, spanHi] };
  // drop candidates outside the span, and re-judge the unanchored matches
  for (const m of fns) {
    if (ANCHOR.has(m.verdict)) continue;
    const inSpan = m.candidates.filter(c => c.line > spanLo && c.line < spanHi);
    if (inSpan.length === m.candidates.length) continue;
    m.droppedOutsideSpan = m.candidates.length - inSpan.length;
    m.candidates = inSpan;
    const best = inSpan[0] ?? null, second = inSpan[1] ?? null;
    m.best = best;
    if (!best) m.verdict = "missing";
    else if (best.named === m.name) m.verdict = "confirmed";
    else if (best.score < MIN || m.thin) m.verdict = "weak";
    else if (second && best.score - second.score < LEAD) m.verdict = "ambiguous";
    else if (best.named) m.verdict = "conflict";
    else m.verdict = "unique";
  }
  anchors = fns.filter(m => ANCHOR.has(m.verdict));
  const bounds = [spanLo, ...anchors.map(a => a.best.line), spanHi];
  const anchorIdx = fns.map((m, i) => ANCHOR.has(m.verdict) ? i : -1).filter(i => i >= 0);
  const pubGaps = []; let prev = -1;
  for (const ai of anchorIdx) { pubGaps.push(fns.slice(prev + 1, ai)); prev = ai; }
  pubGaps.push(fns.slice(prev + 1));
  for (let g = 0; g < pubGaps.length; g++) {
    const gap = pubGaps[g]; if (!gap.length) continue;
    const lo = bounds[g], hi = bounds[g + 1];
    if (lo === -Infinity || hi === Infinity) { for (const m of gap) m.orderNote = `no module boundary ${lo === -Infinity ? "before" : "after"} ${file}; no order evidence`; continue; }
    const inGap = fnByLine.filter(f => f.line > lo && f.line < hi);
    if (inGap.length !== gap.length) { for (const m of gap) m.orderNote = `bundle gap ${lo}-${hi} holds ${inGap.length} function-like declaration(s) for ${gap.length} published one(s); no order evidence`; continue; }
    for (let i = 0; i < gap.length; i++) {
      const m = gap[i], f = inGap[i];
      if (m.kind === "function" && f.arity !== m.arity) { m.orderNote = `by order ${f.short} @${f.line}, but its arity ${f.arity} is not ${m.arity}`; continue; }
      const named = namedAs(f.short);
      const prior = m.candidates.find(c => c.short === f.short);
      m.best = { short: f.short, line: f.line, score: prior?.score ?? 0, named, byOrder: true, refs: refsOf.get(f.short) ?? [] };
      m.verdict = named === m.name ? "confirmed" : named ? "conflict" : "ordered";
      m.orderNote = `by order: ${i + 1} of ${gap.length} between @${lo} and @${hi}`;
    }
  }
}
const counts = {};
for (const m of matches) counts[m.verdict] = (counts[m.verdict] || 0) + 1;
for (const m of matches) {
  const b = m.best;
  const tail = !b ? "" : ` -> ${b.short} @${b.line} (${b.assigned ? "assigned in initialiser" : b.byOrder ? "by order" : b.score}${b.named ? `, named ${b.named}` : ""})${m.verdict === "ambiguous" ? ` | runner-up ${m.candidates[1].short} @${m.candidates[1].line} (${m.candidates[1].score})` : ""}${m.orderNote && !b.byOrder ? ` [${m.orderNote}]` : ""}`;
  console.log(`${m.verdict.padEnd(9)} ${m.thin ? "thin " : ""}${m.file}:${m.line} ${m.exported ? "export " : ""}${m.kind} ${m.name}${tail}`);
}
for (const [file, fi] of Object.entries(fileInits)) console.log(`module    ${file}: ${fi.span ? `bundle span ${fi.span[0]}-${fi.span[1]}` : "no span (no anchor)"}; initialiser ${fi.initialiser ? `${fi.initialiser.short} @${fi.initialiser.line} assigns ${fi.initialiser.hits} of ${fi.initialiser.of} constants${fi.initialiser.named ? ` (named ${fi.initialiser.named})` : ` -> suggested ${fi.initialiser.suggestedName}`}` : "none found"}${fi.runnersUp.length ? ` (runners-up ${fi.runnersUp.map(r => `${r.short} @${r.line}: ${r.hits}`).join(", ")})` : ""}`);
console.error(`\n${published.length} published declarations in ${files.length} files: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ")}`);
if (REPORT) {
  fs.writeFileSync(REPORT, JSON.stringify({ generatedBy: "match_published_source.mjs", package: PACKAGE, source: { dir: SRC, files: fileHashes }, bundle: path.basename(BUNDLE), min: MIN, lead: LEAD, counts, files: fileInits, matches }, null, 1) + "\n");
  console.error(`report: ${REPORT}`);
}
