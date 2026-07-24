// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: readHostDotEnvFile  (minified: Loe, daemon.pretty.js:43919)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readHostDotEnvFile(e = process.env) {
 let t = hostDotEnvPath(e);
 try {
  let n = await Ia.readFile(t, "utf8");
  return parseDotEnv(n)
 } catch {
  return {}
 }
}
