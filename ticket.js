const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder
} = require("discord.js");

const { getDB } = require("./database");

let ticketHandlerLoaded = false;
const PANEL_CHANNEL_ID = "1491908284813148272"; 

// 🔢 عداد التيكت مع معالجة الخطأ
async function getNextTicketNumber(db) {
    try {
        const settings = db.collection("settings");
        const result = await settings.findOneAndUpdate(
            { name: "ticketCounter" },
            { $inc: { value: 1 } },
            { upsert: true, returnDocument: "after" }
        );
        const val = result.value ? (result.value.value || result.value) : result.value;
        return val || Math.floor(Math.random() * 1000);
    } catch (err) {
        console.error("❌ Error in getNextTicketNumber:", err);
        return "N/A";
    }
}

// 🎫 إرسال الـ Panel بتصميم نيون
async function sendPanel(client) {
    try {
        const db = getDB();
        if (!db) return console.log("⏳ Waiting for DB...");

        const channel = await client.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
        if (!channel) return console.error("❌ لا يمكن العثور على روم البانل!");

        const messages = await channel.messages.fetch({ limit: 50 });
        const isExist = messages.some(m => 
            m.author.id === client.user.id && 
            m.embeds.length > 0 && 
            m.embeds[0].title === "══  〔 🟢 SYSTEM ONLINE 〕  ══"
        );

        if (isExist) return console.log("✅ لوحة الدعم موجودة بالفعل.");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("create_ticket")
                .setLabel("📩 INITIALIZE CONNECTION")
                .setStyle(ButtonStyle.Primary)
        );

        const embed = new EmbedBuilder()
            .setTitle("══  〔 🟢 SYSTEM ONLINE 〕  ══")
            .setDescription(
                "```fix\n[ TERMINAL ACCESS REQUIRED ]\n```\n" +
                "📡 **Status:** `OPERATIONAL`\n" +
                "🔐 **Security:** `AES-256 ENABLED`\n\n" +
                "اضغط على الزر أدناه لفتح بروتوكول اتصال آمن مع الإدارة."
            )
            .setColor("#00f2ff") // نيون أزرق
            .setFooter({ text: "NEON PROTOCOL v2.0 | Advanced Support System" });

        await channel.send({ embeds: [embed], components: [row] });
        console.log("🚀 تم إرسال لوحة الدعم النيون بنجاح.");
    } catch (err) {
        console.error("❌ Error in sendPanel:", err);
    }
}

// 🎮 معالج التفاعلات مع بار التحميل
function handleTicketInteraction(client, OWNER_ID) {
    if (ticketHandlerLoaded) return;
    ticketHandlerLoaded = true;

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        const { guild, user, customId, channel } = interaction;

        if (customId === "create_ticket") {
            try {
                // 1. استجابة أولية مخفية
                await interaction.deferReply({ ephemeral: true });

                // 2. أنيميشن بار التحميل النيوني
                const loadingFrames = [
                    " [▒▒▒▒▒▒▒▒▒▒] 0% ",
                    " [🟦▒▒▒▒▒▒▒▒] 25% ",
                    " [🟦🟦🟦▒▒▒▒▒] 55% ",
                    " [🟦🟦🟦🟦🟦▒] 85% ",
                    " [🟦🟦🟦🟦🟦🟦] 100% "
                ];

                for (const frame of loadingFrames) {
                    await interaction.editReply({ 
                        content: `> **Initializing Secure Link...**\n\`\`\`ini\n${frame}\n\`\`\`` 
                    });
                    await new Promise(r => setTimeout(r, 400));
                }

                // 3. جلب البيانات وإنشاء التيكت
                const db = getDB();
                const ticketNumber = await getNextTicketNumber(db);

                const ticketChannel = await guild.channels.create({
                    name: `🟢-ticket-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
                        { id: OWNER_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                    ]
                });

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("close_ticket")
                        .setLabel("🔒 TERMINATE")
                        .setStyle(ButtonStyle.Danger)
                );

                const ticketEmbed = new EmbedBuilder()
                    .setAuthor({ name: "CONNECTION ESTABLISHED", iconURL: user.displayAvatarURL() })
                    .setColor("#bc13fe") // نيون بنفسجي
                    .setDescription(
                        "### 💠 تذكرة جديدة: #" + ticketNumber + "\n" +
                        "تم فتح قناة اتصال مشفرة. يرجى توضيح طلبك وسيتم الرد عليك قريباً."
                    )
                    .addFields(
                        { name: "👤 USER", value: `\`${user.username}\``, inline: true },
                        { name: "🛡️ SEC-LEVEL", value: "`ENCRYPTED`", inline: true },
                        { name: "⏳ TIMESTAMP", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                    )
                    .setFooter({ text: "SYSTEM ID: NEON-CORE", iconURL: client.user.displayAvatarURL() });

                await ticketChannel.send({
                    content: `⚠️ **Attention:** ${user} | <@${OWNER_ID}>`,
                    embeds: [ticketEmbed],
                    components: [closeRow]
                });

                await interaction.editReply({ content: `✅ **Access Granted:** ${ticketChannel}` });

            } catch (err) {
                console.error("❌ Ticket Error:", err);
                await interaction.editReply({ content: "❌ فشل في بروتوكول الإنشاء." });
            }
        }

        if (customId === "close_ticket") {
            if (user.id !== OWNER_ID) return interaction.reply({ content: "❌ الوصول مرفوض: للأونر فقط", ephemeral: true });
            
            await interaction.reply("🔒 **Terminating Session...** الحذف خلال 3 ثوانٍ.");
            setTimeout(() => channel.delete().catch(() => {}), 3000);
        }
    });
}

module.exports = { handleTicketInteraction, sendPanel };
