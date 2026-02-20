import React, { useState, useEffect } from 'react'
import { getBackendVersion } from '../api/imageApi'
import {
  getBackendOptions,
  getSelectedBackendVersion,
  setBackendVersion,
  type BackendVersionId,
} from '../../config'

interface BackendVersionSelectorProps {
  onVersionChange?: () => void
}

const BackendVersionSelector: React.FC<BackendVersionSelectorProps> = ({ onVersionChange }) => {
  const [selectedId, setSelectedId] = useState<BackendVersionId>(() => getSelectedBackendVersion())
  const [version, setVersion] = useState<string>('...')
  const [loading, setLoading] = useState(true)

  const options = getBackendOptions()

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        setLoading(true)
        const v = await getBackendVersion()
        setVersion(v)
      } catch (error) {
        console.error('[BackendVersionSelector] Failed to fetch version:', error)
        setVersion('unknown')
      } finally {
        setLoading(false)
      }
    }

    fetchVersion()

    const interval = setInterval(fetchVersion, 30000)
    return () => clearInterval(interval)
  }, [selectedId])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value as BackendVersionId
    if (newId !== 'latest' && newId !== 'pinned') return
    setBackendVersion(newId)
    setSelectedId(newId)
    onVersionChange?.()
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-600">
      <span className="font-medium">Backend:</span>
      <select
        value={selectedId}
        onChange={handleChange}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-700 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400"
        title="Choose which backend URL to use (persisted)"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className={`${loading ? 'animate-pulse' : ''} ${version === 'unknown' ? 'text-yellow-600' : 'text-gray-700'}`}>
        v{version}
      </span>
    </div>
  )
}

export default BackendVersionSelector
