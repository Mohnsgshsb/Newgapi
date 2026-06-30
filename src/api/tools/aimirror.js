const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const FormData = require("form-data");

module.exports = function (app) {

    class Helper {
        static BASE_URL = "https://be.aimirror.fun";
        static UID = Helper.randomHash();
        static HEADERS = {
            "User-Agent": "AIMirror/6.8.4+179 (android)",
            "store": "googleplay",
            "uid": Helper.UID,
            "env": "PRO",
            "accept-language": "en",
            "accept-encoding": "gzip",
            "package-name": "com.ai.polyverse.mirror",
            "host": "be.aimirror.fun",
            "content-type": "application/json",
            "app-version": "6.8.4+179"
        };

        static hash = "";
        static imageKey = "";

        static randomHash() {
            const chars = "0123456789abcdef";
            return Array.from({ length: 16 }, () =>
                chars[Math.floor(Math.random() * chars.length)]
            ).join("");
        }

        static sha1(str) {
            return crypto.createHash("sha1").update(str, "utf8").digest("hex");
        }

        static async urlToBuffer(url) {
            const res = await axios.get(url, { responseType: "arraybuffer" });
            return Buffer.from(res.data);
        }

        static async fetchAppToken() {
            const url = `${this.BASE_URL}/app_token/v2`;
            const params = {
                cropped_image_hash: this.hash + ".jpg",
                uid: this.UID
            };
            const res = await axios.get(url, { params, headers: this.HEADERS });
            return res.data;
        }

        static async uploadPhoto(payload) {
            const body = new FormData();

            body.append("name", payload.name);
            body.append("key", payload.key);
            body.append("policy", payload.policy);
            body.append("OSSAccessKeyId", payload.OSSAccessKeyId);
            body.append("success_action_status", payload.success_action_status);
            body.append("signature", payload.signature);
            body.append("backend_type", payload.backend_type);
            body.append("region", payload.region);

            body.append("file", payload.file, {
                filename: this.hash + ".jpg",
                contentType: "image/jpeg"
            });

            await axios.post(payload.upload_host, body, {
                headers: { ...body.getHeaders() }
            });
        }

        static async requestDraw() {
            const url = `${this.BASE_URL}/draw?uid=${this.UID}`;

            const data = {
                model_id: 271,
                cropped_image_key: this.imageKey,
                cropped_height: 1024,
                cropped_width: 768,
                package_name: "com.ai.polyverse.mirror",
                ext_args: {
                    imagine_value2: 50,
                    custom_prompt: ""
                },
                version: "6.8.4",
                force_default_pose: false,
                is_free_trial: true
            };

            const res = await axios.post(url, data, { headers: this.HEADERS });
            return res.data;
        }

        static async wait(drawId) {
            const url = `${this.BASE_URL}/draw/process`;

            while (true) {
                const res = await axios.get(url, {
                    headers: this.HEADERS,
                    params: { draw_request_id: drawId, uid: this.UID }
                });

                const data = res.data;

                if (data.draw_status === "SUCCEED") {
                    return data.generated_image_addresses;
                }

                if (data.draw_status === "FAILED") {
                    throw new Error("فشل التوليد");
                }

                await new Promise(r => setTimeout(r, 5000));
            }
        }
    }

    // 🔥 GET API
    app.get("/api/aimirror", async (req, res) => {
        try {
            const imageUrl = req.query.url;

            if (!imageUrl) {
                return res.status(400).json({
                    status: false,
                    message: "📌 حط رابط الصورة ?url="
                });
            }

            // 🔽 تحميل الصورة
            const buffer = await Helper.urlToBuffer(imageUrl);

            // 🔽 تجهيز الرفع
            Helper.hash = Helper.sha1(crypto.randomUUID());
            const token = await Helper.fetchAppToken();
            Helper.imageKey = token.key;

            token.file = buffer;

            await Helper.uploadPhoto(token);

            // 🎨 توليد الصورة
            const generate = await Helper.requestDraw();
            const result = await Helper.wait(generate.draw_request_id);

            if (!result || !result.length) {
                return res.status(500).json({
                    status: false,
                    message: "❌ فشل توليد الصورة"
                });
            }

            res.json({
                status: true,
                input: imageUrl,
                result: result[0],
                message: "✅ تم توليد الصورة"
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