// ai.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// تأكد من وجود هذا المتغير في إعدادات Railway
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ خطأ: لم يتم العثور على مفتاح GEMINI_API_KEY في متغيرات البيئة!");
}

// تهيئة Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ✅ استخدام النموذج الصحيح والمجاني
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// حفظ المحادثات لكل مستخدم (اختياري)
const userChats = new Map();

async function askAI(question, userId) {
    if (!GEMINI_API_KEY) {
        return "😈 **خطأ في الإعدادات:** لم يتم إعداد مفتاح Gemini API. يرجى إخبار المشرف.";
    }

    try {
        const prompt = `أنت مساعد ذكي في سيرفر ديسكورد. اسم البوت Devil Bot. أنت شرير ولطيف في نفس الوقت، تستخدم رموز 😈🔥. أجب باختصار وبشكل مفيد. سؤال المستخدم: ${question}`;
        
        console.log(`🤖 [${userId}] سؤال: ${question.substring(0, 50)}...`);
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ [${userId}] تم استلام الرد من Gemini.`);
        
        // حفظ المحادثة (اختياري)
        let chatHistory = userChats.get(userId) || [];
        chatHistory.push({ role: "user", content: question });
        chatHistory.push({ role: "assistant", content: text });
        if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
        userChats.set(userId, chatHistory);
        
        return text;
        
    } catch (error) {
        console.error(`❌ خطأ في Gemini للمستخدم ${userId}:`, error.message);
        
        // رسائل خطأ مفيدة
        if (error.message.includes("API key")) {
            return "😈 **خطأ في مفتاح API!** تأكد من أن مفتاح Gemini API صحيح ومفعل في Google Cloud Console.";
        } else if (error.message.includes("quota") || error.message.includes("limit")) {
            return "😈 **تم استهلاك الحصة المجانية للـ API!** الحد هو 60 طلب في الدقيقة. حاول بعد قليل.";
        } else {
            return `😈 عذراً، حدث خطأ تقني: \`${error.message.substring(0, 150)}\`. حاول مرة أخرى!`;
        }
    }
}

function clearChat(userId) {
    userChats.delete(userId);
    return "🧹 تم مسح محادثتك مع الـ AI يا وحش 😈!";
}

module.exports = { askAI, clearChat };