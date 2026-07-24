// duoduo reconstruction — subsystem: 03-session-actor
// symbol: sweepTombstonedSessionRecords  (minified: vQe, daemon.pretty.js:75105)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function sweepTombstonedSessionRecords(e) {
 let t = 0,
  n = 0,
  r;
 try {
  r = await Df(e)
 } catch (o) {
  fe("[housekeeping] failed to list outbox records — sweep skipped", {
   error: o
  }), r = []
 }
 for (let o of r)
  if (o.status !== "pending" && ol(e, o.session_key)) try {
   await hme.unlink(Bg(e, o.channel_kind, o.id)), t += 1
  } catch (s) {
   s.code !== "ENOENT" && fe("[housekeeping] failed to remove tombstoned outbox record", {
    sessionKey: o.session_key,
    recordId: o.id,
    error: s
   })
  }
 let i = new Set(r.map(o => o.session_key));
 for (let o of await Kte(e)) i.add(o), !mme(Pr(e, o)) && !mme(vf(e, o)) && fe("[housekeeping] replay log decodes to a session key with no active or archived dir — skipping (decode may be lossy)", {
  sessionKey: o
 });
 for (let o of i) {
  if (!ol(e, o)) continue;
  let s = ba(e, o);
  try {
   await hme.unlink(s), n += 1
  } catch (a) {
   a.code !== "ENOENT" && fe("[housekeeping] failed to remove tombstoned replay log", {
    sessionKey: o,
    error: a
   })
  }
 }
 return t > 0 || n > 0 ? ee("[housekeeping] swept tombstoned-session records", {
  outboxRemoved: t,
  replayLogsRemoved: n
 }) : Ue("[housekeeping] no tombstoned-session records to sweep", {
  replayDir: Sk(e)
 }), {
  outboxRemoved: t,
  replayLogsRemoved: n
 }
}
