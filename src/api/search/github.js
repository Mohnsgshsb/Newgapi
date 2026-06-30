const axios = require('axios');

module.exports = function (app) {

    app.get('/search/github', async (req, res) => {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "query" مطلوب.'
            });
        }

        try {
            const { data } = await axios.get(`https://api.github.com/search/repositories`, {
                params: {
                    q: query,
                    per_page: 10
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            const result = data.items.map(repo => ({
                name: repo.name,
                full_name: repo.full_name,
                url: repo.html_url,
                description: repo.description,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language,
                owner: repo.owner.login
            }));

            res.json({
                status: true,
                total: result.length,
                result
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: 'فشل في جلب البيانات من GitHub',
                message: err.message
            });
        }
    });

};