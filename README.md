# FPBCraft GUI

Responsive web dashboard for FPBPack and the FPBCraft Minecraft server.

The initial release is intentionally **read-only**. It reads FPBPack inventory/catalog state from bind-mounted host files and does not expose update or deployment actions.

## Current UI

- Overview: installed/managed/unmanaged counts, findings, providers, state freshness.
- Mods: searchable and paginated physical JAR inventory.
- Sources: provider counts plus explicitly unmanaged/pinned artifacts.
- Health: unresolved artifacts, conflicts, strict placement issues, and duplicates.
- Responsive layouts for desktop, tablet, and phone.
- `/api/health` endpoint for Docker/Unraid health checks.

## Unraid / Docker

The production image uses Next.js standalone output and runs as a single container.

The included Compose file assumes the current FPBCraft paths but keeps them configurable:

```bash
cp .env.example .env
docker compose up -d --build
```

Open:

```text
http://<unraid-ip>:8765
```

The host mounts are read-only:

- `/mnt/gamestorage/crafty-4` → `/data:ro`
- the Crafty server root → `/server:ro`

The container itself also uses a read-only root filesystem with a small `/tmp` tmpfs.

The default container UID/GID is `99:100`, matching Unraid's `nobody:users`. Override `PUID`/`PGID` if your file ownership differs.

### Configuration

`.env`:

```dotenv
PUID=99
PGID=100
FPBCRAFT_GUI_PORT=8765
FPBPACK_DATA_ROOT=/mnt/gamestorage/crafty-4
FPBCRAFT_SERVER_ROOT=/mnt/gamestorage/crafty-4/servers/99ea61a0-be6a-4d45-987b-db183f0bb45b
```

Do not expose the initial dashboard directly to the public internet. Authentication will be added before write/deploy controls.

## Development

Requires Node.js 24.

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

For local data, set:

```bash
FPBPACK_INVENTORY_PATH=/path/to/fpbpack-inventory-v2.json \
FPBPACK_REPORT_PATH=/path/to/migration-report.json \
npm run dev
```

## Architecture

The GUI does not own mod-management policy. FPBPack remains the source of truth for inventory, provider identity, compatibility decisions, planning, and later deployment. The GUI is a presentation/control layer over that state.

The first slice reads JSON directly. As FPBPack gains `doctor`, `plan`, and deployment services, those operations should be exposed through a stable local API and consumed by this UI rather than reimplemented here.
