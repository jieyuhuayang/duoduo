// Align the top-level statements of two releases, in order, on their
// normalised text.
//
// fingerprint_match.mjs pairs declarations by structural signature, which is
// unique for most of them; a body that several declarations share (`e =>
// typeof e == "string" && X.includes(e)` for four different X, the two halves
// of a getter pair, a handful of identical validators) matches all its twins at
// once and is reported AMBIGUOUS. release_pairing.mjs resolves a twin by order
// only when it is the one twin inside the window between its nearest matched
// neighbours, so twins that sit next to each other stay unresolved. At v0.8.4
// -> v0.8.5 that left 31 inferred names AMBIGUOUS, 9 of them with no proposal
// and one (isModelRuntime) whose top-ranked candidate was its twin.
//
// Order settles them. Every top-level statement of each bundle is reduced to
// its token stream with every identifier that is not a member name spelled `_`
// (so esbuild's re-mangling disappears, while strings, numbers, member names
// and punctuation stay), and the two sequences are aligned with a patience
// diff: statements whose text is unique in both sides anchor the alignment,
// the stretches between anchors are aligned recursively, and a stretch with no
// unique statement falls back to a longest-common-subsequence table when it is
// small enough. Twins then pair by their position among their neighbours.
//
// A pair is `anchored` when it lies in a run of at least MIN_RUN consecutive
// aligned statements (consecutive on both sides) that contains at least one
// statement unique in both bundles. Only anchored pairs are used to carry a
// name; an unanchored pair is reported, not trusted: twins that moved apart
// without anything unique around them could pair in the wrong order.
//
// Replayed on v0.8.4 -> v0.8.5: 2921 of 2926 old statements aligned, the 5
// left over were exactly the changed declarations, the 31 AMBIGUOUS inferred
// names all resolved, and all 697 names fingerprint_match carried agreed.
//
// Usage: node align_releases.mjs <old.pretty.js> <new.pretty.js> <out.json>
// Output: { counts, pairs: {<oldName>: {new, anchored}}, unmatchedOld: [names], unmatchedNew: [names] }
import { parse } from "@babel/parser";
import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const MIN_RUN = 3;

// one entry per top-level statement: the hash of its normalised tokens, the
// names it declares (in declarator order) and its first line
export function statements(src) {
  const ast = parse(src, { sourceType: "module", tokens: true, errorRecovery: true });
  const toks = ast.tokens;
  const out = [];
  let ti = 0;
  for (const st of ast.program.body) {
    const names = [];
    if (st.type === "VariableDeclaration") { for (const d of st.declarations) names.push(d.id.type === "Identifier" ? d.id.name : null); }
    else if ((st.type === "FunctionDeclaration" || st.type === "ClassDeclaration") && st.id) names.push(st.id.name);
    else if (st.type === "ImportDeclaration") for (const s of st.specifiers) names.push(s.local.name);
    while (ti < toks.length && toks[ti].start < st.start) ti++;
    const parts = [];
    let prev = null;
    while (ti < toks.length && toks[ti].end <= st.end) {
      const t = toks[ti];
      const isName = t.type.label === "name" || t.type.label === "privateName";
      parts.push(isName && !(prev && (prev.type.label === "." || prev.type.label === "?.")) ? "_" : src.slice(t.start, t.end));
      prev = t; ti++;
    }
    out.push({ h: crypto.createHash("sha1").update(parts.join(" ")).digest("hex").slice(0, 16), names, line: st.loc.start.line });
  }
  return out;
}

const DP_LIMIT = 4e6; // cells of the LCS table for a stretch with no unique statement

// patience diff over two arrays of hashes; returns [[i, j], ...] ascending
export function alignHashes(a, b) {
  const out = [];
  const rec = (aLo, aHi, bLo, bHi) => {
    const head = [];
    while (aLo < aHi && bLo < bHi && a[aLo] === b[bLo]) head.push([aLo++, bLo++]);
    const tail = [];
    while (aLo < aHi && bLo < bHi && a[aHi - 1] === b[bHi - 1]) tail.push([--aHi, --bHi]);
    out.push(...head);
    if (aLo < aHi && bLo < bHi) {
      const ca = new Map(), cb = new Map();
      for (let i = aLo; i < aHi; i++) { const e = ca.get(a[i]); ca.set(a[i], e === undefined ? i : -1); }
      for (let j = bLo; j < bHi; j++) { const e = cb.get(b[j]); cb.set(b[j], e === undefined ? j : -1); }
      const anchors = [];
      for (const [h, i] of ca) { if (i < 0) continue; const j = cb.get(h); if (j !== undefined && j >= 0) anchors.push([i, j]); }
      anchors.sort((x, y) => x[0] - y[0]);
      if (anchors.length) {
        // longest increasing subsequence on j (patience sorting)
        const tails = [], prevIdx = new Array(anchors.length);
        for (let k = 0; k < anchors.length; k++) {
          let lo = 0, hi = tails.length;
          while (lo < hi) { const m = (lo + hi) >> 1; if (anchors[tails[m]][1] < anchors[k][1]) lo = m + 1; else hi = m; }
          prevIdx[k] = lo > 0 ? tails[lo - 1] : -1;
          tails[lo] = k;
        }
        const lis = [];
        for (let k = tails[tails.length - 1]; k >= 0; k = prevIdx[k]) lis.push(anchors[k]);
        lis.reverse();
        let pa = aLo, pb = bLo;
        for (const [i, j] of lis) { rec(pa, i, pb, j); out.push([i, j]); pa = i + 1; pb = j + 1; }
        rec(pa, aHi, pb, bHi);
      } else if ((aHi - aLo) * (bHi - bLo) <= DP_LIMIT) {
        const n = aHi - aLo, m = bHi - bLo, W = m + 1;
        const t = new Int32Array((n + 1) * W);
        for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
          t[i * W + j] = a[aLo + i] === b[bLo + j] ? t[(i + 1) * W + j + 1] + 1 : Math.max(t[(i + 1) * W + j], t[i * W + j + 1]);
        let i = 0, j = 0;
        while (i < n && j < m) {
          if (a[aLo + i] === b[bLo + j]) { out.push([aLo + i, bLo + j]); i++; j++; }
          else if (t[(i + 1) * W + j] >= t[i * W + j + 1]) i++; else j++;
        }
      }
    }
    out.push(...tail.reverse());
  };
  rec(0, a.length, 0, b.length);
  return out;
}

// the alignment of two bundles' sources: per old declared name its new name and
// whether the pair is anchored (see header)
export function alignReleases(oldSrc, newSrc) {
  const O = statements(oldSrc), N = statements(newSrc);
  const a = O.map(s => s.h), b = N.map(s => s.h);
  const matches = alignHashes(a, b);
  const count = (arr) => { const c = new Map(); for (const h of arr) c.set(h, (c.get(h) ?? 0) + 1); return c; };
  const ca = count(a), cb = count(b);
  const unique = (i) => ca.get(a[i]) === 1 && cb.get(a[i]) === 1;
  // runs of consecutive matches
  const anchored = new Array(matches.length).fill(false);
  for (let s = 0; s < matches.length;) {
    let e = s + 1;
    while (e < matches.length && matches[e][0] === matches[e - 1][0] + 1 && matches[e][1] === matches[e - 1][1] + 1) e++;
    let hasUnique = false;
    for (let k = s; k < e && !hasUnique; k++) hasUnique = unique(matches[k][0]);
    if (e - s >= MIN_RUN && hasUnique) for (let k = s; k < e; k++) anchored[k] = true;
    s = e;
  }
  const pairs = {}, newOfOld = new Map(), matchedOld = new Set(), matchedNew = new Set();
  matches.forEach(([i, j], k) => {
    matchedOld.add(i); matchedNew.add(j);
    newOfOld.set(i, j);
    O[i].names.forEach((n, p) => { const nn = N[j].names[p]; if (n && nn) pairs[n] = { new: nn, anchored: anchored[k] }; });
  });
  const unmatchedOld = O.flatMap((s, i) => matchedOld.has(i) ? [] : s.names.filter(Boolean));
  const unmatchedNew = N.flatMap((s, j) => matchedNew.has(j) ? [] : s.names.filter(Boolean));
  const counts = {
    oldStatements: O.length, newStatements: N.length, aligned: matches.length,
    anchored: anchored.filter(Boolean).length,
    unalignedOld: O.length - matches.length, unalignedNew: N.length - matches.length,
  };
  return { counts, pairs, unmatchedOld, unmatchedNew, O, N, newOfOld };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [OLD, NEW, OUT] = process.argv.slice(2);
  if (!OLD || !NEW || !OUT) { console.error("usage: node align_releases.mjs <old.pretty.js> <new.pretty.js> <out.json>"); process.exit(2); }
  const r = alignReleases(fs.readFileSync(OLD, "utf8"), fs.readFileSync(NEW, "utf8"));
  fs.writeFileSync(OUT, JSON.stringify({ generatedBy: "tools/align_releases.mjs", old: OLD, new: NEW, counts: r.counts, pairs: r.pairs, unmatchedOld: r.unmatchedOld, unmatchedNew: r.unmatchedNew }, null, 1) + "\n");
  const c = r.counts;
  console.log(`alignment: ${c.aligned} of ${c.oldStatements} old / ${c.newStatements} new top-level statements aligned (${c.anchored} anchored); unaligned: ${c.unalignedOld} old, ${c.unalignedNew} new -> ${OUT}`);
}
