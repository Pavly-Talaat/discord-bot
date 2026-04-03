const { Client, GatewayIntentBits } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const { askAI, clearChat, testGemini } = require('./ai');
const express = require('express');
const { connectDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running 🔥');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// الاتصال بقاعدة البيانات
connectDB();

// اختبار الـ AI عند بدء التشغيل
setTimeout(async () => {
    console.log("🔍 Checking Gemini API...");
    const isWorking = await testGemini();
    if (!isWorking) {
        console.log("⚠️ WARNING: Gemini API is not working. Please check your API key!");
        console.log("📝 Get a new API key from: https://makersuite.google.com/app/apikey");
    } else {
        console.log("🎉 Gemini API is ready to use!");
    }
}, 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;

client.once('ready', () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);
    startMessages(client);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    await handleXP(message);

    // Ping command
    if (message.content === "!ping") {
        message.reply("🏓 Pong from Home!");
    }

    // Level command
    if (message.content === "!level") {
        await getLevel(message);
    }

    // AI Command - /ai <question>
    if (message.content.startsWith("/ai")) {
        const question = message.content.slice(4).trim();
        
        if (!question) {
            return message.reply("❌ من فضلك اكتب سؤالك بعد `/ai`\nمثال: `/ai كيف حالك؟`");
        }
        
        // إظهار أن البوت يكتب
        await message.channel.sendTyping();
        
        // جلب الرد من AI
        const aiResponse = await askAI(question, message.author.id);
        
        // إرسال الرد (مع تجزئة النص الطويل)
        if (aiResponse.length > 2000) {
            const chunks = aiResponse.match(/[\s\S]{1,1900}/g) || [];
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            await message.reply(aiResponse);
        }
    }
    
    // Clear AI chat command
    if (message.content === "/clearai") {
        const result = clearChat(message.author.id);
        message.reply(result);
    }
});

process.on('unhandledRejection', err => console.error(err));
process.on('uncaughtException', err => console.error(err));

client.login(TOKEN);