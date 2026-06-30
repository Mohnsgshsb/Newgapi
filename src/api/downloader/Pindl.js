const axios = require("axios");

module.exports = function (app) {

    // 🌀 تحميل من Pinterest
    async function pindl(url) {
        try {
            const api = "https://pinterestdownloader.io/frontendService/DownloaderService";

            const { data } = await axios.get(api, {
                params: { url }
            });

            if (!data || !data.medias) {
                throw new Error("رد غير صالح من السيرفر");
            }

            return data;

        } catch (e) {
            throw new Error("فشل جلب بيانات Pinterest");
        }
    }

    // 📏 تحويل الحجم
    function formatSize(bytes) {
        if (!bytes) return "0 B";

        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    // 🔥 API (GET + POST)
    app.all("/api/pindl", async (req, res) => {

        const url = req.query.url || req.body.url;

        if (!url) {
            return res.status(400).json({
                status: false,
                message: "📌 ?url حط رابط Pinterest"
            });
        }

        try {
            const { medias, title } = await pindl(url);

            if (!medias || !medias.length) {
                return res.status(404).json({
                    status: false,
                    message: "❌ مفيش ملفات"
                });
            }

            const mp4 = medias.filter(v => v.extension === "mp4");

            // 🎥 فيديو
            if (mp4.length > 0) {
                const v = mp4[0];

                return res.json({
                    status: true,
                    title: title || "بدون عنوان",
                    quality: v.quality || "unknown",
                    size: formatSize(v.size),
                    video_url: v.url,
                    message: "✅ تم جلب الفيديو"
                });
            }

            // 🖼️ صور أو غيره
            return res.json({
                status: true,
                title: title || "بدون عنوان",
                media_url: medias[0].url,
                message: "✅ تم جلب الوسائط"
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                message: "⚠️ خطأ في التحميل",
                error: err.message
            });
        }
    });

};
