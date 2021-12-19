import moment from "moment-timezone";
import stringSimilarity from "string-similarity";
import { MessageEmbed } from "discord.js";
import {
    ENVIRONMENT,
    PREFIX,
    LOCALE,
    STELLAR_USER_ID,
    GUILD_ID,
    DOWNFALL_CATEGORY,
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
    HECKIN_ACHIEVEMENT,
    TENK_ACHIEVEMENT,
    HUNDREDK_ACHIEVEMENT,
    MILLION_ACHIEVEMENT,
    TENMILLION_ACHIEVEMENT,
    ONE_ON_ONE_CATEGORIES,
    INACTIVE_ONE_ON_ONE_CATEGORIES,
    STARTER_CATEGORIES,
    GROUP_ACHIEVEMENT,
    ONE_ON_ONE_ACHIEVEMENT,
    STARTER_ACHIEVEMENT,
    EVILRONDO_ACHIEVEMENT,
    GIFT_ACHIEVEMENT,
} from "../config.js";
import {
    createRoleplayLog,
    getCurrencyLeader,
    getUserAchievements,
    getAchievements,
    getCharactersWritten,
    getCounter,
    createCounter,
    updateCounter,
} from "../dataAccessors.js";
import {
    generateLeaderboard,
    getWebhook,
    hasRoleplay,
    stripTupperReplies,
    switchActiveAchievement,
    grantAchievement,
    getUids,
} from "../logic.js";

const message = async (message, client, pendingBotMessages) => {
    const text = message.content
        .replace("н", "h") // this is to accomodate andy candy
        .replace("к", "k") // sending weird characters to the bot
        .trim(); // remove extra whitespace

    // see if this is a message in a roleplay channel
    const isRoleplay = await hasRoleplay(message);
    const isDownfall = message.channel.parent.id === DOWNFALL_CATEGORY;
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

    if (isDownfall && !message.author.bot) {
        await processDownfallMessage(text, message, client, isRoleplay);
    }

    // if the message is from a bot, stop here
    if (message.author.bot) return;

    // oml gif response
    if (text.toLowerCase() == "oml") {
        if (ENVIRONMENT === "dev") return;
        message.reply(omlGif);
    }

    if (text.toLowerCase() == "horny") {
        if (ENVIRONMENT === "dev") return;
        message.reply(bonkGif);
    }

    if (text == "GIRAFFE") {
        if (ENVIRONMENT === "dev") return;
        message.reply(
            `<@${STELLAR_USER_ID}> https://tenor.com/view/animals-giraffes-lol-gif-3529707`
        );
    }

    // heckin respnose
    if (text === "heckin") {
        if (ENVIRONMENT === "dev") return;
        client.channels.cache.get(message.channelId).send("HECKIN");
        grantAchievement(HECKIN_ACHIEVEMENT, message.author, client);
    }

    if (text === "damb") {
        client.channels.cache.get(message.channelId).send("DAMB");
    }

    if (text === "damb heckin") {
        client.channels.cache.get(message.channelId).send("BING BONG");
    }

    if (text === "<:evilrondo:887119517707272243>") {
        // get & set the rondo counter for this user
        const counter = await getCounter("evilrondo", message.author.id);
        if (counter === undefined) {
            createCounter("evilrondo", message.author.id);
        } else {
            const hoursSinceLast = moment
                .duration(moment().diff(counter.updatedAt))
                .asHours();
            // only count rondo once per hour
            if (hoursSinceLast >= 1) {
                updateCounter(
                    "evilrondo",
                    message.author.id,
                    counter.count + 1
                );
                // three rondos for the achievement
                if (counter.count + 1 >= 3) {
                    grantAchievement(
                        EVILRONDO_ACHIEVEMENT,
                        { id: message.author.id },
                        client
                    );
                }
            }
        }
    }

    // only let users grant the gift achievement in december
    if (moment().month() === 11) {
        const uids = getUids(text);
        uids.forEach((id) => {
            if (text.includes("🎁") && message.author.id !== id) {
                grantAchievement(GIFT_ACHIEVEMENT, { id }, client);
            }
        });
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
        await getAchievementsList(args, client, message);
    }

    if (["b", "badge"].includes(command)) {
        await setBadge(args, client, message);
    }

    if (["p", "profile"].includes(command)) {
        await getProfile(args, client, message);
    }

    if (["e", "earned"].includes(command)) {
        await getCurrencyLeaderboard(message, client);
    }

    // all the leaderboard commands
    const leaderboardCommands = [
        "hour",
        "day",
        "pday",
        "week",
        "phour",
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
    const text = stripTupperReplies(trimmedText);
    pendingBotMessages.push({
        id: message.id,
        text,
        timestamp: moment().unix(),
    });
};

const processDownfallMessage = async (
    trimmedText,
    message,
    client,
    isRoleplay
) => {
    // cheers and toast have to be in roleplay channls
    if (isRoleplay && trimmedText.toLowerCase().includes("cheers")) {
        grantAchievement(CHEERS_ACHIEVEMENT, message.author, client);
    }
    if (isRoleplay && trimmedText.toLowerCase().includes("toast")) {
        grantAchievement(TOAST_ACHIEVEMENT, message.author, client);
    }

    const uids = getUids(trimmedText);
    if (uids.length > 0) {
        uids.forEach(async (userId) => {
            // get the author's user object
            const guild = await client.guilds.fetch(GUILD_ID);
            const author = await guild.members.fetch(message.author.id);
            const user = await guild.members.fetch(userId);
            const authorRoleArray = await Promise.all(
                author.roles.cache.map(async ({ id }) => {
                    return id;
                })
            );
            // check that the author is a bartender
            if (authorRoleArray.includes(BARTENDER_ROLE)) {
                if (trimmedText.includes("🍸")) {
                    grantAchievement(COCKTAIL_ACHIEVEMENT, user.user, client);
                }
                if (trimmedText.includes("🍺")) {
                    grantAchievement(BEER_ACHIEVEMENT, user.user, client);
                }
                if (trimmedText.includes("🍷")) {
                    grantAchievement(WINE_ACHIEVEMENT, user.user, client);
                }
                if (trimmedText.includes("🍹")) {
                    grantAchievement(TROPICAL_ACHIEVEMENT, user.user, client);
                }
                if (trimmedText.includes("🍾")) {
                    grantAchievement(CHAMPAGNE_ACHIEVEMENT, user.user, client);
                }
                if (trimmedText.includes("🥃")) {
                    grantAchievement(TUMBLER_ACHIEVEMENT, user.user, client);
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
};

const processRPFromUser = async (trimmedText, message, client) => {
    // tupperbox splits messages at 1997 characters to deal with the nitro limit
    // and so will we
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
                createRoleplayLog({
                    messageId: message.id,
                    userId: message.author.id,
                    length: s.length,
                    createdAt: moment(message.createdTimestamp).utc(),
                    channelId: message.channelId,
                });
            })
        );
    }

    // check how many characters the user has written so we can give them
    // achievements if necssary
    const cw = await getCharactersWritten(message.author.id);
    const cwsum = cw.reduce((sum, a) => sum + parseInt(a), 0);

    const charactersWritten = cwsum;
    const user = { id: message.author.id };
    if (charactersWritten >= 10000) {
        grantAchievement(TENK_ACHIEVEMENT, user, client);
    }
    if (charactersWritten >= 100000) {
        grantAchievement(HUNDREDK_ACHIEVEMENT, user, client);
    }
    if (charactersWritten >= 1000000) {
        grantAchievement(MILLION_ACHIEVEMENT, user, client);
    }
    if (charactersWritten >= 10000000) {
        grantAchievement(TENMILLION_ACHIEVEMENT, user, client);
    }
    const oneOnOneCategories = ONE_ON_ONE_CATEGORIES.concat(
        INACTIVE_ONE_ON_ONE_CATEGORIES
    ).map((c) => c.id);
    const starterCategories = STARTER_CATEGORIES.map((c) => c.id);

    if (starterCategories.includes(message.channel.parent.id)) {
        grantAchievement(STARTER_ACHIEVEMENT, user, client);
    } else if (oneOnOneCategories.includes(message.channel.parent.id)) {
        grantAchievement(ONE_ON_ONE_ACHIEVEMENT, user, client);
    } else {
        grantAchievement(GROUP_ACHIEVEMENT, user, client);
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
        case "hour":
            if (moment.tz(LOCALE).hour() < 12) {
                start = moment.tz(LOCALE).startOf("day").utc();
                end = moment.tz(LOCALE).startOf("day").add(12, "hours").utc();
            } else {
                start = moment.tz(LOCALE).startOf("day").add(12, "hours").utc();
                end = moment.tz(LOCALE).endOf("day").utc();
            }
            string = `Half-day's`;
            break;
        case "phour":
            if (moment.tz(LOCALE).hour() < 12) {
                start = moment
                    .tz(LOCALE)
                    .subtract(1, "days")
                    .startOf("day")
                    .add(12, "hours")
                    .utc();
                end = moment.tz(LOCALE).subtract(1, "days").endOf("day").utc();
            } else {
                start = moment.tz(LOCALE).startOf("day").utc();
                end = moment.tz(LOCALE).startOf("day").add(12, "hours").utc();
            }
            string = `Previous Half-day's`;
            break;
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

// get the list of all the non-special achievements
const getAchievementsList = async (args, client, message) => {
    const achievements = await getAchievements(true);
    const achArray = await Promise.all(
        achievements.map(async (a) => {
            const guild = await client.guilds.fetch(GUILD_ID);
            const role = await guild.roles.fetch(a.roleId);
            return { ...a, name: role.name };
        })
    );
    const str = achArray
        .sort((a, b) => (a.name > b.name ? 1 : -1))
        .map((a) => `${a.icon} **${a.name}** - ${a.description}`);
    const embed = new MessageEmbed()
        .setColor("#F1C30E")
        .setTitle("Achievements")
        .setDescription(str.length > 0 ? str.join("\n") : "");
    message.channel.send({ embeds: [embed] });
};

// sets a user's badge next to their name
const setBadge = async (args, client, message) => {
    const userAchievements = await getUserAchievements(message.author.id);
    const emojiList = userAchievements.map(
        (a) => a.dataValues.achievement.dataValues
    );
    console.log(`EMOJI: ->${args[0]}<-`);
    const emoji = emojiList.find((e) => e.icon === args[0]);
    // check if they have the emoji theyre requesting
    if (emoji) {
        switchActiveAchievement(emoji.id, message.author.id, client);
    } else {
        message.reply("*Sorry, you don't have this badge.*");
    }
};

const getProfile = async (args, client, message) => {
    let user = null;
    if (args[0]) {
        const uids = getUids(args[0]);

        if (uids.length > 0) {
            user = await client.users.cache.get(uids[0]);
        } else {
            // if there's no UIDs found, try and figure out the user they want
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
        }
    } else {
        // if there's no arg specified, pull the author's profile
        user = message.author;
    }
    const cw = await getCharactersWritten(user.id);
    console.log("CW:", cw);
    const cwsum = cw.reduce((sum, a) => sum + parseInt(a), 0);
    const cwavg = cwsum / (cw.length || 0);
    const achievementResponse = await getUserAchievements(user.id);
    const achievements = achievementResponse.map((a) => a.dataValues);
    // build the achievements string
    const achievementString = await Promise.all(
        achievements.map(async (a) => {
            const roleObj = a.achievement?.dataValues;
            // const guild = await client.guilds.fetch(GUILD_ID);
            // const role = await guild.roles.fetch(roleObj?.roleId);
            return roleObj?.icon;
        })
    );
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(user.id);
    // compose the embed
    const embed = new MessageEmbed()
        .setColor(member.displayHexColor)
        .setTitle(`${user.username}'s RPHQ Profile`)
        .setDescription(`**Join date:** ${member.joinedAt.toLocaleDateString()}
**Roleplay written on RPHQ:** ${Math.round(cwsum).toLocaleString()} characters
**Average characters per post:** ${Math.round(
        cwavg
    ).toLocaleString()} characters
**Achievements:**
${
    achievementString.length > 0
        ? achievementString.join("")
        : "*No achievements yet.*"
}`);
    message.channel.send({
        embeds: [embed],
    });
};

const getCurrencyLeaderboard = async (message, client) => {
    const data = await getCurrencyLeader();
    console.log(data);
    const leaderboardString = data.map((r) => {
        const user = client.users.cache.get(r.userId);
        return `${user?.username}: ${r.count}`;
    });
    message.reply(`**EXPERIMENTAL - Total Rupees Earned**
\`\`\`
${leaderboardString.join("\n")}
\`\`\`
`);
};

export { message };
