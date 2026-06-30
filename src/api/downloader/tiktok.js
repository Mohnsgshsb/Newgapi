const axios = require("axios");

module.exports = function (app) {

    const tiktok = {

        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "x-requested-with": "XMLHttpRequest",
            "origin": "https://lovetik.com",
            "referer": "https://lovetik.com/"
        },

        request: async (url) => {
            try {
                const { data } = await axios.post(
                    "https://lovetik.com/api/ajax/search",
                    new URLSearchParams({ query: url }),
                    { 
                        headers: tiktok.headers,
                        timeout: 30000 // إضافة timeout
                    }
                );
                return data;
            } catch (error) {
                throw new Error(`Request failed: ${error.message}`);
            }
        },

        pickBest: (links, type) => {
            // ✅ تأكد إن links موجودة و Array
            if (!links || !Array.isArray(links) || links.length === 0) {
                return null;
            }

            if (type === "mp3") {
                return links.find(v => v.ft == 3 || v.s?.includes("MP3"));
            }

            return (
                links.find(v => v.s?.includes("HD Original")) ||
                links.find(v => v.s?.includes("1282p")) ||
                links.find(v => v.s?.includes("1024p")) ||
                links.find(v => v.s?.includes("854p")) ||
                links.find(v => v.ft == 1) ||
                links[0]
            );
        },

        parse: (data, type) => {
            // ✅ Check إن الـ data صحيحة
            if (!data) {
                throw new Error("No data received from API");
            }

            if (!data.status) {
                throw new Error(data.msg || "API returned error status");
            }

            const best = tiktok.pickBest(data.links, type);

            if (!best || !best.a) {
                throw new Error("No download link found for this media type");
            }

            return {
                status: true,
                type,
                title: data.desc || "TikTok Video",
                author: data.author?.nickname || data.author_name || "Unknown",
                cover: data.cover || null,
                download: best.a,
                quality: best.s || "default",
                // إضافة معلومات إضافية لو موجودة
                duration: data.duration || null,
                plays: data.play_count || null
            };
        }
    };

    // =========================
    // 🎥 MP4 API
    // =========================
    app.get("/api/tiktok", async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: "URL parameter is required"
                });
            }

            // ✅ Validate TikTok URL
            if (!url.includes("tiktok.com")) {
                return res.status(400).json({
                    status: false,
                    error: "Invalid TikTok URL"
                });
            }

            const data = await tiktok.request(url);
            
            // ✅ Log للـ debugging (في الـ development)
            if (process.env.NODE_ENV !== 'production') {
                console.log("TikTok API Response:", JSON.stringify(data, null, 2));
            }

            const result = tiktok.parse(data, "mp4");

            res.json({ 
                status: true, 
                creator: 'Danz-dev',
                result 
            });

        } catch (err) {
            console.error("TikTok MP4 Error:", err.message);
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

    // =========================
    // 🎧 MP3 API
    // =========================
    app.get("/api/tiktok-mp3", async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: "URL parameter is required"
                });
            }

            if (!url.includes("tiktok.com")) {
                return res.status(400).json({
                    status: false,
                    error: "Invalid TikTok URL"
                });
            }

            const data = await tiktok.request(url);
            
            if (process.env.NODE_ENV !== 'production') {
                console.log("TikTok MP3 Response:", JSON.stringify(data, null, 2));
            }

            const result = tiktok.parse(data, "mp3");

            res.json({ 
                status: true, 
                creator: 'Danz-dev',
                result 
            });

        } catch (err) {
            console.error("TikTok MP3 Error:", err.message);
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
