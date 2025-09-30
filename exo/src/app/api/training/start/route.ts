import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Schema for validating training request
const TrainingRequestSchema = z.object({
  dataSource: z.enum(['kepler', 'tess', 'k2', 'combined']),
  epochs: z.number().min(1).max(1000),
  batchSize: z.number().min(1).max(512),
  learningRate: z.number().min(0.0001).max(1),
  validationSplit: z.number().min(0).max(0.5),
  userId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = TrainingRequestSchema.parse(body)

    // Create training session
    const trainingSession = await db.trainingSession.create({
      data: {
        dataSource: validatedData.dataSource,
        status: 'pending',
        progress: 0,
        currentEpoch: 0,
        totalEpochs: validatedData.epochs,
        batchSize: validatedData.batchSize,
        learningRate: validatedData.learningRate,
        validationSplit: validatedData.validationSplit,
        userId: validatedData.userId,
        config: JSON.stringify({
          modelType: 'cnn',
          optimizer: 'adam',
          earlyStopping: true,
          patience: 10,
        }),
      },
    })

    // Add initial log
    await db.trainingLog.create({
      data: {
        sessionId: trainingSession.id,
        level: 'info',
        message: `Training session created for ${validatedData.dataSource} data source`,
      },
    })

    // Start training in background (simulate for now)
    startTrainingProcess(trainingSession.id)

    return NextResponse.json({
      success: true,
      sessionId: trainingSession.id,
      message: 'Training session started successfully',
    })
  } catch (error) {
    console.error('Error starting training:', error)
    return NextResponse.json(
      { error: 'Failed to start training session' },
      { status: 400 }
    )
  }
}

// Simulate training process
async function startTrainingProcess(sessionId: string) {
  try {
    // Update status to running
    await db.trainingSession.update({
      where: { id: sessionId },
      data: { status: 'running' },
    })

    await db.trainingLog.create({
      data: {
        sessionId,
        level: 'info',
        message: 'Training started - fetching NASA data...',
      },
    })

    // Simulate data fetching
    await new Promise(resolve => setTimeout(resolve, 2000))

    await db.trainingLog.create({
      data: {
        sessionId,
        level: 'info',
        message: 'Data loaded successfully - preprocessing light curves...',
      },
    })

    // Get session details
    const session = await db.trainingSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) return

    // Simulate training epochs
    for (let epoch = 1; epoch <= session.totalEpochs; epoch++) {
      const progress = (epoch / session.totalEpochs) * 100
      const loss = Math.max(0.1, 1.0 - (epoch / session.totalEpochs) * 0.8 + Math.random() * 0.1)
      const accuracy = Math.min(0.99, 0.5 + (epoch / session.totalEpochs) * 0.4 + Math.random() * 0.05)

      // Update session progress
      await db.trainingSession.update({
        where: { id: sessionId },
        data: {
          progress,
          currentEpoch: epoch,
          loss,
          accuracy,
        },
      })

      // Log progress
      if (epoch % 10 === 0) {
        await db.trainingLog.create({
          data: {
            sessionId,
            level: 'info',
            message: `Epoch ${epoch}/${session.totalEpochs} - Loss: ${loss.toFixed(4)}, Accuracy: ${(accuracy * 100).toFixed(2)}%`,
          },
        })
      }

      // Record performance metrics
      await db.modelPerformance.create({
        data: {
          sessionId,
          epoch,
          trainLoss: loss,
          validationLoss: loss * 1.1,
          trainAccuracy: accuracy,
          validationAccuracy: accuracy * 0.95,
          precision: accuracy * 0.98,
          recall: accuracy * 0.96,
          f1Score: accuracy * 0.97,
        },
      })

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Generate some mock exoplanet results
    const mockExoplanets = [
      {
        name: 'Kepler-442b',
        hostStar: 'Kepler-442',
        confidence: 0.95,
        status: 'candidate',
        detectionMethod: 'transit',
        radius: 1.34,
        orbitalPeriod: 112.3,
        transitDepth: 850,
        transitDuration: 2.8,
        signalToNoise: 12.5,
        dataSource: 'kepler',
      },
      {
        name: 'TOI-715 b',
        hostStar: 'TOI-715',
        confidence: 0.87,
        status: 'candidate',
        detectionMethod: 'transit',
        radius: 1.55,
        orbitalPeriod: 19.3,
        transitDepth: 1200,
        transitDuration: 2.1,
        signalToNoise: 9.8,
        dataSource: 'tess',
      },
      {
        name: 'HD 40307g',
        hostStar: 'HD 40307',
        confidence: 0.92,
        status: 'candidate',
        detectionMethod: 'radial_velocity',
        mass: 7.1,
        orbitalPeriod: 197.8,
        orbitalRadius: 0.6,
        temperature: 288,
        dataSource: 'combined',
      },
    ]

    // Save exoplanet results
    for (const exoplanet of mockExoplanets) {
      await db.exoplanetResult.create({
        data: {
          sessionId,
          ...exoplanet,
          rawData: JSON.stringify({
            discoveryMethod: 'AI Detection',
            modelVersion: '1.0.0',
            detectionDate: new Date().toISOString(),
          }),
        },
      })
    }

    // Mark training as completed
    await db.trainingSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      },
    })

    await db.trainingLog.create({
      data: {
        sessionId,
        level: 'info',
        message: 'Training completed successfully! Found 3 exoplanet candidates.',
      },
    })

  } catch (error) {
    console.error('Training process error:', error)
    
    // Mark training as failed
    await db.trainingSession.update({
      where: { id: sessionId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    await db.trainingLog.create({
      data: {
        sessionId,
        level: 'error',
        message: `Training failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    })
  }
}