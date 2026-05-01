import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody } from '@/lib/http/validate-request'
import { verifyPublicServiceToken } from '@/lib/services/public-service-token'
import { ServiceService } from '@/lib/services/service.service'

const approveSchema = z.object({
  name: z.string().min(3, 'Informe seu nome').max(120),
  document: z.string().max(40).optional().nullable(),
})

interface RouteParams {
  params: Promise<{ token: string }>
}

export const POST = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
  const { token } = await params
  const payload = verifyPublicServiceToken(token)

  if (!payload) {
    return ApiResponse.error('INVALID_REQUEST', 'Link invalido ou expirado.', 400)
  }

  const data = await validateRequestBody(req, approveSchema)
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || null
  const userAgent = requestHeaders.get('user-agent')

  const service = await ServiceService.approveBudget(payload.sid, payload.tid, null, {
    clientName: data.name,
    clientDocument: data.document || null,
    ip,
    userAgent,
  })

  return ApiResponse.success(service)
})
