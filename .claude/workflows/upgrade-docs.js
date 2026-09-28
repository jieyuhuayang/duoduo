export const meta = {
  name: 'upgrade-docs',
  description: 'Bring the analysis docs up to a new upstream release: survey the delta, update each group of doc sections the impact report lists, verify each adversarially, then join, register names and run the checks',
  whenToUse: 'Step 3b of a version bump (reconstruction/tools/bump.sh prints the args), after the mechanical doc retarget and `doc_sections.mjs split`. Not for restructuring or restyling docs.',
  phases: [
    { title: 'Survey', detail: 'one agent reads the plain-text delta and every readable diff, and says what changed and where the docs must follow' },
    { title: 'Update', detail: 'per work group: a writer edits its own section files, a verifier tries to refute each change, a fixer applies what survives' },
    { title: 'Integrate', detail: 'join the sections, register new names, run the check-mode rebuild, update the GUIDE and its version appendix' },
  ],
}

// args (bump.sh prints them in its hand-off, step 3b):
//   bump   bump.sh's OUT: impact.json, impact.md, diff/, plaintext/, pretty_new/, chunks/
//   build  the step-2 check-mode run's OUT: symbols_*.json, blocks_*.json, beautified/<to>/, daemon.recon.js
//   pkg    the new release's dist/release dir
//   from, to   the two release tags, e.g. "v0.8.3", "v0.8.4"
//   groups (optional) impact.json's `groups`; read from the file when absent
//   repo   (optional) repository root, default the working directory
const A = args || {}
for (const k of ['bump', 'build', 'pkg', 'from', 'to']) if (!A[k]) throw new Error(`upgrade-docs: args.${k} is required (bump.sh prints the args in its hand-off)`)
const REPO = A.repo || '.'
const WHERE = A.repo ? `the repository root ${A.repo}` : 'the repository root (your working directory)'
const T = `${REPO}/reconstruction/tools`
const B = A.bump, BUILD = A.build
const PRETTY = `${BUILD}/beautified/${A.to}`

const CONTEXT = `
The duoduo runtime moved from ${A.from} to ${A.to}. The reconstruction pipeline has already carried the names across and retargeted every citation mechanically; what is left is substance: statements in the docs that the new code makes wrong, incomplete or outdated, and new behaviour no doc describes. The doc rules are in the project CLAUDE.md ("Writing / editing the analysis docs"): cite code by name only, tag every mechanism claim confirmed / 未证实推测, update in place to the latest verified conclusion with no errata or version narration in AGENT_INTERNALS_ANALYSIS.md, and keep the Pyramid structure.
Material (paths are absolute or relative to ${WHERE}):
- ${B}/impact.md and ${B}/impact.json: every doc citation of changed code with a tier (1 re-read, 2 check, 3 skim) and the reason; the changed declarations with their readable diff files; what no doc covers yet; the plain-text delta.
- ${B}/diff/<bundle>/*.diff: readable diffs. Top-level names are real names where known, else ${A.to} short names; \`old:X\` is a ${A.from} name with no counterpart; lines differing only in local-variable names are context.
- ${B}/plaintext/package.diff and upstream.diff (CHANGELOG, skills/, bootstrap prompts): upstream's own words for the change.
- New code: ${PRETTY}/daemon.pretty.js and cli.pretty.js; ${BUILD}/daemon.recon.js (same lines, first-party names applied); new names in ${BUILD}/symbols_daemon.json and symbols_cli.json.
- Doc sections: ${B}/chunks/<doc name>/NN.md, one file per \`## \` section (NN.md is section NN; manifest.json lists titles and each section's first line in the doc). A unit key "docs/X.md#N" is ${B}/chunks/X/NN.md.
Checks for .md files (run from ${WHERE}):
  node ${T}/verify_citations.mjs ${BUILD}/symbols_daemon.json,${BUILD}/symbols_cli.json --bundle daemon=${PRETTY}/daemon.pretty.js --bundle cli=${PRETTY}/cli.pretty.js <files>
  node ${T}/check_bare_anchors.mjs --index ${BUILD}/symbols_daemon.json,${BUILD}/symbols_cli.json --bundle cli=${PRETTY}/cli.pretty.js ${PRETTY}/daemon.pretty.js ${BUILD}/blocks_daemon.json ${REPO}/reconstruction/maps/modules_daemon.json <files>
Never run git, rebuild.sh or name_symbol.mjs without --dry-run unless your task says so; never edit reconstruction/maps/.`

const UNITS_SCHEMA = { type: 'array', items: { type: 'object', properties: {
  key: { type: 'string' }, doc: { type: 'string' }, section: { type: 'number' }, title: { type: 'string' }, tiers: { type: 'array', items: { type: 'number' } } },
  required: ['key', 'doc', 'section', 'title'] } }
const GROUPS_SCHEMA = { type: 'object', properties: { groups: { type: 'array', items: { type: 'object', properties: {
  id: { type: 'string' }, weight: { type: 'number' }, changes: { type: 'array', items: { type: 'string' } }, units: UNITS_SCHEMA },
  required: ['id', 'units'] } } }, required: ['groups'] }
const SURVEY_SCHEMA = { type: 'object', properties: {
  notes: { type: 'array', items: { type: 'object', properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    what: { type: 'string', description: 'what the runtime now does differently, stated literally, one to three sentences' },
    evidence: { type: 'array', items: { type: 'string' }, description: 'diff file + hunk, or plain-text file + line, or real name' },
    units: { type: 'array', items: { type: 'string' }, description: 'unit keys docs/X.md#N whose statements must follow this change; for new behaviour, the section that should describe it' },
    newBehaviour: { type: 'boolean' } },
    required: ['id', 'title', 'what', 'evidence', 'units', 'newBehaviour'] } },
  guide: { type: 'array', items: { type: 'string' }, description: 'changes a product manager reading DUODUO_FRAMEWORK_GUIDE.md would need, each with its note id' },
  noDocChange: { type: 'array', items: { type: 'string' }, description: 'changes that need no doc edit, each with the reason' } },
  required: ['notes', 'guide', 'noDocChange'] }
const WRITE_SCHEMA = { type: 'object', properties: {
  edited: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, what: { type: 'string' } }, required: ['file', 'what'] } },
  names: { type: 'array', items: { type: 'object', properties: {
    short: { type: 'string' }, name: { type: 'string' }, subsystem: { type: 'string' }, evidence: { type: 'string' } },
    required: ['short', 'name', 'subsystem', 'evidence'] }, description: 'unnamed daemon code your new citations need a name for (checked with name_symbol.mjs --dry-run, not registered)' },
  unresolved: { type: 'array', items: { type: 'string' } },
  checks: { type: 'string', description: 'last summary line of each check on your files' } },
  required: ['edited', 'names', 'unresolved', 'checks'] }
const ISSUES_SCHEMA = { type: 'object', properties: { issues: { type: 'array', items: { type: 'object', properties: {
  file: { type: 'string' }, where: { type: 'string' }, problem: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' },
  severity: { type: 'string', enum: ['high', 'medium', 'low'] } }, required: ['file', 'where', 'problem', 'evidence', 'fix', 'severity'] } } },
  required: ['issues'] }

const chunk = (key) => { const [doc, n] = key.split('#'); return `${B}/chunks/${doc.split('/').pop().replace(/\.md$/, '')}/${String(n).padStart(2, '0')}.md` }

// --- work groups ----------------------------------------------------------------
let groups = A.groups
if (!groups) {
  const loaded = await agent(`Run \`node -e 'console.log(JSON.stringify(require("${B}/impact.json").groups))'\` from ${WHERE} and return that array, unchanged, as \`groups\`.`,
    { label: 'load groups', phase: 'Survey', schema: GROUPS_SCHEMA, effort: 'low' })
  groups = loaded ? loaded.groups : []
}
groups = groups.map((g) => ({ ...g, units: [...g.units], weight: g.weight || 0 }))
log(`${groups.length} work groups: ${groups.map((g) => `${g.id} (${g.units.length} sections)`).join(', ')}`)

// --- survey ---------------------------------------------------------------------
phase('Survey')
const survey = await agent(CONTEXT + `

YOUR TASK: say what changed, and where the docs must follow. Read the plain-text delta first (CHANGELOG, then prompts and skills), then impact.md, then EVERY readable diff it lists. For each change in behaviour write one note: what the runtime now does differently (literal, verified against the diff), the evidence, and the unit keys whose statements must follow it. Use impact.json's tier-1 and tier-2 citations to find the affected statements; also read the section files of the units you name, because a statement can depend on changed code without citing it. For behaviour no doc describes yet ("Not covered by any doc yet" in impact.md, or a new branch in a diff), name the section that should describe it (read the manifests of docs/AGENT_INTERNALS_ANALYSIS.md and docs/ARCHITECTURE_ANALYSIS.md to choose). List in \`guide\` what a product manager reading DUODUO_FRAMEWORK_GUIDE.md would need, and in \`noDocChange\` every change that needs no doc edit, with the reason (a renamed local, a reordered statement, a log string). Every changed declaration in impact.md must end up in a note or in noDocChange. Do not edit any file.`,
  { label: 'survey', phase: 'Survey', schema: SURVEY_SCHEMA })
const notes = survey ? survey.notes : []

// every unit a note names belongs to exactly one group; a unit no group has
// yet (new behaviour for a section with no citation of changed code) goes to
// the lightest group
if (!groups.length && notes.some((n) => n.units.length)) groups.push({ id: 'g1', units: [], weight: 0 })
const owner = new Map()
for (const g of groups) for (const u of g.units) owner.set(u.key, g)
for (const n of notes) for (const key of n.units) {
  if (owner.has(key)) continue
  const g = [...groups].sort((a, b) => a.weight - b.weight)[0]
  const [doc, s] = key.split('#')
  g.units.push({ key, doc, section: Number(s), title: '(named by the survey)', tiers: [0, 0, 0] })
  g.weight += 2
  owner.set(key, g)
}
const idle = groups.filter((g) => !g.units.length)
groups = groups.filter((g) => g.units.length)
if (idle.length) log(`dropped ${idle.length} empty work group(s)`)

// --- update -------------------------------------------------------------------
const results = await pipeline(groups,
  (g) => {
    const keys = g.units.map((u) => u.key)
    const mine = notes.filter((n) => n.units.some((k) => keys.includes(k)))
    return agent(CONTEXT + `

YOUR TASK: bring these doc sections up to ${A.to}. You own ONLY these files; edit nothing else:
${g.units.map((u) => `- ${chunk(u.key)}  (${u.doc} section ${u.section}: ${u.title}; tiers re-read/check/skim ${(u.tiers || []).join('/')})`).join('\n')}
Your citations: node -e 'const r=require("${B}/impact.json"), k=new Set(${JSON.stringify(keys)}); for (const c of r.citations) if (k.has(c.doc+"#"+c.section)) console.log(c.tier, c.doc+":"+c.line, c.real, c.form, c.code||"", "--", c.why)'
The survey's notes for your sections:
${JSON.stringify(mine, null, 1)}
Work tier 1 first: re-read the code each citation names in the new version (its readable diff, then the new pretty bundle or recon), and correct the statement, its snippet and its confidence tag so they hold for ${A.to}. Then tier 2; then skim tier 3 against the diff summaries. Write the new behaviour the notes assign to your sections, in the section's structure and style. A snippet must hold in the new code (check_bare_anchors). To cite unnamed daemon code, propose a name: check it with \`node ${T}/name_symbol.mjs --dry-run --build ${BUILD} ${PRETTY}/daemon.pretty.js <short> <name> <NN-subsystem>\` (--build: until PROMOTE, maps/ still indexes the old release), use it in the doc, and return it in \`names\`; the integration step registers it, so until then verify_citations reports it as missing, which is expected. Run both checks on your files until nothing else fails.`,
      { label: `write:${g.id}`, phase: 'Update', schema: WRITE_SCHEMA })
  },
  (w, g) => w && agent(CONTEXT + `

YOUR TASK: verify one work group's edits, adversarially. The writer owned ${g.units.map((u) => chunk(u.key)).join(', ')} and reports: ${JSON.stringify(w)}
Try to refute every edited statement and every tier-1 citation of these sections (list them from impact.json as the writer did: doc#section in ${JSON.stringify(g.units.map((u) => u.key))}) against the ${A.to} code, not against the writer's summary. Also look for statements in these files that a diff contradicts and nobody edited, confirmed tags on claims the code does not show, and edits that break the doc rules. Report only real problems, each with evidence from the code. Do not edit any file.`,
    { label: `verify:${g.id}`, phase: 'Update', schema: ISSUES_SCHEMA }).then((v) => ({ w, v })),
  (x, g) => {
    if (!x) return null
    const todo = (x.v ? x.v.issues : []).filter((i) => i.severity !== 'low')
    if (!todo.length) return { group: g.id, write: x.w, issues: x.v ? x.v.issues : null, fixed: null }
    return agent(CONTEXT + `

YOUR TASK: settle a verifier's findings on files you own: ${g.units.map((u) => chunk(u.key)).join(', ')}. Findings: ${JSON.stringify(todo)}
For each, re-read the code; fix it if it holds, reject it with evidence if it does not. Rerun both checks on your files. Return what you changed, any names (as the writer did; the writer already proposed ${JSON.stringify(x.w.names)}), and what stays unresolved.`,
      { label: `fix:${g.id}`, phase: 'Update', schema: WRITE_SCHEMA }).then((f) => ({ group: g.id, write: x.w, issues: x.v.issues, fixed: f }))
  })
const done = results.filter(Boolean)
const names = done.flatMap((r) => [...(r.write?.names || []), ...(r.fixed?.names || [])])
const unresolved = done.flatMap((r) => [...(r.write?.unresolved || []), ...(r.fixed?.unresolved || [])].map((u) => `${r.group}: ${u}`))
log(`groups done: ${done.length}/${groups.length}; ${names.length} names proposed; ${unresolved.length} unresolved items`)

// --- integrate ----------------------------------------------------------------
phase('Integrate')
const integrate = await agent(CONTEXT + `

YOUR TASK: finish the doc update. In order:
1. Join the sections back into the docs: node ${T}/doc_sections.mjs join ${B}/chunks
2. Register the proposed names in one batch (write them to ${B}/names.tsv as short<TAB>name<TAB>subsystem; drop duplicates and settle conflicts by reading the code): node ${T}/name_symbol.mjs --build ${BUILD} ${PRETTY}/daemon.pretty.js --batch ${B}/names.tsv. Proposed: ${JSON.stringify(names)}
3. Run the check-mode rebuild: OUT=${BUILD} PKG=${A.pkg} bash ${T}/rebuild.sh (1 to 3 minutes: give the Bash call a 600000 ms timeout). Before PROMOTE these verdicts are expected and are not yours to fix: committedInSync=retarget-pending, anchorTargetMatches=pass or retarget-pending, firstPartyTree=fail (the committed first-party/ is the old release until PROMOTE; never edit it). Every other verdict must pass; fix what fails in the docs (citations, snippets, line anchors) and rerun until it does. If a step dies with exit 137 or "Killed", rerun with JOBS=1 before concluding anything.
4. Update docs/DUODUO_FRAMEWORK_GUIDE.md for these changes, in plain language with no code names (its rules are in CLAUDE.md), and record the release in its Appendix D: ${JSON.stringify(survey ? survey.guide : [])}
   Also update the facts in CLAUDE.md "duoduo runtime architecture" and in docs/README.md if a note changes one.
5. Leave PROMOTE, git and the unresolved items to the person running the bump.
Unresolved items from the groups: ${JSON.stringify(unresolved)}
Return a short report: the verdict line of the last rebuild, what you changed in step 4, and everything still open.`,
  { label: 'integrate', phase: 'Integrate' })

return { survey, groups: done, names, unresolved, integrate }
