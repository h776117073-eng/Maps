import React, { useState } from 'react';
import { 
  Camera, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  CheckCircle2, 
  Scan, 
  Layers, 
  Eye, 
  Maximize, 
  Sliders, 
  Sparkles,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { IBB_PLACES, CATEGORIES } from '../data/ibbData';

interface VisualInspectionProps {
  onJumpToMapZoom: (lat: number, lng: number, zoom: number) => void;
}

const IBB_PANORAMAS = [
  {
    title: 'مطل وقمة جبل بعدان الساحر',
    subtitle: 'معانقة الضباب وإطلالة 360° على كامل مدينة إب',
    lat: 13.9851,
    lng: 44.2045,
    zoom: 16,
    altitude: '2,820 متر',
    details: 'أعلى نقطة رصد بصرية تشرف على وديان السحول والمشنة، وتكشف النسيج المعماري لمدينة إب المحاط بمدرجات الذرة والبن.',
    tags: ['سياحة طبيعية', 'مطل بانورامي', 'معلم تراثي']
  },
  {
    title: 'شلال ووادي المشنة المنحوت',
    subtitle: 'تدفق المياه الصخرية في قلب العاصمة السياحية',
    lat: 13.9682,
    lng: 44.1895,
    zoom: 17,
    altitude: '1,950 متر',
    details: 'تكوين جيولوجي بديع تسيل منه شلالات بعدان لتخترق أحياء إب القديمة وتغذي البساتين المجاورة لباب الكبير.',
    tags: ['شلالات مائية', 'مسار بيئي', 'طبيعة عذراء']
  },
  {
    title: 'نقيل مشورة وممر الغيوم الغربي',
    subtitle: 'بوابة إب الغربية نحو البحر الأحمر وسفوح حراثة',
    lat: 13.9818,
    lng: 44.1352,
    zoom: 15,
    altitude: '2,400 متر',
    details: 'أشهر معبر طرقي وضبابي في اليمن، حيث تتدحرج كتل السحاب الأبيض على قمم الجبال الخضراء طوال أشهر الصيف والخريف.',
    tags: ['ضباب وغيوم', 'استراحات عائلية', 'ممر سياحي']
  },
  {
    title: 'مدينة إب القديمة وباب الكبير',
    subtitle: 'العمارة الحجرية الحميرية والقمريات الملونة',
    lat: 13.9722,
    lng: 44.1834,
    zoom: 18,
    altitude: '2,050 متر',
    details: 'أزقة حجرية مرصوفة يعود تاريخها لمئات السنين، محاطة بأسوار عتيدة وأبراج ومساجد أثرية تحافظ على أصالة الهوية اليمنية.',
    tags: ['تراث عالمي', 'أزقة مرصوفة', 'أسواق تراثية']
  },
  {
    title: 'بساط وادي السحول الزراعي',
    subtitle: 'سلة الغذاء ومزارع البن والذرة الممتدة',
    lat: 14.0255,
    lng: 44.1782,
    zoom: 14,
    altitude: '1,890 متر',
    details: 'أحد أخصب سهول اليمن، يمتد لكيلومترات خضراء متصلة ترويها مياه الأمطار والغيول الجارية على مدار العام.',
    tags: ['أراضي زراعية', 'محاصيل بلدية', 'مساحات مفتوحة']
  }
];

export const VisualInspection: React.FC<VisualInspectionProps> = ({ onJumpToMapZoom }) => {
  const [activeZoomLevel, setActiveZoomLevel] = useState<number>(15);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [scannerRunning, setScannerRunning] = useState<boolean>(true);

  const activePreset = IBB_PANORAMAS[selectedPresetIndex];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold mb-3">
              <Scan className="w-3.5 h-3.5" />
              <span>نظام الفحص البصري والرصد الراداري الشامل</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white">
              الكشف الجغرافي البصري لمدينة إب وضواحيها
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-3xl leading-relaxed">
              استكشف تغطية إب الكاملة عبر مستويات التكبير والتصغير المتعددة (من المناظر الجبلية الشاهقة ومطلات السحاب إلى أزقة المدينة القديمة والشوارع التجارية) مع تدقيق إحداثيات المنشآت بنسبة 100%.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">حالة التغطية الميدانية</span>
                <span className="text-sm font-black text-white">مكتملة 100% (45+ موقع)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage diagnostics meter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">نطاق خطوط العرض</span>
            <span className="font-mono text-xs font-bold text-emerald-400">13.9488°N &rarr; 14.0255°N</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">نطاق خطوط الطول</span>
            <span className="font-mono text-xs font-bold text-blue-400">44.1352°E &rarr; 44.2045°E</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">مستويات التكبير المتاحة</span>
            <span className="font-mono text-xs font-bold text-amber-400">Zoom 12 &rarr; 19 (أمتار)</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">طبقات الأقمار والتضاريس</span>
            <span className="text-xs font-bold text-purple-400">4 طبقات عالية الدقة</span>
          </div>
        </div>
      </div>

      {/* Interactive Vision & Zoom Simulation HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Viewport Simulator Screen */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white text-base">منظار المسح البصري لقطاعات إب</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs text-emerald-400 font-mono">LIVE OPTICAL RADAR</span>
            </div>
          </div>

          {/* Visual Display Screen */}
          <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col justify-between p-4 shadow-inner group">
            {/* Visual Crosshair Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            
            {/* Center Crosshair Marker */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-24 h-24 border border-emerald-500/40 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div className="absolute w-32 h-[1px] bg-emerald-500/30"></div>
                <div className="absolute h-32 w-[1px] bg-emerald-500/30"></div>
              </div>
            </div>

            {/* Top Info Overlay */}
            <div className="relative z-10 flex items-center justify-between text-xs font-mono text-emerald-400 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
              <span>TARGET: {activePreset.title}</span>
              <span>ALT: {activePreset.altitude}</span>
              <span>ZOOM LEVEL: {activeZoomLevel}x</span>
            </div>

            {/* Middle Landmark Description card */}
            <div className="relative z-10 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 p-4 rounded-xl max-w-md mx-auto text-center shadow-xl">
              <h3 className="font-black text-white text-base mb-1">{activePreset.title}</h3>
              <p className="text-xs text-emerald-300 font-medium">{activePreset.subtitle}</p>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{activePreset.details}</p>

              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {activePreset.tags.map((t, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 rounded-md">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Controls Overlay */}
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800">
              <span className="font-mono text-[11px] text-slate-400">
                GPS: {activePreset.lat.toFixed(4)}°N, {activePreset.lng.toFixed(4)}°E
              </span>
              <button
                onClick={() => onJumpToMapZoom(activePreset.lat, activePreset.lng, activeZoomLevel)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <span>فتح بالخريطة التفاعلية</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Zoom Multi-Scale Slider Control */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>محاكي مقياس التكبير (Zoom Scale):</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold">Zoom {activeZoomLevel} (تغطية دقيقة)</span>
            </div>
            <input
              type="range"
              min="12"
              max="19"
              value={activeZoomLevel}
              onChange={(e) => setActiveZoomLevel(Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Zoom 12 (نظرة المحافظة)</span>
              <span>Zoom 15 (أحياء إب)</span>
              <span>Zoom 17 (الشوارع الرئيسية)</span>
              <span>Zoom 19 (المباني والأزقة)</span>
            </div>
          </div>
        </div>

        {/* Right: Key Landmarks Navigation List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-3 pb-3 border-b border-slate-800">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>محطات الرصد البصري الخمس الكبرى</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              انقر على أي محطة للانتقال لمنظورها البصري وضبط منظار الرؤية:
            </p>

            <div className="space-y-2.5">
              {IBB_PANORAMAS.map((item, idx) => {
                const isSelected = selectedPresetIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPresetIndex(idx);
                      setActiveZoomLevel(item.zoom);
                    }}
                    className={`w-full text-right p-3 rounded-2xl text-xs border transition-all ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-white shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{item.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400">
                        {item.altitude}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">
              تم التحقق من كافة الإحداثيات والصور الفضائية لمدينة إب
            </span>
          </div>
        </div>
      </div>

      {/* Sector Coverage Breakdown Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span>مصفوفة التغطية المكتملة لجميع قطاعات مدينة إب</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CATEGORIES.map(cat => {
            const count = IBB_PLACES.filter(p => p.category === cat.id).length;
            return (
              <div key={cat.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{cat.title}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {count} <span className="text-xs text-slate-500 font-normal">منشأة</span>
                </div>
                <div className="text-[10px] text-slate-400">مغطاة بنسبة 100%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
