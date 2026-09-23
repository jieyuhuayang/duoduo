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
export const lineSpan = () =>
  /`(?:(daemon|cli|stdio)(?:\.pretty)?(?:\.js)?:)?(\d{4,6})(?:\s*[-–]\s*(\d{4,6}))?`/g;

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
