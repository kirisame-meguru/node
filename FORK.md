# Fork allocation ledger — node

This fork (`kirisame-meguru/node`) carries the **per-user-per-inbound traffic stats** feature on branch
`per-user-per-inbound-traffic-stats`. See `../FORK-RESILIENCE.md` for the sync playbook and
`../xray-core/FORK.md` for the rationale behind reserved-high allocation.

## Allocation table

| Namespace | Symbol | File | Fork value | Upstream-conventional (PR-time) |
|-----------|--------|------|-----------|----------------------------------|
| error code | `FAILED_TO_GET_USERS_INBOUNDS_STATS` | `libs/contract/constants/errors/errors.ts` | **F900** | A018 |
| own package version | `@remnawave/node-contract` | `libs/contract/package.json` | bumped (fork) | revert for PR |
| own package version | node | `package.json` | 2.7.0 → 2.8.0 | revert for PR |
| dependency spec (feature-required) | `@remnawave/xtls-sdk` | `package.json` | 0.15.0 | keep; remap to upstream-published |

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
