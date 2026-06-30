const axios = require('axios');

module.exports = function (app) {
    app.get('/search/lyrics', async (req, res) => {
        const { title } = req.query;

        // تحقق من البراميتر
        if (!title) {
            return res.status(400).json({
                status: false,
                error: 'حط اسم الأغنية ?title='
            });
        }

        try {
            const { data } = await axios.get(
                `https://lrclib.net/api/search?q=${encodeURIComponent(title)}`,
                {
                    headers: {
                        referer: `https://lrclib.net/search/${encodeURIComponent(title)}`,
                        'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
                    },
                    timeout: 20000
                }
            );

            if (!data || data.length === 0) {
                return res.json({
                    status: false,
                    message: 'مفيش نتايج'
                });
            }

            // نختار أول نتيجة
            const song = data[0];

            const result = {
                title: song.trackName,
                artist: song.artistName,
                album: song.albumName,
                duration: song.duration,
                lyrics: song.syncedLyrics || song.plainLyrics || null
            };

            return res.json({
                status: true,
                creator: "TERBO-SPAM",
                result
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                error: 'حصل مشكلة في السيرفر',
                message: err.message
            });
        }
    });
};