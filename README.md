# Touhou Project Launcher (Linux)

Lanzador nativo para juegos de Touhou Project en Linux. Configura Wine, resolución con Gamescope (FSR), parches de traducción con THCrap y controles modernos de teclado.

## Características

- Detección e instalación automática desde archivos ZIP.
- Escalado nítido a pantalla completa usando Gamescope y AMD FSR.
- Integración directa con THCrap (parches en español e inglés).
- Remapeo de controles moderno activo en todos los juegos:
  - **Movimiento**: `W` `A` `S` `D` (o flechas)
  - **Disparo**: `J` (o `Z`)
  - **Bomba / Spellcard**: `K` (o `X`)
  - **Modo Lento / Enfoque**: `L` (o `Shift`)
  - **Carga / Habilidad** (TH09, TH19): `U` (o `C`)
- Reproductor de música integrado para escuchar las bandas sonoras originales (OST).
- Registro de récords y tiempo de juego.

## Requisitos

- **Wine** (recomendado `wine-staging`)
- **Gamescope** (opcional, necesario si quieres reescalado FSR a pantalla completa)
- **Node.js** (v18 o superior)
- **Rust / Cargo** (solo si quieres recompilar el backend)

En distribuciones basadas en Fedora:
```bash
sudo dnf install wine gamescope nodejs
```

En distribuciones basadas en Ubuntu / Debian / Arch:
- Ubuntu/Debian: `sudo apt install wine gamescope nodejs npm`
- Arch Linux: `sudo pacman -S wine gamescope nodejs npm`

## Instalación y Uso

1. Clona el repositorio:
```bash
git clone git@github.com:Fxiz1386/touhou-launcher.git
cd touhou-launcher
```

2. Ejecuta el instalador para compilar dependencias y registrar el icono en el sistema:
```bash
chmod +x install.sh launch.sh
./install.sh
```

3. Inicia el lanzador:
```bash
./launch.sh
```
También puedes abrirlo directamente desde el menú de aplicaciones de tu entorno de escritorio buscando **Touhou Project Launcher**.

## Cómo agregar juegos

Hay dos formas:
1. **Desde la interfaz**: Haz clic en el botón de instalar o arrastra el archivo ZIP del juego al catálogo.
2. **Manualmente**: Coloca el archivo `.zip` del juego o su carpeta extraída dentro de la carpeta `games/`.

El lanzador detecta la versión, configura el perfil de Wine y aplica automáticamente las traducciones y el mapeo de teclas.

## Estructura del proyecto

- `danmaku-launcher/`: Interfaz de usuario (Electron, React, Tailwind CSS).
- `th12-launcher/`: Backend en Rust para detección de juegos, lectura de récords, parches y ejecución de Wine.
- `launch.sh`: Script principal de arranque con detección de entorno.
- `install.sh`: Script de instalación y configuración de accesos directos `.desktop`.

## Licencia

Código bajo licencia MIT. Los juegos, música y personajes de Touhou Project son propiedad de ZUN / Team Shanghai Alice.
