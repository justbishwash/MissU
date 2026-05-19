// Haversine formula for calculating distance between two coordinates
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Get emotional message based on distance
export function getDistanceMessage(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return { emoji: '💫', message: 'Location hidden, but hearts connected', state: 'unknown' };
  }
  
  if (distanceKm < 0.5) {
    return { emoji: '📍', message: `Only ${Math.round(distanceKm * 1000)} meters away ❤️`, state: 'very-close' };
  }
  if (distanceKm < 5) {
    return { emoji: '🏠', message: 'Your person is nearby', state: 'nearby' };
  }
  if (distanceKm < 50) {
    return { emoji: '❤️', message: 'Same city tonight', state: 'medium' };
  }
  if (distanceKm < 200) {
    return { emoji: '🌍', message: `${Math.round(distanceKm)} km apart, still connected`, state: 'far' };
  }
  return { emoji: '🌍', message: `${Math.round(distanceKm)} km apart, still connected`, state: 'very-far' };
}

// Get background style based on distance state
export function getDistanceTheme(state) {
  const themes = {
    'very-close': {
      gradient: 'from-pink-400 via-rose-300 to-pink-200',
      heartIntensity: 'high',
      glow: true,
    },
    'nearby': {
      gradient: 'from-pink-300 via-purple-200 to-rose-200',
      heartIntensity: 'medium',
      glow: true,
    },
    'medium': {
      gradient: 'from-purple-300 via-pink-200 to-indigo-200',
      heartIntensity: 'medium',
      glow: false,
    },
    'far': {
      gradient: 'from-indigo-300 via-purple-300 to-pink-200',
      heartIntensity: 'low',
      glow: false,
    },
    'very-far': {
      gradient: 'from-indigo-400 via-purple-400 to-pink-300',
      heartIntensity: 'low',
      glow: false,
    },
    'unknown': {
      gradient: 'from-pink-200 via-purple-200 to-rose-200',
      heartIntensity: 'low',
      glow: false,
    },
  };
  
  return themes[state] || themes.unknown;
}
