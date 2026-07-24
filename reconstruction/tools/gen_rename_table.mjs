// Generate maps/RENAME_TABLE.md from the rename map + inferred map + subsystem
// map, computing each symbol's declaration line in the beautified bundle.
// Usage: node gen_rename_table.mjs <pretty.js> <rename.json> <inferred.json> <subsys.json> <out.md>
import { parse } from "@babel/parser";
import fs from "node:fs";

const [, , PRETTY, RENAME, INFERRED, SUBSYS, OUT] = process.argv;
const src = fs.readFileSync(PRETTY, "utf8");
const rename = JSON.parse(fs.readFileSync(RENAME, "utf8"));     // mangled -> real
const inferred = JSON.parse(fs.readFileSync(INFERRED, "utf8")); // mangled -> real (subset)
const subsys = JSON.parse(fs.readFileSync(SUBSYS, "utf8"));     // real -> subsystem
const inferredSet = new Set(Object.keys(inferred));

const ast = parse(src, { sourceType: "module", ranges: true });
const declLine = new Map(); // mangled -> line
const starts = [0];
for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
const lineAt = (off) => { let lo = 0, hi = starts.length - 1, a = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (starts[m] <= off) { a = m; lo = m + 1; } else hi = m - 1; } return a + 1; };
for (const stmt of ast.program.body) {
  if (stmt.type === "FunctionDeclaration" && stmt.id) declLine.set(stmt.id.name, lineAt(stmt.start));
  else if (stmt.type === "VariableDeclaration") for (const d of stmt.declarations) { if (d.id.type === "Identifier") declLine.set(d.id.name, lineAt(stmt.start)); }
  else if (stmt.type === "ClassDeclaration" && stmt.id) declLine.set(stmt.id.name, lineAt(stmt.start));
}

// group by subsystem
const groups = new Map();
for (const [mangled, real] of Object.entries(rename)) {
  const sub = subsys[real] || "zz-unclassified";
  if (!groups.has(sub)) groups.set(sub, []);
  groups.get(sub).push({ mangled, real, source: inferredSet.has(mangled) ? "inferred" : "__export", line: declLine.get(mangled) ?? "—" });
}
const subs = [...groups.keys()].sort();
const total = Object.keys(rename).length;

let md = `# duoduo 首字符还原：符号名映射表（daemon）\n\n`;
md += `下表把 esbuild \`--minify\` 后的短标识符映射回**真实原名**。名字来源：\`__export()\` 助手保留的导出符号名（权威）+ 少量逆向推断的内部函数名（标注 *inferred*）。“原行号”指反混淆后的 \`daemon.pretty.js\`。\n\n`;
md += `共 ${total} 个一等公民符号，覆盖 ${subs.length} 个子系统。基于 \`@openduo/duoduo\` v0.6.1。\n`;
for (const sub of subs) {
  const rows = groups.get(sub).sort((a, b) => (a.line === "—" ? 1e9 : a.line) - (b.line === "—" ? 1e9 : b.line));
  md += `\n## ${sub}\n\n`;
  md += `| minified | 还原名 | 来源 | pretty 行 |\n|---|---|---|---|\n`;
  for (const r of rows) md += `| \`${r.mangled}\` | \`${r.real}\` | ${r.source} | ${r.line} |\n`;
}
fs.writeFileSync(OUT, md);
console.log(`wrote ${OUT}: ${total} symbols, ${subs.length} subsystems`);
