// ============================================
// 🌐 DREAM FETCHER - AI SEMBOL ÇIKARMA + GLOBAL VERİ
// ============================================

window.DreamFetcher = {
    corsProxies: [
        url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ],
    
    sources: [
        { name: 'Reddit r/dreams', url: 'https://www.reddit.com/r/dreams.json?limit=15', type: 'reddit' },
        { name: 'Reddit r/nightmares', url: 'https://www.reddit.com/r/nightmares.json?limit=10', type: 'reddit' },
        { name: 'Reddit r/LucidDreaming', url: 'https://www.reddit.com/r/LucidDreaming.json?limit=10', type: 'reddit' },
        { name: 'Tumblr #dream', url: 'https://api.tumblr.com/v2/tagged?tag=dream&limit=10&api_key=BURAYA_TUMBLR_API_KEY_YAPISTIR', type: 'tumblr' },
        { name: 'Tumblr #nightmare', url: 'https://api.tumblr.com/v2/tagged?tag=nightmare&limit=10&api_key=BURAYA_TUMBLR_API_KEY_YAPISTIR', type: 'tumblr' }
    ],
    
    // ==========================================
    // 🤖 AI SEMBOL ÇIKARMA (Groq API)
    // ==========================================
    
    async extractSymbolsWithAI(dreams) {
        const apiKey = localStorage.getItem('groq_api_key');
        if (!apiKey) {
            console.warn('⚠️ Groq API key yok, fallback semboller kullanılıyor');
            return dreams.map(d => ({
                ...d,
                symbol: d.symbol || this.detectSymbol(d.text),
                symbols: [{
                    name: d.symbol || this.detectSymbol(d.text),
                    emoji: this.symbolEmojis[d.symbol || 'other'],
                    imageUrl: '',
                    description: 'AI extraction unavailable'
                }]
            }));
        }
        
        // Batch halinde AI'ya gönder (her 5 rüya için 1 çağrı)
        const processedDreams = [];
        const batchSize = 5;
        
        for (let i = 0; i < dreams.length; i += batchSize) {
            const batch = dreams.slice(i, i + batchSize);
            const aiSymbols = await this._callAIForBatch(apiKey, batch);
            
            batch.forEach((dream, idx) => {
                const aiResult = aiSymbols[idx];
                const fallbackSymbol = this.detectSymbol(dream.text);
                
                processedDreams.push({
                    ...dream,
                    symbol: aiResult?.name || fallbackSymbol,
                    symbols: [{
                        name: aiResult?.name || fallbackSymbol,
                        emoji: aiResult?.emoji || this.symbolEmojis[fallbackSymbol] || '🌙',
                        imageUrl: aiResult?.imageUrl || '',
                        description: aiResult?.description || 'Dream symbol'
                    }]
                });
            });
            
            console.log(`🤖 AI extracted symbols for batch ${Math.floor(i/batchSize)+1}`);
            await new Promise(r => setTimeout(r, 300)); // Rate limit
        }
        
        return processedDreams;
    },
    
    async _callAIForBatch(apiKey, batch) {
        const dreamsText = batch.map((d, i) => `[${i}] ${d.text.substring(0, 300)}`).join('\n\n');
        
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a dream symbol analyst. For each dream, extract ONE primary symbol.

Return ONLY a JSON array (no markdown, no explanation).
Format: [{"name": "symbol_name", "emoji": "🌊", "description": "brief meaning"}]

Symbol names should be short (1-2 words): water, flying, falling, chase, teeth, naked, exam, snake, death, money, animal, house, car, fire, love, other.

Always return exactly ${batch.length} items in the array, matching input order.`
                        },
                        {
                            role: 'user',
                            content: `Analyze these dreams:\n\n${dreamsText}`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });
            
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            
            const content = data.choices[0].message.content.trim();
            // JSON parse (markdown temizle)
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        } catch (err) {
            console.warn('⚠️ AI extraction failed:', err.message);
            return [];
        }
    },
    
    // ==========================================
    // FETCHER ALTYAPI
    // ==========================================
    
    symbolEmojis: {
        'water': '🌊', 'flying': '🕊️', 'falling': '⬇️', 'chase': '🏃',
        'teeth': '🦷', 'naked': '👤', 'exam': '📝', 'snake': '🐍',
        'death': '💀', 'money': '💰', 'animal': '🐾', 'house': '🏠',
        'car': '🚗', 'fire': '🔥', 'love': '💕', 'other': '🌙'
    },
    
    async fetchWithProxy(url) {
        for (const proxyFn of this.corsProxies) {
            try {
                const res = await fetch(proxyFn(url), { signal: AbortSignal.timeout(10000) });
                if (res.ok) return await res.json();
            } catch (e) { continue; }
        }
        throw new Error('All proxies failed');
    },
    
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
    
    detectSymbol(text) {
        const dict = {
            'water': /water|ocean|sea|river|lake|swim|drown|wave|flood|rain|su|deniz/gi,
            'flying': /fly|flying|float|air|sky|wing|uç|gökyüzü/gi,
            'falling': /fall|falling|drop|cliff|plunge|düş/gi,
            'chase': /chase|chased|running|escape|kaç|takip/gi,
            'teeth': /teeth|tooth|dentist|diş/gi,
            'naked': /naked|nude|undressed|çıplak/gi,
            'exam': /exam|test|school|sınav|okul/gi,
            'snake': /snake|serpent|yılan/gi,
            'death': /death|dead|die|funeral|ölüm|mezar/gi,
            'money': /money|cash|gold|para|altın/gi,
            'animal': /dog|cat|horse|bird|köpek|kedi|at|kuş/gi,
            'house': /house|home|room|door|ev|oda|kapı/gi,
            'car': /car|drive|vehicle|araba/gi,
            'fire': /fire|flame|burn|ateş|yangın/gi,
            'love': /love|kiss|romance|aşk|evlilik/gi
        };
        for (const [k, v] of Object.entries(dict)) if (v.test(text)) return k;
        return 'other';
    },
    
    createDreamObject(id, text, timestamp, source, lang, location) {
        const symbol = this.detectSymbol(text);
        return {
            id, text: text.substring(0, 600), symbol,
            symbols: [{ name: symbol, emoji: this.symbolEmojis[symbol] || '🌙', imageUrl: '', description: '' }],
            timestamp, language: lang,
            lat: location.lat + (Math.random() - 0.5) * 3,
            lng: location.lng + (Math.random() - 0.5) * 3,
            country: location.country, source
        };
    },
    
    parseReddit(data, source) {
        if (!data?.data?.children) return [];
        return data.data.children
            .filter(p => p.data && !p.data.stickied && (p.data.is_self !== false || p.data.selftext))
            .slice(0, 15)
            .map(p => {
                const txt = ((p.data.title || '') + ' ' + (p.data.selftext || '')).trim();
                if (txt.length < 30) return null;
                const lang = this.detectLanguage(txt);
                const loc = this.getLocationForLanguage(lang);
                return this.createDreamObject(`reddit-${p.data.id}`, txt, new Date(p.data.created_utc * 1000).toISOString(), source.name, lang, loc);
            }).filter(Boolean);
    },
    
    parseTumblr(data, source) {
        if (!data?.response) return [];
        return data.response.slice(0, 10).map(p => {
            const txt = (p.body || p.caption || p.summary || '').replace(/<[^>]+>/g, '').trim();
            if (txt.length < 30) return null;
            const lang = this.detectLanguage(txt);
            const loc = this.getLocationForLanguage(lang);
            return this.createDreamObject(`tumblr-${p.id}`, txt, new Date(p.timestamp * 1000).toISOString(), source.name, lang, loc);
        }).filter(Boolean);
    },
    
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
    
    // ==========================================
    // ANA FONKSİYONLAR
    // ==========================================
    
    async fetchAndArchive() {
        console.log('🌍 Fetching dreams from global sources...');
        let allDreams = [];
        
        for (const source of this.sources) {
            const dreams = await this.processSource(source);
            allDreams.push(...dreams);
            await new Promise(r => setTimeout(r, 400));
        }
        
        console.log(`📦 Raw dreams: ${allDreams.length}`);
        
        // 🤖 AI SEMBOL ÇIKARMA
        if (allDreams.length > 0) {
            console.log('🤖 Running AI symbol extraction...');
            allDreams = await this.extractSymbolsWithAI(allDreams);
        }
        
        const added = window.DreamArchive.addManyDreams(allDreams);
        console.log(`✅ Final: ${allDreams.length} fetched, ${added} new added`);
        return { fetched: allDreams.length, added };
    },
    
    async initialLoad() {
        const archive = window.DreamArchive.getAllDreams();
        if (archive.length === 0) {
            console.log('🚀 First run: loading initial dreams...');
            await this.fetchAndArchive();
        } else {
            console.log(`📚 Archive already has ${archive.length} dreams`);
        }
    }
};

console.log('✅ DreamFetcher initialized (with AI symbol extraction)');            } catch (e) { continue; }
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
