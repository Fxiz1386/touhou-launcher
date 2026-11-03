#!/usr/bin/env bash
# Desinstalador de Touhou Project Launcher para Linux
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================="
echo "   Desinstalador de Touhou Project Launcher  "
echo "============================================="
echo ""

# 1. Terminar procesos activos
echo "[1/4] Cerrando procesos activos..."
if [ -d "$DIR/pfx" ]; then
    WINEPREFIX="$DIR/pfx" wineserver -k 2>/dev/null || true
fi
killall -9 gamescope 2>/dev/null || true

# 2. Eliminar accesos directos del sistema
echo "[2/4] Eliminando accesos directos e iconos del sistema..."
DESKTOP_ENTRY="$HOME/.local/share/applications/touhou-launcher.desktop"
OLD_DESKTOP1="$HOME/.local/share/applications/touhou.desktop"
OLD_DESKTOP2="$HOME/.local/share/applications/th12.desktop"
ICON_FILE="$HOME/.local/share/icons/hicolor/512x512/apps/touhou-launcher.png"

rm -f "$DESKTOP_ENTRY" "$OLD_DESKTOP1" "$OLD_DESKTOP2"
rm -f "$ICON_FILE"

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
fi
echo "✓ Acceso directo eliminado del menú de aplicaciones."

# 3. Preguntar por juegos y partidas
echo ""
echo "[3/4] Gestión de datos del juego..."
echo "Directorio actual: $DIR"

KEEP_SAVES=true
if [ -t 0 ]; then
    read -p "¿Deseas borrar también los juegos instalados (games/) y partidas/récords (backups/)? (s/N): " -r resp_saves
    if [[ "$resp_saves" =~ ^[sSyY]$ ]]; then
        KEEP_SAVES=false
    fi
fi

if [ "$KEEP_SAVES" = false ]; then
    echo "Eliminando carpeta de juegos, música y respaldos..."
    rm -rf "$DIR/games" "$DIR/backups" "$DIR/music"
    echo "✓ Juegos y partidas eliminados."
else
    echo "ℹ Se conservaron tus juegos instalados en: $DIR/games"
    echo "ℹ Se conservaron tus récords y partidas en: $DIR/backups"
fi

rm -rf "$DIR/pfx" "$DIR/launcher_settings.json"
echo "✓ Prefijo Wine y configuraciones locales eliminados."

# 4. Limpieza final de la carpeta
echo ""
echo "[4/4] Limpieza del directorio..."
if [ -t 0 ]; then
    read -p "¿Deseas eliminar completamente la carpeta del programa ($DIR)? (s/N): " -r resp_dir
    if [[ "$resp_dir" =~ ^[sSyY]$ ]]; then
        echo "Eliminando directorio del lanzador..."
        cd "$HOME"
        rm -rf "$DIR"
        echo "✓ Carpeta eliminada por completo."
        echo ""
        echo "Touhou Project Launcher ha sido desinstalado de tu sistema."
        exit 0
    fi
fi

echo ""
echo "Touhou Project Launcher se ha desvinculado de tu sistema con éxito."
echo "Si deseas borrar la carpeta manualmente más tarde, ejecuta:"
echo "  rm -rf \"$DIR\""
echo ""
