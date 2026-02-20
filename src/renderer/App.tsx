import React, { useState, useCallback, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import UploadTab from './components/UploadTab'
import ResultTab from './components/ResultTab'
import ConnectionStatus from './components/ConnectionStatus'
import { transformImage, TransformationResult, checkBackendHealth } from './api/imageApi'

export interface TransformationSpecs {
  color: {
    hue: number
    saturation: number
  }
  resize: {
    width: number
    height: number
  }
  grayscale?: boolean
  crop?: {
    enabled: boolean
    shape: 'rectangle' | 'square' | 'circle' | 'ellipse'
    width: number
    height: number
  }
}

type Tab = 'upload' | 'result'

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [result, setResult] = useState<TransformationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadKey, setUploadKey] = useState(0)
  const [backendStatus, setBackendStatus] = useState<{
    online: boolean
    message: string
    checked: boolean
  }>({ online: false, message: '', checked: false })

  const checkHealth = useCallback(async () => {
    const status = await checkBackendHealth()
    console.log('[Health Check]', status)
    setBackendStatus({ ...status, checked: true })
    return status.online
  }, [])

  const handleTransform = useCallback(async (file: File, specs: TransformationSpecs) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await transformImage(file, specs)
      // Add crop shape info to the result
      const resultWithCrop: TransformationResult = {
        ...data,
        cropShape: specs.crop?.enabled ? specs.crop.shape : undefined
      }
      setResult(resultWithCrop)
      setActiveTab('result')
      // Update backend status to online after successful request
      setBackendStatus({ online: true, message: 'Backend is online', checked: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      // Check backend health after a failed request
      checkHealth()
    } finally {
      setIsLoading(false)
    }
  }, [checkHealth])

  const handleStartOver = useCallback(() => {
    setResult(null)
    setError(null)
    setActiveTab('upload')
    setUploadKey(prev => prev + 1)
  }, [])

  // Check backend health on mount and periodically
  useEffect(() => {
    // Initial check
    console.log('[App] Setting up health check')
    checkHealth()

    // Set up periodic health checks every 5 seconds
    const intervalId = setInterval(() => {
      console.log('[App] Running periodic health check')
      checkHealth()
    }, 5000) // 5 seconds

    // Cleanup interval on unmount
    return () => {
      console.log('[App] Cleaning up health check interval')
      clearInterval(intervalId)
    }
  }, [checkHealth])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky header container */}
      <div className="sticky top-0 z-50">
        {/* Title bar */}
        <TitleBar />

        {/* Tab navigation */}
        <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'upload'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload &amp; Configure
          </button>
          <button
            onClick={() => setActiveTab('result')}
            disabled={!result}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'result'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } ${!result ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            Result
          </button>
        </nav>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-gray-50 border-l-4 border-gray-900 p-4 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-black">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-gray-900 hover:text-black"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 p-6">
        <div className={activeTab === 'upload' ? '' : 'hidden'}>
          <UploadTab key={uploadKey} onTransform={handleTransform} isLoading={isLoading} />
        </div>
        {result && (
          <div className={activeTab === 'result' ? '' : 'hidden'}>
            <ResultTab result={result} onStartOver={handleStartOver} />
          </div>
        )}
      </div>

      {/* Connection status indicator */}
      <ConnectionStatus
        online={backendStatus.online}
        message={backendStatus.message}
        checked={backendStatus.checked}
        onRetry={checkHealth}
      />
    </div>
  )
}

export default App

