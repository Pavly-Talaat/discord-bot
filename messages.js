function startMessages(client) {
    const channelId = "1487030131229855774";

    let lastSentMorning = null;
    let lastSentEvening = null;
    let lastSentTest = null;

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

        // 🔥 Test الساعة 12:25
        if (hours === 12 && minutes === 23 && lastSentTest !== today) {
            channel.send("لي فكرني خول يا عرص ، أسيادي احا انت 😂");
            lastSentTest = today;
        }

    }, 60000); // يفحص كل دقيقة
}

module.exports = { startMessages };
