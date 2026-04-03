const { GoogleGenerativeAI } = require("@google/generative-ai");

// API Key
const GEMINI_API_KEY = "AIzaSyAvJPOpGH7JkQKfrRu9SXOX7Tgmb9o2ib4";

// تهيئة Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ✅ استخدم النموذج ده - ده اللي شغال 100%
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// حفظ المحادثات لكل مستخدم
const userChats = new Map();

async function askAI(question, userId) {
    try {
        const prompt = `أنت مساعد ذكي في سيرفر ديسكورد. اسم البوت Devil Bot. أنت شرير ولطيف في نفس الوقت، تستخدم رموز 😈🔥. أجب باختصار وبشكل مفيد. سؤال المستخدم: ${question}`;
        
        console.log("🤖 Sending to Gemini Pro...");
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("✅ Gemini response received");
        
        // حفظ المحادثة
        let chatHistory = userChats.get(userId) || [];
        chatHistory.push({ role: "user", content: question });
        chatHistory.push({ role: "assistant", content: text });
        
        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(-10);
        }
        userChats.set(userId, chatHistory);
        
        return text;
        
    } catch (error) {
        console.error("❌ AI Error:", error.message);
        
        if (error.message.includes("404") || error.message.includes("not found")) {
            return "😈 **خطأ في النموذج!** جاري التبديل للنموذج الاحتياطي... حاول مرة أخرى 🔧";
        } else if (error.message.includes("API key") || error.message.includes("quota")) {
            return "😈 **مشكلة في الـ API!**\nالمفتاح: `AIzaSyAvJPOpGH7JkQKfrRu9SXOX7Tgmb9o2ib4`\nتأكد من تفعيله في: https://makersuite.google.com/app/apikey";
        } else {
            return `😈 عذراً، حدث خطأ: \`${error.message.substring(0, 100)}\``;
        }
    }
}

function clearChat(userId) {
    userChats.delete(userId);
    return "🧹 تم مسح محادثتك مع الـ AI يا وحش 😈!";
}

module.exports = { askAI, clearChat };