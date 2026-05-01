import { createHash } from 'crypto'

interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

interface UploadImageOptions {
  file: File
  folder: string
  publicId: string
}

interface UploadImageResult {
  secureUrl: string
  publicId: string
  bytes: number
  format: string
}

function parseCloudinaryUrl(value: string | undefined): Partial<CloudinaryConfig> {
  if (!value || value.includes('<your_api_key>') || value.includes('<your_api_secret>')) {
    return {}
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'cloudinary:') return {}

    return {
      cloudName: url.hostname,
      apiKey: decodeURIComponent(url.username),
      apiSecret: decodeURIComponent(url.password),
    }
  } catch {
    return {}
  }
}

function getConfig(): CloudinaryConfig | null {
  const urlConfig = parseCloudinaryUrl(process.env.CLOUDINARY_URL)
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDNARY_CLOUD_NAME || urlConfig.cloudName
  const apiKey = process.env.CLOUDINARY_API_KEY || urlConfig.apiKey
  const apiSecret =
    process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINAY_API_SECRET || urlConfig.apiSecret

  if (!cloudName || !apiKey || !apiSecret) {
    return null
  }

  return { cloudName, apiKey, apiSecret }
}

function signParams(
  params: Record<string, string | number | boolean | null | undefined>,
  apiSecret: string
) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  return createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex')
}

export function isCloudinaryConfigured() {
  return Boolean(getConfig())
}

export async function uploadImageToCloudinary({
  file,
  folder,
  publicId,
}: UploadImageOptions): Promise<UploadImageResult> {
  const config = getConfig()
  if (!config) {
    throw new Error('Cloudinary nao configurado.')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const params = {
    folder,
    overwrite: true,
    public_id: publicId,
    timestamp,
  }
  const signature = signParams(params, config.apiSecret)
  const formData = new FormData()

  formData.append('file', file)
  formData.append('api_key', config.apiKey)
  formData.append('folder', folder)
  formData.append('overwrite', 'true')
  formData.append('public_id', publicId)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Erro ao enviar imagem para o Cloudinary.')
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    bytes: data.bytes,
    format: data.format,
  }
}

export async function deleteImageFromCloudinary(publicId: string) {
  const config = getConfig()
  if (!config) {
    throw new Error('Cloudinary nao configurado.')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const params = {
    invalidate: true,
    public_id: publicId,
    timestamp,
  }
  const signature = signParams(params, config.apiSecret)
  const formData = new FormData()

  formData.append('api_key', config.apiKey)
  formData.append('invalidate', 'true')
  formData.append('public_id', publicId)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
    {
      method: 'POST',
      body: formData,
    }
  )
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Erro ao remover imagem do Cloudinary.')
  }

  return data
}
