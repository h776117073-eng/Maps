import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Maximize2, 
  RotateCcw, 
  Layers, 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Compass, 
  Search,
  Crosshair,
  Ruler,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';
import { IbbPlace, CATEGORIES, IBB_PLACES, CategoryMeta } from '../data/ibbData';

interface InteractiveMapProps {
  places: IbbPlace[];
  selectedPlace: IbbPlace | null;
  onSelectPlace: (place: IbbPlace | null) => void;
  activeCategoryFilter: string | null;
}

// Map camera fast travel locations in Ibb
const IBB_PRESETS = [
  { name: 'إب - المركز العام', lat: 13.9787, lng: 44.1812, zoom: 14 },
  { name: 'المدينة القديمة والجامع الكبير', lat: 13.9725, lng: 44.1835, zoom: 16 },
  { name: 'شارع العدين التجاري', lat: 13.9805, lng: 44.1755, zoom: 16 },
  { name: 'حي الظهار والمجمع الحكومي', lat: 13.9685, lng: 44.1725, zoom: 16 },
  { name: 'شلال ووادي المشنة', lat: 13.9695, lng: 44.1885, zoom: 16 },
  { name: 'قمة جبل بعدان والمطلات', lat: 13.9845, lng: 44.2025, zoom: 15 },
  { name: 'نقيل ومنتزه مشورة', lat: 13.9818, lng: 44.1352, zoom: 15 },
  { name: 'جامعة إب ومجمع المعاين', lat: 13.9920, lng: 44.1630, zoom: 16 },
  { name: 'مفرق جبلة ومثلث تعز', lat: 13.9510, lng: 44.1700, zoom: 15 },
  { name: 'وادي السحول الخصيب', lat: 14.0200, lng: 44.1780, zoom: 14 }
];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  activeCategoryFilter
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const osmMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const measureLineRef = useRef<L.Polyline | null>(null);

  const [currentTile, setCurrentTile] = useState<'osm' | 'satellite' | 'topo' | 'dark'>('osm');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(activeCategoryFilter || 'all');
  const [viewportStats, setViewportStats] = useState({
    zoom: 14,
    centerLat: 13.9787,
    centerLng: 44.1812,
    visibleCount: places.length
  });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [radarScannerActive, setRadarScannerActive] = useState(true);
  const [osmLayerVisible, setOsmLayerVisible] = useState(true);
  const [osmDataStatus, setOsmDataStatus] = useState<'loading' | 'ready' | 'empty' | 'unavailable'>('loading');
  const [osmFeatureCount, setOsmFeatureCount] = useState(0);

  // Tile URL definitions
  const TILE_PROVIDERS = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors | Ibb City Map'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap, SRTM | Map style: &copy; OpenTopoMap'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }
  };

  // Helper for category colors
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'health': return '#f43f5e'; // rose
      case 'education': return '#3b82f6'; // blue
      case 'landmarks': return '#10b981'; // emerald
      case 'markets': return '#f59e0b'; // amber
      case 'restaurants': return '#f97316'; // orange
      case 'hotels': return '#a855f7'; // purple
      case 'government': return '#06b6d4'; // cyan
      case 'banking': return '#eab308'; // yellow
      case 'transport': return '#6366f1'; // indigo
      case 'religious': return '#14b8a6'; // teal
      default: return '#10b981';
    }
  };

  // Create custom SVG Leaflet icon
  const createCustomIcon = (place: IbbPlace, isSelected: boolean) => {
    const color = getCategoryColor(place.category);
    const size = isSelected ? 42 : 32;
    const pulseRing = isSelected ? `<div class="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-75"></div>` : '';

    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125" style="width:${size}px; height:${size}px;">
          ${pulseRing}
          <div style="background-color: ${color}; box-shadow: 0 4px 14px ${color}88;" class="w-full h-full rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg text-xs font-bold">
            <span class="transform scale-90">${place.name.substring(0, 1)}</span>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 rotate-45" style="background-color: ${color};"></div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size + 4],
      popupAnchor: [0, -(size + 4)]
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.9787, 44.1812],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Add initial tile layer
    const initialTile = L.tileLayer(TILE_PROVIDERS.osm.url, {
      attribution: TILE_PROVIDERS.osm.attribution,
      maxZoom: 19
    }).addTo(map);
    tileLayerRef.current = initialTile;

    // Create markers layer group
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Keep open licensed research data as a separate layer; never merge it with the legacy 71 records.
    const osmGroup = L.layerGroup().addTo(map);
    osmMarkersLayerRef.current = osmGroup;

    // Update viewport statistics on move/zoom
    const updateStats = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bounds = map.getBounds();

      let visible = 0;
      places.forEach(p => {
        if (bounds.contains([p.lat, p.lng])) {
          visible++;
        }
      });

      setViewportStats({
        zoom,
        centerLat: Number(center.lat.toFixed(4)),
        centerLng: Number(center.lng.toFixed(4)),
        visibleCount: visible
      });
    };

    map.on('moveend', updateStats);
    map.on('zoomend', updateStats);

    // Click handler for measuring distance tool
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!isMeasuring) return;

      setMeasurePoints(prev => {
        const next = [...prev, e.latlng];
        if (next.length === 2) {
          const dist = next[0].distanceTo(next[1]);
          setMeasuredDistance(dist);
          if (measureLineRef.current) {
            measureLineRef.current.setLatLngs(next);
          } else {
            measureLineRef.current = L.polyline(next, {
              color: '#10b981',
              weight: 4,
              dashArray: '8, 8'
            }).addTo(map);
          }
        } else if (next.length > 2) {
          if (measureLineRef.current) {
            map.removeLayer(measureLineRef.current);
            measureLineRef.current = null;
          }
          setMeasuredDistance(null);
          return [e.latlng];
        }
        return next;
      });
    });

    mapInstanceRef.current = map;
    updateStats();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Load the separately published OpenStreetMap-derived research dataset, if the importer has produced it.
  // This layer is separate from the app's original 71 hard-coded seed places.
  useEffect(() => {
    let cancelled = false;
    const group = osmMarkersLayerRef.current;
    if (!group) {
      setOsmDataStatus('unavailable');
      return;
    }

    fetch('https://raw.githubusercontent.com/h776117073-eng/Maps/main/data/openstreetmap_ibb_places.geojson', { cache: 'no-cache' })
      .then(async response => {
        if (!response.ok) throw new Error('OSM dataset not published yet');
        return response.json();
      })
      .then((dataset: { features?: Array<{ geometry?: { type?: string; coordinates?: number[] } | null; properties?: Record<string, any> }> }) => {
        if (cancelled) return;
        const features = Array.isArray(dataset.features) ? dataset.features : [];
        let added = 0;
        features.forEach(feature => {
          if (feature.geometry?.type !== 'Point' || !Array.isArray(feature.geometry.coordinates)) return;
          const [lng, lat] = feature.geometry.coordinates;
          if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
          const props = feature.properties || {};
          const tags = props.tags && typeof props.tags === 'object' ? props.tags : {};
          const name = String(props.name || tags['name:ar'] || tags['name:en'] || 'عنصر دون اسم');
          const popup = document.createElement('div');
          const title = document.createElement('strong');
          title.textContent = name;
          popup.appendChild(title);
          const category = document.createElement('div');
          category.textContent = String(props.category || 'عنصر جغرافي من OpenStreetMap');
          popup.appendChild(category);
          const address = String(props.address || 'لا يوجد عنوان مفصل مسجل في المصدر');
          const addressNode = document.createElement('div');
          addressNode.textContent = address;
          popup.appendChild(addressNode);
          const sourceUrl = String(props.osm_url || '');
          if (sourceUrl.startsWith('https://www.openstreetmap.org/')) {
            const link = document.createElement('a');
            link.href = sourceUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'عرض السجل الأصلي على OpenStreetMap';
            link.style.display = 'block';
            link.style.marginTop = '6px';
            popup.appendChild(link);
          }
          L.circleMarker([lat, lng], {
            radius: 5,
            color: '#38bdf8',
            weight: 1.5,
            fillColor: '#0ea5e9',
            fillOpacity: 0.78,
          }).bindPopup(popup).bindTooltip(name).addTo(group);
          added++;
        });
        setOsmFeatureCount(added);
        setOsmDataStatus(added > 0 ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!cancelled) setOsmDataStatus('unavailable');
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = osmMarkersLayerRef.current;
    if (!map || !group) return;
    if (osmLayerVisible) {
      if (!map.hasLayer(group)) group.addTo(map);
    } else if (map.hasLayer(group)) {
      map.removeLayer(group);
    }
  }, [osmLayerVisible]);

  // Switch Tile Layer
  const changeTileLayer = (tileType: 'osm' | 'satellite' | 'topo' | 'dark') => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const newTile = L.tileLayer(TILE_PROVIDERS[tileType].url, {
      attribution: TILE_PROVIDERS[tileType].attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTile;
    setCurrentTile(tileType);
  };

  // Render Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    const filtered = places.filter(place => {
      const matchCat = categoryFilter === 'all' || place.category === categoryFilter;
      const matchQuery = !searchQuery || 
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.district.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });

    filtered.forEach(place => {
      const isSelected = selectedPlace?.id === place.id;
      const marker = L.marker([place.lat, place.lng], {
        icon: createCustomIcon(place, isSelected),
        title: place.name
      });

      marker.on('click', () => {
        onSelectPlace(place);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [places, categoryFilter, searchQuery, selectedPlace]);

  // Zoom/Pan to selected place if updated externally
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlace) return;
    mapInstanceRef.current.flyTo([selectedPlace.lat, selectedPlace.lng], 16, {
      duration: 1.2
    });
  }, [selectedPlace]);

  // Fast Travel handler
  const handleFastTravel = (preset: typeof IBB_PRESETS[0]) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([preset.lat, preset.lng], preset.zoom, {
      duration: 1.5
    });
    setShowPresets(false);
  };

  // Geolocation
  const handleLocateMe = () => {
    if (!mapInstanceRef.current) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
          L.marker([pos.coords.latitude, pos.coords.longitude], {
            icon: L.divIcon({
              className: 'current-loc',
              html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white ring-4 ring-blue-400/50 animate-pulse"></div>`
            })
          }).addTo(mapInstanceRef.current!);
        },
        () => {
          // Fallback to center of Ibb
          mapInstanceRef.current?.flyTo([13.9787, 44.1812], 14);
        }
      );
    }
  };

  // Reset View
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([13.9787, 44.1812], 14);
    onSelectPlace(null);
  };

  // Clear measure
  const toggleMeasure = () => {
    if (isMeasuring && measureLineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(measureLineRef.current);
      measureLineRef.current = null;
    }
    setIsMeasuring(!isMeasuring);
    setMeasurePoints([]);
    setMeasuredDistance(null);
  };

  return (
    <div className="relative w-full h-[620px] lg:h-[720px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
      {/* Map DOM node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Bar: Search, Category Filter & Presets */}
      <div className="absolute top-4 right-4 left-4 z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pointer-events-none">
        {/* Search Input */}
        <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 shadow-xl w-full md:w-80">
          <Search className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن منشأة، شارع، أو حي في إب..."
            className="bg-transparent border-none text-sm text-slate-100 placeholder-slate-400 focus:outline-none w-full"
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

        {/* Action Controls & Preset Jumps */}
        <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Preset Camera Jumps Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-emerald-400 border border-emerald-500/30 rounded-xl shadow-lg backdrop-blur-md transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>معالم وسحب إب</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showPresets ? 'rotate-90' : ''}`} />
            </button>

            {showPresets && (
              <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 max-h-72 overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-800 mb-1">
                  انتقال سريع لأهم مناطق ومعالم إب:
                </div>
                {IBB_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFastTravel(preset)}
                    className="w-full text-right px-3 py-2 text-xs text-slate-200 hover:bg-emerald-950/40 hover:text-emerald-300 flex items-center justify-between transition-colors"
                  >
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Zoom {preset.zoom}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Separate open dataset visibility toggle */}
          <button
            onClick={() => setOsmLayerVisible(!osmLayerVisible)}
            title="إظهار أو إخفاء سجلات OpenStreetMap المفتوحة؛ لا تدمج مع السجلات الـ71 القديمة"
            className={`px-2.5 py-2 text-xs font-bold rounded-xl border shadow-lg backdrop-blur-md transition-colors ${osmLayerVisible ? 'bg-sky-600/90 text-white border-sky-400/60' : 'bg-slate-900/90 text-slate-300 border-slate-700/80'}`}
          >
            OSM ({osmDataStatus === 'ready' ? osmFeatureCount : osmDataStatus === 'loading' ? '…' : '—'})
          </button>

          {/* Tile Switcher */}
          <div className="flex bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg">
            <button
              onClick={() => changeTileLayer('osm')}
              title="خريطة شوارع OpenStreetMap"
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                currentTile === 'osm' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              شوارع
            </button>
            <button
              onClick={() => changeTileLayer('satellite')}
              title="أقمار صناعية Esri"
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                currentTile === 'satellite' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              أقمار صناعية
            </button>
            <button
              onClick={() => changeTileLayer('topo')}
              title="تضاريس وجبال إب الخضراء"
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                currentTile === 'topo' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              تضاريس
            </button>
            <button
              onClick={() => changeTileLayer('dark')}
              title="خريطة ليلية CartoDB"
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                currentTile === 'dark' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              داكنة
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Bar along top-bottom */}
      <div className="absolute top-20 right-4 left-4 z-20 pointer-events-none overflow-x-auto pb-1 flex gap-1.5 no-scrollbar">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`pointer-events-auto shrink-0 px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-md shadow transition-all ${
            categoryFilter === 'all'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
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
                  : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              {cat.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Right Controls Toolset */}
      <div className="absolute top-36 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="تكبير الخريطة (Zoom In)"
          className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-xl shadow-xl flex items-center justify-center font-bold text-lg backdrop-blur-md transition-colors"
        >
          +
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          title="تصغير الخريطة (Zoom Out)"
          className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-xl shadow-xl flex items-center justify-center font-bold text-lg backdrop-blur-md transition-colors"
        >
          -
        </button>
        <button
          onClick={handleResetView}
          title="إعادة التمركز على إب"
          className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-slate-700 rounded-xl shadow-xl flex items-center justify-center backdrop-blur-md transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleLocateMe}
          title="موقعي الحالي"
          className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-blue-400 border border-slate-700 rounded-xl shadow-xl flex items-center justify-center backdrop-blur-md transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={toggleMeasure}
          title={isMeasuring ? 'إيقاف قياس المسافة' : 'قياس المسافة بين نقطتين في إب'}
          className={`w-10 h-10 border rounded-xl shadow-xl flex items-center justify-center backdrop-blur-md transition-colors ${
            isMeasuring ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse' : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700'
          }`}
        >
          <Ruler className="w-4 h-4" />
        </button>
        <button
          onClick={() => setRadarScannerActive(!radarScannerActive)}
          title="تبديل رادار التغطية الحية"
          className={`w-10 h-10 border rounded-xl shadow-xl flex items-center justify-center backdrop-blur-md transition-colors ${
            radarScannerActive ? 'bg-slate-800 text-emerald-400 border-emerald-500/40' : 'bg-slate-900/90 text-slate-400 border-slate-700'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Measurement HUD banner */}
      {isMeasuring && (
        <div className="absolute top-36 left-4 z-20 bg-slate-900/95 border border-emerald-500/60 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs text-slate-200 max-w-xs animate-in fade-in">
          <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
            <Ruler className="w-3.5 h-3.5" />
            <span>أداة قياس المسافات المباشرة</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            انقر على أي نقطتين على خريطة إب لحساب المسافة الهوائية بينهما بدقة.
          </p>
          {measuredDistance !== null ? (
            <div className="mt-2 p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 font-bold text-sm">
              المسافة: {(measuredDistance / 1000).toFixed(2)} كم ({Math.round(measuredDistance)} متر)
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-amber-400">
              {measurePoints.length === 1 ? 'اختر النقطة الثانية الآن...' : 'حدد النقطة الأولى بالضغط على الخريطة'}
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Live Viewport Radar / Coverage Badge */}
      {radarScannerActive && (
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-2xl text-[11px] text-slate-300 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-white">رادار التغطية الحية:</span>
          </div>
          <span className="text-emerald-400 font-bold">{viewportStats.visibleCount} منشأة معروضة</span>
          <span className="text-slate-500">|</span>
          <span>Zoom: <span className="font-mono text-white">{viewportStats.zoom}</span></span>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-[10px] text-slate-400">
            {viewportStats.centerLat}°N, {viewportStats.centerLng}°E
          </span>
          <span className="text-[10px] text-sky-300" title="طبقة بيانات منفصلة من OpenStreetMap">
            {osmDataStatus === 'loading' ? 'جاري تحميل بيانات OSM…' : osmDataStatus === 'ready' ? `OSM: ${osmFeatureCount} عنصر • ليست تغطية كاملة` : osmDataStatus === 'empty' ? 'لا توجد عناصر منشورة في ملف OSM' : 'بيانات OSM غير متاحة بعد'}
          </span>
        </div>
      )}

      {/* Selected Place Overlay Card (Bottom Center / Drawer) */}
      {selectedPlace && (
        <div className="absolute bottom-4 right-4 max-w-sm md:max-w-md w-[calc(100%-2rem)] z-30 bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedPlace.categoryLabel}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedPlace.district}
                </span>
                {selectedPlace.verified && (
                  <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
                    <CheckCircle2 className="w-3 h-3" /> موثق
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base text-white leading-snug">
                {selectedPlace.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {selectedPlace.description}
              </p>
            </div>

            <button
              onClick={() => onSelectPlace(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/60 p-2 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{selectedPlace.address}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/60 p-2 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{selectedPlace.hours}</span>
            </div>
          </div>

          {selectedPlace.services.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {selectedPlace.services.slice(0, 3).map((s, idx) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
            {selectedPlace.phone && selectedPlace.phone !== 'لا يوجد' && (
              <a
                href={`tel:${selectedPlace.phone}`}
                className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-900/30"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال: {selectedPlace.phone}</span>
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>اتجاهات</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
