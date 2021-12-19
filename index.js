import { Client, Intents } from "discord.js";
import moment from "moment-timezone";

import { BOT_TOKEN, INTRO_CHANNEL } from "./config.js";

import { messageReactionAdd } from "./handlers/messageReactionAdd.js";
import { message } from "./handlers/message.js";
import { messageDelete } from "./handlers/messageDelete.js";
import { messageUpdate } from "./handlers/messageUpdate.js";
import { interactionCreate } from "./handlers/interactionCreate.js";
import { channelCreate } from "./handlers/channelCreate.js";

const pendingBotMessages = [];

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
client.on("message", async (msg) => message(msg, client, pendingBotMessages));

// Message deleted
client.on("messageDelete", async (msg) => {
    messageDelete(msg, pendingBotMessages);
});

// Message edited
client.on("messageUpdate", messageUpdate);

// Slash command sent
client.on("interactionCreate", async (interaction) => {
    interactionCreate(interaction, client);
});

client.on("channelCreate", async (channel) => {
    channelCreate(channel);
});

client.on("channelUpdate", async (oldChannel, newChannel) => {
    if (oldChannel.parentId !== newChannel.parentId) {
        // if we're moving between categories, wait a moment for the dust to settle and then reorder
        setTimeout(async () => {
            await channelCreate(newChannel);
        }, 1000);
    }
});

// Login as the bot
client.login(BOT_TOKEN);
