import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  LayoutGrid, 
  Table as TableIcon, 
  Sparkles, 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  Share2, 
  CheckCircle2, 
  ExternalLink,
  Navigation,
  Eye
} from 'lucide-react';
import { IbbPlace, CATEGORIES, IBB_DISTRICTS } from '../data/ibbData';

interface MasterDirectoryProps {
  places: IbbPlace[];
  onSelectOnMap: (place: IbbPlace) => void;
}

export const MasterDirectory: React.FC<MasterDirectoryProps> = ({ places, onSelectOnMap }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('جميع أحياء إب');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  // Filtered dataset
  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      const matchCategory = selectedCategory === 'all' || place.category === selectedCategory;
      const matchDistrict = selectedDistrict === 'جميع أحياء إب' || place.district === selectedDistrict;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        place.name.toLowerCase().includes(q) ||
        place.nameEn.toLowerCase().includes(q) ||
        place.address.toLowerCase().includes(q) ||
        place.description.toLowerCase().includes(q) ||
        place.phone.includes(q) ||
        place.services.some(s => s.toLowerCase().includes(q));

      return matchCategory && matchDistrict && matchSearch;
    });
  }, [places, selectedCategory, selectedDistrict, searchQuery]);

  // Export 1: Copy All as Formatted Text
  const handleCopyAllText = () => {
    const textData = filteredPlaces.map((p, idx) => {
      return `${idx + 1}. [${p.categoryLabel}] ${p.name} (${p.subcategory})
   الحي: ${p.district} | العنوان: ${p.address}
   الهاتف: ${p.phone} | ساعات العمل: ${p.hours}
   الإحداثيات: ${p.lat}, ${p.lng}
   التفاصيل: ${p.description}
   الخدمات: ${p.services.join('، ')}
   ----------------------------------------`;
    }).join('\n\n');

    const header = `=== دليل ومنشآت مدينة إب الشامل (اللواء الأخضر) ===\nإجمالي المنشآت المضمنة: ${filteredPlaces.length}\nتم الاستخراج بتاريخ: ${new Date().toLocaleDateString('ar-YE')}\n\n`;

    navigator.clipboard.writeText(header + textData);
    setCopiedAction('text');
    setTimeout(() => setCopiedAction(null), 2500);
  };

  // Export 2: Copy All as JSON
  const handleCopyAllJSON = () => {
    const jsonString = JSON.stringify(filteredPlaces, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopiedAction('json');
    setTimeout(() => setCopiedAction(null), 2500);
  };

  // Export 3: Download JSON file
  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredPlaces, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ibb_city_directory_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export 4: Download CSV with UTF-8 BOM for Arabic compatibility in Excel
  const handleDownloadCSV = () => {
    const headers = ['المعرف', 'الاسم', 'الاسم بالإنجليزية', 'القسم الرئيسي', 'التصنيف الفرعي', 'الحي', 'العنوان التفصيلي', 'خط العرض', 'خط الطول', 'رقم الهاتف', 'ساعات العمل', 'الوصف', 'الخدمات', 'التقييم'];
    
    const rows = filteredPlaces.map(p => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.nameEn.replace(/"/g, '""')}"`,
      `"${p.categoryLabel}"`,
      `"${p.subcategory}"`,
      `"${p.district}"`,
      `"${p.address.replace(/"/g, '""')}"`,
      p.lat,
      p.lng,
      `"${p.phone}"`,
      `"${p.hours}"`,
      `"${p.description.replace(/"/g, '""')}"`,
      `"${p.services.join(' - ').replace(/"/g, '""')}"`,
      p.rating
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ibb_city_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Export 5: Download GeoJSON for GIS / Maps
  const handleDownloadGeoJSON = () => {
    const geojson = {
      type: "FeatureCollection",
      features: filteredPlaces.map(p => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [p.lng, p.lat]
        },
        properties: {
          id: p.id,
          name: p.name,
          nameEn: p.nameEn,
          category: p.category,
          categoryLabel: p.categoryLabel,
          subcategory: p.subcategory,
          district: p.district,
          address: p.address,
          phone: p.phone,
          hours: p.hours,
          description: p.description,
          rating: p.rating
        }
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ibb_city_map_locations_${new Date().toISOString().slice(0, 10)}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy Single Item details
  const handleCopySingleItem = (place: IbbPlace) => {
    const text = `${place.name} (${place.categoryLabel})\n📍 ${place.district} - ${place.address}\n📞 ${place.phone}\n⏰ ${place.hours}\nℹ️ ${place.description}`;
    navigator.clipboard.writeText(text);
    setCopiedAction(place.id);
    setTimeout(() => setCopiedAction(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header & One-Click Bulk Export Card */}
      <div className="bg-gradient-to-l from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>قاعدة البيانات الشاملة لمدينة إب</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight">
              الدليل الرقمي المركزي لمنشآت وعناوين إب
            </h1>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              تصفح، ابحث، وانسخ أو قم بتنزيل كامل بيانات منشآت ومواقع مدينة إب (اللواء الأخضر) بجميع مجالاتها دفعة واحدة بصيغ متعددة (JSON, CSV Excel, GeoJSON, نص منسق).
            </p>
          </div>

          {/* Bulk Export Toolbar Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyAllText}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95"
            >
              {copiedAction === 'text' ? <Check className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-emerald-400" />}
              <span>{copiedAction === 'text' ? 'تم نسخ الكل!' : 'نسخ الكل كنص'}</span>
            </button>

            <button
              onClick={handleCopyAllJSON}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95"
            >
              {copiedAction === 'json' ? <Check className="w-4 h-4 text-emerald-400" /> : <FileCode className="w-4 h-4 text-blue-400" />}
              <span>{copiedAction === 'json' ? 'تم نسخ JSON!' : 'نسخ JSON'}</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تنزيل ملف Excel (CSV)</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>تنزيل JSON</span>
            </button>

            <button
              onClick={handleDownloadGeoJSON}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>تنزيل GeoJSON</span>
            </button>
          </div>
        </div>

        {/* Live Filter Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">المنشآت المعروضة</span>
            <span className="text-xl font-black text-emerald-400">{filteredPlaces.length} <span className="text-xs text-slate-500">/ {places.length}</span></span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">المجالات المغطاة</span>
            <span className="text-xl font-black text-blue-400">{CATEGORIES.length} قطاعات</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">الأحياء والمناطق</span>
            <span className="text-xl font-black text-amber-400">{IBB_DISTRICTS.length - 1} حي ومنطقة</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">حالة التوثيق والإحداثيات</span>
            <span className="text-xl font-black text-teal-400">100% موثقة</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، العنوان، الخدمة، أو رقم الهاتف..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">جميع المجالات والقطاعات ({places.length})</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* District Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {IBB_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0 self-center">
          <button
            onClick={() => setViewMode('grid')}
            title="عرض البطاقات"
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="عرض الجدول"
            className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaces.map(place => (
            <div
              key={place.id}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:shadow-emerald-950/20 group"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {place.categoryLabel}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{place.rating}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                  {place.name}
                </h3>
                <div className="text-xs text-slate-400 font-medium mb-3">
                  {place.subcategory} &bull; <span className="text-slate-300 font-semibold">{place.district}</span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                  {place.description}
                </p>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{place.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{place.hours}</span>
                  </div>
                  {place.phone && place.phone !== 'لا يوجد' && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <a href={`tel:${place.phone}`} className="hover:text-emerald-400 font-mono underline decoration-dotted">
                        {place.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Services Tags */}
                {place.services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {place.services.slice(0, 3).map((s, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectOnMap(place)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>عرض على الخريطة</span>
                </button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                  title="الاتجاهات عبر خرائط جوجل"
                >
                  <Navigation className="w-4 h-4 text-blue-400" />
                </a>

                <button
                  onClick={() => handleCopySingleItem(place)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                  title="نسخ تفاصيل المنشأة"
                >
                  {copiedAction === place.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5">المنشأة</th>
                  <th className="p-3.5">القطاع</th>
                  <th className="p-3.5">الحي / المنطقة</th>
                  <th className="p-3.5">العنوان</th>
                  <th className="p-3.5">الهاتف</th>
                  <th className="p-3.5">ساعات العمل</th>
                  <th className="p-3.5">الإحداثيات</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPlaces.map(place => (
                  <tr key={place.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">
                      {place.name}
                      <span className="block text-[11px] text-slate-400 font-normal">{place.subcategory}</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                        {place.categoryLabel}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-medium text-emerald-400">{place.district}</td>
                    <td className="p-3.5 max-w-xs truncate">{place.address}</td>
                    <td className="p-3.5 whitespace-nowrap font-mono">{place.phone}</td>
                    <td className="p-3.5 whitespace-nowrap">{place.hours}</td>
                    <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectOnMap(place)}
                          title="عرض في الخريطة"
                          className="p-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopySingleItem(place)}
                          title="نسخ التفاصيل"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          {copiedAction === place.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredPlaces.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">لا توجد نتائج مطابقة لخيارات البحث المحددة في مدينة إب.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedDistrict('جميع أحياء إب'); }}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            إعادة تعيين المرشحات
          </button>
        </div>
      )}
    </div>
  );
};
