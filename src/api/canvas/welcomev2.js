const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { fileTypeFromBuffer } = require("file-type");
const assets = require("@putuofc/assetsku");

registerFont(assets.font.get("CUBESTMEDIUM"), { family: "CubestMedium" });

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

  async function generateWelcomeV2Image(
    username,
    guildName,
    memberCount,
    avatar,
    background
  ) {
    const canvas = createCanvas(512, 256);
    const ctx = canvas.getContext("2d");

    const frame = assets.image.get("WELCOME2");

    const [bg, fr, av] = await Promise.all([
      loadImage(background).catch(() => loadImage(assets.image.get("DEFAULT_BG"))),
      loadImage(frame).catch(() => loadImage(assets.image.get("DEFAULT_FRAME"))),
      loadImage(avatar).catch(() => loadImage(assets.image.get("DEFAULT_AVATAR"))),
    ]);

    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(fr, 0, 0, canvas.width, canvas.height);

    // Avatar rotated
    ctx.save();
    ctx.rotate((-17 * Math.PI) / 180);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.drawImage(av, -4, 110, 96, 96);
    ctx.strokeRect(-4, 110, 96, 96);
    ctx.restore();

    // Guild name
    const name = guildName.length > 10 ? guildName.substring(0, 10) + "..." : guildName;
    ctx.font = "18px CubestMedium";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(name, 336, 158);

    // Member count
    ctx.font = "18px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`${memberCount}th member`, 214, 248);

    // Username
    const uname = username.length > 12 ? username.substring(0, 15) + "..." : username;
    ctx.font = "24px Arial";
    ctx.fillText(uname, 208, 212);

    return canvas.toBuffer("image/png");
  }

  // ================= GET =================
  app.get("/api/canvas/welcomev2", async (req, res) => {
    try {
      const { username, guildName, memberCount, avatar, background } = req.query;

      if (!username || !guildName || !memberCount || !avatar || !background) {
        return res.status(400).json({
          status: false,
          message: "Missing parameters"
        });
      }

      if (username.length > 25) {
        return res.status(400).json({
          status: false,
          message: "username max 25"
        });
      }

      if (guildName.length > 50) {
        return res.status(400).json({
          status: false,
          message: "guildName max 50"
        });
      }

      if (isNaN(parseInt(memberCount))) {
        return res.status(400).json({
          status: false,
          message: "memberCount must be number"
        });
      }

      if (!isValidImageUrl(avatar) || !isValidImageUrl(background)) {
        return res.status(400).json({
          status: false,
          message: "Invalid image URL"
        });
      }

      const buffer = await generateWelcomeV2Image(
        username,
        guildName,
        parseInt(memberCount),
        avatar,
        background
      );

      res.set({
        "Content-Type": "image/png",
        "Content-Length": buffer.length,
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