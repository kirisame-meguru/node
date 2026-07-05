# Fork allocation ledger — node

This fork (`kirisame-meguru/node`) carries the **per-user-per-inbound traffic stats** feature directly on
**`main`** (`main` is the feature branch). See `../FORK-RESILIENCE.md` for the sync playbook and
`../xray-core/FORK.md` for the rationale behind reserved-high allocation.

## Allocation table

| Namespace | Symbol | File | Fork value | Upstream-conventional (PR-time) |
|-----------|--------|------|-----------|----------------------------------|
| error code | `FAILED_TO_GET_USERS_INBOUNDS_STATS` | `libs/contract/constants/errors/errors.ts` | **F900** | A018 |
| own package version | `@remnawave/node-contract` | `libs/contract/package.json` | 2.8.0 (fork) | revert for PR |
| own package version | node | `package.json` | 2.8.0 (= upstream; no fork bump needed) | n/a |
| dependency spec (feature-required) | `@remnawave/xtls-sdk` | `package.json` | `file:vendor/remnawave-xtls-sdk-0.16.1.tgz` | keep; remap to upstream-published |

## Base: node 2.8.0. Vision module gone → xtls-sdk unpinned

node 2.8.0 **deleted the Vision/IP-block module** (no more `router.addSrcIpRule()`), which is why the
xtls-sdk fork could finally move from the 0.12.4 pin to **0.16.1** (rebased on upstream 0.16.0). node
2.8.0 depends on `@remnawave/xtls-sdk` 0.16.0; the fork vendors 0.16.1 as `node/vendor/*.tgz` (file:
dep) so `getAllUsersInboundsStats` is available. The Dockerfile `xray` stage is repointed at the fork's
xray release: `XRAY_CORE_VERSION=v26.6.27-perinbound1`, `UPSTREAM_REPO=kirisame-meguru` (upstream uses
stock `XTLS`/`v26.6.27`). A `COPY vendor ./vendor` was added before `npm ci` so the file: dep resolves.

Error codes use a reserved **F-prefix band** (upstream uses `A###` exclusively; no code-format
validator exists in node/backend, verified), so `F900` can never collide with upstream's next `A0##`.

## Cross-repo contract (must stay in sync, not a collision class but load-bearing)

The Xray policy flags and dispatcher allowlist this repo emits must match xray-core's proto field
*names*: `statsUserInboundUplink`, `statsUserInboundDownlink` (→ `Policy.Stats.user_inbound_*`) and
`dispatcher.trackedInboundTags` (→ dispatcher `Config.tracked_inbound_tags`). Field *numbers* changed
in xray-core (50/51/50) but names did not — node references names, so it is unaffected by the renumber.

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
