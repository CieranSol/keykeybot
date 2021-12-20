import got from "got";
import cheerio from "cheerio";
import { MessageEmbed } from "discord.js";
import moment from "moment-timezone";

import {
    SENPAIS_STICK_ROLE,
    VERIFIED_ROLE,
    INACTIVE_ONE_ON_ONE_CATEGORIES,
    ONE_ON_ONE_CATEGORIES,
    STARTER_CATEGORIES,
    ARCHIVE_CATEGORIES,
    ENVIRONMENT,
    GUILD_ID,
    LOCALE,
} from "../config.js";

import {
    findCategory,
    getWebhook,
    switchActiveAchievement,
    generateLeaderboard,
} from "../logic.js";
import {
    getAchievements,
    getUserAchievements,
    getCharactersWritten,
} from "../dataAccessors.js";

const interactionCreate = async (interaction, client) => {
    if (!interaction.isCommand()) return;
    if (ENVIRONMENT === "dev") return;
    switch (interaction.commandName) {
        case "stick":
            stickHandler(interaction, client);
            break;
        case "channel":
            channelHandler(interaction, client);
            break;
        case "word":
            wordHandler(interaction, client);
            break;
        case "echo":
            echoHandler(interaction, client);
            break;
        case "achievements":
            achievementsHandler(interaction, client);
            break;
        case "badge":
            badgeHandler(interaction, client);
            break;
        case "profile":
            profileHandler(interaction, client);
            break;
        case "fact":
            factHandler(interaction, client);
            break;
        case "leaders":
            leadersHandler(interaction, client);
            break;
    }
};

const leadersHandler = async (interaction, client) => {
    // we need the start and the end for the leaderboard, and what kind of leaderboard to call it
    let start = moment.tz(LOCALE).startOf("day").utc();
    let end = moment.tz(LOCALE).utc();
    let string = `Today's`;
    // update these variables based on what kind of leaderboard was requested
    const boardResponse = await interaction.options.get("board");
    switch (boardResponse.value) {
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
        interaction.user.username,
        string,
        start,
        end,
        client
    );
    interaction.reply(response);
};

const factHandler = async (interaction, client) => {
    let user = await interaction.options.get("user");
    if (!user) {
        user = interaction.user;
    } else {
        user = user.user;
    }
    switch (user.username) {
        case "CieranSol":
            interaction.reply("Faaaaatheerrrrrrrrrrrrrrrrrrr");
            break;
        case "Mando":
            interaction.reply(
                "say one thing about mando, say he's a coffee slut."
            );
            break;
        case "CowboyFarmerOnMars":
            interaction.reply("HELLO BROTHER");
            break;
        default:
            interaction.reply("*No fact found for this user.*");
            break;
    }
};

const profileHandler = async (interaction, client) => {
    let user = await interaction.options.get("user");
    if (!user) {
        user = interaction.user;
    } else {
        user = user.user;
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
    interaction.reply({
        embeds: [embed],
    });
};

const badgeHandler = async (interaction, client) => {
    const emojiResponse = await interaction.options.get("emoji");
    const emoji = emojiResponse.value;
    const userAchievements = await getUserAchievements(interaction.member.id);
    const emojiList = userAchievements.map(
        (a) => a.dataValues.achievement.dataValues
    );
    console.log(`EMOJI: ->${emoji}<-`);
    const thisEmoji = emojiList.find((e) => e.icon === emoji);
    // check if they have the emoji theyre requesting
    if (thisEmoji) {
        switchActiveAchievement(thisEmoji.id, interaction.member.id, client);
        interaction.reply({
            content: `*Badge switched to ${emoji}.*`,
            ephemeral: true,
        });
    } else {
        interaction.reply("*Sorry, you don't have this badge.*");
    }
};

const achievementsHandler = async (interaction, client) => {
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
    interaction.reply({ embeds: [embed] });
};

const echoHandler = async (interaction, client) => {
    // this replicates tupper-like functionality to post messages on behalf of the bot
    const statementResponse = await interaction.options.get("statement");
    const content = statementResponse.value;

    const webhook = await getWebhook(client, interaction);
    return webhook
        .send({
            content,
        })
        .then(() => {
            interaction.reply({ content: "Echo sent.", ephemeral: true });
        });
};

const wordHandler = async (interaction) => {
    const page = await got.get(
        "https://www.merriam-webster.com/word-of-the-day/"
    );
    const $ = cheerio.load(page.body);

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const word = capitalizeFirstLetter($(".word-and-pronunciation h1").text());
    const definition = $(".wod-definition-container > p").text();
    const editedDef = definition
        .substring(0, definition.length - 15)
        .replace("// ", "\n*");
    interaction.reply(`Word of the Day: **${word}**
${editedDef}*`);
};

const stickHandler = async (interaction, client) => {
    if (interaction.commandName === "stick") {
        await interaction.reply(`*<@${interaction.user.id}> pouts softly, expressing their frustration at failing to be heard in the busy room. They take out a polished stick, crafted from rich, gnarled wood. The stick begins to glow a bright purple, and motes of energy fly out from its tip, temporarily silencing the voices.*
        
**[Senpai's Stick: All users muted for 30 seconds.]**`);
        // Promote to Senpai's Stick role, give the role chat permissions, and remove general chat permissions on the channel
        await interaction.member.roles.add(SENPAIS_STICK_ROLE);
        const channel = await client.channels.cache.get(interaction.channelId);
        await channel.permissionOverwrites.edit(interaction.user.id, {
            SEND_MESSAGES: true,
        });
        await channel.permissionOverwrites.edit(VERIFIED_ROLE, {
            SEND_MESSAGES: false,
        });
        // Set 30 second timeout to demote from role and restore chat permissions on channel
        setTimeout(async () => {
            await interaction.member.roles.remove(SENPAIS_STICK_ROLE);
            await channel.permissionOverwrites.edit(interaction.user.id, {
                SEND_MESSAGES: null,
            });
            await channel.permissionOverwrites.delete(VERIFIED_ROLE);
            channel.send(`*The purple glow fades as the spell's grasp wanes from it's victims.*

**[Senpai's Stick: Normal chat permissions restored.]**`);
        }, 30000);
    }
};

const channelHandler = async (interaction) => {
    const subcommand = await interaction.options.getSubcommand();
    const channelManager = await interaction.guild.channels;
    const user = await interaction.options.get("user");
    if (subcommand === "create") {
        const typeResponse = await interaction.options.get("type");
        const type = typeResponse.value;
        const channelResponse = await interaction.options.get("channel");
        const channel = channelResponse.value.replace(" ", "-");
        let categoryCategory;
        let categoryString;
        if (type === "one_one") {
            categoryCategory = ONE_ON_ONE_CATEGORIES;
            categoryString = "1:1 Roleplay";
        } else {
            // type === starter
            categoryCategory = STARTER_CATEGORIES;
            categoryString = "RP Starter";
        }
        const parent = findCategory(channel, categoryCategory);
        const channelCreateResponse = await channelManager.create(channel, {
            parent,
        });
        interaction.reply(
            `**${categoryString}** <#${channelCreateResponse?.id}> has been created for <@${user.user.id}>`
        );
    }

    if (subcommand === "move") {
        const channel = await interaction.options.get("channel");
        const destinationResponse = await interaction.options.get(
            "destination"
        );
        const destination = destinationResponse.value;
        let destinationCategories;
        let destinationString = "";
        switch (destination) {
            case "starter":
                destinationCategories = STARTER_CATEGORIES;
                destinationString = "RP Starters";
                break;
            case "one_one":
                destinationCategories = ONE_ON_ONE_CATEGORIES;
                destinationString = "1:1 Roleplay";
                break;
            case "inactive":
            default:
                destinationCategories = INACTIVE_ONE_ON_ONE_CATEGORIES;
                destinationString = "Inactive Roleplay";
                break;
        }

        const parent = findCategory(
            channel.channel.name,
            destinationCategories
        );
        const c = await channelManager.fetch(channel.channel.id);
        await c.setParent(parent);
        interaction.reply(
            `<#${channel.channel.id}> has been moved to ${destinationString}${
                user ? ` on behalf of <@${user.user.id}>` : ""
            }.`
        );
    }

    if (subcommand === "archive") {
        const channel = await interaction.options.get("channel");
        const parent = findCategory(channel.channel.name, ARCHIVE_CATEGORIES);
        const c = await channelManager.fetch(channel.channel.id);
        await c.setParent(parent);
        interaction.reply(`<#${channel.channel.id}> has been archived.`);
    }
};

export { interactionCreate };
