#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Configurando Touhou Project Launcher ==="

# 1. Dependencias del sistema
echo "[1/4] Comprobando dependencias..."
if ! command -v wine >/dev/null 2>&1; then
    echo "AVISO: 'wine' no está instalado en el sistema."
    echo "Instálalo con tu gestor de paquetes (ej: sudo dnf install wine o sudo apt install wine)."
else
    echo "✓ Wine detectado: $(wine --version)"
fi

if command -v gamescope >/dev/null 2>&1; then
    echo "✓ Gamescope detectado (escalado FSR disponible)."
else
    echo "ℹ Gamescope no detectado (opcional, para escalado FSR a pantalla completa)."
fi

# 2. Permisos de ejecutables
echo "[2/4] Asignando permisos..."
chmod +x "$DIR/launch.sh"
chmod +x "$DIR/touhou-launcher"
[ -f "$DIR/th12-launcher-bin" ] && chmod +x "$DIR/th12-launcher-bin"

# 3. Directorios de trabajo
echo "[3/4] Creando carpetas de datos..."
mkdir -p "$DIR/games"
mkdir -p "$DIR/pfx"
mkdir -p "$DIR/backups"
mkdir -p "$DIR/music"

# 4. Acceso directo de escritorio
echo "[4/4] Instalando acceso directo de escritorio..."
ICON_SRC="$DIR/danmaku-launcher/public/launcher_icon.png"
ICON_DEST_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
mkdir -p "$ICON_DEST_DIR"
if [ -f "$ICON_SRC" ]; then
    cp "$ICON_SRC" "$ICON_DEST_DIR/touhou-launcher.png"
fi

DESKTOP_DIR="$HOME/.local/share/applications"
mkdir -p "$DESKTOP_DIR"
cat << EOF > "$DESKTOP_DIR/touhou-launcher.desktop"
[Desktop Entry]
Name=Touhou Project Launcher
GenericName=Danmaku Shoot 'em up Launcher
Comment=Lanzador e instalador para Touhou Project en Linux
Exec="$DIR/launch.sh"
Path=$DIR
Icon=touhou-launcher
Terminal=false
Type=Application
Categories=Game;ArcadeGame;
StartupWMClass=touhou-launcher
StartupNotify=true
EOF

chmod +x "$DESKTOP_DIR/touhou-launcher.desktop"
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi

echo ""
echo "Instalación completada con éxito."
echo "Puedes iniciar el lanzador ejecutando: ./launch.sh"
echo "O buscando 'Touhou Project Launcher' en tu menú de aplicaciones."
