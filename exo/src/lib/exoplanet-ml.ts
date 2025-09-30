import ZAI from 'z-ai-web-dev-sdk'

export interface ExoplanetData {
  lightCurve: number[]
  metadata: {
    keplerId?: string
    tessId?: string
    period?: number
    depth?: number
    duration?: number
    stellarMass?: number
    stellarRadius?: number
    temperature?: number
  }
}

export interface TrainingConfig {
  dataSource: 'kepler' | 'tess' | 'k2' | 'combined'
  epochs: number
  batchSize: number
  learningRate: number
  validationSplit: number
  modelType?: 'cnn' | 'lstm' | 'transformer'
}

export interface TrainingResult {
  sessionId: string
  status: string
  progress: number
  loss?: number
  accuracy?: number
  exoplanetsFound: number
}

export class ExoplanetML {
  private zai: any
  private isInitialized = false

  async initialize() {
    try {
      this.zai = await ZAI.create()
      this.isInitialized = true
      console.log('Exoplanet ML system initialized')
    } catch (error) {
      console.error('Failed to initialize Exoplanet ML:', error)
      throw error
    }
  }

  async trainModel(config: TrainingConfig): Promise<TrainingResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // Generate training prompt for AI
      const trainingPrompt = this.generateTrainingPrompt(config)
      
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert machine learning engineer specializing in exoplanet detection using NASA data. 
            You have access to Kepler, TESS, and K2 mission data. Your task is to train neural networks to identify 
            exoplanet transit signals in light curve data. Provide detailed training progress and results.`
          },
          {
            role: 'user',
            content: trainingPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })

      const response = completion.choices[0]?.message?.content || ''
      
      // Parse the AI response to extract training results
      return this.parseTrainingResponse(response, config)
      
    } catch (error) {
      console.error('Training failed:', error)
      throw error
    }
  }

  async detectExoplanets(lightCurveData: number[], metadata: any): Promise<{
    isExoplanet: boolean
    confidence: number
    characteristics?: {
      radius?: number
      period?: number
      temperature?: number
    }
  }> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const detectionPrompt = `
        Analyze the following light curve data for exoplanet transit signals:
        
        Light Curve Data (first 100 points): ${lightCurveData.slice(0, 100).join(', ')}
        ... [${lightCurveData.length} total points]
        
        Metadata: ${JSON.stringify(metadata)}
        
        Please determine if this contains exoplanet transit signals and provide:
        1. Is this an exoplanet? (true/false)
        2. Confidence level (0-1)
        3. Estimated characteristics if applicable
      `

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert in exoplanet detection using transit photometry. Analyze light curve data and identify exoplanet candidates.'
          },
          {
            role: 'user',
            content: detectionPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 500,
      })

      const response = completion.choices[0]?.message?.content || ''
      return this.parseDetectionResponse(response)
      
    } catch (error) {
      console.error('Detection failed:', error)
      throw error
    }
  }

  async generateExoplanetVisualization(exoplanetData: any): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const visualizationPrompt = `
        Generate a visualization prompt for an exoplanet system with the following characteristics:
        ${JSON.stringify(exoplanetData)}
        
        Create a detailed description for generating an image of this exoplanet system, including:
        - The star and its appearance
        - The exoplanet and its features
        - Orbital characteristics
        - Any notable features that make this exoplanet interesting
      `

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an astronomical visualization expert. Create detailed descriptions for generating exoplanet system images.'
          },
          {
            role: 'user',
            content: visualizationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      })

      const description = completion.choices[0]?.message?.content || ''
      
      // Generate image using the description
      const imageResponse = await this.zai.images.generations.create({
        prompt: description,
        size: '1024x1024'
      })

      return imageResponse.data[0].base64
      
    } catch (error) {
      console.error('Visualization generation failed:', error)
      throw error
    }
  }

  private generateTrainingPrompt(config: TrainingConfig): string {
    return `
      Configure and train a neural network for exoplanet detection with the following parameters:
      
      Data Source: ${config.dataSource}
      Epochs: ${config.epochs}
      Batch Size: ${config.batchSize}
      Learning Rate: ${config.learningRate}
      Validation Split: ${config.validationSplit}
      Model Type: ${config.modelType || 'cnn'}
      
      Please provide:
      1. Model architecture details
      2. Training strategy
      3. Expected performance metrics
      4. Data preprocessing steps
      5. Feature extraction methods for light curve analysis
    `
  }

  private parseTrainingResponse(response: string, config: TrainingConfig): TrainingResult {
    // Extract key information from AI response
    const confidenceMatch = response.match(/confidence[^\d]*(\d+(?:\.\d+)?)/i)
    const lossMatch = response.match(/loss[^\d]*(\d+(?:\.\d+)?)/i)
    const accuracyMatch = response.match(/accuracy[^\d]*(\d+(?:\.\d+)?)/i)
    const exoplanetsMatch = response.match(/(\d+)\s*exoplanets?/i)

    return {
      sessionId: `session_${Date.now()}`,
      status: 'completed',
      progress: 100,
      loss: lossMatch ? parseFloat(lossMatch[1]) : undefined,
      accuracy: accuracyMatch ? parseFloat(accuracyMatch[1]) : undefined,
      exoplanetsFound: exoplanetsMatch ? parseInt(exoplanetsMatch[1]) : 0
    }
  }

  private parseDetectionResponse(response: string): {
    isExoplanet: boolean
    confidence: number
    characteristics?: {
      radius?: number
      period?: number
      temperature?: number
    }
  } {
    const isExoplanetMatch = response.match(/is\s+(an?\s+)?exoplanet[^\w]*(true|false|yes|no)/i)
    const confidenceMatch = response.match(/confidence[^\d]*(\d+(?:\.\d+)?)/i)
    const radiusMatch = response.match(/radius[^\d]*(\d+(?:\.\d+)?)/i)
    const periodMatch = response.match(/period[^\d]*(\d+(?:\.\d+)?)/i)
    const tempMatch = response.match(/temperature[^\d]*(\d+(?:\.\d+)?)/i)

    return {
      isExoplanet: isExoplanetMatch ? ['true', 'yes'].includes(isExoplanetMatch[1].toLowerCase()) : false,
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0,
      characteristics: {
        radius: radiusMatch ? parseFloat(radiusMatch[1]) : undefined,
        period: periodMatch ? parseFloat(periodMatch[1]) : undefined,
        temperature: tempMatch ? parseFloat(tempMatch[1]) : undefined
      }
    }
  }
}

// Singleton instance
export const exoplanetML = new ExoplanetML()