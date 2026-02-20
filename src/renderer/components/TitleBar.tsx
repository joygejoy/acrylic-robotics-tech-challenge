import React, { useState, useEffect } from 'react'

declare global {
  interface Window {
    electronAPI: {
      saveFile: (base64Data: string, defaultName: string) => Promise<{ success: boolean; filePath?: string; message?: string }>
      platform: string
      windowControls: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        unmaximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
      }
    }
  }
}

const TitleBar: React.FC = () => {
  const [platform, setPlatform] = useState<string>('darwin')
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (window.electronAPI) {
      setPlatform(window.electronAPI.platform)
      
      // Check initial maximized state
      window.electronAPI.windowControls.isMaximized().then(setIsMaximized)
    }
  }, [])

  const handleMinimize = () => {
    window.electronAPI?.windowControls.minimize()
  }

  const handleMaximize = async () => {
    if (isMaximized) {
      await window.electronAPI?.windowControls.unmaximize()
      setIsMaximized(false)
    } else {
      await window.electronAPI?.windowControls.maximize()
      setIsMaximized(true)
    }
  }

  const handleClose = () => {
    window.electronAPI?.windowControls.close()
  }

  const isWindows = platform === 'win32'

  return (
    <div className="drag-region bg-gray-50 border-b border-gray-200 flex items-center h-10 px-4 select-none">
      {/* Spacer for macOS traffic light buttons */}
      {!isWindows && <div className="w-16 no-drag" />}
      
      {/* App title */}
      <div className="flex-1 text-center">
        <h1 className="text-sm font-semibold text-gray-700">
          TC-W26 Image Transformer
        </h1>
      </div>
      
      {/* Windows controls */}
      {isWindows && (
        <div className="no-drag flex items-center">
          <button
            onClick={handleMinimize}
            className="h-10 w-12 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Minimize"
          >
            <svg width="10" height="1" viewBox="0 0 10 1" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="10" height="1" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="h-10 w-12 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 2.5h5v5h-5v-5z" stroke="currentColor" strokeWidth="1" fill="none" />
                <path d="M1.5 3.5v-2h2M8.5 6.5v2h-2" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1.5" y="1.5" width="7" height="7" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            className="h-10 w-12 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Right spacer for symmetry on macOS */}
      {!isWindows && <div className="w-16" />}
    </div>
  )
}

export default TitleBar

