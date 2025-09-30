import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    // Get training session with related data
    const session = await db.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        exoplanetResults: true,
        performance: {
          orderBy: { epoch: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            logs: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      )
    }

    // Get recent logs
    const recentLogs = await db.trainingLog.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        progress: session.progress,
        currentEpoch: session.currentEpoch,
        totalEpochs: session.totalEpochs,
        loss: session.loss,
        accuracy: session.accuracy,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        dataSource: session.dataSource,
        exoplanetCount: session.exoplanetResults.length,
        latestPerformance: session.performance[0] || null,
        logCount: session._count.logs,
      },
      recentLogs,
    })
  } catch (error) {
    console.error('Error fetching training status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training status' },
      { status: 500 }
    )
  }
}