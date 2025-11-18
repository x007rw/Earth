import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, BackSide, AdditiveBlending, Mesh, ShaderMaterial, Color, Vector3 } from 'three';
import { EarthConfig } from '../types';
import * as THREE from 'three';

const TEXTURES = {
  map: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
  specular: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
  clouds: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
  normal: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'
};

interface EarthProps {
  config: EarthConfig;
}

const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    uniform float intensity;
    uniform vec3 glowColor;
    
    void main() {
      // Fresnel effect for atmosphere
      float intensityFactor = pow(0.75 - dot(vNormal, vec3(0, 0, 1.0)), 3.5);
      gl_FragColor = vec4(glowColor, 1.0) * intensityFactor * intensity;
    }
  `
};

const Earth: React.FC<EarthProps> = ({ config }) => {
  const earthRef = useRef<Mesh>(null);
  const cloudsRef = useRef<Mesh>(null);
  
  const [colorMap, specularMap, cloudsMap, normalMap] = useLoader(TextureLoader, [
    TEXTURES.map,
    TEXTURES.specular,
    TEXTURES.clouds,
    TEXTURES.normal
  ]);

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();

    if (config.realTimeSpin) {
        // Real-time Earth Rotation Logic
        // The Earth rotates 360 degrees (2PI radians) in ~24 hours (86400 seconds).
        // We align 12:00 UTC to be rotation 0 (Facing Z+, assuming Sun is at Z+ by default for noon).
        // 00:00 UTC = Opposite side.
        
        const now = new Date();
        const secondsInDay = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + now.getUTCMilliseconds() / 1000;
        
        // At 12:00 UTC (43200s), we want Rotation Y = 0.
        // Formula: ((Time - 12h) / 24h) * 2PI
        // This rotates the earth so the correct longitude faces the fixed Z axis.
        const rotationOffset = -Math.PI; // Align texture so Greenwich is at 0 rads? 
        // Actually, standard Earth texture has Greenwich at UV 0.5? 
        // Let's assume standard equirectangular: Greenwich is center.
        // We want Greenwich facing Camera (Z+) at 12:00 UTC if Camera is at Z+.
        
        // Calculate angle
        const dayFraction = secondsInDay / 86400;
        const angle = (dayFraction * Math.PI * 2) - Math.PI; 

        if (earthRef.current) {
            earthRef.current.rotation.y = angle;
        }
        if (cloudsRef.current) {
            earthRef.current.rotation.y = angle;
            // Clouds drift slightly? In real-time mode, clouds are static relative to ground 
            // unless we add a separate real-time wind simulation which is too slow to notice.
            // So we keep them synced to earth rotation.
            cloudsRef.current.rotation.y = angle;
        }
    } else {
        // Artistic Auto-Rotation
        if (earthRef.current) {
            earthRef.current.rotation.y = elapsedTime * config.rotationSpeed * 0.2;
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = elapsedTime * config.rotationSpeed * 0.22;
        }
    }
  });

  const atmosphereMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: AtmosphereShader.vertexShader,
      fragmentShader: AtmosphereShader.fragmentShader,
      blending: AdditiveBlending,
      side: BackSide,
      transparent: true,
      uniforms: {
        glowColor: { value: new Color(0x44aaff) }, // Lighter, more realistic blue
        intensity: { value: config.atmosphereGlow }
      }
    });
  }, [config.atmosphereGlow]);

  return (
    <group rotation={[0, 0, 0.401]} > {/* 23.5 degree tilt */}
      {/* Base Earth Sphere */}
      <mesh ref={earthRef}>
        {/* Increased geometry resolution for smoothness */}
        <sphereGeometry args={[2, 256, 256]} /> 
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughness={0.75} 
          metalness={0.0}
          envMapIntensity={0.1}
        />
      </mesh>

      {/* Cloud Layer */}
      {config.showClouds && (
        <mesh ref={cloudsRef} scale={[1.015, 1.015, 1.015]}>
          <sphereGeometry args={[2, 256, 256]} />
          <meshStandardMaterial
            map={cloudsMap}
            transparent={true}
            opacity={config.cloudsOpacity}
            blending={AdditiveBlending}
            depthWrite={false}
            roughness={1.0}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Atmosphere Glow (Outer) */}
      {config.showAtmosphere && (
        <mesh scale={[1.15, 1.15, 1.15]}>
          <sphereGeometry args={[2, 64, 64]} />
          <primitive object={atmosphereMaterial} attach="material" />
        </mesh>
      )}
    </group>
  );
};

export default Earth;