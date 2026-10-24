// What kind of change a readable declaration diff (diff_decls.mjs) shows, for
// impact_report.mjs's tier 2c.
//
// Tier 2c lists every citation of an unchanged declaration that calls a
// changed one. At v0.8.5 -> v0.8.6 that was 467 citations, all through
// createAgentSdkAdapter, whose one change added `s.CLAUDE_CODE_FORK_SUBAGENT =
// "0"` to the engine process's environment: none of the 467 claims depended on
// it, and each counted as much as a tier-2 citation in the work groups. This
// module recognises that kind of change so the report can weigh it less. It
// says what the diff shows, never that callers cannot observe it.
//
// A diff is `member-literal-assignments` when every hunk, compared token by
// token, differs from the old code only by whole assignments of a literal to
// a member, added or removed: `x.NAME = <literal>` or `x["key"] = <literal>`,
// several joined by commas, with the comma or semicolon that separates them
// from the code around (a literal: a string, a number, a template with no
// `${}`, true, false, null, !0, !1, void 0, a negative number). Two kinds of
// spelling difference are not change:
//   - one local for another, on a line diff_decls.mjs prints as changed for
//     another reason (it already shows a line that differs only in locals as
//     unchanged, and the same blind spot holds here: a line that now reads a
//     different local looks unchanged);
//   - `old:X` (a v0.8.5 top-level name with no counterpart) for a v0.8.6 name,
//     when both are import aliases of the same binding of the same module
//     (`import { query as Hge } from "@anthropic-ai/claude-agent-sdk"` became
//     `query as j_e`): esbuild names each import anew, and diff_decls.mjs pairs
//     top-level names only through declarations.
// Anything else (a call to another function, a changed condition, a literal
// replaced by another) is `code`.
import { lexSnippet } from "./retarget_snippets.mjs";

const KEYWORDS = new Set(("async await break case catch class const continue default delete do else export extends " +
  "false finally for function if import in instanceof let new null of return super switch this throw true try typeof " +
  "undefined var void while yield get set static NaN Infinity").split(" "));
const GLOBALS = new Set(("Date JSON Math Object Array Promise Error Set Map WeakMap WeakSet Number String Boolean Symbol RegExp URL " +
  "process require console Buffer globalThis setTimeout clearTimeout setInterval clearInterval queueMicrotask " +
  "AbortController TextEncoder TextDecoder Reflect Proxy BigInt Intl").split(" "));
const isIdent = (t) => /^[A-Za-z_$][\w$]*$/.test(t);
const OLD = "__old__";  // `old:X` is lexed as one identifier

// import aliases of a pretty bundle: local name -> "source#imported"
export function importAliases(lines) {
  const out = new Map();
  let open = null;
  const spec = (s, src) => {
    for (const part of s.split(",").map((x) => x.trim()).filter(Boolean)) {
      const m = part.match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/);
      if (m) out.set(m[2] || m[1], `${src}#${m[1]}`);
    }
  };
  for (const l of lines || []) {
    let m;
    if (open) {
      if ((m = l.match(/^\}\s*from\s*["']([^"']+)["'];?$/))) { spec(open.join(","), m[1]); open = null; }
      else open.push(l);
      continue;
    }
    if (/^import\s*\{\s*$/.test(l)) { open = []; continue; }
    if ((m = l.match(/^import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?$/))) spec(m[1], m[2]);
    else if ((m = l.match(/^import\s+\*\s+as\s+([\w$]+)\s+from\s*["']([^"']+)["'];?$/))) out.set(m[1], `${m[2]}#*`);
    else if ((m = l.match(/^import\s+([\w$]+)\s+from\s*["']([^"']+)["'];?$/))) out.set(m[1], `${m[2]}#default`);
  }
  return out;
}

// the hunks of a .diff: [{ removed: text, added: text }]
function hunksOf(text) {
  const out = [];
  let h = null;
  for (const l of text.split("\n")) {
    if (l.startsWith("@@")) { h = { removed: [], added: [] }; out.push(h); continue; }
    if (!h || l.startsWith("---") || l.startsWith("+++")) continue;
    if (l[0] === "-") h.removed.push(l.slice(1));
    else if (l[0] === "+") h.added.push(l.slice(1));
  }
  return out.map((x) => ({ removed: x.removed.join("\n"), added: x.added.join("\n") }));
}

const LIT1 = (t) => /^["']/.test(t) || /^\d/.test(t) || (t[0] === "`" && t.endsWith("`") && !t.includes("${")) || t === "true" || t === "false" || t === "null";
// a run of added or removed tokens that is whole literal assignments to members
function literalAssignments(run) {
  let r = [...run];
  if (r[0] === "," || r[0] === ";") r = r.slice(1);
  else if (r[r.length - 1] === "," || r[r.length - 1] === ";") r = r.slice(0, -1);
  if (!r.length) return false;
  let i = 0;
  const lit = () => {
    if (LIT1(r[i])) return ++i, true;
    if (r[i] === "!" && (r[i + 1] === "0" || r[i + 1] === "1")) return (i += 2), true;
    if (r[i] === "void" && r[i + 1] === "0") return (i += 2), true;
    if (r[i] === "-" && /^\d/.test(r[i + 1] || "")) return (i += 2), true;
    return false;
  };
  for (;;) {
    if (!isIdent(r[i] || "") || KEYWORDS.has(r[i])) return false;
    i++;
    if (r[i] === "." && isIdent(r[i + 1] || "")) i += 2;
    else if (r[i] === "[" && /^["']/.test(r[i + 1] || "") && r[i + 2] === "]") i += 3;
    else return false;
    if (r[i++] !== "=") return false;
    if (!lit()) return false;
    if (i === r.length) return true;
    if (r[i++] !== ",") return false;
  }
}

// -> { kind: "member-literal-assignments" | "code" | "none", added: [text], removed: [text] }
//   top: every top-level name either release's code can spell (real names, new
//   short names), so a token outside it that is not a global or keyword is a local
export function classifyDiff(diffText, { top, oldImports, newImports }) {
  const hunks = hunksOf(diffText);
  if (!hunks.length) return { kind: "none", added: [], removed: [] };
  const isLocal = (t) => isIdent(t) && !t.startsWith(OLD) && !top.has(t) && !GLOBALS.has(t) && !KEYWORDS.has(t) && !newImports.has(t);
  // a member name (after `.` or `?.`) or an object or destructuring key (an
  // identifier before `:`, unless it follows `?` as in `a ? b : c`; a hunk line
  // may start at the key) is spelled the same in both releases: compared
  // exactly, never as a local (`LruMap: MPe` -> `FifoMap: $Ce` is a change)
  const lex = (s) => {
    const toks = lexSnippet(s).map((x) => x.text);
    return toks.map((x, k) => ({ text: x, exact: toks[k - 1] === "." || toks[k - 1] === "?." || (toks[k + 1] === ":" && toks[k - 1] !== "?") }));
  };
  const same = (a, b) => {
    if (a.text === b.text) return 2;
    if (a.exact || b.exact) return 0;
    if (isLocal(a.text) && isLocal(b.text)) return 1;
    if (a.text.startsWith(OLD)) { const k = oldImports.get(a.text.slice(OLD.length)); if (k && newImports.get(b.text) === k) return 2; }
    return 0;
  };
  const added = [], removed = [];
  for (const h of hunks) {
    const A = lex(h.removed.replace(/old:([A-Za-z_$][\w$]*)/g, `${OLD}$1`));
    const B = lex(h.added);
    if (A.length * B.length > 4e6) return { kind: "code", added, removed };
    // the alignment with the most weight: an exact match counts 2, one local for another 1
    const n = A.length, m = B.length, W = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
      const s = same(A[i], B[j]);
      W[i][j] = Math.max(W[i + 1][j], W[i][j + 1], s ? W[i + 1][j + 1] + s : 0);
    }
    const runs = [];  // [side, tokens]
    // a removal right next to an addition (no matched token between) is a
    // replacement, not two whole assignments
    let i = 0, j = 0, cur = null, replaced = false;
    const take = (side, tok) => {
      if (cur && cur[0] !== side) replaced = true;
      if (!cur || cur[0] !== side) { cur = [side, []]; runs.push(cur); }
      cur[1].push(tok);
    };
    while (i < n || j < m) {
      const s = i < n && j < m ? same(A[i], B[j]) : 0;
      if (s && W[i][j] === W[i + 1][j + 1] + s) { cur = null; i++; j++; }
      else if (j < m && (i === n || W[i][j + 1] >= W[i + 1][j])) take("+", B[j++]);
      else take("-", A[i++]);
    }
    if (replaced) return { kind: "code", added, removed };
    for (const [side, run] of runs) {
      const toks = run.map((x) => x.text);
      if (!literalAssignments(toks)) return { kind: "code", added, removed };
      (side === "+" ? added : removed).push(toks.join(" ").replace(/ ?([.\[\]]) ?/g, "$1").replace(/^[,;] |[ ,;]+$/g, "").replace(OLD, "old:"));
    }
  }
  return { kind: added.length || removed.length ? "member-literal-assignments" : "none", added, removed };
}
