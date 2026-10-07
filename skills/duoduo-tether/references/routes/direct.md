# Direct bind: a fixed IP or the local network (R8)

Route notes. Read `setup.md` first: what these notes are, the requirements every route meets, and
the route-neutral sections (grant handover, verification, persistence and handoff) that apply here.

## What the channel does

`ALADUO_TETHER_HOST` sets the address the channel binds: an IP literal (IPv4 or IPv6), never a
hostname; the default is `127.0.0.1`. The channel serves plain HTTP on that address and port. Bound
beyond loopback, it logs one warning at start saying so, and starts anyway: the choice is the
owner's. It adds no TLS. `duoduo channel tether status` shows `Listening <host>:<port>`.

## Facts that decide whether this fits

- **TLS is still required at the public origin.** `ALADUO_TETHER_PUBLIC_URL` must be `https://` on
  port 443, and a passkey works only on a secure origin. So the channel's plain HTTP is never
  the origin itself: something terminates TLS for the public hostname and forwards to the bind
  address. A direct bind changes where that hop lands, not whether TLS exists.
- **What crosses the plain-HTTP hop.** Between the TLS terminator and the channel, bearer tokens,
  authorization codes, enrollment links and every tool answer (memory, the event log, mail) travel
  in clear. Anyone who can read that network segment can read them, and anyone who can reach the
  bind address can talk to the channel without TLS.
- **Binding beyond loopback opens the channel to that whole network.** Every device that can reach
  the address reaches the channel's routes (OAuth still guards every tool call; the authorize and
  enrollment pages are reachable). A host firewall can narrow who reaches it.
- **Who calls the public URL.** Hosted assistants (ChatGPT, Claude on the web, a vendor's cloud
  agent) call from the vendor's cloud: the public hostname must resolve and be reachable from the
  internet. A LAN-only hostname serves only clients that run on the LAN (a self-built agent, a
  desktop client that calls from the owner's machine).
- **The certificate must be trusted by every client.** The owner's browser (for the passkey pages)
  and each assistant's client must trust the public hostname's certificate: a publicly trusted
  certificate on a real domain (a DNS-01 challenge works for a LAN-only name), or a private CA the
  owner installs on every client device. A hosted assistant trusts only public CAs.
- **The address must not change.** A DHCP lease that moves leaves the bind address missing, and the
  channel fails to start. Use a static address or a DHCP reservation.

## Shapes this takes

| Shape                                                                        | Bind                                                            | Where TLS ends | What crosses in clear                                                             |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------- |
| A TLS proxy on this host, on its fixed public IP or LAN IP, port 443         | Leave the default (`127.0.0.1`)                                 | This host      | Nothing beyond loopback: this is R6 on the same host                              |
| A gateway on another machine of the LAN forwards to this host                | This host's LAN address                                         | The gateway    | The LAN hop from the gateway to this host                                         |
| A gateway reaches this host over an encrypted link (WireGuard, a tailnet IP) | The address on that link (a `100.x` tailnet IP, a WireGuard IP) | The gateway    | Nothing on the wire: the link encrypts it; the link's peers can reach the channel |

When a trusted LAN is acceptable, as facts for the owner to weigh:

- The segment between the TLS terminator and this host carries only devices the owner controls:
  a wired network, or a dedicated VLAN, with no guests and no shared Wi-Fi.
- No other person's device on that segment, since any of them could read tokens in transit.
- If either is not true, an encrypted link (the third shape) or a TLS proxy on this host (the first
  shape) keeps the hop off the wire.

## Steps

1. With the owner: which shape, the public hostname, where TLS ends, and who else is on the
   segment the plain-HTTP hop crosses. Write down the answers; the handoff needs them.
2. For a bind beyond loopback: confirm the address is static (`ifconfig` / `ip addr`, and the
   router's reservation), then add `ALADUO_TETHER_HOST=<IP>` to `~/.config/duoduo/.env` beside
   `ALADUO_TETHER_PORT`, and restart the channel (`duoduo channel tether stop`, then `start`).
3. The channel's log shows the non-loopback warning; `duoduo channel tether status` shows
   `Listening <IP>:<port>`.
4. Configure the TLS terminator (the owner's gateway or a proxy on this host) to the requirements
   of `setup.md`, forwarding to `http://<bind address>:<port>`. The gateway notes
   (`gateway.md`) give the full contract for a gateway.
5. Set `ALADUO_TETHER_PUBLIC_URL` and verify (`SKILL.md` step 1, which runs the checks in `setup.md`).

## Verify (in addition to setup.md)

- From another device on the segment: `curl -sS -o /dev/null -w '%{http_code}\n' -X POST
http://<bind address>:<port>/mcp` gives 401 when the bind is meant to be reachable there; from a
  device that should not reach it, the connection fails.
- Nothing else on this host became reachable: the daemon's ports and every other loopback service
  still refuse connections on the bind address.

## Persistence, handoff and rollback

- The setting lives in `.env`; the channel binds it at every start. A missing address (a changed
  lease, an interface down) stops the channel from starting: the channel log names the error.
- The handoff records the shape, the bind address, where TLS ends, and the segment's trust
  decision as the owner made it.
- Rollback: remove `ALADUO_TETHER_HOST` from `.env` and restart the channel; it binds `127.0.0.1`
  again. Undo the TLS terminator's forwarding as its own notes say.

## What is measured

| Fact                                                                   | Status                            |
| ---------------------------------------------------------------------- | --------------------------------- |
| The channel binds an `ALADUO_TETHER_HOST` IP and refuses a hostname    | Tested in the channel's own suite |
| A full direct-bind route (a LAN gateway to this host) for an assistant | Not tested                        |
