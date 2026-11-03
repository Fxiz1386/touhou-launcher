const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile, exec } = require('child_process');
const { Readable } = require('stream');
const { pathToFileURL } = require('url');

app.setName('Touhou Project Launcher');
app.setAppUserModelId('touhou-launcher');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('no-zygote');

// Register custom media protocol for streaming local audio (OPUS, FLAC, WAV, MP3)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'danmaku-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

let resolvedProjectDir = process.env.TOUHOU_PROJECT_DIR || path.resolve(__dirname, '..', '..');
if (!fs.existsSync(path.join(resolvedProjectDir, 'touhou-launcher')) && fs.existsSync(path.join(process.cwd(), 'touhou-launcher'))) {
  resolvedProjectDir = process.cwd();
}
const PROJECT_DIR = resolvedProjectDir;
const LAUNCHER_BIN = path.join(PROJECT_DIR, 'touhou-launcher');

function runCli(args) {
  return new Promise((resolve, reject) => {
    execFile(LAUNCHER_BIN, ['cli', ...args], { cwd: PROJECT_DIR }, (error, stdout, stderr) => {
      if (error && !stdout) {
        return reject(error.message || stderr);
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    title: 'Touhou Project - Danmaku Launcher',
    icon: path.join(__dirname, '../public/launcher_icon.png'),
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on('console-message', (event, ...args) => {
    const msg = typeof event === 'object' && event?.message !== undefined ? event.message : (args[1] || event);
    console.log(`[Renderer] ${msg}`);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

function getMediaMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.opus':
      return 'audio/ogg; codecs=opus';
    case '.ogg':
      return 'audio/ogg';
    case '.flac':
      return 'audio/flac';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.m4a':
      return 'audio/mp4';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

app.whenReady().then(() => {
  protocol.handle('danmaku-media', (request) => {
    try {
      let raw = request.url.replace(/^danmaku-media:\/\//, '');
      if (!raw.startsWith('/')) raw = '/' + raw;
      const decoded = decodeURIComponent(raw);

      if (!fs.existsSync(decoded)) {
        return new Response('Media file not found', { status: 404 });
      }

      const stat = fs.statSync(decoded);
      const fileSize = stat.size;
      const mimeType = getMediaMimeType(decoded);
      const rangeHeader = request.headers.get('range');

      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10) || 0;
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        const nodeStream = fs.createReadStream(decoded, { start, end });
        const webStream = Readable.toWeb(nodeStream);

        return new Response(webStream, {
          status: 206,
          statusText: 'Partial Content',
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*',
          },
        });
      } else {
        const nodeStream = fs.createReadStream(decoded);
        const webStream = Readable.toWeb(nodeStream);

        return new Response(webStream, {
          status: 200,
          headers: {
            'Accept-Ranges': 'bytes',
            'Content-Length': String(fileSize),
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (err) {
      console.error('danmaku-media protocol error:', err);
      return new Response('Media error: ' + err.message, { status: 500 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC HANDLERS
ipcMain.handle('get-games-status', async () => {
  try {
    const { stdout } = await runCli(['status']);
    return JSON.parse(stdout);
  } catch (err) {
    console.error('get-games-status error:', err);
    return [];
  }
});

ipcMain.handle('launch-game', async (_event, payload) => {
  try {
    const { gameId, displayMode = 'fullscreen_fsr', language = 'es' } = payload;
    // Map UI modes to backend display modes
    let backendMode = displayMode;
    if (displayMode === '1920x1080_Pillarbox' || displayMode === 'fullscreen_fsr') {
      backendMode = 'fullscreen_fsr';
    } else if (displayMode === '1280x960' || displayMode === 'window_1280') {
      backendMode = 'window_1280';
    } else if (displayMode === '960x720' || displayMode === 'window_960') {
      backendMode = 'window_960';
    } else if (displayMode === '640x480' || displayMode === 'window_640') {
      backendMode = 'window_640';
    } else if (displayMode === 'fullscreen_int') {
      backendMode = 'fullscreen_int';
    }

    let backendLang = 'es';
    if (language === 'en_US' || language === 'en') backendLang = 'en';
    if (language === 'ja_JP' || language === 'ja') backendLang = 'ja';

    const { stdout } = await runCli(['launch', gameId, backendMode, backendLang]);
    return { success: true, output: stdout };
  } catch (err) {
    console.error('launch-game error:', err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('save-config', async (_event, payload) => {
  try {
    const {
      gameId,
      color32 = true,
      fps60 = true,
      bgm = 100,
      se = 100,
      pad = 600,
      displayMode = 'fullscreen_fsr',
      language = 'es',
    } = payload;

    const { stdout } = await runCli([
      'config',
      gameId,
      color32 ? 'true' : 'false',
      fps60 ? 'true' : 'false',
      String(bgm),
      String(se),
      String(pad),
      displayMode,
      language,
    ]);
    return JSON.parse(stdout);
  } catch (err) {
    console.error('save-config error:', err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('open-folder', async (_event, gameId) => {
  const targetDir = path.join(PROJECT_DIR, 'games', gameId);
  await shell.openPath(targetDir);
  return { success: true };
});

ipcMain.handle('pick-zip-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar archivo comprimido de Touhou Project (.zip, .7z, .rar)',
    properties: ['openFile'],
    filters: [
      { name: 'Archivos de Touhou (.zip, .7z, .rar)', extensions: ['zip', '7z', 'rar', 'tgz', 'gz'] },
      { name: 'Todos los archivos', extensions: ['*'] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('install-zip', async (_event, zipPath, password) => {
  try {
    const args = ['install', zipPath];
    if (password && typeof password === 'string' && password.trim().length > 0) {
      args.push(password.trim());
    }
    const { stdout } = await runCli(args);
    return JSON.parse(stdout);
  } catch (err) {
    console.error('install-zip error:', err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('scan-downloads', async () => {
  try {
    const { stdout } = await runCli(['scan']);
    return JSON.parse(stdout);
  } catch (err) {
    console.error('scan-downloads error:', err);
    return [];
  }
});

ipcMain.handle('uninstall-game', async (_event, payload) => {
  try {
    const { gameId, keepSaves = true } = payload;
    const { stdout } = await runCli(['uninstall', gameId, keepSaves ? 'true' : 'false']);
    return JSON.parse(stdout);
  } catch (err) {
    console.error('uninstall-game error:', err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('update-patches', async (_event, gameId) => {
  try {
    const { stdout } = await runCli(['update-patches', gameId]);
    return JSON.parse(stdout);
  } catch (err) {
    console.error('update-patches error:', err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('stop-game', async () => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec('wineserver -k 2>/dev/null; killall -9 winedevice.exe gamescope 2>/dev/null || true', () => {
      resolve({ success: true });
    });
  });
});

ipcMain.handle('open-external', async (_event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: 'URL no válida' };
});

// MUSIC ROOM IPC HANDLERS

// Scan music library for a specific game
ipcMain.handle('get-music-library', async (_event, gameId) => {
  try {
    const candidateDirs = [
      path.join(PROJECT_DIR, 'music', gameId),
      path.join(PROJECT_DIR, 'games', gameId, 'bgm'),
    ];

    let audioFiles = [];
    let coverImage = null;

    for (const dir of candidateDirs) {
      if (!fs.existsSync(dir)) continue;

      function scanDir(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.opus', '.flac', '.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
              const stat = fs.statSync(fullPath);
              audioFiles.push({
                filename: entry.name,
                path: fullPath,
                format: ext.replace('.', '').toUpperCase(),
                size: stat.size,
              });
            } else if (['.jpg', '.jpeg', '.png'].includes(ext) && /folder|cover|album/i.test(entry.name)) {
              if (!coverImage) {
                coverImage = fullPath;
              }
            }
          }
        }
      }

      scanDir(dir);
      if (audioFiles.length > 0) break;
    }

    // Sort audioFiles by numeric prefix or filename
    audioFiles.sort((a, b) => {
      const matchA = a.filename.match(/^0*(\d+)/) || a.filename.match(/_(\d+)/);
      const matchB = b.filename.match(/^0*(\d+)/) || b.filename.match(/_(\d+)/);
      if (matchA && matchB) {
        return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
      }
      return a.filename.localeCompare(b.filename);
    });

    return {
      gameId,
      totalTracks: audioFiles.length,
      availableTracks: audioFiles.length,
      hasAudio: audioFiles.length > 0,
      coverImage,
      audioFiles,
    };
  } catch (err) {
    console.error('get-music-library error:', err);
    return {
      gameId,
      totalTracks: 0,
      availableTracks: 0,
      hasAudio: false,
      coverImage: null,
      audioFiles: [],
    };
  }
});

// Scan Downloads folder for music archives
ipcMain.handle('scan-music-downloads', async () => {
  try {
    const home = os.homedir();
    const downloadDirs = [path.join(home, 'Downloads'), path.join(home, 'Descargas')];
    const results = [];

    const GAME_REGEX_MAP = [
      { id: 'th185', title: 'Touhou 18.5 ~ 100th Black Market', regex: /18\.5|100th\s*Black\s*Market|バレットフィリア/i },
      { id: 'th06', title: 'Touhou 06: Embodiment of Scarlet Devil', regex: /th06|touhou\s*0?6|scarlet\s*devil|東方紅魔郷/i },
      { id: 'th07', title: 'Touhou 07: Perfect Cherry Blossom', regex: /th07|touhou\s*0?7|cherry\s*blossom|東方妖々夢/i },
      { id: 'th08', title: 'Touhou 08: Imperishable Night', regex: /th08|touhou\s*0?8|imperishable\s*night|東方永夜抄/i },
      { id: 'th09', title: 'Touhou 09: Phantasmagoria of Flower View', regex: /th09(?!5)|touhou\s*0?9(?!5)|flower\s*view|東方花映塚/i },
      { id: 'th095', title: 'Touhou 09.5: Shoot the Bullet', regex: /th095|shoot\s*the\s*bullet|東方文花帖/i },
      { id: 'th10', title: 'Touhou 10: Mountain of Faith', regex: /th10(?!5)|mountain\s*of\s*faith|東方風神録/i },
      { id: 'th11', title: 'Touhou 11: Subterranean Animism', regex: /th11|subterranean\s*animism|東方地霊殿/i },
      { id: 'th12', title: 'Touhou 12: Undefined Fantastic Object', regex: /th12(?!5|8)|undefined\s*fantastic\s*object|東方星蓮船/i },
      { id: 'th125', title: 'Touhou 12.5: Double Spoiler', regex: /th125|double\s*spoiler|ダブルスポイラー/i },
      { id: 'th128', title: 'Touhou 12.8: Fairy Wars', regex: /th128|fairy\s*wars|妖精大戦争/i },
      { id: 'th13', title: 'Touhou 13: Ten Desires', regex: /th13|ten\s*desires|東方神霊廟/i },
      { id: 'th14', title: 'Touhou 14: Double Dealing Character', regex: /th14(?!3)|double\s*dealing\s*character|東方輝針城/i },
      { id: 'th143', title: 'Touhou 14.3: Impossible Spell Card', regex: /th143|impossible\s*spell\s*card|弾幕アマノジャク/i },
      { id: 'th15', title: 'Touhou 15: Legacy of Lunatic Kingdom', regex: /th15|legacy\s*of\s*lunatic\s*kingdom|東方紺珠伝/i },
      { id: 'th16', title: 'Touhou 16: Hidden Star in Four Seasons', regex: /th16(?!5)|hidden\s*star\s*in\s*four\s*seasons|東方天空璋/i },
      { id: 'th165', title: 'Touhou 16.5: Violet Detector', regex: /th165|violet\s*detector|秘封ナイトメアダイアリー/i },
      { id: 'th17', title: 'Touhou 17: Wily Beast and Weakest Creature', regex: /th17|wily\s*beast|東方鬼形獣/i },
      { id: 'th18', title: 'Touhou 18: Unconnected Marketeers', regex: /th18(?!5)|unconnected\s*marketeers|東方虹龍洞/i },
      { id: 'th19', title: 'Touhou 19: Unfinished Dream of All Living Ghost', regex: /th19|unfinished\s*dream|東方獣王園/i },
      { id: 'th20', title: 'Touhou 20: Fanciful Dream and Wondering Beast', regex: /th20|fanciful\s*dream|東方夢想録/i },
    ];

    for (const dir of downloadDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!/\.(zip|7z|rar)$/i.test(file)) continue;

        const isMusicArchive = /(flac|opus|mp3|soundtrack|ost|music|original\s*soundtrack|bgm|alces)/i.test(file);
        if (!isMusicArchive) continue;

        let detectedGame = null;
        for (const item of GAME_REGEX_MAP) {
          if (item.regex.test(file)) {
            detectedGame = item;
            break;
          }
        }

        if (detectedGame) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          let format = 'ZIP';
          if (/flac/i.test(file)) format = 'FLAC';
          else if (/opus/i.test(file)) format = 'OPUS';
          else if (/mp3/i.test(file)) format = 'MP3';

          results.push({
            fileName: file,
            fullPath,
            size: stat.size,
            gameId: detectedGame.id,
            gameTitle: detectedGame.title,
            format,
          });
        }
      }
    }

    return results;
  } catch (err) {
    console.error('scan-music-downloads error:', err);
    return [];
  }
});

// Import and extract music archive
ipcMain.handle('import-music-archive', async (_event, { archivePath, gameId }) => {
  try {
    if (!archivePath || !fs.existsSync(archivePath)) {
      return { success: false, error: 'El archivo comprimido no existe.' };
    }
    const targetDir = path.join(PROJECT_DIR, 'music', gameId);
    fs.mkdirSync(targetDir, { recursive: true });

    // Use 7z to extract into targetDir
    await new Promise((resolve, reject) => {
      exec(`7z x -y -o"${targetDir}" "${archivePath}"`, (err, stdout, stderr) => {
        if (err) return reject(err.message || stderr);
        resolve(stdout);
      });
    });

    // Flatten if single nested subfolder
    const subEntries = fs.readdirSync(targetDir, { withFileTypes: true });
    if (subEntries.length === 1 && subEntries[0].isDirectory()) {
      const subDir = path.join(targetDir, subEntries[0].name);
      const innerFiles = fs.readdirSync(subDir);
      for (const inner of innerFiles) {
        fs.renameSync(path.join(subDir, inner), path.join(targetDir, inner));
      }
      fs.rmdirSync(subDir);
    }

    const allFiles = fs.readdirSync(targetDir);
    const audioCount = allFiles.filter((f) => /\.(opus|flac|mp3|wav|ogg)$/i.test(f)).length;

    return { success: true, filesExtracted: audioCount };
  } catch (err) {
    console.error('import-music-archive error:', err);
    return { success: false, error: String(err) };
  }
});

// Pick a music archive via dialog
ipcMain.handle('pick-music-archive', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar archivo de música OST de Touhou (.zip, .7z, .rar)',
    properties: ['openFile'],
    filters: [
      { name: 'Archivos de música de Touhou (.zip, .7z, .rar)', extensions: ['zip', '7z', 'rar'] },
      { name: 'Todos los archivos', extensions: ['*'] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});
