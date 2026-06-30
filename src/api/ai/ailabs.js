const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

module.exports = function (app) {

    const aiLabs = {
        api: {
            base: "https://text2video.aritek.app",
            text2img: "/text2img"
        },
        headers: {
            "user-agent": "NB Android/1.0.0",
            "accept-encoding": "gzip",
            "content-type": "application/json",
            authorization: ""
        },
        state: { token: null },
        setup: {
            cipher: "hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW",
            shiftValue: 3,
            dec(text, shift) {
                return [...text].map(c =>
                    /[a-z]/.test(c)
                        ? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
                        : /[A-Z]/.test(c)
                            ? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
                            : c
                ).join('');
            },
            async decrypt() {
                if (aiLabs.state.token) return aiLabs.state.token;
                const decrypted = aiLabs.setup.dec(aiLabs.setup.cipher, aiLabs.setup.shiftValue);
                aiLabs.state.token = decrypted;
                aiLabs.headers.authorization = decrypted;
                return decrypted;
            }
        }
    };

    // 🔥 GET API
    app.get("/api/ai-image", async (req, res) => {
        try {
            const prompt = req.query.prompt;

            if (!prompt) {
                return res.status(400).json({
                    status: false,
                    message: "📌 حط prompt ?prompt="
                });
            }

            const token = await aiLabs.setup.decrypt();

            const form = new FormData();
            form.append("prompt", prompt);
            form.append("token", token);

            const url = aiLabs.api.base + aiLabs.api.text2img;

            const response = await axios.post(url, form, {
                headers: { ...aiLabs.headers, ...form.getHeaders() }
            });

            const { code, url: imageUrl } = response.data;

            if (code !== 0 || !imageUrl) {
                return res.status(500).json({
                    status: false,
                    message: "❌ فشل إنشاء الصورة"
                });
            }

            res.json({
                status: true,
                prompt,
                result: imageUrl.trim(),
                message: "✅ تم إنشاء الصورة"
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                status: false,
                message: "⚠️ خطأ في السيرفر",
                error: err.message
            });
        }
    });

};