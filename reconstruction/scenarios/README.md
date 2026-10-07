# Scenarios: running the reconstructed daemon to test what the docs claim

`docs/AGENT_INTERNALS_ANALYSIS.md` §14 lists the claims that static reading
cannot settle. Each script here boots the reconstructed daemon, instrumented
by `tools/instrument.mjs` so every first-party function (and, with `--inner`,
every closure inside one) writes an enter/exit line to a trace, drives one
scenario through the two RPC listeners and the data directories, and leaves a
report under `.build/scenarios/<name>/`:

| file | what |
|---|---|
| `report.md`, `report.json` | the call tree per step (`tools/trace_report.mjs`): functions in order of first entry, nesting, durations, failures |
| `trace.jsonl` | the raw trace: `enter` / `exit` / `fail` events with a summary of the arguments, and the `mark` lines the script wrote between steps |
| `boot.log` | the daemon's own log (`ALADUO_LOG_LEVEL=info`) |
| `rpc.jsonl` | every RPC the script sent and the response |
| the rest | files the script copied out of the isolated HOME with `save` |

Run them all, or some, from `reconstruction/` with the scratch install that
`maps/pipeline_report.json` records (never the global install):

```bash
PKG=/tmp/duoduo-pkg/node_modules/@openduo/duoduo/dist/release bash scenarios/run.sh            # all
PKG=… bash scenarios/run.sh 01-boot 05-dedup                                                   # some
```

`run.sh` instruments `recon/daemon.recon.js` into `$PKG/daemon.traced.js`
(the file must sit in `dist/release`: the daemon resolves its dependencies and
its package root from its own location), then runs each script. The scripts
source `lib.sh`, which isolates everything: a fresh `HOME` under `/tmp` per run,
a TCP port of its own per scenario (20300 + the scenario number), the daemon
started with `node`, never with the `duoduo` CLI (which drives the machine's
real daemon through launchd or the real install), and an auth source that
cannot reach a model unless the script sets one on purpose.

The instrumented daemon is a run artifact outside the equivalence proof: it is
the recon file plus wrappers that log entry and exit, nothing else changes.

What each scenario tests, and the §14 item or section it settles, is in the
comment at the top of its script. Each run's conclusions are written up in
`findings/<name>.md` (the claim tested, the steps, the evidence from the trace
and the data directories, a verdict per claim, and the sentence proposed for
the doc), dated and stamped with the release they were measured on. The docs
take them from there, as `confirmed` claims that name the function the trace
shows and say they were measured on the reconstructed daemon, or as corrections.
A finding is evidence for that release and that path only: a later release
needs the scenario rerun, not the finding copied.
