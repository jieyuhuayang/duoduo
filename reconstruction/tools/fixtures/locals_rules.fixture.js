// Fixture for the rule layer of name_locals.mjs (`node name_locals.mjs rules
// tools/fixtures/locals_rules.fixture.js --expect tools/fixtures/locals_rules.expected.txt`).
// Every top-level declaration is its own real name; each binding below is
// written the way esbuild leaves it (one letter), and the expected listing
// says which rule names it and how a collision is suffixed. Not runnable.
function readStatus(e) { return e; }
function resolveSessionDir(e) { return e; }
function useCounter() { return [0, () => {}]; }

function destructureRules({ sessionKey: e, display_name: t = "x" }, n) {
  let { status: r, ...i } = n;
  return [e, t, r, i];
}
function restParams(...e) { return e.length; }
function arrayRules(e, t) {
  for (let [n, r] of Object.entries(e)) t(n, r);
  let [i, o] = useCounter();
  let [s, a] = t.entries();
  return [i, o, s, a];
}
function memberRules(e) {
  let t = e.status,
      n = e?.config,
      r = e.session.id,
      i = e.job.cwd_rel ?? "",
      o = e.paths.varDir || "",
      s = e.owner.session_key;
  return [t, n, r, i, o, s];
}
function newAndCatch(e) {
  try {
    let t = new AbortController();
    return t;
  } catch (n) {
    return n;
  }
}
function counterRule(e) {
  for (let t = 0; t < e.length; t++) {
    for (let n = 0; n < t; n++) e[n] = t;
  }
}
async function calleeRules(e) {
  let t = await readStatus(e),
      n = resolveSessionDir(e),
      r = JSON.parse(e),
      i = e.trim(),
      o = e.getStatus(),
      s = e.toString(),
      a = e?.readConfig?.();
  return [t, n, r, i, o, s, a];
}
function collisions(e) {
  let t = e.status;
  {
    let n = e.status;
    return [t, n];
  }
}
