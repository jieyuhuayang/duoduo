// Split docs into one file per `## ` section, and join the files back.
//
// The upgrade workflow (.claude/workflows/upgrade-docs.js) gives each agent the
// sections it owns. Several agents editing one 2000-line file at once collide,
// and each re-reads the whole file after every collision; an agent editing its
// own section files does neither. A section is what impact_report.mjs calls a
// unit: the text from one `## ` heading (outside fences) to the next, and
// section 0 is the text before the first heading.
//
// split checks that joining its output reproduces each doc byte for byte
// before it writes anything; join refuses a doc that changed after the split
// (its sha256 no longer matches the manifest), so no edit made to the doc in
// the meantime is overwritten.
//
// Usage: node doc_sections.mjs split <dir> <doc.md...>
//          writes <dir>/<doc name>/NN.md and <dir>/<doc name>/manifest.json
//          ({doc, sha256, sections: [{file, title, startLine}]})
//        node doc_sections.mjs join <dir> [--force]
//          writes every doc a manifest under <dir> names back from its sections
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fencedRanges } from "./anchor_forms.mjs";

const [cmd, dir, ...rest] = process.argv.slice(2);
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
if (!dir || !["split", "join"].includes(cmd) || (cmd === "split" && !rest.length)) {
  console.error("usage: node doc_sections.mjs split <dir> <doc.md...> | join <dir> [--force]");
  process.exit(2);
}

// [{title, start, startLine}]: the offset where each section begins. The same
// rule as impact_report.mjs's section numbers, so its unit `doc#N` is file NN.
function sections(text) {
  const fences = fencedRanges(text);
  const out = [{ title: "(preamble)", start: 0, startLine: 1 }];
  let off = 0, line = 1;
  for (const l of text.split("\n")) {
    if (/^## /.test(l) && !fences.some(([a, b]) => a <= off && off < b)) out.push({ title: l.slice(3).trim(), start: off, startLine: line });
    off += l.length + 1; line++;
  }
  return out;
}

if (cmd === "split") {
  const plans = rest.map((doc) => {
    const text = fs.readFileSync(doc, "utf8");
    const secs = sections(text);
    const parts = secs.map((s, i) => text.slice(s.start, i + 1 < secs.length ? secs[i + 1].start : text.length));
    if (parts.join("") !== text) throw new Error(`${doc}: sections do not reproduce the doc`);
    return { doc: path.resolve(doc), text, secs, parts, out: path.join(dir, path.basename(doc, ".md")) };
  });
  for (const p of plans) {
    fs.rmSync(p.out, { recursive: true, force: true });
    fs.mkdirSync(p.out, { recursive: true });
    const width = Math.max(2, String(p.parts.length - 1).length);
    const files = p.parts.map((part, i) => { const f = String(i).padStart(width, "0") + ".md"; fs.writeFileSync(path.join(p.out, f), part); return f; });
    fs.writeFileSync(path.join(p.out, "manifest.json"), JSON.stringify({
      doc: p.doc, sha256: sha(p.text),
      sections: p.secs.map((s, i) => ({ file: files[i], title: s.title, startLine: s.startLine })),
    }, null, 1) + "\n");
    console.error(`split ${path.relative(process.cwd(), p.doc)} -> ${p.out} (${p.parts.length} sections)`);
  }
} else {
  const force = rest.includes("--force");
  const manifests = fs.readdirSync(dir).map((d) => path.join(dir, d, "manifest.json")).filter((f) => fs.existsSync(f));
  if (!manifests.length) { console.error(`no manifest.json under ${dir}`); process.exit(2); }
  const plans = manifests.map((m) => {
    const man = JSON.parse(fs.readFileSync(m, "utf8"));
    const now = fs.readFileSync(man.doc, "utf8");
    const text = man.sections.map((s) => fs.readFileSync(path.join(path.dirname(m), s.file), "utf8")).join("");
    if (sha(now) !== man.sha256 && now !== text && !force) {
      console.error(`${man.doc} changed after the split; join would overwrite that change (--force to overwrite). Nothing written.`);
      process.exit(1);
    }
    return { m, man, doc: man.doc, text, changed: text !== now };
  });
  for (const p of plans) {
    if (p.changed) fs.writeFileSync(p.doc, p.text);
    // the doc now IS the sections: a later join of further edits must not be
    // refused as an outside change
    fs.writeFileSync(p.m, JSON.stringify({ ...p.man, sha256: sha(p.text) }, null, 1) + "\n");
    console.error(`join ${path.relative(process.cwd(), p.doc)}: ${p.changed ? "written" : "unchanged"}`);
  }
}
