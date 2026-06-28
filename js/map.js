// ============================================
// VERİ KAYNAKLARI
// ============================================

const DATA_SOURCES = [
  {
    name: 'Reddit Dreams',
    url: 'https://www.reddit.com/r/dreams+Dreams+Nightmare.json?limit=20',
    type: 'reddit'
  },
  {
    name: 'Tumblr Dreams',
    url: 'https://api.tumblr.com/v2/tagged?tag=dream&limit=20&api_key=BURAYA_API_KEY_YAPISTIR',
    type: 'tumblr'
  },
  {
    name: 'Reddit Nightmares',
    url: 'https://www.reddit.com/r/nightmares.json?limit=20',
    type: 'reddit'
  }
];

// CORS Proxy (Reddit için gerekli)
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// ============================================
// DİL TESPİTİ
// ============================================

function detectLanguage(text) {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';      // Arapça
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';      // Çince
  if (/[\u0900-\u097F]/.test(text)) return 'hi';      // Hintçe
  if (/[\u0100-\u024F]/.test(text)) return 'tr';      // Türkçe
  if (/[\u00C0-\u024F]/.test(text)) return 'es';      // İspanyolca
  return 'en';
}

// ============================================
// KONUM BELİRLEME
// ============================================

function getLocationForLanguage(lang) {
  const locations = {
    'en': { lat: 40.7128, lng: -74.0060, country: 'USA' },
    'tr': { lat: 41.0082, lng: 28.9784, country: 'Turkey' },
    'es': { lat: 40.4168, lng: -3.7038, country: 'Spain' },
    'ar': { lat: 24.7136, lng: 46.6753, country: 'Saudi Arabia' },
    'zh': { lat: 31.2304, lng: 121.4737, country: 'China' },
    'hi': { lat: 28.6139, lng: 77.2090, country: 'India' }
  };
  return locations[lang] || locations['en'];
}

// ============================================
// VERİ ÇEKME
// ============================================

async function fetchSingleSource(source) {
  try {
    let url = source.url;
    
    // Reddit için CORS proxy ekle
    if (source.type === 'reddit') {
      url = CORS_PROXY + encodeURIComponent(source.url);
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch from ${source.name}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const dreams = [];
    
    if (source.type === 'reddit' && data.data && data.data.children) {
      data.data.children.forEach(post => {
        const title = post.data.title || '';
        const selftext = post.data.selftext || '';
        const text = (title + ' ' + selftext).trim();
        
        if (text.length < 30) return; // Çok kısa rüyaları atla
        
        const lang = detectLanguage(text);
        const location = getLocationForLanguage(lang);
        
        dreams.push({
          id: `reddit-${post.data.id}`,
          text: text.substring(0, 500),
          symbol: detectSymbol(text),
          timestamp: new Date(post.data.created_utc * 1000).toISOString(),
          language: lang,
          lat: location.lat + (Math.random() - 0.5) * 2,
          lng: location.lng + (Math.random() - 0.5) * 2,
          country: location.country,
          source: source.name
        });
      });
    }
    
    if (source.type === 'tumblr' && data.response) {
      data.response.forEach(post => {
        let text = '';
        if (post.body) text = post.body;
        else if (post.caption) text = post.caption;
        else if (post.summary) text = post.summary;
        
        text = text.replace(/<[^>]*>/g, '').trim(); // HTML taglerini temizle
        
        if (text.length < 30) return;
        
        const lang = detectLanguage(text);
        const location = getLocationForLanguage(lang);
        
        dreams.push({
          id: `tumblr-${post.id}`,
          text: text.substring(0, 500),
          symbol: detectSymbol(text),
          timestamp: new Date(post.timestamp * 1000).toISOString(),
          language: lang,
          lat: location.lat + (Math.random() - 0.5) * 2,
          lng: location.lng + (Math.random() - 0.5) * 2,
          country: location.country,
          source: source.name
        });
      });
    }
    
    console.log(`✅ ${source.name}: ${dreams.length} dreams fetched`);
    return dreams;
    
  } catch (error) {
    console.warn(`❌ Error fetching from ${source.name}:`, error.message);
    return [];
  }
}

async function fetchAllDreams() {
  console.log('🔄 Fetching dreams from all sources...');
  
  const promises = DATA_SOURCES.map(source => fetchSingleSource(source));
  const results = await Promise.all(promises);
  
  const allDreams = results.flat();
  console.log(`✅ Total dreams fetched: ${allDreams.length}`);
  
  return allDreams;
}// Harita Başlat
const map = L.map('map').setView([39, 35], 4); // Türkiye merkezi

// OpenStreetMap Tile Layer (Ücretsiz)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
}).addTo(map);

// Sembol İkonları
const symbolIcons = {
    bear: { emoji: '🐻', color: '#8b5cf6' },
    door: { emoji: '🚪', color: '#3b82f6' },
    water: { emoji: '💧', color: '#06b6d4' },
    fall: { emoji: '⬇️', color: '#ef4444' },
    fly: { emoji: '🕊️', color: '#10b981' },
    default: { emoji: '🌙', color: '#6366f1' }
};

// Örnek Rüya Verileri (Şimdilik localStorage'dan, sonra Supabase'den)
function getSampleDreams() {
    const stored = JSON.parse(localStorage.getItem('dreams') || '[]');
    
    // Örnek veriler (gerçek uygulamada Supabase'den gelecek)
    const sampleData = [
        {
            id: 1,
            text: "Karanlık ormanda devasa bir ayı gördüm. Bana bakıyordu.",
            symbol: 'bear',
            lat: 41.0082,
            lng: 28.9784,
            country: 'Türkiye',
            timestamp: new Date().toISOString()
        },
        {
            id: 2,
            text: "Kapısız bir odada mahsur kalmıştım. Çıkış arıyordum.",
            symbol: 'door',
            lat: 40.7128,
            lng: -74.0060,
            country: 'ABD',
            timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 3,
            text: "Okyanusun üzerinde uçuyordum. Özgür hissediyordum.",
            symbol: 'fly',
            lat: 51.5074,
            lng: -0.1278,
            country: 'İngiltere',
            timestamp: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 4,
            text: "Suyun altında yürüyordum. Nefes alabiliyordum.",
            symbol: 'water',
            lat: 48.8566,
            lng: 2.3522,
            country: 'Fransa',
            timestamp: new Date(Date.now() - 259200000).toISOString()
        },
        {
            id: 5,
            text: "Merdivenlerden düşüyordum. Uçurum yoktu, ama korkuyordum.",
            symbol: 'fall',
            lat: 35.6762,
            lng: 139.6503,
            country: 'Japonya',
            timestamp: new Date().toISOString()
        },
        {
            id: 6,
            text: "Ayı beni kovalıyordu. Ormanın derinliklerine kaçıyordum.",
            symbol: 'bear',
            lat: 55.7558,
            lng: 37.6173,
            country: 'Rusya',
            timestamp: new Date(Date.now() - 43200000).toISOString()
        }
    ];
    
    return [...stored.map(d => ({
        ...d,
        symbol: detectSymbol(d.text),
        lat: 39 + (Math.random() - 0.5) * 10,
        lng: 35 + (Math.random() - 0.5) * 20,
        country: 'Türkiye'
    })), ...sampleData];
}

// Sembol Tespit (Basit AI - sonra Groq ile yapacağız)
function detectSymbol(text) {
    const lower = text.toLowerCase();
    if (lower.includes('ayı') || lower.includes('bear')) return 'bear';
    if (lower.includes('kapı') || lower.includes('door')) return 'door';
    if (lower.includes('su') || lower.includes('water') || lower.includes('deniz')) return 'water';
    if (lower.includes('düş') || lower.includes('fall')) return 'fall';
    if (lower.includes('uç') || lower.includes('fly')) return 'fly';
    return 'default';
}

// Harita Üzerine Rüya Ekle
let markers = [];
let allDreams = [];

function addDreamsToMap(dreams) {
    // Önceki markerları temizle
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    dreams.forEach(dream => {
        const iconData = symbolIcons[dream.symbol] || symbolIcons.default;
        
        // Özel İkon
        const icon = L.divIcon({
            className: 'dream-icon',
            html: `<div style="background: ${iconData.color}">${iconData.emoji}</div>`,
            iconSize: [30, 30]
        });
        
        // Marker
        const marker = L.marker([dream.lat, dream.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <div style="color: #1a1a2e; max-width: 250px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">${iconData.emoji}</div>
                    <p style="font-size: 14px; margin-bottom: 8px;">${dream.text}</p>
                    <small style="color: #666;">
                        📍 ${dream.country}<br>
                        🕐 ${new Date(dream.timestamp).toLocaleDateString('tr-TR')}
                    </small>
                </div>
            `);
        
        markers.push(marker);
    });
}

// Filtreleme
function filterDreams(symbol) {
    // Buton stillerini güncelle
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filtrele
    if (symbol === 'all') {
        addDreamsToMap(allDreams);
    } else {
        const filtered = allDreams.filter(d => d.symbol === symbol);
        addDreamsToMap(filtered);
    }
}

// İstatistikleri Güncelle
function updateStats(dreams) {
    document.getElementById('totalDreams').textContent = dreams.length;
    
    const countries = new Set(dreams.map(d => d.country));
    document.getElementById('totalCountries').textContent = countries.size;
    
    // En yaygın sembol
    const symbolCount = {};
    dreams.forEach(d => {
        symbolCount[d.symbol] = (symbolCount[d.symbol] || 0) + 1;
    });
    const topSymbol = Object.entries(symbolCount).sort((a, b) => b[1] - a[1])[0];
    if (topSymbol) {
        const iconData = symbolIcons[topSymbol[0]] || symbolIcons.default;
        document.getElementById('topSymbol').textContent = iconData.emoji;
    }
    
    // Bugünkü rüyalar
    const today = new Date().toDateString();
    const todayDreams = dreams.filter(d => new Date(d.timestamp).toDateString() === today);
    document.getElementById('todayDreams').textContent = todayDreams.length;
}

// Sayfa Yüklendiğinde
window.addEventListener('DOMContentLoaded', () => {
    allDreams = getSampleDreams();
    addDreamsToMap(allDreams);
    updateStats(allDreams);
});
