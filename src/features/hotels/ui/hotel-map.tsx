'use client';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { HotelLocation } from '../domain/types';

const markerIcon = L.icon({
  iconUrl: '/images/map/marker-icon.png',
  iconRetinaUrl: '/images/map/marker-icon-2x.png',
  shadowUrl: '/images/map/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function HotelMap({ name, location }: { name: string; location: HotelLocation }) {
  return (
    <div className="hotel-map" aria-label={`موقعیت نمایشی ${name}`}>
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={13}
        scrollWheelZoom={false}
        className="hotel-map-canvas"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[location.latitude, location.longitude]} icon={markerIcon}>
          <Popup>
            موقعیت نمایشی {name}
            <br />
            این نقطه برای نمایش ساخته شده و نشانی واقعی نیست.
          </Popup>
        </Marker>
      </MapContainer>
      <p className="map-note">موقعیت روی نقشه نمایشی است و نشانی واقعی اقامتگاه را نشان نمی‌دهد.</p>
    </div>
  );
}
