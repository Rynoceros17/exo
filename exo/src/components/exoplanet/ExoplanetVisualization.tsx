'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  Download, 
  RefreshCw, 
  Star,
  Globe,
  Thermometer,
  Clock,
  Zap
} from 'lucide-react'

interface ExoplanetVisualizationProps {
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
    dataSource: string
  }
}

export function ExoplanetVisualization({ exoplanet }: ExoplanetVisualizationProps) {
  const [visualization, setVisualization] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateVisualization = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/exoplanets/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exoplanet }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate visualization')
      }

      const data = await response.json()
      setVisualization(data.image)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = () => {
    if (visualization) {
      const link = document.createElement('a')
      link.href = `data:image/png;base64,${visualization}`
      link.download = `${exoplanet.name || 'exoplanet'}_visualization.png`
      link.click()
    }
  }

  const getExoplanetDescription = () => {
    const descriptions = {
      high_confidence: 'A promising exoplanet candidate with strong transit signals',
      earth_like: 'Potentially Earth-like planet in the habitable zone',
      gas_giant: 'Large gas giant planet similar to Jupiter',
      super_earth: 'Super-Earth with potential for thick atmosphere',
      hot_jupiter: 'Hot Jupiter orbiting very close to its star'
    }

    if (exoplanet.radius) {
      if (exoplanet.radius < 1.5) {
        if (exoplanet.temperature && exoplanet.temperature > 200 && exoplanet.temperature < 400) {
          return descriptions.earth_like
        }
        return descriptions.super_earth
      } else if (exoplanet.radius > 8) {
        if (exoplanet.orbitalPeriod && exoplanet.orbitalPeriod < 10) {
          return descriptions.hot_jupiter
        }
        return descriptions.gas_giant
      }
    }

    return exoplanet.confidence > 0.8 ? descriptions.high_confidence : 'Exoplanet candidate requiring further analysis'
  }

  return (
    <div className="space-y-6">
      {/* Exoplanet Info Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Star className="h-5 w-5 text-yellow-400" />
            {exoplanet.name || 'Unnamed Exoplanet'}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {getExoplanetDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-gray-400">Confidence</span>
              <div className="text-white font-semibold">
                {(exoplanet.confidence * 100).toFixed(1)}%
              </div>
            </div>
            {exoplanet.radius && (
              <div className="space-y-1">
                <span className="text-sm text-gray-400">Radius</span>
                <div className="text-white font-semibold">
                  {exoplanet.radius.toFixed(2)} R⊕
                </div>
              </div>
            )}
            {exoplanet.orbitalPeriod && (
              <div className="space-y-1">
                <span className="text-sm text-gray-400">Period</span>
                <div className="text-white font-semibold">
                  {exoplanet.orbitalPeriod.toFixed(1)} days
                </div>
              </div>
            )}
            {exoplanet.temperature && (
              <div className="space-y-1">
                <span className="text-sm text-gray-400">Temperature</span>
                <div className="text-white font-semibold">
                  {exoplanet.temperature.toFixed(0)} K
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visualization Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Eye className="h-5 w-5 text-blue-400" />
            AI Visualization
          </CardTitle>
          <CardDescription className="text-gray-300">
            Generate an AI-powered visualization of this exoplanet system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={generateVisualization}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Visualization
                </>
              )}
            </Button>
            {visualization && (
              <Button
                variant="outline"
                onClick={downloadImage}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>

          {error && (
            <Alert className="mt-4 bg-red-900/20 border-red-700">
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Visualization */}
      {visualization && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Generated Visualization</CardTitle>
            <CardDescription className="text-gray-300">
              AI-generated artistic representation of the exoplanet system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img
                src={`data:image/png;base64,${visualization}`}
                alt={`Visualization of ${exoplanet.name || 'exoplanet'}`}
                className="w-full h-auto rounded-lg"
              />
              <div className="absolute bottom-2 right-2">
                <Badge variant="secondary" className="bg-black/50">
                  AI Generated
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder when no visualization */}
      {!visualization && !isGenerating && (
        <Card className="bg-slate-800/50 border-slate-700 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Eye className="h-16 w-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-center">
              Click "Generate Visualization" to create an AI-powered visualization
              <br />
              of this exoplanet system
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}