# Remote preview and debugging

## Default: direct HTTP over Tailscale

The site runs on ROG; review happens on a remote Mac or another device in the
same tailnet. Use the server's **Tailscale IP and explicit HTTP port**. Do not
present the server's localhost URL as remotely accessible.

Tailscale Serve was trialled on 2026-11-14 and disabled after Mac-side proxy and
resource-loading problems. Direct HTTP is the default again. Do not reintroduce
a domain, TLS or reverse proxy unless the user requests it. The precise cause
of the Mac's missing styles/images on the HTTPS preview was not established.

## Current preview

- URL: **http://100.97.164.37:5186/**.
- Project example: **http://100.97.164.37:5186/dodgeui.html**.
- Working directory: `/home/joey/dev/website/main`, serving its checked-out branch.
- tmux session: `website-main-dev`; log: `/home/joey/dev/website/main-dev.log`.
- ROG IP: `100.97.164.37`; `100.85.135.52` is the Mac, not the server.
- Machine/port assignments: `/home/joey/dev/website/README.md`.

Start on ROG after checking that the session and port are free:

```sh
tmux new-session -d -s website-main-dev -c /home/joey/dev/website/main \
  'export PATH=/home/joey/.local/bin:$PATH; npm run dev -- --host 0.0.0.0 --port 5186 --strictPort >> /home/joey/dev/website/main-dev.log 2>&1'
```

`0.0.0.0` listens on all interfaces, including Tailscale and LAN. Vite permits IP
hosts by default; a hostname allowlist override is unnecessary for this workflow.
The page, local assets and Vite WebSocket use the same host and port.

## Operating rules

- Use one named tmux session and a fixed `--strictPort` port per working directory.
- Inspect an occupied port's process and working directory before reusing it.
  Do not stop another session's server or silently move to a different port.
- Keep previews running for review until the user requests shutdown. tmux
  survives SSH disconnection, but the backend needs restarting after reboot.
- Use `npm run dev` for live changes; use `npm run check` and a built preview for
  production verification. Label URLs with directory/branch and dev/built mode.
- Access the explicit `http://` URL with Tailscale connected. If the Mac uses a
  proxy, keep the server's Tailscale IP on its DIRECT/bypass list. Browser proxy
  settings and shell `NO_PROXY` are separate.
- HTTP on a remote IP is not a browser secure context. If a feature needs one,
  use the SSH localhost fallback below rather than changing the standard entry.

## Verification

Check the homepage, direct project routes and refresh, 404 content, and `/zh/`
when the served worktree provides Chinese routes. Verify styles, images, fonts,
modules and the Vite WebSocket; page HTTP 200 alone is insufficient. Confirm
source updates appear in the remote browser. External fonts/video depend on the
client's network and are not relayed by the dev server.

For UI changes, inspect desktop/mobile layouts, theme and reduced-motion states
where relevant. Compare computed styles and bounds of the entire surrounding
row: text baselines, icon occupancy, spacing and wrapping. Do not judge an icon
or label in isolation.

Report server-side checks separately from actual Mac-side verification. If the
page has default browser styles or oversized SVGs, inspect failed stylesheet,
module and image requests before treating it as a layout regression.

## SSH fallback

Run on the **Mac**, after checking its local port is free:

```sh
ssh -NT -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -L 127.0.0.1:5186:127.0.0.1:5186 joey@100.97.164.37
```

Then open `http://127.0.0.1:5186/` on that Mac while the tunnel is connected.

To stop the development backend deliberately, run on ROG:

```sh
tmux kill-session -t website-main-dev
```
