// node import.js 1636994400000 1637007561000
// imports posts between the two timestamps
// will log when it finds a bot post.
const { Client, Intents } = require("discord.js");
const crypto = require("crypto");

const { BOT_TOKEN, GUILD_ID } = require("../config.json");
const {
    getRoleplayFilters,
    createRoleplayLog,
} = require("../dataAccessors.js");

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES,
    ],
});

// get the filter list
// if its a channel, fetch the messages in the given date range
// if theyre roleplay, update the db
// if its a category, fetch the channels and do the same
if (process.argv[2] && process.argv[3]) {
    client.login(BOT_TOKEN).then(async () => {
        const guild = await client.guilds.fetch(GUILD_ID);
        const allChannels = await guild.channels.fetch();
        const query = await getRoleplayFilters();
        const roleplayFilters = query.map((f) => f.dataValues);
        let channels = [];
        roleplayFilters.forEach((filter) => {
            if (filter.type === "channel") {
                channels.push(filter.discordId);
            } else {
                allChannels.forEach((c) => {
                    if (c.parentId === filter.discordId) {
                        channels.push(c.id);
                    }
                });
            }
        });
        channels.forEach(async (c, i) => {
            const channel = await client.channels.fetch(c);
            const messages = await channel.messages.fetch();
            messages.forEach(async (m) => {
                if (
                    m.createdTimestamp >= process.argv[2] &&
                    m.createdTimestamp <= process.argv[3]
                ) {
                    let trimmedText = m.content;
                    const colonIdx = trimmedText.indexOf(":");
                    if (colonIdx > -1 && colonIdx <= 16) {
                        trimmedText = trimmedText
                            .substring(colonIdx + 1)
                            .trim();
                    }
                    await createRoleplayLog({
                        messageId: m.id,
                        userId: m.author.id,
                        length: trimmedText.length,
                        hash: crypto
                            .createHash("sha1")
                            .update(trimmedText)
                            .digest("base64"),
                    });
                }
            });
            if (i == channels.length - 1) {
                client.destroy();
            }
        });
    });
}
