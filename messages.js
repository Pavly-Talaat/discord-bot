function startMessages(client) {
    const channelId = "1487030131229855774";

    let lastSentMorning = null;
    let lastSentEvening = null;
    let lastSentDuaa = null;

    setInterval(() => {
        const now = new Date();

        // ⏰ توقيت مصر
        const egyptTime = new Date(
            now.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
        );

        const hours = egyptTime.getHours();
        const minutes = egyptTime.getMinutes();
        const today = egyptTime.toDateString();

        const channel = client.channels.cache.get(channelId);
        if (!channel) return;

        // 🌅 صباح الخير (9:00)
        if (hours === 9 && minutes === 0 && lastSentMorning !== today) {
            channel.send("🌅 صباح الخير يا أبطال 😈🔥");
            lastSentMorning = today;
        }

        // 🌙 مساء الخير (21:00)
        if (hours === 21 && minutes === 0 && lastSentEvening !== today) {
            channel.send("🌙 مساء الخير يا وحوش 👁‍🗨🔥");
            lastSentEvening = today;
        }

        // 🤲 الدعاء الساعة 1:20 مساءً (13:20)
        if (hours === 13 && minutes === 20 && lastSentDuaa !== today) {
            channel.send("مسا مسا");
            lastSentDuaa = today;
        }

    }, 60000); // يفحص كل دقيقة
}

module.exports = { startMessages };