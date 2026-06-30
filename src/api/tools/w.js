const axios = require("axios");

module.exports = function (app) {

  const API_KEY = "060a6bcfa19809c2cd4d97a212b19273";

  app.get("/tools/weather", async (req, res) => {

    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        status: false,
        error: "اكتب اسم البلد مثال ?q=giza"
      });
    }

    try {

      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q,
            units: "metric",
            appid: API_KEY
          }
        }
      );

      const result = {
        name: data.name,
        country: data.sys.country,
        weather: data.weather[0].description,
        temperature: `${data.main.temp}°C`,
        min_temp: `${data.main.temp_min}°C`,
        max_temp: `${data.main.temp_max}°C`,
        humidity: `${data.main.humidity}%`,
        wind: `${data.wind.speed} km/h`
      };

      res.json({
        status: true,
        creator: "Mohnd",
        result
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: "City not found or API error"
      });
    }
  });

};