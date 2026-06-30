const axios = require("axios");

module.exports = function (app) {

    app.get("/api/apk", async (req, res) => {
        try {
            const { query } = req.query;

            // ❌ مفيش اسم تطبيق
            if (!query) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    message: "❌ اكتب اسم التطبيق ?query="
                });
            }

            // 🔗 API بتاع Aptoide
            const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`;

            const response = await axios.get(apiUrl);
            const data = response.data;

            // ❌ مفيش نتائج
            if (!data.datalist || !data.datalist.list || !data.datalist.list.length) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    message: "❌ مفيش APK"
                });
            }

            const appData = data.datalist.list[0];
            const sizeMB = (appData.size / (1024 * 1024)).toFixed(2);

            // ✅ الرد
            res.json({
                status: true,
                creator: "TERBO-SPAM",
                input: query,
                result: {
                    name: appData.name,
                    package: appData.package,
                    updated: appData.updated,
                    size: sizeMB + " MB",
                    icon: appData.icon,
                    download: appData.file.path_alt
                }
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