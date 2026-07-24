// duoduo reconstruction — subsystem: 09-memory
// symbol: enforceContractGate  (minified: pL, daemon.pretty.js:43607)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function enforceContractGate(e, t, n) {
 if (t.state === "partition-absent") return "partition-absent";
 if (t.state === "self-id-mismatch") return "self-id-mismatch";
 if (!t.enabled) return "partition-disabled";
 switch (t.state) {
  case "valid":
   return t.consumes.has(e) ? null : "kind-not-consumed";
  case "no-contract":
   return n ? null : "no-contract";
  case "parse-fail":
   return n ? null : "parse-fail"
 }
}
