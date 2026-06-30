const axios = require("axios");

module.exports = function (app) {

    async function openai(text, logic) {
        const response = await axios.post(
            "https://chateverywhere.app/api/chat/",
            {
                model: {
                    id: "gpt-4",
                    name: "GPT-4",
                    maxLength: 32000,
                    tokenLimit: 8000,
                    completionTokenLimit: 5000,
                    deploymentName: "gpt-4"
                },
                messages: [
                    {
                        pluginId: null,
                        content: text,
                        role: "user"
                    }
                ],
                prompt: logic,
                temperature: 0.7
            },
            {
                headers: {
                    "Accept": "*/*",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                }
            }
        );

        return response.data;
    }

    // 🔥 endpoint
    app.get("/api/masry", async (req, res) => {
        try {
            const { text } = req.query;

            if (!text) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    message: "❌ اكتب السؤال ?text="
                });
            }

            let d = new Date(new Date().getTime() + 3600000);

            const time = new Date().toLocaleString("ar-EG", {
                timeZone: "Africa/Cairo"
            });

            let day = d.toLocaleDateString("ar-EG", { weekday: "long" });

            let date = d.toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

            let logic = `
اسمك مصري، عندك 19 سنة، وعايش في بولاق الدكرور في الجيزة 🇪🇬
اتكلم بالمصري العامي بس، وخليك طبيعي وعفوي جدًا كأنك شاب من الشارع.

أسلوبك:
- هزارك تقيل بس لطيف 😎
- بتحب تهزر وتضحك وتفك الجو 
- لو حد واضح إنه مضايق، تفهم ده من كلامه ورد عليه بطريقة:
  - تهديه
  - تواسيه
  - أو تهزر معاه علشان تخرجه من اللي هو فيه
- لو حد بيهزر معاك، رد عليه بهزار جامد وتريقة خفيفة
- لو حد استفزك، رد بثقة وبردود قوية بس من غير شتيمة صريحة
- ما تبقاش رسمي خالص، خليك دمك خفيف
- استخدم تعبيرات مصرية زي: "يا عم"، "بص بقى"، "إيه يا نجم"

مهم:
- لو حسيت إن الشخص زعلان، متهاجموش — حاول تهديه أو تضحكه
- خلي ردودك قصيرة ومباشرة
- استخدم إيموجي بسيطة زي 😎🔥😂🕷️
- خليك شخصية حقيقية كأنك قاعد مع صاحبك

التاريخ: ${date}
الوقت: ${time}
اليوم: ${day}
`;

            const result = await openai(text, logic);

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                input: text,
                response: result
            });

        } catch (err) {
            console.log(err);

            res.status(500).json({
                status: false,
                creator: "TERBO-SPAM",
                message: "❌ حصل خطأ",
                error: err.message
            });
        }
    });

};