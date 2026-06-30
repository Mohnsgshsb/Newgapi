const axios = require("axios");
const { fileTypeFromBuffer } = require("file-type");
const { createCanvas, loadImage } = require("canvas");
const assets = require("@putuofc/assetsku");

module.exports = function (app) {

  async function isValidImageBuffer(buffer) {
    const type = await fileTypeFromBuffer(buffer);
    return type && ["image/png","image/jpeg","image/jpg","image/webp","image/gif"].includes(type.mime);
  }

  async function generateGoodbyeImage(username, imageBuffer) {
    const canvas = createCanvas(650, 300);
    const ctx = canvas.getContext("2d");

    const bg = assets.image.get("GOODBYE3");

    const [background, avatarImg] = await Promise.all([
      loadImage(bg),
      loadImage(imageBuffer),
    ]);

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const name = username.length > 10 ? username.substring(0, 10) + "..." : username;

    ctx.font = "700 45px Courier New";
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(name, 290, 338);

    ctx.font = "700 30px Courier New";
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    ctx.fillText(name, 325, 273);

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "white";
    ctx.arc(325, 150, 75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avatarImg, 250, 75, 150, 150);
    ctx.restore();

    return canvas.toBuffer("image/png");
  }

  // ================= GET =================
  app.get("/api/canvas/goodbyev3", async (req, res) => {
    try {
      const { username, avatar } = req.query;

      if (!username || typeof username !== "string") {
        return res.status(400).json({
          status: false,
          message: "Username is required"
        });
      }

      if (!avatar || typeof avatar !== "string") {
        return res.status(400).json({
          status: false,
          message: "Avatar URL is required"
        });
      }

      const response = await axios.get(avatar, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);

      if (!(await isValidImageBuffer(buffer))) {
        return res.status(400).json({
          status: false,
          message: "Invalid image type"
        });
      }

      const image = await generateGoodbyeImage(username.trim(), buffer);

      res.set({
        "Content-Type": "image/png",
        "Content-Length": image.length,
      });

      res.send(image);

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