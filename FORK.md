# Fork allocation ledger — node

This fork (`kirisame-meguru/node`) carries the **per-user-per-inbound traffic stats** feature directly on
**`main`** (`main` is the feature branch). See `../FORK-RESILIENCE.md` for the sync playbook and
`../xray-core/FORK.md` for the rationale behind reserved-high allocation.

## Allocation table

| Namespace | Symbol | File | Fork value | Upstream-conventional (PR-time) |
|-----------|--------|------|-----------|----------------------------------|
| error code | `FAILED_TO_GET_USERS_INBOUNDS_STATS` | `libs/contract/constants/errors/errors.ts` | **F900** | A019 |
| own package version | `@remnawave/node-contract` | `libs/contract/package.json` | 3.4.3 (fork) | revert for PR |
| own package version | node | `package.json` | 3.4.4 (= upstream; no fork bump needed) | n/a |
| dependency spec (feature-required) | `@remnawave/xtls-sdk` | `package.json` | `file:vendor/remnawave-xtls-sdk-0.17.1.tgz` | keep; remap to upstream-published |

## Base: node 3.4.4, matching upstream's released Xray

Node is rebased onto upstream tag **3.4.4**, including post-start plugins and dependency updates.
Its SDK fork **0.17.1** is based on upstream **0.17.0** and retains `getAllUsersInboundsStats`.
The vendored node-contract **3.4.3** also includes upstream's removal of `CipherType.NONE`; backend
consumes the rebuilt tarball. Vision/IP-block functionality remains removed.

The Dockerfile pins `XRAY_CORE_VERSION=v26.10.31-perinbound2`, `UPSTREAM_REPO=kirisame-meguru`.
The Xray fork is exactly one feature commit over **XTLS v26.10.31**, not latest Xray/main.
Verified by running `xray version` in upstream `ghcr.io/remnawave/node:3.4.4`:
`Xray 26.10.31 ... a4a3dff (go1.27.3 linux/amd64)`.
Upstream image digest: `sha256:19ca38195f699f59c0e5978489a18173234aca4b1bd29bab495b16e9d6423f70`.
`COPY vendor ./vendor` before `npm ci` resolves the fork SDK.

The fork-only stats method now follows upstream 3.4.1's `TResult` / `ok` / `fail` error contract.
Upstream xtls-sdk 0.17.0 still lacks `getAllUsersInboundsStats`; removing the SDK fork would require
moving that query/parser into node using `rawClient`, a separate refactor. Removing panel tracking
switches did not remove the statistics reader. The existing Xray `DispatchLink` path still records
per-inbound downlink only; see `../xray-core/FORK.md`.

CI publishes `3.4.4-perinbound2` and `sha-<full node commit>` image tags to
`ghcr.io/kirisame-meguru/node` (linux/amd64) after the pinned Xray release exists.
Docker verifies Xray's published SHA-256 before installing the binary. The GitHub release tag is
`3.4.4-perinbound2`, distinct from the imported upstream source tag `3.4.4`.

The `perinbound2` image contains opt-in REALITY legacy X25519 compatibility. The existing
`3.4.4` and `perinbound` image tags are not updated by this workflow: they retain the
`v26.10.31-perinbound1` core without that patch. Deploy by verified digest, not a moving alias.
Keep package/API version 3.4.4 and the existing per-inbound accounting feature in both variants.

The live fleet uses the patched `3.4.4-perinbound2` image at
`sha256:16d16678aff4681322058247719905f22493b7e4f9071ccea97345dbf8f48c83`.
HBR-FFT was upgraded and accepted first, with its own profile preserving host/squad access.
XVM-AMS01, XVM-AMS02, HTC-STO01 and HTC-STO02 then received the same patched image.
`inbounds[].streamSettings.realitySettings.allowLegacyX25519` is enabled on the REALITY
inbounds used by the verified subscriptions. Mihomo itself and subscription fingerprints
were not changed by this rollout.
The panel node list is authoritative; stale inventory entries such as `lhost-was` are excluded.

All five nodes report node 3.4.4 / Xray `v26.10.31-perinbound2`, are connected to the panel,
and returned HTTPS 204 with stock Mihomo v1.19.33 using Firefox and real subscription credentials.
The Amsterdam subscriptions also passed with their existing Edge fingerprints. HBR-FFT rejected
wrong public key, SNI, short ID and UUID. This verifies connectivity and authorization, not load
capacity or resistance to every network filtering system.

Each host retains its original Compose configuration, container inspection and relevant panel
profile in root-only `/opt/remnanode/20261103-reality-7f6dff35/`; original images were not pruned.
Restore both the image and corresponding profile when rolling back to a core without this option.
The prior unpatched 3.4.4 image remains available, but is not the deployed fleet image.

Verification for the preceding `3.4.4-perinbound1` release: strict `npm ci`, typecheck, Rspack build, and dependency tracing
passed. The running node reported 3.4.4 / Xray 26.10.31 over authenticated mTLS. Starting Xray,
real VLESS traffic, opt-in/opt-out inbound statistics, and reset were exercised through the
node API; zero-valued rows are omitted as before.

Publication uses GitHub Actions `fork-build.yml`, not local image uploads. The initial HTTP 422
dispatch rejection stopped occurring after GitHub CLI authentication was refreshed. Xray's missing
asset cache was populated with `scheduled-assets-update.yml` before retrying its release build.
The inherited upstream-only `build-and-push.yml` workflow is disabled in the fork.

Error codes use a reserved **F-prefix band** (upstream uses `A###` exclusively; no code-format
validator exists in node/backend, verified), so `F900` can never collide with upstream's next `A0##`.

## Cross-repo contract (must stay in sync, not a collision class but load-bearing)

The node no longer configures per-user-per-inbound tracking at all. It is switched on inside the xray
config itself — `$.inbounds[].trackTrafficPerUser` — which `generateApiConfig` passes through
untouched along with the rest of `config.inbounds`. The node used to synthesize
`policy.levels[0].statsUserInbound{Uplink,Downlink}` and `$.dispatcher.trackedInboundTags` from a
`StartXrayCommand` field `internals.trackedInboundTags`; all three are gone (contract 2.9.0), and the
matching policy proto fields were removed from xray-core. Restart-on-change is handled by the existing
`emptyConfig` hash, since the flag is part of the base config.

The node still reads the counters back: `getAllUsersInboundsStats` (xtls-sdk) queries the `useri>>>`
prefix that `xray-core/app/dispatcher/default.go` writes. That prefix is the only remaining cross-repo
coupling for this feature.

Descriptive identifiers (REST route `get-users-inbounds-stats`, `GetUsersInboundsStatsCommand`) are
unique strings → any collision is a visible git conflict; no reserved band needed.

## For PR / version handling

- Revert the **own `version`** field bumps (this repo's `package.json` and `libs/contract/package.json`)
  — versioning is the maintainer's call.
- **Keep** the `@remnawave/xtls-sdk` dependency-spec bump (the feature needs the SDK method
  `getAllUsersInboundsStats`), remapping it to whatever version upstream publishes.
- The lockfiles live in a separate `chore:` commit on this branch so they can be dropped/regenerated
  cleanly; on rebase conflict, take upstream's lockfile then `npm install`.
- Map error code **F900 → A019** at PR time.
