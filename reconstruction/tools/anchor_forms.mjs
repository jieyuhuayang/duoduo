// The citation shapes the docs are allowed to use, in one place.
//
// Three checkers each own one shape, and a fourth (check_bare_anchors.mjs) has
// to know which line numbers the other three already cover, so that it can
// police everything else. When each tool carried its own copy of the regexes,
// "covered" meant whatever the copy happened to say, and a number could fall
// between two tools and be checked by neither. Every pattern here is a factory:
// these are /g regexes, and a shared instance would share lastIndex.
//
//   F1  `real (short)`（`N`）            verify_citations.mjs   symbol identity
//   F2  `short`（`N`）, `short`@N, ...   check_doc_anchors.mjs  short name on the line
//   F3  `code`（`N`）                    check_bare_anchors.mjs a token of the code on the line
//
// Anything else holding a line number is UNBOUND: nothing can tell whether it
// still points where it meant to.

export const ID = "[A-Za-z_$][A-Za-z0-9_$]*";

// --- F1 -------------------------------------------------------------------
const F1_BUNDLE = "(?:(daemon|cli|stdio)(?:\\.pretty)?\\.js:)?";
// `Real (short)` followed by a （...） or (...) carrying an optional bundle
// prefix and a line or range.
export const f1Forward = () => new RegExp(
  "`(" + ID + ")\\s*\\((" + ID + ")\\)`\\s*[（(]\\s*`?" + F1_BUNDLE + "(\\d{1,6})(?:\\s*[-–]\\s*(\\d{1,6}))?`?",
  "g");
// `bundle.js:1234-1299` (`short`=Real)
export const f1Reversed = () => new RegExp(
  "`" + F1_BUNDLE + "(\\d{1,6})(?:\\s*[-–]\\s*(\\d{1,6}))?`\\s*[（(]\\s*`(" + ID + ")`\\s*=\\s*(" + ID + ")",
  "g");

// --- F2 -------------------------------------------------------------------
// Four interchangeable syntaxes, any of them with a range:
//   A  `Name`(12345)  `Name`（`12345`）  `Name`(`daemon.pretty.js:12345`)
//   B  `Name`@12345
//   D  `daemon.pretty.js:12345-12399` (Name)
// CLAUDE.md prescribes the "真名 (短名)" form, and only the short name exists in
// the bundle, so NAME also accepts `real (short)` and captures the short one.
// The parenthetical does not have to close right after the number — the docs
// annotate inside it (`zGe`(31957 定义/31968 调用)) — so the trailer only
// ensures the number was not cut out of a longer one.
const F2_FILEQ = "(?:((?:daemon|cli|stdio))(?:\\.pretty)?\\.js:)?";
const F2_LINESPEC = "`?" + F2_FILEQ + "(\\d{4,6})(?:\\s*[-–]\\s*(\\d{4,6}))?`?";
const F2_NAME = "`(?:[A-Za-z_$][A-Za-z0-9_$]*\\s*\\(\\s*)?([A-Za-z_$][A-Za-z0-9_$]{1,5})\\)?`";
// n: short name group, f: bundle qualifier, a/b: line / range end
export const f2Cites = () => [
  { re: new RegExp(F2_NAME + "\\s*[（(]\\s*" + F2_LINESPEC + "(?![0-9])", "g"), n: 1, f: 2, a: 3, b: 4 },
  { re: new RegExp(F2_NAME + "\\s*@\\s*" + F2_LINESPEC, "g"), n: 1, f: 2, a: 3, b: 4 },
  { re: new RegExp("`" + F2_FILEQ + "(\\d{4,6})(?:\\s*[-–]\\s*(\\d{4,6}))?`\\s*[（(]\\s*([A-Za-z_$][A-Za-z0-9_$]{1,5})\\s*[）)]", "g"), n: 4, f: 1, a: 2, b: 3 },
];

// --- every line number, bound or not ---------------------------------------
// A code span whose whole content is a line or range, optionally qualified by
// bundle. `daemon:59735` is accepted as a qualifier so that it is SEEN (and
// reported as unbound) rather than silently skipped; it is not a valid form.
// A leading zero means it is not a line number (`0700` is a file mode).
export const lineSpan = () =>
  /`(?:(daemon|cli|stdio)(?:\.pretty)?(?:\.js)?:)?([1-9]\d{3,5})(?:\s*[-–]\s*(\d{4,6}))?`/g;

// --- line numbers lineSpan() cannot see -------------------------------------
// lineSpan() only matches a code span that is exactly one line or range, so a
// number written any other way used to be examined by nothing at all:
//
//   plain text   | daemon:72658 / 72756 / 73035 |     (a table cell, no backticks)
//   list span    `daemon.pretty.js:81426/78679-84482`, `35484/35517`
//   number+code  `86240 j.done→continue`
//
// None of these is a valid form. looseLineNumbers() returns every number in
// them, so check_bare_anchors.mjs can count each one as UNBOUND (and refute a
// backwards range) instead of skipping it. In plain text only a number with an
// explicit bundle qualifier is taken — a bare 5-digit number in prose may be a
// port, a count or a byte size — together with the numbers chained after it by
// / , 、 ; or +, which is how the evidence tables list several lines.
//
// Code spans are tokenised the CommonMark way: a run of N backticks closes at
// the next run of exactly N on the same line, so ``a `b` c`` is one span. Lines
// inside ``` fences are skipped: diagrams there are not citations.
export function codeSpans(text) {
  const out = [];
  const fenced = fencedRanges(text);
  const run = /`+/g;
  for (let m; (m = run.exec(text)); ) {
    if (fenced.some(([a, b]) => a <= m.index && m.index < b)) continue;
    const from = m.index + m[0].length;
    const eol = text.indexOf("\n", from);
    const close = new RegExp("(?<!`)" + m[0] + "(?!`)", "g");
    close.lastIndex = from;
    const c = close.exec(text);
    if (!c || (eol >= 0 && c.index > eol)) continue; // unmatched: literal backticks
    out.push({ start: m.index, end: c.index + m[0].length, content: text.slice(from, c.index) });
    run.lastIndex = c.index + m[0].length;
  }
  return out;
}
function fencedRanges(text) {
  const out = [];
  let open = null, off = 0;
  for (const line of text.split("\n")) {
    if (/^\s*```/.test(line)) { if (open === null) open = off; else { out.push([open, off + line.length]); open = null; } }
    off += line.length + 1;
  }
  if (open !== null) out.push([open, text.length]);
  return out;
}

const QUAL = "(?:(daemon|cli|stdio)(?:\\.pretty)?(?:\\.js)?:)";
const LINE = "([1-9]\\d{3,5})(?:\\s*[-–]\\s*(\\d{4,6}))?";
const SEP = "\\s*[/,，、;；+]\\s*";
// A span whose whole content is two or more lines/ranges, optionally qualified.
const LIST_SPAN = new RegExp("^\\s*" + QUAL + "?\\s*[1-9]\\d{3,5}(?:\\s*[-–]\\s*\\d{4,6})?(?:" + SEP + "[1-9]\\d{3,5}(?:\\s*[-–]\\s*\\d{4,6})?)+\\s*$");
// A span that opens with a line number followed by code.
const NUMBERED_SPAN = /^\s*[1-9]\d{3,5}(?:\s*[-–]\s*\d{4,6})?\s+\S/;

// -> [{ index, qual, from, to, text }] ; index is the offset of the number
export function looseLineNumbers(text) {
  const out = [];
  const each = (s, base, re, qual) => {
    for (const m of s.matchAll(re)) { const at = m[0].indexOf(m[1]); out.push({ index: base + m.index + at, qual, from: Number(m[1]), to: m[2] ? Number(m[2]) : null, text: m[0].slice(at).trim() }); }
  };
  const spans = codeSpans(text);
  for (const sp of spans) {
    const q = (sp.content.match(new RegExp("^\\s*" + QUAL)) || [])[1] || null;
    const base = sp.start + (sp.end - sp.start - sp.content.length) / 2;
    if (LIST_SPAN.test(sp.content)) each(sp.content, base, new RegExp("(?<![\\d.])" + LINE + "(?!\\d)", "g"), q);
    else if (NUMBERED_SPAN.test(sp.content))
      // every number opening a clause: `68596 a=…; 68597 if(…)`, `57006 x / 57008 y`
      each(sp.content, base, new RegExp("(?:^|[/;；,，、]\\s*)\\s*" + LINE + "(?=\\s)", "g"), null);
  }
  // plain text: blank out the code spans, keep offsets
  const chars = text.split(""); // UTF-16 units, so indices stay offsets into text
  for (const { start, end } of spans) for (let i = start; i < end; i++) chars[i] = " ";
  for (const [a, b] of fencedRanges(text)) for (let i = a; i < b; i++) if (chars[i] !== "\n") chars[i] = " ";
  const plain = chars.join("");
  const chain = new RegExp("(?<![A-Za-z0-9_$.])" + QUAL + "\\s*" + "[1-9]\\d{3,5}(?:\\s*[-–]\\s*\\d{4,6})?(?:" + SEP + "[1-9]\\d{3,5}(?:\\s*[-–]\\s*\\d{4,6})?(?!\\d))*", "g");
  for (const m of plain.matchAll(chain)) {
    const q = m[1];
    const body = m[0].slice(m[0].indexOf(":") + 1);
    each(body, m.index + m[0].indexOf(":") + 1, new RegExp("(?<![\\d.])" + LINE + "(?!\\d)", "g"), q);
  }
  return out.sort((x, y) => x.index - y.index);
}

// --- F3 -------------------------------------------------------------------
// `code`（`N`） or a list after one snippet: `code`（`N`/`M`、`K`）. Every line
// in the list is bound to the snippet.
export const f3 = () => new RegExp(
  "`([^`\\n]+)`\\s*[（(]\\s*((?:`(?:(?:daemon|cli|stdio)\\.pretty\\.js:)?\\d{4,6}(?:\\s*[-–]\\s*\\d{4,6})?`\\s*[/、,，;；]?\\s*)+)",
  "g");

// Tokens of a snippet that are distinctive enough to find on a line: string
// literal contents of 2+ chars and identifiers of 3+ chars that are not
// keywords. `!0`, `e`, `{ok:!0}` carry nothing a line can be checked against.
const KEYWORDS = new Set(("async await break case catch class const continue default delete do else export extends " +
  "false finally for function if import in instanceof let new null of return super switch this throw true try typeof " +
  "undefined var void while yield").split(" "));
export function snippetTokens(code) {
  const out = [];
  for (const m of code.matchAll(/"([^"]{2,})"|'([^']{2,})'/g)) out.push(m[1] ?? m[2]);
  const bare = code.replace(/"[^"]*"|'[^']*'/g, " ");
  for (const m of bare.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) if (m[0].length >= 3 && !KEYWORDS.has(m[0])) out.push(m[0]);
  return [...new Set(out)];
}

// The short mangled names a snippet CALLS: 2-4 chars carrying an uppercase
// letter, a digit or `$` (`I6(`, `B5e(`, `Os(`) — the shape of esbuild's
// top-level names, not of minified locals. A snippet can keep matching on a
// long property name while its callee has been re-mangled (`I6(n.memoryBoard)`
// against a line reading `uJ(n.memoryBoard)`), and the callee is what the
// citation is about. So every such head must be on the cited line as well.
export function snippetCallHeads(code) {
  return [...code.replace(/"[^"]*"|'[^']*'/g, " ").matchAll(/(?<![A-Za-z0-9_$.])([A-Za-z_$][A-Za-z0-9_$]{1,3})\s*\(/g)]
    .map(m => m[1]).filter(h => /[A-Z0-9$]/.test(h));
}
