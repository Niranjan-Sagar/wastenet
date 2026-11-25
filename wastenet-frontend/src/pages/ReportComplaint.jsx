import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import api from '../api';

const CATEGORIES = [
  'overflowing bin',
  'illegal dumping',
  'plastic waste',
  'e-waste',
  'hazardous',
  'other',
];

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function MoveMap({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) map.flyTo(center, 16);
  }, [center, map]);

  return null;
}

export default function ReportComplaint() {
  const [photo, setPhoto] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionNote, setCompressionNote] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const geocodeTimerRef = useRef(null);
  const navigate = useNavigate();

  // Reverse geocode when position changes (debounced 1 second)
  useEffect(() => {
    if (!position) return;

    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);

    geocodeTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`,
          { headers: { 'User-Agent': 'WasteNet/1.0' } }
        );
        const data = await res.json();
        setAddress(data.display_name || '');
      } catch {
        setAddress('');
      }
    }, 1000);

    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    };
  }, [position]);

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      setCompressing(true);
      setCompressionNote('Compressing image...');
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        setPhoto(compressed);
        setCompressionNote(
          `Compressed: ${(file.size / 1024 / 1024).toFixed(1)} MB → ${(compressed.size / 1024 / 1024).toFixed(2)} MB`
        );
      } catch {
        setPhoto(file);
        setCompressionNote('');
      } finally {
        setCompressing(false);
      }
    } else {
      setPhoto(file);
      setCompressionNote('');
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error('Your browser does not support geolocation');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = [pos.coords.latitude, pos.coords.longitude];
        setPosition(here);
        setCenter(here);
      },
      () => toast.error('Could not get your location. Click on the map instead.')
    );
  }

  function validate() {
    const newErrors = {};
    if (!photo) newErrors.photo = 'Please add a photo';
    if (!description.trim()) newErrors.description = 'Please enter a description';
    if (!category) newErrors.category = 'Please select a category';
    if (!position) newErrors.position = 'Please pick the location on the map';
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('priority', priority);
    formData.append('lat', position[0]);
    formData.append('lng', position[1]);
    formData.append('address', address);

    try {
      setLoading(true);
      await api.post('/api/complaints', formData);
      toast.success('Complaint submitted successfully!');
      navigate('/my-complaints');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4">Report Waste</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Photo */}
        <div>
          <label className="block text-sm font-medium mb-1">Photo *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={compressing}
            className="block w-full text-sm text-gray-500 dark:text-gray-400"
          />
          {compressing && (
            <p className="text-xs text-blue-600 mt-1 animate-pulse">Compressing image...</p>
          )}
          {compressionNote && !compressing && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">{compressionNote}</p>
          )}
          {photo && !compressing && (
            <img
              src={URL.createObjectURL(photo)}
              alt="preview"
              className="mt-2 h-40 rounded object-cover w-full"
            />
          )}
          {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="border dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 dark:text-gray-100"
            rows="3"
            placeholder="What is the problem? e.g. garbage overflowing near the bus stop"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Location */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Location *</label>
            <button
              type="button"
              onClick={useMyLocation}
              className="text-sm text-green-700 dark:text-green-400 underline"
            >
              Use my current location
            </button>
          </div>

          <MapContainer center={[18.5204, 73.8567]} zoom={12} className="h-72 w-full rounded">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker position={position} setPosition={setPosition} />
            <MoveMap center={center} />
          </MapContainer>

          {position && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              📍 {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </p>
          )}
          {address && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">{address}</p>
          )}
          {!position && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Click on the map to select the location
            </p>
          )}
          {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
        </div>

        <button
          disabled={loading || compressing}
          className="bg-green-700 text-white p-3 rounded font-medium disabled:opacity-60 hover:bg-green-600 transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
}
