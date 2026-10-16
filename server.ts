import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { IBB_PLACES, IBB_STATS, CATEGORIES } from './src/data/ibbData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// System instruction containing ground-truth Ibb city database
const IBB_SYSTEM_INSTRUCTION = `
أنت المساعد الذكي وخبير الدليل الجغرافي الشامل لمدينة إب (عاصمة اللواء الأخضر في الجمهورية اليمنية).
مهمتك:
1. الإجابة بدقة وبأسلوب ودود وموثوق ومهني باللغة العربية على أي سؤال أو استفسار حول مدينة إب، معالمها، أحيائها، مستشفياتها، كلياتها، مطاعمها، أسواقها، فنادقها، فرزاتها ومواصلاتها، خدماتها الحكومية، ومحلات الصرافة.
2. تزويد السائل بالاسم الدقيق، الحي، العنوان التفصيلي، أرقام الهاتف إن وجدت، أوقات وساعات العمل، وأفضل الطرق للوصول.
3. التمييز بين أحياء إب الرئيسية مثل (الظهار، المشنة، المدينة القديمة، شارع العدين، شارع تعز، المعاين، الصلبة، مشورة، جبل بعدان، مفرق جبلة، السحول).
4. الرد بفقرات واضحة مع نقاط منسقة وتوجيهات عملية.

قاعدة بيانات المنشآت المتاحة في إب تشمل:
${IBB_PLACES.map(p => `- [${p.categoryLabel}] ${p.name} (${p.subcategory}) | الحي: ${p.district} | العنوان: ${p.address} | الهاتف: ${p.phone} | ساعات العمل: ${p.hours} | المميزات: ${p.features.join('، ')}`).join('\n')}

أرقام الطوارئ في إب:
- طوارئ هيئة مستشفى الثورة العام: 04-213401
- طوارئ الأمن والشرطة: 199
- طوارئ المرور: 194
- الدفاع المدني: 191
- مركز الأورام: 04-213999
- استعلامات الهاتف: 133
`;

// Helper local answer generator when Gemini API key is unavailable or fails
function generateLocalIbbAnswer(query: string): string {
  const q = query.toLowerCase();
  const matched = IBB_PLACES.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.address.toLowerCase().includes(q) ||
    p.district.toLowerCase().includes(q) ||
    p.categoryLabel.toLowerCase().includes(q) ||
    p.subcategory.toLowerCase().includes(q) ||
    p.services.some(s => s.toLowerCase().includes(q))
  );

  if (matched.length > 0) {
    const top = matched.slice(0, 4);
    let reply = `أهلاً بك في دليل مدينة إب الرقمي! بخصوص استفسارك، إليك أبرز النتائج المطابقة في إب:\n\n`;
    top.forEach((p, idx) => {
      reply += `**${idx + 1}. ${p.name}** (${p.subcategory})\n`;
      reply += `📍 **الحي والعنوان:** ${p.district} - ${p.address}\n`;
      reply += `📞 **هاتف التواصل:** ${p.phone}\n`;
      reply += `⏰ **ساعات العمل:** ${p.hours}\n`;
      reply += `ℹ️ **التفاصيل:** ${p.description}\n`;
      if (p.services.length) {
        reply += `✨ **الخدمات:** ${p.services.slice(0, 3).join(' | ')}\n`;
      }
      reply += `\n`;
    });
    return reply;
  }

  return `أهلاً بك في دليل مدينة إب (اللواء الأخضر). سؤالك حول "${query}" يهمنا، يمكنك البحث في أقسام الدليل (الصحة والمستشفيات، المعالم والسياحة كشلال المشنة وجبل بعدان، الأسواق في شارع العدين، مطاعم الشيباني، الفنادق، أو الفرزات ومحطات السفر). كما يمكنك الاطلاع على الخريطة التفاعلية لتحديد الموقع بدقة!`;
}

// API Routes
app.get('/api/places', (_req, res) => {
  res.json({
    places: IBB_PLACES,
    categories: CATEGORIES,
    stats: IBB_STATS
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction: IBB_SYSTEM_INSTRUCTION,
            temperature: 0.7,
          }
        });

        const reply = response.text || generateLocalIbbAnswer(message);
        res.json({ reply, source: 'gemini' });
        return;
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to local search engine:', geminiErr);
        const reply = generateLocalIbbAnswer(message);
        res.json({ reply, source: 'local_engine' });
        return;
      }
    } else {
      const reply = generateLocalIbbAnswer(message);
      res.json({ reply, source: 'local_engine' });
      return;
    }
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
});

// Vite Middleware integration for development / production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
