const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder
} = require("discord.js");

const { getDB } = require("./database");

const tickets = new Map();
let ticketHandlerLoaded = false;

// 🔥 عداد التيكت (لا نهائي)
async function getNextTicketNumber(db) {
    const settings = db.collection("settings");

    const data = await settings.findOneAndUpdate(
        { name: "ticketCounter" },
        { $inc: { value: 1 } },
        { upsert: true, returnDocument: "after" }
    );

    if (!data.value || typeof data.value.value !== "number") {
        await settings.updateOne(
            { name: "ticketCounter" },
            { $set: { value: 1 } },
            { upsert: true }
        );
        return 1;
    }

    return data.value.value;
}

// 🎫 إرسال Panel (مرة واحدة فقط)
async function sendPanel(client) {
    try {
        const db = getDB();
        if (!db) return;

        const settings = db.collection("settings");

        const channel = await client.channels.fetch("1491908284813148272").catch(() => null);
        if (!channel) return console.log("❌ Channel not found");

        // 👑 نجيب الرسالة القديمة
        const data = await settings.findOne({ name: "ticketPanel" });

        if (data) {
            try {
                const msg = await channel.messages.fetch(data.messageId);
                if (msg) {
                    console.log("✅ Panel already exists");
                    return;
                }
            } catch {
                console.log("⚠️ Old panel deleted → creating new");
            }
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("create_ticket")
                .setLabel("📩 Create Ticket")
                .setStyle(ButtonStyle.Primary)
        );

        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setTitle("🎫 نظام الدعم الفني")
            .setDescription(
                "اضغط على الزر لإنشاء تذكرة والتواصل مع الإدارة.\n\n⚠️ الحد: 2 تيكت يوميًا لكل عضو."
            );

        const sent = await channel.send({
            embeds: [embed],
            components: [row]
        });

        await settings.updateOne(
            { name: "ticketPanel" },
            { $set: { messageId: sent.id } },
            { upsert: true }
        );

        console.log("🔥 Panel Sent");

    } catch (err) {
        console.error("❌ Panel Error:", err);
    }
}

// 🎮 التعامل مع الأزرار
function handleTicketInteraction(client, OWNER_ID) {

    if (ticketHandlerLoaded) return;
    ticketHandlerLoaded = true;

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        const guild = interaction.guild;
        const user = interaction.user;

        // ================= CREATE =================
        if (interaction.customId === "create_ticket") {

            try {
                await interaction.deferReply({ ephemeral: true });

                const today = new Date().toDateString();

                if (!tickets.has(user.id)) {
                    tickets.set(user.id, { count: 0, date: today });
                }

                const userData = tickets.get(user.id);

                if (userData.date !== today) {
                    userData.count = 0;
                    userData.date = today;
                }

                if (userData.count >= 2) {
                    return interaction.editReply({
                        content: "❌ الحد الأقصى 2 تيكت في اليوم"
                    });
                }

                userData.count++;

                const db = getDB();
                if (!db) {
                    return interaction.editReply({
                        content: "❌ خطأ في قاعدة البيانات"
                    });
                }

                const ticketNumber = await getNextTicketNumber(db);

                const channel = await guild.channels.create({
                    name: `ticket-${ticketNumber}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        {
                            id: user.id,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages
                            ]
                        },
                        {
                            id: OWNER_ID,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages
                            ]
                        }
                    ]
                });

                const embed = new EmbedBuilder()
                    .setColor("#5865F2")
                    .setTitle("🎫 تم فتح التذكرة")
                    .setDescription(
                        `مرحبًا ${user} 👋\n\nاكتب مشكلتك وسيتم الرد عليك قريبًا.`
                    )
                    .setFooter({ text: `Ticket #${ticketNumber}` });

                // 👑 زر إغلاق للأونر فقط
                let components = [];

                if (user.id === OWNER_ID) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("close_ticket")
                            .setLabel("❌ إغلاق")
                            .setStyle(ButtonStyle.Danger)
                    );

                    components.push(row);
                }

                await channel.send({
                    content: `${user}`,
                    embeds: [embed],
                    components: components
                });

                try {
                    await user.send(`🎫 تم إنشاء التذكرة: ${channel}`);
                } catch {}

                await interaction.editReply({
                    content: `✅ تم إنشاء التذكرة: ${channel}`
                });

            } catch (err) {
                console.error("❌ Ticket Error:", err);
            }
        }

        // ================= CLOSE =================
        if (interaction.customId === "close_ticket") {

            try {
                if (interaction.user.id !== OWNER_ID) {
                    return interaction.reply({
                        content: "❌ للأونر فقط",
                        ephemeral: true
                    });
                }

                await interaction.reply("🔒 جاري الإغلاق...");

                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 2000);

            } catch (err) {
                console.error("❌ Close Error:", err);
            }
        }
    });
}

module.exports = {
    handleTicketInteraction,
    sendPanel
};