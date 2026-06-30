const ytdlp = require("yt-dlp-exec");

module.exports = function(app) {

    app.get("/api/playx", async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "Query is required"
            });
        }

        try {

            // البحث عن أول نتيجة
            const info = await ytdlp(`ytsearch1:${q}`, {
                dumpSingleJson: true,
                noWarnings: true,
                noCheckCertificates: true,
                preferFreeFormats: true,
                format: "bestaudio/best"
            });

            const audio = info.formats
                .filter(f => f.acodec !== "none" && f.url)
                .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

            if (!audio) {
                return res.status(404).json({
                    status: false,
                    error: "No audio format found."
                });
            }

            res.json({
                status: true,
                video: {
                    title: info.title,
                    channel: info.uploader,
                    duration: info.duration,
                    thumbnail: info.thumbnail,
                    link: info.webpage_url
                },
                download: {
                    url: audio.url,
                    ext: audio.ext,
                    bitrate: audio.abr
                }
            });

        } catch (e) {
            res.status(500).json({
                status: false,
                error: e.message
            });
        }
    });

};