import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';

// Fix for default marker icon in Leaflet using CDN urls
const ICON_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: ICON_URL,
    shadowUrl: SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  initialPos?: { lat: number; lng: number };
  onSelect: (pos: { lat: number; lng: number }) => void;
}

function LocationMarker({ pos, setPos, onSelect }: { pos: [number, number], setPos: (p: [number, number]) => void, onSelect: (p: { lat: number; lng: number }) => void }) {
  const map = useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return pos ? <Marker position={pos} /> : null;
}

const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const MapPicker: React.FC<MapPickerProps> = ({ initialPos, onSelect }) => {
  const [position, setPosition] = useState<[number, number]>(
    initialPos ? [initialPos.lat, initialPos.lng] : [13.7563, 100.5018] // Bangkok default
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // 1. Check if the query is actual coordinates (lat, lng)
      const coordMatch = searchQuery.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          const newPos: [number, number] = [lat, lng];
          setPosition(newPos);
          onSelect({ lat, lng });
          setIsSearching(false);
          return;
        }
      }

      // 2. Otherwise search via Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'th,en-US;q=0.9,en;q=0.8'
          }
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        onSelect({ lat: newPos[0], lng: newPos[1] });
      } else {
        alert("ไม่พบสถานที่ที่ระบุ กรุณาลองตรวจสอบชื่อสถานที่อีกครั้ง");
      }
    } catch (err) {
      console.error("Search failed:", err);
      alert("เกิดข้อผิดพลาดในการค้นหา โปรดตรวจสอบอินเทอร์เน็ตของคุณ");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          onSelect({ lat: newPos[0], lng: newPos[1] });
          setIsLocating(false);
        },
        (err) => {
          console.error("Location access failed:", err);
          setIsLocating(false);
          alert("ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ โปรดตรวจสอบการอนุญาตสิทธิ์");
        }
      );
    } else {
      alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
      setIsLocating(false);
    }
  };

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-border relative flex flex-col group">
      {/* Search Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text"
              placeholder="ค้นหาสถานที่หรือที่อยู่..."
              className="w-full pl-10 pr-4 py-2 bg-white/95 backdrop-blur-md border border-border rounded-xl shadow-lg outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
            />
          </div>
          <button 
            type="button" 
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="bg-primary text-white p-2 rounded-xl shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </button>
        </div>
        
        <button 
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="bg-white text-primary p-2 rounded-xl shadow-lg border border-border hover:bg-bg transition-colors disabled:opacity-50"
          title="ตำแหน่งปัจจุบันของคุณ"
        >
          {isLocating ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
        </button>
      </div>

      <div className="flex-1 relative">
        <MapContainer 
          center={position} 
          zoom={15} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker pos={position} setPos={setPosition} onSelect={onSelect} />
          <ChangeView center={position} />
        </MapContainer>
      </div>
      
      <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border shadow-sm pointer-events-none">
        <p className="text-[10px] font-bold text-primary flex items-center gap-1">
          <MapPin size={10} /> กดบนแผนที่เพื่อปรับตำแหน่งที่ชัดเจน
        </p>
      </div>
    </div>
  );
};
