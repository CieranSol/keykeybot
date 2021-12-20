import { MessageEmbed } from "discord.js";
import {
    getLeaderboard,
    getRoleplayFilters,
    getAchievements,
    getAchievement,
    createAchievementLog,
} from "./dataAccessors.js";
import {
    GUILD_ID,
    BOT_AVATAR,
    ACHIEVEMENT_CHANNEL,
    DAY_AWARD_ID,
    DAY_AWARD_ID_2,
    DAY_AWARD_ID_3,
    WEEK_AWARD_ID,
    MONTH_AWARD_ID,
} from "./config.js";

// chunks a messages into several messages under 2000 characters
const chunkMessage = (msg) => {
    if (msg.length <= 2000) {
        // under 2000 characters just return
        return [msg];
    }
    let chunks = []; // the array of chunked messages we will return
    const paragraphs = msg.split("\n"); // start by splitting the message into paragraphs
    paragraphs.forEach((p) => {
        // for each paragraph
        if (p.length <= 2000) {
            // if the paragraph is less than one message long
            if (
                chunks[chunks.length - 1] &&
                (chunks[chunks.length - 1] + p).length <= 2000
            ) {
                // this paragraph fits into the current message chunk, or there's no chunk yet
                chunks[chunks.length - 1] += p; // add this paragraph to the current chunk
            } else {
                // this paragraph doesn't fit to the current message chunk, too large - or there's no chunk yet
                chunks[chunks.length] = p; // create a new chunk and add this paragraph
            }
        } else {
            // this paragraph is over 2000 characters, we need to split it into sentences
            const sentences = p.split("."); // create an array of sentences from this paragraph
            sentences.forEach((s) => {
                // for each sentence
                if (s.length <= 2000) {
                    // if the sentence is less than once message long
                    if (
                        chunks[chunks.length - 1] &&
                        (chunks[chunks.length - 1] + s).length <= 1999
                    ) {
                        // this sentence fits into the current message chunk, or there's no chunk yet
                        chunks[chunks.length - 1] += s + "."; // add this sentence to the current chunk
                    } else {
                        // this sentence doesn't fit into the current chunk, too large - or there's no chunk yet
                        chunks.push(s + "."); // create a new chunk and add this sentence
                    }
                } else {
                    // the sentence is over 2000 characters
                    chunks = chunks.concat(s.match(/.{1,2000}/g)); // just split it at the 2000 character mark
                }
            });
        }
    });
    return chunks;
};

// gets or creates a webhook for sending a tupper-style message
const getWebhook = async (client, message) => {
    // get the webhooks for this channel
    const webhooks = await message.channel.fetchWebhooks();
    const webhooksArray = [...webhooks];
    // find the webhook that belongs to us and return it
    const ourWebhook = webhooksArray.find(
        (webhook) => webhook[1].owner.id === client.user.id
    );
    if (ourWebhook) {
        return ourWebhook[1];
    } else {
        // if there's no webhook yet, create one
        return client.channels.cache
            .get(message.channelId)
            .createWebhook("Roleplay HQ Bot", { avatar: BOT_AVATAR })
            .then((webhook) => {
                return webhook;
            });
    }
};

// checks if the message is in a roleplay channel
const hasRoleplay = async (message) => {
    // get the list of roleplay filters and see if a given message is in that channel/category
    const roleplayFilters = await getRoleplayFilters();
    let channel = message.channelId;
    let parent = message.channel.parentId;
    if (
        message.type === "GUILD_PUBLIC_THREAD" ||
        message.type === "GUILD_PRIVATE_THREAD"
    ) {
        channel = message.channel.parent.id;
        parent = message.channel.parent.parent.id;
    }
    const hasFilter = roleplayFilters.find((f) => {
        return channel == f.discordId || parent == f.discordId;
    });
    return Boolean(hasFilter);
};

// generates the leaderboard string
const generateLeaderboard = async (username, label, from, to, client) => {
    // get the list of leaders from the database
    const leaders = await getLeaderboard(from, to);
    // take the list of leader IDs, and transform it into an array of strings:
    // 01 Username 1234
    // then take the array and turn it into a single string, with values separated
    // by newlines.
    const leadersOutput = leaders
        .map((l, idx) => {
            const userId = l.dataValues.userId;
            const length = l.dataValues.totalLength;
            const user = client.users.cache.get(userId);
            return `${(idx + 1).toString().padStart(2, "0")} ${
                user?.username
            }: ${length}`;
        })
        .join("\n");
    // easter egg for Andy
    const leaderboardTitle =
        username === "AndyGargantya" ? "таблица лидеров" : "Leaderboard";
    // return the fully compiled output
    return `**${label} ${leaderboardTitle}**
\`\`\`
${leadersOutput}
\`\`\``;
};

// strips everything besides the user's text from a tupper message
const stripTupperReplies = (text) => {
    // if the first line is a quote
    if (text.substring(0, 2) === "> ") {
        // split the text into an array of lines
        const textArray = text.split("\n");
        // remove the quote
        textArray.splice(0, 1);
        // check if the second line is an at-tag - tupper does this
        if (textArray[0].substring(0, 2) === "<@") {
            // remove the second line
            textArray.splice(0, 1);
        }
        // re-join the array and return
        return textArray.join("\n");
    }
    return text;
};

// switches the user's active achievement (their badge)
const switchActiveAchievement = async (achievementId, userId, client) => {
    // get all the achievements
    const achievements = await getAchievements();
    // get all the user's roles
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId);
    const roles = await member.roles.cache.map(({ id, name }) => {
        return { id, name };
    });
    const thisRole = achievements.find((a) => a.id == achievementId);
    // if any of the roles are in the achievement list, remove them
    const achievementIds = achievements.map((a) => a.roleId);
    const dayAchievements = [DAY_AWARD_ID, DAY_AWARD_ID_2, DAY_AWARD_ID_3];
    roles.forEach(async (r) => {
        if (achievementIds.includes(r.id)) {
            if (dayAchievements.includes(achievementId)) {
                if (r.id !== WEEK_AWARD_ID && r.id !== MONTH_AWARD_ID) {
                    await member.roles.remove(r.id);
                }
            } else if (achievementId === WEEK_AWARD_ID) {
                if (r.id !== MONTH_AWARD_ID) {
                    await member.roles.remove(r.id);
                }
            } else {
                await member.roles.remove(r.id);
            }
        }
    });
    // add the achievement role
    await member.roles.add(thisRole.roleId);
};

// grants a user an achievement
const grantAchievement = async (achievementId, user, client, isMedal) => {
    // add this achievement to the log
    const logResponse = await createAchievementLog({
        achievementId,
        userId: user.id,
    });

    if (logResponse !== false) {
        // make this the users' active achievement
        // await switchActiveAchievement(achievementId, user.id, client);
        // announce the achievement
        const guild = await client.guilds.fetch(GUILD_ID);
        const achievement = await getAchievement(achievementId);
        const role = await guild.roles.fetch(achievement.roleId);
        const channel = await guild.channels.fetch(ACHIEVEMENT_CHANNEL);
        let authorField = isMedal
            ? `**Leaderboard Winner! <@${user.id}> has earned the following leaderboard ranking.**`
            : `**Achievement Unlocked! <@${user.id}> has earned an achievement.**`;
        let titleField = `${achievement.icon} ${role.name}`;
        let descriptionField = achievement.description;
        const embed = new MessageEmbed()
            .setColor("#F1C30E")
            .setTitle(titleField)
            .setDescription(descriptionField);
        await channel.send({ content: authorField, embeds: [embed] });
    }
};

// parses UIDs from a text string
const getUids = (text) => {
    const idRegex = /<@!?([0-9]+)>/gm;
    const hasUserId = text.match(idRegex);
    if (hasUserId) {
        return hasUserId.map((uid) => {
            // sometimes there's a ! in userIds
            if (uid.includes("!")) {
                return uid.substr(3, uid.length - 4);
            }
            return uid.substr(2, uid.length - 3);
        });
    }
    return [];
};

const findCategory = (channelName, categories) => {
    const code = channelName.substr(0, 1).toUpperCase().charCodeAt();
    if (code < 65) {
        return 0;
    }
    if (code > 90) {
        return categories.length - 1;
    }
    const category = categories.find((c, i) => {
        console.log(code, c, categories[i + 1]);
        if (!categories[i + 1]) {
            console.log("next missing");
            return true;
        }
        return (
            code >= c.start.charCodeAt() &&
            code < categories[i + 1].start.charCodeAt()
        );
    });
    console.log(category);
    return category.id;
};

export {
    chunkMessage,
    findCategory,
    generateLeaderboard,
    getWebhook,
    hasRoleplay,
    stripTupperReplies,
    switchActiveAchievement,
    grantAchievement,
    getUids,
};
