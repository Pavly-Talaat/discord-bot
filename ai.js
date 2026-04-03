const { GoogleGenerativeAI } = require("@google/generative-ai");

// API Key
const GEMINI_API_KEY = "AIzaSyAvJPOpGH7JkQKfrRu9SXOX7Tgmb9o2ib4";

// تهيئة Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// النموذج - جرب gemini-1.5-flash إذا gemini-pro مش شغال
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// حفظ المحادثات لكل مستخدم
const userChats = new Map();

async function askAI(question, userId) {
    try {
        // جلب محادثة المستخدم السابقة
        let chatHistory = userChats.get(userId) || [];
        
        // بناء الـ prompt مع الشخصية المطلوبة
        const prompt = `أنت مساعد ذكي في سيرفر ديسكورد. اسم البوت Devil Bot. أنت شرير ولطيف في نفس الوقت، تستخدم رموز 😈🔥. أجب باختصار وبشكل مفيد. سؤال المستخدم: ${question}`;
        
        console.log("🤖 Sending to Gemini...");
        
        // إرسال السؤال للنموذج
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("✅ Gemini response received");
        
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
        console.error("❌ AI Error Details:", error);
        
        // رسائل خطأ مفيدة
        if (error.message.includes("API key")) {
            return "😈 **خطأ في مفتاح API**!\nتأكد من أن مفتاح Gemini API صحيح ومفعل.\n🔗 https://makersuite.google.com/app/apikey";
        } else if (error.message.includes("quota") || error.message.includes("limit")) {
            return "😈 **تم استهلاك حصة الـ API المجانية**!\nالحد المجاني 60 طلب في الدقيقة. حاول بعد شوية 🔥";
        } else if (error.message.includes("permission")) {
            return "😈 **مشكلة في الصلاحيات**!\nتأكد من تفعيل Gemini API في Google Cloud Console";
        } else if (error.message.includes("fetch")) {
            return "😈 **مشكلة في الاتصال**!\nتأكد من اتصال الإنترنت وجرب مرة أخرى 🔥";
        } else {
            return `😈 عذراً، حدث خطأ: \`${error.message}\`\nحاول مرة أخرى!`;
        }
    }
}

// مسح محادثة المستخدم
function clearChat(userId) {
    userChats.delete(userId);
    return "🧹 تم مسح محادثتك مع الـ AI يا وحش 😈!";
}

// اختبار الاتصال بـ Gemini
async function testGemini() {
    try {
        console.log("🔄 Testing Gemini API connection...");
        const result = await model.generateContent("Say 'API is working'");
        const response = await result.response;
        console.log("✅ Gemini API is working:", response.text());
        return true;
    } catch (error) {
        console.error("❌ Gemini API test failed:", error.message);
        return false;
    }
}

module.exports = { askAI, clearChat, testGemini };