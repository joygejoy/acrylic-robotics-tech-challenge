import React from 'react'
import BackendVersionSelector from './BackendVersionSelector'

interface ConnectionStatusProps {
  online: boolean
  message: string
  checked: boolean
  onRetry: () => void
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  online,
  message,
  checked,
  onRetry,
}) => {
  if (!checked) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <BackendVersionSelector onVersionChange={onRetry} />
      <div
        className={`flex items-center gap-2 px-3 py-2 shadow-lg text-sm font-medium transition-all ${
          online
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            online ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        />
        <span>{online ? 'Connected' : 'Disconnected'}</span>
        {!online && (
          <button
            onClick={onRetry}
            className="ml-1 text-xs underline hover:no-underline transition-all"
            title={message}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

export default ConnectionStatus

