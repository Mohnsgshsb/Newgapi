const axios = require('axios');

module.exports = function (app) {

    const ytdown = {

        api: {
            convert: "https://hub.ytconvert.org/api/download"
        },

        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.177 Mobile Safari/537.36',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            'Content-Type': 'application/json',
            'sec-ch-ua-platform': '"Android"',
            'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Android WebView";v="146"',
            'sec-ch-ua-mobile': '?1',
            'origin': 'https://media.ytmp3.gg',
            'x-requested-with': 'mark.via.gp',
            'sec-fetch-site': 'cross-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'referer': 'https://media.ytmp3.gg/',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8'
        },

        isUrl: (str) => {
            try { new URL(str); return true; } catch { return false; }
        },

        sleep: (ms) => new Promise(r => setTimeout(r, ms)),

        request: async (url, type) => {

            const payload = {
                url: url,
                os: 'android',
                output: {
                    type: type === "audio" ? "audio" : "video",
                    format: type === "audio" ? "mp3" : "mp4",
                    quality: type === "video" ? "720p" : undefined
                },
                audio: {
                    bitrate: "128k"
                }
            };

            const res = await axios.post(
                ytdown.api.convert,
                payload,
                {
                    headers: ytdown.headers,
                    validateStatus: () => true
                }
            );

            let data = res.data;

            // 🔥 لو رجع statusUrl نبدأ polling
            if (data?.statusUrl) {

                let final;

                for (let i = 0; i < 25; i++) {

                    const check = await axios.get(data.statusUrl, {
                        headers: ytdown.headers,
                        validateStatus: () => true
                    });

                    final = check.data;

                    // نجاح التحويل
                    if (
                        final?.downloadUrl ||
                        final?.url ||
                        final?.status === "completed"
                    ) {
                        break;
                    }

                    await ytdown.sleep(2000);
                }

                return final;
            }

            return data;
        },

        download: async (link, type) => {
            if (!link) throw new Error("حط لينك 🗿");
            if (!ytdown.isUrl(link)) throw new Error("لينك غلط 🗿");

            return await ytdown.request(link, type);
        },

        final: (data) => ({
            success: true,
            title: data?.title || null,
            duration: data?.duration || null,
            thumbnail: data?.thumbnail || null,
            download: data?.downloadUrl || data?.url || null,
            raw: data
        })
    };

    // 🔥 MP3 Endpoint
    app.get('/api/ytconvert/mp3', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "حط لينك"
            });
        }

        try {
            const data = await ytdown.download(url, "audio");

            res.json({
                status: true,
                creator: "Mohnd",
                type: "mp3",
                ...ytdown.final(data)
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

    // 🔥 MP4 Endpoint (720p ثابت)
    app.get('/api/ytconvert/mp4', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "حط لينك"
            });
        }

        try {
            const data = await ytdown.download(url, "video");

            res.json({
                status: true,
                creator: "Mohnd",
                type: "mp4",
                quality: "720p",
                ...ytdown.final(data)
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
