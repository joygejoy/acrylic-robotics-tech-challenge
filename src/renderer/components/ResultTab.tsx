import React, { useCallback, useState } from 'react'
import { TransformationResult } from '../api/imageApi'

declare global {
  interface Window {
    electronAPI?: {
      saveFile: (base64Data: string, defaultName: string) => Promise<{ success: boolean; filePath?: string; message?: string }>
    }
  }
}

interface ResultTabProps {
  result: TransformationResult
  onStartOver: () => void
}

const ResultTab: React.FC<ResultTabProps> = ({ result, onStartOver }) => {
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const imageSrc = `data:image/${result.format};base64,${result.image}`
  
  // Use drop-shadow filter for circle/ellipse crops to match the shape
  const hasTransparentCrop = result.cropShape === 'circle' || result.cropShape === 'ellipse'
  const imageClassName = hasTransparentCrop 
    ? 'max-h-[600px] max-w-full' 
    : 'max-h-[600px] max-w-full shadow-md'
  const imageStyle = hasTransparentCrop 
    ? { filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06))' }
    : undefined

  const handleDownload = useCallback(async () => {
    setSaveStatus(null)

    // If running in Electron, use the native save dialog
    if (window.electronAPI) {
      const response = await window.electronAPI.saveFile(
        result.image,
        `transformed-image.${result.format}`,
      )
      if (response.success) {
        setSaveStatus(`Saved to ${response.filePath}`)
      } else if (response.message !== 'Save cancelled') {
        setSaveStatus(`Error: ${response.message}`)
      }
    } else {
      // Fallback for browser dev mode: trigger a download via <a> tag
      const link = document.createElement('a')
      link.href = imageSrc
      link.download = `transformed-image.${result.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [result, imageSrc])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex gap-6">
        {/* Left: Action buttons */}
        <div className="w-96 flex-shrink-0 space-y-4">
          <div className="bg-white shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Actions
            </h2>

            {/* Save status */}
            {saveStatus && (
              <div className="bg-green-50 border-l-4 border-green-400 p-3">
                <p className="text-sm text-green-700">{saveStatus}</p>
              </div>
            )}

            <button
              onClick={onStartOver}
              className="w-full py-3 px-4 bg-white text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              New Design
            </button>

            <button
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-black text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Design
            </button>
          </div>
        </div>

        {/* Right: Transformed image preview */}
        <div className="flex-1 min-w-0">
          <div className="bg-white shadow-sm border border-gray-200 p-6 h-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Transformed Image
            </h2>
            <div className="flex justify-center items-center bg-gray-100 p-4 min-h-[600px]">
              <img
                src={imageSrc}
                alt="Transformed result"
                className={imageClassName}
                style={imageStyle}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultTab

