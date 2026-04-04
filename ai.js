const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function handleAICommand(message, question) {
    try {
        if (!API_KEY) {
            return message.reply("❌ API Key غير موجود. تأكد من وجود `GEMINI_API_KEY`");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent(question);
        const response = await result.response;
        const text = response.text();

        // Discord message limit is 2000 characters
        if (text.length > 2000) {
            // Split message into chunks
            const chunks = text.match(/[\s\S]{1,1900}/g) || [];
            
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            await message.reply(text);
        }

    } catch (error) {
        console.error("AI Error:", error.message);
        message.reply(`❌ حدث خطأ: ${error.message}`);
    }
}

module.exports = { handleAICommand };
