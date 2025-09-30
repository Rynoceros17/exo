import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const StopTrainingSchema = z.object({
  sessionId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = StopTrainingSchema.parse(body)

    // Update training session status
    const session = await db.trainingSession.update({
      where: { id: sessionId },
      data: {
        status: 'stopped',
        completedAt: new Date(),
      },
    })

    // Add stop log
    await db.trainingLog.create({
      data: {
        sessionId,
        level: 'info',
        message: 'Training stopped by user',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Training stopped successfully',
      session: {
        id: session.id,
        status: session.status,
        progress: session.progress,
      },
    })
  } catch (error) {
    console.error('Error stopping training:', error)
    return NextResponse.json(
      { error: 'Failed to stop training session' },
      { status: 400 }
    )
  }
}