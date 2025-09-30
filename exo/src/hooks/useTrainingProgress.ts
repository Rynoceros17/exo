'use client'

import { useState, useEffect, useCallback } from 'react'

interface TrainingStatus {
  id: string
  status: string
  progress: number
  currentEpoch: number
  totalEpochs: number
  loss?: number
  accuracy?: number
  startedAt: string
  completedAt?: string
  dataSource: string
  exoplanetCount: number
  latestPerformance?: {
    epoch: number
    trainLoss: number
    validationLoss: number
    trainAccuracy: number
    validationAccuracy: number
  }
  logCount: number
}

interface UseTrainingProgressOptions {
  sessionId?: string
  interval?: number
  enabled?: boolean
}

export function useTrainingProgress(options: UseTrainingProgressOptions = {}) {
  const { sessionId, interval = 2000, enabled = true } = options
  const [status, setStatus] = useState<TrainingStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/training/status/${sessionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch training status')
      }

      const data = await response.json()
      
      if (data.success) {
        setStatus(data.session)
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // Start training session
  const startTraining = useCallback(async (config: {
    dataSource: string
    epochs: number
    batchSize: number
    learningRate: number
    validationSplit: number
    userId?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/training/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Failed to start training')
      }

      const data = await response.json()
      
      if (data.success) {
        return data.sessionId
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Stop training session
  const stopTraining = useCallback(async (stopSessionId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/training/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: stopSessionId }),
      })

      if (!response.ok) {
        throw new Error('Failed to stop training')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh when training is active
  useEffect(() => {
    if (!enabled || !sessionId) return

    const isActive = status?.status === 'running'
    
    if (isActive) {
      const intervalId = setInterval(fetchStatus, interval)
      return () => clearInterval(intervalId)
    }
  }, [enabled, sessionId, status?.status, interval, fetchStatus])

  // Initial fetch
  useEffect(() => {
    if (enabled && sessionId) {
      fetchStatus()
    }
  }, [enabled, sessionId, fetchStatus])

  return {
    status,
    loading,
    error,
    startTraining,
    stopTraining,
    refetch: fetchStatus,
    isTrainingActive: status?.status === 'running',
    isTrainingCompleted: status?.status === 'completed',
    isTrainingFailed: status?.status === 'failed',
  }
}