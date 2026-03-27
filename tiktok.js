const Parser = require('rss-parser');
const parser = new Parser();

let lastVideo = null;

async function checkTikTok(client) {
    const channelId = "1487030131229855774";

    const rssUrl = "https://rsshub.app/tiktok/user/pavly_ta";

    try {
        const feed = await parser.parseURL(rssUrl);

        if (!feed.items.length) return;

        const latest = feed.items[0];

        if (lastVideo === null) {
            lastVideo = latest.link;
            return;
        }

        if (latest.link !== lastVideo) {
            lastVideo = latest.link;

            const channel = client.channels.cache.get(channelId);
            if (!channel) return;

            channel.send(`🔥 خش شوف الكلام ده 👁‍🗨\n${latest.link}`);
        }

    } catch (err) {
        console.error("TikTok Error:", err.message);
    }
}

function startTikTok(client) {
    setInterval(() => {
        checkTikTok(client);
    }, 60000);
}

module.exports = { startTikTok };