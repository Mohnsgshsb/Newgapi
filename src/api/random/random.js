const axios = require("axios");

module.exports = function (app) {

    // 🎯 قائمة المودات (Anime Mods)
    const mods = [
        "akira", "akiyama", "anna", "asuna", "ayuzawa",
        "brouto", "chiho", "chitoge", "deidara", "erza",
        "elaina", "eba", "emilia", "hestia", "hinata",
        "inori", "isuzu", "itachi", "itori", "kaga",
        "kagura", "kaori", "keneki", "kotori",
        "جوزو", "madara", "mikasa", "miku",
        "minato", "naruto", "nezuko", "sagiri",
        "sasuke", "sakura", "cosplay"
    ];

    // 🔎 fake image search (بدّل API هنا لو عندك مصدر صور)
    async function searchImages(query) {
        try {
            const { data } = await axios.get(
                `https://api.lolicon.app/setu/v2?tag=${encodeURIComponent(query)}&num=10`
            );

            if (!data?.data?.length) return [];

            return data.data.map(i => i.urls.original);

        } catch (e) {
            console.log("Search error:", e.message);
            return [];
        }
    }

    // 📌 GET endpoint لكل مود
    app.get("/api/anime/:mode", async (req, res) => {
        try {
            const mode = req.params.mode.toLowerCase();

            if (!mods.includes(mode)) {
                return res.status(400).json({
                    status: false,
                    message: "❌ المود ده مش موجود"
                });
            }

            const images = await searchImages(mode);

            if (!images.length) {
                return res.status(404).json({
                    status: false,
                    message: "❌ مفيش صور"
                });
            }

            const random = images[Math.floor(Math.random() * images.length)];

            res.json({
                status: true,
                mode,
                result: random,
                total: images.length,
                message: "✅ تم جلب صورة عشوائية"
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