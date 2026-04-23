// app/api/services/route.ts

import { getTenantSession } from '@/lib/tenant-guard'
import { ServiceService } from '@/lib/services/service.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'

export const GET = withErrorHandling(async () => {
    const { error, tenantId } = await getTenantSession()
    if (error) return error

    const services = await ServiceService.listByTenant(tenantId!)
    return ApiResponse.success(services)
})

export const POST = withErrorHandling(async (req: Request) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const body = await req.json()

    const service = await ServiceService.create(
        body,
        tenantId!,
        session!.user.id
    )

    return ApiResponse.success(service, 201)
})