// for running scheduled tasks such as leaderboard awards
const { Client, Intents } = require("discord.js");
const moment = require("moment-timezone");

const {
    LOCALE,
    GUILD_ID,
    DAY_AWARD_ID,
    WEEK_AWARD_ID,
    MONTH_AWARD_ID,
} = require("./config.json");

const config = require("./config.json");
const { getLeaderboard } = require("./dataAccessors.js");

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

const assignAward = async (guild, user, awardId) => {
    // first remove the role from anyone who has it
    const membersWithRole = await guild.roles.fetch(awardId);
    await membersWithRole.members.forEach(async (m) => {
        await m.roles.remove(awardId);
    });
    // then add the role to the leader
    await user.roles.add(awardId);
};

client.login(config.BOT_TOKEN).then(async () => {
    const guild = await client.guilds.fetch(GUILD_ID);
    // set the initial values to the daily leaderboard
    let from = moment.tz(LOCALE).subtract(1, "days").startOf("day").utc();
    let to = moment.tz(LOCALE).subtract(1, "days").endOf("day").utc();
    let awardId = null;
    if (process.argv.includes("-d")) {
        // set the award id to the day award; other values already set
        awardId = DAY_AWARD_ID;
    } else if (process.argv.includes("-w")) {
        // set the values for the weekly award
        from = moment.tz(LOCALE).subtract(1, "week").startOf("week").utc();
        to = moment.tz(LOCALE).subtract(1, "week").endOf("week").utc();
        awardId = WEEK_AWARD_ID;
    } else if (process.argv.includes("-m")) {
        // set the values for the monthly award
        from = moment.tz(LOCALE).subtract(1, "month").startOf("month").utc();
        to = moment.tz(LOCALE).subtract(1, "month").endOf("month").utc();
        awardId = MONTH_AWARD_ID;
    }
    // if there was an award set, assign it to the proper user
    if (awardId) {
        const leader = await getLeaderboard(from, to, 1);
        if (leader[0]) {
            const user = await guild.members.fetch(leader[0].dataValues.userId);
            await assignAward(guild, user, awardId);
        }
        client.destroy();
    } else {
        client.destroy();
    }
});
