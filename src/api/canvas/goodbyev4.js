const canvafy = require("canvafy");

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

  async function generateImageFromUrl(avatar, background, description) {
    return await new canvafy.WelcomeLeave()
      .setAvatar(avatar)
      .setBackground("image", background)
      .setTitle("Goodbye")
      .setDescription(description)
      .setBorder("#2a2e35")
      .setAvatarBorder("#2a2e35")
      .setOverlayOpacity(0.3)
      .build();
  }

  // ================= GET =================
  app.get("/api/canvas/goodbyev4", async (req, res) => {
    try {
      const { avatar, background, description } = req.query;

      if (!avatar || typeof avatar !== "string") {
        return res.status(400).json({
          status: false,
          message: "Avatar URL is required"
        });
      }

      if (!background || typeof background !== "string") {
        return res.status(400).json({
          status: false,
          message: "Background URL is required"
        });
      }

      if (!description || typeof description !== "string") {
        return res.status(400).json({
          status: false,
          message: "Description is required"
        });
      }

      if (!isValidImageUrl(avatar) || !isValidImageUrl(background)) {
        return res.status(400).json({
          status: false,
          message: "Invalid image URL (jpg/png/webp/gif only)"
        });
      }

      const buffer = await generateImageFromUrl(
        avatar,
        background,
        description
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