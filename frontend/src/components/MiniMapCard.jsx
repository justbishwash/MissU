import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '../hooks/useGeolocation';
import { useCoupleStore } from '../store/useCoupleStore';
import { useAuthStore } from '../store/useAuthStore';

// Custom heart marker
function makeHeartIcon(color = '#ff6b9d') {
  return L.divIcon({
    className: 'custom-heart-marker',
    html: `<div style="
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
      font-size: 28px;
      transform: translate(-50%, -100%);
    ">${color === '#ff6b9d' ? '❤️' : '💜'}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

export default function MiniMapCard() {
  const { position } = useGeolocation();
  const { partner } = useCoupleStore();
  const { profile } = useAuthStore();
  const [center, setCenter] = useState(null);

  useEffect(() => {
    if (position && partner?.latitude && partner?.longitude) {
      // Center between both
      setCenter([
        (position.latitude + partner.latitude) / 2,
        (position.longitude + partner.longitude) / 2,
      ]);
    } else if (position) {
      setCenter([position.latitude, position.longitude]);
    } else if (partner?.latitude) {
      setCenter([partner.latitude, partner.longitude]);
    }
  }, [position, partner]);

  if (!center) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 text-center"
      >
        <p className="text-white/60 text-sm">📍 Enable location to see your map</p>
      </motion.div>
    );
  }

  const youHere = position
    ? [position.latitude, position.longitude]
    : null;
  const partnerHere = partner?.latitude
    ? [partner.latitude, partner.longitude]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-3 overflow-hidden"
    >
      <div className="flex items-center justify-between px-2 mb-2">
        <p className="text-white/80 text-xs font-medium">🗺️ Your love map</p>
        <span className="text-white/40 text-[10px]">tap to interact</span>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ height: 180 }}>
        <MapContainer
          center={center}
          zoom={youHere && partnerHere ? 5 : 12}
          style={{ height: '100%', width: '100%', filter: 'saturate(0.85) brightness(1.05)' }}
          zoomControl={false}
          attributionControl={false}
          dragging
          touchZoom
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            crossOrigin="anonymous"
          />
          {youHere && (
            <Marker position={youHere} icon={makeHeartIcon('#ff6b9d')}>
              <Popup>{profile?.nickname || 'You'} ❤️</Popup>
            </Marker>
          )}
          {partnerHere && (
            <Marker position={partnerHere} icon={makeHeartIcon('#a855f7')}>
              <Popup>{partner?.nickname || 'Your person'} 💜</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </motion.div>
  );
}
