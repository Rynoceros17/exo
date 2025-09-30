'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Star, 
  Globe, 
  Thermometer, 
  Clock, 
  Zap,
  Eye,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react'

interface ExoplanetCardProps {
  exoplanet: {
    id: string
    name?: string
    hostStar?: string
    confidence: number
    status: string
    detectionMethod: string
    radius?: number
    mass?: number
    orbitalPeriod?: number
    orbitalRadius?: number
    temperature?: number
    transitDepth?: number
    transitDuration?: number
    signalToNoise?: number
    dataSource: string
  }
  onViewDetails?: (id: string) => void
  onGenerateVisualization?: (id: string) => void
}

export function ExoplanetCard({ 
  exoplanet, 
  onViewDetails, 
  onGenerateVisualization 
}: ExoplanetCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-600'
      case 'candidate':
        return 'bg-yellow-600'
      case 'false_positive':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'transit':
        return <Eye className="h-4 w-4" />
      case 'radial_velocity':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              {exoplanet.name || 'Unnamed Exoplanet'}
            </CardTitle>
            {exoplanet.hostStar && (
              <CardDescription className="text-gray-300">
                Host: {exoplanet.hostStar}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={getStatusColor(exoplanet.status)}
            >
              {exoplanet.status}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {getMethodIcon(exoplanet.detectionMethod)}
              {exoplanet.detectionMethod}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">AI Confidence</span>
            <span className="text-white font-mono">
              {(exoplanet.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={exoplanet.confidence * 100} 
            className="h-2"
          />
        </div>

        {/* Physical Characteristics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {exoplanet.radius && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" />
              <div>
                <div className="text-gray-400">Radius</div>
                <div className="text-white font-medium">
                  {exoplanet.radius.toFixed(2)} R⊕
                </div>
              </div>
            </div>
          )}
          
          {exoplanet.orbitalPeriod && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-400" />
              <div>
                <div className="text-gray-400">Period</div>
                <div className="text-white font-medium">
                  {exoplanet.orbitalPeriod.toFixed(1)} days
                </div>
              </div>
            </div>
          )}
          
          {exoplanet.temperature && (
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-400" />
              <div>
                <div className="text-gray-400">Temp</div>
                <div className="text-white font-medium">
                  {exoplanet.temperature.toFixed(0)} K
                </div>
              </div>
            </div>
          )}
          
          {exoplanet.signalToNoise && (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <div>
                <div className="text-gray-400">S/N Ratio</div>
                <div className="text-white font-medium">
                  {exoplanet.signalToNoise.toFixed(1)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Source */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <Badge variant="outline" className="text-xs">
            {exoplanet.dataSource.toUpperCase()}
          </Badge>
          
          <div className="flex gap-2">
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(exoplanet.id)}
                className="h-8 px-2 text-gray-300 hover:text-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
            {onGenerateVisualization && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onGenerateVisualization(exoplanet.id)}
                className="h-8 px-2 text-gray-300 hover:text-white"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}