/**
 * Environment configuration utilities
 */

export const env = {
  // TMAP API configuration
  TMAP_API_KEY: process.env.NEXT_PUBLIC_TMAP_API_KEY,
  
  // App configuration
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Shelter Spot Guide',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Map configuration
  MAP_CENTER_LAT: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '37.56520450'),
  MAP_CENTER_LNG: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '126.98702028'),
  MAP_DEFAULT_ZOOM: parseInt(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM || '16', 10),
};

/**
 * Validates that all required environment variables are present
 * @returns Array of missing environment variable names
 */
export function validateEnvironment(): string[] {
  const missing: string[] = [];
  
  if (!env.TMAP_API_KEY) {
    missing.push('NEXT_PUBLIC_TMAP_API_KEY');
  }
  
  return missing;
}

/**
 * Logs environment validation results
 */
export function logEnvironmentStatus(): void {
  const missing = validateEnvironment();
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
  } else {
    console.log('All required environment variables are present');
  }
  
  console.log('Environment configuration:', {
    APP_NAME: env.APP_NAME,
    APP_VERSION: env.APP_VERSION,
    MAP_CENTER: `${env.MAP_CENTER_LAT}, ${env.MAP_CENTER_LNG}`,
    MAP_ZOOM: env.MAP_DEFAULT_ZOOM,
    TMAP_API_CONFIGURED: !!env.TMAP_API_KEY
  });
}