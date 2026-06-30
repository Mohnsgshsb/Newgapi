const axios = require("axios");
const FormData = require("form-data");

module.exports = function (app) {

    const searchQueries = [
        'حديث',
        'الرسول صلى الله عليه وسلم',
        'حديث شريف',
        'حديث نبوي'
    ];

    // 🔎 البحث عن فيديوهات TikTok
    async function ttSearch(query, count = 5) {
        try {
            const form = new FormData();
            form.append("keywords", query);
            form.append("count", count);
            form.append("cursor", 0);
            form.append("web", 1);
            form.append("hd", 1);

            const { data } = await axios.post(
                "https://tikwm.com/api/feed/search",
                form,
                { headers: form.getHeaders() }
            );

            if (!data?.data?.videos) return [];

            const base = "https://tikwm.com";

            return data.data.videos.map(v => ({
                query,
                title: v.title || "بدون عنوان",
                play: base + v.play,
                cover: base + v.cover
            }));

        } catch (e) {
            console.error("TikTok Search Error:", e.message);
            return [];
        }
    }

    // 🔥 GET API endpoint
    app.get("/api/ahades", async (req, res) => {

        try {
            let allResults = [];

            for (const q of searchQueries) {
                const results = await ttSearch(q, 3);
                allResults = allResults.concat(results);
            }

            if (!allResults.length) {
                return res.status(404).json({
                    status: false,
                    message: "❌ مفيش نتائج"
                });
            }

            res.json({
                status: true,
                total: allResults.length,
                queries: searchQueries,
                videos: allResults,
                message: "✅ تم جلب النتائج تلقائياً"
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                message: "⚠️ خطأ في السيرفر",
                error: err.message
            });
        }
    });

};