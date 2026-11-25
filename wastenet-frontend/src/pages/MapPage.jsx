import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../api';

export default function MapPage() {
  const [facilities, setFacilities] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/facilities')
      .then((res) => setFacilities(res.data))
      .catch(() => setError('Could not load facilities. Is the backend running?'));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Recycling Map</h1>
      <p className="text-gray-600 mb-4 text-sm">
        Find recycling centres, scrap shops and waste-to-energy plants near you.
      </p>

      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</p>}

      <MapContainer center={[18.5204, 73.8567]} zoom={12} className="h-[70vh] w-full rounded shadow">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {facilities.map((f) => (
          <Marker key={f._id} position={[f.lat, f.lng]}>
            <Popup>
              <b>{f.name}</b>
              <br />
              {f.type}
              <br />
              {f.contact && <span>Contact: {f.contact}</span>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
