// Catch the anchors that check_doc_anchors.mjs cannot see at all.
//
// That gate works on redundancy: a `Name`(NNNN) citation carries a name AND a
// line, so they can be checked against each other. Most line numbers in the
// docs are written BARE — a number with no symbol attached — and those have no
// redundancy, so nothing can verify them. At the v0.8.1 retarget there were 765
// of them against 150 checkable citations, and manual sampling put the majority
// of the bare ones at stale.
//
// A bare anchor cannot be verified, but a subset can be REFUTED without knowing
// what it meant to point at: the docs only ever cite first-party mechanisms, so
// an anchor landing on a blank line, or inside a function recorded as vendor,
// cannot be a correct citation no matter what the sentence claims. That is the
// whole of this check — high precision, deliberately low recall. The far more
// common failure (pointing at the WRONG first-party function) stays invisible
// here; the only real fix for those is to rewrite them in the `Name`(NNNN) form
// so the other gate can see them.
//
// Exit 1 if any bare anchor is refuted. "plausible" means only "not refutable
// by this check" — never read it as verified.
//
// Usage:
//   node check_bare_anchors.mjs <bundle.pretty.js> <vendor_baseline.json> <doc.md...>
import fs from "node:fs";
import { parse } from "@babel/parser";
const [BUNDLE, VENDOR, ...docs] = process.argv.slice(2);
if (!BUNDLE || !VENDOR || !docs.length) {
  console.error("usage: node check_bare_anchors.mjs <bundle.pretty.js> <vendor_baseline.json> <doc.md...>");
  process.exit(2);
}
const src = fs.readFileSync(BUNDLE, "utf8");
const vj = JSON.parse(fs.readFileSync(VENDOR, "utf8"));
const vendor = new Set(Array.isArray(vj) ? vj : (vj.vendor ?? []));
const ast = parse(src, { sourceType: "module", ranges: true });
const starts = [0];
for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
const lineAt = (o) => { let lo=0,hi=starts.length-1,a=0; while(lo<=hi){const m=(lo+hi)>>1; if(starts[m]<=o){a=m;lo=m+1;}else hi=m-1;} return a+1; };
const decls = [];
for (const s of ast.program.body) {
  if (s.type === "FunctionDeclaration" && s.id) decls.push({name:s.id.name,a:lineAt(s.start),b:lineAt(s.end)});
  else if (s.type === "ClassDeclaration" && s.id) decls.push({name:s.id.name,a:lineAt(s.start),b:lineAt(s.end)});
  else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type==="Identifier") decls.push({name:d.id.name,a:lineAt(s.start),b:lineAt(s.end)});
}
const declFor = (ln) => { let best=null; for(const d of decls) if(d.a<=ln&&ln<=d.b&&(!best||d.a>best.a)) best=d; return best?best.name:null; };
const lines = src.split("\n");
let blank=0, vend=0, ok=0, back=0; const ex=[];
for (const f of docs) {
  const t = fs.readFileSync(f,"utf8");
  // A bare range whose end precedes its start is wrong without any lookup —
  // usually a retarget that moved one endpoint and not the other.
  for (const m of t.matchAll(/`(\d{4,6})`\s*[-–]\s*`?(\d{4,6})`?/g)) {
    if (Number(m[2]) < Number(m[1])) {
      back++;
      const docLine = t.slice(0, m.index).split("\n").length;
      if (ex.length < 12) ex.push(`${f.split("/").pop()} L${docLine}: ${m[1]}-${m[2]} -> RANGE RUNS BACKWARDS`);
    }
  }
  for (const m of t.matchAll(/`(\d{4,6})`/g)) {
    const pre = t.slice(Math.max(0,m.index-130), m.index);
    if (/`[A-Za-z_$][A-Za-z0-9_$]{1,5}`\s*[@（(]\s*$/.test(pre)) continue;
    const ln = Number(m[1]);
    const txt = (lines[ln-1] ?? "").trim();
    const encl = declFor(ln);
    const docLine = t.slice(0,m.index).split("\n").length;
    if (txt === "") { blank++; if(ex.length<8) ex.push(`${f.split("/").pop()} L${docLine}: ${ln} -> BLANK LINE`); }
    else if (encl && vendor.has(encl)) { vend++; if(ex.length<8) ex.push(`${f.split("/").pop()} L${docLine}: ${ln} -> inside VENDOR ${encl}`); }
    else ok++;
  }
}
console.log(`bare anchors examined            : ${blank+vend+ok}`);
console.log(`  REFUTED - lands on a blank line: ${blank}`);
console.log(`  REFUTED - lands in vendor code : ${vend}`);
console.log(`  REFUTED - range runs backwards : ${back}`);
console.log(`  not refutable by this check     : ${ok}  (NOT the same as verified)`);
if (ex.length) { console.log(`\nrefuted:`); ex.forEach(e=>console.log("  "+e)); }
process.exit(blank + vend + back > 0 ? 1 : 0);
