# Raspberry Pi Deployment Notes

This project is configured for optimized deployment to a Raspberry Pi 3 (ARM64) from a Windows development environment.

## Deployment Strategy: Local Build & Package
To avoid resource exhaustion (out of memory) on the Raspberry Pi 3, the application is built and packaged entirely on the host machine.

### 1. Production Build
- **Mode:** `standalone` (configured in `next.config.ts`).
- **Command:** `npm run build`.
- **Output:** Located in `.next/standalone`.

### 2. Cross-Platform Dependencies (Linux ARM64)
Native modules like `sqlite3` require specific binaries for the Pi's architecture.
- **Dependency Fetching:** A temporary Linux node_modules tree is created locally.
- **Native Binary Injection:** The `node_sqlite3.node` binary for Linux ARM64 is downloaded and injected into the package to replace the Windows version.
- **Automation:** Handled by `fetch_sqlite_linux.py`.

### 3. Packaging
- **Format:** `.tar.gz` (used because `tar` is natively available on the Pi, whereas `unzip` may not be).
- **Automation:** Handled by `pack_deploy.py`.

### 4. Deployment Scripts
- `deploy_tar.ps1`: The primary deployment script.
  - Uploads `deploy.tar.gz` via `scp`.
  - Extracts the archive on the Pi via `ssh`.
  - Starts the server (`node server.js`).

## How to Deploy
Run the following command from the project root in PowerShell:
```powershell
.\deploy_tar.ps1
```

## Running on the Pi
The app is deployed to `~/course-directory-prod`. To start it manually:
```bash
cd ~/course-directory-prod
node server.js
```
The server runs on port `3000` by default.

## Maintenance
If you add new native dependencies, you may need to update `fetch_sqlite_linux.py` or the `temp-linux-build` logic to ensure the correct Linux ARM binaries are included.
