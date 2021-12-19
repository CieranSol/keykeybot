import { Client, Intents } from "discord.js";
import { GUILD_ID, BOT_TOKEN } from "../config.js";

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
        ?.commands.fetch("920939088264167434");
    console.log(command);
    const permissions = [
        {
            id: "909298841210200106",
            type: "ROLE",
            permission: true,
        },
    ];

    const response = await command.permissions.add({ permissions });
    console.log(response);
    client.destroy();
});

client.login(BOT_TOKEN);
