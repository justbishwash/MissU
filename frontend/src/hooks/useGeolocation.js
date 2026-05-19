import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { updateLocation } = useAuthStore();
  const { locationSharing, approximateMode } = useSettingsStore();

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    if (!locationSharing) {
      setPosition(null);
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;

        // If approximate mode, round to ~1km precision
        if (approximateMode) {
          lat = Math.round(lat * 100) / 100;
          lon = Math.round(lon * 100) / 100;
        }

        setPosition({ latitude: lat, longitude: lon });
        updateLocation(lat, lon);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: !approximateMode,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [locationSharing, approximateMode, updateLocation]);

  useEffect(() => {
    requestLocation();
    
    // Update every 5 minutes
    const interval = setInterval(requestLocation, 300000);
    return () => clearInterval(interval);
  }, [requestLocation]);

  return { position, error, loading, requestLocation };
}
