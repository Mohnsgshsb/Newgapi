const axios = require("axios");
const FormData = require("form-data");

module.exports = function (app) {

    // 🔎 البحث عن فيديوهات TikTok
    async function ttSearch(query, count = 10) {
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
                title: v.title || "بدون عنوان",
                play: base + v.play,
                cover: base + v.cover
            }));

        } catch (e) {
            console.error("TikTok Search Error:", e.message);
            return [];
        }
    }

    // 🔥 API endpoint
    app.all("/api/tiks", async (req, res) => {

        const text = req.query.text || req.body.text;

        if (!text) {
            return res.status(400).json({
                status: false,
                message: "📌 حط نص البحث"
            });
        }

        try {
            const results = await ttSearch(text, 10);

            if (!results.length) {
                return res.status(404).json({
                    status: false,
                    message: `❌ مفيش نتائج لـ: ${text}`
                });
            }

            res.json({
                status: true,
                query: text,
                total: results.length,
                videos: results,
                message: "✅ تم جلب النتائج"
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
