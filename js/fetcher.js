// ============================================
// 🌐 DREAM FETCHER - GLOBAL VERİ TOPLAYICI
// ============================================

window.DreamFetcher = {
    corsProxies: [
        url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ],
    
    sources: [
        { name: 'Reddit r/dreams', url: 'https://www.reddit.com/r/dreams.json?limit=20', type: 'reddit' },
        { name: 'Reddit r/nightmares', url: 'https://www.reddit.com/r/nightmares.json?limit=15', type: 'reddit' },
        { name: 'Reddit r/LucidDreaming', url: 'https://www.reddit.com/r/LucidDreaming.json?limit=15', type: 'reddit' },
        { name: 'Reddit r/DreamInterpretation', url: 'https://www.reddit.com/r/DreamInterpretation.json?limit=15', type: 'reddit' },
        { name: 'Tumblr #dream', url: 'https://api.tumblr.com/v2/tagged?tag=dream&limit=15&api_key=BKdbsFYf3cjlEUktL2fwrJFnrEpUakEspXcRhCjy9K7M5uZtaN', type: 'tumblr' },
        { name: 'Tumblr #nightmare', url: 'https://api.tumblr.com/v2/tagged?tag=nightmare&limit=15&api_key=BKdbsFYf3cjlEUktL2fwrJFnrEpUakEspXcRhCjy9K7M5uZtaN', type: 'tumblr' }
    ],
    
    // Sembol emoji mapping
    symbolEmojis: {
        'water': '🌊', 'flying': '🕊️', 'falling': '⬇️', 'chase': '🏃',
        'teeth': '🦷', 'naked': '👤', 'exam': '📝', 'snake': '🐍',
        'death': '💀', 'money': '💰', 'animal': '🐾', 'house': '🏠',
        'car': '🚗', 'fire': '🔥', 'love': '💕', 'other': '🌙'
    },
    
    // CORS proxy ile fetch
    async fetchWithProxy(url) {
        for (const proxyFn of this.corsProxies) {
            try {
                const res = await fetch(proxyFn(url), { 
                    signal: AbortSignal.timeout(10000)
                });
                if (res.ok) return await res.json();
            } catch (e) { continue; }
        }
        throw new Error('All proxies failed');
    },
    
    // Dil tespiti
    detectLanguage(text) {
        if (/[\u0600-\u06FF]/.test(text)) return 'ar';
        if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
        if (/[\u0900-\u097F]/.test(text)) return 'hi';
        if (/[\u3040-\u309F]/.test(text)) return 'ja';
        if (/[\u0400-\u04FF]/.test(text)) return 'ru';
        if (/[çğıöşüÇĞİÖŞÜ]/.test(text)) return 'tr';
        if (/[ñáéíóúÑÁÉÍÓÚ]/.test(text)) return 'es';
        return 'en';
    },
    
    // Konum belirleme
    getLocationForLanguage(lang) {
        const map = {
            'en': [{ lat: 40.7, lng: -74.0, country: 'United States' }, { lat: 51.5, lng: -0.1, country: 'United Kingdom' }],
            'tr': [{ lat: 41.0, lng: 28.9, country: 'Turkey' }],
            'es': [{ lat: 40.4, lng: -3.7, country: 'Spain' }, { lat: 19.4, lng: -99.1, country: 'Mexico' }],
            'ar': [{ lat: 24.7, lng: 46.7, country: 'Saudi Arabia' }, { lat: 30.0, lng: 31.2, country: 'Egypt' }],
            'zh': [{ lat: 31.2, lng: 121.5, country: 'China' }],
            'hi': [{ lat: 28.6, lng: 77.2, country: 'India' }],
            'ja': [{ lat: 35.7, lng: 139.7, country: 'Japan' }],
            'ru': [{ lat: 55.8, lng: 37.6, country: 'Russia' }]
        };
        const opts = map[lang] || map['en'];
        return opts[Math.floor(Math.random() * opts.length)];
    },
    
    // Sembol tespiti
    detectSymbol(text) {
        const dict = {
            'water': /water|ocean|sea|river|lake|swim|drown|wave|flood|rain|su|deniz|nehir/gi,
            'flying': /fly|flying|float|air|sky|wing|levitate|uç|gökyüzü/gi,
            'falling': /fall|falling|drop|cliff|plunge|düş/gi,
            'chase': /chase|chased|running|escape|pursue|hunt|kaç|takip/gi,
            'teeth': /teeth|tooth|dentist|bite|diş/gi,
            'naked': /naked|nude|undressed|clothes|çıplak/gi,
            'exam': /exam|test|school|class|teacher|sınav|okul/gi,
            'snake': /snake|serpent|python|cobra|yılan/gi,
            'death': /death|dead|die|funeral|grave|ölüm|mezar/gi,
            'money': /money|cash|gold|rich|coin|para|altın/gi,
            'animal': /dog|cat|horse|bird|bear|wolf|köpek|kedi|at|kuş/gi,
            'house': /house|home|room|door|window|ev|oda|kapı/gi,
            'car': /car|drive|vehicle|road|araba|otoyol/gi,
            'fire': /fire|flame|burn|smoke|ateş|yangın/gi,
            'love': /love|kiss|romance|wedding|aşk|evlilik/gi
        };
        for (const [k, v] of Object.entries(dict)) if (v.test(text)) return k;
        return 'other';
    },
    
    // Rüya objesi oluştur (symbols array formatında)
    createDreamObject(id, text, timestamp, source, lang, location) {
        const symbol = this.detectSymbol(text);
        return {
            id: id,
            text: text.substring(0, 600),
            symbol: symbol,
            symbols: [{
                name: symbol,
                emoji: this.symbolEmojis[symbol] || '🌙',
                imageUrl: ''
            }],
            timestamp: timestamp,
            language: lang,
            lat: location.lat + (Math.random() - 0.5) * 3,
            lng: location.lng + (Math.random() - 0.5) * 3,
            country: location.country,
            source: source
        };
    },
    
    // Reddit parse
    parseReddit(data, source) {
        if (!data?.data?.children) return [];
        return data.data.children
            .filter(p => p.data && !p.data.stickied && (p.data.is_self !== false || p.data.selftext))
            .slice(0, 20)
            .map(p => {
                const txt = ((p.data.title || '') + ' ' + (p.data.selftext || '')).trim();
                if (txt.length < 30) return null;
                const lang = this.detectLanguage(txt);
                const loc = this.getLocationForLanguage(lang);
                return this.createDreamObject(
                    `reddit-${p.data.id}`,
                    txt,
                    new Date(p.data.created_utc * 1000).toISOString(),
                    source.name,
                    lang,
                    loc
                );
            }).filter(Boolean);
    },
    
    // Tumblr parse
    parseTumblr(data, source) {
        if (!data?.response) return [];
        return data.response.slice(0, 15).map(p => {
            const txt = (p.body || p.caption || p.summary || '').replace(/<[^>]+>/g, '').trim();
            if (txt.length < 30) return null;
            const lang = this.detectLanguage(txt);
            const loc = this.getLocationForLanguage(lang);
            return this.createDreamObject(
                `tumblr-${p.id}`,
                txt,
                new Date(p.timestamp * 1000).toISOString(),
                source.name,
                lang,
                loc
            );
        }).filter(Boolean);
    },
    
    // Tek kaynak işle
    async processSource(source) {
        try {
            const data = await this.fetchWithProxy(source.url);
            let dreams = [];
            if (source.type === 'reddit') dreams = this.parseReddit(data, source);
            else if (source.type === 'tumblr') dreams = this.parseTumblr(data, source);
            console.log(`✅ ${source.name}: ${dreams.length} dreams`);
            return dreams;
        } catch (err) {
            console.warn(`❌ ${source.name}: ${err.message}`);
            return [];
        }
    },
    
    // Tüm kaynakları çek ve arşive kaydet
    async fetchAndArchive() {
        console.log('🌍 Fetching dreams from global sources...');
        let allDreams = [];
        
        for (const source of this.sources) {
            const dreams = await this.processSource(source);
            allDreams.push(...dreams);
            await new Promise(r => setTimeout(r, 400)); // Rate limit
        }
        
        const added = window.DreamArchive.addManyDreams(allDreams);
        console.log(`📦 Fetched: ${allDreams.length} | Added: ${added}`);
        return { fetched: allDreams.length, added };
    },
    
    // İlk yükleme
    async initialLoad() {
        const archive = window.DreamArchive.getAllDreams();
        if (archive.length === 0) {
            console.log('🚀 First run: loading initial dreams...');
            await this.fetchAndArchive();
        }
    }
};
