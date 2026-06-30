const axios = require("axios");
const crypto = require("crypto");
const FormData = require("form-data");

module.exports = function (app) {

  const noise = {

    cypher: (t, r = "cryptoJS") => {
      t = t.toString();

      const e = crypto.randomBytes(32);
      const a = crypto.randomBytes(16);
      const k = crypto.pbkdf2Sync(r, e, 999, 32, "sha512");

      const cipher = crypto.createCipheriv("aes-256-cbc", k, a);

      let enc = cipher.update(t, "utf8", "base64");
      enc += cipher.final("base64");

      return {
        amtext: enc,
        slam_ltol: e.toString("hex"),
        iavmol: a.toString("hex")
      };
    },

    run: async (buffer) => {
      const ts = Math.floor(Date.now() / 1000);
      const enc = noise.cypher(ts);

      const form = new FormData();

      form.append("media", buffer, {
        filename: crypto.randomBytes(3).toString("hex") + ".mp3"
      });

      form.append("fingerprint", crypto.randomBytes(16).toString("hex"));
      form.append("mode", "pulse");

      form.append("amtext", enc.amtext);
      form.append("slam_ltol", enc.slam_ltol);
      form.append("iavmol", enc.iavmol);

      const { data } = await axios.post(
        "https://noiseremoval.net/wp-content/plugins/audioenhancer/requests/noiseremoval/noiseremovallimited.php",
        form,
        {
          headers: {
            ...form.getHeaders(),
            "user-agent": "Mozilla/5.0",
            "x-requested-with": "XMLHttpRequest",
            "referer": "https://noiseremoval.net/"
          }
        }
      );

      return data;
    }
  };

  // =========================
  // API (SAME STYLE PROJECT)
  // =========================
  app.post("/api/noise", async (req, res) => {

    const { media } = req.body;

    if (!media) {
      return res.status(400).json({
        status: false,
        error: "حط صوت (url أو base64)"
      });
    }

    try {

      let buffer;

      if (media.startsWith("data:")) {
        buffer = Buffer.from(media.split(",")[1], "base64");
      } else {
        const file = await axios.get(media, {
          responseType: "arraybuffer"
        });
        buffer = Buffer.from(file.data);
      }

      const result = await noise.run(buffer);

      return res.json({
        status: true,
        creator: "Mohnd",
        result
      });

    } catch (err) {
      return res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};
