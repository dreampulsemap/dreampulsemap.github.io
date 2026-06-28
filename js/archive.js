// ============================================
// 📚 DREAM ARCHIVE - RÜYA VERİ DEPOSU
// ============================================

window.DreamArchive = {
    storageKey: 'dream_archive_v2',
    
    // Tüm rüyaları getir
    getAllDreams() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Archive read error:', e);
            return [];
        }
    },
    
    // Bugünün rüyaları
    getTodayDreams() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return this.getAllDreams().filter(d => new Date(d.timestamp) >= startOfDay);
    },
    
    // Bu haftanın rüyaları
    getWeekDreams() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return this.getAllDreams().filter(d => new Date(d.timestamp) >= weekAgo);
    },
    
    // Bu ayın rüyaları
    getMonthDreams() {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return this.getAllDreams().filter(d => new Date(d.timestamp) >= monthAgo);
    },
    
    // Son 24 saat
    getLast24hDreams() {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.getAllDreams().filter(d => new Date(d.timestamp) >= dayAgo);
    },
    
    // Tarih aralığı
    getDreamsByDateRange(from, to) {
        return this.getAllDreams().filter(d => {
            const t = new Date(d.timestamp);
            return t >= from && t <= to;
        });
    },
    
    // Bölgeye göre (lat/lng etrafında)
    getDreamsByRegion(lat, lng, radiusKm = 1500) {
        return this.getAllDreams().filter(d => {
            const dist = this._distance(lat, lng, d.lat, d.lng);
            return dist <= radiusKm;
        });
    },
    
    // Haversine mesafe hesabı
    _distance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    },
    
    // Rüya ekle (duplicate kontrolü)
    addDream(dream) {
        const archive = this.getAllDreams();
        if (archive.find(d => d.id === dream.id)) return false;
        archive.push(dream);
        localStorage.setItem(this.storageKey, JSON.stringify(archive));
        return true;
    },
    
    // Toplu ekle
    addManyDreams(dreams) {
        const archive = this.getAllDreams();
        let added = 0;
        dreams.forEach(d => {
            if (!archive.find(x => x.id === d.id)) {
                archive.push(d);
                added++;
            }
        });
        localStorage.setItem(this.storageKey, JSON.stringify(archive));
        return added;
    },
    
    // İstatistikler
    getStats() {
        const archive = this.getAllDreams();
        const symbols = {};
        archive.forEach(d => {
            if (d.symbol) symbols[d.symbol] = (symbols[d.symbol] || 0) + 1;
        });
        return {
            total: archive.length,
            countries: new Set(archive.map(d => d.country)).size,
            languages: new Set(archive.map(d => d.language)).size,
            symbolDistribution: symbols
        };
    },
    
    // Arşivi temizle
    clear() {
        localStorage.removeItem(this.storageKey);
    },
    
    // Dışa aktar
    exportJSON() {
        return JSON.stringify(this.getAllDreams(), null, 2);
    },
    
    // İçe aktar
    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (Array.isArray(data)) {
                localStorage.setItem(this.storageKey, JSON.stringify(data));
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
};
