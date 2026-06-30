const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const { fileTypeFromBuffer } = require("file-type");
const assets = require("@putuofc/assetsku");

module.exports = function (app) {

  function isValidImageUrl(url) {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.toLowerCase();
      const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      return validExtensions.some(ext => path.endsWith(ext));
    } catch {
      return false;
    }
  }

  async function isValidImageBuffer(buffer) {
    const type = await fileTypeFromBuffer(buffer);
    return type && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime);
  }

  async function generateWelcomeV3(username, avatar) {
    const canvas = createCanvas(650, 300);
    const ctx = canvas.getContext("2d");

    const bg = assets.image.get("WELCOME3");

    const [background, avatarImg] = await Promise.all([
      loadImage(bg).catch(() => loadImage(assets.image.get("DEFAULT_BG"))),
      loadImage(avatar).catch(() => loadImage(assets.image.get("DEFAULT_AVATAR")))
    ]);

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const name = username.length > 10 ? username.substring(0, 10) + "..." : username;

    ctx.font = "700 45px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(name, 290, 260);

    ctx.save();
    ctx.beginPath();
    ctx.arc(325, 150, 75, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avatarImg, 250, 75, 150, 150);
    ctx.restore();

    return canvas.toBuffer("image/png");
  }

  // ================= GET =================
  app.get("/api/canvas/welcomev3", async (req, res) => {
    try {
      let { username, avatar } = req.query;

      if (!username || !avatar) {
        return res.status(400).json({
          status: false,
          message: "Missing parameters"
        });
      }

      if (!isValidImageUrl(avatar)) {
        return res.status(400).json({
          status: false,
          message: "Invalid avatar URL"
        });
      }

      const buffer = await generateWelcomeV3(username, avatar);

      res.set({
        "Content-Type": "image/png",
        "Content-Length": buffer.length
      });

      res.send(buffer);

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