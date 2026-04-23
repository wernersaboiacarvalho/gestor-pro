// lib/tenant-guard.ts
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

export async function getTenantSession() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return {
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
            session: null,
            tenantId: null
        }
    }

    if (!session.user.tenantId) {
        return {
            error: NextResponse.json({ error: 'Forbidden - Tenant required' }, { status: 403 }),
            session,
            tenantId: null
        }
    }

    return {
        error: null,
        session,
        tenantId: session.user.tenantId
    }
}