import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ActivityService } from '@/lib/services/activity.service'
import { ApiResponse } from '@/lib/http/api-response'
import { getTenantSession } from '@/lib/tenant-guard'

// GET /api/activities
export const GET = withErrorHandling(async (request: Request) => {
  const { error, tenantId } = await getTenantSession({ requiredModule: 'activities' })
  if (error) return error

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const skip = parseInt(searchParams.get('skip') || '0')
  const action = searchParams.get('action') || undefined
  const serviceId = searchParams.get('serviceId') || undefined

  const activities = await ActivityService.listByTenant(tenantId!, {
    limit: Math.min(limit, 100),
    skip,
  })

  const filteredActivities = activities.filter((item) => {
    const actionMatches = action ? item.action === action : true

    if (!serviceId) return actionMatches

    const metadata =
      item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, unknown>)
        : null

    return actionMatches && metadata?.serviceId === serviceId
  })
  const total =
    serviceId || action ? filteredActivities.length : await ActivityService.countByTenant(tenantId!)

  return ApiResponse.success({
    activities: filteredActivities,
    pagination: {
      total,
      limit: Math.min(limit, 100),
      skip,
      hasMore: skip + Math.min(limit, 100) < total,
    },
  })
})
