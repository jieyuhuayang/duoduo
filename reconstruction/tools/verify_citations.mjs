// Check doc citations by SYMBOL IDENTITY, not by line coordinate.
//
// The existing two gates ask "does line N mention name X". That question dies
// on every upstream release, because esbuild re-lays-out the bundle — which is
// why 25 of this repo's 166 commits are anchor maintenance, and why both of
// those gates are wired non-fatally in rebuild.sh (they would otherwise fail
// the build constantly).
//
// This tool asks three questions instead, in order of how much they matter:
//
//   1. Does the cited symbol still exist?   <- a real upstream change. FATAL.
//   2. Is the short name still that symbol's mangled name?   <- FATAL, and the
//      failure the old gates cannot see: a substring test passes whenever the
//      cited line happens to contain the string.
//   3. Is the line right?   <- DERIVED. Reported with the correct value, and
//      rewritten in place by --fix. Never a reason to hand-edit prose.
//
// Only (1) and (2) can fail the build, so a routine version bump produces a
// mechanical `--fix`, not an archaeology session.
//
// Recognised forms (the ones CLAUDE.md prescribes), checked for (1)-(3):
//   `realName (short)`（`daemon.pretty.js:1234-1299`）
//   `realName (short)`（`1234`）
//   `daemon.pretty.js:1234-1299` (`short`=realName)
// Every other `realName (short)` pairing -- no line, a line in another shape,
// no backticks (diagrams, tables, prose) -- and the `realName/short` shorthand
// (the shapes are anchor_forms.mjs namePair/slashPair) is checked for (1) and
// (2): a short name is a claim about code whatever surrounds it, and those
// forms are exactly where stale ones had accumulated unseen. The gap before the
// parenthesis must be whitespace or a full-width （, so a call like
// `realName(e)` is not read as a citation.
//
// (1) used to apply only to the line-bearing forms: a line-less pair whose real
// name was not in the index was skipped as "not a citation", so
// `readEventByIdSeek (t5e)` outlived its own rename (the function became
// scanPartitionsForEventId) with every check green, and no slash pair was read
// at all. Without a line there is less redundancy to decide "is this a claim
// about code", so an unknown real name is reported only when it is spelled the
// way real names are (looksRealName) and paired with a short-name-shaped token;
// a slash pair additionally needs a short name that is indexed or
// mangled-shaped, because `a/b` is also how prose writes "a or b".
// A line-less pair is judged against ONE bundle: the one a `cli:` / `daemon:`
// prefix names (`cli:main (QXe)`), else the daemon's entry when the daemon has
// that real name, else the other bundle's -- so a cli-only name needs no
// prefix, and a name both bundles have means the daemon's unless it has one.
// Plus bare `realName` mentions in backticks, which are counted only.
//
// Usage: node verify_citations.mjs <symbols.json>[,<symbols2.json>...] <doc.md...> [--fix] [--quiet]
//          [--bundle <name>=<pretty.js>]...
import fs from "node:fs";
import { f1Forward, f1Reversed, namePair, slashPair, looksReal, looksRealName, isShortName, looksMangled, identRe } from "./anchor_forms.mjs";
import { assertBundleMatchesIndex } from "./bundle_guard.mjs";

const argv = process.argv.slice(2);
const FIX = argv.includes("--fix");
const QUIET = argv.includes("--quiet");
// --bundle <name>=<pretty.js>, repeatable. Optional: without it, call-site
// citations cannot be distinguished from stale ones and are accepted.
const bundleSrc = new Map();
for (let i = 0; i < argv.length; i++) {
  if (argv[i] !== "--bundle") continue;
  const [name, path] = (argv[i + 1] || "").split("=");
  if (name && path && fs.existsSync(path)) bundleSrc.set(name, fs.readFileSync(path, "utf8").split("\n"));
  argv.splice(i, 2); i--;
}
const rest = argv.filter(a => a !== "--fix" && a !== "--quiet");
const [INDEXES, ...DOCS] = rest;
if (!INDEXES || !DOCS.length) {
  console.error("usage: node verify_citations.mjs <symbols.json>[,...] <doc.md...> [--fix] [--quiet]");
  process.exit(2);
}

// bundle -> { symbolName -> entry }; also a flat view for unqualified
// citations, in which the daemon's entry wins whatever order the indexes were
// given in (a real name both bundles have, `main`, means the daemon's unless
// the citation says otherwise).
const DEFAULT_BUNDLE = "daemon";
const byBundle = new Map();
const indexVersion = new Map();
const flat = new Map();
for (const p of INDEXES.split(",")) {
  const idx = JSON.parse(fs.readFileSync(p, "utf8"));
  byBundle.set(idx.bundle, idx.symbols);
  indexVersion.set(idx.bundle, idx.version);
  for (const [name, e] of Object.entries(idx.symbols)) {
    if (!flat.has(name) || idx.bundle === DEFAULT_BUNDLE) flat.set(name, { ...e, bundle: idx.bundle });
  }
}

function lookup(name, bundle) {
  if (bundle && byBundle.has(bundle)) {
    const s = byBundle.get(bundle)[name];
    return s ? { ...s, bundle } : null;
  }
  return flat.get(name) || null;
}
// Every OTHER bundle's entry for a real name, for the hint on a stale pair. A
// real name can exist in more than one bundle (`main` is `Fyt` in the daemon
// and `QXe` in the cli). An unqualified line-less pair is judged by lookup()
// alone -- the daemon's entry when there is one -- and a pair about the cli's
// symbol of that name says so: `cli:main (QXe)`. Accepting ANY bundle's short
// name for an unqualified pair (as this tool briefly did) let a daemon-context
// `main (QXe)` pass, and every real name added to the cli that the daemon also
// has would have widened that gap.
function elsewhere(name, bundle) {
  const out = [];
  for (const [b, syms] of byBundle) if (b !== bundle && Object.hasOwn(syms, name)) out.push({ ...syms[name], bundle: b });
  return out;
}
// the bundle a line-less pair names by a `cli:` / `daemon:` prefix, as the
// name-bound form `code`（`cli:realName`） does
const QUALIFIER = /(?<![A-Za-z0-9_$.])(daemon|cli|stdio):$/;

// A line check against the wrong bundle reports drift on correct citations, and
// --fix would then rewrite them.
for (const [b, src] of bundleSrc) {
  const syms = byBundle.get(b);
  if (syms) assertBundleMatchesIndex(src, { bundle: b, version: indexVersion.get(b), symbols: syms }, b);
}

// Reverse view: mangled short name -> real name, per bundle.
const reverse = new Map();
for (const [b, syms] of byBundle) {
  const r = new Map();
  for (const [real, e] of Object.entries(syms)) r.set(e.mangled, real);
  reverse.set(b, r);
}
function mangledOf(short, bundle) {
  const r = reverse.get(bundle) || reverse.get(DEFAULT_BUNDLE);
  const real = r?.get(short);
  return real ? { real, mangled: short } : null;
}
// short name -> the real names it belongs to in any bundle ("real (cli)" for
// cli), for the hint on a stale pair: the short name usually survived and
// names the function the doc meant
function ownersOf(short) {
  const out = [];
  for (const [b, r] of reverse) if (r.has(short)) out.push(b === DEFAULT_BUNDLE ? r.get(short) : `${r.get(short)} (${b})`);
  return out;
}
// looksReal (loose, for the line-bearing F1 below) is shared with
// check_bare_anchors.mjs through anchor_forms.mjs: that tool treats an F1 line
// number as owned exactly when handle() below would check it.

// F1 shapes live in anchor_forms.mjs, shared with check_bare_anchors.mjs, which
// has to know exactly which line numbers this tool already covers.
const FORWARD = f1Forward();
const REVERSED = f1Reversed();
// any `Real (short)` / Real (short) / Real（short）, and Real/short
const PAIR = namePair();
const SLASH = slashPair();
const BARE_NAME = /`([A-Za-z_$][A-Za-z0-9_$]{5,})`/g;

let missingSymbol = 0, wrongMangled = 0, wrongLine = 0, checked = 0, pairs = 0, slashPairs = 0, mentions = 0, fixedCount = 0;
const problems = [];

for (const doc of DOCS) {
  let text = fs.readFileSync(doc, "utf8");
  const lineOf = off => text.slice(0, off).split("\n").length;
  const edits = []; // {start, end, text}

  const handle = (kind, m, real, short, bundle, from, to) => {
    // Disambiguate `Real (short)` from `short(arg)` using the index itself, not
    // punctuation: docs write both, e.g. `batchDrainItems (HB)`（65926） and
    // `tbe(c)`（66013）. Guessing from spacing misreads the second as a claim
    // that `tbe` is a real name.
    if (!lookup(real, bundle)) {
      const asShort = mangledOf(real, bundle);
      if (asShort) { real = asShort.real; short = asShort.mangled; }
      else if (!looksReal(real)) return;  // neither half is ours: prose or an
                                          // internal short name we do not cover
    }
    checked++;
    const sym = lookup(real, bundle);
    if (!sym) {
      // The citation names something in real-name shape that the index does not
      // have. Either upstream removed it, or it is an internal function that was
      // hand-named for the docs but never recorded in maps/inferred_*.json.
      missingSymbol++;
      problems.push({ sev: "FATAL", doc, line: lineOf(m.index), msg: `symbol \`${real}\` is not in the index for ${bundle || "any covered bundle"} — deleted upstream, or hand-named in prose but absent from maps/inferred_*.json?` });
      return;
    }
    if (short && sym.mangled !== short) {
      wrongMangled++;
      problems.push({ sev: "FATAL", doc, line: lineOf(m.index), msg: `\`${real}\` is \`${sym.mangled}\`, cited as \`${short}\`` });
    }
    // Two citation habits are both legitimate and both must pass:
    //   - a line INSIDE the declaration: the specific statement that proves the
    //     claim, more precise than the function header;
    //   - a CALL SITE elsewhere in the bundle: "this is where it is invoked".
    // So a line holds if it is in range, or if that line really does mention
    // the mangled name. Only a line that is neither is stale.
    const srcLines = bundleSrc.get(sym.bundle || bundle || DEFAULT_BUNDLE);
    const inside = n => Number(n) >= sym.line && Number(n) <= sym.endLine;
    // whole-identifier match: a substring test accepts any line that happens to
    // contain the letters (`on` is inside half the bundle)
    const mention = identRe(sym.mangled);
    const refs = n => srcLines ? mention.test(srcLines[Number(n) - 1] || "") : true;
    const holds = n => inside(n) || refs(n);
    const drifted = from && (!holds(from) || (to && !holds(to)));
    if (drifted) {
      wrongLine++;
      problems.push({ sev: "fixable", doc, line: lineOf(m.index), msg: `\`${real}\` spans ${sym.line}-${sym.endLine}, cited as ${from}${to ? `-${to}` : ""} (outside)` });
      if (FIX) {
        const whole = m[0];
        let replaced = whole.replace(new RegExp("\\b" + from + "\\b"), String(sym.line));
        if (to) replaced = replaced.replace(new RegExp("\\b" + to + "\\b"), String(sym.endLine));
        edits.push({ start: m.index, end: m.index + whole.length, text: replaced });
      }
    }
  };

  let m;
  const seenPair = new Set(); // offsets already checked by FORWARD, so PAIR does not double count
  FORWARD.lastIndex = 0;
  while ((m = FORWARD.exec(text))) { seenPair.add(m.index + 1); handle("forward", m, m[1], m[2], m[3] || DEFAULT_BUNDLE, m[4], m[5]); }
  REVERSED.lastIndex = 0;
  while ((m = REVERSED.exec(text))) handle("reversed", m, m[5], m[4], m[1] || DEFAULT_BUNDLE, m[2], m[3]);

  // P: line-less pairs, (1) and (2) only.
  const pair = (m, real, short, slash) => {
    if (short === real) return;
    const q = (text.slice(Math.max(0, m.index - 8), m.index).match(QUALIFIER) || [])[1];
    const bundle = q && byBundle.has(q) ? q : undefined;
    const sym = lookup(real, bundle);
    const owners = ownersOf(short);
    const shape = (q ? q + ":" : "") + (slash ? `${real}/${short}` : `${real} (${short})`);
    if (sym) {
      // `a/b` also writes "a or b". With an indexed real name on the left that
      // reading is all but unused, so the right half counts whenever it is
      // shaped like a short name and is not itself a real name
      // (`atomicAppendEvent/main`). It used to need an indexed owner or a
      // mangled shape as well, and a stale all-lowercase short name owned by
      // nothing -- `drainRecordPath/zb`, the usual state after a bump, when an
      // old short name lands on one of the ~2400 unindexed declarations --
      // passed unread.
      if (slash && (flat.has(short) || !isShortName(short))) return;
      pairs++; if (slash) slashPairs++;
      if (sym.mangled === short) return;
      wrongMangled++;
      const other = elsewhere(real, sym.bundle).find(s => s.mangled === short);
      problems.push({ sev: "FATAL", doc, line: lineOf(m.index), msg: `\`${real}\` is \`${sym.mangled}\`${sym.bundle === DEFAULT_BUNDLE ? "" : ` (${sym.bundle})`}, cited as \`${shape}\``
        + (other ? `; \`${short}\` is its ${other.bundle} symbol -- write \`${other.bundle}:${real} (${short})\` for that one`
          : owners.length ? `; \`${short}\` is ${owners.map(o => `\`${o}\``).join(", ")}` : "") });
      return;
    }
    // qualified for a bundle that does not have it: `cli:createSpineEvent (x)`
    if (bundle && flat.has(real)) {
      pairs++; if (slash) slashPairs++;
      missingSymbol++;
      const there = flat.get(real);
      problems.push({ sev: "FATAL", doc, line: lineOf(m.index), msg: `\`${shape}\`: \`${real}\` is not in the ${bundle} index; it is ${there.bundle}'s \`${there.mangled}\`` });
      return;
    }
    // The real name is in no index. Report it only if it is spelled like one
    // and paired with something shaped like a short name. A slash pair, which
    // prose also writes, needs a short name that is indexed or mangled-shaped
    // (`vanishedSymbolName/Xq9`), not a word (`ALADUO_BOOTSTRAP_DIR/meta`).
    if (!looksRealName(real) || !isShortName(short) || (slash && !(owners.length || looksMangled(short)))) return;
    pairs++; if (slash) slashPairs++;
    missingSymbol++;
    problems.push({ sev: "FATAL", doc, line: lineOf(m.index), msg: `\`${shape}\`: \`${real}\` is in no symbol index — deleted or renamed upstream, or hand-named in prose but absent from maps/inferred_*.json?`
      + (owners.length ? ` \`${short}\` is now ${owners.map(o => `\`${o}\``).join(", ")}` : "") });
  };
  PAIR.lastIndex = 0;
  while ((m = PAIR.exec(text))) if (!seenPair.has(m.index)) pair(m, m[1], m[2], false);
  SLASH.lastIndex = 0;
  while ((m = SLASH.exec(text))) pair(m, m[1], m[2], true);

  // Bare mentions: a backticked identifier of 6+ chars that IS a known symbol
  // name is a claim about code, even without a line. Worth counting, and worth
  // catching if the symbol later disappears. Unknown identifiers are ignored —
  // prose is full of backticked words that are not symbols.
  BARE_NAME.lastIndex = 0;
  while ((m = BARE_NAME.exec(text))) if (flat.has(m[1])) mentions++;

  if (FIX && edits.length) {
    edits.sort((a, b) => b.start - a.start);
    for (const e of edits) text = text.slice(0, e.start) + e.text + text.slice(e.end);
    fs.writeFileSync(doc, text);
    fixedCount += edits.length;
  }
}

if (!QUIET) {
  // one pass per citation shape finds them out of order; report in doc order
  problems.sort((a, b) => a.doc.localeCompare(b.doc) || a.line - b.line);
  const fatal = problems.filter(p => p.sev === "FATAL");
  const fixable = problems.filter(p => p.sev === "fixable");
  for (const p of fatal) console.error(`  FATAL  ${p.doc}:${p.line}  ${p.msg}`);
  for (const p of fixable.slice(0, 40)) console.error(`  fix    ${p.doc}:${p.line}  ${p.msg}`);
  if (fixable.length > 40) console.error(`  ... and ${fixable.length - 40} more fixable line offsets`);
}
console.error(`  citations: ${checked} checked with line, ${pairs} more name/short pairs checked (${slashPairs} written real/short), ${mentions} bare symbol mentions`
  + `; ${missingSymbol} missing symbol, ${wrongMangled} wrong short name, ${wrongLine} wrong line`
  + (FIX ? ` (${fixedCount} rewritten)` : ""));

// Line drift is not a failure — it is regenerable, and --fix regenerates it.
// A vanished symbol or a wrong short name is a real claim about code that is
// no longer true.
process.exit(missingSymbol + wrongMangled > 0 ? 1 : 0);
