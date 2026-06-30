const axios = require('axios');

module.exports = function (app) {

    app.get('/download/soundcloud', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "url" مطلوب.'
            });
        }

        try {
            const response = await axios.post(
                'https://snapfrom.com/wp-json/aio-dl/video-data/',
                new URLSearchParams({
                    url: url,
                    token: '1f91c03707528fc9d3e507fadcf4c5bdd75e9ed776306422bb64fa76559ed3c8'
                }),
                {
                    headers: {
                        'authority': 'snapfrom.com',
                        'accept': '*/*',
                        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                        'content-type': 'application/x-www-form-urlencoded',
                        'origin': 'https://snapfrom.com',
                        'referer': 'https://snapfrom.com/soundcloud-music-downloader/',
                        'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
                        'sec-ch-ua-mobile': '?1',
                        'sec-ch-ua-platform': '"Android"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
                    }
                }
            );

            res.json({
                status: true,
                result: response.data
            });

        } catch (err) {
            if (err.response) {
                return res.status(err.response.status).json({
                    status: false,
                    error: 'API request failed',
                    message: err.response.data
                });
            }

            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};