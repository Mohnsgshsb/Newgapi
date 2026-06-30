const express = require("express")
const axios = require("axios")
const cheerio = require("cheerio")

const router = express.Router()

const proxy = () => null // عدلها لو عندك بروكسي

// ================= FUNCTION =================
async function getAnimeDetail(url) {
  try {
    const { data } = await axios.get((proxy() || "") + url, {
      timeout: 30000,
    })

    const $ = cheerio.load(data)

    const animeInfo = {
      title: $(".fotoanime .infozingle p span b:contains('Judul')")
        .parent().text().replace("Judul: ", "").trim(),

      japaneseTitle: $(".fotoanime .infozingle p span b:contains('Japanese')")
        .parent().text().replace("Japanese: ", "").trim(),

      score: $(".fotoanime .infozingle p span b:contains('Skor')")
        .parent().text().replace("Skor: ", "").trim(),

      producer: $(".fotoanime .infozingle p span b:contains('Produser')")
        .parent().text().replace("Produser: ", "").trim(),

      type: $(".fotoanime .infozingle p span b:contains('Tipe')")
        .parent().text().replace("Tipe: ", "").trim(),

      status: $(".fotoanime .infozingle p span b:contains('Status')")
        .parent().text().replace("Status: ", "").trim(),

      totalEpisodes: $(".fotoanime .infozingle p span b:contains('Total Episode')")
        .parent().text().replace("Total Episode: ", "").trim(),

      duration: $(".fotoanime .infozingle p span b:contains('Durasi')")
        .parent().text().replace("Durasi: ", "").trim(),

      releaseDate: $(".fotoanime .infozingle p span b:contains('Tanggal Rilis')")
        .parent().text().replace("Tanggal Rilis: ", "").trim(),

      studio: $(".fotoanime .infozingle p span b:contains('Studio')")
        .parent().text().replace("Studio: ", "").trim(),

      genres: $(".fotoanime .infozingle p span b:contains('Genre')")
        .parent().text().replace("Genre: ", "").trim(),

      imageUrl: $(".fotoanime img").attr("src"),
    }

    const episodes = []

    $(".episodelist ul li").each((_, el) => {
      episodes.push({
        title: $(el).find("span a").text(),
        link: $(el).find("span a").attr("href"),
        date: $(el).find(".zeebr").text(),
      })
    })

    return { animeInfo, episodes }

  } catch (err) {
    console.error("API Error:", err.message)
    throw new Error("Failed to fetch anime data")
  }
}

// ================= GET =================
router.get("/anime/otakudesu/detail", async (req, res) => {
  const { url } = req.query

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      status: false,
      error: "URL is required",
    })
  }

  try {
    const data = await getAnimeDetail(url.trim())

    res.json({
      status: true,
      data,
      timestamp: new Date().toISOString(),
    })

  } catch (err) {
    res.status(500).json({
      status: false,
      error: err.message,
    })
  }
})

// ================= POST =================
router.post("/anime/otakudesu/detail", async (req, res) => {
  const { url } = req.body

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      status: false,
      error: "URL is required",
    })
  }

  try {
    const data = await getAnimeDetail(url.trim())

    res.json({
      status: true,
      data,
      timestamp: new Date().toISOString(),
    })

  } catch (err) {
    res.status(500).json({
      status: false,
      error: err.message,
    })
  }
})

module.exports = router