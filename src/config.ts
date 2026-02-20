/**
 * Backend URL config with version selector (Latest vs Pinned).
 * Choice is persisted in localStorage so it survives restarts.
 */

const STORAGE_KEY = 'tcw26-backend-version'
const DEFAULT_VERSION: BackendVersionId = 'latest'

export type BackendVersionId = 'latest' | 'pinned'

function getEnvUrl(key: string): string {
  const v = import.meta.env?.[key] ?? (typeof process !== 'undefined' ? process.env?.[key] : undefined)
  return typeof v === 'string' ? v : ''
}

function getLatestUrl(): string {
  return getEnvUrl('VITE_API_BASE_URL_LATEST') || getEnvUrl('VITE_API_BASE_URL') || 'http://127.0.0.1:8000'
}

function getPinnedUrl(): string {
  return getEnvUrl('VITE_API_BASE_URL_PINNED') || getEnvUrl('VITE_API_BASE_URL') || getLatestUrl()
}

/** Returns the backend base URL for the currently selected version (reads localStorage). */
export function getApiBaseUrl(): string {
  const id = getSelectedBackendVersion()
  return id === 'pinned' ? getPinnedUrl() : getLatestUrl()
}

/** Current selection (persisted). */
export function getSelectedBackendVersion(): BackendVersionId {
  if (typeof window === 'undefined') return DEFAULT_VERSION
  const s = localStorage.getItem(STORAGE_KEY)
  return s === 'pinned' || s === 'latest' ? s : DEFAULT_VERSION
}

/** Set which backend to use; persists across restarts. */
export function setBackendVersion(id: BackendVersionId): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, id)
  console.log('[config] Backend version set to:', id)
}

export interface BackendOption {
  id: BackendVersionId
  label: string
  url: string
}

/** Options for the version selector (Latest + Pinned). */
export function getBackendOptions(): BackendOption[] {
  return [
    { id: 'latest', label: 'Latest', url: getLatestUrl() },
    { id: 'pinned', label: 'v1.0.0 (Pinned)', url: getPinnedUrl() },
  ]
}

// Log on load (renderer only)
if (typeof window !== 'undefined') {
  console.log('[config] API Base URL:', getApiBaseUrl(), '(version: ' + getSelectedBackendVersion() + ')')
}
