const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('danmakuAPI', {
  getGamesStatus: () => ipcRenderer.invoke('get-games-status'),
  launchGame: (payload) => ipcRenderer.invoke('launch-game', payload),
  saveConfig: (payload) => ipcRenderer.invoke('save-config', payload),
  openFolder: (gameId) => ipcRenderer.invoke('open-folder', gameId),
  installZip: (zipPath) => ipcRenderer.invoke('install-zip', zipPath),
  pickZipFile: () => ipcRenderer.invoke('pick-zip-file'),
  scanDownloads: () => ipcRenderer.invoke('scan-downloads'),
  uninstallGame: (payload) => ipcRenderer.invoke('uninstall-game', payload),
  updatePatches: (gameId) => ipcRenderer.invoke('update-patches', gameId),
  stopGame: (gameId) => ipcRenderer.invoke('stop-game', gameId),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getMusicLibrary: (gameId) => ipcRenderer.invoke('get-music-library', gameId),
  scanMusicDownloads: () => ipcRenderer.invoke('scan-music-downloads'),
  importMusicArchive: (payload) => ipcRenderer.invoke('import-music-archive', payload),
  pickMusicArchive: () => ipcRenderer.invoke('pick-music-archive'),
});
