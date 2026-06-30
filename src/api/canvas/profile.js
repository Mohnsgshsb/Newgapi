const { createCanvas, loadImage } = require("canvas");
const { fileTypeFromBuffer } = require("file-type");

module.exports = function (app) {

  // ================= Utils =================

  async function isValidImageBuffer(buffer) {
    const type = await fileTypeFromBuffer(buffer);
    return type && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime);
  }

  function isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  // ================= Canvas =================

  async function generateProfileImage(
    background,
    avatar,
    rankName,
    rankId,
    exp,
    requireExp,
    level,
    name
  ) {
    const width = 850;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const bgImg = await loadImage(background);
    const avatarImg = await loadImage(avatar);

    ctx.drawImage(bgImg, 0, 0, width, height);

    // Overlay
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath();
    ctx.moveTo(50, 20);
    ctx.arcTo(width - 20, 20, width - 20, height - 20, 30);
    ctx.arcTo(width - 20, height - 20, 20, height - 20, 30);
    ctx.arcTo(20, height - 20, 20, 20, 30);
    ctx.arcTo(20, 20, width - 20, 20, 30);
    ctx.closePath();
    ctx.fill();

    // Avatar
    const avatarSize = 120;
    ctx.save();
    ctx.beginPath();
    ctx.arc(100, height / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, 40, height / 2 - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();

    ctx.strokeStyle = "#FFCC33";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(100, height / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Text
    ctx.fillStyle = "#fff";
    ctx.font = "bold 36px Arial";
    ctx.fillText(name, 180, height / 2 - 20);

    ctx.font = "bold 28px Arial";
    ctx.fillText(`LEVEL ${level}`, width - 200, 80);

    ctx.font = "bold 22px Arial";
    ctx.fillText(`${rankName} ${rankId}`, width - 200, 120);

    // Progress Bar
    const barWidth = 600;
    const barHeight = 30;
    const barX = 180;
    const barY = height / 2 + 20;

    const progress = Math.max(0, Math.min(1, exp / requireExp));

    ctx.fillStyle = "#363636";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = "#FFCC33";
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    ctx.strokeStyle = "#FFCC33";
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${exp} / ${requireExp} XP`, barX + barWidth / 2, barY + 20);

    return canvas.toBuffer("image/png");
  }

  // ================= GET =================

  app.get("/api/canvas/profile", async (req, res) => {
    try {
      const {
        backgroundURL,
        avatarURL,
        rankName,
        rankId,
        exp,
        requireExp,
        level,
        name,
      } = req.query;

      if (!isValidUrl(backgroundURL) || !isValidUrl(avatarURL)) {
        return res.status(400).json({
          status: false,
          message: "Invalid URL"
        });
      }

      const parsedExp = parseInt(exp);
      const parsedRequireExp = parseInt(requireExp);
      const parsedLevel = parseInt(level);

      if ([parsedExp, parsedRequireExp, parsedLevel].some(isNaN)) {
        return res.status(400).json({
          status: false,
          message: "Invalid numbers"
        });
      }

      const buffer = await generateProfileImage(
        backgroundURL,
        avatarURL,
        rankName,
        rankId,
        parsedExp,
        parsedRequireExp,
        parsedLevel,
        name
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
        message: "❌ Error",
        error: err.message
      });
    }
  });

  // ================= POST =================

  app.post("/api/canvas/profile", async (req, res) => {
    try {
      const { rankName, rankId, exp, requireExp, level, name } = req.body;

      const avatarFile = req.files?.avatar;
      const bgFile = req.files?.background;

      if (!avatarFile || !(await isValidImageBuffer(avatarFile.data))) {
        return res.status(400).json({ status: false, message: "Invalid avatar" });
      }

      if (!bgFile || !(await isValidImageBuffer(bgFile.data))) {
        return res.status(400).json({ status: false, message: "Invalid background" });
      }

      const buffer = await generateProfileImage(
        bgFile.data,
        avatarFile.data,
        rankName,
        rankId,
        parseInt(exp),
        parseInt(requireExp),
        parseInt(level),
        name
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
        message: "❌ Error",
        error: err.message
      });
    }
  });

};