import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  MapPin, 
  Phone, 
  Clock, 
  HelpCircle, 
  RotateCcw, 
  Copy, 
  Check, 
  Navigation,
  Compass,
  ArrowRight
} from 'lucide-react';
import { IbbPlace } from '../data/ibbData';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  matchedPlaces?: IbbPlace[];
}

interface AiQueryAssistantProps {
  places: IbbPlace[];
  onSelectOnMap: (place: IbbPlace) => void;
}

const SUGGESTED_QUERIES = [
  'أقرب مستشفى طوارئ 24 ساعة في إب',
  'أشهر المطاعم الشعبية في شارع العدين والظهار',
  'كيف أصل لشلال المشنة وجبل بعدان؟',
  'عناوين وأرقام فروع بنك الكريمي للصرافة',
  'أين تقع فرزة صنعاء وفرزة تعز؟',
  'أماكن كليات ومجمعات جامعة إب',
  'مولات ومراكز التسوق الكبرى في إب',
  'أرقى الفنادق السياحية المطلة على السحاب'
];

export const AiQueryAssistant: React.FC<AiQueryAssistantProps> = ({ places, onSelectOnMap }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'مرحباً بك! أنا مساعد استعلامات مدينة إب الذكي (اللواء الأخضر) 🌿. تفضل بسؤالي عن أي محل تجاري، مستشفى، صيدلية، مطعم، فرزة سفر، أو فندق في إب وسأعطيك العنوان الدقيق، أرقام التواصل، وساعات العمل وأقرب طريق للوصول!',
      timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Find places matched by query keywords
  const findRelevantPlaces = (query: string): IbbPlace[] => {
    const q = query.toLowerCase();
    return places.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    ).slice(0, 3);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch from chat API');
      }

      const data = await res.json();
      const matched = findRelevantPlaces(query);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || 'تم استلام سؤالك عن مدينة إب.',
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        matchedPlaces: matched.length > 0 ? matched : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      // Robust client fallback
      const matched = findRelevantPlaces(query);
      let fallbackText = `أهلاً بك! بخصوص استفسارك عن "${query}" في إب:\n\n`;

      if (matched.length > 0) {
        matched.forEach((p, idx) => {
          fallbackText += `${idx + 1}. **${p.name}** (${p.subcategory})\n📍 الحي: ${p.district} - ${p.address}\n📞 هاتف: ${p.phone}\n⏰ الدوام: ${p.hours}\n\n`;
        });
      } else {
        fallbackText += `يمكنك البحث في أقسام الدليل الشامل أو عبر الخريطة التفاعلية للوصول المباشر للموقع.`;
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }),
        matchedPlaces: matched.length > 0 ? matched : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'تم مسح المحادثة. تفضل بطرح أي سؤال جديد عن مدينة إب ومواقعها ومحلاتها!',
        timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[760px]">
      {/* Sidebar: Suggested Questions & Fast FAQs */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-4 pb-3 border-b border-slate-800">
            <HelpCircle className="w-4 h-4" />
            <span>أسئلة شائعة واستعلامات سريعة</span>
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            اضغط على أي استفسار للحصول على إجابة تفصيلية وفورية:
          </p>

          <div className="space-y-2">
            {SUGGESTED_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="w-full text-right p-2.5 rounded-xl text-xs bg-slate-950/70 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 border border-slate-800/80 transition-all active:scale-98 flex items-center justify-between group"
              >
                <span className="line-clamp-2 leading-snug">{q}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 shrink-0 transform rotate-180" />
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={handleClearHistory}
            className="w-full py-2 px-3 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بدء استعلام جديد</span>
          </button>
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>المساعد الذكي لدليل إب</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h2>
              <p className="text-[11px] text-slate-400">
                متاح للإجابة الفورية عن المستشفيات، المحلات، المطاعم، الشوارع والخدمات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full font-medium">
              الذكاء الاصطناعي الجغرافي
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                  msg.sender === 'user'
                    ? 'bg-blue-600'
                    : 'bg-emerald-600 shadow-md shadow-emerald-900/20'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2 max-w-[85%] md:max-w-[75%]">
                <div
                  className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/80 shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                </div>

                {/* Attached Places cards if returned by AI matching */}
                {msg.matchedPlaces && msg.matchedPlaces.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      منشآت مطابقة يمكنك استعراضها فوراً:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.matchedPlaces.map(p => (
                        <div
                          key={p.id}
                          className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 shadow text-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="font-bold text-white text-xs mb-0.5">{p.name}</div>
                            <div className="text-[11px] text-emerald-400">{p.district} &bull; {p.subcategory}</div>
                            <div className="text-[11px] text-slate-400 mt-1 truncate">{p.address}</div>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center gap-1.5">
                            <button
                              onClick={() => onSelectOnMap(p)}
                              className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>الخريطة</span>
                            </button>
                            {p.phone && p.phone !== 'لا يوجد' && (
                              <a
                                href={`tel:${p.phone}`}
                                className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] flex items-center justify-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-blue-400" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer timestamp and copy */}
                <div className="flex items-center gap-2 text-[10px] text-slate-500 px-1">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-slate-300 transition-colors flex items-center gap-1"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>نسخ الإجابة</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-xl ml-auto">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="p-3.5 bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                <span className="text-xs text-slate-300">جاري فحص خريطة ودليل إب وصياغة الإجابة...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 md:p-4 bg-slate-950/90 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="اكتب سؤالك هنا (مثال: أين أجد أفضل مطعم لحم بلدي في إب، أو أقرب صيدلية بالظهار)..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-950/30 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4 transform rotate-180" />
            </button>
          </form>
          <div className="text-[10px] text-slate-500 mt-2 text-center">
            مدعوم بقاعدة بيانات إب الجغرافية الشاملة ومحرك الذكاء الاصطناعي من Google Gemini
          </div>
        </div>
      </div>
    </div>
  );
};
