const axios = require("axios")
const cheerio = require("cheerio")

const proxy = global.proxy || (() => null)

async function getAnimeDownloadLinks(url) {
  try {
    const { data } = await axios.get(proxy() + url, {
      timeout: 30000,
    })

    const $ = cheerio.load(data)

    const episodeInfo = {
      title: $(".download h4").text().trim(),
      downloads: [],
    }

    $(".download ul li").each((index, element) => {
      const quality = $(element).find("strong").text().trim()

      const links = $(element)
        .find("a")
        .map((i, el) => ({
          quality,
          link: $(el).attr("href"),
          host: $(el).text().trim(),
        }))
        .get()

      episodeInfo.downloads.push(...links)
    })

    return episodeInfo
  } catch (error) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

module.exports = [
  {
    metode: "GET",
    endpoint: "/api/anime/otakudesu/download",
    name: "otakudesu download",
    category: "Anime",
    description: "Get anime download links from Otakudesu",
    tags: ["Anime", "Otakudesu", "Download"],
    example: "?url=https://otakudesu.cloud/lengkap/btr-nng-sub-indo-part-1/",
    parameters: [
      {
        name: "url",
        in: "query",
        required: true,
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,

    async run({ req }) {
      const { url } = req.query || {}

      if (!url || typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      try {
        const data = await getAnimeDownloadLinks(url.trim())
        return {
          status: true,
          data,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },

  {
    metode: "POST",
    endpoint: "/api/anime/otakudesu/download",
    name: "otakudesu download",
    category: "Anime",
    description: "Get anime download links from Otakudesu (POST)",
    tags: ["Anime", "Otakudesu", "Download"],

    async run({ req }) {
      const { url } = req.body || {}

      if (!url || typeof url !== "string" || url.trim().length === 0) {
        return {
          status: false,
          error: "URL parameter is required",
          code: 400,
        }
      }

      try {
        const data = await getAnimeDownloadLinks(url.trim())
        return {
          status: true,
          data,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]