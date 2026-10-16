import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RealGoogleMap } from './components/RealGoogleMap';
import { InteractiveMap } from './components/InteractiveMap';
import { MasterDirectory } from './components/MasterDirectory';
import { CategorizedDirectory } from './components/CategorizedDirectory';
import { AiQueryAssistant } from './components/AiQueryAssistant';
import { VisualInspection } from './components/VisualInspection';
import { EmergencyModal } from './components/EmergencyModal';
import { IBB_PLACES, IbbPlace, IBB_STATS, CATEGORIES } from './data/ibbData';
import { 
  Heart, 
  MapPin, 
  Phone, 
  Compass, 
  ShieldCheck, 
  TreePine, 
  Sparkles,
  Download,
  FileSpreadsheet,
  Layers,
  Map as MapIcon
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'master' | 'categories' | 'assistant' | 'inspection'>('map');
  const [places, setPlaces] = useState<IbbPlace[]>(IBB_PLACES);
  const [selectedPlace, setSelectedPlace] = useState<IbbPlace | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeCategorizedTab, setActiveCategorizedTab] = useState<string>('health');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('leaflet');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Listen to Google Maps quota exceeded event
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Jump to map and focus on specific place
  const handleSelectOnMap = (place: IbbPlace) => {
    setSelectedPlace(place);
    setActiveTab('map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Jump to map at coordinates and zoom
  const handleJumpToMapZoom = (lat: number, lng: number, zoom: number) => {
    setActiveTab('map');
    setSelectedPlace({
      id: 'custom-view',
      name: 'موقع الرصد المحدد',
      nameEn: 'Selected Inspection Point',
      category: 'landmarks',
      categoryLabel: 'معالم وسياحة إب',
      subcategory: 'نقطة رصد واستكشاف',
      district: 'مدينة إب',
      address: 'إحداثيات رصد مباشرة',
      lat,
      lng,
      phone: '04-211100',
      hours: 'متاح للزيارة',
      description: 'تم اختيار هذه النقطة من شاشة الفحص البصري والاستكشاف الجغرافي لمدينة إب.',
      services: ['رصد بصري', 'معالم طبيعية'],
      features: ['إطلالة بانورامية'],
      rating: 4.9,
      verified: true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Download all places as JSON
  const handleDownloadAllJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(places, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ibb_city_directory_full_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif] selection:bg-emerald-500 selection:text-white">
      {/* Required OpenStreetMap / Leaflet Demo Quota Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
        onDownloadAll={handleDownloadAllJSON}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Interactive Map & Live Coverage Radar */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <TreePine className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-base text-white">الخريطة التفاعلية المفتوحة لمدينة إب</h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Google Maps Platform
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    خريطة داخل المشروع للشوارع والتضاريس والصور الجوية ونقاط البيانات المحلية؛ لا يلزم فتح صفحة خرائط خارجية
                  </p>
                </div>
              </div>

              {/* Engine Switcher (Real Google Map vs Hybrid Topographic) */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
                  <button
                    onClick={() => setMapEngine('google')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mapEngine === 'google'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5 text-blue-300" />
                    <span>خرائط Google</span>
                  </button>
                  <button
                    onClick={() => setMapEngine('leaflet')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mapEngine === 'leaflet'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-300" />
                    <span>خريطة OpenStreetMap</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Map Canvas: Render Real Google Map or Alternate */}
            {mapEngine === 'google' ? (
              <RealGoogleMap
                places={places}
                selectedPlace={selectedPlace}
                onSelectPlace={setSelectedPlace}
                activeCategoryFilter={activeCategoryFilter}
              />
            ) : (
              <InteractiveMap
                places={places}
                selectedPlace={selectedPlace}
                onSelectPlace={setSelectedPlace}
                activeCategoryFilter={activeCategoryFilter}
              />
            )}

            {/* Quick Fast-Access Category Grid below map */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>استكشف قطاعات إب بحسب المجال:</span>
                </h3>
                <span className="text-xs text-slate-400">انقر لفتح تفاصيل أي قطاع</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {CATEGORIES.map(cat => {
                  const count = places.filter(p => p.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategorizedTab(cat.id);
                        setActiveTab('categories');
                      }}
                      className="p-3 bg-slate-950/70 hover:bg-emerald-950/40 border border-slate-800/80 hover:border-emerald-500/40 rounded-xl text-right transition-all flex items-center justify-between group"
                    >
                      <div>
                        <span className="block font-bold text-xs text-slate-200 group-hover:text-emerald-300">
                          {cat.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {count} منشأة
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 group-hover:text-emerald-400 font-bold">&larr;</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Master Directory & One-Click Bulk Export */}
        {activeTab === 'master' && (
          <MasterDirectory
            places={places}
            onSelectOnMap={handleSelectOnMap}
          />
        )}

        {/* Tab 3: Categorized Domain-Specific Pages */}
        {activeTab === 'categories' && (
          <CategorizedDirectory
            places={places}
            activeCategoryId={activeCategorizedTab}
            onSelectCategory={setActiveCategorizedTab}
            onSelectOnMap={handleSelectOnMap}
          />
        )}

        {/* Tab 4: AI Question & Chat Assistant */}
        {activeTab === 'assistant' && (
          <AiQueryAssistant
            places={places}
            onSelectOnMap={handleSelectOnMap}
          />
        )}

        {/* Tab 5: Visual Inspection & Radar Coverage Monitor */}
        {activeTab === 'inspection' && (
          <VisualInspection
            onJumpToMapZoom={handleJumpToMapZoom}
          />
        )}
      </main>

      {/* Emergency Hotlines Modal */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />

      {/* Global Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TreePine className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">دليل وخريطة مدينة إب التفاعلية الشاملة</span>
            <span>- خريطة مفتوحة داخل التطبيق | اللواء الأخضر، اليمن</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>OpenStreetMap / Leaflet</span>
            </span>
            <span>&bull;</span>
            <button
              onClick={handleDownloadAllJSON}
              className="text-emerald-400 hover:underline"
            >
              تنزيل ملف البيانات كاملاً
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
