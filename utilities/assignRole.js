const { Client, Intents } = require("discord.js");

const { BOT_TOKEN, GUILD_ID } = require("../config.json");

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES,
    ],
});

client.login(BOT_TOKEN).then(async () => {
    const guild = await client.guilds.fetch(GUILD_ID);
    const members = await guild.members.fetch();
    const needVerified = [];
    members.forEach((m) => {
        const hasIntroRole = m._roles.includes("");
        if (!hasIntroRole) {
            needVerified.push(guild.members.fetch(m.user.id));
        }
    });
    if (needVerified.length > 0) {
        const users = await Promise.all(needVerified);
        const rolePromises = [];
        users.forEach((u) => rolePromises.push(u.roles.add("")));
        await Promise.all(rolePromises);
        client.destroy();
    } else {
        client.destroy();
    }
});
