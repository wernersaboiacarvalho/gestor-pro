import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import {
  deleteImageFromCloudinary,
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from '@/lib/storage/cloudinary'

export interface StoredServiceAttachment {
  url: string
  publicId: string | null
  storageProvider: 'CLOUDINARY' | 'LOCAL'
  fileName: string
  mimeType: string
  size: number
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

function localPublicPath(tenantId: string, serviceId: string, fileName: string) {
  return `/uploads/service-attachments/${tenantId}/${serviceId}/${fileName}`
}

async function storeLocally(file: File, tenantId: string, serviceId: string) {
  const extension = extensionFromMimeType(file.type)
  const fileName = `${uuidv4()}.${extension}`
  const publicDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'service-attachments',
    tenantId,
    serviceId
  )
  const filePath = path.join(publicDir, fileName)
  const bytes = await file.arrayBuffer()

  await mkdir(publicDir, { recursive: true })
  await writeFile(filePath, Buffer.from(bytes))

  return {
    url: localPublicPath(tenantId, serviceId, fileName),
    publicId: null,
    storageProvider: 'LOCAL' as const,
    fileName: file.name || fileName,
    mimeType: file.type,
    size: file.size,
  }
}

export async function storeServiceAttachment(
  file: File,
  tenantId: string,
  serviceId: string
): Promise<StoredServiceAttachment> {
  if (!isCloudinaryConfigured()) {
    return storeLocally(file, tenantId, serviceId)
  }

  const extension = extensionFromMimeType(file.type)
  const publicId = uuidv4()
  const result = await uploadImageToCloudinary({
    file,
    folder: `gestor-pro/tenants/${tenantId}/services/${serviceId}`,
    publicId,
  })

  return {
    url: result.secureUrl,
    publicId: result.publicId,
    storageProvider: 'CLOUDINARY',
    fileName: file.name || `${publicId}.${extension}`,
    mimeType: file.type,
    size: result.bytes || file.size,
  }
}

export async function deleteStoredServiceAttachment(attachment: {
  url: string
  publicId: string | null
  storageProvider: string
}) {
  if (attachment.storageProvider === 'CLOUDINARY' && attachment.publicId) {
    await deleteImageFromCloudinary(attachment.publicId)
    return
  }

  if (attachment.url.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', attachment.url.replace(/^\//, ''))
    await unlink(filePath).catch(() => undefined)
  }
}
