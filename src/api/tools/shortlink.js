const axios = require('axios');

module.exports = function (app) {

  app.get('/api/shortlink', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: 'حط الرابط'
      });
    }

    try {
      const response = await axios.post(
        'https://short.abella.icu/api/shorten',
        { url },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10) Chrome/138.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://short.abella.icu/'
          },
          compress: true,
          timeout: 20000
        }
      );

      const shortUrl = response.data?.shortUrl;

      if (!shortUrl) {
        return res.status(500).json({
          status: false,
          message: 'فشل في اختصار الرابط'
        });
      }

      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        result: {
          original: url,
          short: shortUrl
        }
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message
      });
    }
  });

};