// ============================================
// RÜYA ARŞİV SİSTEMİ
// ============================================

class DreamArchive {
  constructor() {
    this.storageKey = 'dream_archive';
    this.metadataKey = 'dream_archive_meta';
  }

  // Arşivi başlat (yoksa oluştur)
  init() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.metadataKey)) {
      localStorage.setItem(this.metadataKey, JSON.stringify({
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalDreams: 0
      }));
    }
  }

  // Tüm rüyaları getir
  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Archive read error:', e);
      return [];
    }
  }

  // Rüya ekle (duplicate kontrolü ile)
  add(dream) {
    const archive = this.getAll();
    
    // Duplicate kontrolü
    if (archive.find(d => d.id === dream.id)) {
      return false;
    }

    archive.push(dream);
    localStorage.setItem(this.storageKey, JSON.stringify(archive));
    this.updateMetadata();
    return true;
  }

  // Birden fazla rüya ekle
  addMany(dreams) {
    const archive = this.getAll();
    let addedCount = 0;

    dreams.forEach(dream => {
      if (!archive.find(d => d.id === dream.id)) {
        archive.push(dream);
        addedCount++;
      }
    });

    localStorage.setItem(this.storageKey, JSON.stringify(archive));
    this.updateMetadata();
    return addedCount;
  }

  // Rüya sil
  remove(id) {
    const archive = this.getAll();
    const filtered = archive.filter(d => d.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    this.updateMetadata();
  }

  // Belirli bir dönemin rüyalarını getir
  getByDateRange(startDate, endDate) {
    const archive = this.getAll();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return archive.filter(d => {
      const timestamp = new Date(d.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }

  // Belirli bir ülkenin rüyalarını getir
  getByCountry(country) {
    const archive = this.getAll();
    return archive.filter(d => d.country === country);
  }

  // Belirli bir dilin rüyalarını getir
  getByLanguage(language) {
    const archive = this.getAll();
    return archive.filter(d => d.language === language);
  }

  // Belirli bir sembolün rüyalarını getir
  getBySymbol(symbol) {
    const archive = this.getAll();
    return archive.filter(d => d.symbol === symbol);
  }

  // İstatistikleri hesapla
  getStats() {
    const archive = this.getAll();
    
    const countries = new Set(archive.map(d => d.country));
    const languages = new Set(archive.map(d => d.language));
    const symbols = {};
    
    archive.forEach(d => {
      symbols[d.symbol] = (symbols[d.symbol] || 0) + 1;
    });

    const mostCommonSymbol = Object.entries(symbols)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalDreams: archive.length,
      totalCountries: countries.size,
      totalLanguages: languages.size,
      mostCommonSymbol: mostCommonSymbol ? mostCommonSymbol[0] : null,
      symbolDistribution: symbols,
      countryDistribution: this.getDistribution(archive, 'country'),
      languageDistribution: this.getDistribution(archive, 'language')
    };
  }

  // Dağılım hesapla
  getDistribution(data, field) {
    const dist = {};
    data.forEach(item => {
      const value = item[field];
      dist[value] = (dist[value] || 0) + 1;
    });
    return dist;
  }

  // Metadata güncelle
  updateMetadata() {
    const archive = this.getAll();
    const metadata = {
      createdAt: this.getMetadata().createdAt,
      lastUpdated: new Date().toISOString(),
      totalDreams: archive.length
    };
    localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
  }

  // Metadata getir
  getMetadata() {
    try {
      const data = localStorage.getItem(this.metadataKey);
      return data ? JSON.parse(data) : {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalDreams: 0
      };
    } catch (e) {
      return {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalDreams: 0
      };
    }
  }

  // Arşivi temizle
  clear() {
    localStorage.setItem(this.storageKey, JSON.stringify([]));
    this.updateMetadata();
  }

  // Arşivi dışa aktar (JSON)
  export() {
    return JSON.stringify({
      metadata: this.getMetadata(),
      dreams: this.getAll()
    }, null, 2);
  }

  // Arşive içe aktar (JSON)
  import(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.dreams && Array.isArray(data.dreams)) {
        localStorage.setItem(this.storageKey, JSON.stringify(data.dreams));
        this.updateMetadata();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }
}

// Global instance
const dreamArchive = new DreamArchive();
dreamArchive.init();
