# Fork allocation ledger — node

This fork (`kirisame-meguru/node`) carries the **per-user-per-inbound traffic stats** feature directly on
**`main`** (`main` is the feature branch). See `../FORK-RESILIENCE.md` for the sync playbook and
`../xray-core/FORK.md` for the rationale behind reserved-high allocation.

## Allocation table

| Namespace | Symbol | File | Fork value | Upstream-conventional (PR-time) |
|-----------|--------|------|-----------|----------------------------------|
| error code | `FAILED_TO_GET_USERS_INBOUNDS_STATS` | `libs/contract/constants/errors/errors.ts` | **F900** | A018 |
| own package version | `@remnawave/node-contract` | `libs/contract/package.json` | 3.3.0 (fork) | revert for PR |
| own package version | node | `package.json` | 3.3.2 (= upstream; no fork bump needed) | n/a |
| dependency spec (feature-required) | `@remnawave/xtls-sdk` | `package.json` | `file:vendor/remnawave-xtls-sdk-0.16.1.tgz` | keep; remap to upstream-published |

## Base: node 3.3.2. Vision module gone → xtls-sdk unpinned

node 2.8.0 **deleted the Vision/IP-block module** (no more `router.addSrcIpRule()`), which is why the
xtls-sdk fork could finally move from the 0.12.4 pin to **0.16.1** (rebased on upstream 0.16.0). node
3.3.2 depends on `@remnawave/xtls-sdk` 0.16.0; the fork vendors 0.16.1 as `node/vendor/*.tgz` (file:
dep) so `getAllUsersInboundsStats` is available. Upstream 3.x moved the Dockerfile to `docker/Dockerfile`;
its `xray` stage is repointed at the fork's xray release: `XRAY_CORE_VERSION=v26.7.28-perinbound1`,
`UPSTREAM_REPO=kirisame-meguru` (upstream uses stock `XTLS`/`v26.7.28`). A `COPY vendor ./vendor` was
added before `npm ci` so the file: dep resolves.

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
- Map error code **F900 → A018** at PR time.
