import React, { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import { TransformationSpecs } from '../App'

interface UploadTabProps {
  onTransform: (file: File, specs: TransformationSpecs) => void
  isLoading: boolean
}

const UploadTab: React.FC<UploadTabProps> = ({ onTransform, isLoading }) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Transformation controls
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(1.0)
  const [grayscale, setGrayscale] = useState(false)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lockAspect, setLockAspect] = useState(true)
  const [originalAspect, setOriginalAspect] = useState(1)
  
  // Crop vs Resize toggle
  const [transformMode, setTransformMode] = useState<'resize' | 'crop'>('resize')
  
  // Crop controls
  const [cropShape, setCropShape] = useState<'rectangle' | 'square' | 'circle' | 'ellipse'>('rectangle')
  const [cropWidth, setCropWidth] = useState(0)
  const [cropHeight, setCropHeight] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)

      // Get original dimensions
      const img = new Image()
      img.onload = () => {
        setWidth(img.naturalWidth)
        setHeight(img.naturalHeight)
        setOriginalAspect(img.naturalWidth / img.naturalHeight)
        // Initialize crop dimensions to original size
        setCropWidth(img.naturalWidth)
        setCropHeight(img.naturalHeight)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(selectedFile)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && droppedFile.type.startsWith('image/')) {
        handleFile(droppedFile)
      }
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFile(selectedFile)
      }
    },
    [handleFile],
  )

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      setWidth(newWidth)
      if (lockAspect && originalAspect) {
        setHeight(Math.round(newWidth / originalAspect))
      }
    },
    [lockAspect, originalAspect],
  )

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      setHeight(newHeight)
      if (lockAspect && originalAspect) {
        setWidth(Math.round(newHeight * originalAspect))
      }
    },
    [lockAspect, originalAspect],
  )

  const handleSubmit = useCallback(() => {
    if (!file) return
    const specs: TransformationSpecs = {
      color: { hue, saturation },
      resize: { width, height },
      grayscale,
      crop: transformMode === 'crop' ? {
        enabled: true,
        shape: cropShape,
        width: cropWidth,
        height: cropHeight
      } : {
        enabled: false,
        shape: 'rectangle',
        width: 0,
        height: 0
      }
    }
    onTransform(file, specs)
  }, [file, hue, saturation, grayscale, width, height, transformMode, cropShape, cropWidth, cropHeight, onTransform])

  return (
    <div className="max-w-7xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Two-column layout - always shown */}
      <div className="flex gap-6">
        {/* Left: Transformation controls */}
        <div className="w-96 flex-shrink-0 bg-white shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Transformation Settings
            </h2>

            {/* Colour adjustments */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-600 tracking-wider">
                Colour Adjustment
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Hue Shift</label>
                  <span className="text-sm font-mono text-gray-500">{hue}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={hue}
                  onChange={(e) => setHue(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Saturation</label>
                  <span className="text-sm font-mono text-gray-500">
                    {saturation.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={grayscale}
                    onChange={(e) => setGrayscale(e.target.checked)}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Black & White</span>
                </label>
              </div>
            </div>

            {/* Crop vs Resize Toggle */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-600 tracking-wider">
                Size & Shape
              </h3>

              <div className="flex gap-2">
                <button
                  onClick={() => setTransformMode('resize')}
                  className={`flex-1 px-3 py-2 border text-sm transition-colors ${
                    transformMode === 'resize'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                  }`}
                >
                  Resize
                </button>
                <button
                  onClick={() => setTransformMode('crop')}
                  className={`flex-1 px-3 py-2 border text-sm transition-colors ${
                    transformMode === 'crop'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                  }`}
                >
                  Crop
                </button>
              </div>

              {transformMode === 'crop' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Shape
                    </label>
                    <select
                      value={cropShape}
                      onChange={(e) => setCropShape(e.target.value as 'rectangle' | 'square' | 'circle' | 'ellipse')}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    >
                      <option value="rectangle">Rectangle</option>
                      <option value="square">Square</option>
                      <option value="circle">Circle</option>
                      <option value="ellipse">Ellipse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Crop Width (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={cropWidth}
                      onChange={(e) => setCropWidth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Crop Height (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={cropHeight}
                      onChange={(e) => setCropHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    />
                  </div>

                  {cropShape === 'square' && (
                    <div className="bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600">
                      Square will use the smaller dimension: {Math.min(cropWidth, cropHeight)}px
                    </div>
                  )}

                  {(cropShape === 'circle' || cropShape === 'ellipse') && (
                    <div className="bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600">
                      ⚠️ This shape will have a transparent background
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setLockAspect(!lockAspect)}
                    className={`w-full px-3 py-2 border text-sm transition-colors flex items-center justify-center gap-2 ${
                      lockAspect
                        ? 'bg-gray-100 border-gray-900 text-black'
                        : 'bg-gray-50 border-gray-300 text-gray-500'
                    }`}
                    title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                  >
                    {lockAspect ? (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Aspect Ratio: Locked</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        <span>Aspect Ratio: Unlocked</span>
                      </>
                    )}
                  </button>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={width}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={height}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !file}
              className="w-full py-3 px-4 bg-black text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing…
                </>
              ) : (
                'Transform Image'
              )}
            </button>
          </div>

        {/* Right: Preview or Drop zone */}
        <div className="flex-1 min-w-0">
          {!file ? (
            // Drop zone - shown when no file is loaded
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed p-8 text-center cursor-pointer transition-all h-full flex items-center justify-center ${
                isDragOver
                  ? 'border-black bg-gray-50'
                  : 'border-gray-300 hover:border-black hover:bg-gray-50'
              }`}
            >
              <div className="space-y-3 py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Drop your image here
                  </p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
              </div>
            </div>
          ) : (
            // Preview - shown when file is loaded (matching ResultTab layout)
            <div className="bg-white shadow-sm border border-gray-200 p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Original Image
                </h2>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-gray-600 hover:text-black underline"
                >
                  Replace image
                </button>
              </div>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex justify-center items-center bg-gray-100 p-4 min-h-[600px] transition-colors ${
                  isDragOver ? 'bg-gray-200' : ''
                }`}
              >
                <img
                  src={preview!}
                  alt="Original"
                  className="max-h-[600px] max-w-full"
                  style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06))' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UploadTab

