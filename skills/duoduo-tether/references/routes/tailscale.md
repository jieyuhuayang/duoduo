# Tailscale: Funnel (R1) and a second, isolated node (R2)

Reference notes for one way to expose the tether channel. The agent and its owner choose this
option and own it, its security included; it is not an official procedure, and tether supports
no route. Read `SKILL.md` first for its general policy, and `setup.md` for the shared requirements of every
route and the route-neutral sections (grant handover, verification, persistence and
handoff) apply here.

Contents:

- R1: Funnel on the existing node
- R2: a second Tailscale node, tagged and isolated
  - Order of operations
  - Step 2: the policy edit
  - Steps 3–5: start, login, Funnel
  - Step 6: negative tests
- Verify (in addition to setup.md)
- Persistence
- Handoff and rollback
- Grants
- What is measured

## R1: Funnel on the existing node

Funnel's public switch is per host:port. Every path served on that port goes public with it. So
R1 is allowed only when `tailscale serve status` and `tailscale funnel status` show nothing on
:443. If :443 has any route, R1 is out: do not move or delete that route, and do not funnel the
port. On macOS, `tailscale` below means the app's CLI by full path.

```bash
tailscale funnel --bg --https=443 http://127.0.0.1:<ALADUO_TETHER_PORT>
tailscale funnel status
```

- If Funnel is off for the tailnet, the command prints a consent URL and waits. Run it in the
  background, hand the URL to the owner (`setup.md`, Hand a grant to the owner), wait for "done".
- `funnel status` must show the new entry, `https://<node>.<tailnet>.ts.net` →
  `http://127.0.0.1:<ALADUO_TETHER_PORT>`, and every entry that was there before, unchanged.
- R1 adds no tailnet path: the node's tailnet exposure is what it was, and not yours to change.

## R2: a second Tailscale node, tagged and isolated

A second node has its own name and its own :443, so it coexists with whatever the existing node
serves. In userspace mode it also opens a door that the policy must close. These facts are
verified in Tailscale source, v1.102.4:

- **A userspace node forwards inbound tailnet TCP to the host's loopback.**
  `cmd/tailscaled/netstack.go` sets `ProcessLocalIPs` in userspace mode. In
  `wgengine/netstack/netstack.go` (`acceptTCP`), a connection to the node's own Tailscale IP on a
  port with no serve handler is redialled to `127.0.0.1:<same port>`. So every tailnet device the
  policy lets reach this node reaches every loopback-only service on the host, the daemon's local
  ports included.
- **`--shields-up` cannot be the guard.** Tailscale refuses Funnel with shields-up, and shields-up
  with Funnel: `ipn/ipnlocal/serve.go` ("Unable to turn on Funnel while shields-up is enabled"),
  `ipn/ipnlocal/local.go` ("Cannot enable shields-up when Funnel is enabled.").
- **The guard is the policy.** The packet filter runs before netstack (`net/tstun/wrap.go` filters
  inbound packets; netstack receives only what passes, through its post-filter hook in
  `wgengine/netstack/netstack.go`). So peers the policy denies never reach the loopback
  forwarding. The node joins with a tag, and no ACL rule or grant may have a destination covering
  that tag. The default policy's `"dst": ["*:*"]` covers tagged nodes too, so a tailnet on the
  default allow-all policy must be edited first.
- **Funnel does not need tailnet ACL access.** Tailscale's ingress nodes deliver Funnel traffic
  through the node's peer API (`/v0/ingress`, registered in `ipn/ipnlocal/serve.go`), gated by the
  ingress capability (`canIngress` in `ipn/ipnlocal/peerapi.go`). It is served only per the serve
  config (443 → the channel's port).

### Order of operations

1. Tell the owner up front: two grants (a policy edit and a device login), and the device login at
   `login.tailscale.com` may ask them to log in a second time even when the admin console is open.
2. Policy edit (owner).
3. Start the node.
4. Login (owner).
5. Funnel.
6. Negative tests.
7. Only then write `ALADUO_TETHER_PUBLIC_URL` and run the public checks (`SKILL.md` step 1).

### Step 2: the policy edit

An edit that narrows `*:*` carelessly can cut the owner off from subnet routes and from devices
shared in from other accounts. Do it in this order:

1. **Back up.** Save the current policy text in a 0600 file on the host before anything else.
   Record its path in the handoff.
2. **Enumerate what every existing rule reaches.** From the admin console's machines page and the
   policy: the owner's devices, other users' devices, every tag in use, every approved subnet route
   (its CIDR and the router), exit nodes, and devices shared in from other accounts. List them for
   the owner.
3. **Edit minimally.** Add the tag owner and the `nodeAttrs` entry. Change only the rules whose
   destination covers `tag:duoduo-tether` (`*`, `*:*`, or the tag). In each such rule, replace the
   wildcard with the explicit list from step 2: owner devices, existing tags, each subnet CIDR,
   each shared-in device. Never replace `*:*` with a shorter list without first listing what it
   covered. Leave every other rule as it is.
4. **Add a `tests` block** as the lockout guard. Tailscale refuses to save a policy whose tests
   fail, so a test that the owner still reaches each kind of existing destination blocks a lockout
   before it happens.
5. **Show the owner the exact diff**, and save only after the owner says yes (`setup.md`, Hand a grant to the owner).
6. **After saving**, `tailscale ping` two existing peers from this host; both must still answer.

```jsonc
{
  "tagOwners": {
    "tag:duoduo-tether": ["autogroup:admin"],
  },
  // Funnel for this tag only. Preferred over enabling Funnel tailnet-wide.
  "nodeAttrs": [{ "target": ["tag:duoduo-tether"], "attr": ["funnel"] }],
  // Only the rules whose dst covered the tag change; each lists what "*:*" covered.
  "acls": [
    {
      "action": "accept",
      "src": ["autogroup:member"],
      "dst": [
        "<owner>@<domain>:*",
        "tag:<existing>:*",
        "<subnet CIDR>:*",
        "<shared-in device IP>:*",
      ],
    },
  ],
  "tests": [
    {
      "src": "<owner>@<domain>",
      "accept": [
        "<this host IP>:22",
        "<a subnet IP>:22",
        "tag:<existing>:22",
        "<shared-in device IP>:22",
      ],
      "deny": [
        "tag:duoduo-tether:22",
        "tag:duoduo-tether:<ALADUO_TETHER_PORT>",
      ],
    },
  ],
}
```

The negative test of step 6 below is the proof, not the owner's "done".

### Steps 3–5: start, login, Funnel

```bash
D=<a state directory, e.g. ~/.local/share/duoduo-tailscale>
mkdir -p "$D" && chmod 700 "$D"
nohup tailscaled --tun=userspace-networking --statedir="$D" \
  --socket="$D/tailscaled.sock" --port=0 >>"$D/tailscaled.log" 2>&1 &
nohup tailscale --socket="$D/tailscaled.sock" up --hostname=<host>-duoduo \
  --advertise-tags=tag:duoduo-tether >"$D/up.log" 2>&1 &     # the login URL appears in up.log
tailscale --socket="$D/tailscaled.sock" funnel --bg --https=443 http://127.0.0.1:<ALADUO_TETHER_PORT>
tailscale --socket="$D/tailscaled.sock" funnel status
```

- `--statedir`, not `--state=<file>`. With only a state file, `tailscaled` has no var root and
  never obtains the Funnel certificate (its log says `no TailscaleVarRoot`).
- `tailscaled` and `tailscale` here are the standalone ones (on macOS, Homebrew's). Every command
  for this node carries `--socket`. Without it the command talks to another node.
- Own state directory, own socket, `--port=0` (a free UDP port) and userspace networking keep the
  existing node untouched.
- `funnel status` must list exactly one entry: `https://<host>-duoduo.<tailnet>.ts.net` →
  `http://127.0.0.1:<ALADUO_TETHER_PORT>`.
- The existing node's `serve status` and `funnel status` must be unchanged.
- Do not pin the home DERP region with `tailscale debug force-prefer-derp`: on a tailnet with
  custom regions, the next netcheck moves home back, and Funnel drops with it. Such a tailnet
  takes another route (`setup.md`, Choose a route).

### Step 6: negative tests

Read the new node's Tailscale IP: `tailscale --socket="$D/tailscaled.sock" ip -4`. From another
tailnet device, connect to that IP on every loopback port from discovery, plus 443. If no other
device is available to you, use the host's existing node: it is a different tailnet peer.

```bash
for p in <every loopback port from discovery> 443; do
  curl -sS -m 5 -o /dev/null "http://<new-node-ip>:$p/"; echo "port $p: curl exit $?"
done
```

Pass: every port gives exit 7 (could not connect) or 28 (timeout). If `tailscale ping <new-node-ip>`
from the existing node says `no matching peer`, the policy hides the node entirely: that is the
strongest pass, not a broken test. Any other exit means the port connected. Then stop the node at
once (`tailscale --socket="$D/tailscaled.sock" down`) and tell the owner which port connected: the
policy still lets peers reach the tag.

Then write the URL and run the internet-side checks (`SKILL.md` step 1, which runs the checks in `setup.md`).

## Verify (in addition to setup.md)

- The public name may resolve to a tailnet address inside the tailnet, or not at all when the
  policy hides the node (R2): pin the public address with `--resolve`, as `setup.md` shows.
- The control plane sets which ports Funnel may use (`CapabilityFunnelPorts` in
  `tailcfg/tailcfg.go`; Tailscale documents 443, 8443 and 10000). On the public name, 8443 and
  10000 must fail: curl exit 28 or 35 both pass.
- R2: the tailnet negative test of step 6 must have passed.
- After a home-DERP change or a node restart, Funnel can take about a minute before requests
  succeed; judge only after that.

## Persistence

- R1: `--bg` keeps the Funnel entry in the node's state; the existing node already starts at boot.
- R2: run `tailscaled` with the same flags (`--statedir`, `--socket`, `--port=0`, userspace) under
  a supervisor that restarts it on exit. macOS: a user LaunchAgent in `~/Library/LaunchAgents/`
  (`RunAtLoad`, `KeepAlive`, the full flag list in `ProgramArguments`). Do not use
  `brew services`: it runs `tailscaled` with default paths, not this node's. Linux: a systemd unit
  with `Restart=always`. The Funnel entry lives in the node's state and comes back with it.

## Handoff and rollback

The handoff note for R2 lives in `$D`. Beyond what `setup.md` (Persistence) lists, record the tag,
the policy backup path, and the enumeration of what the old rules covered.

- R1 rollback: `tailscale funnel --https=443 off`. Touch no other entry.
- R2 rollback: `tailscale --socket=… funnel reset`, `tailscale --socket=… logout`, remove the
  service, then `$D`. The owner may restore the backed-up policy or remove only the tag and
  `nodeAttrs`.
- Do not touch: the existing Tailscale node and its serve config.

## Grants

Hand each to the owner as `setup.md` (Hand a grant to the owner) says.

| Grant                | It grants                                                                                                     | Verify after                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| R2 policy edit       | A tag for duoduo's node, Funnel for that tag only, and no tailnet device may connect to it.                   | The tests block saved; peers still answer; R2 step 6           |
| `tailscale up` login | A new device `<host>-duoduo`, tagged `tag:duoduo-tether`, joins the owner's tailnet. May need a second login. | `tailscale --socket=… status` shows it online, owner's tailnet |
| Funnel consent (R1)  | The tailnet allows HTTPS certificates and Funnel, so this node may publish its :443 to the internet.          | `tailscale funnel status` shows the new entry                  |

## What is measured

| Fact                                                                                        | Status                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Funnel publishes every path of a host:port, not one path                                    | Verified in Tailscale source: `ipn/serve.go` (`AllowFunnel` keyed by host:port), `ipn/ipnlocal/serve.go` (path handlers looked up after the per-host:port check)                                                   |
| `tailscale funnel` prints a consent URL when Funnel is off for the tailnet                  | Verified in Tailscale source: `cmd/tailscale/cli/funnel.go` (`enableFeatureInteractive`)                                                                                                                           |
| A userspace node forwards inbound tailnet TCP to every host loopback port                   | Verified in Tailscale source (v1.102.4): `cmd/tailscaled/netstack.go`, `wgengine/netstack/netstack.go` (`acceptTCP`)                                                                                               |
| Shields-up and Funnel exclude each other                                                    | Verified in Tailscale source (v1.102.4): `ipn/ipnlocal/serve.go`, `ipn/ipnlocal/local.go`                                                                                                                          |
| The packet filter runs before netstack, so ACL-denied peers never reach loopback forwarding | Verified in Tailscale source (v1.102.4): `net/tstun/wrap.go`, `wgengine/netstack/netstack.go`                                                                                                                      |
| Funnel traffic arrives through the peer API, gated by the ingress capability                | Verified in Tailscale source (v1.102.4): `ipn/ipnlocal/serve.go` (`/v0/ingress`), `ipn/ipnlocal/peerapi.go` (`canIngress`)                                                                                         |
| The Funnel setting persists in the node's state                                             | Verified in Tailscale source (v1.102.4): the serve config is written to the state store under `ipn.ServeConfigKey` (`ipn/serve.go`, `ipn/ipnlocal/serve.go`)                                                       |
| Funnel reaches a node the policy hides from every tailnet peer                              | Measured on a macOS host (Tailscale app 1.102.4 beside Homebrew 1.102.5): the public URL answered while every loopback port timed out from the tailnet                                                             |
| A second, userspace `tailscaled` beside the Tailscale app on macOS                          | Measured: it ran without disturbing the app's node                                                                                                                                                                 |
| `--state=<file>` without `--statedir` never gets a Funnel certificate                       | Measured on 1.102.5 (`no TailscaleVarRoot`); `--statedir` obtained it                                                                                                                                              |
| `OmitDefaultRegions: true` stops Funnel ingress from reaching the node                      | Measured: TLS hung at the ingress until the field was set to `false`                                                                                                                                               |
| R1/R2 with custom DERP regions present                                                      | Measured: R2 worked only while the node's home DERP was a default region. Netcheck moved home back to a closer custom region within minutes; `debug force-prefer-derp` did not hold, even re-applied by a watchdog |
| Funnel recovery after a home-DERP change                                                    | Measured: about a minute                                                                                                                                                                                           |
| The host's MagicDNS cannot resolve a node the policy hides                                  | Measured: `ENOTFOUND` on the host while the name resolved through a public resolver                                                                                                                                |
