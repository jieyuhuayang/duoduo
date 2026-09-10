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
// Recognised forms (the ones CLAUDE.md prescribes):
//   `realName (short)`（`daemon.pretty.js:1234-1299`）
//   `realName (short)`（`1234`）
//   `daemon.pretty.js:1234-1299` (`short`=realName)
// Plus bare `realName` mentions in backticks, which are checked for (1) only.
//
// Usage: node verify_citations.mjs <symbols.json>[,<symbols2.json>...] <doc.md...> [--fix] [--quiet]
import fs from "node:fs";

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

// bundle -> { symbolName -> entry }; also a flat view for unqualified citations.
const byBundle = new Map();
const flat = new Map();
for (const p of INDEXES.split(",")) {
  const idx = JSON.parse(fs.readFileSync(p, "utf8"));
  byBundle.set(idx.bundle, idx.symbols);
  for (const [name, e] of Object.entries(idx.symbols)) {
    if (!flat.has(name)) flat.set(name, { ...e, bundle: idx.bundle });
  }
}
const DEFAULT_BUNDLE = "daemon";

function lookup(name, bundle) {
  if (bundle && byBundle.has(bundle)) {
    const s = byBundle.get(bundle)[name];
    return s ? { ...s, bundle } : null;
  }
  return flat.get(name) || null;
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
// A name that *looks* like a real symbol name: long and camel-cased. Used only
// to decide whether an unresolved citation is worth reporting or is just prose.
const KNOWN_REAL = new Set([...flat.keys()]);
const looksReal = n => n.length >= 8 && /[a-z]/.test(n) && /[A-Z_]/.test(n);

const ID = "[A-Za-z_$][A-Za-z0-9_$]*";
const BUNDLE = "(?:(daemon|cli|stdio)(?:\\.pretty)?\\.js:)?";
// `Real (short)` followed by a （...） or (...) carrying an optional bundle
// prefix and a line or range.
const FORWARD = new RegExp(
  "`(" + ID + ")\\s*\\((" + ID + ")\\)`\\s*[（(]\\s*`?" + BUNDLE + "(\\d{4,6})(?:\\s*[-–]\\s*(\\d{4,6}))?`?",
  "g");
// `bundle.js:1234-1299` (`short`=Real)
const REVERSED = new RegExp(
  "`" + BUNDLE + "(\\d{4,6})(?:\\s*[-–]\\s*(\\d{4,6}))?`\\s*[（(]\\s*`(" + ID + ")`\\s*=\\s*(" + ID + ")",
  "g");
const BARE_NAME = /`([A-Za-z_$][A-Za-z0-9_$]{5,})`/g;

let missingSymbol = 0, wrongMangled = 0, wrongLine = 0, checked = 0, mentions = 0, fixedCount = 0;
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
    const refs = n => srcLines ? (srcLines[Number(n) - 1] || "").includes(sym.mangled) : true;
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
  FORWARD.lastIndex = 0;
  while ((m = FORWARD.exec(text))) handle("forward", m, m[1], m[2], m[3] || DEFAULT_BUNDLE, m[4], m[5]);
  REVERSED.lastIndex = 0;
  while ((m = REVERSED.exec(text))) handle("reversed", m, m[5], m[4], m[1] || DEFAULT_BUNDLE, m[2], m[3]);

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
  const fatal = problems.filter(p => p.sev === "FATAL");
  const fixable = problems.filter(p => p.sev === "fixable");
  for (const p of fatal) console.error(`  FATAL  ${p.doc}:${p.line}  ${p.msg}`);
  for (const p of fixable.slice(0, 40)) console.error(`  fix    ${p.doc}:${p.line}  ${p.msg}`);
  if (fixable.length > 40) console.error(`  ... and ${fixable.length - 40} more fixable line offsets`);
}
console.error(`  citations: ${checked} checked, ${mentions} bare symbol mentions`
  + `; ${missingSymbol} missing symbol, ${wrongMangled} wrong short name, ${wrongLine} wrong line`
  + (FIX ? ` (${fixedCount} rewritten)` : ""));

// Line drift is not a failure — it is regenerable, and --fix regenerates it.
// A vanished symbol or a wrong short name is a real claim about code that is
// no longer true.
process.exit(missingSymbol + wrongMangled > 0 ? 1 : 0);
