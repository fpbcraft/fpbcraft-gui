# FPBCraft GUI — Implementation Progress

Last updated: **2026-10-04**

Canonical plan: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

## Active slice

**Slice 1 — Discover & Decide: in progress**

Working branches:

- backend: `fpbcraft/fpbcraft:feat/discover-decide` → draft PR #8 targeting `main`; the branch carries the completed FPBPack foundation stack because those intermediate stacked branches were merged/deleted before being promoted to `main`;
- GUI: `fpbcraft/fpbcraft-gui:feat/discover-decide` → draft PR #2 targeting `main` after the foundation GUI PR merged.

The user merges PRs manually. These branches must not be merged automatically.

## Backend / FPBPack

### Completed

- [x] Add `doctor` diagnostics model with blocking, warning, informational, and actionable findings.
- [x] Detect accepted managed artifacts that are missing, moved, or replaced outside FPBPack.
- [x] Detect newly added artifacts in managed deployment directories.
- [x] Keep explicitly unmanaged/pinned artifacts out of managed-file drift warnings.
- [x] Add shared read-only management state used by CLI and HTTP.
- [x] Add `fpbpack doctor --inventory ... --report ...`.
- [x] Add `fpbpack serve --inventory ... --report ...`.
- [x] Add read-only endpoints for status, inventory, mods, diagnostics, and health.
- [x] Reload source JSON on each API request so a new inventory is visible without restarting the service.
- [x] Add unit tests for drift detection, domain projection, and HTTP behavior.
- [x] Document the diagnostics/API commands in the FPBPack README.

### Remaining in Slice 1

- [ ] Provider-aware candidate discovery for Modrinth and CurseForge.
- [ ] Minecraft 1.21.1 + NeoForge compatibility filtering.
- [ ] Release-channel and major-version-jump classification.
- [ ] Safe / Review / Blocked / Ignored candidate model.
- [ ] Dependency additions/updates and unresolved-dependency blockers.
- [ ] Reverse-dependency metadata where providers expose it.
- [ ] Project icons, provider links, release metadata, and changelog aggregation.
- [ ] Durable pin/ignore/review-later state.
- [ ] Update discovery and pin/ignore API routes backed by the same services as CLI.

## GUI

### Completed

- [x] Move navigation to Overview / Updates / Mods / History / Settings.
- [x] Add a server-side FPBPack API adapter using `FPBPACK_API_URL`.
- [x] Preserve the existing read-only JSON mount as a compatibility fallback.
- [x] Preserve Vercel demo behavior.
- [x] Replace the migration-oriented overview with an inbox-oriented management overview.
- [x] Surface diagnostics and external-management problems on the overview.
- [x] Move the Mods browser onto the domain management model rather than raw Packwiz joins.
- [x] Add deployment, management-state, provider, and text filters to Mods.
- [x] Add initial Updates, History, and Settings workspaces.
- [x] Update the responsive navigation/filter layout for the new information architecture.

### Remaining in Slice 1

- [ ] Show real update candidates and counts from FPBPack.
- [ ] Safe / Review / Blocked / Ignored grouping with selection.
- [ ] Update-all-safe and refresh/check-update actions.
- [ ] Latest-valid-version and update status in the Mods browser.
- [ ] Mod/project icons.
- [ ] Mod detail modal on desktop and sheet on mobile.
- [ ] Full and intermediate changelogs.
- [ ] Dependency relationships in detail/review UI.
- [ ] Pin/ignore/review-later controls.
- [ ] Finish mobile feature parity for the update/detail workflows.

## Safety checkpoint

Current Slice 1 code is intentionally **read-only**. There is no API or GUI operation that mutates live mod JARs. Live mutation remains reserved for Slice 3 after deterministic planning, prefetch/verification, external-change protection, and restore points exist.

## Validation

- Backend draft unit tests were exercised locally against a compile fixture matching the current catalog/inventory types.
- Repository CI is the authoritative validation for backend PR #8.
- GUI typecheck/build validation is handled by PR #2 CI because this execution environment cannot reach GitHub/npm directly.
