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
        return "00";
    }
}

async function sendPanel(client) {
    try {
        const db = getDB();
        const channel = await client.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
        if (!channel) return;

        // 🔍 فحص الروم قبل الإرسال لمنع التكرار
        const messages = await channel.messages.fetch({ limit: 20 });
        const exists = messages.some(m => m.author.id === client.user.id && m.embeds[0]?.title === "مركز المساعدة 🎫");

        if (exists) {
            console.log("ℹ️ لوحة التذاكر موجودة بالفعل، لن يتم إعادة الإرسال.");
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("مركز المساعدة 🎫")
            .setDescription("للتواصل مع الإدارة أو الإبلاغ عن مشكلة، اضغط على الزر أدناه لفتح تذكرة خاصة.")
            .addFields({ name: "⚠️ ملاحظة", value: "الرجاء عدم فتح تذكرة بدون سبب واضح." })
            .setColor("#2b2d31")
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("create_ticket").setLabel("📩 افتح تذكرة").setStyle(ButtonStyle.Primary)
        );

        await channel.send({ embeds: [embed], components: [row] });
    } catch (err) {
        console.error("❌ SendPanel Error:", err);
    }
}

function handleTicketInteraction(client, OWNER_ID) {
    if (ticketHandlerLoaded) return;
    ticketHandlerLoaded = true;

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId === "create_ticket") {
            await interaction.deferReply({ ephemeral: true });
            const db = getDB();
            const num = await getNextTicketNumber(db);

            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${num}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
                    { id: OWNER_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            const closeBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("close_ticket").setLabel("🔒 إغلاق").setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({
                content: `مرحباً ${interaction.user} | <@${OWNER_ID}>`,
                embeds: [new EmbedBuilder().setTitle("تذكرة دعم جديدة").setDescription("اكتب استفسارك وسوف يتم الرد عليك قريباً.").setColor("#5865F2")],
                components: [closeBtn]
            });

            await interaction.editReply(`✅ تم فتح تذكرتك: ${ticketChannel}`);
        }

        if (interaction.customId === "close_ticket") {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: "❌ للأونر فقط", ephemeral: true });
            await interaction.reply("🔒 سيتم حذف الغرفة خلال 5 ثوانٍ...");
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }
    });
}

module.exports = { handleTicketInteraction, sendPanel };
