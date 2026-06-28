// Harita Başlat
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
