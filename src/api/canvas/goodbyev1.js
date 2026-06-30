const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");
const { createCanvas, loadImage, registerFont } = require("canvas");
const assets = require("@putuofc/assetsku");

registerFont(assets.font.get("THEBOLDFONT"), { family: "Bold" });

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

  async function processImage(image) {
    if (Buffer.isBuffer(image)) {
      const type = await fileTypeFromBuffer(image);
      if (!type || !["image/png","image/jpeg","image/jpg","image/webp","image/gif"].includes(type.mime)) {
        throw new Error("Unsupported image type");
      }
      return image;
    } else {
      const res = await axios.get(image, { responseType: "arraybuffer" });
      const buffer = Buffer.from(res.data);

      const type = await fileTypeFromBuffer(buffer);
      if (!type || !["image/png","image/jpeg","image/jpg","image/webp","image/gif"].includes(type.mime)) {
        throw new Error("Unsupported image type");
      }
      return buffer;
    }
  }

  async function generateGoodbyeImage(username, guildName, guildIcon, memberCount, avatar, background, quality) {
    const canvas = createCanvas(1024, 450);
    const ctx = canvas.getContext("2d");

    const bg = await loadImage(await processImage(background));
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    const overlay = await loadImage(assets.image.get("GOODBYE"));
    ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "45px Bold";
    ctx.textAlign = "center";
    ctx.fillText(username, canvas.width - 890, canvas.height - 60);

    ctx.font = "22px Bold";
    ctx.fillText(`- ${memberCount}th member !`, 90, canvas.height - 15);

    let name = guildName.length > 13 ? guildName.substring(0, 10) + "..." : guildName;
    ctx.font = "45px Bold";
    ctx.fillText(name, canvas.width - 225, canvas.height - 44);

    // avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(180, 160, 110, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const av = await loadImage(await processImage(avatar));
    ctx.drawImage(av, 45, 40, 270, 270);
    ctx.restore();

    // guild icon
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width - 150, canvas.height - 200, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const gi = await loadImage(await processImage(guildIcon));
    ctx.drawImage(gi, canvas.width - 230, canvas.height - 280, 160, 160);
    ctx.restore();

    return canvas.toBuffer("image/jpeg", { quality: quality / 100 });
  }

  // ================= GET =================
  app.get("/api/canvas/goodbyev1", async (req, res) => {
    try {
      let { username, guildName, guildIcon, memberCount, avatar, background, quality } = req.query;

      if (!username || !guildName || !guildIcon || !memberCount || !avatar || !background) {
        return res.status(400).json({ status: false, message: "Missing parameters" });
      }

      if (isNaN(parseInt(memberCount))) {
        return res.status(400).json({ status: false, message: "memberCount must be number" });
      }

      const urls = [guildIcon, avatar, background];
      if (urls.some(u => !isValidImageUrl(u))) {
        return res.status(400).json({ status: false, message: "Invalid image URL" });
      }

      quality = parseInt(quality) || 100;
      if (quality < 1) quality = 1;
      if (quality > 100) quality = 100;

      const buffer = await generateGoodbyeImage(
        username,
        guildName,
        guildIcon,
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