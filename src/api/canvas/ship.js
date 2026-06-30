const axios = require("axios");
const canvafy = require("canvafy");
const { fileTypeFromBuffer } = require("file-type");

module.exports = function (app) {

  function createImageResponse(res, buffer) {
    res.set({
      "Content-Type": "image/png",
      "Content-Length": buffer.length,
      "Cache-Control": "public, max-age=3600",
    });
    return res.send(buffer);
  }

  async function isValidImageUrl(url) {
    if (!url || typeof url !== "string") return false;

    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) return false;

      const response = await axios.head(url, { timeout: 5000 });
      const contentType = response.headers["content-type"];

      return contentType && contentType.startsWith("image/");
    } catch {
      return false;
    }
  }

  async function isValidImageBuffer(buffer) {
    const type = await fileTypeFromBuffer(buffer);
    return type && [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif"
    ].includes(type.mime);
  }

  async function generateShipImageFromUrl(avatar1, avatar2, background, persen) {
    return await new canvafy.Ship()
      .setAvatars(avatar1, avatar2)
      .setBackground("image", background)
      .setBorder("#f0f0f0")
      .setCustomNumber(parseInt(persen))
      .setOverlayOpacity(0.5)
      .build();
  }

  async function generateShipImageFromFile(avatar1, avatar2, background, persen) {
    return await new canvafy.Ship()
      .setAvatars(avatar1, avatar2)
      .setBackground("image", background)
      .setBorder("#f0f0f0")
      .setCustomNumber(parseInt(persen))
      .setOverlayOpacity(0.5)
      .build();
  }

  // ================= GET =================
  app.get("/api/canvas/ship", async (req, res) => {
    try {
      const { avatar1, avatar2, background, persen } = req.query;

      if (!avatar1 || !avatar2 || !background || !persen) {
        return res.status(400).json({
          status: false,
          message: "Missing parameters"
        });
      }

      const parsedPersen = parseInt(persen);
      if (isNaN(parsedPersen) || parsedPersen < 0 || parsedPersen > 100) {
        return res.status(400).json({
          status: false,
          message: "persen must be between 0-100"
        });
      }

      const urls = [avatar1, avatar2, background];
      for (let url of urls) {
        if (!(await isValidImageUrl(url))) {
          return res.status(400).json({
            status: false,
            message: "Invalid image URL"
          });
        }
      }

      const buffer = await generateShipImageFromUrl(
        avatar1,
        avatar2,
        background,
        persen
      );

      return createImageResponse(res, buffer);

    } catch (err) {
      console.log(err);
      res.status(500).json({
        status: false,
        message: "❌ حصل خطأ",
        error: err.message
      });
    }
  });

  // ================= POST =================
  app.post("/api/canvas/ship", async (req, res) => {
    try {
      const { persen } = req.body;

      if (!persen) {
        return res.status(400).json({
          status: false,
          message: "persen required"
        });
      }

      const parsedPersen = parseInt(persen);
      if (isNaN(parsedPersen) || parsedPersen < 0 || parsedPersen > 100) {
        return res.status(400).json({
          status: false,
          message: "persen must be between 0-100"
        });
      }

      const avatar1 = req.files?.avatar1?.data;
      const avatar2 = req.files?.avatar2?.data;
      const background = req.files?.background?.data;

      if (!avatar1 || !avatar2 || !background) {
        return res.status(400).json({
          status: false,
          message: "Missing files"
        });
      }

      if (!(await isValidImageBuffer(avatar1)) ||
          !(await isValidImageBuffer(avatar2)) ||
          !(await isValidImageBuffer(background))) {
        return res.status(400).json({
          status: false,
          message: "Invalid image file"
        });
      }

      const buffer = await generateShipImageFromFile(
        avatar1,
        avatar2,
        background,
        persen
      );

      return createImageResponse(res, buffer);

    } catch (err) {
      console.log(err);
      res.status(500).json({
        status: false,
        message: "❌ حصل خطأ",
        error: err.message
      });
    }
  });

};