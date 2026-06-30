const axios = require("axios");

module.exports = function (app) {

    const models = {
        "غوكو": "67aed50c-5d4b-11ee-a861-00163e2ac61b",
        "رابر": "c82964b9-d093-11ee-bfb7-e86f38d7ec1a",
        "نامي": "67ad95a0-5d4b-11ee-a861-00163e2ac61b",
        "يوكي": "67ae0979-5d4b-11ee-a861-00163e2ac61b",
    };

    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6)",
        "Mozilla/5.0 (Linux; Android 8.0.0)"
    ];

    function getRandomIp() {
        return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".");
    }

    async function generateTTS(text, voiceId) {

        const agent = userAgents[Math.floor(Math.random() * userAgents.length)];

        const { data } = await axios.post(
            "https://voxbox-tts-api.imyfone.com/pc/v1/voice/tts",
            {
                raw_text: text,
                url: "https://filme.imyfone.com/text-to-speech/anime-text-to-speech/",
                product_id: "200054",
                convert_data: [
                    { voice_id: voiceId, speed: "1", volume: "50", text, pos: 0 }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "*/*",
                    "User-Agent": agent,
                    "X-Forwarded-For": getRandomIp()
                },
                timeout: 30000
            }
        );

        const result = data?.data?.convert_result?.[0];

        if (!result?.oss_url) {
            throw new Error("فشل توليد الصوت");
        }

        return result.oss_url;
    }

    // 🔥 API الرئيسي
    app.get("/api/tts", async (req, res) => {
        const { prompt, voice } = req.query;

        if (!prompt || !voice) {
            return res.status(400).json({
                status: false,
                error: "حط prompt و voice"
            });
        }

        const voiceId = models[voice];

        if (!voiceId) {
            return res.status(400).json({
                status: false,
                error: "الصوت غير موجود"
            });
        }

        try {
            const url = await generateTTS(prompt, voiceId);

            res.json({
                status: true,
                result: {
                    voice,
                    url
                }
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

    // 🔥 voices list
    app.get("/api/tts/voices", (req, res) => {
        res.json({
            status: true,
            voices: Object.keys(models)
        });
    });

};
