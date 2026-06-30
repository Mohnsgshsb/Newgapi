const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");
const { createCanvas, loadImage, registerFont } = require("canvas");
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

  async function generateGoodbyeImage(username, guildName, memberCount, avatar, background) {
    const canvas = createCanvas(512, 256);
    const ctx = canvas.getContext("2d");

    const frame = assets.image.get("GOODBYE2");

    const [bgImg, frameImg, avatarImg] = await Promise.all([
      loadImage(await processImage(background)),
      loadImage(frame),
      loadImage(await processImage(avatar)),
    ]);

    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.beginPath();
    ctx.rotate((-17 * Math.PI) / 180);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.drawImage(avatarImg, -4, 110, 96, 96);
    ctx.strokeRect(-4, 110, 96, 96);
    ctx.restore();

    const name = guildName.length > 10 ? guildName.substring(0, 10) + "..." : guildName;

    ctx.font = "18px CubestMedium";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(name, 336, 158);

    ctx.font = "700 18px Courier New";
    ctx.textAlign = "left";
    ctx.fillText(`${memberCount}th member`, 214, 248);

    const uname = username.length > 12 ? username.substring(0, 15) + "..." : username;

    ctx.font = "700 24px Courier New";
    ctx.fillText(uname, 208, 212);

    return canvas.toBuffer("image/png");
  }

  // ================= GET =================
  app.get("/api/canvas/goodbyev2", async (req, res) => {
    try {
      const { username, guildName, memberCount, avatar, background } = req.query;

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

      const urls = [avatar, background];
      if (urls.some(u => !isValidImageUrl(u))) {
        return res.status(400).json({
          status: false,
          message: "Invalid image URL"
        });
      }

      const buffer = await generateGoodbyeImage(
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