// Where each first-party symbol of the current release first appeared, and in
// which releases its body changed -- walked back through every published
// release of @openduo/duoduo.
//
// esbuild re-mangles every identifier on every build, so a symbol's name does
// not survive a release; its body mostly does. fingerprint_match.mjs pairs two
// consecutive releases' top-level declarations by structural signature, and
// pair_changes.mjs pairs the changed ones by their position between matched
// neighbours. This tool chains those pairings, release by release, from the
// current bundle backwards: for each current mangled name it follows the
// unique reverse match (identical body, else the positional pair) into the
// previous release, until no release has a counterpart. The release where the
// walk ends is where the symbol first appeared; every release where the step
// was a positional pair rather than an identical body is one where it changed.
//
// The result is evidence of a kind the bundle alone does not carry: a symbol
// born in v0.6.1 is described by that release's CHANGELOG entry, which was
// written by the author. `changelog_pairs` (a later step) matches the entries
// to the births; this tool only records the chain.
//
// Inputs: a history directory holding versions.txt (ascending), fp/<a>__<b>.json
// (fingerprint_match) and pairs/<a>__<b>.json (pair_changes) for each
// consecutive pair, and the current rename map (mangled -> real).
//
// A third pairing, by features (decl_features.mjs: property names, strings,
// numbers, globals, arity), takes over when a release rewrote a function so
// much that the positional pairing gave up (unequal window counts): among the
// previous release's declarations that no identical match claimed, inside the
// window between the nearest identically-matched neighbours, the candidate
// with the best weighted Jaccard score wins when it scores at least --min
// and leads the runner-up by --lead. Each step records how it was made.
//
// Usage: node history_chain.mjs <history dir> <rename_daemon.json> <out.json> [--package @openduo/duoduo] [--min 0.5] [--lead 0.1] [--slim]
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); if (i === -1) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const PACKAGE = opt("--package", "@openduo/duoduo");
const MIN = Number(opt("--min", 0.5)), LEAD = Number(opt("--lead", 0.1));
// --slim: the committed form (maps/history_daemon.json): no per-release mangled
// chain, only first release, changed releases and the steps made by similarity
const si = argv.indexOf("--slim"); const SLIM = si !== -1; if (SLIM) argv.splice(si, 1);
const [HIST, RENAME, OUT] = argv;
if (!HIST || !RENAME || !OUT) { console.error("usage: node history_chain.mjs <history dir> <rename_daemon.json> <out.json> [--package name]"); process.exit(2); }

const versions = fs.readFileSync(path.join(HIST, "versions.txt"), "utf8").split("\n").filter(Boolean);
const rename = JSON.parse(fs.readFileSync(RENAME, "utf8"));
const current = versions[versions.length - 1];

const features = new Map(); // version -> decl_features output (loaded lazily)
const featuresOf = v => { if (!features.has(v)) { const f = path.join(HIST, "features", `${v}.json`); features.set(v, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null); } return features.get(v); };

// per consecutive pair: reverse maps new -> old
const steps = []; // index i: from versions[i] to versions[i+1]
for (let i = 0; i + 1 < versions.length; i++) {
  const a = versions[i], b = versions[i + 1];
  const fp = JSON.parse(fs.readFileSync(path.join(HIST, "fp", `${a}__${b}.json`), "utf8"));
  const pr = JSON.parse(fs.readFileSync(path.join(HIST, "pairs", `${a}__${b}.json`), "utf8"));
  const identical = new Map(), changed = new Map(), twins = new Map(); // twins: new -> [old candidates with the same body]
  for (const [old, m] of Object.entries(fp.matched)) {
    if (m.unique) identical.set(m.new, old);
    else for (const nu of m.new) (twins.get(nu) ?? twins.set(nu, []).get(nu)).push(old);
  }
  for (const [old, nu] of Object.entries(pr.pairs ?? {})) if (!identical.has(nu)) changed.set(nu, old);
  steps.push({ from: a, to: b, identical, changed, twins, claimedOld: new Set([...identical.values(), ...changed.values()]), similar: new Map() });
}

// weighted Jaccard over the four feature kinds
const W = { p: 1, s: 1.5, n: 0.5, g: 0.5 };
function score(x, y) {
  let inter = 0, union = 0;
  for (const k of Object.keys(W)) {
    const A = new Set(x[k]), B = new Set(y[k]);
    for (const t of A) { union += W[k]; if (B.has(t)) inter += W[k]; }
    for (const t of B) if (!A.has(t)) union += W[k];
  }
  return union ? inter / union : 0;
}
const thin = f => (f.p.length + f.s.length + f.n.length + f.g.length) < 3;
const family = k => /function|class|module-init/.test(k) ? "code" : "data";

// the window of old positions `name` (in release s.to) can map into: between
// the nearest neighbours in the new order that have a known old counterpart.
// strict=false widens an empty or inverted window by 400 declarations.
function windowOf(s, name, FN, FO) {
  const f = FN.decls[name];
  if (!f) return null;
  const order = FN.order, idx = f.i;
  const oldIdx = n => { const o = s.identical.get(n) ?? s.changed.get(n); return o && FO.decls[o] ? FO.decls[o].i : null; };
  let lo = null, hi = null;
  for (let j = idx - 1; j >= 0 && lo === null; j--) lo = oldIdx(order[j]);
  for (let j = idx + 1; j < order.length && hi === null; j++) hi = oldIdx(order[j]);
  if (lo === null) lo = -1;
  if (hi === null) hi = FO.order.length;
  const strict = hi > lo;
  if (!strict) { lo = Math.max(-1, lo - 400); hi = Math.min(FO.order.length, hi + 400); }
  return { lo, hi, strict };
}

// a new declaration whose body several old declarations share (`e => X.includes(e)`
// twins): the one inside the window wins when it is the only one there
function twin(s, name) {
  const cands = s.twins.get(name);
  if (!cands) return undefined;
  const FN = featuresOf(s.to), FO = featuresOf(s.from);
  if (!FN || !FO) return undefined;
  const w = windowOf(s, name, FN, FO);
  if (!w) return undefined;
  const inside = cands.filter(o => !s.claimedOld.has(o) && FO.decls[o] && FO.decls[o].i > w.lo && FO.decls[o].i < w.hi);
  return inside.length === 1 ? inside[0] : undefined;
}

// overlap coefficient: how much of the smaller feature set the other contains --
// what survives when a body grows a lot between releases (an initialiser that
// gained a module's worth of constants) and Jaccard falls below MIN
function overlap(x, y) {
  let inter = 0, a = 0, b = 0;
  for (const k of Object.keys(W)) {
    const A = new Set(x[k]), B = new Set(y[k]);
    a += A.size * W[k]; b += B.size * W[k];
    for (const t of A) if (B.has(t)) inter += W[k];
  }
  const m = Math.min(a, b);
  return m ? inter / m : 0;
}

// similarity fallback for `name` (in release s.to) across step s; returns the old name or undefined
function similar(s, name) {
  if (s.similar.has(name)) return s.similar.get(name);
  const FN = featuresOf(s.to), FO = featuresOf(s.from);
  let result;
  const f = FN?.decls[name];
  if (f && !thin(f) && FO) {
    const w = windowOf(s, name, FN, FO);
    const scored = [];
    for (let j = w.lo + 1; j < w.hi; j++) {
      const on = FO.order[j], of = FO.decls[on];
      if (s.claimedOld.has(on) || !of || thin(of)) continue;
      if (family(of.kind) !== family(f.kind)) continue;
      // a parameter added or dropped is an ordinary change; two or more is another function
      if (f.arity != null && of.arity != null && Math.abs(f.arity - of.arity) > 1) continue;
      scored.push([score(f, of), on, overlap(f, of)]);
    }
    scored.sort((x, y) => y[0] - x[0]);
    const lead = scored.length === 1 || (scored.length > 1 && scored[0][0] - scored[1][0] >= LEAD);
    if (scored.length && scored[0][0] >= MIN && lead) result = { old: scored[0][1], score: +scored[0][0].toFixed(3) };
    // a grown body: most of the smaller side is in the larger, inside a strict window, and leads
    else if (scored.length && w.strict && scored[0][2] >= 0.75 && scored[0][0] >= 0.25 && lead) result = { old: scored[0][1], score: +scored[0][0].toFixed(3), overlap: +scored[0][2].toFixed(3) };
  }
  s.similar.set(name, result);
  return result;
}

const symbols = {};
const byVersion = {};
const untraceableList = [];
for (const v of versions) byVersion[v] = { born: [], changed: [] };
for (const [mangled, real] of Object.entries(rename)) {
  let name = mangled;
  const chain = { [current]: mangled };
  const changes = [];
  let firstSeen = current;
  const how = {};
  let untraceable = null;
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    let prev = s.identical.get(name);
    if (prev !== undefined) how[s.to] = "identical";
    else {
      prev = s.changed.get(name);
      if (prev !== undefined) how[s.to] = "positional";
      else if ((prev = twin(s, name)) !== undefined) { how[s.to] = "identical (twin by order)"; s.claimedOld.add(prev); }
      else {
        // a declaration with (almost) no features -- an uninitialised `var`,
        // a one-line predicate -- cannot be followed by similarity, and its
        // walk ending here says nothing about where it first appeared
        const f = featuresOf(s.to)?.decls[name];
        if (!f || thin(f) || family(f.kind) === "data") { untraceable = `${f ? f.kind : "declaration"} with too few features to follow past v${s.to}`; break; }
        const sim = similar(s, name);
        if (!sim) break;
        prev = sim.old; how[s.to] = `similar ${sim.score}${sim.overlap ? ` (overlap ${sim.overlap})` : ""}`;
        s.claimedOld.add(prev);
      }
      if (!how[s.to].startsWith("identical")) changes.push(s.to);
    }
    name = prev;
    chain[s.from] = prev;
    firstSeen = s.from;
  }
  changes.reverse();
  const similarSteps = Object.entries(how).filter(([, k]) => k.startsWith("similar")).map(([v, k]) => `${v}:${k.slice(8)}`);
  symbols[real] = SLIM ? { mangled, firstSeen: untraceable ? null : firstSeen, changedIn: changes, ...(untraceable ? { untraceable } : {}), ...(similarSteps.length ? { similarSteps } : {}) }
    : { mangled, firstSeen: untraceable ? null : firstSeen, changedIn: changes, releases: Object.keys(chain).length, chain, how, ...(untraceable ? { untraceable } : {}) };
  if (untraceable) untraceableList.push(real); else byVersion[firstSeen].born.push(real);
  for (const c of changes) byVersion[c].changed.push(real);
}
for (const v of versions) { byVersion[v].born.sort(); byVersion[v].changed.sort(); }

const out = {
  generatedBy: "tools/history_chain.mjs (tools/history.sh)",
  method: "release to release: identical body (fingerprint_match.mjs), else positional pair (pair_changes.mjs), else feature similarity (decl_features.mjs, min " + MIN + ", lead " + LEAD + "); firstSeen is where the walk ends",
  package: PACKAGE,
  current,
  versions,
  symbolCount: Object.keys(symbols).length,
  symbols: Object.fromEntries(Object.keys(symbols).sort().map(k => [k, symbols[k]])),
  byVersion,
  untraceable: untraceableList.sort(),
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
const born = versions.map(v => `${v}:${byVersion[v].born.length}`).filter(s => !s.endsWith(":0"));
console.log(`history: ${out.symbolCount} symbols over ${versions.length} releases, ${untraceableList.length} untraceable (no features); born per release: ${born.join(" ")}`);
