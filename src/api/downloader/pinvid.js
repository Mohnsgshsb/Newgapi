const axios = require("axios");

module.exports = function (app) {

    const base = "https://www.pinterest.com";
    const search = "/resource/BaseSearchResource/get/";

    const headers = {
        accept: "application/json, text/javascript, */*, q=0.01",
        referer: "https://www.pinterest.com/",
        "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "x-app-version": "a9522f",
        "x-pinterest-appstate": "active",
        "x-pinterest-pws-handler": "www/[username]/[slug].js",
        "x-requested-with": "XMLHttpRequest",
    };

    async function getCookies() {
        try {
            const res = await axios.get(base, { headers });
            const set = res.headers["set-cookie"];
            if (!set) return null;
            return set.map(s => s.split(";")[0]).join("; ");
        } catch {
            return null;
        }
    }

    function findUrls(obj, acc = new Set()) {
        if (!obj) return acc;

        if (typeof obj === "string") {
            if (obj.startsWith("http")) acc.add(obj);
            return acc;
        }

        if (Array.isArray(obj)) {
            obj.forEach(v => findUrls(v, acc));
            return acc;
        }

        if (typeof obj === "object") {
            Object.values(obj).forEach(v => findUrls(v, acc));
        }

        return acc;
    }

    function isMedia(url) {
        if (!url) return false;
        const u = url.toLowerCase();
        return (
            u.includes("pinimg") ||
            u.includes("cdn") ||
            u.includes("m3u8") ||
            u.endsWith(".mp4")
        );
    }

    async function searchPinterest(query) {
        if (!query) throw new Error("حط كلمة بحث");

        const cookies = await getCookies();
        if (!cookies) throw new Error("فشل جلب الكوكيز");

        const params = {
            source_url: `/search/videos/?q=${encodeURIComponent(query)}`,
            data: JSON.stringify({
                options: {
                    isPrefetch: false,
                    query,
                    scope: "videos",
                    bookmarks: [""],
                    page_size: 20,
                },
                context: {},
            }),
            _: Date.now(),
        };

        const { data } = await axios.get(`${base}${search}`, {
            headers: { ...headers, cookie: cookies },
            params,
        });

        const results =
            data?.resource_response?.data?.results || [];

        const pins = results
            .map(r => {
                const urls = Array.from(findUrls(r));
                const media = urls.find(isMedia);

                return {
                    id: r.id,
                    title: r.title || "بدون عنوان",
                    description: r.description || "بدون وصف",
                    pin_url: r.id ? `https://pinterest.com/pin/${r.id}` : null,
                    media: media || null,
                };
            })
            .filter(p => p.id);

        if (!pins.length) throw new Error("لا يوجد نتائج");

        return pins;
    }

    async function downloadPin(url) {
        try {
            const { data } = await axios.post(
                "https://pinterestdownloader.io/frontendService/DownloaderService",
                { url },
                {
                    headers: {
                        "content-type": "application/json",
                        origin: "https://pinterestdownloader.io",
                        referer: "https://pinterestdownloader.io/",
                        "user-agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    },
                }
            );

            const media =
                data?.medias?.find(m => m.type === "video") ||
                data?.medias?.[0];

            if (!media?.url) throw new Error("مفيش فيديو");

            return {
                title: data.title,
                thumbnail: data.thumbnail,
                video: media.url,
                quality: media.quality || "unknown",
            };
        } catch (e) {
            throw new Error(e.message);
        }
    }

    // 🔥 Search API
    app.get("/api/pinterest", async (req, res) => {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                error: "حط query"
            });
        }

        try {
            const result = await searchPinterest(query);

            res.json({
                status: true,
                result
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

    // 🔥 Download API
    app.get("/api/pinterest/download", async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "حط url"
            });
        }

        try {
            const result = await downloadPin(url);

            res.json({
                status: true,
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
