import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    // Get exoplanet results for the session
    const results = await db.exoplanetResult.findMany({
      where: { sessionId },
      orderBy: { confidence: 'desc' },
    })

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    })
  } catch (error) {
    console.error('Error fetching exoplanet results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exoplanet results' },
      { status: 500 }
    )
  }
}