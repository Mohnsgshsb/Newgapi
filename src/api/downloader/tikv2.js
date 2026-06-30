const axios = require('axios');

module.exports = function (app) {

  app.get('/api/tikv2', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: 'حط لينك تيك توك'
      });
    }

    try {
      const response = await axios.post(
        'https://www.tikwm.com/api/',
        new URLSearchParams({
          url: url,
          hd: '1'
        }),
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/146.0.0.0 Mobile Safari/537.36',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
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

      if (!data || data.code !== 0) {
        return res.status(500).json({
          status: false,
          message: 'فشل في تحميل الفيديو'
        });
      }

      return res.json({
        status: true,
        creator: "TERBO-SPAM",
        result: {
          title: data.data.title,
          author: data.data.author?.nickname,
          cover: data.data.cover,
          duration: data.data.duration,
          hd: data.data.play,
          no_watermark: data.data.play,
          music: data.data.music
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