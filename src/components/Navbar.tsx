import React from 'react';
import { 
  Map, 
  ListFilter, 
  Layers, 
  MessageSquare, 
  Scan, 
  PhoneCall, 
  Download, 
  Compass, 
  Sparkles,
  TreePine
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'master' | 'categories' | 'assistant' | 'inspection';
  onSelectTab: (tab: 'map' | 'master' | 'categories' | 'assistant' | 'inspection') => void;
  onOpenEmergency: () => void;
  onDownloadAll: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenEmergency,
  onDownloadAll
}) => {
  const navItems = [
    { id: 'map', label: 'الخريطة التفاعلية', icon: <Map className="w-4 h-4" /> },
    { id: 'master', label: 'الدليل الشامل والتصدير', icon: <ListFilter className="w-4 h-4" /> },
    { id: 'categories', label: 'الأقسام والمجالات', icon: <Layers className="w-4 h-4" /> },
    { id: 'assistant', label: 'استعلام ومحادثة إب', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'inspection', label: 'الرؤية والتغطية', icon: <Scan className="w-4 h-4" /> },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Title */}
          <div 
            onClick={() => onSelectTab('map')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <TreePine className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg md:text-xl text-white tracking-tight">خريطة ودليل إب</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  اللواء الأخضر
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                الدليل الرقمي المتكامل وعاصمة السياحة والسلام في اليمن
              </p>
            </div>
          </div>

          {/* Navigation Tabs Desktop */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all"
              title="أرقام طوارئ إب"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">طوارئ إب</span>
            </button>

            <button
              onClick={onDownloadAll}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/40"
              title="تنزيل كامل بيانات إب بصيغة JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تنزيل الكل</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2.5 border-t border-slate-900 no-scrollbar">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
