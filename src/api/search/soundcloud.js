const axios = require("axios");

module.exports = function (app) {

    // 🔎 البحث في SoundCloud
    async function searchSoundCloud(query) {
        try {
            const baseUrl = "https://api-mobi.soundcloud.com/search";

            const params = {
                q: query,
                client_id: "KKzJxmw11tYpCs6T24P4uUYhqmjalG6M",
                stage: ""
            };

            const headers = {
                Accept: "application/json, text/javascript, */*; q=0.1",
                "User-Agent":
                    "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/128",
                Referer: `https://m.soundcloud.com/search?q=${encodeURIComponent(query)}`
            };

            const { data } = await axios.get(baseUrl, {
                params,
                headers,
                timeout: 30000
            });

            const result = data?.collection || [];

            return result.map(item => ({
                genre: item.genre,
                created_at: item.created_at,
                duration: item.duration,
                permalink: cleanFilename(item.permalink),
                comment_count: item.comment_count,
                artwork_url: item.artwork_url,
                permalink_url: item.permalink_url,
                playback_count: item.playback_count
            }));

        } catch (e) {
            console.error("SoundCloud Error:", e.message);
            return [];
        }
    }

    // 🧹 تنظيف الاسم
    function cleanFilename(filename = "") {
        return filename
            .replace(/[<>:"/\\|?*]/g, "_")
            .replace(/-/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // 🔥 REST API
    app.all("/api/s/soundcloud", async (req, res) => {

        const query = req.query.query || req.body.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                message: "📌 حط كلمة البحث"
            });
        }

        if (typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                status: false,
                message: "❌ query لازم يكون نص"
            });
        }

        try {
            const result = await searchSoundCloud(query.trim());

            if (!result.length) {
                return res.status(404).json({
                    status: false,
                    message: `❌ مفيش نتائج لـ: ${query}`
                });
            }

            return res.json({
                status: true,
                query,
                total: result.length,
                data: result,
                message: "✅ تم جلب النتائج"
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                message: "⚠️ Server Error",
                error: err.message
            });
        }
    });

};