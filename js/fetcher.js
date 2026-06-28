// ============================================
// GLOBAL DREAM FETCHER
// ============================================

class DreamFetcher {
  constructor() {
    // CORS Proxy Fallback Zinciri
    this.corsProxies = [
      url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      url => `https://thingproxy.freeboard.io/fetch/${url}`
    ];

    // Global Kaynak Listesi (JSON, RSS, Reddit, Tumblr)
    // Yeni kaynak eklemek için bu array'e obje ekle
    this.sources = [
      // 🔴 Reddit (JSON)
      { name: 'Reddit r/dreams', url: 'https://www.reddit.com/r/dreams.json?limit=25', type: 'reddit', lang: 'en' },
      { name: 'Reddit r/nightmares', url: 'https://www.reddit.com/r/nightmares.json?limit=20', type: 'reddit', lang: 'en' },
      { name: 'Reddit r/LucidDreaming', url: 'https://www.reddit.com/r/LucidDreaming.json?limit=20', type: 'reddit', lang: 'en' },
      { name: 'Reddit r/DreamInterpretation', url: 'https://www.reddit.com/r/DreamInterpretation.json?limit=20', type: 'reddit', lang: 'en' },
      { name: 'Reddit r/SleepDreams', url: 'https://www.reddit.com/r/SleepDreams.json?limit=15', type: 'reddit', lang: 'en' },
      { name: 'Reddit r/Onirica', url: 'https://www.reddit.com/r/Onirica.json?limit=15', type: 'reddit', lang: 'es' },

      // 🌸 Tumblr (API)
      { name: 'Tumblr #dream', url: 'https://api.tumblr.com/v2/tagged?tag=dream&limit=20&api_key=BKdbsFYf3cjlEUktL2fwrJFnrEpUakEspXcRhCjy9K7M5uZtaN', type: 'tumblr', lang: 'en' },
      { name: 'Tumblr #nightmare', url: 'https://api.tumblr.com/v2/tagged?tag=nightmare&limit=20&api_key=BKdbsFYf3cjlEUktL2fwrJFnrEpUakEspXcRhCjy9K7M5uZtaN', type: 'tumblr', lang: 'en' },
      { name: 'Tumblr #sueños', url: 'https://api.tumblr.com/v2/tagged?tag=sue%C3%B1os&limit=15&api_key=BKdbsFYf3cjlEUktL2fwrJFnrEpUakEspXcRhCjy9K7M5uZtaN', type: 'tumblr', lang: 'es' },
      { name: 'Tumblr #rüya', url: 'https://api.tumblr.com/v2/tagged?tag=r%C3%BCya&limit=15&api_key=BKdbsFYf3cjlEUktL2fwrJFnrEpUakEspXcRhCjy9K7M5uZtaN', type: 'tumblr', lang: 'tr' },

      // 🌍 RSS/Atom Feed (Dream Forumları & Bloglar)
      // WordPress: /feed/, phpBB/Discourse: genellikle /rss veya /feeds/ endpoint
      { name: 'DreamInterpretation.com RSS', url: 'https://www.dreaminterpretation.com/feed/', type: 'rss', lang: 'en' },
      { name: 'DreamMoods RSS', url: 'https://www.dreammoods.com/rss/dreams.xml', type: 'rss', lang: 'en' },
      { name: 'DreamBoard RSS', url: 'https://www.dreamboard.org/feeds/recent.xml', type: 'rss', lang: 'en' },
      { name: 'Reddit r/dreams RSS', url: 'https://www.reddit.com/r/dreams/.rss', type: 'rss', lang: 'en' },
      { name: 'DreamJournal.net RSS', url: 'https://dreamjournal.net/feed/', type: 'rss', lang: 'en' },
      { name: 'Sueños RSS (ES)', url: 'https://www.interpretaciondesuenos.com/feed/', type: 'rss', lang: 'es' },
      { name: 'Rüya Yorumları RSS (TR)', url: 'https://ruyatabiri.org/feed/', type: 'rss', lang: 'tr' },
      { name: 'Traumdeutung RSS (DE)', url: 'https://www.traumdeutung.org/feed/', type: 'rss', lang: 'de' },
      { name: 'Interprétation des rêves RSS (FR)', url: 'https://www.signification-reves.com/feed/', type: 'rss', lang: 'fr' },
      { name: '夢占い RSS (JP)', url: 'https://www.yume-uranai.com/feed/', type: 'rss', lang: 'ja' },

      // 📦 Diğer Açık JSON/Text Endpoint'ler
      { name: 'DreamBank Archive', url: 'https://dreambank.net/random.json', type: 'json', lang: 'en' }
    ];

    this.maxDreamsPerSource = 25; // Her kaynaktan max bu kadar rüya al
  }

  // ==========================================
  // CORS PROXY & FETCH ALTYAPISI
  // ==========================================

  async fetchWithProxy(url) {
    for (const proxyFn of this.corsProxies) {
      try {
        const proxyUrl = proxyFn(url);
        const res = await fetch(proxyUrl, { 
          signal: AbortSignal.timeout(12000),
          headers: { 'Accept': 'application/json, application/xml, text/html, text/plain' }
        });
        
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('json')) return { format: 'json', data: await res.json() };
          if (contentType.includes('xml') || contentType.includes('rss')) return { format: 'xml', data: await res.text() };
          return { format: 'html', data: await res.text() };
        }
      } catch (e) { continue; }
    }
    throw new Error('All proxies failed');
  }

  async retryFetch(url, attempts = 2) {
    for (let i = 0; i < attempts; i++) {
      try { return await this.fetchWithProxy(url); } 
      catch (e) { if (i === attempts - 1) throw e; }
    }
  }

  // ==========================================
  // DİL, KONUM, SEMBOL TESPİTİ
  // ==========================================

  detectLanguage(text) {
    if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) return 'ar';
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    if (/[\u0100-\u024F]/.test(text)) return 'tr';
    if (/[\u00C0-\u017F]/.test(text) && /\b(el|la|de|en|que|por|con)\b/.test(text)) return 'es';
    if (/[\u00C0-\u017F]/.test(text) && /\b(der|die|das|und|in|auf)\b/.test(text)) return 'de';
    if (/[\u00C0-\u017F]/.test(text) && /\b(le|la|les|et|dans|de)\b/.test(text)) return 'fr';
    return 'en';
  }

  getLocationForLanguage(lang) {
    const map = {
      'en': [{ lat: 40.7, lng: -74.0, country: 'USA' }, { lat: 51.5, lng: -0.1, country: 'UK' }, { lat: -33.9, lng: 151.2, country: 'Australia' }],
      'tr': [{ lat: 41.0, lng: 28.9, country: 'Turkey' }, { lat: 39.9, lng: 32.8, country: 'Turkey' }],
      'es': [{ lat: 40.4, lng: -3.7, country: 'Spain' }, { lat: 19.4, lng: -99.1, country: 'Mexico' }, { lat: -34.6, lng: -58.4, country: 'Argentina' }],
      'ar': [{ lat: 24.7, lng: 46.7, country: 'Saudi Arabia' }, { lat: 30.0, lng: 31.2, country: 'Egypt' }],
      'zh': [{ lat: 31.2, lng: 121.5, country: 'China' }, { lat: 25.0, lng: 121.5, country: 'Taiwan' }],
      'hi': [{ lat: 28.6, lng: 77.2, country: 'India' }],
      'ja': [{ lat: 35.7, lng: 139.7, country: 'Japan' }],
      'ko': [{ lat: 37.6, lng: 127.0, country: 'South Korea' }],
      'ru': [{ lat: 55.8, lng: 37.6, country: 'Russia' }],
      'de': [{ lat: 52.5, lng: 13.4, country: 'Germany' }],
      'fr': [{ lat: 48.9, lng: 2.3, country: 'France' }]
    };
    const opts = map[lang] || map['en'];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  detectSymbol(text) {
    const dict = {
      'water': /water|ocean|sea|river|lake|swim|drown|wave|flood|rain|tsunami|su|deniz|nehir/gi,
      'flying': /fly|flying|float|air|sky|wing|levitate|hover|uç|gökyüzü/gi,
      'falling': /fall|falling|drop|cliff|plunge|abyss|düş/gi,
      'chase': /chase|chased|running|escape|pursue|hunt|kaç|koş|takip/gi,
      'teeth': /teeth|tooth|dentist|bite|fang|diş/gi,
      'naked': /naked|nude|undressed|clothes|embarrassed|çıplak|soyun/gi,
      'exam': /exam|test|school|class|teacher|homework|sınav|okul/gi,
      'snake': /snake|serpent|python|cobra|viper|yılan|engerek/gi,
      'death': /death|dead|die|funeral|grave|ghost|spirit|ölüm|mezar|hayalet/gi,
      'money': /money|cash|gold|rich|coin|treasure|para|altın|hazine/gi,
      'animal': /dog|cat|horse|bird|bear|wolf|lion|tiger|köpek|kedi|at|kuş|ayı|kurt|aslan|kaplan/gi,
      'house': /house|home|room|door|window|building|castle|ev|oda|kapı|pencere/gi,
      'car': /car|drive|vehicle|road|highway|crash|araba|otoyol|kaza/gi,
      'fire': /fire|flame|burn|smoke|heat|ateş|yangın|duman/gi,
      'love': /love|kiss|romance|partner|wedding|marriage|aşk|öpücük|evlilik/gi
    };
    for (const [k, v] of Object.entries(dict)) if (v.test(text)) return k;
    return 'other';
  }

  // ==========================================
  // FORMAT PARSER'LARI
  // ==========================================

  parseReddit(data, source) {
    if (!data?.data?.children) return [];
    return data.data.children
      .filter(p => p.data && !p.data.stickied && p.data.is_self !== false)
      .slice(0, this.maxDreamsPerSource)
      .map(p => {
        const txt = (p.data.title || '') + ' ' + (p.data.selftext || '');
        if (txt.length < 25) return null;
        const lang = source.lang || this.detectLanguage(txt);
        const loc = this.getLocationForLanguage(lang);
        return {
          id: `reddit-${p.data.id}`,
          text: txt.trim().substring(0, 600),
          symbol: this.detectSymbol(txt),
          timestamp: new Date(p.data.created_utc * 1000).toISOString(),
          language: lang,
          lat: loc.lat + (Math.random() - 0.5) * 3,
          lng: loc.lng + (Math.random() - 0.5) * 3,
          country: loc.country,
          source: source.name
        };
      }).filter(Boolean);
  }

  parseTumblr(data, source) {
    if (!data?.response) return [];
    return data.response
      .slice(0, this.maxDreamsPerSource)
      .map(p => {
        const txt = (p.body || p.caption || p.summary || p.description || '').replace(/<[^>]+>/g, '');
        if (txt.length < 25) return null;
        const lang = source.lang || this.detectLanguage(txt);
        const loc = this.getLocationForLanguage(lang);
        return {
          id: `tumblr-${p.id}`,
          text: txt.trim().substring(0, 600),
          symbol: this.detectSymbol(txt),
          timestamp: new Date(p.timestamp * 1000).toISOString(),
          language: lang,
          lat: loc.lat + (Math.random() - 0.5) * 3,
          lng: loc.lng + (Math.random() - 0.5) * 3,
          country: loc.country,
          source: source.name
        };
      }).filter(Boolean);
  }

  parseRSS(xmlString, source) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, "text/xml");
      const items = doc.querySelectorAll("item, entry");
      const results = [];

      for (let i = 0; i < items.length && i < this.maxDreamsPerSource; i++) {
        const el = items[i];
        const title = el.querySelector("title")?.textContent || '';
        const desc = el.querySelector("description, summary, content")?.textContent || '';
        const txt = (title + ' ' + desc).replace(/<[^>]+>/g, '').trim();
        if (txt.length < 25) continue;

        const pubDate = el.querySelector("pubDate, updated, published")?.textContent;
        const ts = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
        const lang = source.lang || this.detectLanguage(txt);
        const loc = this.getLocationForLanguage(lang);

        results.push({
          id: `rss-${source.name}-${i}-${Date.now()}`,
          text: txt.substring(0, 600),
          symbol: this.detectSymbol(txt),
          timestamp: ts,
          language: lang,
          lat: loc.lat + (Math.random() - 0.5) * 3,
          lng: loc.lng + (Math.random() - 0.5) * 3,
          country: loc.country,
          source: source.name
        });
      }
      return results;
    } catch (e) {
      console.warn(`RSS Parse Error (${source.name}):`, e);
      return [];
    }
  }

  parseJSON(data, source) {
    // Generic JSON: array of objects veya { dreams: [...] } yapısını tahmin et
    const arr = Array.isArray(data) ? data : (data.dreams || data.entries || data.posts || []);
    if (!Array.isArray(arr)) return [];
    
    return arr.slice(0, this.maxDreamsPerSource).map((item, idx) => {
      const txt = item.text || item.body || item.content || item.title || '';
      if (!txt || txt.length < 25) return null;
      const lang = source.lang || this.detectLanguage(txt);
      const loc = this.getLocationForLanguage(lang);
      return {
        id: `json-${source.name}-${idx}`,
        text: txt.substring(0, 600),
        symbol: this.detectSymbol(txt),
        timestamp: item.date || item.timestamp || new Date().toISOString(),
        language: lang,
        lat: loc.lat + (Math.random() - 0.5) * 3,
        lng: loc.lng + (Math.random() - 0.5) * 3,
        country: loc.country,
        source: source.name
      };
    }).filter(Boolean);
  }

  // ==========================================
  // ANA AKIŞ
  // ==========================================

  async processSource(source) {
    try {
      const { format, data } = await this.retryFetch(source.url);
      let dreams = [];

      switch (source.type) {
        case 'reddit': dreams = this.parseReddit(data, source); break;
        case 'tumblr': dreams = this.parseTumblr(data, source); break;
        case 'rss': dreams = this.parseRSS(data, source); break;
        case 'json': dreams = this.parseJSON(data, source); break;
        default: throw new Error('Unknown source type');
      }

      console.log(`✅ ${source.name}: ${dreams.length} dreams (${format})`);
      return dreams;
    } catch (err) {
      console.warn(`❌ ${source.name}: ${err.message}`);
      return [];
    }
  }

  async fetchAndArchive() {
    console.log('🌍 Fetching global dreams...');
    let allDreams = [];
    const batchSize = 2; // Proxy yorulmasın diye 2'li batch

    for (let i = 0; i < this.sources.length; i += batchSize) {
      const batch = this.sources.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(s => this.processSource(s)));
      allDreams.push(...results.flat());

      if (i + batchSize < this.sources.length) {
        await new Promise(r => setTimeout(r, 800)); // Rate limit koruması
      }
    }

    // Deduplication & Archive
    const added = dreamArchive.addMany(allDreams);
    console.log(`📦 Total fetched: ${allDreams.length} | 🆕 New to archive: ${added}`);
    return { fetched: allDreams.length, added };
  }

  async initialLoad() {
    if (dreamArchive.getAll().length === 0) {
      console.log('🚀 First run: loading global dream database...');
      await this.fetchAndArchive();
    }
  }
}

// Global instance
const dreamFetcher = new DreamFetcher();
