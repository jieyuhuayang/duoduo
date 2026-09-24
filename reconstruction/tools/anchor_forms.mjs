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
//   N   `code`（`realName`）             check_bare_anchors.mjs a token of the code inside that symbol
//   P   `real (short)`, real/short       verify_citations.mjs   symbol identity, no line
//
// F1-F3 carry a line number and are legacy (maps/bare_anchor_baseline.json
// only lets their count fall). New citations use `real (short)` with no line
// (verify_citations.mjs checks the pairing) and N for statement-level evidence.
//
// Anything else holding a line number is UNBOUND: nothing can tell whether it
// still points where it meant to.

export const ID = "[A-Za-z_$][A-Za-z0-9_$]*";

// --- which names are citations ----------------------------------------------
// Every checker has to decide, for a name the symbol index does not have,
// whether the doc is making a claim about code (report it) or is just prose
// (ignore it). Two tests, and every tool uses these copies: when
// verify_citations.mjs and check_bare_anchors.mjs each carried their own
// looksReal, "owned by F1" in one meant whatever the other happened to say.
//
// looksReal is deliberately loose. It only decides a LINE-BEARING F1
// `real (short)`（`N`）, a shape nobody writes by accident, and it decides who
// owns that number: verify_citations.mjs reports an unknown real name as a
// missing symbol, and check_bare_anchors.mjs must then leave the number alone.
export const looksReal = n => n.length >= 8 && /[a-z]/.test(n) && /[A-Z_]/.test(n);
// looksRealName is the spelling real names actually have in esbuild's __export
// tables and maps/inferred_*.json: lowerCamelCase with at least one hump
// (optionally behind a `__`, as in __setGrokAvailabilityForTests), UPPER_SNAKE
// with at least one underscore, or PascalCase with at least two humps -- the
// exported classes (AgentSdkTurnInterruptedError). It is for claims with NO
// line to lean on — a line-less `real (short)` or `real/short` — where
// looksReal is too loose: `claude_code_local (env)` is CLI output quoted in a
// span, and `Principle (conclusion-first)` is prose; both pass looksReal.
// Without the PascalCase arm a class that left the index was silently skipped
// as prose once its citation lost its line: `AgentSdkTurnInterruptedErrorV2
// (Fr)`（`55516`） was FATAL, and the same pair without the line (what
// convert_line_citations.mjs writes) passed. A single hump (`Principle`) stays
// prose; a two-hump word such as `JavaScript (JS)` would be reported, loudly,
// which is the side to err on for a claim nothing else checks.
export const looksRealName = n => n.length >= 8 &&
  (/^_{0,2}[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)+$/.test(n) || /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/.test(n) ||
   /^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+$/.test(n));
// A top-level short name as esbuild emits it: 1-4 characters (the indexed ones
// are 2-3; allow a little room for a larger bundle).
export const isShortName = s => /^[A-Za-z_$][A-Za-z0-9_$]{0,3}$/.test(s);
// ...and one whose SHAPE says it is mangled even when the index does not know
// it: it carries an uppercase letter, a digit or `$` (`GSe`, `xH`, `t5e`). A
// bare lowercase `job` or `api` after a slash is a word, not a name.
export const looksMangled = s => isShortName(s) && /[A-Z0-9$]/.test(s);

// A whole-identifier matcher. A substring test accepts any line that happens to
// contain the letters: `rn` is inside every `return`, `on` inside half the
// bundle. Every "is this name on that line" question goes through this.
export const identRe = (name) =>
  new RegExp("(?<![A-Za-z0-9_$])" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![A-Za-z0-9_$])");

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

// --- P: a real name paired with its short name, no line ----------------------
// `real (short)` / real (short) / real（short） anywhere: prose, tables,
// diagrams. The gap before the parenthesis must be whitespace or a full-width
// （, so a call like `realName(e)` is not read as a citation.
export const namePair = () => new RegExp(
  "(?<![A-Za-z0-9_$])(" + ID + ")(?:\\s+\\(|\\s*（)\\s*`?(" + ID + ")`?\\s*[)）]", "g");
// real/short: the shorthand the §0 diagram of AGENT_INTERNALS_ANALYSIS.md
// writes (`drainSessionMailbox/GSe`). It makes the same claim as
// `real (short)`, and nothing read it: at v0.8.3 every one of them there was
// stale. A chain (`a/b/c`), a path (`dist/release`), a call (`a/b(`) or a
// member access (`a/b.c`) is not a pair. Which halves count is decided in
// verify_citations.mjs, against the index.
export const slashPair = () => new RegExp(
  "(?<![A-Za-z0-9_$/.])(" + ID + ")[ \\t]*/[ \\t]*(" + ID + ")(?![A-Za-z0-9_$/(]|\\.[A-Za-z_$])", "g");

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
// lineSpan() matches OUTSIDE fences -- what every counter must iterate. A
// fence holds no code spans (codeSpans() below), and looseLineNumbers() owns
// every number in one. lineSpan() itself scans the raw text, so a backticked
// number inside a fence used to be counted twice in a doc's lineNumbers, once
// by each: harmless only while no doc had one.
export const lineSpans = (text) => {
  const fenced = fencedRanges(text);
  return [...text.matchAll(lineSpan())].filter(m => !fenced.some(([a, b]) => a <= m.index && m.index < b));
};

// --- line numbers lineSpan() cannot see -------------------------------------
// lineSpan() only matches a code span that is exactly one line or range, so a
// number written any other way used to be examined by nothing at all:
//
//   qualified    | daemon:72658 / 72756 / 73035 |   (plain text, no backticks)
//                | daemon 77128-77135 |             (table rows: a space will do)
//   list span    `daemon.pretty.js:81426/78679-84482`, `35484/35517`
//   number+code  `86240 j.done→continue`
//   parenthesis  `- [ ] @evt(id)`(87296/87306)    (after a span, no backticks)
//   fence        ```  … [32043，调用点 87271] … ```  (diagrams, listings)
//
// None of these is a valid form. looseLineNumbers() returns every number in
// them, so check_bare_anchors.mjs can count each one as UNBOUND (and refute a
// backwards range) instead of skipping it; that tool drops the ones F1/F2
// already own (`Name`(12345) is a valid F2 even without backticks on the
// number). Plain prose is not scanned for bare numbers — a 5-digit number there
// may be a port, a count or a byte size — so each shape above is anchored on
// something that says "this is a location": a bundle qualifier, a parenthesis
// right after a code span, a list inside one span. Inside a fence there is no
// such marker, so every 4-6 digit integer counts unless a neighbouring
// character shows it is not one (`2026-06-30`, `-32601`, `10MB`, `3600*1e3`):
// a diagram cannot carry a checkable citation, so line numbers belong in the
// prose beside it.
//
// Code spans are tokenised the CommonMark way: a run of N backticks closes at
// the next run of exactly N on the same line, so ``a `b` c`` is one span.
// Fenced blocks hold no code spans.
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
// [start, end) of every ``` fence body (fence lines included)
export function fencedRanges(text) {
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
const QUAL_ROW = "(?:(daemon|cli|stdio)(?:\\.pretty)?(?:\\.js)?(?::|[ \\t]+(?=[1-9])))";
const LINE = "([1-9]\\d{3,5})(?:\\s*[-–]\\s*(\\d{4,6}))?";
const NUMS = "[1-9]\\d{3,5}(?:\\s*[-–]\\s*\\d{4,6})?";
const SEP = "\\s*[/,，、;；+]\\s*";
// A span whose whole content is two or more lines/ranges, optionally qualified.
const LIST_SPAN = new RegExp("^\\s*" + QUAL + "?\\s*" + NUMS + "(?:" + SEP + NUMS + ")+\\s*$");
// A span that opens with a line number followed by code.
const NUMBERED_SPAN = new RegExp("^\\s*" + NUMS + "\\s+\\S");
// A number that is not part of a date, an error code, a size or an expression.
const FREE = "(?<![-\\d.:_A-Za-z$])" + LINE + "(?![\\d._A-Za-z$*]|-\\S)";

// -> [{ index, qual, from, to, text }] ; index is the offset of the number
export function looseLineNumbers(text) {
  const out = [];
  const each = (s, base, re, qual) => {
    for (const m of s.matchAll(re)) { const at = m[0].indexOf(m[1]); out.push({ index: base + m.index + at, qual, from: Number(m[1]), to: m[2] ? Number(m[2]) : null, text: m[0].slice(at).trim() }); }
  };
  const spans = codeSpans(text);
  const fences = fencedRanges(text);
  // plain text: code spans and fences blanked, offsets kept
  const chars = text.split(""); // UTF-16 units, so indices stay offsets into text
  for (const { start, end } of spans) for (let i = start; i < end; i++) chars[i] = " ";
  for (const [a, b] of fences) for (let i = a; i < b; i++) if (chars[i] !== "\n") chars[i] = " ";
  const plain = chars.join("");

  for (const sp of spans) {
    const q = (sp.content.match(new RegExp("^\\s*" + QUAL)) || [])[1] || null;
    const base = sp.start + (sp.end - sp.start - sp.content.length) / 2;
    if (LIST_SPAN.test(sp.content)) each(sp.content, base, new RegExp("(?<![\\d.])" + LINE + "(?!\\d)", "g"), q);
    else if (NUMBERED_SPAN.test(sp.content))
      // every number opening a clause: `68596 a=…; 68597 if(…)`, `57006 x / 57008 y`
      each(sp.content, base, new RegExp("(?:^|[/;；,，、]\\s*)\\s*" + LINE + "(?=\\s)", "g"), null);
    // a parenthesis right after the span: numbers opening it or chained in it
    const par = plain.slice(sp.end).match(/^\s*[（(]([^)）\n]*)/);
    if (par) each(par[1], sp.end + par[0].length - par[1].length, new RegExp("(?:^|[/,，、;；]\\s*)\\s*" + FREE, "g"), null);
  }
  const chained = (qual) => new RegExp("(?<![A-Za-z0-9_$.])" + qual + "\\s*(" + NUMS + "(?:" + SEP + NUMS + "(?!\\d))*)", "g");
  const numbersIn = (m, off) => each(m[2], off + m[0].lastIndexOf(m[2]), new RegExp("(?<![\\d.])" + LINE + "(?!\\d)", "g"), m[1]);
  for (const m of plain.matchAll(chained(QUAL))) numbersIn(m, m.index);
  // table rows also write the qualifier with a space: | daemon 77105 |
  let off = 0;
  for (const line of plain.split("\n")) {
    if (line.startsWith("|")) for (const m of line.matchAll(chained(QUAL_ROW))) if (!/:$/.test(m[0].slice(0, m[0].indexOf(m[2])).trim())) numbersIn(m, off + m.index);
    off += line.length + 1;
  }
  // fences: every free number, and every bundle-qualified one. FREE rejects a
  // number right after `:`, so `daemon:12345` in a diagram was counted by
  // nothing -- nor, backticked, once lineSpans() stopped counting inside fences
  for (const [a, b] of fences) {
    const body = text.slice(a, b);
    each(body, a, new RegExp(FREE, "g"), null);
    for (const m of body.matchAll(new RegExp("(?<![A-Za-z0-9_$.])" + QUAL + "\\s*" + LINE + "(?!\\d)", "g"))) {
      const at = m[0].indexOf(m[2], m[0].indexOf(":") + 1); // the qualifier ends at its `:`
      out.push({ index: a + m.index + at, qual: m[1], from: Number(m[2]), to: m[3] ? Number(m[3]) : null, text: m[0].slice(at).trim() });
    }
  }
  return out.sort((x, y) => x.index - y.index);
}

// --- F3 -------------------------------------------------------------------
// `code`（`N`） or a list after one snippet: `code`（`N`/`M`、`K`）. Every line
// in the list is bound to the snippet.
export const f3 = () => new RegExp(
  "`([^`\\n]+)`\\s*[（(]\\s*((?:`(?:(?:daemon|cli|stdio)\\.pretty\\.js:)?\\d{4,6}(?:\\s*[-–]\\s*\\d{4,6})?`\\s*[/、,，;；]?\\s*)+)",
  "g");

// --- N: name-bound snippet (no line number) ---------------------------------
// `code`（`realName`） — the preferred way to say "this statement proves it".
// A cli symbol is written `code`（`cli:realName`）; unqualified means daemon.
// The real name comes from the symbol index and survives every release; the
// checker (check_bare_anchors.mjs) finds the symbol's current span and requires
// a distinctive token of the snippet, and every short name it calls, inside it.
// Nothing here needs retargeting on a bump: a literal that moved within the
// function still holds, and a re-mangled callee is refuted, as in F3.
export const nameBound = () => new RegExp(
  "`([^`\\n]+)`\\s*[（(]\\s*`(?:(daemon|cli|stdio):)?([A-Za-z_$][A-Za-z0-9_$]*)`\\s*[）)]",
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
  // (?<!…): `1e10` and `0xff` are numbers, not the identifiers `e10` and `xff`
  for (const m of bare.matchAll(/(?<![0-9A-Za-z_$])[A-Za-z_$][A-Za-z0-9_$]*/g)) if (m[0].length >= 3 && !KEYWORDS.has(m[0])) out.push(m[0]);
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

// Code as a token list: whole string literals, identifiers, numbers,
// punctuators; whitespace dropped. Only used to compare two pieces of code
// token by token, so it needs no more JavaScript than that.
const CODE_TOKEN = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|[A-Za-z_$][A-Za-z0-9_$]*|0[xXbBoO][\da-fA-F_]+n?|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?n?|=>|\.\.\.|\?\?=?|\?\.|[=!]==?|\*\*=?|<<=?|>>>?=?|&&=?|\|\|=?|[-+*/%&|^<>]=?|\S/g;
export const codeTokens = (text) => text.match(CODE_TOKEN) ?? [];
const isNumberToken = (t) => /^(?:\d|\.\d)/.test(t);
const isIdentToken = (t) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(t);

// Every `NAME = <numbers and arithmetic only>` clause of a snippet, as the
// token sequence [NAME, "=", ...rhs]: `vH = 5, wH = 180 * 1e3` gives
// [vH = 5] and [wH = 180 * 1e3]. The right-hand side ends at `,` `;` or a
// closing bracket, and a clause whose right-hand side holds anything else (an
// identifier, a call, `!0`, `?:`) is not one: its claim is not a number, and
// the token test already covers it. Compound operators (`+=`) and `==`/`===`
// are single tokens, so they are never read as `=`.
const ARITH = new Set(["+", "-", "*", "/", "%", "**", "(", ")"]);
function numericAssignments(tokens) {
  const out = [];
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i] !== "=" || !isIdentToken(tokens[i - 1])) continue;
    const rhs = [];
    let depth = 0, numeric = true;
    for (let j = i + 1; j < tokens.length; j++) {
      const t = tokens[j];
      if (t === "," || t === ";" || t === "}" || t === "]" || (t === ")" && depth === 0)) break;
      if (!isNumberToken(t) && !ARITH.has(t)) { numeric = false; break; }
      if (t === "(") depth++;
      else if (t === ")") depth--;
      rhs.push(t);
    }
    if (numeric && rhs.some(isNumberToken)) out.push([tokens[i - 1], "=", ...rhs]);
  }
  return out;
}
// is `want` a contiguous run of `have`?
function containsSequence(have, want) {
  for (let i = 0; i + want.length <= have.length; i++) {
    let j = 0;
    while (j < want.length && have[i + j] === want[j]) j++;
    if (j === want.length) return true;
  }
  return false;
}

// Does a snippet hold on lines a..b (1-based, inclusive) of a bundle, given as
// its array of lines? One rule for F3 (a line or range: strict = false) and N
// (a named symbol's span: strict = true).
// strict: identifiers match as whole words, and a lone identifier or a callee
// of fewer than three characters (`G`, `ea`, `$e(w)` — function locals, found
// somewhere in any large function) is not a checkable token.
// -> { checkable: false } | { checkable: true, ok, heads }  (heads: callees
// that are not in the span)
//
// Two more rules in strict mode, for citations of a constant through the
// symbol that assigns it (`vH = 5, wH = 180 * 1e3`（`initSessionDrainModule`）,
// name_symbol.mjs module initialisers and values). The claim of such a snippet
// is its NUMBER, and the token test above never looked at one:
//   - a snippet with no distinctive token that writes a number (short names,
//     numbers and operators: `vH = 5`) holds when its whole token sequence is
//     in the span, spacing aside. It used to be "not checkable" and refuted as
//     such, so the one citation a module's defaults need could not be written.
//     Without a number it stays uncheckable, as before: `new a$(` or `G(e)` is
//     a call of a two-character name, which any large function may contain,
//     and the first version of this rule converted three such F3 citations.
//   - every `NAME = <numbers and arithmetic>` clause (numericAssignments) must
//     be in the span as a whole token sequence, name, `=` and value together.
//     This replaced "every numeric literal the snippet writes is a token of
//     the span somewhere", which only refuted a number the span has nowhere:
//     a module initialiser assigns many constants, so in initSessionDrainModule
//     (`vH = 5, wH = 180 * 1e3; Ydt = 60; ...; wft = 3600 * 1e3, Sft = 300 *
//     1e3`) `Ydt = 5`, `Ydt = 300`, `Sft = 3600 * 1e3` and `wft = 300 * 1e3`
//     all held -- each number is some other constant's value -- and only
//     `Ydt = 61` was refuted. Only the numeric clause is bound this tightly.
//     Docs abbreviate snippets (`{…}`, `…`, a condition quoted apart from its
//     branch): at v0.8.3, requiring the whole snippet as one token sequence
//     refuted 66 of the 123 name-bound citations, and requiring every `x = …`
//     clause whatever its right-hand side refuted 5 (`B = !0` quoted inside an
//     abbreviated condition); this rule refutes none of them.
//   - any other numeric literal the snippet writes must still be a token of
//     the span, as every callee must.
// F3 (not strict) is unchanged: it is legacy, and its count may only fall.
//
// This lived inside check_bare_anchors.mjs, a script that cannot be imported,
// so convert_line_citations.mjs carried a verbatim copy "mirroring it exactly"
// to pick its candidates -- two copies of the rule that decides whether a
// citation holds, kept equal by a comment.
export function snippetHolds(code, lines, a, b, strict = false) {
  const toks = snippetTokens(code);
  const lone = code.trim();
  if (!toks.length && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(lone) && (!strict || lone.length >= 3)) toks.push(lone);
  // a two-character callee (`$e(w)`) is not distinctive inside a whole function
  if (!toks.length) toks.push(...snippetCallHeads(code).filter(h => !strict || h.length >= 3));
  const span = lines.slice(a - 1, b);
  if (!toks.length) {
    if (!strict) return { checkable: false };
    const want = codeTokens(code);
    // `vH`, `= 5`: too short to be anywhere in particular; no number: see above
    if (want.length < 3 || !want.some(isNumberToken)) return { checkable: false };
    return { checkable: true, ok: containsSequence(codeTokens(span.join("\n")), want), heads: [], sequence: true };
  }
  const found = t => strict && isIdentToken(t) ? span.some(l => identRe(t).test(l)) : span.some(l => l.includes(t));
  const hit = toks.some(found);
  const heads = snippetCallHeads(code).filter(h => !span.some(l => identRe(h).test(l)));
  let numbers = [], assignments = [];
  if (strict) {
    const have = codeTokens(span.join("\n"));
    const spanNumbers = new Set(have.filter(isNumberToken));
    const want = codeTokens(code);
    numbers = want.filter(t => isNumberToken(t) && !spanNumbers.has(t));
    assignments = numericAssignments(want).filter(c => !containsSequence(have, c)).map(c => c.join(" "));
  }
  return {
    checkable: true, ok: hit && !heads.length && !numbers.length && !assignments.length, heads,
    ...(numbers.length ? { numbers } : {}), ...(assignments.length ? { assignments } : {}),
  };
}
