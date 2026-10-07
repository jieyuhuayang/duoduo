// Instrument the reconstructed daemon so a run of it writes a call trace.
//
// The docs' mechanism claims come from reading code. A trace of the daemon
// actually running a scenario (boot, an RPC call, a cadence tick, a message to
// a void session) is the other kind of evidence: which first-party functions
// ran, in what order, nested how, for how long, and with what arguments. That
// is what §14 of AGENT_INTERNALS_ANALYSIS.md calls 待实测.
//
// This tool rewrites recon/daemon.recon.js by text splicing: every top-level
// first-party function (declaration, function/arrow initialiser, class
// method) gets its body wrapped as
//   { const __t = __duoTrace.enter("name", arguments-summary); try { body }
//     catch (e) { __duoTrace.fail(__t, e); throw e } finally { __duoTrace.exit(__t) } }
// and a small runtime is prepended that appends one JSON line per event to
// $DUO_TRACE_FILE (default: duo-trace.jsonl in the working directory):
//   {"seq","t":ms since start,"ev":"enter"|"exit"|"fail","id","parent","name","a":[args],"dur":ms,"err"}
// `parent` is the enclosing traced call, carried across awaits with
// AsyncLocalStorage, so the lines rebuild a call tree per scenario
// (trace_report.mjs does that).
//
// The instrumented file is a run artifact, never committed and outside the
// equivalence proof: it is the recon file plus the wrappers, and only the
// wrappers differ. A function that reads `arguments`, `this` or its own name
// behaves the same (nothing is wrapped in a new function); only timing and
// stack depth change.
//
// Usage: node instrument.mjs <daemon.recon.js> <symbols_daemon.json> <out.js> [--all] [--inner]
//   --all    also wrap the unnamed top-level functions (by mangled name), so a
//            trace shows what first-party code calls into that has no name yet;
//            vendored code then appears too, and the trace grows about 10x.
//   --inner  also wrap the functions nested inside a wrapped declaration: the
//            RPC handlers inside createDaemon, the actor methods inside
//            createSessionManager. Each is named <outer>>name, where name is
//            the property key, variable or method it is assigned to, or
//            anon@<line>. Without it a trace shows only the top-level entry
//            and exit of those factories.
import { parse } from "@babel/parser";
import fs from "node:fs";
import { nestedFunctions, keyName } from "./closure_names.mjs";

const argv = process.argv.slice(2);
const ALL = argv.includes("--all");
const INNER = argv.includes("--inner");
const [RECON, SYMBOLS, OUT] = argv.filter(a => !a.startsWith("--"));
if (!RECON || !SYMBOLS || !OUT) {
  console.error("usage: node instrument.mjs <daemon.recon.js> <symbols_daemon.json> <out.js> [--all] [--inner]");
  process.exit(2);
}
const src = fs.readFileSync(RECON, "utf8");
const symbols = JSON.parse(fs.readFileSync(SYMBOLS, "utf8")).symbols;
const firstParty = new Set(Object.keys(symbols));
const ast = parse(src, { sourceType: "module", ranges: true });

const splices = []; // { at, text } insertions, applied from the end
let wrapped = 0;
const q = s => JSON.stringify(s);
function paramsSummary(fn) {
  // which params to summarise: plain identifiers only, up to 3
  return fn.params.slice(0, 3).map(p => p.type === "Identifier" ? p.name : p.type === "AssignmentPattern" && p.left.type === "Identifier" ? p.left.name : null);
}
function wrapBody(fn, name) {
  const body = fn.body;
  const args = `[${paramsSummary(fn).map(p => p ? `__duoTrace.arg(${p})` : "null").join(",")}]`;
  if (body.type === "BlockStatement") {
    const open = body.range[0] + 1, close = body.range[1] - 1;
    // a constructor must call super() before anything touches `this`; our
    // prelude touches nothing of the instance, so it is safe before super()
    splices.push({ at: open, text: `const __t=__duoTrace.enter(${q(name)},${args});try{` });
    splices.push({ at: close, close: true, text: `}catch(__e){__duoTrace.fail(__t,__e);throw __e}finally{__duoTrace.exit(__t)}` });
  } else {
    // arrow with an expression body: `=> expr` becomes `=> { …try{ return (expr) }… }`.
    // The body's range excludes the parentheses of `=> ({…})`, so the opening
    // text goes right after the `=>` token and the closing text at the end
    // of the arrow function itself.
    const from = fn.params.length ? fn.params[fn.params.length - 1].range[1] : fn.range[0];
    const arrow = src.indexOf("=>", from);
    if (arrow === -1 || arrow > body.range[0]) throw new Error(`no => before the body of ${name}`);
    splices.push({ at: arrow + 2, text: `{const __t=__duoTrace.enter(${q(name)},${args});try{return (` });
    splices.push({ at: fn.range[1], close: true, text: `)}catch(__e){__duoTrace.fail(__t,__e);throw __e}finally{__duoTrace.exit(__t)}}` });
  }
  wrapped++;
}
function wrapClass(cls, name) {
  for (const m of cls.body.body) {
    if ((m.type === "ClassMethod" || m.type === "ClassPrivateMethod") && m.body) {
      const key = m.key.type === "Identifier" ? m.key.name : m.key.type === "PrivateName" ? "#" + m.key.id.name : m.key.type === "StringLiteral" ? m.key.value : "[computed]";
      wrapBody(m, `${name}${m.static ? "." : "#"}${key}`);
    }
  }
}
// --inner: every function nested in `root` (not root itself), named by what it
// is assigned to (closure_names.mjs, the same names xref.mjs records)
function wrapInner(root, outer) {
  for (const f of nestedFunctions(root, outer)) if (f.node.body) wrapBody(f.node, f.name);
}

function wrapInnerOfClass(cls, name) {
  for (const m of cls.body.body) if ((m.type === "ClassMethod" || m.type === "ClassPrivateMethod") && m.body) wrapInner(m, `${name}#${keyName(m.key) ?? "[computed]"}`);
}

for (const stmt of ast.program.body) {
  if (stmt.type === "FunctionDeclaration" && stmt.id) {
    if (ALL || firstParty.has(stmt.id.name)) { wrapBody(stmt, stmt.id.name); if (INNER) wrapInner(stmt, stmt.id.name); }
  } else if (stmt.type === "ClassDeclaration" && stmt.id) {
    if (ALL || firstParty.has(stmt.id.name)) { wrapClass(stmt, stmt.id.name); if (INNER) wrapInnerOfClass(stmt, stmt.id.name); }
  } else if (stmt.type === "VariableDeclaration") {
    for (const d of stmt.declarations) {
      if (d.id.type !== "Identifier" || !d.init) continue;
      if (!(ALL || firstParty.has(d.id.name))) continue;
      if (d.init.type === "FunctionExpression" || d.init.type === "ArrowFunctionExpression") { wrapBody(d.init, d.id.name); if (INNER) wrapInner(d.init, d.id.name); }
      else if (d.init.type === "ClassExpression") { wrapClass(d.init, d.id.name); if (INNER) wrapInnerOfClass(d.init, d.id.name); }
      else if (d.init.type === "CallExpression" && d.init.callee.type === "Identifier" && d.init.callee.name === "__esm" &&
               d.init.arguments[0] && /Function/.test(d.init.arguments[0].type)) { wrapBody(d.init.arguments[0], d.id.name); if (INNER) wrapInner(d.init.arguments[0], d.id.name); }
    }
  }
}

const prelude = `import { AsyncLocalStorage as __duoALS } from "node:async_hooks";
import * as __duoFs from "node:fs";
var __duoTrace = (() => {
  const file = process.env.DUO_TRACE_FILE || "duo-trace.jsonl";
  const fd = __duoFs.openSync(file, "a");
  const als = new __duoALS();
  const t0 = Date.now();
  let seq = 0, nextId = 1, buf = [];
  const flush = () => { if (buf.length) { try { __duoFs.writeSync(fd, buf.join("")); } catch {} buf = []; } };
  // written at once, not buffered: a scenario script appends its own mark
  // lines to the same file between steps, and a buffered event would land
  // after a mark that was written later than it
  const emit = o => { o.seq = ++seq; o.t = Date.now() - t0; buf.push(JSON.stringify(o) + "\\n"); flush(); };
  setInterval(flush, 250).unref();
  for (const sig of ["exit"]) process.on(sig, flush);
  const arg = v => {
    try {
      if (v == null) return v;
      const t = typeof v;
      if (t === "string") return v.length > 120 ? v.slice(0, 120) + "…" : v;
      if (t === "number" || t === "boolean") return v;
      if (t === "function") return "ƒ" + (v.name || "");
      if (Array.isArray(v)) return "[" + v.length + "]";
      if (t === "object") {
        const o = {};
        let n = 0;
        for (const k of Object.keys(v)) {
          if (n++ >= 8) { o["…"] = Object.keys(v).length; break; }
          const x = v[k];
          o[k] = typeof x === "string" ? (x.length > 60 ? x.slice(0, 60) + "…" : x) : typeof x === "number" || typeof x === "boolean" || x == null ? x : Array.isArray(x) ? "[" + x.length + "]" : typeof x === "function" ? "ƒ" : "{…}";
        }
        return o;
      }
      return String(v);
    } catch { return "?"; }
  };
  return {
    arg,
    enter(name, a) {
      const parent = als.getStore();
      const ctx = { id: nextId++, name, parent, start: Date.now() };
      emit({ ev: "enter", id: ctx.id, parent: parent ? parent.id : 0, name, a });
      als.enterWith(ctx);
      return ctx;
    },
    fail(ctx, e) { emit({ ev: "fail", id: ctx.id, name: ctx.name, err: String(e && e.message || e).slice(0, 200) }); },
    exit(ctx) { emit({ ev: "exit", id: ctx.id, name: ctx.name, dur: Date.now() - ctx.start }); als.enterWith(ctx.parent); },
  };
})();
`;

// applied from the end; at the same offset (an empty body `{}`) the closing
// text must be inserted first so the opening text lands before it
splices.sort((a, b) => b.at - a.at || (a.close ? -1 : 1) - (b.close ? -1 : 1));
let out = src;
for (const s of splices) out = out.slice(0, s.at) + s.text + out.slice(s.at);
out = prelude + out;
fs.writeFileSync(OUT, out);
console.log(`instrumented ${wrapped} function bodies (${ALL ? "all top-level" : "first-party"}${INNER ? " + inner" : ""}) -> ${OUT}`);
