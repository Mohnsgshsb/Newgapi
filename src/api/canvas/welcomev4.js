const canvafy = require("canvafy");
const { fileTypeFromBuffer } = require("file-type");

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

  async function generateWelcomeV4(avatar, background, description) {
    const image = await new canvafy.WelcomeLeave()
      .setAvatar(avatar)
      .setBackground("image", background)
      .setDescription(description)
      .setBorder("#2a2e35")
      .setAvatarBorder("#2a2e35")
      .setOverlayOpacity(0.3)
      .build();

    return image;
  }

  // ================= GET =================
  app.get("/api/canvas/welcomev4", async (req, res) => {
    try {
      let { avatar, background, description } = req.query;

      if (!avatar || !background || !description) {
        return res.status(400).json({
          status: false,
          message: "Missing parameters"
        });
      }

      if (!isValidImageUrl(avatar) || !isValidImageUrl(background)) {
        return res.status(400).json({
          status: false,
          message: "Invalid image URL"
        });
      }

      const buffer = await generateWelcomeV4(
        avatar,
        background,
        description
      );

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