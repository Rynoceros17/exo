'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Line, Text, Billboard } from '@react-three/drei'
import { Suspense, useRef, useState, createContext, useContext, useMemo } from 'react'
import * as THREE from 'three'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Play, Pause, RotateCcw, Camera, Eye, ChevronLeft, ChevronRight, Settings } from 'lucide-react'

// Configuration context
interface SolarSystemConfig {
  sun: {
    radius: number
    emission: number
  }
  planets: Array<{
    radius: number
    semiMajorAxis: number
    eccentricity: number
    color: string
    orbitalPeriod: number
    rotationPeriod: number
    inclination: number
    longitudeOfAscendingNode: number
    argumentOfPeriapsis: number
    axialTilt: number
    name: string
  }>
  time: {
    speed: number
    paused: boolean
  }
  render: {
    showOrbits: boolean
    showTrails: boolean
    trailLength: number
    trailFade: boolean
  }
  camera: {
    mode: 'free' | 'follow'
    followPlanet: number
    preset: 'default' | 'top' | 'ecliptic' | 'side'
  }
}

const ConfigContext = createContext<{
  config: SolarSystemConfig
  updateConfig: (updates: Partial<SolarSystemConfig>) => void
} | null>(null)

function useConfig() {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}

// Default configuration
const defaultConfig: SolarSystemConfig = {
  sun: {
    radius: 2,
    emission: 1
  },
  planets: [
    {
      radius: 0.4,
      semiMajorAxis: 8,
      eccentricity: 0.2,
      color: "#8C7853", // Mercury - grayish brown
      orbitalPeriod: 12,
      rotationPeriod: 1,
      inclination: 15,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      axialTilt: 23.5,
      name: "Mercury"
    },
    {
      radius: 0.9,
      semiMajorAxis: 12,
      eccentricity: 0.1,
      color: "#FFC649", // Venus - golden yellow
      orbitalPeriod: 20,
      rotationPeriod: 1.5,
      inclination: -10,
      longitudeOfAscendingNode: 45,
      argumentOfPeriapsis: 30,
      axialTilt: 0,
      name: "Venus"
    },
    {
      radius: 0.5,
      semiMajorAxis: 5,
      eccentricity: 0.4,
      color: "#CD5C5C", // Mars - reddish
      orbitalPeriod: 8,
      rotationPeriod: 0.8,
      inclination: 25,
      longitudeOfAscendingNode: 120,
      argumentOfPeriapsis: 60,
      axialTilt: 45,
      name: "Mars"
    }
  ],
  time: {
    speed: 1,
    paused: false
  },
  render: {
    showOrbits: true,
    showTrails: false,
    trailLength: 100,
    trailFade: true,
  },
  camera: {
    mode: 'free',
    followPlanet: 0,
    preset: 'default'
  }
}

// Time system hook
function useTimeSystem() {
  const [time, setTime] = useState(0)
  const { config } = useConfig()
  
  useFrame((state, delta) => {
    if (!config.time.paused) {
      setTime(prev => prev + delta * config.time.speed)
    }
  })
  
  return { time, setTime }
}

// Camera system hook
function useCameraSystem() {
  const { config } = useConfig()
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const controlsRef = useRef<any>(null)
  
  const getCameraTarget = (time: number): [number, number, number] => {
    if (config.camera.mode === 'follow' && config.planets[config.camera.followPlanet]) {
      const planet = config.planets[config.camera.followPlanet]
      const position = calculateOrbitalPosition(
        time,
        planet.semiMajorAxis,
        planet.eccentricity,
        planet.orbitalPeriod,
        planet.inclination,
        planet.longitudeOfAscendingNode,
        planet.argumentOfPeriapsis
      )
      return [position.x, position.y, position.z]
    }
    return [0, 0, 0]
  }
  
  useFrame((state) => {
    if (cameraRef.current && controlsRef.current) {
      const target = getCameraTarget(state.clock.elapsedTime)
      controlsRef.current.target.set(...target)
      controlsRef.current.update()
    }
  })
  
  return { cameraRef, controlsRef, getCameraTarget }
}

// Calculate elliptical orbit position using orbital elements
function calculateOrbitalPosition(
  time: number,
  semiMajorAxis: number,
  eccentricity: number,
  orbitalPeriod: number,
  inclination: number,
  longitudeOfAscendingNode: number,
  argumentOfPeriapsis: number
): THREE.Vector3 {
  // Mean anomaly
  const meanAnomaly = (time / orbitalPeriod) * Math.PI * 2
  
  // Solve Kepler's equation for eccentric anomaly (simplified)
  let eccentricAnomaly = meanAnomaly
  for (let i = 0; i < 5; i++) {
    eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(eccentricAnomaly)
  }
  
  // True anomaly
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
  )
  
  // Distance from focus
  const distance = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly))
  
  // Position in orbital plane
  const x_orbital = distance * Math.cos(trueAnomaly)
  const y_orbital = distance * Math.sin(trueAnomaly)
  
  // Convert to 3D coordinates using orbital elements
  const cos_omega = Math.cos(argumentOfPeriapsis * Math.PI / 180)
  const sin_omega = Math.sin(argumentOfPeriapsis * Math.PI / 180)
  const cos_i = Math.cos(inclination * Math.PI / 180)
  const sin_i = Math.sin(inclination * Math.PI / 180)
  const cos_Omega = Math.cos(longitudeOfAscendingNode * Math.PI / 180)
  const sin_Omega = Math.sin(longitudeOfAscendingNode * Math.PI / 180)
  
  const x = (cos_omega * cos_Omega - sin_omega * sin_Omega * cos_i) * x_orbital +
           (-sin_omega * cos_Omega - cos_omega * sin_Omega * cos_i) * y_orbital
  const y = (cos_omega * sin_Omega + sin_omega * cos_Omega * cos_i) * x_orbital +
           (-sin_omega * sin_Omega + cos_omega * cos_Omega * cos_i) * y_orbital
  const z = (sin_omega * sin_i) * x_orbital + (cos_omega * sin_i) * y_orbital
  
  return new THREE.Vector3(x, y, z)
}

// Helper function to get camera position based on preset
function getCameraPosition(preset: string): [number, number, number] {
  switch (preset) {
    case 'top':
      return [0, 30, 0]
    case 'ecliptic':
      return [20, 5, 15]
    case 'side':
      return [25, 0, 0]
    default:
      return [15, 10, 15]
  }
}

// Trail component for planet paths with 60-degree rotation fading
function Trail({ 
  planetIndex,
  time = 0
}: {
  planetIndex: number
  time?: number
}) {
  const { config } = useConfig()
  const planet = config.planets[planetIndex]
  
  // Generate trail points with angular positions for fading
  const trailSegments = useMemo(() => {
    if (!config.render.showTrails) return []
    
    const segments = []
    const maxAngleDegrees = 60 // Maximum angle for fading
    const maxAngleRadians = (maxAngleDegrees * Math.PI) / 180
    const numSegments = 60 // Number of trail segments
    
    for (let i = 0; i < numSegments; i++) {
      const angleStep = maxAngleRadians / numSegments
      const trailTime = time - (i * angleStep * planet.orbitalPeriod / (Math.PI * 2))
      
      if (trailTime < 0) continue
      
      const position = calculateOrbitalPosition(
        trailTime,
        planet.semiMajorAxis,
        planet.eccentricity,
        planet.orbitalPeriod,
        planet.inclination,
        planet.longitudeOfAscendingNode,
        planet.argumentOfPeriapsis
      )
      
      // Calculate opacity based on angle (1.0 at current position, 0.0 at 60 degrees)
      const opacity = Math.max(0, 1 - (i / numSegments))
      
      segments.push({
        position,
        opacity
      })
    }
    
    return segments.reverse() // Reverse to have oldest first
  }, [time, planet, config.render.showTrails])
  
  if (!config.render.showTrails || trailSegments.length < 2) return null
  
  // Create multiple line segments with varying opacity
  return (
    <group>
      {trailSegments.map((segment, index) => {
        if (index === trailSegments.length - 1) return null // Skip last segment
        
        const nextSegment = trailSegments[index + 1]
        const avgOpacity = (segment.opacity + nextSegment.opacity) / 2
        
        return (
          <Line
            key={index}
            points={[segment.position, nextSegment.position]}
            color={planet.color}
            lineWidth={4}
            transparent
            opacity={avgOpacity * 1.0}
          />
        )
      })}
    </group>
  )
}

// Planet name tag component that always faces the user with no tilt or rotation
function PlanetNameTag({ 
  planetName,
  planetPosition,
  planetRadius
}: {
  planetName: string
  planetPosition: THREE.Vector3
  planetRadius: number
}) {
  const tagRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (tagRef.current) {
      // Position to the right of the planet (relative to camera view)
      const cameraDirection = new THREE.Vector3()
      state.camera.getWorldDirection(cameraDirection)
      
      // Calculate right direction (perpendicular to camera direction and up)
      const up = new THREE.Vector3(0, 1, 0)
      const right = new THREE.Vector3()
      right.crossVectors(cameraDirection, up).normalize()
      
      // Position tag to the right of the planet
      const offset = right.multiplyScalar(planetRadius + 1.5)
      tagRef.current.position.copy(planetPosition).add(offset)
      
      // Get camera position and tag position
      const cameraPos = state.camera.position
      const tagPos = tagRef.current.position
      
      // Calculate the horizontal direction (ignoring Y component)
      const horizontalDir = new THREE.Vector3(
        cameraPos.x - tagPos.x,
        0, // Ignore Y difference for horizontal rotation
        cameraPos.z - tagPos.z
      ).normalize()
      
      // Calculate the angle for Y rotation only
      const angle = Math.atan2(horizontalDir.x, horizontalDir.z)
      
      // Apply only Y rotation - this ensures the tag always faces the camera horizontally
      // without any tilting, and works from all angles
      tagRef.current.rotation.y = angle
      tagRef.current.rotation.x = 0
      tagRef.current.rotation.z = 0
    }
  })
  
  return (
    <group ref={tagRef}>
      {/* Transparent background box */}
      <mesh>
        <planeGeometry args={[2, 0.6]} />
        <meshBasicMaterial 
          color="#000000"
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.1, 0.7]} />
        <meshBasicMaterial 
          color="#ffffff"
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {planetName}
      </Text>
    </group>
  )
}

// Sun component with enhanced glow effect (no halo, better glow)
function Sun() {
  const { config } = useConfig()
  const meshRef = useRef<THREE.Mesh>(null)
  const coronaRef = useRef<THREE.Mesh>(null)
  const outerGlowRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle pulsing effect for the sun
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.05 + 1
      meshRef.current.scale.setScalar(pulse)
    }
    if (coronaRef.current) {
      // Dynamic corona effect
      const coronaPulse = Math.sin(state.clock.elapsedTime * 0.7) * 0.15 + 1
      coronaRef.current.scale.setScalar(coronaPulse)
    }
    if (outerGlowRef.current) {
      // Gentle outer glow pulsing
      const glowPulse = Math.sin(state.clock.elapsedTime * 0.3) * 0.08 + 1
      outerGlowRef.current.scale.setScalar(glowPulse)
    }
  })
  
  // Enhanced corona shader material
  const coronaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        sunRadius: { value: config.sun.radius },
        time: { value: 0 },
        color: { value: new THREE.Color("#FFD700") }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        uniform float time;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          
          // Add subtle vertex animation for corona effect
          vec3 animatedPosition = position + normal * sin(time * 2.0 + length(position) * 3.0) * 0.02;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(animatedPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float sunRadius;
        uniform float time;
        uniform vec3 color;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          float distance = length(vPosition);
          float normalizedDistance = (distance - sunRadius) / (sunRadius * 0.3);
          normalizedDistance = clamp(normalizedDistance, 0.0, 1.0);
          
          // Create animated corona effect
          float noise = sin(vUv.x * 20.0 + time * 3.0) * cos(vUv.y * 15.0 + time * 2.0);
          float coronaIntensity = (1.0 - normalizedDistance) * (0.8 + noise * 0.2);
          
          // Add flickering effect
          float flicker = sin(time * 5.0) * 0.1 + 0.9;
          coronaIntensity *= flicker;
          
          vec3 coronaColor = mix(color, vec3(1.0, 0.9, 0.7), coronaIntensity * 0.3);
          gl_FragColor = vec4(coronaColor, coronaIntensity * 0.6);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [config.sun.radius])
  
  // Outer glow shader material
  const outerGlowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        sunRadius: { value: config.sun.radius },
        glowRadius: { value: config.sun.radius * 2.0 },
        color: { value: new THREE.Color("#FFA500") }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float sunRadius;
        uniform float glowRadius;
        uniform vec3 color;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          float distance = length(vPosition);
          float normalizedDistance = (distance - sunRadius) / (glowRadius - sunRadius);
          normalizedDistance = clamp(normalizedDistance, 0.0, 1.0);
          
          // Soft exponential falloff
          float intensity = exp(-normalizedDistance * 3.0);
          intensity = pow(intensity, 2.0);
          
          // Color variation based on distance
          vec3 glowColor = mix(color, vec3(1.0, 0.8, 0.4), 1.0 - normalizedDistance);
          
          gl_FragColor = vec4(glowColor, intensity * 0.3);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [config.sun.radius])
  
  // Update time uniform for animation
  useFrame((state) => {
    if (coronaMaterial.uniforms.time) {
      coronaMaterial.uniforms.time.value = state.clock.elapsedTime
    }
  })
  
  return (
    <group position={[0, 0, 0]}>
      {/* Outer glow - soft, expansive */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[config.sun.radius * 2.0, 32, 32]} />
        <primitive object={outerGlowMaterial} attach="material" />
      </mesh>
      
      {/* Dynamic corona effect */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[config.sun.radius * 1.15, 64, 64]} />
        <primitive object={coronaMaterial} attach="material" />
      </mesh>
      
      {/* Main sun body - enhanced emissive properties */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[config.sun.radius, 64, 64]} />
        <meshStandardMaterial 
          color="#FDB813"
          emissive="#FFD700"
          emissiveIntensity={config.sun.emission * 1.5}
          roughness={0.05}
          metalness={0.1}
        />
      </mesh>
      
      {/* Core brightness enhancement */}
      <mesh>
        <sphereGeometry args={[config.sun.radius * 0.95, 32, 32]} />
        <meshBasicMaterial 
          color="#FFFFFF"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Enhanced lighting system */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={12} 
        color="#FFFFFF"
        distance={300}
        decay={1.0}
      />
      
      <pointLight 
        position={[0, 0, 0]} 
        intensity={4} 
        color="#FFE4B5"
        distance={200}
        decay={1.2}
      />
      
      {/* Additional directional light from sun for better illumination contrast */}
      <directionalLight 
        position={[0, 0, 0]} 
        intensity={3} 
        color="#FFFFFF"
        target-position={[10, 0, 0]}
      />
      
      {/* Sun name tag */}
      <PlanetNameTag 
        planetName="Sol"
        planetPosition={new THREE.Vector3(0, 0, 0)}
        planetRadius={config.sun.radius}
      />
    </group>
  )
}

// Planet component with realistic sun-facing lighting (simplified)
function Planet({ 
  planetIndex,
  time = 0
}: {
  planetIndex: number
  time?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { config } = useConfig()
  const planet = config.planets[planetIndex]
  
  // Calculate orbital position using elliptical orbit
  const position = useMemo(() => {
    return calculateOrbitalPosition(
      time,
      planet.semiMajorAxis,
      planet.eccentricity,
      planet.orbitalPeriod,
      planet.inclination,
      planet.longitudeOfAscendingNode,
      planet.argumentOfPeriapsis
    )
  }, [time, planet])
  
  // Calculate rotation
  const rotationAngle = (time / planet.rotationPeriod) * Math.PI * 2
  
  useFrame(() => {
    if (meshRef.current) {
      // Apply rotation around Y axis with axial tilt
      meshRef.current.rotation.y = rotationAngle
      meshRef.current.rotation.z = planet.axialTilt * (Math.PI / 180)
    }
  })
  
  return (
    <group>
      {/* Main planet body - enhanced sun illumination */}
      <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
        <sphereGeometry args={[planet.radius, 64, 64]} />
        <meshStandardMaterial 
          color={planet.color}
          roughness={0.1}  // Much lower roughness for more reflective surface
          metalness={0.3}  // Reduced metalness for less metallic appearance
          envMapIntensity={2.0}  // Increased environment map intensity
        />
      </mesh>
      
      {/* Enhanced directional lighting effect for sun illumination */}
      <mesh position={[position.x, position.y, position.z]}>
        <sphereGeometry args={[planet.radius * 1.01, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff"
          transparent
          opacity={0.2}
          roughness={0.05}
          metalness={0.1}
          side={THREE.FrontSide}
        />
      </mesh>
      
      {/* Enhanced rim lighting effect */}
      <mesh position={[position.x, position.y, position.z]}>
        <sphereGeometry args={[planet.radius * 1.02, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff"
          transparent
          opacity={0.1}
          roughness={0.1}
          metalness={0.9}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Dynamic name tag */}
      <PlanetNameTag 
        planetName={planet.name}
        planetPosition={position}
        planetRadius={planet.radius}
      />
    </group>
  )
}

// Orbit ring component for elliptical orbits - simplified single line
function OrbitRing({ 
  planetIndex
}: {
  planetIndex: number
}) {
  const { config } = useConfig()
  const planet = config.planets[planetIndex]
  
  const ringPoints = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 64
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const position = calculateOrbitalPosition(
        angle / (Math.PI * 2) * 10, // dummy time
        planet.semiMajorAxis,
        planet.eccentricity,
        10, // dummy period
        planet.inclination,
        planet.longitudeOfAscendingNode,
        planet.argumentOfPeriapsis
      )
      points.push(position)
    }
    
    return points
  }, [planet])
  
  if (!config.render.showOrbits) return null
  
  return (
    <Line
      points={ringPoints}
      color="#FFFFFF"
      lineWidth={1}
      transparent
      opacity={0.5}
    />
  )
}

// Main Solar System Scene
function SolarSystemScene() {
  const { time } = useTimeSystem()
  const { config } = useConfig()
  const { cameraRef, controlsRef } = useCameraSystem()
  
  return (
    <>
      {/* Minimal ambient light to emphasize sun illumination */}
      <ambientLight intensity={0.01} />
      
      {/* Reduced directional lights to let sun dominate */}
      <directionalLight 
        position={[15, 15, 8]} 
        intensity={0.1}  // Reduced from 0.3
        color="#ffffff"
        castShadow
      />
      
      {/* Reduced rim light */}
      <directionalLight 
        position={[-15, -15, -8]} 
        intensity={0.05}  // Reduced from 0.15
        color="#e2e8f0"
      />
      
      {/* Reduced top fill light */}
      <directionalLight 
        position={[0, 20, 0]} 
        intensity={0.03}  // Reduced from 0.1
        color="#f1f5f9"
      />
      
      {/* Sun */}
      <Sun />
      
      {/* Orbit rings, trails, and planets */}
      {config.planets.map((_, index) => (
        <group key={index}>
          <OrbitRing planetIndex={index} />
          <Trail planetIndex={index} time={time} />
          <Planet planetIndex={index} time={time} />
        </group>
      ))}
      
      {/* Enhanced space background */}
      <color attach="background" args={["#000814"]} />
      
      {/* Nebula effect */}
      <mesh>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial 
          color="#1a1a2e"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Enhanced star field */}
      <Stars 
        radius={300} 
        depth={100} 
        count={15000} 
        factor={2} 
        saturation={0.2} 
        fade 
        speed={0.5}
        size={0.5}
        sizeAttenuation={true}
      />
      
      {/* Distant galaxy effect */}
      <Stars 
        radius={400} 
        depth={200} 
        count={5000} 
        factor={8} 
        saturation={0.8} 
        fade 
        speed={0.2}
        size={1.5}
        sizeAttenuation={true}
      />
      
      {/* Camera controls */}
      <OrbitControls 
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        target={[0, 0, 0]}
      />
    </>
  )
}

// Collapsible Sidebar Control Panel Component
// Collapsible Sidebar Control Panel Component
function ControlPanel() {
  const { config, updateConfig } = useConfig()
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  return (
    <div className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-lg transition-all duration-300 z-10 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Collapse/Expand Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Controls</h2>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </Button>
      </div>
      
      {/* Control Panel Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* Time Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Time Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateConfig({ 
                    time: { ...config.time, paused: !config.time.paused }
                  })}
                >
                  {config.time.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateConfig({ 
                    time: { ...config.time, paused: true }
                  })}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  {config.time.paused ? 'Paused' : 'Running'}
                </span>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Speed: {config.time.speed.toFixed(1)}x</Label>
                <Slider
                  value={[config.time.speed]}
                  onValueChange={([value]) => updateConfig({ 
                    time: { ...config.time, speed: value }
                  })}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Camera Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Camera Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Mode */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Camera Mode</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={config.camera.mode === 'free' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateConfig({ 
                      camera: { ...config.camera, mode: 'free' }
                    })}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Free
                  </Button>
                  <Button
                    variant={config.camera.mode === 'follow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateConfig({ 
                      camera: { ...config.camera, mode: 'follow' }
                    })}
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Follow
                  </Button>
                </div>
              </div>
              
              {/* Follow Planet Selection */}
              {config.camera.mode === 'follow' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Follow Planet</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {config.planets.map((_, index) => (
                      <Button
                        key={index}
                        variant={config.camera.followPlanet === index ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateConfig({ 
                          camera: { ...config.camera, followPlanet: index }
                        })}
                      >
                        {config.planets[index].name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Camera Presets */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">View Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['default', 'top', 'ecliptic', 'side'].map((preset) => (
                    <Button
                      key={preset}
                      variant={config.camera.preset === preset ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateConfig({ 
                        camera: { ...config.camera, preset: preset as any }
                      })}
                    >
                      {preset.charAt(0).toUpperCase() + preset.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Render Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Render Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.render.showOrbits}
                  onCheckedChange={(checked) => updateConfig({ 
                    render: { ...config.render, showOrbits: checked }
                  })}
                />
                <Label className="text-sm">Show Orbits</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.render.showTrails}
                  onCheckedChange={(checked) => updateConfig({ 
                    render: { ...config.render, showTrails: checked }
                  })}
                />
                <Label className="text-sm">Show Trails</Label>
              </div>
              
              {config.render.showTrails && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Trail Length: {config.render.trailLength}</Label>
                    <Slider
                      value={[config.render.trailLength]}
                      onValueChange={([value]) => updateConfig({ 
                        render: { ...config.render, trailLength: value }
                      })}
                      min={10}
                      max={200}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.render.trailFade}
                      onCheckedChange={(checked) => updateConfig({ 
                        render: { ...config.render, trailFade: checked }
                      })}
                    />
                    <Label className="text-sm">Fade Trails</Label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Collapsed State Icon */}
      {isCollapsed && (
        <div className="flex flex-col items-center space-y-4 p-4">
          <Settings className="w-6 h-6 text-gray-600" />
        </div>
      )}
    </div>
  )
}

export default function SolarSystem() {
  const [config, setConfig] = useState<SolarSystemConfig>(defaultConfig)
  
  const updateConfig = (updates: Partial<SolarSystemConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev }
      if (updates.sun) newConfig.sun = { ...newConfig.sun, ...updates.sun }
      if (updates.planets) newConfig.planets = updates.planets
      if (updates.time) newConfig.time = { ...newConfig.time, ...updates.time }
      if (updates.render) newConfig.render = { ...newConfig.render, ...updates.render }
      if (updates.camera) newConfig.camera = { ...newConfig.camera, ...updates.camera }
      return newConfig
    })
  }
  
  return (
    <div className="w-full h-screen relative">
      <ConfigContext.Provider value={{ config, updateConfig }}>
        <Canvas
          camera={{ 
            position: getCameraPosition(config.camera.preset), 
            fov: 60,
            near: 0.1,
            far: 1000
          }}
          gl={{ 
            antialias: true,
            alpha: true
          }}
        >
          <Suspense fallback={null}>
            <SolarSystemScene />
          </Suspense>
        </Canvas>
        
        <ControlPanel />
      </ConfigContext.Provider>
    </div>
  )
}