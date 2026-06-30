const axios = require("axios");
const Canvas = require("canvas");
const { fileTypeFromBuffer } = require("file-type");
const assets = require("@putuofc/assetsku");

module.exports = function (app) {

  class Gay {
    constructor() {
      this.bg = assets.image.get("BGAY");
      this.fm = assets.image.get("GYF");
      this.pp = "https://files.catbox.moe/g45kly.jpg";
      this.nama = "siputzx";
      this.num = "87";
    }

    setName(value) {
      this.nama = value;
      return this;
    }

    setAvatar(value) {
      this.pp = value;
      return this;
    }

    setNum(value) {
      this.num = value;
      return this;
    }

    async toBuffer() {
      let pp;

      if (Buffer.isBuffer(this.pp)) {
        const type = await fileTypeFromBuffer(this.pp);
        if (!type || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type.mime)) {
          throw new Error("Unsupported image type");
        }
        const dataURI = `data:${type.mime};base64,${this.pp.toString("base64")}`;
        pp = await Canvas.loadImage(dataURI);
      } else {
        const response = await axios.get(this.pp, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data);

        const type = await fileTypeFromBuffer(buffer);
        if (!type || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(type.mime)) {
          throw new Error("Unsupported image type");
        }

        pp = await Canvas.loadImage(buffer);
      }

      const canvas = Canvas.createCanvas(600, 450);
      const ctx = canvas.getContext("2d");

      const bg = await Canvas.loadImage(this.bg);
      ctx.drawImage(bg, 0, 0, 600, 450);

      ctx.save();
      ctx.beginPath();
      ctx.arc(300, 160, 100, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(pp, 200, 60, 200, 200);

      const frame = await Canvas.loadImage(this.fm);
      ctx.drawImage(frame, 200, 60, 200, 200);

      ctx.restore();

      let name = this.nama.length > 16 ? this.nama.substring(0, 16) : this.nama;

      ctx.font = "30px Sans";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(`~${name}~`, 300, 300);

      ctx.font = "bold 48px Sans";
      ctx.fillStyle = "#ff4b74";
      ctx.fillText(`~ ${this.num} ~`, 300, 370);

      return canvas.toBuffer("image/png");
    }
  }

  app.get("/api/canvas/gay", async (req, res) => {
    try {
      const { nama, avatar, num } = req.query;

      // ❌ تحقق
      if (!nama) {
        return res.status(400).json({ status: false, message: "Name is required" });
      }

      if (!avatar) {
        return res.status(400).json({ status: false, message: "Avatar URL is required" });
      }

      if (!num) {
        return res.status(400).json({ status: false, message: "Number is required" });
      }

      if (isNaN(parseInt(num)) || parseInt(num) < 0) {
        return res.status(400).json({ status: false, message: "Number must be positive" });
      }

      // ✅ إنشاء الصورة
      const buffer = await new Gay()
        .setName(nama)
        .setAvatar(avatar)
        .setNum(num)
        .toBuffer();

      // ✅ إرسال الصورة
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
        error: err.message,
      });
    }
  });

};