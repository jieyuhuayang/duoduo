// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: initManageJobToolModule  (minified: Sw, daemon.pretty.js:63939)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Xst, Qst, ww, a_e, NV, eat, tat, nat, rat, iat, oat, u_e, sat, aat, uat, lat, fat, pat, mat, d_e, gat, _at, bat, vat, wat, Sat, kat, xat, initManageJobToolModule = O(() => {
    "use strict";
    initJobManagerModule();
    SV();
    dt();
    initCodexAppServerModule();
    initGrokAcpRuntimeModule();
    Cu();
    Lu();
    qR();
    initAgentSdkAdapterModule();
    lc();
    jl();
    Xst = `Keepalive job. After its initial run, the session stays dormant. Send a
Notify to the session_key above to wake it and continue the conversation.
You can also edit the job file directly to update the mission — the
change will take effect on the next run. Archive explicitly when done.`, Qst = "Delivery: a success waits in your inbox for your next turn, and nothing gives you a turn on its own; unless this job's instruction tells it to call Notify, the result reaches you only when someone next messages you. A failed run wakes you; a run cut off by a restart that will run again does not. The job is already dispatched, so do not promise to follow up unprompted.", ww = "ManageJob", a_e = "mcp__aladuo__ManageJob", NV = ["stateless: true is valid on any schedule EXCEPT keepalive — use it on a", "recurring job (standard cron or @every) or a re-armed once/@in chain.", `This job's schedule is "keepalive", which spawns one long-lived session and`, "keeps it alive for follow-up messages — its continuity comes from that single", "session's own thread, not from cross-run resume, so there is nothing for", '"stateless" to suppress. Applying it would make every follow-up message start a', "fresh thread (the session would forget the previous message). Remove", "`stateless` from this job, or convert the schedule to a recurring cron / @every", "if you intended a periodic stateless job."].join(`
`), eat = ['prompt_mode does not apply to the codex runtime, and this job sets runtime: "codex".', "The setting is consumed by the claude, grok, and pi runtimes; on codex it is a no-op.", 'Drop `prompt_mode`, or switch the job to runtime: "claude", "grok", or "pi".'].join(`
`), tat = `Create and inspect background jobs that run on a schedule.

Use this when:
- A user asks to set up a recurring or one-time automated task (create)
- You need to check what jobs are currently active (list)
- You need a job's instruction and its last outcome — success, or failure with its error (read)

Stopping a job is a shell command, not an action here: \`duoduo job archive <id>\` takes it off
the schedule while a run already in progress finishes, and \`duoduo job interrupt <id> -r
"<reason>"\` asks the run in progress to end.

A job is delegation with its own session: its own runtime, its own model, its own working
directory, durable on disk, separately accounted, and — on cron='keepalive' — able to be
re-engaged later. Reach for one when the work needs a different harness or model than yours,
must outlive this turn, or should be accounted separately. An in-session subagent is the
cheaper choice for fan-out on your own runtime within one turn; pi ships no subagent tool, so
unless one has been added there, a job is your delegation mechanism.

Creating a job starts a scheduler scan immediately, unless one is already running — then it
waits for the next cycle. A new 'once', 'keepalive', '@every', or elapsed '@in' job is due on
that scan; a standard cron job waits for its first calendar boundary.

The job's result comes back to you: a failure wakes you, a success waits and reaches you on
your next turn, and a run cut off by a restart that will run again delivers nothing. If a
person needs the result as soon as a run finishes, rather than on your next turn, or it must
go to someone else, say so in the instruction and have the job call \`Notify\` with the result.

For work you may want to follow up on or iterate interactively, use cron='keepalive' —
details on the cron field.`, nat = "stateless=true makes each run start fresh, for jobs whose state already lives in files; invalid on cron='keepalive'. Details on the field.", rat = ["A job can also carry its own SDK config on create: prompt_mode ('override' drops the", "runtime's coding preset for work that is not software engineering), allowedTools,", "disallowedTools, additionalDirectories, and extra_tools (ADDS built-in tools; it can", "never remove one)."].join(`
`), iat = ["On codex, model is guaranteed for stateless/fresh-thread jobs; a", "thread-resuming codex job keeps its start model (codex freezes model at", "thread/start; probe-verified)."].join(`
`);
    oat = `Inspect jobs. You are running inside a job session.

Available here:
- list / read — what is scheduled, including your own definition and state.
- create — available only to a cron='keepalive' job, which is a long-lived stand-in for a
  foreground session; its parameters describe what a new job needs. Any other schedule class
  gets an error explaining what to do instead: Notify your owner with the work you wanted and
  why it needs its own session.

Another run of your own is not an action here: call \`RemindDuoduo\` before this run ends, and
you get one more run without changing your schedule class. Omit it and a one-shot job
auto-archives, which is the normal ending.

When your run ends, the system delivers the outcome to your owner on its own: a failure wakes
them, a success waits for their next turn. If your instruction says the result must reach
someone as soon as it is ready, call Notify with the result; use it too for anything that
delivery would not carry, or to reach someone other than your owner. A Notify anywhere in the
run suppresses that run's automatic success delivery.`;
    u_e = "Required on create: the model id this job's runtime should use. Match the model to the shape of the work: steps you already specified (run commands, verify against a checklist, move files) need only a cheap/fast model, because the value is in your instruction rather than the worker's judgment; multi-file refactors and sustained multi-step debugging need a large-context model; open-ended research, design and writing — judgment your instruction cannot encode — need a flagship model. Ids are passed through verbatim (no whitelist; must contain no whitespace) and an invalid one surfaces as a runtime error on the job's first turn, not at create. One exception: on runtime 'pi' the id must be the canonical `provider/modelId` form, and a bare one is rejected at create rather than at the first turn. Valid ids differ per host and per runtime: `duoduo session model <session-key>` lists what this host can serve.", sat = " On codex, the model is guaranteed for stateless/fresh-thread jobs; a thread-resuming codex job keeps its start model (codex freezes model at thread/start; probe-verified).";
    aat = ft.enum(qi).describe("Optional reasoning effort for this job's turns. Match it to the model tier: a top-tier model runs 'high', every other model runs 'xhigh'. Omit it to inherit the host's configured per-runtime default (`<runtime>.effort`), which is the right choice unless this job's work differs from the host's norm. Only used by create.").optional(), uat = ft.string().describe(`${u_e} Only used by create.`).optional(), lat = ft.string().describe("REQUIRED on create: how this job is judged done. Write conditions someone can check — the file that must exist, the command that must exit clean, the question that must be answered — not an aspiration like 'improve the docs'. If you cannot write this, you have not finished specifying the job; fix the instruction first rather than sending a worker to guess. It bounds the job in both directions: the worker is not done until these hold, and work these do not ask for is work the job should not do. Stored with the job and shown to every run alongside the mission. Only used by create.").optional();
    fat = ft.enum(["append", "override"]).describe(`How this job's system prompt is assembled.
- 'append' (default): the runtime coding preset, then the identity / kind / instance prompt layers.
- 'override': drops the runtime coding preset/persona; on pi the harness's resident operating floor (tool list + guidelines) is retained.
Use 'override' for a job whose work is not software engineering and that does not need the coding-agent preset.`).optional(), pat = ft.array(ft.string()).describe("Additive only: adds to the standard core (file, shell, Agent and task tools) and can never remove a tool. In practice the useful additions are web/retrieval tools. Claude runtime only. Unioned with kernel/config/job.md, and stored in the job file under the nested key `claude: { tools }`.").optional();
    mat = {
        prompt_mode: fat,
        allowedTools: ft.array(ft.string()).describe("Tools whose permission prompts are auto-approved for this job. Does NOT widen the tool surface — a tool that is not on the surface stays unavailable. This matters more for a job than for a chat session: a scheduled run has nobody to answer a prompt.").optional(),
        disallowedTools: ft.array(ft.string()).describe("MCP tools this job may not call, written as 'mcp__server__Tool' or 'mcp__server'. Built-in tool names do not belong here: built-ins cannot be disallowed at all, because that surface is additive-only (see extra_tools).").optional(),
        additionalDirectories: ft.array(ft.string()).describe("Extra directories this job may read and write, beyond its working directory. Accepts '~/' paths. Use when the job's inputs or outputs live outside cwd_rel.").optional(),
        extra_tools: pat
    }, d_e = {
        action: ft.enum(["create", "list", "read"]).describe('Action to perform.\n- create: register a new job\n- list: show all active jobs with status\n- read: show a job\'s full definition, instruction, and last outcome (success, or failure with its error)\nStopping a job and re-arming one are not actions here: `duoduo job archive <id>` and `duoduo job interrupt <id> -r "<reason>"` are shell commands, and a job that wants another run of itself calls `RemindDuoduo`.'),
        id: ft.string().describe("Job identifier, used verbatim as a filename (no extension). It must be non-empty and contain no path separators or control characters; that is the whole validation. Prefer a unique, lowercase, hyphen-separated name (e.g. 'daily-news-summary'). Uniqueness is checked at create against the ACTIVE jobs only, so an archived id can be created again. Required for create and read.").optional(),
        cron: ft.string().describe(`Schedule for this job. Five formats supported:
- 'once' — run once on next scheduler cycle, then auto-archive (session is archived with it)
- '@in <duration>' — run once after a delay from now (e.g. '@in 30m'), then auto-archive
- 'keepalive' — run once on next scheduler cycle, then stay dormant. The session
  is preserved so you can resume the conversation later by sending a Notify to its
  session key (shown on ManageJob(list) output). Use this when the job result may
  need follow-up questions or iterative refinement (interactive worker use cases).
  Never auto-archives — archive it explicitly with \`duoduo job archive <id>\` when done.
- '@every <duration>' — repeat on a fixed interval (e.g. '@every 1h')
- Standard cron expression — run at fixed calendar times (e.g. '0 9 * * 1-5' for weekdays 9am)
Durations accept a single segment ('30m', '2h') or a composite ('1d6h4m' = 1 day 6 hours 4 minutes) in units s/m/h/d/w. An unparsable schedule is rejected at create.
Required for create.`).optional(),
        instruction: ft.string().describe(`Markdown describing the job's mission — what it does, how it decides, what it writes. This text is injected into the system prompt on every run and does not appear in the conversation as a user message. Required for create.

If a person needs the result as soon as a run finishes, rather than on your next turn, say here that the job must call Notify with the result. You get no turn of your own: a success reaches you only when someone next messages this session.

Editing the mission: the mission is stored as a markdown file at var/jobs/active/<id>.md. To change it, edit the file directly (with Edit/Write tools). The change takes effect on the next run of the job.

Cannot use ManageJob(create) to update a mission: calling create with an existing id will fail with 'already exists'. Use direct file edit, or archive it and create again (same or a new id), depending on whether you want to preserve the existing run history. A recreate starts with fresh scheduling state and a fresh session; the archived session is not restored.

Be specific: the job sees none of this conversation — only this mission, the acceptance text, and its cwd's CLAUDE.md.`).optional(),
        cwd_rel: ft.string().describe(`Working directory for the job, relative to the workspace root (e.g. 'projects/my-project'). If specified, the directory MUST already exist and MUST contain a CLAUDE.md context file — the job will fail to create otherwise. Use cwd_rel when the job needs project-level context from CLAUDE.md.

If omitted, the job runs in a private, runtime-managed workspace that persists across runs (NOT a stateless sandbox — files written there survive). Use this only for self-contained jobs that do not need project context and intentionally want a persistent private scratch directory.`).optional(),
        stateless: ft.boolean().describe(`Valid on any schedule except cron='keepalive' (error). When true, the
job starts each run fresh instead of resuming the prior run, and its mission
prompt gains a stateless contract: state is not retained, any cross-run
dependency must be written to a file this run, and the run verifies its own
close-out before finishing. Use when the job's durable state is already
file-based and you want to stop its context growing every run — recurring
jobs, and 'once'/'@in' chains a job keeps alive by re-arming itself.`).optional(),
        model: uat,
        effort: aat,
        acceptance: lat,
        ...mat
    };
    gat = {
        claude: "Claude Code",
        codex: "Codex, GPT",
        grok: "Grok",
        pi: "the embedded Pi SDK; never probes an external runtime and never falls back to Claude"
    };
    _at = d_e;
    bat = ["model is required on create — name the model this job should run on.", "", "Creation stops here rather than falling back to a host default. That pause", "is the point: host defaults vary and on some hosts are the most expensive", "model available, so inheriting one is a spend decision made by accident.", "", "Match the model to the shape of the work:", "- Steps you already specified (run commands, verify against a checklist,", "  move files) — a cheap/fast model. The value is in your instruction, not in", "  the worker's judgment.", "- Multi-file refactor or sustained multi-step debugging — a large-context", "  model.", "- Judgment your instruction cannot encode (open-ended research, design,", "  writing) — a flagship model.", "", "Valid ids differ per host and per runtime. `duoduo session model", "<session-key>` lists what this host can serve."].join(`
`), vat = ["acceptance is required on create — write down how this job is judged done.", "", "Conditions someone can check, not an aspiration: the file that must exist,", "the command that must exit clean, the question that must be answered, the", "state the repository must be in.", "", "If you cannot write it, the job is not specified yet — that is the finding,", "not an obstacle. Fix the instruction rather than sending a worker to guess.", "", "It bounds the work in both directions: not done until these hold, and", "anything they do not ask for is out of scope."].join(`
`), wat = ["ManageJob(create) is not available to this job. Creating jobs belongs to a", "foreground session, or to a cron='keepalive' job — a keepalive job is a", "long-lived stand-in for a foreground session and decides for itself. Your", "schedule is not keepalive, so you are an executor, not a dispatcher.", "", "What to do instead: call Notify to this job's owner, say what job you wanted", "to create and why the work needs its own session, and let the owner decide.", "A Notify with no target reaches the owner.", "", "list and read are unaffected. And if what you actually need is to run again", "later, call RemindDuoduo with '@in <duration>' — that re-arms YOU, creates", "nothing, and is the sanctioned way to keep a one-shot chain alive."].join(`
`), Sat = ["A keepalive job may create jobs, but not another keepalive job.", "", "Keepalive sessions never end on their own, so a keepalive that spawns", "keepalives leaks live sessions with no bound — and each child would inherit", "the same right.", "", "Dispatch the work as 'once' (or '@in <duration>' / a recurring schedule) and", "have it report back to you: its result reaches you as its owner. That is the", "leader-and-workers shape, and it is what keepalive's dispatch right is for."].join(`
`), kat = ["ManageJob has no 'archive' action. Ending a job is an operator verb now, and", "it lives in the shell:", "", "  duoduo job archive <id>                     stop future scheduling; a run", "                                              already in progress finishes", '  duoduo job interrupt <id> -r "<reason>"     ask the run in progress to end', "", "ManageJob keeps create, list and read."].join(`
`), xat = ["ManageJob has no 'reschedule' action.", "", "To give a job one more run, call RemindDuoduo: from inside the job it takes", "only `when` and re-arms that job, and from a shell it is", "`duoduo job reschedule <id> <when>`.", "", "ManageJob keeps create, list and read."].join(`
`)
});
