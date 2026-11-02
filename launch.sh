#!/usr/bin/env bash
# Lanzador de Touhou Project para Linux (DanmakuLauncher)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export TOUHOU_PROJECT_DIR="${SCRIPT_DIR}"
export WINEPREFIX="${SCRIPT_DIR}/pfx"
export WINEDEBUG="-all"
export WINEFSYNC=1
export WINEESYNC=1
export MESA_VK_WSI_PRESENT_MODE="immediate"

mkdir -p "${SCRIPT_DIR}/pfx" "${SCRIPT_DIR}/games"

# If invoked in CLI mode, delegate directly to touhou-launcher backend
if [ "$1" = "cli" ]; then
    exec "${SCRIPT_DIR}/touhou-launcher" "$@"
fi

ELECTRON_BIN="${SCRIPT_DIR}/danmaku-launcher/node_modules/.bin/electron"

# Launch DanmakuLauncher GUI if built and electron exists
if [ -f "${SCRIPT_DIR}/danmaku-launcher/dist/index.html" ] && [ -x "$ELECTRON_BIN" ]; then
    exec "$ELECTRON_BIN" --no-sandbox --no-zygote --class=touhou-launcher --name=touhou-launcher "${SCRIPT_DIR}/danmaku-launcher" "$@"
fi

# Fallback: native Slint GUI launcher
if [ -x "${SCRIPT_DIR}/touhou-launcher" ]; then
    exec "${SCRIPT_DIR}/touhou-launcher" "$@"
fi

# Fallback si no está el binario
exec "${SCRIPT_DIR}/th12-launcher-bin" "$@"
