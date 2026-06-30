const { createCanvas, loadImage, registerFont } = require("canvas");
const { fileTypeFromBuffer } = require("file-type");
const assets = require("@putuofc/assetsku");

registerFont(assets.font.get("MONTSERRAT-BOLD"), { family: "Montserrat" });

module.exports = function (app) {

  function applyText(canvas, text, defaultFontSize, width, font) {
    const ctx = canvas.getContext("2d");
    do {
      defaultFontSize -= 1;
      ctx.font = `${defaultFontSize}px ${font}`;
    } while (ctx.measureText(text).width > width);
    return ctx.font;
  }

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

  async function generateWelcomeV5(username, guildName, memberCount, avatar, background, quality) {
    const canvas = createCanvas(1024, 450);
    const ctx = canvas.getContext("2d");

    const bg = await loadImage(background);
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // Avatar
    const avatarSize = 180;
    const avatarX = canvas.width / 2;
    const avatarY = 140;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const av = await loadImage(avatar);
    ctx.drawImage(av, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2 + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 10;
    ctx.stroke();

    // Username
    ctx.font = `bold 60px Montserrat`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    if (ctx.measureText(username).width > canvas.width - 100) {
      ctx.font = applyText(canvas, username, 60, canvas.width - 100, "Montserrat");
    }

    ctx.fillText(username, canvas.width / 2, 290);

    // Guild + count
    ctx.font = `bold 30px Montserrat`;
    ctx.fillText(`Welcome To ${guildName}`, canvas.width / 2, 340);

    ctx.font = `bold 24px Montserrat`;
    ctx.fillText(`Member ${memberCount}`, canvas.width / 2, 380);

    return canvas.toBuffer("image/jpeg", { quality: quality / 100 });
  }

  // ================= GET =================
  app.get("/api/canvas/welcomev5", async (req, res) => {
    try {
      let { username, guildName, memberCount, avatar, background, quality } = req.query;

      if (!username || !guildName || !memberCount || !avatar || !background) {
        return res.status(400).json({
          status: false,
          message: "Missing parameters"
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

      quality = parseInt(quality) || 100;
      if (quality < 1) quality = 1;
      if (quality > 100) quality = 100;

      const buffer = await generateWelcomeV5(
        username,
        guildName,
        parseInt(memberCount),
        avatar,
        background,
        quality
      );

      res.set({
        "Content-Type": "image/jpeg",
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