const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeMusicApple(query, region = 'us') {
    try {
        const { data } = await axios.get(
            `https://music.apple.com/${region}/search?term=${encodeURIComponent(query)}`,
            {
                timeout: 30000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                }
            }
        );

        const $ = cheerio.load(data);
        let results = [];

        $('.top-search-lockup').each((i, el) => {
            const title = $(el).find('.top-search-lockup__primary__title').text().trim();
            const artist = $(el).find('.top-search-lockup__secondary').text().trim();
            const link = $(el).find('.click-action').attr('href');
            const image = $(el).find('picture source').attr('srcset')?.split(' ')[0];

            if (title && artist && link) {
                results.push({
                    title,
                    artist,
                    link: link.startsWith('http') ? link : `https://music.apple.com${link}`,
                    image: image || null
                });
            }
        });

        return results;

    } catch (e) {
        throw new Error('Failed to scrape Apple Music');
    }
}

module.exports = function (app) {

    // ✅ GET
    app.get('/api/applemusic', async (req, res) => {
        const { query, region = 'us' } = req.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "query" مطلوب'
            });
        }

        if (typeof query !== 'string' || !query.trim()) {
            return res.status(400).json({
                status: false,
                error: 'Query لازم يكون نص'
            });
        }

        if (query.length > 255) {
            return res.status(400).json({
                status: false,
                error: 'Query كبير زيادة'
            });
        }

        if (region && !/^[a-z]{2}$/.test(region)) {
            return res.status(400).json({
                status: false,
                error: 'Region غلط'
            });
        }

        try {
            const result = await scrapeMusicApple(query.trim(), region.trim());

            res.json({
                status: true,
                total: result.length,
                result,
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

    // ✅ POST
    app.post('/search/applemusic', async (req, res) => {
        const { query, region = 'us' } = req.body;

        if (!query) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "query" مطلوب'
            });
        }

        try {
            const result = await scrapeMusicApple(query.trim(), region.trim());

            res.json({
                status: true,
                total: result.length,
                result,
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};