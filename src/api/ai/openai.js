const axios = require("axios");

module.exports = function (app) {

    app.get("/api/gpt", async (req, res) => {
        try {
            const { text } = req.query;

            if (!text) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    message: "❌ اكتب السؤال ?text="
                });
            }

            const payload = {
                model: {
                    id: "gpt-3.5-turbo",
                    name: "GPT-3.5",
                    maxLength: 12000,
                    tokenLimit: 4000
                },
                messages: [
                    {
                        pluginId: null,
                        content: text,
                        role: "user"
                    }
                ],
                prompt: `You are an AI language model named Chat Everywhere, designed to answer user questions as accurately and helpfully as possible.`,
                temperature: 0.5,
                enableConversationPrompt: false
            };

            const { data } = await axios.post(
                "https://chateverywhere.app/api/chat",
                payload,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.177 Mobile Safari/537.36",
                        "Accept-Encoding": "gzip, deflate, br, zstd",
                        "Content-Type": "application/json",
                        "sec-ch-ua-platform": '"Android"',
                        "user-selected-plugin-id": "",
                        "sec-ch-ua": '"Chromium";v="146", "Not-A.Brand";v="24", "Android WebView";v="146"',
                        "sec-ch-ua-mobile": "?1",
                        "user-browser-id": "92e125bf-4f95-4fc6-92b6-77be97badd38",
                        "output-language": "",
                        "origin": "https://chateverywhere.app",
                        "x-requested-with": "mark.via.gp",
                        "sec-fetch-site": "same-origin",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-dest": "empty",
                        "referer": "https://chateverywhere.app/",
                        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                        "priority": "u=1, i",
                        "Cookie": "ph_phc_9n85Ky3ZOEwVZlg68f8bI3jnOJkaV8oVGGJcoKfXyn1_posthog=%7B%22distinct_id%22%3A%2292e125bf-4f95-4fc6-92b6-77be97badd38%22%7D"
                    }
                }
            );

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                input: text,
                result: data
            });

        } catch (err) {
            console.log(err);

            res.status(500).json({
                status: false,
                creator: "TERBO-SPAM",
                message: "❌ حصل خطأ",
                error: err.message
            });
        }
    });

};