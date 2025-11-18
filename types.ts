export enum ChatRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
}

export interface EarthConfig {
  rotationSpeed: number;
  cloudsOpacity: number;
  atmosphereGlow: number;
  showClouds: boolean;
  showAtmosphere: boolean;
  sunPosition: number; // 0 to Math.PI * 2
  highContrast: boolean; // Shadow/Lighting mode
  isRealTime: boolean; // Sync Sun Position with real time
  realTimeSpin: boolean; // Sync Earth Rotation with real time
}

export const DEFAULT_CONFIG: EarthConfig = {
  rotationSpeed: 0.1, // Slower by default for grandeur
  cloudsOpacity: 1.0,
  atmosphereGlow: 1.0,
  showClouds: true,
  showAtmosphere: true,
  sunPosition: 4.5, // Artistic default angle
  highContrast: true, // True = Realistic shadows, False = Ambient lit
  isRealTime: false,
  realTimeSpin: false
};