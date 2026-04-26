import { unlink } from 'fs/promises'
import path from 'path'
import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string; attachmentId: string }>
}

export const DELETE = withErrorHandling(async (_req: Request, { params }: RouteParams) => {
  const { id, attachmentId } = await params
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
  if (error) return error

  const attachment = await prisma.serviceAttachment.findFirst({
    where: {
      id: attachmentId,
      serviceId: id,
      tenantId: tenantId!,
    },
  })

  if (!attachment) {
    return ApiResponse.error('SERVICE_NOT_FOUND', 'Foto nao encontrada', 404)
  }

  await prisma.serviceAttachment.delete({
    where: { id: attachment.id },
  })

  if (attachment.url.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', attachment.url.replace(/^\//, ''))
    await unlink(filePath).catch(() => undefined)
  }

  await prisma.activity.create({
    data: {
      tenantId: tenantId!,
      userId: session!.user.id,
      action: 'SERVICE_ATTACHMENT_REMOVED',
      description: `Foto removida do servico #${id.slice(0, 8)}`,
      metadata: {
        serviceId: id,
        attachmentId,
      },
    },
  })

  return ApiResponse.success({ success: true, attachmentId })
})
