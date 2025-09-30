'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { Brain, TrendingUp, TrendingDown, Clock } from 'lucide-react'

interface TrainingProgressChartProps {
  progress: number
  currentEpoch: number
  totalEpochs: number
  loss?: number
  accuracy?: number
  performanceData?: Array<{
    epoch: number
    trainLoss: number
    validationLoss: number
    trainAccuracy: number
    validationAccuracy: number
  }>
}

export function TrainingProgressChart({
  progress,
  currentEpoch,
  totalEpochs,
  loss,
  accuracy,
  performanceData = []
}: TrainingProgressChartProps) {
  const getStatusColor = (progress: number) => {
    if (progress >= 100) return 'text-green-400'
    if (progress >= 50) return 'text-blue-400'
    return 'text-yellow-400'
  }

  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return <TrendingUp className="h-4 w-4" />
    if (progress >= 50) return <Brain className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  // Generate mock performance data if not provided
  const mockData = performanceData.length > 0 ? performanceData : 
    Array.from({ length: Math.min(currentEpoch, 20) }, (_, i) => ({
      epoch: i + 1,
      trainLoss: Math.max(0.1, 1.0 - (i / 20) * 0.8 + Math.random() * 0.1),
      validationLoss: Math.max(0.1, 1.0 - (i / 20) * 0.7 + Math.random() * 0.15),
      trainAccuracy: Math.min(0.99, 0.5 + (i / 20) * 0.4 + Math.random() * 0.05),
      validationAccuracy: Math.min(0.99, 0.45 + (i / 20) * 0.4 + Math.random() * 0.03),
    }))

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="h-5 w-5 text-purple-400" />
            Training Progress
          </CardTitle>
          <CardDescription className="text-gray-300">
            Real-time training metrics and model performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Overall Progress</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono ${getStatusColor(progress)}`}>
                  {progress.toFixed(1)}%
                </span>
                {getStatusIcon(progress)}
              </div>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Epoch Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-gray-300">Current Epoch</span>
              <div className="text-white font-mono">
                {currentEpoch}/{totalEpochs}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-gray-300">ETA</span>
              <div className="text-white font-mono">
                {progress >= 100 ? 'Completed' : `${Math.ceil((100 - progress) * 0.5)}m`}
              </div>
            </div>
          </div>

          {/* Current Metrics */}
          {(loss !== undefined || accuracy !== undefined) && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
              {loss !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-300">Loss</span>
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  </div>
                  <div className="text-white font-mono">
                    {loss.toFixed(4)}
                  </div>
                </div>
              )}
              {accuracy !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-300">Accuracy</span>
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  </div>
                  <div className="text-white font-mono">
                    {(accuracy * 100).toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loss Chart */}
      {mockData.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Training Loss</CardTitle>
            <CardDescription className="text-gray-300">
              Model loss over training epochs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="epoch" 
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="trainLoss" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="Training Loss"
                />
                <Line 
                  type="monotone" 
                  dataKey="validationLoss" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  name="Validation Loss"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Accuracy Chart */}
      {mockData.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Model Accuracy</CardTitle>
            <CardDescription className="text-gray-300">
              Classification accuracy over training epochs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="epoch" 
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={12}
                  domain={[0, 1]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="trainAccuracy" 
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name="Training Accuracy"
                />
                <Area 
                  type="monotone" 
                  dataKey="validationAccuracy" 
                  stroke="#f59e0b" 
                  fill="#f59e0b"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name="Validation Accuracy"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}