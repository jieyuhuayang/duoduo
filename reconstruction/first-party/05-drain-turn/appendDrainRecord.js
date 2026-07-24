// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: appendDrainRecord  (minified: _l, daemon.pretty.js:35318)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendDrainRecord(e, t) {
 await ye(e.usageDir);
 let n = drainRecordPath(e, t.session_key),
  r = `${JSON.stringify(t)}
`;
 await Tk.appendFile(n, r, "utf8")
}
