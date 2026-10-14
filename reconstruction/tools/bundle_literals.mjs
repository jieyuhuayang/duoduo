// The literal delta of the bundles the pipeline does not reconstruct.
//
// rebuild.sh and bump.sh cover daemon and cli only: stdio, pi-worker,
// channel-acp and feishu-gateway recover few or no first-party names
// (CLAUDE.md, "Only bundles with a first-party export table"). Their changes
// still reach the docs: at v0.8.4 -> v0.8.5 the Feishu adapter stopped
// switching its reaction to THINKING when the process card appears and gained
// a reader for the post message's `files` attachment zone, and the only way to
// see it was grepping two minified files, where every match drags in fragments
// of surrounding code.
//
// This parses both releases of each bundle with Babel and compares the sets
// of what survives minification: string literals, template-literal text, and
// member and object-key names. It reports what was added and removed, and for
// each removed string or name the doc lines that quote it (a doc may still
// describe the old behaviour), for each added one whether any doc mentions it
// yet. A literal is not behaviour: a removed i18n key ("processCard.thinking")
// says where to look, and the claim is then checked against the code.
//
// Usage: node bundle_literals.mjs --old <dist/release> --new <dist/release> --out <dir>
//          [--bundles stdio,pi-worker,channel-acp,feishu-gateway] <doc.md...>
// Writes <dir>/<bundle>.json and <dir>/literals.md; a byte-identical bundle is
// recorded as unchanged and not parsed.
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import fs from "node:fs";
import path from "node:path";
const traverse = _traverse.default || _traverse;

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const OLD = opt("--old"), NEW = opt("--new"), OUT = opt("--out");
const BUNDLES = opt("--bundles", "stdio,pi-worker,channel-acp,feishu-gateway").split(",");
const DOCS = argv;
if (!OLD || !NEW || !OUT) {
  console.error("usage: node bundle_literals.mjs --old <dist/release> --new <dist/release> --out <dir> [--bundles a,b] <doc.md...>");
  process.exit(2);
}

export function literals(src) {
  const ast = parse(src, { sourceType: "unambiguous", errorRecovery: true, allowReturnOutsideFunction: true });
  const strings = new Set(), names = new Set();
  traverse(ast, {
    StringLiteral(p) { const v = p.node.value; if (v.trim().length >= 3) strings.add(v); },
    TemplateElement(p) { const v = p.node.value.cooked ?? p.node.value.raw; if (v && v.trim().length >= 3) strings.add(v.trim()); },
    MemberExpression(p) { if (!p.node.computed && p.node.property.type === "Identifier") names.add(p.node.property.name); },
    OptionalMemberExpression(p) { if (!p.node.computed && p.node.property.type === "Identifier") names.add(p.node.property.name); },
    ObjectProperty(p) { if (!p.node.computed && p.node.key.type === "Identifier") names.add(p.node.key.name); },
  });
  return { strings, names };
}

const docs = DOCS.map((p) => ({ rel: path.relative(process.cwd(), p), lines: fs.readFileSync(p, "utf8").split("\n") }));
const quoted = (s) => {
  const hits = [];
  // a name is matched as a whole identifier, a string as written
  const test = /^[A-Za-z_$][\w$]*$/.test(s) ? ((re) => (l) => re.test(l))(new RegExp(`(?<![\\w$])${s.replace(/\$/g, "\\$")}(?![\\w$])`)) : (l) => l.includes(s);
  for (const d of docs) d.lines.forEach((l, i) => { if (test(l)) hits.push(`${d.rel}:${i + 1}`); });
  return hits;
};
// short or generic names say nothing on their own
const telling = (s) => s.length >= 4 && !/^\s*$/.test(s);

fs.mkdirSync(OUT, { recursive: true });
const md = ["# Literal delta of the bundles outside the pipeline", ""];
for (const b of BUNDLES) {
  const op = path.join(OLD, `${b}.js`), np = path.join(NEW, `${b}.js`);
  if (!fs.existsSync(op) || !fs.existsSync(np)) { md.push(`## ${b}`, "", "missing in one release", ""); continue; }
  const os = fs.readFileSync(op, "utf8"), ns = fs.readFileSync(np, "utf8");
  if (os === ns) {
    fs.writeFileSync(path.join(OUT, `${b}.json`), JSON.stringify({ bundle: b, unchanged: true }, null, 1) + "\n");
    md.push(`## ${b}`, "", "byte-identical between the releases", "");
    console.log(`${b}: unchanged`);
    continue;
  }
  const A = literals(os), B = literals(ns);
  const diff = (x, y) => [...x].filter((v) => !y.has(v) && telling(v)).sort();
  const r = {
    bundle: b,
    stringsAdded: diff(B.strings, A.strings).map((s) => ({ s, docs: quoted(s) })),
    stringsRemoved: diff(A.strings, B.strings).map((s) => ({ s, docs: quoted(s) })),
    namesAdded: diff(B.names, A.names).map((s) => ({ s, docs: quoted(s) })),
    namesRemoved: diff(A.names, B.names).map((s) => ({ s, docs: quoted(s) })),
  };
  fs.writeFileSync(path.join(OUT, `${b}.json`), JSON.stringify(r, null, 1) + "\n");
  const clip = (s) => JSON.stringify(s.length > 100 ? s.slice(0, 99) + "…" : s).replace(/\|/g, "\\|");
  const row = (e) => `- ${clip(e.s)}${e.docs.length ? ` -- in ${e.docs.slice(0, 4).join(", ")}${e.docs.length > 4 ? ` (+${e.docs.length - 4})` : ""}` : ""}`;
  md.push(`## ${b}`, "",
    `${r.stringsAdded.length} strings added, ${r.stringsRemoved.length} removed; ${r.namesAdded.length} member/key names added, ${r.namesRemoved.length} removed. ` +
    "Removed literals a doc quotes come first: the doc may describe what is gone.", "");
  const sect = (title, list) => {
    if (!list.length) return;
    const sorted = [...list].sort((x, y) => (y.docs.length > 0) - (x.docs.length > 0));
    md.push(`### ${title} (${list.length})`, "", ...sorted.slice(0, 80).map(row), ...(list.length > 80 ? [`- … ${list.length - 80} more in ${b}.json`] : []), "");
  };
  sect("strings removed", r.stringsRemoved);
  sect("names removed", r.namesRemoved);
  sect("strings added", r.stringsAdded);
  sect("names added", r.namesAdded);
  console.log(`${b}: strings +${r.stringsAdded.length}/-${r.stringsRemoved.length}, names +${r.namesAdded.length}/-${r.namesRemoved.length}; ` +
    `${[...r.stringsRemoved, ...r.namesRemoved].filter((e) => e.docs.length).length} removed literal(s) quoted in the docs`);
}
fs.writeFileSync(path.join(OUT, "literals.md"), md.join("\n") + "\n");
console.log(`-> ${path.join(OUT, "literals.md")}`);
