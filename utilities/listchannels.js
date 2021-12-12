// for running scheduled tasks such as leaderboard awards
const { Client, Intents } = require("discord.js");
const moment = require("moment-timezone");
const config = require("../config.json");
const { GUILD_ID } = require("../config.json");

// Tell moment, our date library, that Monday is the first day of the week.
moment.updateLocale("en", {
    week: {
        dow: 1,
    },
});

// Initiate our Discord client and let the API know the permissions we need.
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES,
    ],
});

client.login(config.BOT_TOKEN).then(async () => {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channels = await guild.channels.fetch();
    const channelarray = channels.map((c) => c.name);
    console.log(channelarray.join(" "), channelarray.length);
});
