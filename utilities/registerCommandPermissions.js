const { Client, Intents } = require("discord.js");
const { GUILD_ID, BOT_TOKEN } = require("../config.json");

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES,
    ],
});

client.on("ready", async () => {
    if (!client.application?.owner) await client.application?.fetch();

    const command = await client.guilds.cache
        .get(GUILD_ID)
        ?.commands.fetch("919484729873551371");
    console.log(command);
    const permissions = [
        {
            id: "840393634272772116",
            type: "USER",
            permission: true,
        },
    ];

    const response = await command.permissions.add({ permissions });
    console.log(response);
    client.destroy();
});

client.login(BOT_TOKEN);
