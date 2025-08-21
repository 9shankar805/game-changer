/**
 * Enhanced location utilities with better error handling and fallback options
 */

export interface LocationResult {
  success: boolean;
  location?: { latitude: number; longitude: number };
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * Get user location with enhanced error handling and fallback options
 */
export async function getUserLocationWithFallback(): Promise<LocationResult> {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    return {
      success: false,
      error: "Geolocation is not supported by this browser. Please enter your address manually."
    };
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: false, // Use less accurate but faster location
        timeout: 8000, // Reduced timeout
        maximumAge: 300000 // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

    return {
      success: true,
      location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
    };
  } catch (error: any) {
    let errorMessage = "Unable to get your location. ";
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage += "Location access was denied. Please enable location permissions in your browser settings or enter your address manually.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage += "Location information is unavailable. Please enter your address manually.";
        break;
      case error.TIMEOUT:
        errorMessage += "Location request timed out. Please try again or enter your address manually.";
        break;
      default:
        errorMessage += "Please enter your address manually.";
        break;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Request location permission with user-friendly prompts
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!navigator.geolocation) {
    return false;
  }

  try {
    // Check current permission status
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'granted') {
        return true;
      }
      
      if (permission.state === 'denied') {
        return false;
      }
    }

    // Try to get location to trigger permission prompt
    await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000
      });
    });

    return true;
  } catch {
    return false;
  }
}