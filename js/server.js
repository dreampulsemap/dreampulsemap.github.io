const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());

// 1. MongoDB Veritabanı Bağlantısı (Kalıcı Rüya Arşivi)
mongoose.connect('mongodb://localhost:27017/dreampulse_archive', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Kalıcı Rüya Arşivi (MongoDB) Bağlantısı Başarılı."))
  .catch(err => console.error("Veritabanı hatası:", err));

// Rüya Veri Modeli
const ArchivedDreamSchema = new mongoose.Schema({
    source: String,     // Reddit, Twitter, Tumblr, vs.
    rawText: String,    // Orijinal ham metin
    isDream: Boolean,   // AI onay süzgeci
    createdAt: { type: Date, default: Date.now }
});
const DreamArchive = mongoose.model('DreamArchive', ArchivedDreamSchema);

// 2. Yapay Zeka Süzgeci (Groq / OpenAI API)
// Çekilen tweet veya post gerçekten bir rüya mı yoksa alakasız bir metin mi ayırt eder.
async function validateAndFilterWithAI(text) {
    try {
        // Örnek olarak Groq veya OpenAI API çağrısı yapısı:
        // Sadece rüya bildiren içerikleri true kabul etmek için prompt verilir.
        // Şimdilik simüle ediyoruz (üretimde API anahtarınızı girerek aktifleştirebilirsiniz):
        const keywords = ['rüyamda', 'dreamt', 'dream', 'rüyama', 'uyandım'];
        return keywords.some(keyword => text.toLowerCase().includes(keyword));
    } catch (error) {
        return false;
    }
}

// 3. Sosyal Medyadan Rüya Fetch Eden Motor (Cron/Interval yapısı)
async function fetchSocialMediaDreams() {
    console.log("Sosyal ağlardan güncel veriler taranıyor...");

    try {
        // --- REDDIT FETCH ÖRNEĞİ ---
        const redditRes = await axios.get('https://www.reddit.com/r/Dreams/new.json?limit=5');
        const redditPosts = redditRes.data.data.children;

        for (let post of redditPosts) {
            const fullText = post.data.title + " " + post.data.selftext;
            
            // Veritabanında mükerrer (duplicate) kaydı önleme kontrolü
            const exists = await DreamArchive.findOne({ rawText: fullText });
            if (!exists) {
                const isDream = await validateAndFilterWithAI(fullText);
                if (isDream) {
                    await DreamArchive.create({
                        source: 'r/Dreams',
                        rawText: fullText,
                        isDream: true
                    });
                    console.log("Kalıcı arşive kaydedildi (Reddit):", post.data.title);
                }
            }
        }

        // --- TUMBLR FETCH ÖRNEĞİ (Tag araması) ---
        // Not: Twitter/X ve Tumblr için resmi geliştirici API anahtarları (Bearer Token) gerekir.
        // Aşağıdaki blok mantığı temsil eder:
        /*
        const tumblrRes = await axios.get('https://api.tumblr.com/v2/tagged?tag=dream&api_key=YOUR_KEY');
        // Gelen verileri filtreleyip DreamArchive.create() ile kalıcı hafızaya yazıyoruz.
        */

    } catch (error) {
        console.error("Fetch motoru hatası (API sınırları veya bağlantı kesintisi):", error.message);
    }
}

// Her 15 dakikada bir otomatik arka plan taraması yap ve arşivi doldur
setInterval(fetchSocialMediaDreams, 15 * 60 * 1000);

// 4. API Endpoint: Frontend'in (Live Feed) okuyacağı temiz veri kapısı
app.get('/api/dreams', async (req, res) => {
    try {
        // En güncel, kalıcı olarak arşivlenmiş 10 rüyayı getirir
        const latestDreams = await DreamArchive.find().sort({ createdAt: -1 }).limit(10);
        res.json(latestDreams);
    } catch (err) {
        res.status(500).json({ error: "Veri çekilemedi." });
    }
});

app.listen(PORT, () => {
    console.log(`DreamPulse backend sunucusu http://localhost:${PORT} üzerinde çalışıyor.`);
    // Sunucu ilk açıldığında hemen bir tarama başlat
    fetchSocialMediaDreams();
});
