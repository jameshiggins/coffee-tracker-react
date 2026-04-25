import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function RoasterMap({ roaster }) {
  // Only render a map when we have an actual street address. City-level
  // approximations were misleading — the location text above (state + country)
  // already conveys "where" without pretending to a precision we don't have.
  if (!roaster.street_address || roaster.latitude == null || roaster.longitude == null) {
    return null;
  }
  const pos = [roaster.latitude, roaster.longitude];
  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-amber-100">
      <MapContainer center={pos} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={pos} icon={icon}>
          <Popup>
            <strong>{roaster.name}</strong>
            <br />
            {roaster.street_address}, {roaster.city}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
