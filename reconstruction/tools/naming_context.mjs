// The context a naming task carries, shared by name_toplevel.mjs tasks,
// name_locals.mjs tasks and naming_bench.mjs, so the benchmark measures the
// hand-off the bump actually uses.
//
// Why this exists (docs/RECONSTRUCTION_EFFICIENCY_RESEARCH.md §5, §8 建议 5):
// the names a reader can recover from minified code come from what survives
// minification -- property names, string literals and the real names already
// registered around the code (DeMinify, JSNeat) -- and a name proposed for a
// callee is evidence for its caller (GenNm's call-graph propagation). Until
// v0.8.7 the task files printed the body with every top-level reference still
// mangled and gave no vocabulary at all, so a namer saw `Hue(e)` where the
// repository already knew `moveSessionDirToArchive`, and invented spellings
// the author never uses. The pieces here:
//
//   topLevelReferences  every reference to a top-level binding, resolved by
//                       scope (not by spelling: a local may shadow a top-level
//                       short name in a function that does not use it)
//   renderSpan          a declaration's text with every KNOWN top-level name
//                       applied and a chosen set left mangled (the benchmark
//                       hides the names it scores; a real task hides nothing)
//   vocabulary          per subsystem: the real names registered there, the
//                       CHANGELOG words paired to them (maps/changelog_daemon.json),
//                       and the type and field names of @openduo/protocol's
//                       TypeScript source that share a token with the code
//   TOPLEVEL_PROMPT, LOCALS_PROMPT   the describe-then-name instruction: one
//                       sentence on what the code does, then up to 3 names in
//                       the registered spelling, length-capped ("poisoned
//                       identifier" studies: a description written first keeps
//                       a misleading name in the code from being copied)
//
// Nothing here writes a file; the tools that import it do.
import fs from "node:fs";
import path from "node:path";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import { isVariableOccurrence } from "./local_bindings.mjs";

// ---- tokens -------------------------------------------------------------------
// sub-tokens of an identifier: camelCase humps, snake_case parts, digit runs
export function splitTokens(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+|(?<=[A-Za-z])(?=[0-9])|(?<=[0-9])(?=[A-Za-z])/)
    .filter(Boolean)
    .map((s) => s.toLowerCase());
}
const STOP = new Set(["the", "a", "an", "of", "to", "in", "for", "and", "or", "is", "it", "on", "by", "with", "as", "at", "be",
  "this", "that", "from", "not", "no", "if", "then", "than", "into", "when", "its", "are", "was", "were", "has", "have",
  "get", "set", "new", "var", "let", "const", "return", "function", "async", "await", "true", "false", "null", "undefined",
  "value", "data", "result", "item", "items", "key", "keys", "name", "type", "id", "string", "number", "object", "array"]);
export const isStopToken = (t) => STOP.has(t) || t.length < 3;

// ---- top-level references ----------------------------------------------------
// [{ start, end, name }] sorted by start: every identifier that resolves to a
// top-level binding, declarations included. `ast` must be parsed with ranges.
export function topLevelReferences(ast) {
  let program = null;
  const refs = [];
  traverse(ast, {
    Program(p) { program = p.scope; },
    Identifier(p) {
      if (!isVariableOccurrence(p)) return;
      const b = p.scope.getBinding(p.node.name);
      if (!b || b.scope !== program) return;
      refs.push({ start: p.node.start, end: p.node.end, name: p.node.name });
    },
  });
  refs.sort((a, b) => a.start - b.start);
  return refs;
}
// the references inside [a, b) (binary search on the sorted list)
export function refsIn(refs, a, b) {
  let lo = 0, hi = refs.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (refs[m].start < a) lo = m + 1; else hi = m; }
  const out = [];
  for (let i = lo; i < refs.length && refs[i].start < b; i++) out.push(refs[i]);
  return out;
}
// src[a, b) with every top-level reference whose short name is in `rename` and
// not in `hidden` spelled by its real name; `lines` caps the output
export function renderSpan(src, a, b, refs, rename, hidden = new Set(), lines = 60, width = 180) {
  const parts = [];
  let pos = a;
  for (const r of refsIn(refs, a, b)) {
    const real = rename[r.name];
    if (!real || hidden.has(r.name)) continue;
    parts.push(src.slice(pos, r.start), real);
    pos = r.end;
  }
  parts.push(src.slice(pos, b));
  const t = parts.join("").split("\n");
  return t.slice(0, lines).map((l) => (l.length > width ? l.slice(0, width) + " …" : l)).join("\n") + (t.length > lines ? `\n… (${t.length} lines)` : "");
}

// ---- vocabulary ----------------------------------------------------------------
// the property names and string literals of a span: the evidence that survives
// minification, and the tokens the vocabulary is matched against
export function spanEvidence(src, a, b) {
  const text = src.slice(a, b);
  const props = new Set(), strings = new Set();
  for (const m of text.matchAll(/\.([A-Za-z_$][\w$]{2,})\b/g)) props.add(m[1]);
  for (const m of text.matchAll(/([A-Za-z_$][\w$]{2,})\s*:/g)) props.add(m[1]);
  for (const m of text.matchAll(/"((?:[^"\\]|\\.){3,160})"|'((?:[^'\\]|\\.){3,160})'|`([^`$]{3,160})/g)) strings.add((m[1] ?? m[2] ?? m[3]).replace(/\s+/g, " "));
  const tokens = new Set();
  for (const p of props) for (const t of splitTokens(p)) if (!isStopToken(t)) tokens.add(t);
  for (const s of strings) for (const t of splitTokens(s)) if (!isStopToken(t)) tokens.add(t);
  return { props: [...props], strings: [...strings], tokens };
}

// @openduo/protocol's TypeScript source: exported type, interface, function and
// const names, and the field names of each exported type, with the file they
// come from. A regex reading: the source is 11 files of plain declarations.
export function loadProtocolVocab(dir) {
  if (!dir || !fs.existsSync(dir)) return null;
  const types = [], fields = [], funcs = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".ts")).sort()) {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    let current = null;
    for (const line of text.split("\n")) {
      let m;
      if ((m = /^export\s+(?:type|interface)\s+([A-Za-z_]\w*)/.exec(line))) { current = m[1]; types.push({ name: m[1], file: f }); continue; }
      if ((m = /^export\s+(?:async\s+)?function\s+([A-Za-z_]\w*)/.exec(line)) || (m = /^export\s+const\s+([A-Za-z_]\w*)/.exec(line))) { current = null; funcs.push({ name: m[1], file: f }); continue; }
      if (/^\S/.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line)) { if (/^[}\]);]/.test(line) || /^export/.test(line)) current = null; }
      if (current && (m = /^\s+(?:readonly\s+)?([a-z_][\w]*)\??\s*:/.exec(line))) fields.push({ name: m[1], type: current, file: f });
    }
  }
  const index = new Map(); // token -> Set(entry label)
  const add = (label, name) => { for (const t of splitTokens(name)) if (!isStopToken(t)) (index.get(t) ?? index.set(t, new Set()).get(t)).add(label); };
  for (const x of types) add(`type ${x.name}`, x.name);
  for (const x of funcs) add(`${x.name}()`, x.name);
  for (const x of fields) add(`${x.type}.${x.name}`, x.name);
  return { types, fields, funcs, index };
}
// protocol entries sharing a token with `tokens`, rarest tokens first: a token
// that occurs in five entries or fewer counts 1, in twenty or fewer 0.34, else
// 0.1 (`file`, `session` alone match half the package); kept from 0.9 up
export function protocolMatches(vocab, tokens, limit = 12) {
  if (!vocab) return [];
  return weightedMatches([...vocab.index].map(([t, set]) => [t, [...set]]), tokens, limit);
}
function weightedMatches(tokenIndex, tokens, limit) {
  const score = new Map();
  for (const [t, labels] of tokenIndex) {
    if (!tokens.has(t)) continue;
    const w = labels.length <= 5 ? 1 : labels.length <= 20 ? 0.34 : 0.1;
    for (const l of labels) score.set(l, (score.get(l) || 0) + w);
  }
  return [...score].filter(([, s]) => s >= 0.9).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([l]) => l);
}

// CHANGELOG words paired to a set of symbols (maps/changelog_daemon.json):
// backticked terms and code-shaped words from the entries, by frequency
export function changelogWords(changelog, names, limit = 40) {
  if (!changelog?.symbols) return [];
  const count = new Map();
  const bump = (w) => count.set(w, (count.get(w) || 0) + 1);
  for (const n of names) for (const e of changelog.symbols[n] ?? []) {
    const text = `${e.changelog ?? ""} ${e.why ?? ""}`;
    for (const m of text.matchAll(/`([^`]{2,60})`/g)) bump(m[1].trim());
    for (const m of text.matchAll(/\b([a-z]+_[a-z_]+|[a-z]+[A-Z][A-Za-z]+)\b/g)) bump(m[1]);
  }
  return [...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([w]) => w);
}
// the CHANGELOG entries of specific symbols (a candidate's callers and callees)
export function changelogEntries(changelog, names, limit = 4) {
  const out = [];
  for (const n of names) for (const e of changelog?.symbols?.[n] ?? []) {
    out.push(`${n} (v${e.version}, ${e.kind}): ${String(e.changelog ?? "").replace(/\s+/g, " ").slice(0, 160)}`);
    if (out.length >= limit) return out;
  }
  return out;
}

// the vocabulary of one subsystem: the real names registered there, grouped
// by their first token (verb), and the CHANGELOG words of those names
export function subsystemVocabulary(dir, subsys, changelog) {
  const names = Object.entries(subsys).filter(([, d]) => d === dir).map(([n]) => n).sort();
  const byVerb = new Map();
  for (const n of names) { const v = splitTokens(n)[0] ?? n; (byVerb.get(v) ?? byVerb.set(v, []).get(v)).push(n); }
  const verbs = [...byVerb].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return { names, verbs, changelog: changelogWords(changelog, names) };
}
// the registered names that share a token with the code, for one candidate
// (same rarity weighting as protocolMatches, over the subsystem's names)
export function relatedNames(names, tokens, limit = 12, exclude = new Set()) {
  const index = new Map();
  for (const n of names) {
    if (exclude.has(n)) continue;
    for (const t of new Set(splitTokens(n))) if (!isStopToken(t)) (index.get(t) ?? index.set(t, []).get(t)).push(n);
  }
  return weightedMatches([...index], tokens, limit);
}

// the lines of a subsystem's vocabulary block (once per group in a task file)
export function vocabularyBlockLines(dir, voc, protocolVocab, protocolTokens) {
  const lines = [`### vocabulary of ${dir}`, ""];
  if (voc.names.length) {
    lines.push(`registered names (${voc.names.length}; the author's spelling -- reuse these verbs and nouns):`);
    for (const [v, list] of voc.verbs.slice(0, 24)) lines.push(`  ${v}: ${list.slice(0, 10).join(", ")}${list.length > 10 ? ` (+${list.length - 10})` : ""}`);
    if (voc.verbs.length > 24) lines.push(`  (+${voc.verbs.length - 24} more verbs)`);
  }
  if (voc.changelog.length) lines.push(`CHANGELOG words paired to this subsystem: ${voc.changelog.join(", ")}`);
  if (protocolVocab && protocolTokens) {
    const m = protocolMatches(protocolVocab, protocolTokens, 24);
    if (m.length) lines.push(`protocol types and fields (@openduo/protocol): ${m.join(", ")}`);
  }
  lines.push("");
  return lines;
}

// ---- prompts ----------------------------------------------------------------
export const TOPLEVEL_PROMPT = [
  "# Naming tasks: unnamed top-level code",
  "",
  "Candidates are ordered leaf-first (a callee before the code that calls it) and grouped by subsystem, so a name",
  "you give early is context for the later ones: when a later body calls a candidate you have already named, use",
  "that name. Each group starts with its vocabulary: the real names already registered in the subsystem, the",
  "CHANGELOG words paired to them, and the protocol package's type and field names that share a token with the code.",
  "The body is printed with every known top-level name applied; only the candidates themselves are still short names.",
  "",
  "For each candidate, in `toplevel.proposals.json` (a skeleton is written next to this file):",
  "  1. `describe`: ONE sentence saying what the code does -- its inputs, the effect or value it produces -- from the",
  "     property names, string literals, callers and callees. Write it before choosing a name, and never from a local's name.",
  "  2. `names`: up to 3 candidate names, best first, in the spelling of the kind (a function camelCase, a module",
  "     initialiser `init<Name>Module`, a literal constant UPPER_SNAKE), at least 8 and at most 40 characters, at most",
  "     4 words, built from the vocabulary where it fits (the same verb for the same action: `resolve`, `render`,",
  "     `build`, `ensure` as the subsystem uses them). Leave `names` empty for anything you cannot name with confidence.",
  "  3. `subsystem`: keep the suggested directory or change it.",
  "Then write the batch list (the first candidate of each) and check every proposal before writing it:",
  "",
  "    node name_toplevel.mjs tsv toplevel.proposals.json toplevel.tsv",
  "    node name_symbol.mjs --build <OUT> --dry-run <pretty.js> --batch toplevel.tsv",
  "",
];

export const LOCALS_PROMPT = [
  "Name every `$<ordinal>` listed under `name:` with a short descriptive lowerCamelCase identifier (at most 3 words,",
  "at most 24 characters), from how the binding is used (property names, string literals, the real names of callees),",
  "in the convention of the locals already named in the same code (`paths` for the runtime paths object, `sessionKey`, ...)",
  "and of the subsystem's vocabulary at the top of this file. First write `_describe`: one sentence on what the",
  "declaration does, before any name; a name must not repeat a misleading name already in the code. `previously:` lists",
  "names this declaration's locals had before the code next to them changed: reuse one when the binding plays the same",
  "role. Answer with one JSON file of the form {\"<realName>\": {\"_describe\": \"<sentence>\", \"<ordinal>\": \"<name>\"}}",
  "covering every ordinal in the .json next to this file (keys starting with `_` are ignored by record), then run",
  "name_locals.mjs record.",
  "",
];
