import { getApiBaseUrl } from '../../config'

// Configuration
const REQUEST_TIMEOUT = 30000 // 30 seconds
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']

export interface TransformationResult {
  image: string   // base64-encoded image data
  format: string  // e.g. "png", "jpg"
  cropShape?: 'rectangle' | 'square' | 'circle' | 'ellipse'
}

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

// Validation functions
function validateFile(file: File): void {
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    throw new Error(
      `Unsupported image format: ${file.type}. Supported formats: PNG, JPEG, WebP, GIF`
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)
    throw new Error(
      `Image file is too large: ${sizeMB}MB. Maximum allowed size: ${maxSizeMB}MB`
    )
  }
}

function validateTransformationSpecs(specs: TransformationSpecs): void {
  // Validate hue range
  if (specs.color.hue < -180 || specs.color.hue > 180) {
    throw new Error('Hue must be between -180 and 180')
  }

  // Validate saturation range
  if (specs.color.saturation < 0 || specs.color.saturation > 3) {
    throw new Error('Saturation must be between 0 and 3')
  }

  // Validate grayscale (if provided)
  if (specs.grayscale !== undefined && typeof specs.grayscale !== 'boolean') {
    throw new Error('Grayscale must be a boolean value')
  }

  // Validate crop (if provided and enabled)
  if (specs.crop && specs.crop.enabled) {
    const validShapes = ['rectangle', 'square', 'circle', 'ellipse']
    if (!validShapes.includes(specs.crop.shape)) {
      throw new Error(`Crop shape must be one of: ${validShapes.join(', ')}`)
    }

    if (specs.crop.width <= 0 || specs.crop.height <= 0) {
      throw new Error('Crop width and height must be positive numbers')
    }

    if (specs.crop.width > 10000 || specs.crop.height > 10000) {
      throw new Error('Crop width and height must not exceed 10000 pixels')
    }
  }

  // Validate dimensions
  if (specs.resize.width <= 0 || specs.resize.height <= 0) {
    throw new Error('Width and height must be positive numbers')
  }

  if (specs.resize.width > 10000 || specs.resize.height > 10000) {
    throw new Error('Width and height must not exceed 10000 pixels')
  }
}

function isTransformationResult(data: any): data is TransformationResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.image === 'string' &&
    typeof data.format === 'string'
  )
}

function getNetworkErrorMessage(error: any): string {
  if (error.name === 'AbortError') {
    return 'Request timed out. The server took too long to respond. Please try again.'
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return `Cannot connect to the image processing server. Please ensure the backend is running at ${getApiBaseUrl()}`
  }

  return error.message || 'An unexpected error occurred'
}

export async function transformImage(
  file: File,
  specs: TransformationSpecs,
): Promise<TransformationResult> {
  validateFile(file)
  validateTransformationSpecs(specs)

  const formData = new FormData()
  formData.append('image', file)
  formData.append('transformations', JSON.stringify(specs))

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(`${getApiBaseUrl()}/transform`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`
      
      // Try to extract error message from response
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorBody = await response.json()
          if (errorBody.error) {
            errorMessage = errorBody.error
          }
        } else {
          // Non-JSON error response
          const textError = await response.text()
          if (textError) {
            errorMessage = `Server error: ${textError.substring(0, 200)}`
          }
        }
      } catch {
        // If parsing fails, use the status-based message
      }

      throw new Error(errorMessage)
    }

    // Parse and validate response
    const data = await response.json()

    if (!isTransformationResult(data)) {
      throw new Error('Invalid response from server: missing or invalid image data')
    }

    // Additional validation of response data
    if (!data.image || data.image.length === 0) {
      throw new Error('Server returned empty image data')
    }

    return {
      image: data.image,
      format: data.format || 'png',
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    throw new Error(getNetworkErrorMessage(error))
  }
}

// Health check function
export async function checkBackendHealth(): Promise<{ online: boolean; message: string }> {
  const baseUrl = getApiBaseUrl()
  console.log('[imageApi] Checking backend health at', baseUrl)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout for health check

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      console.log('[imageApi] Backend is ONLINE')
      return { online: true, message: 'Backend is online' }
    } else {
      console.log('[imageApi] Backend returned error status:', response.status)
      return { online: false, message: `Backend returned status ${response.status}` }
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      console.log('[imageApi] Backend health check TIMED OUT')
      return { online: false, message: 'Backend health check timed out' }
    }
    
    console.log('[imageApi] Backend is OFFLINE:', error.message)
    return { 
      online: false, 
      message: `Backend is not reachable at ${baseUrl}` 
    }
  }
}

// Get backend version from API
export async function getBackendVersion(): Promise<string> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch(`${getApiBaseUrl()}/version`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return data.version || 'unknown'
    }
    return 'unknown'
  } catch (error: any) {
    console.error('[imageApi] Failed to get backend version:', error)
    return 'unknown'
  }
}

