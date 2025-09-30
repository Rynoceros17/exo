import { NextRequest, NextResponse } from 'next/server'
import { exoplanetML } from '@/lib/exoplanet-ml'
import { z } from 'zod'

const VisualizationRequestSchema = z.object({
  exoplanet: z.object({
    id: z.string(),
    name: z.string().optional(),
    hostStar: z.string().optional(),
    confidence: z.number(),
    status: z.string(),
    detectionMethod: z.string(),
    radius: z.number().optional(),
    mass: z.number().optional(),
    orbitalPeriod: z.number().optional(),
    orbitalRadius: z.number().optional(),
    temperature: z.number().optional(),
    dataSource: z.string(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exoplanet } = VisualizationRequestSchema.parse(body)

    // Generate visualization using the ML system
    const imageBase64 = await exoplanetML.generateExoplanetVisualization(exoplanet)

    return NextResponse.json({
      success: true,
      image: imageBase64,
      message: 'Visualization generated successfully',
    })
  } catch (error) {
    console.error('Error generating visualization:', error)
    return NextResponse.json(
      { error: 'Failed to generate visualization' },
      { status: 500 }
    )
  }
}