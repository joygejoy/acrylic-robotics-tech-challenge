import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { is } from '@electron-toolkit/utils'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
    show: false,
  })

  // In development, load from Vite dev server
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  createWindow()

  // In production (packaged app), auto-start the bundled backend
  if (!is.dev && app.isPackaged) {
    const version = getStoredBackendVersion()
    const result = await startBackend(version)
    if (!result.started) {
      console.warn('[main] Backend auto-start failed:', result.message)
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopBackend()
})

// IPC: Try to start the bundled backend (for Retry when disconnected)
ipcMain.handle('backend-try-start', async (_event, version?: string) => {
  const v = version || getStoredBackendVersion()
  const result = await startBackend(v)
  return result
})

// IPC: Get backend URL and port (for renderer)
ipcMain.handle('backend-get-url', () => getBackendUrl())
ipcMain.handle('backend-get-port', () => getBackendPort())

// IPC: Version selector - get available versions and selected version
function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'backend-config.json')
}

function getStoredBackendVersion(): string {
  try {
    const configPath = getConfigPath()
    const data = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(data)
    return config.version || '1.0.0'
  } catch {
    return '1.0.0'
  }
}

function getVersionsManifestPath(): string {
  const resourcesPath = process.resourcesPath
  const manifestPath = path.join(resourcesPath, 'backend', 'versions.json')
  if (fs.existsSync(manifestPath)) return manifestPath
  // Fallback: dev build may have resources next to app
  const devPath = path.join(app.getAppPath(), 'resources', 'backend', 'versions.json')
  return fs.existsSync(devPath) ? devPath : manifestPath
}

ipcMain.handle('backend-get-versions', async () => {
  try {
    const manifestPath = getVersionsManifestPath()
    if (fs.existsSync(manifestPath)) {
      const data = fs.readFileSync(manifestPath, 'utf-8')
      const manifest = JSON.parse(data)
      return {
        available: manifest.available || ['1.0.0'],
        default: manifest.default || '1.0.0',
        latest: manifest.latest || '1.0.0',
      }
    }
  } catch (err) {
    console.error('[main] Failed to read versions manifest:', err)
  }
  return { available: ['1.0.0'], default: '1.0.0', latest: '1.0.0' }
})

ipcMain.handle('backend-set-version', async (_event, version: string) => {
  try {
    const configPath = getConfigPath()
    const dir = path.dirname(configPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(configPath, JSON.stringify({ version }))
    // Restart backend with new version if app is packaged
    if (app.isPackaged) {
      stopBackend()
      const result = await startBackend(version)
      return { success: true, backendStarted: result.started }
    }
    return { success: true, backendStarted: false }
  } catch (err) {
    return { success: false, message: String(err) }
  }
})

ipcMain.handle('backend-get-selected-version', () => getStoredBackendVersion())

// IPC handler: save file dialog
ipcMain.handle('save-file', async (_event, base64Data: string, defaultName: string) => {
  if (!mainWindow) return { success: false, message: 'No window available' }

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (canceled || !filePath) {
    return { success: false, message: 'Save cancelled' }
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filePath, buffer)
    return { success: true, filePath }
  } catch (err) {
    return { success: false, message: String(err) }
  }
})

// IPC handlers: window controls
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    mainWindow.maximize()
  }
})

ipcMain.handle('window-unmaximize', () => {
  if (mainWindow) {
    mainWindow.unmaximize()
  }
})

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close()
  }
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() || false
})

