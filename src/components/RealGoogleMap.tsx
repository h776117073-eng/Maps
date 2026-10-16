import React, { useState, useEffect, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { 
  Search, 
  Compass, 
  ChevronRight, 
  RotateCcw, 
  Crosshair, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Navigation, 
  Layers, 
  Eye,
  Star,
  ExternalLink,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { IbbPlace, CATEGORIES } from '../data/ibbData';

interface RealGoogleMapProps {
  places: IbbPlace[];
  selectedPlace: IbbPlace | null;
  onSelectPlace: (place: IbbPlace | null) => void;
  activeCategoryFilter: string | null;
}

const IBB_PRESETS = [
  { name: 'إب - المركز العام', lat: 13.9787, lng: 44.1812, zoom: 14 },
  { name: 'المدينة القديمة وباب الكبير', lat: 13.9725, lng: 44.1835, zoom: 16 },
  { name: 'شارع العدين التجاري', lat: 13.9805, lng: 44.1755, zoom: 16 },
  { name: 'حي الظهار والمجمع الحكومي', lat: 13.9685, lng: 44.1725, zoom: 16 },
  { name: 'شلال ووادي المشنة', lat: 13.9695, lng: 44.1885, zoom: 16 },
  { name: 'قمة جبل بعدان والمطلات', lat: 13.9845, lng: 44.2025, zoom: 15 },
  { name: 'نقيل ومنتزه مشورة الغربي', lat: 13.9818, lng: 44.1352, zoom: 15 },
  { name: 'جامعة إب ومجمع المعاين', lat: 13.9920, lng: 44.1630, zoom: 16 },
  { name: 'مفرق جبلة ومثلث تعز', lat: 13.9510, lng: 44.1700, zoom: 15 },
  { name: 'وادي السحول الخصيب', lat: 14.0200, lng: 44.1780, zoom: 14 }
];

// Inner Controller component that has access to the Map instance
const MapController: React.FC<{
  selectedPlace: IbbPlace | null;
  targetPreset: typeof IBB_PRESETS[0] | null;
  resetTrigger: number;
  onPanComplete?: () => void;
}> = ({ selectedPlace, targetPreset, resetTrigger }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedPlace) {
      map.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
      map.setZoom(16);
    }
  }, [map, selectedPlace]);

  useEffect(() => {
    if (!map || !targetPreset) return;
    map.panTo({ lat: targetPreset.lat, lng: targetPreset.lng });
    map.setZoom(targetPreset.zoom);
  }, [map, targetPreset]);

  useEffect(() => {
    if (!map || resetTrigger === 0) return;
    map.panTo({ lat: 13.9787, lng: 44.1812 });
    map.setZoom(14);
  }, [map, resetTrigger]);

  return null;
};

export const RealGoogleMap: React.FC<RealGoogleMapProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  activeCategoryFilter
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBTxoTz-kP0VOHQO6G9hk38-FHXc_wTcXw';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(activeCategoryFilter || 'all');
  const [showPresets, setShowPresets] = useState(false);
  const [targetPreset, setTargetPreset] = useState<typeof IBB_PRESETS[0] | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [activeInfoWindow, setActiveInfoWindow] = useState<IbbPlace | null>(selectedPlace);

  // Sync internal info window with selected place
  useEffect(() => {
    if (selectedPlace) {
      setActiveInfoWindow(selectedPlace);
    }
  }, [selectedPlace]);

  // Filtered places on map
  const filteredPlaces = places.filter(place => {
    const matchCat = categoryFilter === 'all' || place.category === categoryFilter;
    const matchQuery = !searchQuery || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.subcategory.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'health': return '#f43f5e';
      case 'education': return '#3b82f6';
      case 'landmarks': return '#10b981';
      case 'markets': return '#f59e0b';
      case 'restaurants': return '#f97316';
      case 'hotels': return '#a855f7';
      case 'government': return '#06b6d4';
      case 'banking': return '#eab308';
      case 'transport': return '#6366f1';
      case 'religious': return '#14b8a6';
      default: return '#10b981';
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setTargetPreset({
            name: 'موقعي الحالي',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            zoom: 16
          });
        },
        () => {
          setResetTrigger(prev => prev + 1);
        }
      );
    }
  };

  return (
    <div className="relative w-full h-[640px] lg:h-[740px] rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
      <APIProvider apiKey={apiKey} language="ar" region="YE">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: 13.9787, lng: 44.1812 }}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={true}
          streetViewControl={true}
          fullscreenControl={true}
          zoomControl={true}
          renderingType="VECTOR"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          {/* Inner Camera Pan Controller */}
          <MapController
            selectedPlace={selectedPlace}
            targetPreset={targetPreset}
            resetTrigger={resetTrigger}
          />

          {/* Advanced Markers on Real Google Map */}
          {filteredPlaces.map(place => {
            const isSelected = (selectedPlace?.id === place.id) || (activeInfoWindow?.id === place.id);
            const color = getCategoryColor(place.category);

            return (
              <AdvancedMarker
                key={place.id}
                position={{ lat: place.lat, lng: place.lng }}
                title={place.name}
                onClick={() => {
                  onSelectPlace(place);
                  setActiveInfoWindow(place);
                }}
              >
                <div className={`relative flex items-center justify-center transition-transform duration-200 cursor-pointer ${isSelected ? 'scale-125 z-30' : 'hover:scale-115'}`}>
                  {isSelected && (
                    <div className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-75"></div>
                  )}
                  <Pin
                    background={color}
                    borderColor="#ffffff"
                    glyphColor="#ffffff"
                    scale={isSelected ? 1.25 : 1.0}
                  />
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Real Google Maps InfoWindow */}
          {activeInfoWindow && (
            <InfoWindow
              position={{ lat: activeInfoWindow.lat, lng: activeInfoWindow.lng }}
              onCloseClick={() => {
                setActiveInfoWindow(null);
                onSelectPlace(null);
              }}
              pixelOffset={[0, -35]}
              headerContent={
                <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5 pr-1">
                  <span>{activeInfoWindow.name}</span>
                </div>
              }
            >
              <div className="p-1 max-w-xs text-xs text-slate-800 space-y-2 font-['Cairo',sans-serif]" dir="rtl">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span>{activeInfoWindow.categoryLabel}</span>
                  <span>&bull;</span>
                  <span>{activeInfoWindow.district}</span>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {activeInfoWindow.description}
                </p>

                <div className="space-y-1 text-[11px] text-slate-700 bg-slate-100 p-2 rounded-lg">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{activeInfoWindow.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>{activeInfoWindow.hours}</span>
                  </div>
                  {activeInfoWindow.phone && activeInfoWindow.phone !== 'لا يوجد' && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                      <a href={`tel:${activeInfoWindow.phone}`} className="font-mono font-bold hover:underline">
                        {activeInfoWindow.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {activeInfoWindow.phone && activeInfoWindow.phone !== 'لا يوجد' && (
                    <a
                      href={`tel:${activeInfoWindow.phone}`}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-center font-bold text-[11px] flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>اتصال</span>
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeInfoWindow.lat},${activeInfoWindow.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-center font-semibold text-[11px] flex items-center justify-center gap-1"
                  >
                    <Navigation className="w-3 h-3 text-blue-600" />
                    <span>الاتجاهات</span>
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 right-4 left-4 z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pointer-events-none">
        {/* Search Input */}
        <div className="pointer-events-auto flex items-center bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-2.5 shadow-2xl w-full md:w-80">
          <Search className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في خريطة إب الحقيقية..."
            className="bg-transparent border-none text-xs md:text-sm text-slate-100 placeholder-slate-400 focus:outline-none w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-white px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Controls & Fast Camera Presets */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Preset Camera Jumps Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/95 hover:bg-slate-800 text-xs font-bold text-emerald-400 border border-emerald-500/40 rounded-xl shadow-xl backdrop-blur-md transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>معالم وسحب إب</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showPresets ? 'rotate-90' : ''}`} />
            </button>

            {showPresets && (
              <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800 mb-1">
                  انتقال سريع في خريطة جوجل لمدينة إب:
                </div>
                {IBB_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTargetPreset(preset);
                      setShowPresets(false);
                    }}
                    className="w-full text-right px-3 py-2 text-xs text-slate-200 hover:bg-emerald-950/40 hover:text-emerald-300 flex items-center justify-between transition-colors"
                  >
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Zoom {preset.zoom}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset View */}
          <button
            onClick={() => setResetTrigger(prev => prev + 1)}
            title="إعادة التمركز على إب"
            className="p-2 bg-slate-900/95 hover:bg-slate-800 text-emerald-400 border border-slate-700 rounded-xl shadow-xl backdrop-blur-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Locate Me */}
          <button
            onClick={handleLocateMe}
            title="موقعي الحالي"
            className="p-2 bg-slate-900/95 hover:bg-slate-800 text-blue-400 border border-slate-700 rounded-xl shadow-xl backdrop-blur-md transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Pills Bar along top-bottom */}
      <div className="absolute top-20 right-4 left-4 z-20 pointer-events-none overflow-x-auto pb-1 flex gap-1.5 no-scrollbar">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`pointer-events-auto shrink-0 px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-md shadow transition-all ${
            categoryFilter === 'all'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
          }`}
        >
          الكل ({places.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = places.filter(p => p.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`pointer-events-auto shrink-0 px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-md shadow transition-all ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              {cat.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Official Google Maps Verification Badge at bottom left */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-2xl text-[11px] text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-semibold text-white">Google Maps Platform الحقيقية</span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-400 font-bold">{filteredPlaces.length} موقع موثق</span>
      </div>
    </div>
  );
};
