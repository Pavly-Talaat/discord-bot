const axios = require('axios');
const fs = require('fs');

const DATA_FILE = 'tiktok.json';

let lastVideoId = null;

if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    lastVideoId = data.lastVideoId || null;
}

function saveLastVideo(id) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ lastVideoId: id }));
}

async function checkTikTok(client) {
    const channelId = "1485793633268666418";

    try {
        const res = await axios.get("https://tikwm.com/api/user/posts?unique_id=pavly_ta");

        const videos = res.data.data.videos;
        if (!videos || videos.length === 0) return;

        const channel = client.channels.cache.get(channelId);
        if (!channel) return;

        // أول تشغيل → يبعت كل القديم
        if (!lastVideoId) {
            for (let i = videos.length - 1; i >= 0; i--) {
                const v = videos[i];
                const link = `https://www.tiktok.com/@pavly_ta/video/${v.video_id}`;
                await channel.send(`🔥 خش شوف الكلام ده 👁‍🗨\n${link}`);
            }

            lastVideoId = videos[0].video_id;
            saveLastVideo(lastVideoId);
            return;
        }

        // بعد كده → الجديد فقط
        for (let v of videos) {
            if (v.video_id === lastVideoId) break;

            const link = `https://www.tiktok.com/@pavly_ta/video/${v.video_id}`;
            await channel.send(`🔥 خش شوف الكلام ده 👁‍🗨\n${link}`);
        }

        lastVideoId = videos[0].video_id;
        saveLastVideo(lastVideoId);

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