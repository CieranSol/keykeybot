const { Client, Intents } = require("discord.js");
const { GUILD_ID, SENPAIS_STICK_COMMAND, BOT_TOKEN } = require("./config.json");

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
        ?.commands.fetch(SENPAIS_STICK_COMMAND);

    const permissions = [
        {
            id: "",
            type: "USER",
            permission: true,
        },
    ];

    const response = await command.permissions.add({ permissions });
    console.log(response);
});

client.login(BOT_TOKEN);
