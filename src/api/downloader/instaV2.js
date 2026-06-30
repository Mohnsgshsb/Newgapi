const axios = require('axios');

module.exports = function (app) {

  app.get('/api/instav2', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: 'حط الرابط'
      });
    }

    try {
      const response = await axios.post(
        'https://downloadapi.stuff.solutions/api/json',
        {
          url: url,
          isAudioOnly: false,
          filenameStyle: "pretty"
        },
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/146.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-Type': 'application/json',
            'sec-ch-ua-platform': '"Android"',
            'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Android WebView";v="146"',
            'sec-ch-ua-mobile': '?1',
            'origin': 'https://tiktok-downloader-hd.vercel.app',
            'x-requested-with': 'mark.via.gp',
            'sec-fetch-site': 'cross-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'referer': 'https://tiktok-downloader-hd.vercel.app/',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'priority': 'u=1, i'
          },
          timeout: 30000
        }
      );

      const data = response.data;

      if (!data || !data.url) {
        return res.status(500).json({
          status: false,
          message: 'فشل في التحميل'
        });
      }

      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        result: {
          title: data.title,
          thumbnail: data.thumbnail,
          media: data.url,
          type: data.type
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