import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const level = searchParams.get('level') || undefined

    // Build where clause
    const where: any = { sessionId }
    if (level && ['info', 'warning', 'error', 'debug'].includes(level)) {
      where.level = level
    }

    // Get logs with pagination
    const logs = await db.trainingLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    })

    // Get total count for pagination
    const total = await db.trainingLog.count({ where })

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching training logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training logs' },
      { status: 500 }
    )
  }
}