function startMessages(client) {
    const channelId = "1487030131229855774";

    let lastSentMorning = null;
    let lastSentEvening = null;

    setInterval(() => {
        const now = new Date();

        // 👇 تحويل الوقت لتوقيت مصر
        const egyptTime = new Date(
            now.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
        );

        const hours = egyptTime.getHours();
        const today = egyptTime.toDateString();

        const channel = client.channels.cache.get(channelId);
        if (!channel) return;

        // 🌅 صباح الخير (الساعة 9)
        if (hours === 9 && lastSentMorning !== today) {
            channel.send("🌅 صباح الخير يا أبطال 😈🔥");
            lastSentMorning = today;
        }

        // 🌙 مساء الخير (الساعة 9 مساءً)
        if (hours === 21 && lastSentEvening !== today) {
            channel.send("🌙 مساء الخير يا وحوش 👁‍🗨🔥");
            lastSentEvening = today;
        }

    }, 60000); // كل دقيقة
}

module.exports = { startMessages };
