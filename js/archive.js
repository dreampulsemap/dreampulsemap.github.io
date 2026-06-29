class DreamArchive {
  constructor() {
    this.storageKey = 'dream_archive';
  }

  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  add(dream) {
    const archive = this.getAll();
    if (!dream.id) dream.id = 'dream-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    if (!dream.timestamp) dream.timestamp = new Date().toISOString();
    if (archive.find(d => d.id === dream.id)) return false;
    archive.push(dream);
    localStorage.setItem(this.storageKey, JSON.stringify(archive));
    return true;
  }

  addMany(dreams) {
    const archive = this.getAll();
    let count = 0;
    dreams.forEach(dream => {
      if (!dream.id) dream.id = 'dream-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      if (!dream.timestamp) dream.timestamp = new Date().toISOString();
      if (!archive.find(d => d.id === dream.id)) {
        archive.push(dream);
        count++;
      }
    });
    localStorage.setItem(this.storageKey, JSON.stringify(archive));
    return count;
  }

  getToday() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return this.getAll().filter(d => new Date(d.timestamp) >= start);
  }

  getThisWeek() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.getAll().filter(d => new Date(d.timestamp) >= weekAgo);
  }

  getByRegion(lat, lng, radius = 15) {
    return this.getAll().filter(d => {
      if (!d.lat || !d.lng) return false;
      const distance = Math.sqrt(Math.pow(d.lat - lat, 2) + Math.pow(d.lng - lng, 2));
      return distance < radius;
    });
  }

  getStats() {
    const archive = this.getAll();
    return {
      total: archive.length,
      countries: new Set(archive.map(d => d.country).filter(Boolean)).size,
      languages: new Set(archive.map(d => d.language).filter(Boolean)).size
    };
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }
}

const dreamArchive = new DreamArchive();
