import React from 'react';
import { Phone, ShieldAlert, X, AlertTriangle, Hospital, Flame, Car, Droplet } from 'lucide-react';
import { IBB_STATS } from '../data/ibbData';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">أرقام وطوارئ محافظة إب</h2>
              <p className="text-xs text-slate-400">اتصال فوري ومباشر بالخدمات الطارئة على مدار 24 ساعة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Numbers List */}
        <div className="space-y-2.5 mt-5 max-h-[60vh] overflow-y-auto pr-1">
          {IBB_STATS.emergencyHotlines.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800 hover:border-rose-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-colors"
            >
              <div>
                <span className="font-bold text-sm text-white block">{item.label}</span>
                <span className="text-xs text-slate-400">{item.desc}</span>
              </div>
              <a
                href={`tel:${item.number}`}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-colors shrink-0 shadow-lg shadow-rose-950/30"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{item.number}</span>
              </a>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
