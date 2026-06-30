const axios = require("axios");

module.exports = function (app) {

    const fbScraper = {

        isFacebookUrl: (url) => {
            return (
                url &&
                (url.includes("facebook.com") || url.includes("fb.watch"))
            );
        },

        parseString: (str) => {
            try {
                return JSON.parse(`{"text":"${str}"}`).text;
            } catch {
                return str;
            }
        },

        getInfo: async (videoUrl) => {

            if (!videoUrl || !videoUrl.trim()) {
                throw new Error("حط لينك صحيح");
            }

            if (!fbScraper.isFacebookUrl(videoUrl)) {
                throw new Error("الرابط ليس من فيسبوك");
            }

            const headers = {
                "sec-fetch-user": "?1",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-site": "none",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "cache-control": "max-age=0",
                "authority": "www.facebook.com",
                "upgrade-insecure-requests": "1",
                "accept-language":
                    "en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6",
                "sec-ch-ua":
                    '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
                accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
            };

            const { data } = await axios.get(videoUrl, { headers });

            const html = data
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, "&");

            const sdMatch =
                html.match(/"browser_native_sd_url":"(.*?)"/) ||
                html.match(/"playable_url":"(.*?)"/) ||
                html.match(/sd_src\s*:\s*"([^"]*)"/);

            const hdMatch =
                html.match(/"browser_native_hd_url":"(.*?)"/) ||
                html.match(/"playable_url_quality_hd":"(.*?)"/) ||
                html.match(/hd_src\s*:\s*"([^"]*)"/);

            const titleMatch =
                html.match(/<meta\sname="description"\scontent="(.*?)"/);

            const thumbMatch =
                html.match(/"preferred_thumbnail":{"image":{"uri":"(.*?)"/);

            if (!sdMatch) {
                throw new Error("لم يتم استخراج الفيديو");
            }

            const sd = sdMatch[1] ? fbScraper.parseString(sdMatch[1]) : null;
            const hd = hdMatch?.[1] ? fbScraper.parseString(hdMatch[1]) : null;

            return {
                title: titleMatch?.[1]
                    ? fbScraper.parseString(titleMatch[1])
                    : html.match(/<title>(.*?)<\/title>/)?.[1] || "Facebook Video",

                thumbnail: thumbMatch?.[1]
                    ? fbScraper.parseString(thumbMatch[1])
                    : "",

                url: videoUrl,

                // 🔥 اختيار تلقائي HD ثم SD
                video: hd || sd
            };
        }
    };

    // 🔥 API Endpoint
    app.get("/api/facebook", async (req, res) => {

        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "حط لينك فيسبوك"
            });
        }

        try {
            const result = await fbScraper.getInfo(url);

            res.json({
                status: true,
                creator: "Mohnd",
                result
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
