// ============================================
// HARİTA VE GÖRSELLEŞTİRME
// ============================================

let map;
let markers = [];

// Haritayı başlat
function initMap() {
  map = L.map('map').setView([20, 0], 2);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
}

// Rüyaları haritaya ekle
function addDreamsToMap(dreams) {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  dreams.forEach(dream => {
    const marker = L.circleMarker([dream.lat, dream.lng], {
      radius: 8,
      fillColor: getSymbolColor(dream.symbol),
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map);

    marker.bindPopup(`
      <div class="dream-popup">
        <strong>${dream.country}</strong><br>
        <em>${dream.language.toUpperCase()}</em><br>
        <p>${dream.text.substring(0, 200)}...</p>
        <small>Sembol: ${dream.symbol} | Kaynak: ${dream.source}</small><br>
        <small>${new Date(dream.timestamp).toLocaleString('tr-TR')}</small>
      </div>
    `);

    markers.push(marker);
  });
}

// Sembol rengi
function getSymbolColor(symbol) {
  const colors = {
    'water': '#3498db',
    'flying': '#9b59b6',
    'falling': '#e74c3c',
    'chase': '#e67e22',
    'teeth': '#f39c12',
    'naked': '#1abc9c',
    'exam': '#34495e',
    'snake': '#27ae60',
    'death': '#2c3e50',
    'money': '#f1c40f',
    'animal': '#d35400',
    'house': '#8e44ad',
    'car': '#c0392b',
    'fire': '#e74c3c',
    'love': '#e91e63',
    'other': '#95a5a6'
  };
  return colors[symbol] || colors['other'];
}

// İstatistikleri güncelle
function updateStats() {
  const stats = dreamArchive.getStats();
  
  document.getElementById('totalDreams').textContent = stats.totalDreams;
  document.getElementById('totalCountries').textContent = stats.totalCountries;
  document.getElementById('totalLanguages').textContent = stats.totalLanguages;
  document.getElementById('commonSymbol').textContent = stats.mostCommonSymbol || '-';
}

// Canlı akışı güncelle
function updateLiveFeed() {
  const feed = document.getElementById('dreamFeed');
  feed.innerHTML = '';

  const archive = dreamArchive.getAll();
  const recentDreams = archive
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 15);

  recentDreams.forEach(dream => {
    const item = document.createElement('div');
    item.className = 'dream-feed-item';
    item.innerHTML = `
      <div class="dream-meta">
        <span class="dream-country">📍 ${dream.country}</span>
        <span class="dream-language">${dream.language.toUpperCase()}</span>
        <span class="dream-source">${dream.source}</span>
      </div>
      <div class="dream-text">${dream.text.substring(0, 180)}...</div>
      <div class="dream-footer">
        <span class="dream-symbol">🔮 ${dream.symbol}</span>
        <span class="dream-time">${formatTime(dream.timestamp)}</span>
      </div>
    `;
    feed.appendChild(item);
  });
}

// Zaman formatı
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

// Tüm UI'ı güncelle
function updateUI() {
  const archive = dreamArchive.getAll();
  addDreamsToMap(archive);
  updateStats();
  updateLiveFeed();
}

// ============================================
// MODAL
// ============================================

const modal = document.getElementById('dreamModal');
const addDreamBtn = document.getElementById('addDreamBtn');
const closeBtn = document.querySelector('.close');
const dreamForm = document.getElementById('dreamForm');

addDreamBtn.onclick = () => modal.style.display = 'block';
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = 'none';
};

dreamForm.onsubmit = (e) => {
  e.preventDefault();
  
  const text = document.getElementById('dreamText').value;
  const country = document.getElementById('dreamLocation').value;
  
  const lang = dreamFetcher.detectLanguage(text);
  const location = dreamFetcher.getLocationForLanguage(lang);
  
  const newDream = {
    id: `user-${Date.now()}`,
    text: text,
    symbol: dreamFetcher.detectSymbol(text),
    timestamp: new Date().toISOString(),
    language: lang,
    lat: location.lat + (Math.random() - 0.5) * 2,
    lng: location.lng + (Math.random() - 0.5) * 2,
    country: country,
    source: 'Kullanıcı'
  };

  dreamArchive.add(newDream);
  updateUI();

  modal.style.display = 'none';
  dreamForm.reset();
};

// ============================================
// BUTONLAR
// ============================================

document.getElementById('refreshBtn').onclick = () => {
  updateUI();
};

document.getElementById('fetchBtn').onclick = async () => {
  const btn = document.getElementById('fetchBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Çekiliyor...';
  
  try {
    const result = await dreamFetcher.fetchAndArchive();
    alert(`✅ ${result.fetched} rüya çekildi, ${result.added} yeni rüya arşive eklendi`);
    updateUI();
  } catch (error) {
    alert('❌ Rüya çekme hatası: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '📥 Yeni Rüya Çek';
  }
};

document.getElementById('filterBtn').onclick = () => {
  const symbol = prompt('Sembol filtrele:\nwater, flying, falling, chase, teeth, naked, exam, snake, death, money, animal, house, car, fire, love, other\n\n(hepsini göstermek için boş bırak)');
  
  if (symbol === null) return;
  
  if (symbol === '') {
    updateUI();
  } else {
    const filtered = dreamArchive.getBySymbol(symbol);
    addDreamsToMap(filtered);
    alert(`${filtered.length} rüya bulundu (${symbol})`);
  }
};

// ============================================
// OTOMATİK YENİLEME
// ============================================

// Her 30 dakikada yeni rüya çek
setInterval(async () => {
  console.log('🔄 Auto-fetching new dreams...');
  await dreamFetcher.fetchAndArchive();
  updateUI();
}, 30 * 60 * 1000);

// ============================================
// BAŞLAT
// ============================================

window.addEventListener('DOMContentLoaded', async () => {
  initMap();
  
  // İlk yükleme
  await dreamFetcher.initialLoad();
  
  // UI'ı güncelle
  updateUI();
  
  console.log('✅ Dream Pulse Map initialized');
  console.log(`📊 Archive contains ${dreamArchive.getAll().length} dreams`);
});
