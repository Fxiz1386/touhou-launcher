#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Configurando Touhou Project Launcher ==="

install_system_packages() {
    local missing=("$@")
    if [ ${#missing[@]} -eq 0 ]; then
        return 0
    fi

    echo ""
    echo "Faltan paquetes necesarios en el sistema: ${missing[*]}"
    if [ -t 0 ]; then
        read -p "¿Deseas intentar instalarlos automáticamente con sudo? (s/N): " -r resp
        if [[ "$resp" =~ ^[sSyY]$ ]]; then
            if command -v dnf >/dev/null 2>&1; then
                sudo dnf install -y "${missing[@]}"
            elif command -v apt-get >/dev/null 2>&1; then
                sudo apt-get update && sudo apt-get install -y "${missing[@]}"
            elif command -v pacman >/dev/null 2>&1; then
                sudo pacman -S --needed --noconfirm "${missing[@]}"
            elif command -v zypper >/dev/null 2>&1; then
                sudo zypper install -y "${missing[@]}"
            else
                echo "No se reconoció el gestor de paquetes. Por favor instálalos manualmente: ${missing[*]}"
            fi
        fi
    else
        echo "Ejecuta tu gestor de paquetes para instalarlos: ${missing[*]}"
    fi
}

if [[ "$*" != *"--skip-deps"* ]]; then
    echo "[1/5] Comprobando dependencias del sistema..."
    missing_pkgs=()

    if ! command -v wine >/dev/null 2>&1; then
        echo "✗ Wine no detectado."
        missing_pkgs+=("wine")
    else
        echo "✓ Wine detectado: $(wine --version)"
    fi

    if ! command -v node >/dev/null 2>&1; then
        echo "✗ Node.js no detectado."
        missing_pkgs+=("nodejs")
    else
        echo "✓ Node.js detectado: $(node --version)"
    fi

    if ! command -v npm >/dev/null 2>&1; then
        missing_pkgs+=("npm")
    fi

    if command -v gamescope >/dev/null 2>&1; then
        echo "✓ Gamescope detectado (escalado FSR disponible)."
    else
        echo "ℹ Gamescope no detectado (opcional, para escalado FSR a pantalla completa)."
    fi

    if [ ${#missing_pkgs[@]} -gt 0 ]; then
        install_system_packages "${missing_pkgs[@]}"
    fi
else
    echo "[1/5] Omitiendo comprobación de paquetes del sistema (--skip-deps)."
fi

# 2. Dependencias de la interfaz y compilación
echo "[2/5] Comprobando dependencias de la interfaz..."
if [ ! -d "$DIR/danmaku-launcher/node_modules" ]; then
    if command -v npm >/dev/null 2>&1; then
        echo "Instalando paquetes de Electron y React (npm install)..."
        (cd "$DIR/danmaku-launcher" && (npm install || npm install --legacy-peer-deps))
    else
        echo "Aviso: npm no encontrado. Se usará el lanzador nativo ligero como respaldo."
    fi
fi

if [ ! -f "$DIR/danmaku-launcher/dist/index.html" ] && [ -d "$DIR/danmaku-launcher/node_modules" ]; then
    echo "Compilando interfaz web (npm run build)..."
    (cd "$DIR/danmaku-launcher" && npm run build)
fi

if [ ! -f "$DIR/touhou-launcher" ]; then
    if command -v cargo >/dev/null 2>&1; then
        echo "Compilando backend nativo en Rust (cargo build --release)..."
        (cd "$DIR/th12-launcher" && cargo build --release)
        cp "$DIR/th12-launcher/target/release/th12-launcher" "$DIR/touhou-launcher"
    fi
fi

# 3. Permisos de ejecutables
echo "[3/5] Asignando permisos..."
chmod +x "$DIR/launch.sh"
[ -f "$DIR/update.sh" ] && chmod +x "$DIR/update.sh"
[ -f "$DIR/uninstall.sh" ] && chmod +x "$DIR/uninstall.sh"
chmod +x "$DIR/touhou-launcher"
[ -f "$DIR/th12-launcher-bin" ] && chmod +x "$DIR/th12-launcher-bin"

# 4. Directorios de trabajo
echo "[4/5] Creando carpetas de datos..."
mkdir -p "$DIR/games"
mkdir -p "$DIR/pfx"
mkdir -p "$DIR/backups"
mkdir -p "$DIR/music"

# 5. Acceso directo de escritorio
echo "[5/5] Instalando acceso directo de escritorio..."
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
