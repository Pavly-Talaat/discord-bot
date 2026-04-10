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
            channel.send("صباحو");
            lastSentMorning = today;
        }

        // 🌙 مساء الخير (21:00)
        if (hours === 21 && minutes === 0 && lastSentEvening !== today) {
            channel.send("مسائو");
            lastSentEvening = today;
        }

        // 🤲 صلاة الفجر (4:32)
        if (hours === 4 && minutes === 32 && lastSentDuaa !== today) {
            channel.send(`هلا`);
            lastSentDuaa = today;
        }

    }, 60000); // كل دقيقة
}

module.exports = { startMessages };