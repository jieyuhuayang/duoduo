// Score a replayed bump: how well the automatic re-anchoring (remap_inferred.mjs,
// pair_releases.mjs, anchor_candidates.mjs, confirm_reanchor.mjs, all run by
// bump.sh) reproduces the hand-reviewed inferred map of the next release.
//
// Why this exists: every bump tool was validated on one or two replays, each
// with its own throwaway script, and the numbers in README.md「已实现」cannot be
// re-measured after a change to one of the tools. replay_bump.sh runs bump.sh
// with the committed maps of OLD as input, and this script compares what the
// tools produced with the committed maps of NEW (the truth, reviewed by hand).
// A change to any bump tool is then measured, not argued: the per-name verdicts
// before and after are in score.json, the counts in score.md.
//
// Verdicts, one per real name of OLD's inferred map (the join key is the real
// name; a short name means nothing across releases):
//   carried-correct    the carried map puts it on the declaration the truth names
//   carried-wrong      the carried map puts it on a declaration the truth names
//                      otherwise, or elsewhere than the truth: the worst outcome,
//                      because every later gate passes with the name misplaced
//   confirmed-correct  not carried; confirm_reanchor's witnesses `confirmed` the
//                      candidate (what --write adds unasked) and the truth agrees
//   confirmed-wrong    ... and the truth disagrees
//   proposed-correct   not carried, not confirmed; the candidate a reviewer is
//                      shown (the pairing proposal, else the top-ranked anchor
//                      candidate) is the truth's declaration
//   proposed-wrong     ... is not
//   unresolved         not carried and no candidate at all, but the truth has the
//                      name on some declaration
//   gone               the truth has no entry for this real name: upstream removed
//                      the code, or the reviewer dropped or respelled the name.
//                      Not an error; listed by name with where the tools put it.
//                      The ones placed on a declaration the truth names under
//                      another spelling are counted again as `goneRespelled`
// NEW's names that OLD did not have are `truth-only` (new registrations):
// informational, never counted against the tools.
//
// For the names the truth re-anchored (not carried, truth has them), the ranking
// of anchor_candidates.mjs (impact.json's reanchor[].ranking) is scored too:
// how many have the truth's declaration ranked first, in the top 3, and the mean
// margin of the first over the runner-up.
//
// Inputs are bump.sh's outputs ($OUT), the OLD maps bump.sh read, and the NEW
// maps. A bundle whose OLD map has no inferred_<bundle>.json (v0.8.3 has none for
// cli) is reported as such; one bump.sh skipped as byte-identical is scored
// with the OLD map kept as is (that is what the bump does with it).
//
// Usage:
//   node replay_score.mjs --old-maps <dir> --new-maps <dir> --bump <bump OUT>
//        [--old-label vX] [--new-label vY] [--json <score.json>] [--md <score.md>]
// Writes only the two named outputs; prints a table per bundle and one summary
// line per bundle. Exit 0 always (the numbers are the result, not a gate).
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const OLD_MAPS = opt("--old-maps"), NEW_MAPS = opt("--new-maps"), BUMP = opt("--bump");
const OLD_LABEL = opt("--old-label") || "old", NEW_LABEL = opt("--new-label") || "new";
const JSON_OUT = opt("--json"), MD_OUT = opt("--md");
if (!OLD_MAPS || !NEW_MAPS || !BUMP || argv.length) {
  console.error("usage: node replay_score.mjs --old-maps <dir> --new-maps <dir> --bump <bump OUT> [--old-label v] [--new-label v] [--json <o.json>] [--md <o.md>]");
  process.exit(2);
}
const readJSON = (p, dflt) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : dflt);
const BUNDLES = ["daemon", "cli"];
const VERDICTS = ["carried-correct", "carried-wrong", "confirmed-correct", "confirmed-wrong", "proposed-correct", "proposed-wrong", "unresolved", "gone"];

const invert = (m) => { const o = new Map(); for (const [k, v] of Object.entries(m || {})) o.set(v, k); return o; };

const result = { generatedBy: "tools/replay_score.mjs", old: OLD_LABEL, new: NEW_LABEL, bump: path.resolve(BUMP), bundles: {} };
for (const bundle of BUNDLES) {
  const oldInf = readJSON(path.join(OLD_MAPS, `inferred_${bundle}.json`), null);
  const truth = readJSON(path.join(NEW_MAPS, `inferred_${bundle}.json`), null);
  const B = { names: {}, counts: Object.fromEntries(VERDICTS.map((v) => [v, 0])), truthOnly: [], ranking: null };
  result.bundles[bundle] = B;
  if (!oldInf) { B.status = "no OLD inferred map"; B.truthOnly = Object.values(truth || {}).sort(); continue; }
  if (!truth) { B.status = "no NEW inferred map"; continue; }
  let carriedMap = readJSON(path.join(BUMP, `inferred_${bundle}.json`), null);
  const fpFile = path.join(BUMP, `fp_${bundle}.json`);
  if (!carriedMap && !fs.existsSync(fpFile)) {
    // bump.sh skips a byte-identical bundle: every name stays where it is, so
    // the OLD map is what the bump keeps, and it is scored as the carried map
    carriedMap = oldInf; B.status = "scored (bundle byte-identical: OLD map kept as is)";
  } else if (!carriedMap) { B.status = "bump.sh stopped before the carry step"; continue; }
  else B.status = "scored";
  const proposed = readJSON(path.join(BUMP, `inferred_${bundle}.proposed.json`), {});
  const proposalOf = new Map(Object.entries(proposed).map(([n, v]) => [v.old, { new: n, how: v.how, score: v.score }]));
  const confirm = new Map(readJSON(path.join(BUMP, `reanchor_${bundle}.json`), []).map((r) => [r.old, r]));
  const impact = readJSON(path.join(BUMP, "impact.json"), {});
  const rankingOf = new Map((impact.reanchor || []).filter((r) => r.bundle === bundle).map((r) => [r.oldShort, r.ranking || []]));
  const fp = readJSON(fpFile, { matched: {} });

  const truthByReal = invert(truth);
  const carriedByReal = invert(carriedMap);
  const oldReals = new Set(Object.values(oldInf));
  for (const [oldShort, real] of Object.entries(oldInf)) {
    const t = truthByReal.get(real) ?? null;
    const m = fp.matched?.[oldShort];
    const rec = { real, oldShort, truthShort: t, fingerprint: !m ? "changed" : m.unique ? "unique" : "ambiguous" };
    const k = carriedByReal.get(real);
    if (k !== undefined) {
      rec.carriedTo = k;
      if (t === null) { rec.verdict = "gone"; rec.note = truth[k] ? `carried to ${k}, which the truth names ${truth[k]} (respelled?)` : `carried to ${k}, which the truth leaves unnamed`; }
      else if (k === t) rec.verdict = "carried-correct";
      else { rec.verdict = "carried-wrong"; rec.note = `carried to ${k}, truth ${t}${truth[k] ? ` (truth names ${k} ${truth[k]})` : ""}`; }
    } else {
      const c = confirm.get(oldShort);
      const p = proposalOf.get(oldShort);
      const ranking = rankingOf.get(oldShort) || [];
      const cand = c?.candidate ?? p?.new ?? ranking[0]?.name ?? null;
      rec.candidate = cand;
      rec.candidateSource = c ? c.source : p ? "proposal" : ranking[0] ? "ranking" : null;
      if (c) rec.confirm = c.verdict + (c.note ? `: ${c.note}` : "");
      if (p) rec.proposal = { new: p.new, how: p.how, ...(p.score != null ? { score: p.score } : {}) };
      if (ranking.length) {
        const i = t === null ? -1 : ranking.findIndex((r) => r.name === t);
        rec.ranking = { top: ranking[0].name, rankOfTruth: i < 0 ? null : i + 1, candidates: ranking.length, margin: +((ranking[0].score ?? 0) - (ranking[1]?.score ?? 0)).toFixed(3) };
      }
      if (t === null) { rec.verdict = "gone"; rec.note = cand ? `candidate ${cand}${truth[cand] ? `, which the truth names ${truth[cand]} (respelled?)` : ""}` : "no candidate"; }
      else if (c?.verdict === "confirmed") rec.verdict = cand === t ? "confirmed-correct" : "confirmed-wrong";
      else if (cand) rec.verdict = cand === t ? "proposed-correct" : "proposed-wrong";
      else rec.verdict = "unresolved";
      if ((rec.verdict === "confirmed-wrong" || rec.verdict === "proposed-wrong") && !rec.note) rec.note = `candidate ${cand}, truth ${t}${truth[cand] ? ` (truth names ${cand} ${truth[cand]})` : ""}`;
    }
    B.names[real] = rec;
    B.counts[rec.verdict]++;
  }
  B.truthOnly = Object.values(truth).filter((r) => !oldReals.has(r)).sort();
  // a `gone` name whose declaration the truth names otherwise: the reviewer
  // respelled it (name_symbol.mjs --published, or a rename by hand), the
  // placement itself was right
  B.counts.goneRespelled = Object.values(B.names).filter((r) => r.verdict === "gone" && r.note?.includes("(respelled?)")).length;
  // the ranking over the names the truth re-anchored (not carried, truth has them)
  const re = Object.values(B.names).filter((r) => r.carriedTo === undefined && r.truthShort !== null);
  const ranked = re.filter((r) => r.ranking);
  const margins = ranked.map((r) => r.ranking.margin);
  B.ranking = {
    reanchored: re.length, ranked: ranked.length,
    truthFirst: ranked.filter((r) => r.ranking.rankOfTruth === 1).length,
    truthTop3: ranked.filter((r) => r.ranking.rankOfTruth !== null && r.ranking.rankOfTruth <= 3).length,
    truthAbsent: ranked.filter((r) => r.ranking.rankOfTruth === null).length,
    meanMargin: margins.length ? +(margins.reduce((a, b) => a + b, 0) / margins.length).toFixed(3) : null,
    meanMarginWhenFirst: (() => { const m = ranked.filter((r) => r.ranking.rankOfTruth === 1).map((r) => r.ranking.margin); return m.length ? +(m.reduce((a, b) => a + b, 0) / m.length).toFixed(3) : null; })(),
  };
}

// --- print ----------------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
const summaryLine = (bundle, B) => {
  if (!B.status?.startsWith("scored")) return `${OLD_LABEL}->${NEW_LABEL} ${bundle}: ${B.status}${B.truthOnly.length ? `; ${B.truthOnly.length} truth-only` : ""}`;
  const c = B.counts, r = B.ranking;
  return `${OLD_LABEL}->${NEW_LABEL} ${bundle}: ${Object.keys(B.names).length} names: carried ${c["carried-correct"]}/${c["carried-wrong"]} (correct/wrong), ` +
    `confirmed ${c["confirmed-correct"]}/${c["confirmed-wrong"]}, proposed ${c["proposed-correct"]}/${c["proposed-wrong"]}, unresolved ${c.unresolved}, gone ${c.gone}${c.goneRespelled ? ` (${c.goneRespelled} respelled)` : ""}; ` +
    `truth-only ${B.truthOnly.length}; ranking: truth first ${r.truthFirst}/${r.ranked}, top3 ${r.truthTop3}/${r.ranked}, mean margin ${r.meanMargin ?? "-"}` +
    (B.status !== "scored" ? ` ${B.status.slice("scored ".length)}` : "");
};
const lines = [];
for (const [bundle, B] of Object.entries(result.bundles)) {
  lines.push(`== ${bundle} (${OLD_LABEL} -> ${NEW_LABEL}): ${B.status}`);
  if (B.status.startsWith("scored")) {
    lines.push(`  ${pad("verdict", 18)} count`);
    for (const v of VERDICTS) lines.push(`  ${pad(v, 18)} ${B.counts[v]}`);
    lines.push(`  ${pad("truth-only", 18)} ${B.truthOnly.length}`);
    if (B.counts.goneRespelled) lines.push(`  ${pad("(gone: respelled)", 18)} ${B.counts.goneRespelled}`);
    const r = B.ranking;
    lines.push(`  ranking over the ${r.reanchored} re-anchored names: ${r.ranked} ranked, truth first ${r.truthFirst}, top3 ${r.truthTop3}, absent ${r.truthAbsent}, mean margin ${r.meanMargin ?? "-"} (when first: ${r.meanMarginWhenFirst ?? "-"})`);
    for (const rec of Object.values(B.names).filter((x) => !["carried-correct", "confirmed-correct", "proposed-correct"].includes(x.verdict))) {
      lines.push(`  ${pad(rec.verdict, 18)} ${rec.real} (${rec.oldShort} -> ${rec.truthShort ?? "-"})${rec.note ? "  " + rec.note : ""}${rec.confirm ? `  [${rec.confirm}]` : ""}`);
    }
  } else if (B.truthOnly.length) lines.push(`  truth-only ${B.truthOnly.length}`);
}
for (const [bundle, B] of Object.entries(result.bundles)) lines.push(summaryLine(bundle, B));
console.log(lines.join("\n"));
result.summary = Object.fromEntries(Object.entries(result.bundles).map(([b, B]) => [b, summaryLine(b, B)]));

if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(result, null, 2) + "\n");
if (MD_OUT) {
  const L = [`# Replay score ${OLD_LABEL} -> ${NEW_LABEL}`, "", `bump output: \`${result.bump}\``, ""];
  for (const [bundle, B] of Object.entries(result.bundles)) {
    L.push(`## ${bundle}: ${B.status}`, "");
    if (B.status.startsWith("scored")) {
      L.push("| verdict | count |", "|---|---|");
      for (const v of VERDICTS) L.push(`| ${v} | ${B.counts[v]} |`);
      L.push(`| truth-only | ${B.truthOnly.length} |`);
      if (B.counts.goneRespelled) L.push(`| (gone: respelled) | ${B.counts.goneRespelled} |`);
      L.push("");
      const r = B.ranking;
      L.push(`Ranking over the ${r.reanchored} names the truth re-anchored: ${r.ranked} ranked, truth first ${r.truthFirst}, in top 3 ${r.truthTop3}, absent ${r.truthAbsent}, mean margin ${r.meanMargin ?? "-"} (when first: ${r.meanMarginWhenFirst ?? "-"}).`, "");
      const rows = Object.values(B.names).filter((x) => x.verdict !== "carried-correct");
      if (rows.length) {
        L.push("| name | verdict | old | truth | candidate | source | confirm | rank of truth | margin | note |", "|---|---|---|---|---|---|---|---|---|---|");
        for (const x of rows) L.push(`| ${x.real} | ${x.verdict} | \`${x.oldShort}\` | \`${x.truthShort ?? "-"}\` | \`${x.carriedTo ?? x.candidate ?? "-"}\` | ${x.carriedTo !== undefined ? "carried" : x.candidateSource ?? "-"} | ${x.confirm ?? "-"} | ${x.ranking?.rankOfTruth ?? "-"} | ${x.ranking?.margin ?? "-"} | ${x.note ?? ""} |`);
        L.push("");
      }
    }
    if (B.truthOnly.length) L.push(`truth-only (${B.truthOnly.length}): ${B.truthOnly.join(", ")}`, "");
    L.push(`\`${result.summary[bundle]}\``, "");
  }
  fs.writeFileSync(MD_OUT, L.join("\n"));
}
