// Remap `daemon.pretty.js:LINE` anchors in docs/ across an upstream version bump.
//
// The analysis docs anchor every mechanism claim to a line in the beautified
// bundle. Those line numbers are the docs' whole credibility story — and every
// upstream release invalidates all of them at once. This tool moves them.
//
// Four strategies, tried in order, each reporting its own confidence:
//
//   0. EXPORT-KEY (exact). Lines inside esbuild's `__export({ realName: () =>
//      mangled })` helper, or a named import, carry a REAL name — which survives
//      minification untouched. Match on that and nothing else is needed.
//   1. STRUCTURAL (exact). If the enclosing top-level declaration is structurally
//      identical across versions (fingerprint_match.mjs says so), the line's
//      offset inside it is preserved verbatim — js-beautify breaks lines on
//      syntax, not on identifier length, so an unchanged function has an
//      unchanged internal line layout. Offset in, offset out.
//   2. ORDER (exact, headers only). A declaration with no unique fingerprint
//      match (trivial bodies collide) is still pinned by its rank between the
//      nearest uniquely-matched declarations on either side — esbuild preserves
//      emission order. Used when the anchor points at the declaration header.
//   3. SKELETON (near-exact). If the enclosing declaration CHANGED, fall back to
//      matching the line's *shape*: every identifier is blanked to `_` while
//      string/number literals survive. This is immune to esbuild's re-mangling.
//      Search is restricted to the paired new declaration (from
//      pair_changes.mjs); ties break by proximity to the expected offset.
//
// Anything left is UNRESOLVED — reported, never guessed. A wrong anchor is worse
// than a stale one, because it reads as verified. In practice the residue is
// exactly the lines whose code genuinely changed this release, which is the set
// a human or agent should be re-reading anyway.
//
// Usage:
//   node remap_doc_anchors.mjs <old.pretty.js> <new.pretty.js> <fpmatch.json> \
//                              <lines.txt> <out.json> [pairs.json]
// lines.txt: whitespace-separated old line numbers (e.g. from
//   grep -ohE 'daemon\.pretty\.js:[0-9]+' docs/*.md | sed 's/.*://' | sort -un)
import fs from "node:fs";
import { parse } from "@babel/parser";

const [, , OLD, NEW, FPJ, LINES, OUT, PAIRSJ] = process.argv;
if (!OLD || !NEW || !FPJ || !LINES || !OUT) {
  console.error("usage: node remap_doc_anchors.mjs <old.pretty.js> <new.pretty.js> <fpmatch.json> <lines.txt> <out.json> [pairs.json]");
  process.exit(2);
}
const oldSrc = fs.readFileSync(OLD, "utf8");
const newSrc = fs.readFileSync(NEW, "utf8");
const oldLines = oldSrc.split("\n");
const newLines = newSrc.split("\n");
const fp = JSON.parse(fs.readFileSync(FPJ, "utf8"));
const pairs = PAIRSJ && fs.existsSync(PAIRSJ) ? (JSON.parse(fs.readFileSync(PAIRSJ, "utf8")).pairs || {}) : {};

function decls(src) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  const lineAt = (o) => { let lo = 0, hi = starts.length - 1, a = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (starts[m] <= o) { a = m; lo = m + 1; } else hi = m - 1; } return a + 1; };
  const list = [];
  const put = (name, s) => list.push({ name, startLine: lineAt(s.start), endLine: lineAt(s.end) });
  for (const s of ast.program.body) {
    if (s.type === "FunctionDeclaration" && s.id) put(s.id.name, s);
    else if (s.type === "ClassDeclaration" && s.id) put(s.id.name, s);
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") put(d.id.name, s);
  }
  list.sort((a, b) => a.startLine - b.startLine);
  return list;
}
const O = decls(oldSrc), N = decls(newSrc);
const newByName = new Map(N.map((d) => [d.name, d]));
const oldByName = new Map(O.map((d) => [d.name, d]));
const enclosing = (list, line) => {
  let ans = null;
  for (const d of list) { if (d.startLine <= line && line <= d.endLine && (!ans || d.startLine > ans.startLine)) ans = d; }
  return ans;
};

// old mangled -> new mangled: unique fingerprint matches, plus explicit pairings
// for declarations whose body changed.
const nameMap = {};
for (const [o, v] of Object.entries(fp.matched)) if (v.unique) nameMap[o] = v.new;
const changed = new Set(fp.changedOld);

// identifier-blind line shape: identifiers -> `_`, literals kept verbatim
const STR = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/;
function skeleton(line) {
  return line.trim().split(STR).map((part, i) =>
    i % 2 === 1 ? part : part.replace(/\b[A-Za-z_$][A-Za-z0-9_$]*\b/g, "_")
  ).join("");
}
// index new-file skeletons once
const skelIdx = new Map();
newLines.forEach((l, i) => {
  const s = skeleton(l);
  if (!s || s.length < 4) return;
  if (!skelIdx.has(s)) skelIdx.set(s, []);
  skelIdx.get(s).push(i + 1);
});

// Some anchors point into esbuild's `__export({ realName: () => mangled })`
// helper blocks or into `import { realName as mangled }` — those lines are NOT
// inside any top-level declaration, but they carry a stable real name, which is
// a far better key than any structural heuristic.
const KEYED = /^\s*(?:([A-Za-z_$][\w$]*)\s*:\s*\(\)\s*=>|([A-Za-z_$][\w$]*)\s+as\s+[A-Za-z_$][\w$]*)/;
const newKeyIdx = new Map();
newLines.forEach((l, i) => {
  const m = KEYED.exec(l);
  if (!m) return;
  const k = m[1] || m[2];
  if (!newKeyIdx.has(k)) newKeyIdx.set(k, []);
  newKeyIdx.get(k).push(i + 1);
});

// Order anchoring: locate an old declaration in the new bundle by its position
// between the nearest uniquely-matched declarations on either side. esbuild
// preserves emission order, so rank inside that window is stable.
const oldRank = new Map(O.map((d, i) => [d.name, i]));
const newRank = new Map(N.map((d, i) => [d.name, i]));
function declByOrder(name) {
  const i = oldRank.get(name);
  if (i == null) return null;
  let prevOld = null, prevNew = null;
  for (let k = i - 1; k >= 0; k--) { const c = nameMap[O[k].name]; if (c && newRank.has(c)) { prevOld = k; prevNew = newRank.get(c); break; } }
  let nextOld = null, nextNew = null;
  for (let k = i + 1; k < O.length; k++) { const c = nameMap[O[k].name]; if (c && newRank.has(c)) { nextOld = k; nextNew = newRank.get(c); break; } }
  if (prevOld == null || nextOld == null) return null;
  // same count of declarations in the window on both sides => rank is unambiguous
  if (nextOld - prevOld !== nextNew - prevNew) return null;
  return N[prevNew + (i - prevOld)] || null;
}

const wanted = fs.readFileSync(LINES, "utf8").split(/\s+/).filter(Boolean).map(Number);
const out = {};
let nStruct = 0, nSkel = 0, nKey = 0, nOrder = 0, nFail = 0;

for (const ln of wanted) {
  const encl = enclosing(O, ln);
  const oldText = (oldLines[ln - 1] || "").trim();

  // 0. stable real-name key (export helper entries / named imports)
  const km = KEYED.exec(oldLines[ln - 1] || "");
  if (km) {
    const hits = newKeyIdx.get(km[1] || km[2]) || [];
    if (hits.length === 1) { out[ln] = { new: hits[0], confidence: "exact", via: "export-key", key: km[1] || km[2], oldText }; nKey++; continue; }
  }

  if (!encl) { out[ln] = { new: null, confidence: "unresolved", note: "no enclosing top-level declaration", oldText }; nFail++; continue; }

  // 1. structural
  if (!changed.has(encl.name) && nameMap[encl.name]) {
    const nd = newByName.get(nameMap[encl.name]);
    if (nd) {
      out[ln] = { new: nd.startLine + (ln - encl.startLine), confidence: "exact", via: "structural",
                  oldFn: encl.name, newFn: nd.name, oldText };
      nStruct++; continue;
    }
  }

  // 2. skeleton, scoped to the paired new declaration when known
  const pairedName = pairs[encl.name] || nameMap[encl.name] || null;
  let nd = pairedName ? newByName.get(pairedName) : null;

  // 2a. no known counterpart: try to place the declaration by emission order
  if (!nd) {
    const byOrder = declByOrder(encl.name);
    if (byOrder) {
      nd = byOrder;
      // an anchor ON the declaration's own header line maps to the header
      if (ln === encl.startLine) {
        out[ln] = { new: nd.startLine, confidence: "exact", via: "order", oldFn: encl.name, newFn: nd.name, oldText };
        nOrder++; continue;
      }
    }
  }
  const skel = skeleton(oldText);
  let cands = (skelIdx.get(skel) || []);
  if (nd) cands = cands.filter((c) => c >= nd.startLine && c <= nd.endLine);
  if (cands.length) {
    // prefer the candidate closest to the proportional position inside the decl
    let pick;
    if (cands.length === 1) pick = cands[0];
    else if (nd) {
      const rel = (ln - encl.startLine) / Math.max(1, encl.endLine - encl.startLine);
      const want = nd.startLine + rel * (nd.endLine - nd.startLine);
      pick = cands.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
    }
    if (pick) {
      out[ln] = { new: pick, confidence: cands.length === 1 ? "exact" : "close",
                  via: "skeleton", oldFn: encl.name, newFn: nd ? nd.name : null,
                  candidates: cands.length, oldText };
      nSkel++; continue;
    }
  }
  out[ln] = { new: null, confidence: "unresolved", via: "skeleton",
              note: cands.length ? `ambiguous (${cands.length})` : "no shape match — the line itself changed",
              oldFn: encl.name, newFn: nd ? nd.name : null, oldText };
  nFail++;
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.error(`lines=${wanted.length}  structural=${nStruct}  export-key=${nKey}  order=${nOrder}  skeleton=${nSkel}  unresolved=${nFail}`);
for (const [ln, r] of Object.entries(out)) {
  if (r.confidence === "unresolved") console.error(`  UNRESOLVED ${ln} (in ${r.oldFn}${r.newFn ? " -> " + r.newFn : ""}): ${r.note}\n              was: ${String(r.oldText).slice(0, 100)}`);
  else if (r.confidence === "close") console.error(`  CLOSE      ${ln} -> ${r.new} (${r.candidates} shape matches in ${r.newFn})`);
}
