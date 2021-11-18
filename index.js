const { Client, Intents } = require("discord.js");
const moment = require("moment-timezone");

const { BOT_TOKEN, INTRO_CHANNEL } = require("./config.json");

const { messageReactionAdd } = require("./handlers/messageReactionAdd.js");
const { message } = require("./handlers/message.js");
const { messageDelete } = require("./handlers/messageDelete.js");
const { messageUpdate } = require("./handlers/messageUpdate.js");

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

// Tell moment, our date library, that Monday is the first day of the week.
moment.updateLocale("en", {
    week: {
        dow: 1,
    },
});

// Pull the last 10 intros so that we can react to them, even if the bot restarts.
client.on("ready", async () => {
    client.channels.cache.get(INTRO_CHANNEL).messages.fetch({ limit: 10 });
});

// Add reaction
client.on("messageReactionAdd", async (reaction) =>
    messageReactionAdd(reaction, client)
);

// Message sent
client.on("message", async (msg) => message(msg, client));

// Message deleted
client.on("messageDelete", messageDelete);

// Message edited
client.on("messageUpdate", messageUpdate);

// Login as the bot
client.login(BOT_TOKEN);
