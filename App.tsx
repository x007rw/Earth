import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Loader } from '@react-three/drei';
import Earth from './components/Earth';
import Interface from './components/Interface';
import { EarthConfig, DEFAULT_CONFIG } from './types';
import * as THREE from 'three';

const App: React.FC = () => {
  const [config, setConfig] = useState<EarthConfig>(DEFAULT_CONFIG);

  // Real-time sun positioning logic
  useEffect(() => {
    if (!config.isRealTime) return;

    const updateSunPosition = () => {
      const now = new Date();
      const hours = now.getUTCHours();
      const minutes = now.getUTCMinutes();
      
      // Basic approximation:
      // 12:00 UTC = Sun at Prime Meridian.
      // Earth rotates 360 degrees in 24 hours.
      // We are rotating the Earth mesh continuously in the Earth component, 
      // but usually for these visualizations, "Sun Position" is relative to the texture's starting point.
      // If the texture starts at 0 longitude, and we want the sun to be correct:
      // Angle = (UTC_Hours - 12) / 24 * 2PI.
      // We need to offset by PI because at 0 angle in Three.js (depending on setup), light might be at +Z.
      
      const decimalHours = hours + minutes / 60;
      // Calculate angle. 12 UTC = 0 angle (Front). 
      // 0 UTC = Back.
      const angle = ((decimalHours - 12) / 24) * Math.PI * 2;
      
      setConfig(prev => ({
        ...prev,
        sunPosition: angle + Math.PI // Add offset if needed to match texture orientation
      }));
    };

    updateSunPosition();
    const interval = setInterval(updateSunPosition, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [config.isRealTime]);

  // Calculate sun position based on config.sunPosition (0-2PI)
  const sunDistance = 15;
  const sunX = Math.sin(config.sunPosition) * sunDistance;
  const sunZ = Math.cos(config.sunPosition) * sunDistance;
  
  // Lighting Intensity Logic
  // High Contrast = Realistic Space (Dark shadows, bright sun)
  // Low Contrast (Globe Mode) = Bright Ambient, Softer Sun
  const ambientIntensity = config.highContrast ? 0.02 : 2.5; 
  const directionalIntensity = config.highContrast ? 2.5 : 0.5;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 35 }}
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping, 
          toneMappingExposure: 1.0,
          pixelRatio: window.devicePixelRatio 
        }}
      >
        {/* Dynamic Lighting System */}
        <ambientLight intensity={ambientIntensity} color="#ffffff" />
        
        {/* Main Sun Light */}
        <directionalLight 
            position={[sunX, 0, sunZ]} 
            intensity={directionalIntensity} 
            color="#fffff0" 
        />

        {/* Backlighting for "Cinematic" Realism (only in high contrast) */}
        {config.highContrast && (
            <spotLight 
            position={[-10, 5, -10]} 
            intensity={0.8} 
            color="#4d88ff" 
            angle={0.5} 
            penumbra={1}
            />
        )}
        
        {/* Space Background */}
        <Stars 
            radius={300} 
            depth={60} 
            count={8000} 
            factor={4} 
            saturation={0} 
            fade 
            speed={0.2} 
        />
        <color attach="background" args={['#000000']} /> 

        {/* The Earth */}
        <Suspense fallback={null}>
          <Earth config={config} />
        </Suspense>

        {/* Controls */}
        <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minDistance={3.5} 
            maxDistance={20}
            zoomSpeed={0.5}
            rotateSpeed={0.4}
            autoRotate={!config.realTimeSpin}
            autoRotateSpeed={config.rotationSpeed}
            dampingFactor={0.05}
            enableDamping={true}
        />
      </Canvas>

      <Loader 
        containerStyles={{ background: '#000' }}
        innerStyles={{ background: 'rgba(255,255,255,0.1)', width: '200px', height: '2px' }}
        barStyles={{ background: '#22d3ee', height: '2px' }} 
        dataStyles={{ color: '#22d3ee', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em' }}
      />

      <Interface config={config} setConfig={setConfig} />

    </div>
  );
};

export default App;