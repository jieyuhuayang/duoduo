// The plain-text half of a release delta: everything upstream ships or commits
// that is not a minified bundle.
//
// The bundles say WHAT changed; the prompts, templates, skills and the
// changelog usually say WHY, in upstream's own words, and they need no
// reconstruction to read. So a bump reads them first. Two sources:
//
//   --pkg <old root> <new root>   the two installed packages (the directory
//                                 holding package.json), minus dist/ and
//                                 node_modules/: bootstrap/ prompts and
//                                 templates, bin/, scripts/, README
//   --git <repo> <old tag> <new tag>
//                                 the upstream repository between two release
//                                 tags: CHANGELOG.md, skills/, subconscious/,
//                                 contrib/ -- minus this repo's own layer
//                                 (docs/, reconstruction/, CLAUDE.md, .github/)
//
// Writes <out>/files.json ([{source, path, status, added, removed}]) and one
// unified diff per source (<out>/package.diff, <out>/upstream.diff).
// Usage: node plaintext_delta.mjs --out <dir> [--pkg <old> <new>] [--git <repo> <old tag> <new tag>]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const take = (flag, n) => { const i = args.indexOf(flag); return i < 0 ? null : args.slice(i + 1, i + 1 + n); };
const OUT = (take("--out", 1) || [])[0];
const PKG = take("--pkg", 2), GIT = take("--git", 3);
if (!OUT || (!PKG && !GIT)) {
  console.error("usage: node plaintext_delta.mjs --out <dir> [--pkg <old root> <new root>] [--git <repo> <old tag> <new tag>]");
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });
const files = [];

// `git diff` exits 1 when the inputs differ; that is its answer, not a failure
const git = (argv) => {
  try { return execFileSync("git", argv, { encoding: "utf8", maxBuffer: 1 << 28 }); }
  catch (e) { if (e.status === 1 && typeof e.stdout === "string") return e.stdout; throw e; }
};
const count = (patch) => {
  let added = 0, removed = 0;
  for (const l of patch.split("\n")) {
    if (l.startsWith("+++") || l.startsWith("---")) continue;
    if (l.startsWith("+")) added++; else if (l.startsWith("-")) removed++;
  }
  return { added, removed };
};

if (PKG) {
  const [oldRoot, newRoot] = PKG.map((p) => path.resolve(p));
  const SKIP = new Set(["dist", "node_modules"]);
  const walk = (root, dir = "", out = new Set()) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (!dir && SKIP.has(e.name)) continue;
      if (e.isDirectory()) walk(root, rel, out); else if (e.isFile()) out.add(rel);
    }
    return out;
  };
  const a = walk(oldRoot), b = walk(newRoot);
  const patches = [];
  for (const rel of [...new Set([...a, ...b])].sort()) {
    const inA = a.has(rel), inB = b.has(rel);
    if (inA && inB && fs.readFileSync(path.join(oldRoot, rel)).equals(fs.readFileSync(path.join(newRoot, rel)))) continue;
    const patch = git(["diff", "--no-index", "--no-color", "--no-prefix", "--", inA ? path.join(oldRoot, rel) : "/dev/null", inB ? path.join(newRoot, rel) : "/dev/null"])
      .split(oldRoot + "/").join("old/").split(newRoot + "/").join("new/");
    patches.push(patch);
    files.push({ source: "package", path: rel, status: inA && inB ? "modified" : inA ? "removed" : "added", ...count(patch) });
  }
  fs.writeFileSync(path.join(OUT, "package.diff"), patches.join(""));
}

if (GIT) {
  const [repo, oldTag, newTag] = GIT;
  const scope = ["--", ".", ":(exclude)docs", ":(exclude)reconstruction", ":(exclude)CLAUDE.md", ":(exclude).github", ":(exclude).claude"];
  const patch = git(["-C", repo, "diff", "--no-color", oldTag, newTag, ...scope]);
  fs.writeFileSync(path.join(OUT, "upstream.diff"), patch);
  const STATUS = { A: "added", D: "removed", M: "modified", T: "modified" };
  const status = new Map(git(["-C", repo, "diff", "--name-status", "--no-renames", oldTag, newTag, ...scope])
    .split("\n").filter(Boolean).map((l) => { const [s, p] = l.split("\t"); return [p, STATUS[s[0]] || s]; }));
  for (const line of git(["-C", repo, "diff", "--numstat", "--no-renames", oldTag, newTag, ...scope]).split("\n").filter(Boolean)) {
    const [add, del, p] = line.split("\t");
    files.push({ source: "upstream", path: p, status: status.get(p) || "modified", added: Number(add) || 0, removed: Number(del) || 0 });
  }
}

fs.writeFileSync(path.join(OUT, "files.json"), JSON.stringify(files, null, 1) + "\n");
const by = (s) => files.filter((f) => f.source === s);
console.error(`plain-text delta -> ${OUT}: ` + ["package", "upstream"].filter((s) => by(s).length || (s === "package" ? PKG : GIT))
  .map((s) => `${s} ${by(s).length} files (+${by(s).reduce((n, f) => n + f.added, 0)}/-${by(s).reduce((n, f) => n + f.removed, 0)})`).join(", "));
