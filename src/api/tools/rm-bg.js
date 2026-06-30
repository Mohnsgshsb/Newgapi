const express = require("express");
const FormData = require("form-data");
const fetch = require("node-fetch");

module.exports = function (app) {

    app.get("/api/remove-bg", async (req, res) => {
        try {

            const url = req.query.url;

            if (!url) {
                return res.status(400).json({
                    status: false,
                    message: "📌 حط رابط الصورة ?url="
                });
            }

            // 🔥 تحميل الصورة من الرابط
            const imgRes = await fetch(url);
            if (!imgRes.ok) {
                return res.status(400).json({
                    status: false,
                    message: "❌ رابط الصورة غير صالح"
                });
            }

            const imageBuffer = Buffer.from(await imgRes.arrayBuffer());

            // 🔥 إرسال لـ Pixelcut API
            const form = new FormData();

            form.append("image", imageBuffer, {
                filename: "image.jpg",
                contentType: "image/jpeg"
            });

            form.append("format", "png");
            form.append("model", "v1");

            const response = await fetch("https://api2.pixelcut.app/image/matte/v1", {
                method: "POST",
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "application/json, text/plain, */*",
                    "x-locale": "en",
                    "x-client-version": "web:pixa.com:4a5b0af2",
                    "origin": "https://www.pixa.com",
                    "referer": "https://www.pixa.com/"
                },
                body: form
            });

            if (!response.ok) {
                return res.status(500).json({
                    status: false,
                    message: "❌ فشل إزالة الخلفية"
                });
            }

            const buffer = Buffer.from(await response.arrayBuffer());

            res.setHeader("Content-Type", "image/png");
            return res.send(buffer);

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: false,
                message: "⚠️ خطأ في السيرفر",
                error: err.message
            });
        }
    });

};