// for running scheduled tasks such as leaderboard awards
import { Client, Intents } from "discord.js";
import moment from "moment-timezone";
import { GUILD_ID, BOT_TOKEN } from "../config.js";

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

client.login(BOT_TOKEN).then(async () => {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channels = await guild.channels.fetch();
    // const channelarray = channels.map((c) => c.name);
    // console.log(channelarray.join(" "), channelarray.length);
    channels.forEach(async (c) => {
        // const ch = await client.channels.cache.get(c.id);
        // const m = ch.messages;
        // console.log(c.type, c.lastMessageId);
        if (c.type === "GUILD_TEXT") {
            if (c.lastMessageId) {
                try {
                    const message = await c.messages.fetch(c.lastMessageId);
                    const date = moment(message.createdTimestamp);
                    const isInactive = moment().diff(date, "months") >= 1;
                    if (isInactive) {
                        console.log(
                            c.name,
                            moment(message.createdTimestamp).format()
                        );
                    }
                } catch (e) {
                    console.log(c.name, "error");
                }
            } else {
                console.log(c.name, "no messages");
            }
        }
        await new Promise((r) => setTimeout(r, 1000));
        // console.log(`${c.name}: ${c}`);
    });
});
