#!/usr/bin/env bash
# Actualizador de Touhou Project Launcher para Linux
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "============================================="
echo "    Actualizando Touhou Project Launcher     "
echo "============================================="
echo ""

# 1. Obtener los últimos cambios de GitHub
if [ -d "$DIR/.git" ]; then
    echo "[1/4] Descargando últimos cambios de GitHub (git pull)..."
    git pull origin main
else
    echo "[1/4] Descargando última versión de GitHub..."
    if command -v curl >/dev/null 2>&1; then
        curl -sL "https://github.com/Fxiz1386/touhou-launcher/archive/refs/heads/main.tar.gz" | tar -xz --strip-components=1
    elif command -v wget >/dev/null 2>&1; then
        wget -qO- "https://github.com/Fxiz1386/touhou-launcher/archive/refs/heads/main.tar.gz" | tar -xz --strip-components=1
    else
        echo "Error: Se requiere git, curl o wget para actualizar."
        exit 1
    fi
fi

# 2. Actualizar dependencias y compilar frontend
echo "[2/4] Verificando interfaz de usuario..."
if [ -d "$DIR/danmaku-launcher" ]; then
    (
        cd "$DIR/danmaku-launcher"
        npm install || npm install --legacy-peer-deps
        npm run build
    )
fi

# 3. Compilar backend si cargo está presente
echo "[3/4] Verificando motor en Rust..."
if command -v cargo >/dev/null 2>&1 && [ -d "$DIR/th12-launcher" ]; then
    echo "Compilando nueva versión de Rust en release..."
    (cd "$DIR/th12-launcher" && cargo build --release)
    cp "$DIR/th12-launcher/target/release/th12-launcher" "$DIR/touhou-launcher"
    cp "$DIR/th12-launcher/target/release/th12-launcher" "$DIR/th12-launcher-bin"
fi

# 4. Asignar permisos y actualizar acceso directo
echo "[4/4] Actualizando permisos y accesos directos..."
chmod +x "$DIR/launch.sh" "$DIR/install.sh" "$DIR/update.sh" "$DIR/uninstall.sh"
[ -f "$DIR/touhou-launcher" ] && chmod +x "$DIR/touhou-launcher"
[ -f "$DIR/th12-launcher-bin" ] && chmod +x "$DIR/th12-launcher-bin"

# Actualizar el icono y acceso directo de escritorio
"$DIR/install.sh" --skip-deps 2>/dev/null || true

echo ""
echo "============================================="
echo " ✓ ¡Touhou Project Launcher actualizado con éxito! "
echo "============================================="
echo "Puedes iniciar el lanzador ejecutando: ./launch.sh"
echo ""
