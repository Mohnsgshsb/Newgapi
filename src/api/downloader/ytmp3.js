const axios = require('axios');

module.exports = function (app) {

    const ytdown = {

        api: {
            download: "https://hub.ytconvert.org/api/download"
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

        request: async (url) => {

            const res = await axios.post(
                ytdown.api.download,
                {
                    url: url,
                    os: 'android',
                    output: {
                        type: 'audio',
                        format: 'mp3'
                    },
                    audio: {
                        bitrate: '128k'
                    }
                },
                {
                    headers: ytdown.headers,
                    responseType: 'text' // ✅ FIX
                }
            );

            let data;
            try {
                data = JSON.parse(res.data);
            } catch {
                data = res.data;
            }

            // 🔥 لو فيه statusUrl نعمل polling
            if (data.statusUrl) {
                let result;

                for (let i = 0; i < 20; i++) {

                    const check = await axios.get(data.statusUrl, {
                        headers: ytdown.headers,
                        responseType: 'text'
                    });

                    try {
                        result = JSON.parse(check.data);
                    } catch {
                        result = check.data;
                    }

                    if (
                        result?.downloadUrl ||
                        result?.url ||
                        result?.status === "completed"
                    ) break;

                    await ytdown.sleep(2000);
                }

                return ytdown.final(result);
            }

            return ytdown.final(data);
        },

        download: async (link) => {
            if (!link) throw new Error("حط لينك 🗿");
            if (!ytdown.isUrl(link)) throw new Error("لينك غلط 🗿");

            const res = await ytdown.request(link);
            return res;
        },

        final: (data) => ({
            success: true,
            title: data.title || null,
            duration: data.duration || null,
            download: data.downloadUrl || data.url || null,
            raw: data
        })
    };

    // 🔥 API ENDPOINT
    app.get('/api/ytmp3', async (req, res) => {

        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: 'حط لينك'
            });
        }

        try {

            const result = await ytdown.download(url);

            return res.json({
                status: true,
                creator: 'Mohnd',
                ...result
            });

        } catch (err) {

            return res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};