import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (base64Data: string, defaultName: string): Promise<{ success: boolean; filePath?: string; message?: string }> => {
    return ipcRenderer.invoke('save-file', base64Data, defaultName)
  },
  platform: process.platform,
  windowControls: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    unmaximize: () => ipcRenderer.invoke('window-unmaximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window-is-maximized'),
  },
})

