// Where the docs mention each symbol: shared by symbol_card.mjs and
// doc_coverage.mjs.
//
// A mention is a real name spelled as a whole word inside a backtick span --
// which covers every citation form the build checks (`真名 (短名)`,
// `代码片段`（`真名`）, `cli:真名`, `real/short`) and the bare `真名` in a
// table or a sentence. It is counted under the nearest `##`/`###`/`####`
// heading above it. This is a locator for readers and a coverage measure, not
// a checker: verify_citations.mjs and check_bare_anchors.mjs decide whether a
// citation is valid.
import fs from "node:fs";
import path from "node:path";

// docs: [paths]; names: Set of real names. Returns Map real -> [{doc, section, line, count}]
export function scanDocs(docs, names) {
  const hits = new Map();
  for (const doc of docs) {
    const text = fs.readFileSync(doc, "utf8");
    const lines = text.split("\n");
    let section = "(top)";
    let inFence = false;
    const perSection = new Map(); // real -> Map(section -> {line, count})
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      if (/^```/.test(L)) inFence = !inFence;
      if (!inFence && /^#{2,4} /.test(L)) section = L.replace(/^#+ /, "").trim();
      const spans = inFence ? [L] : [...L.matchAll(/`([^`]+)`/g)].map(m => m[1]);
      for (const span of spans) {
        for (const w of span.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? []) {
          if (!names.has(w)) continue;
          const m = perSection.get(w) ?? perSection.set(w, new Map()).get(w);
          const s = m.get(section);
          if (s) s.count++; else m.set(section, { line: i + 1, count: 1 });
        }
      }
    }
    for (const [real, m] of perSection) {
      const list = hits.get(real) ?? hits.set(real, []).get(real);
      for (const [sec, { line, count }] of m) list.push({ doc: path.basename(doc), section: sec, line, count });
    }
  }
  return hits;
}
