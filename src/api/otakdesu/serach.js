const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

    const otakudesu = {

        async search(query) {

            if (!query || !query.trim()) {
                throw new Error("اكتب كلمة البحث");
            }

            const url = `https://otakudesu.cloud/?s=${encodeURIComponent(query)}&post_type=anime`;

            const { data } = await axios.get(url, {
                timeout: 30000,
                headers: {
                    "user-agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
                }
            });

            const $ = cheerio.load(data);
            const results = [];

            $(".chivsrc li").each((i, el) => {

                const title = $(el).find("h2 a").text().trim();
                const link = $(el).find("h2 a").attr("href");
                const image = $(el).find("img").attr("src");

                const genres = $(el)
                    .find(".set")
                    .first()
                    .text()
                    .replace("Genres : ", "")
                    .trim();

                const status = $(el)
                    .find(".set")
                    .eq(1)
                    .text()
                    .replace("Status : ", "")
                    .trim();

                const rating = $(el)
                    .find(".set")
                    .eq(2)
                    .text()
                    .replace("Rating : ", "")
                    .trim() || "N/A";

                results.push({
                    title,
                    link,
                    image,
                    genres,
                    status,
                    rating
                });
            });

            if (results.length === 0) {
                throw new Error("مفيش نتائج");
            }

            return results;
        }
    };

    // 🔥 endpoint
    app.get("/api/anime/otakudesu/search", async (req, res) => {

        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "اكتب ?q="
            });
        }

        try {
            const result = await otakudesu.search(q);

            res.json({
                status: true,
                creator: "TERBO-SPAM",
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