// ============================================
// 📚 DREAM ARCHIVE - RÜYA VERİ DEPOSU
// ============================================

window.DreamArchive = {
    storageKey: 'dream_archive_v2',
    
    getAllDreams() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const dreams = data ? JSON.parse(data) : [];
            console.log(`📚 Archive: ${dreams.length} dreams loaded`);
            return dreams;
        } catch (e) {
            console.error('Archive read error:', e);
            return [];
        }
    },
    
    getTodayDreams() {
        const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
        return this.getAllDreams().filter(d => new Date(d.timestamp) >= startOfDay);
    },
    getWeekDreams() {
        return this.getAllDreams().filter(d => new Date(d.timestamp) >= new Date(Date.now() - 7*24*60*60*1000));
    },
    getMonthDreams() {
        return this.getAllDreams().filter(d => new Date(d.timestamp) >= new Date(Date.now() - 30*24*60*60*1000));
    },
    getLast24hDreams() {
        return this.getAllDreams().filter(d => new Date(d.timestamp) >= new Date(Date.now() - 24*60*60*1000));
    },
    getDreamsByDateRange(from, to) {
        return this.getAllDreams().filter(d => {
            const t = new Date(d.timestamp); return t >= from && t <= to;
        });
    },
    getDreamsByRegion(lat, lng, radiusKm = 1500) {
        return this.getAllDreams().filter(d => this._distance(lat, lng, d.lat, d.lng) <= radiusKm);
    },
    _distance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2-lat1) * Math.PI/180;
        const dLon = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    },
    
    addDream(dream) {
        const archive = this.getAllDreams();
        if (archive.find(d => d.id === dream.id)) return false;
        archive.push(dream);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(archive));
        } catch(e) { console.error('Storage error:', e); }
        return true;
    },
    addManyDreams(dreams) {
        const archive = this.getAllDreams();
        let added = 0;
        dreams.forEach(d => {
            if (!archive.find(x => x.id === d.id)) { archive.push(d); added++; }
        });
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(archive));
        } catch(e) { console.error('Storage error:', e); }
        return added;
    },
    getStats() {
        const archive = this.getAllDreams();
        const symbols = {};
        archive.forEach(d => {
            const s = d.symbol || (d.symbols?.[0]?.name) || 'other';
            symbols[s] = (symbols[s] || 0) + 1;
        });
        return {
            total: archive.length,
            countries: new Set(archive.map(d => d.country)).size,
            languages: new Set(archive.map(d => d.language)).size,
            symbolDistribution: symbols
        };
    },
    clear() { localStorage.removeItem(this.storageKey); },
    exportJSON() { return JSON.stringify(this.getAllDreams(), null, 2); },
    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (Array.isArray(data)) { localStorage.setItem(this.storageKey, JSON.stringify(data)); return true; }
            return false;
        } catch(e) { return false; }
    }
};

console.log('✅ DreamArchive initialized');
