const { createCanvas, loadImage } = require("canvas");

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

  async function generateLevelUp(background, avatar, fromLevel, toLevel, name) {
    const width = 600;
    const height = 150;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const bg = await loadImage(background);
    ctx.drawImage(bg, 0, 0, width, height);

    const overlayX = 10;
    const overlayY = 10;
    const overlayWidth = width - 20;
    const overlayHeight = height - 20;
    const overlayRadius = 40;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.moveTo(overlayX + overlayRadius, overlayY);
    ctx.arcTo(overlayX + overlayWidth, overlayY, overlayX + overlayWidth, overlayY + overlayHeight, overlayRadius);
    ctx.arcTo(overlayX + overlayWidth, overlayY + overlayHeight, overlayX, overlayY + overlayHeight, overlayRadius);
    ctx.arcTo(overlayX, overlayY + overlayHeight, overlayX, overlayY, overlayRadius);
    ctx.arcTo(overlayX, overlayY, overlayX + overlayWidth, overlayY, overlayRadius);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#FFCC33";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();

    const avatarSize = 100;
    const avatarX = overlayX + overlayRadius + 10;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const av = await loadImage(avatar);
    ctx.drawImage(av, avatarX, height / 2 - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, height / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#FFCC33";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText(name, avatarX + avatarSize + 20, height / 2 + 10);

    const circleSize = 55;
    const circleX1 = width - circleSize * 4 + 10;
    const circleX2 = width - circleSize * 2 - 8;
    const arrowX = circleX1 + circleSize + 10;

    // FROM
    ctx.beginPath();
    ctx.arc(circleX1 + circleSize / 2, height / 2, circleSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,204,51,0.3)";
    ctx.fill();
    ctx.strokeStyle = "#FFCC33";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(fromLevel, circleX1 + circleSize / 2, height / 2 + 8);

    // ARROW
    ctx.beginPath();
    ctx.moveTo(arrowX, height / 2 - 8);
    ctx.lineTo(arrowX + 20, height / 2);
    ctx.lineTo(arrowX, height / 2 + 8);
    ctx.closePath();
    ctx.fillStyle = "#FFCC33";
    ctx.fill();

    // TO
    ctx.beginPath();
    ctx.arc(circleX2 + circleSize / 2, height / 2, circleSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,204,51,0.3)";
    ctx.fill();
    ctx.strokeStyle = "#FFCC33";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.fillText(toLevel, circleX2 + circleSize / 2, height / 2 + 8);

    return canvas.toBuffer("image/png");
  }

  // ================= GET =================
  app.get("/api/canvas/level-up", async (req, res) => {
    try {
      const { background, avatar, fromLevel, toLevel, name } = req.query;

      if (!background || !avatar || !fromLevel || !toLevel || !name) {
        return res.status(400).json({
          status: false,
          message: "Missing parameters"
        });
      }

      if (!isValidImageUrl(background) || !isValidImageUrl(avatar)) {
        return res.status(400).json({
          status: false,
          message: "Invalid image URL"
        });
      }

      const buffer = await generateLevelUp(background, avatar, fromLevel, toLevel, name);

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