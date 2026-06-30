const axios = require("axios");

module.exports = function (app) {

    const BASE = "https://gamepvz.com";

    // 🔥 جلب بيانات + رابط التحميل
    async function getDownloadUrl(trackUrl) {
        const { data } = await axios.post(
            `${BASE}/api/download/get-url`,
            { url: trackUrl },
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Linux; Android 15) Chrome/146",
                    "origin": BASE,
                    "x-requested-with": "mark.via.gp"
                }
            }
        );

        return data;
    }

    // 🚀 REST API (DIRECT STREAM DOWNLOAD)
    app.all("/api/s/spotify/download", async (req, res) => {

        const url = req.query.url || req.body.url;

        if (!url) {
            return res.status(400).json({
                status: false,
                message: "spotify url required"
            });
        }

        try {
            const data = await getDownloadUrl(url);

            if (!data?.originalVideoUrl) {
                return res.status(500).json({
                    status: false,
                    message: "failed to get download link"
                });
            }

            const downloadUrl = `${BASE}${data.originalVideoUrl}`;

            // 🔥 بدل ما نرجّع JSON → هنحوّلها Download مباشر
            const audio = await axios.get(downloadUrl, {
                responseType: "stream"
            });

            // headers عشان يعتبره ملف تحميل
            res.setHeader("Content-Type", "audio/mpeg");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${data.title || "spotify"}.mp3"`
            );

            // 🔥 pipe مباشر للملف
            audio.data.pipe(res);

        } catch (e) {
            console.log(e);
            res.status(500).json({
                status: false,
                error: e.message
            });
        }
    });

};