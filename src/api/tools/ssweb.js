const axios = require("axios");

module.exports = function (app) {

  app.get("/tools/screen", async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "هات رابط الموقع"
      });
    }

    try {

      // نفس فكرة thum.io اللي في البوت
      const screenshotUrl = `https://image.thum.io/get/fullpage/${url}`;

      // محاكاة تأخير زي البوت (5 ثواني)
      setTimeout(async () => {

        try {
          const img = await axios.get(screenshotUrl, {
            responseType: "arraybuffer"
          });

          const buffer = Buffer.from(img.data);

          res.setHeader("Content-Type", "image/png");
          res.send(buffer);

        } catch (err) {
          res.status(500).json({
            status: false,
            error: "فشل تحميل الصورة"
          });
        }

      }, 5000);

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};