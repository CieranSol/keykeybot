const moment = require("moment-timezone");
const stringSimilarity = require("string-similarity");

const {
    PREFIX,
    LOCALE,
    STELLAR_USER_ID,
    GUILD_ID,
    DOWNFALL_CHANNEL,
    CHEERS_ACHIEVEMENT,
    TOAST_ACHIEVEMENT,
    BARTENDER_ROLE,
    COCKTAIL_ACHIEVEMENT,
    BEER_ACHIEVEMENT,
    WINE_ACHIEVEMENT,
    TROPICAL_ACHIEVEMENT,
    CHAMPAGNE_ACHIEVEMENT,
    TUMBLER_ACHIEVEMENT,
    COFFEE_ACHIEVEMENT,
    TEA_ACHIEVEMENT,
    MILK_ACHIEVEMENT,
} = require("../config.json");
const {
    createRoleplayLog,
    getUserAchievements,
} = require("../dataAccessors.js");
const {
    generateLeaderboard,
    getWebhook,
    hasRoleplay,
    stripTupperReplies,
    switchActiveAchievement,
    grantAchievement,
} = require("../logic.js");

const message = async (message, client, pendingBotMessages) => {
    const text = message.content
        .replace("н", "h") // this is to accomodate andy candy
        .replace("к", "k") // sending weird characters to the bot
        .trim(); // remove extra whitespace

    // see if this is a message in a roleplay channel
    const isRoleplay = await hasRoleplay(message);

    // omlette du fromage
    const omlGif =
        "https://cdn.discordapp.com/attachments/891930501420552233/893217474596708362/Lelaboratoirededexter_faca36_7173154.gif";

    const bonkGif = "https://c.tenor.com/_ZvbLvrT_QcAAAAC/horny-jail-bonk.gif";

    // handler for tupperbox RP messages
    if (isRoleplay && message.author.bot) {
        await processRPFromBot(text, message, client, pendingBotMessages);
    }

    // handler for user RP messages
    if (isRoleplay && !message.author.bot) {
        await processRPFromUser(text, message, client);
    }

    // if the message is from a bot, stop here
    if (message.author.bot) return;

    // oml gif response
    if (text.toLowerCase() == "oml") {
        message.reply(omlGif);
    }

    if (text.toLowerCase() == "horny") {
        message.reply(bonkGif);
    }

    if (text == "GIRAFFE") {
        message.reply(
            `<@${STELLAR_USER_ID}> https://tenor.com/view/animals-giraffes-lol-gif-3529707`
        );
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
    if (command === "echo" && message.author.username === "CieranSol") {
        await sendEcho(message, client);
    }

    if (["a", "achievements"].includes(command)) {
        await getAchievements(args, client);
    }

    if (["b", "badge"].includes(command)) {
        await setBadge(args, client);
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

const processRPFromBot = async (
    trimmedText,
    message,
    client,
    pendingBotMessages
) => {
    const channel = await client.channels.cache.get(message.channelId);
    console.log(
        "BOT MESSAGE: ",
        channel.name,
        message.content.length,
        message.content
    );
    const text = stripTupperReplies(trimmedText);
    console.log("rp from bot", text);
    pendingBotMessages.push({
        id: message.id,
        text,
        timestamp: moment().unix(),
    });
};

const processRPFromUser = async (trimmedText, message, client) => {
    console.log(trimmedText);
    if (message.channelId === DOWNFALL_CHANNEL) {
        console.log("IS DOWNFALL");
        if (trimmedText.toLowerCase().includes("cheers")) {
            grantAchievement(CHEERS_ACHIEVEMENT, message.author, client);
        }
        if (trimmedText.toLowerCase().includes("toast")) {
            grantAchievement(TOAST_ACHIEVEMENT, message.author, client);
        }

        const idRegex = /<@!([0-9]+)>/gm;
        const hasUserId = trimmedText.match(idRegex);
        console.log("hasUserId:", hasUserId);
        if (hasUserId) {
            hasUserId.forEach(async (uid) => {
                const userId = uid.substr(3, uid.length - 4);
                const guild = await client.guilds.fetch(GUILD_ID);
                const author = await guild.members.fetch(message.author.id);
                const user = await guild.members.fetch(userId);
                console.log("FETCH", userId, user.user);
                const authorRoleArray = await Promise.all(
                    author.roles.cache.map(async ({ id }) => {
                        return id;
                    })
                );
                if (authorRoleArray.includes(BARTENDER_ROLE)) {
                    if (trimmedText.includes("🍸")) {
                        grantAchievement(
                            COCKTAIL_ACHIEVEMENT,
                            user.user,
                            client
                        );
                    }
                    if (trimmedText.includes("🍺")) {
                        grantAchievement(BEER_ACHIEVEMENT, user.user, client);
                    }
                    if (trimmedText.includes("🍷")) {
                        grantAchievement(WINE_ACHIEVEMENT, user.user, client);
                    }
                    if (trimmedText.includes("🍹")) {
                        grantAchievement(
                            TROPICAL_ACHIEVEMENT,
                            user.user,
                            client
                        );
                    }
                    if (trimmedText.includes("🍾")) {
                        grantAchievement(
                            CHAMPAGNE_ACHIEVEMENT,
                            user.user,
                            client
                        );
                    }
                    if (trimmedText.includes("🥃")) {
                        grantAchievement(
                            TUMBLER_ACHIEVEMENT,
                            user.user,
                            client
                        );
                    }
                    if (trimmedText.includes("☕")) {
                        grantAchievement(COFFEE_ACHIEVEMENT, user.user, client);
                    }
                    if (trimmedText.includes("🍵")) {
                        grantAchievement(TEA_ACHIEVEMENT, user.user, client);
                    }
                    if (trimmedText.includes("🥛")) {
                        grantAchievement(MILK_ACHIEVEMENT, user.user, client);
                    }
                }
            });
        }
    }
    // tupperbox splits messages at 1997 characters to deal with the nitro limit
    // and so will we
    console.log("rp from user");
    const stringArray = trimmedText.match(/[\s\S]{1,1997}/g);
    if (stringArray) {
        await Promise.all(
            stringArray.map(async (s) => {
                // write each snippet to the DB
                const channel = await client.channels.cache.get(
                    message.channelId
                );
                console.log(
                    "USER MESSAGE: ",
                    message.author.username,
                    channel.name,
                    message.content.length,
                    message.content
                );
                return createRoleplayLog({
                    messageId: message.id,
                    userId: message.author.id,
                    length: s.length,
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

const getAchievements = async (args, client) => {
    let username = message.author.username;
    let user = null;
    if (args[0]) {
        console.log(args[0].substring(0, 2));
        if (args[0].substring(0, 2) !== "<@") {
            const users = await client.users.cache.map((u) => u.username);
            const usersObj = await client.users.cache.map(
                ({ username, id }) => {
                    return { username, id };
                }
            );
            var match = await stringSimilarity.findBestMatch(args[0], users);
            const thisUser = usersObj.find(
                (u) => u.username === match.bestMatch.target
            );
            user = await client.users.cache.get(thisUser.id);
        } else {
            console.log(args[0], args[0].substring(3, args[0].length - 1));
            user = await client.users.fetch(
                args[0].substring(3, args[0].length - 1)
            );
        }
        if (user) {
            username = user.username;
        }
    } else {
        user = message.author;
    }
    const response = await getUserAchievements(user.id);
    const achievements = response.map((a) => a.dataValues);
    const str = await Promise.all(
        achievements.map(async (a) => {
            console.log(a);
            const roleObj = a.achievement.dataValues;
            const guild = await client.guilds.fetch(GUILD_ID);
            const role = await guild.roles.fetch(roleObj.roleId);
            return `${roleObj.icon} **${role.name}** - ${roleObj.description}`;
        })
    );
    message.reply(`*${username}'s Achievements*
${str.length > 0 ? str.join("\n") : "*No achievements yet.*"}
`);
};

const setBadge = async (args, client) => {
    const userAchievements = await getUserAchievements(message.author.id);
    const emojiList = userAchievements.map(
        (a) => a.dataValues.achievement.dataValues
    );
    const emoji = emojiList.find((e) => e.icon === args[0]);
    if (emoji) {
        switchActiveAchievement(emoji.id, message.author.id, client);
    } else {
        message.reply("*Sorry, you don't have this badge.*");
    }
};

module.exports = {
    message,
};
