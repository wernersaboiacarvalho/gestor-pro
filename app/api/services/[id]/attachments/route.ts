import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { prisma } from '@/lib/prisma'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface RouteParams {
  params: Promise<{ id: string }>
}

async function assertServiceAccess(serviceId: string, tenantId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId },
    select: { id: true },
  })

  if (!service) {
    return ApiResponse.error('SERVICE_NOT_FOUND', 'Servico nao encontrado', 404)
  }

  return null
}

export const GET = withErrorHandling(async (_req: Request, { params }: RouteParams) => {
  const { id } = await params
  const { error, tenantId } = await getTenantSession({ requiredModule: 'services' })
  if (error) return error

  const accessError = await assertServiceAccess(id, tenantId!)
  if (accessError) return accessError

  const attachments = await prisma.serviceAttachment.findMany({
    where: { serviceId: id, tenantId: tenantId! },
    orderBy: { createdAt: 'desc' },
  })

  return ApiResponse.success(attachments)
})

export const POST = withErrorHandling(async (req: Request, { params }: RouteParams) => {
  const { id } = await params
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
  if (error) return error

  const accessError = await assertServiceAccess(id, tenantId!)
  if (accessError) return accessError

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const caption = String(formData.get('caption') || '').trim() || null

  if (!file) {
    return ApiResponse.error('VALIDATION_ERROR', 'Nenhuma foto enviada', 400)
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return ApiResponse.error('VALIDATION_ERROR', 'Use imagens JPG, PNG ou WebP.', 400)
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return ApiResponse.error('VALIDATION_ERROR', 'A foto deve ter no maximo 5MB.', 400)
  }

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const fileName = `${uuidv4()}.${extension}`
  const publicDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'service-attachments',
    tenantId!,
    id
  )
  const filePath = path.join(publicDir, fileName)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  await mkdir(publicDir, { recursive: true })
  await writeFile(filePath, buffer)

  const attachment = await prisma.serviceAttachment.create({
    data: {
      serviceId: id,
      tenantId: tenantId!,
      url: `/uploads/service-attachments/${tenantId}/${id}/${fileName}`,
      fileName: file.name || fileName,
      mimeType: file.type,
      size: file.size,
      caption,
      createdById: session!.user.id,
    },
  })

  await prisma.activity.create({
    data: {
      tenantId: tenantId!,
      userId: session!.user.id,
      action: 'SERVICE_ATTACHMENT_ADDED',
      description: `Foto adicionada ao servico #${id.slice(0, 8)}`,
      metadata: {
        serviceId: id,
        attachmentId: attachment.id,
      },
    },
  })

  return ApiResponse.success(attachment, 201)
})
