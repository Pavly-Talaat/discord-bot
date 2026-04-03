const { GoogleGenerativeAI } = require("@google/generative-ai");

// API Key
const GEMINI_API_KEY = "AIzaSyAvJPOpGH7JkQKfrRu9SXOX7Tgmb9o2ib4";

// تهيئة Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// النموذج
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// حفظ المحادثات لكل مستخدم
const userChats = new Map();

async function askAI(question, userId) {
    try {
        // جلب محادثة المستخدم السابقة
        let chatHistory = userChats.get(userId) || [];
        
        // بناء الـ prompt مع الشخصية المطلوبة
        const prompt = `أنت مساعد ذكي في سيرفر ديسكورد. اسم البوت Devil Bot. أنت شرير ولطيف في نفس الوقت، تستخدم رموز 😈🔥. أجب باختصار وبشكل مفيد. سؤال المستخدم: ${question}`;
        
        // إرسال السؤال للنموذج
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // حفظ المحادثة
        chatHistory.push({ role: "user", content: question });
        chatHistory.push({ role: "assistant", content: text });
        
        // الاحتفاظ بآخر 10 رسائل فقط
        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(-10);
        }
        userChats.set(userId, chatHistory);
        
        return text;
        
    } catch (error) {
        console.error("❌ AI Error:", error);
        return "😈 عذراً، حدث خطأ في الـ AI. حاول مرة أخرى!";
    }
}

// مسح محادثة المستخدم
function clearChat(userId) {
    userChats.delete(userId);
    return "🧹 تم مسح محادثتك مع الـ AI يا وحش 😈!";
}

module.exports = { askAI, clearChat };