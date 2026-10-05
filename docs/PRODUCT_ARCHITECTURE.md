# FPBCraft GUI — Product & Architecture Plan

Status: **target architecture / product contract**

This document defines what FPBCraft GUI is intended to become before further UI or backend implementation work. It should be treated as the reference for product decisions unless deliberately updated.

## 1. Product scope

FPBCraft GUI is a single-admin management console for one Minecraft server: FPBCraft.

It is not intended to be:

- a multi-user panel;
- a multi-server control plane;
- a generic modpack authoring tool;
- a replacement for Crafty;
- a public remote-control surface;
- a second implementation of mod-management rules.

The GUI should feel like a practical admin tool: compact, information-dense, dark-only, responsive on desktop and mobile, and focused on useful actions rather than explanatory dashboard content.

The strongest UI references are Crafty Controller and Home Assistant.

## 2. Primary jobs

The application should make it easy to answer:

1. What needs my attention?
2. Which mods have updates?
3. What changed in those updates?
4. Are the proposed updates valid for this server?
5. What dependencies will also need to change?
6. What exactly will FPBPack do if I apply them?
7. What happened in previous update sessions?
8. Can I restore a previous known-good state?

The default workflow is modpack management. Server status is useful context, but not the center of the product.

## 3. Top-level navigation

Target navigation:

- **Overview**
- **Updates**
- **Mods**
- **History**
- **Settings**

Diagnostics, provider/source details, hashes, physical paths, schema versions, and similar implementation details should not occupy top-level navigation unless they require attention.

On mobile, navigation should use the pattern that best preserves feature parity and tap usability. A bottom navigation bar is preferred if it remains practical with the final information architecture.

## 4. Overview

The Overview page is an admin inbox, not a KPI dashboard.

It should prioritize:

- available updates;
- warnings / blockers;
- recent activity;
- server running/stopped state;
- pending or interrupted operations.

Counts should only be shown when they support a decision.

Example:

```text
FPBCraft                                  ● Running

12 updates available
0 blocking issues

Updates
────────────────────────────────────────────
Create                 6.0.10 → 6.0.11
EMI                    1.1.24 → 1.1.27
Copycats               3.0.1  → 3.0.4

                         Review 12 updates

Recent activity
────────────────────────────────────────────
Today 21:42   Inventory refreshed
Oct 3         Updated 7 mods      Successful
Sep 29        Updated 12 mods     Restored
```

The following should not be prominent on the Overview page:

- schema versions;
- source/provider counts;
- file modification timestamps;
- large explanatory safety cards;
- raw hashes;
- migration-oriented metrics once migration is complete.

## 5. Updates

Updates are the central product surface.

The Updates page should support both:

- individual selection;
- **Update all safe updates**.

FPBPack, not the GUI, owns update eligibility and classification.

Each available update should be classified as one of:

- **Safe / recommended**
- **Review**
- **Blocked**
- **Ignored / pinned**

### Safe update baseline

A candidate may only be considered safe when all relevant constraints pass, including:

- same Minecraft version;
- same mod loader;
- compatible dependency set;
- not pinned / unmanaged;
- no known compatibility block;
- no invalid side change;
- no suspicious provider/loader substitution;
- no unresolved dependency requirement.

Major-version jumps should require explicit review even if technically compatible.

Pre-release versions should remain visible rather than being hidden, but should be clearly labeled and should not be selected automatically unless appropriate to the installed release channel.

Invalid candidates, such as a Fabric build for a NeoForge server, should be hidden from the normal update list. They may be exposed only in an advanced/rejected-candidates diagnostic view.

### Batch behavior

The normal workflow is updating all selected safe updates together unless the admin explicitly chooses a smaller subset.

Every update batch must pass through a review screen before applying.

## 6. Changelogs

Every update should provide access to provider-supplied release notes.

Requirements:

- render the **full changelog** in the app when available;
- preserve provider-supplied content factually;
- link directly to the Modrinth, CurseForge, or GitHub source;
- show publish date;
- show release channel;
- show relevant file metadata;
- show dependency changes;
- show other useful provider metadata where available.

If an update skips multiple installed versions, the app should aggregate all intermediate changelogs in chronological/version order.

The GUI should not generate AI-written summaries of changelogs.

## 7. Mod browser

The Mods view should resemble a practical launcher/admin inventory rather than a raw filesystem list.

Primary columns / fields:

- icon;
- mod name;
- installed version;
- latest valid version;
- status;
- side.

Provider, filename, hash, physical path, project IDs, and similar details belong in the detail view or advanced metadata.

### Mod icons

Use provider project icons where available, similar to Prism Launcher.

Fallbacks should be deterministic and visually quiet.

### Mod details

Selecting a mod should open a modal or drawer without losing the current list position.

The detail view should expose:

- icon and project name;
- installed version;
- latest valid version;
- update status;
- provider;
- direct provider/project links;
- release dates;
- release channel;
- full changelog(s);
- dependency relationships;
- required dependencies;
- reverse dependencies when available;
- physical deployment side;
- filename/path under an advanced section;
- pin / ignore controls;
- update action when eligible.

### Filters

Support at least:

- updates available;
- server;
- client;
- both;
- pinned / unmanaged;
- Modrinth;
- CurseForge;
- unresolved if any exist.

Search should cover name, filename, mod ID, and version.

## 8. Dependency handling

Dependencies are part of the update plan.

If an update requires dependency additions or dependency version changes, FPBPack should automatically include those required changes in the proposed plan when it can verify them safely.

The review UI must make dependency-driven changes explicit.

Example:

```text
Updating Create to 6.0.11 also requires:

+ Ponder 1.0.52 → 1.0.55
+ Registrate 1.3.0 → 1.3.2
```

The admin should not need to manually discover dependency updates that are mechanically required.

## 9. Ignore and pin controls

The GUI should support:

- ignore this version;
- ignore updates for this mod;
- pin current version;
- remind/review later.

Pinned or ignored status should be visible in the mod list with a compact icon/badge.

The six currently unmanaged FPBCraft-specific artifacts should appear as ordinary mods with an **Unmanaged** state. FPBPack should not update them and should not warn merely because they changed on disk.

For now, no GitHub-release update workflow is required for those unmanaged mods.

## 10. Review screen

Every batch update requires review before filesystem changes.

The review screen should summarize human-relevant changes first:

```text
14 selected updates

Create             6.0.10 → 6.0.11
EMI                1.1.24 → 1.1.27
Copycats           3.0.1  → 3.0.4
...

Dependencies
+ 2 required dependency updates

Backup
✓ A restore point will be created before changes

Server
● Currently running
  The server will NOT be restarted automatically.

[ Cancel ]                         [ Apply updates ]
```

Exact filesystem operations belong in an expandable **Advanced** section.

The affected mod must always be obvious when showing a low-level file operation.

Example:

```text
Create
- mods/create-6.0.10.jar
+ mods/create-6.0.11.jar
```

Never show an unexplained path diff detached from the mod it belongs to.

## 11. Apply behavior

Applying updates should be an explicit action initiated from the GUI.

The GUI may control Crafty only through explicit manual actions.

Required behavior:

1. validate the full plan;
2. resolve/download every required artifact;
3. verify hashes and compatibility;
4. create a backup / restore point;
5. stop the server if necessary and explicitly requested;
6. apply the complete file change set atomically where practical;
7. verify the resulting filesystem/catalog state;
8. leave the server stopped;
9. record the operation in history.

The GUI must **not automatically restart the server** after applying updates.

The admin will restart it manually.

The GUI also does not need to wait for Minecraft startup or inspect startup logs as part of the update transaction at this stage.

AutoModpack-specific synchronization does not need its own explicit workflow state at this stage.

## 12. Failure behavior

Before any live filesystem mutation, the entire selected update set should be resolved and verified.

If any required artifact fails to download, hash, resolve, or validate, the batch should abort before making changes.

The app should clearly identify:

- the affected mod;
- the failed operation;
- why the plan cannot proceed.

No automatic rollback-on-startup-failure workflow is required at this stage because the server is not automatically restarted.

Manual restore remains available from history.

## 13. History

The History page should record update sessions, not just log lines.

Each operation should include:

- timestamp;
- mods changed;
- old and new versions;
- dependency-driven changes;
- result;
- backup/restore-point identifier;
- relevant errors;
- whether a restore was later performed.

Example:

```text
Oct 5 · 22:14
Updated 14 mods

Create             6.0.10 → 6.0.11
EMI                1.1.24 → 1.1.27
...

Result: Successful
Restore point: fpbpack-2026-10-05-2214

[ View details ] [ Restore ]
```

History and backups should use a fixed retention count rather than time-based retention.

The exact retention number should be configurable in Settings.

Manual **Restore** from history is required.

## 14. External changes

FPBPack should detect changes made outside FPBPack for managed artifacts.

Examples:

- JAR added manually;
- managed JAR removed;
- managed JAR replaced;
- version changed manually;
- physical placement changed.

These should appear as **External changes detected** and should require inventory reconciliation before a destructive operation proceeds.

Unmanaged/pinned artifacts are exempt from update-management expectations.

## 15. Server controls

This application is mostly for modpack management, not a Crafty replacement.

Useful server context:

- running/stopped;
- basic state needed to determine whether an update can be applied.

Crafty integration should support manual actions from the GUI where needed, especially stop/start controls associated with update workflows.

No automatic restart after an update.

Broader Crafty feature parity is not a goal.

## 16. Mobile behavior

Mobile should retain functional parity with desktop for the important workflows:

- view available updates;
- inspect a mod;
- read full changelogs;
- select updates;
- review a batch;
- apply a batch;
- view progress/results;
- browse history;
- restore a previous state.

Desktop may use denser tables.

Mobile should use:

- larger tap targets;
- compact cards instead of horizontal table scrolling where appropriate;
- sticky action areas where useful;
- navigation optimized for one-handed access;
- mod detail modal/sheet patterns suited to small screens.

## 17. Visual direction

Dark mode only.

Desired character:

- compact;
- practical;
- high information density;
- subdued visual hierarchy;
- limited decorative cards;
- restrained use of badges;
- no marketing/explanatory copy where the UI can communicate state directly;
- no oversized metrics unless they represent an actionable condition.

Think Crafty / Home Assistant admin utility, not SaaS analytics dashboard.

## 18. Architecture boundary

FPBCraft GUI must not reimplement FPBPack's domain logic.

Target architecture:

```text
                         ┌───────────────────┐
                         │ FPBCraft GUI       │
                         │ Next.js            │
                         │                   │
Browser ────────────────►│ presentation       │
                         │ user intent        │
                         └─────────┬─────────┘
                                   │
                                   │ authenticated/local API
                                   ▼
                         ┌───────────────────┐
                         │ FPBPack service    │
                         │ Go                │
                         │                   │
                         │ inventory         │
                         │ doctor            │
                         │ update discovery  │
                         │ dependency solve  │
                         │ plan              │
                         │ backup            │
                         │ apply             │
                         │ restore           │
                         │ history           │
                         └───────┬─────┬─────┘
                                 │     │
                    ┌────────────┘     └────────────┐
                    ▼                               ▼
             Minecraft/Crafty                  Providers
             filesystem                       Modrinth
             AutoModpack                      CurseForge
                                              GitHub/manual
```

The GUI should call stable application services exposed by FPBPack.

The CLI should use the same services.

No update eligibility rule, dependency rule, deployment rule, or filesystem mutation rule should exist only in the GUI.

## 19. FPBPack service/API direction

FPBPack should evolve from CLI-only execution toward reusable application services plus a local HTTP API.

Likely service surface:

```text
GET  /api/status
GET  /api/inventory
POST /api/inventory/refresh

GET  /api/mods
GET  /api/mods/:id

POST /api/updates/check
GET  /api/updates
POST /api/updates/plan

POST /api/apply
GET  /api/operations/:id

GET  /api/history
GET  /api/history/:id
POST /api/history/:id/restore

POST /api/server/stop
POST /api/server/start

GET  /api/settings
PUT  /api/settings
```

This is conceptual, not yet a frozen wire protocol.

The API should expose domain objects, not leak Packwiz TOML or internal filesystem implementation details as the primary UI contract.

Long-running operations should expose progress/state so the GUI can render deterministic progress rather than polling raw logs.

## 20. Data ownership

FPBPack owns authoritative management state.

Expected persisted state will likely include:

- installed/managed artifact identity;
- provider identity;
- current version;
- physical deployment location;
- pin/ignore rules;
- ignored versions;
- last inventory snapshot;
- detected external changes;
- update plans;
- operation history;
- backup references;
- configured retention count.

Packwiz remains useful as a catalog/download format and integration helper, but Packwiz is not the product-level source of truth for update decisions.

## 21. Packwiz relationship

Do not use raw `packwiz update --all` as the update engine.

FPBPack owns:

- candidate selection;
- loader filtering;
- Minecraft-version filtering;
- dependency validation;
- pin/ignore policy;
- safety classification;
- final update plan.

Packwiz may still be used for:

- catalog representation;
- provider integration where reliable;
- downloading/applying an already-approved exact artifact.

The six explicitly unmanaged FPBCraft artifacts are not represented as Packwiz-managed metafiles.

## 22. Docker / Unraid deployment

The production GUI target is Unraid.

Deployment model:

```text
Unraid
┌───────────────────────────────────────────┐
│                                           │
│  fpbcraft-gui container                   │
│  Next.js                                  │
│          │                                │
│          ▼                                │
│  FPBPack API / service                    │
│          │                                │
│          ├── Crafty integration           │
│          ├── server files                 │
│          └── FPBPack state                │
│                                           │
└───────────────────────────────────────────┘
```

The initial read-only bind-mount implementation is transitional.

Once write operations are introduced, direct broad filesystem write access from the Next.js application should be avoided. Preferred direction: the GUI talks to FPBPack, and FPBPack alone performs controlled filesystem mutation.

## 23. Vercel deployment

Vercel exists for development and UI preview only.

It should:

- render the application;
- use safe demo/mock data when no FPBPack service is available;
- support responsive design review;
- never attempt to control the live Unraid server;
- never contain production server credentials or filesystem paths.

Remote production control through Vercel is explicitly out of scope for now.

## 24. LAN security

The live application is intended for the local network and a single administrator.

LAN access without application-level authentication is acceptable for now.

Before any future public/remote exposure, authentication and transport security must be revisited.

## 25. Implementation sequence

The preferred sequence from here is:

### Phase 1 — foundation
1. finalize this architecture document;
2. clean the existing GUI to match the information architecture;
3. remove migration/debug-oriented UI from primary screens;
4. establish shared domain types between FPBPack responses and GUI consumption.

### Phase 2 — FPBPack diagnostics and discovery
5. add `doctor`;
6. implement safe update discovery;
7. implement dependency-aware candidate resolution;
8. implement pin/ignore/ignored-version policy;
9. expose changelog/provider metadata.

### Phase 3 — planning
10. implement `plan` as a pure/dry-run operation;
11. expose reviewable plan objects over the local API;
12. build the Updates UI and mod-detail changelog modal.

### Phase 4 — state/history
13. add persistent management state;
14. detect external changes;
15. add backup/restore-point metadata;
16. add operation history;
17. implement fixed-count retention.

### Phase 5 — controlled apply
18. prefetch and verify the entire plan;
19. add explicit Crafty stop/start controls;
20. add transactional apply behavior;
21. add manual restore from history;
22. keep server restart manual.

### Phase 6 — UI refinement
23. refine desktop density;
24. verify full mobile feature parity;
25. add provider icons/mod icons;
26. improve loading/progress/error states;
27. add accessibility and keyboard-navigation checks.

## 26. Product rules that should not silently change

The following require an explicit product decision before implementation changes them:

- one admin only;
- one server only;
- dark mode only;
- Vercel is development/demo only;
- update batches always have a review step;
- dependencies may be added automatically only when required and verified;
- major-version updates require review;
- invalid loader candidates are hidden from normal update choices;
- changelogs remain provider-supplied/factual;
- the server is not restarted automatically;
- update failure aborts before live mutation whenever possible;
- history/restore is required;
- external managed-file changes are detected;
- unmanaged FPBCraft artifacts remain outside Packwiz;
- FPBPack owns domain logic; the GUI does not duplicate it.
