import React, { useState } from 'react';
import { 
  Activity, 
  GraduationCap, 
  Mountain, 
  ShoppingBag, 
  Utensils, 
  Hotel, 
  Building2, 
  Landmark, 
  Bus, 
  Sparkles,
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  Download, 
  Copy, 
  Check, 
  Navigation, 
  Eye, 
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { IbbPlace, CATEGORIES, CategoryMeta, IBB_DISTRICTS } from '../data/ibbData';

interface CategorizedDirectoryProps {
  places: IbbPlace[];
  activeCategoryId: string;
  onSelectCategory: (catId: string) => void;
  onSelectOnMap: (place: IbbPlace) => void;
}

export const CategorizedDirectory: React.FC<CategorizedDirectoryProps> = ({
  places,
  activeCategoryId,
  onSelectCategory,
  onSelectOnMap
}) => {
  const [districtFilter, setDistrictFilter] = useState('جميع أحياء إب');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Current category metadata
  const currentMeta = CATEGORIES.find(c => c.id === activeCategoryId) || CATEGORIES[0];

  // Map category ID to Lucide icon component
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'health': return <Activity className="w-5 h-5 text-rose-400" />;
      case 'education': return <GraduationCap className="w-5 h-5 text-blue-400" />;
      case 'landmarks': return <Mountain className="w-5 h-5 text-emerald-400" />;
      case 'markets': return <ShoppingBag className="w-5 h-5 text-amber-400" />;
      case 'restaurants': return <Utensils className="w-5 h-5 text-orange-400" />;
      case 'hotels': return <Hotel className="w-5 h-5 text-purple-400" />;
      case 'government': return <Building2 className="w-5 h-5 text-cyan-400" />;
      case 'banking': return <Landmark className="w-5 h-5 text-yellow-400" />;
      case 'transport': return <Bus className="w-5 h-5 text-indigo-400" />;
      case 'religious': return <Sparkles className="w-5 h-5 text-teal-400" />;
      default: return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  // Filtered places for the current category
  const categoryPlaces = places.filter(p => p.category === currentMeta.id);
  const filteredPlaces = categoryPlaces.filter(p => {
    const matchDistrict = districtFilter === 'جميع أحياء إب' || p.district === districtFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.services.some(s => s.toLowerCase().includes(q));

    return matchDistrict && matchSearch;
  });

  // Export current category as JSON
  const handleDownloadCategoryJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredPlaces, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ibb_${currentMeta.id}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy single place
  const handleCopyPlace = (place: IbbPlace) => {
    const text = `${place.name} - ${place.subcategory}
الحي: ${place.district}
العنوان: ${place.address}
الهاتف: ${place.phone}
ساعات العمل: ${place.hours}
الإحداثيات: ${place.lat}, ${place.lng}
الوصف: ${place.description}`;

    navigator.clipboard.writeText(text);
    setCopiedId(place.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => {
            const isActive = cat.id === currentMeta.id;
            const count = places.filter(p => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  setDistrictFilter('جميع أحياء إب');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-emerald-800/80 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Domain Hero Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl shadow-inner shrink-0">
            {getCategoryIcon(currentMeta.id)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-emerald-400">قسم ومجال متخصص</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-xs text-slate-400">{filteredPlaces.length} منشأة متوفرة</span>
            </div>
            <h2 className="text-2xl font-black text-white">{currentMeta.title} بإب</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              {currentMeta.description}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadCategoryJSON}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-lg"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>تصدير هذا القسم (JSON)</span>
        </button>
      </div>

      {/* Filter and Search Bar for Category */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`ابحث داخل قسم ${currentMeta.title}...`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {IBB_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlaces.map(place => (
          <div
            key={place.id}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all group"
          >
            <div>
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {place.subcategory}
                </span>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{place.rating}</span>
                </div>
              </div>

              {/* Title & District */}
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                {place.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{place.nameEn}</p>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {place.description}
              </p>

              {/* Contact & Location Details */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">{place.district}</span>
                    <span className="text-slate-400 text-[11px]">{place.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-medium">{place.hours}</span>
                </div>

                {place.phone && place.phone !== 'لا يوجد' && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                    <a href={`tel:${place.phone}`} className="hover:text-emerald-400 font-mono text-[12px] font-bold underline decoration-dotted">
                      {place.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Services badges */}
              {place.services.length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5">الخدمات والمزايا:</span>
                  <div className="flex flex-wrap gap-1">
                    {place.services.map((s, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectOnMap(place)}
                className="flex-1 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-500/30"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>عرض على الخريطة</span>
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                title="خرائط جوجل"
              >
                <Navigation className="w-4 h-4 text-blue-400" />
              </a>

              <button
                onClick={() => handleCopyPlace(place)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                title="نسخ التفاصيل"
              >
                {copiedId === place.id ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPlaces.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">لا توجد منشآت مسجلة في هذا الحي حالياً ضمن قسم {currentMeta.title}.</p>
          <button
            onClick={() => { setSearchQuery(''); setDistrictFilter('جميع أحياء إب'); }}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            عرض كافة أحياء إب
          </button>
        </div>
      )}
    </div>
  );
};
