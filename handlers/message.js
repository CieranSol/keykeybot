const moment = require("moment-timezone");
const { Op } = require("sequelize");
const crypto = require("crypto");

const { PREFIX, LOCALE } = require("../config.json");
const { updateRoleplayLog, createRoleplayLog } = require("../dataAccessors.js");
const {
    generateHash,
    generateLeaderboard,
    getWebhook,
    hasRoleplay,
    sleep,
    trimText,
} = require("../logic.js");

const message = async (message, client) => {
    const text = message.content
        .replace("н", "h") // this is to accomodate andy candy
        .replace("к", "k"); // sending weird characters to the bot

    // trim extra whitespace from the message
    const trimmedText = trimText(text);

    // see if this is a message in a roleplay channel
    const isRoleplay = await hasRoleplay(message);

    // omlette du fromage
    const omlGif =
        "https://cdn.discordapp.com/attachments/891930501420552233/893217474596708362/Lelaboratoirededexter_faca36_7173154.gif";

    // handler for tupperbox RP messages
    if (isRoleplay && message.author.bot) {
        await processRPFromBot(trimmedText, message);
    }

    // handler for user RP messages
    if (isRoleplay && !message.author.bot) {
        await processRPFromUser(trimmedText, message);
    }

    // if the message is from a bot, stop here
    if (message.author.bot) return;

    // oml gif response
    if (text.toLowerCase() == "oml") {
        message.reply(omlGif);
    }

    // heckin respnose
    if (text === "heckin") {
        client.channels.cache.get(message.channelId).send("HECKIN");
    }

    // if the message isn't a k! command, stop here
    if (!text.startsWith(PREFIX)) return;

    // separate the prefix from the command
    const commandBody = text.slice(PREFIX.length);
    const args = commandBody.split(" ");
    const command = args.shift().toLowerCase();

    // echo command
    if (command === "echo") {
        await sendEcho(message, client);
    }

    // all the leaderboard commands
    const leaderboardCommands = [
        "day",
        "pday",
        "week",
        "pweek",
        "month",
        "pmonth",
    ];
    if (leaderboardCommands.includes(command)) {
        // compose the leaderboard
        const leaderboardString = await getLeaderboard(
            message,
            command,
            client
        );
        message.reply(leaderboardString);
    }

    // mando's command
    if (command === "mando") {
        message.reply("say one thing about mando, say he's a coffee slut.");
    }

    // easter egg for cyle
    if (message.author.username === "CowboyFarmerOnMars") {
        message.reply("HELLO BROTHER");
    }
};

const processRPFromBot = async (trimmedText, message) => {
    const hash = generateHash(trimmedText); // generate a unique identifier for this post
    await sleep(500); // cause we have to wait for the original post
    return updateRoleplayLog(
        {
            deletedAt: null, // tupper would have deleted the message, mark it as undeleted
            messageId: message.id, // but change the ID to reflect the tupper message instead of the user message
            createdAt: moment(message.createdTimestamp).utc(),
        },
        {
            where: {
                hash, // use the hash to identify the user's post in the DB
                createdAt: {
                    [Op.between]: [
                        moment(message.createdTimestamp)
                            .subtract(5, "seconds")
                            .utc(),
                        moment(message.createdTimestamp).utc(),
                    ],
                },
            },
        }
    );
};

const processRPFromUser = async (trimmedText, message) => {
    // tupperbox splits messages at 1997 characters to deal with the nitro limit
    // and so will we
    const stringArray = trimmedText.match(/[\s\S]{1,1997}/g);
    if (stringArray) {
        await Promise.all(
            stringArray.map((s) => {
                // for each snippet (or the entire post if under 1997 characters)
                // generate the unique identifier and write the rest to the DB.
                const subHash = crypto
                    .createHash("sha1")
                    .update(s)
                    .digest("base64");
                return createRoleplayLog({
                    messageId: message.id,
                    userId: message.author.id,
                    length: s.length,
                    hash: subHash,
                    createdAt: moment(message.createdTimestamp).utc(),
                });
            })
        );
        return true;
    }
};

const sendEcho = async (message, client) => {
    // this function is for testing tupperbox-like functionality.
    const msg = message.content.slice(PREFIX.length + 4);

    if (msg) {
        const webhook = await getWebhook(client, message);
        return webhook
            .send({
                content: msg,
            })
            .then(() => {
                message.delete();
            });
    }
};

const getLeaderboard = async (message, command, client) => {
    // we need the start and the end for the leaderboard, and what kind of leaderboard to call it
    let start = moment.tz(LOCALE).startOf("day").utc();
    let end = moment.tz(LOCALE).utc();
    let string = `Today's`;
    // update these variables based on what kind of leaderboard was requested
    switch (command) {
        case "day":
            // already defined, do nothing
            break;
        case "pday":
            start = moment.tz(LOCALE).subtract(1, "days").startOf("day").utc();
            end = moment.tz(LOCALE).subtract(1, "days").endOf("day").utc();
            string = `Previous Day's`;
            break;
        case "week":
            // end is already correct
            start = moment.tz(LOCALE).startOf("week").utc();
            string = `This Week's`;
            break;
        case "pweek":
            start = moment.tz(LOCALE).subtract(1, "week").startOf("week").utc();
            end = moment.tz(LOCALE).subtract(1, "week").endOf("week").utc();
            string = `Previous Week's`;
            break;
        case "month":
            // end is already correct
            start = moment.tz(LOCALE).startOf("month").utc();
            string = `This Month's`;
            break;
        case "pmonth":
            start = moment
                .tz(LOCALE)
                .subtract(1, "month")
                .startOf("month")
                .utc();
            end = moment.tz(LOCALE).subtract(1, "month").endOf("month").utc();
            string = `Previous Month's`;
            break;
    }
    // pull the data and return the generated leaderboard
    const response = await generateLeaderboard(
        message,
        string,
        start,
        end,
        client
    );
    return response;
};

module.exports = {
    message,
};
