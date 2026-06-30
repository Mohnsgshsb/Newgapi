const axios = require("axios");

module.exports = function (app) {

  async function fastdl(url) {
    try {
      url = url.split("?")[0];

      const headers = {
        accept: "*/*",
        "user-agent": "Mozilla/5.0 (Linux; Android 10)",
        referer: "https://fastdl.cc/"
      };

      let endpoint;
      let referer;

      if (url.includes("/reel/")) {
        endpoint = "reels/download";
        referer = "https://fastdl.cc/reels";
      } else if (url.includes("/stories/")) {
        endpoint = "story/download";
        referer = "https://fastdl.cc/story";
      } else {
        endpoint = "img/download";
        referer = "https://fastdl.cc/photo";
      }

      headers.referer = referer;

      const { data } = await axios.get(
        `https://fastdl.cc/${endpoint}?url=${encodeURIComponent(url)}`,
        { headers, timeout: 20000 }
      );

      if (!data.success) throw new Error("Media not found");

      let media = [];

      if (data.images) {
        media = data.images.map(v => v.url);
      } else if (data.url) {
        media = [data.url];
      }

      return {
        status: true,
        type: data.type,
        total: media.length,
        media
      };

    } catch (e) {
      return {
        status: false,
        message: e.message
      };
    }
  }

  // ================= API =================
  app.get("/api/fastigdl", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "حط رابط انستجرام ?url="
      });
    }

    if (!url.includes("instagram.com")) {
      return res.status(400).json({
        status: false,
        error: "رابط غير صحيح"
      });
    }

    try {
      const result = await fastdl(url);

      if (!result.status) {
        return res.json({
          status: false,
          creator: "TERBO-SPAM",
          message: result.message
        });
      }

      res.json({
        status: true,
        creator: "TERBO-SPAM",
        input: url,
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