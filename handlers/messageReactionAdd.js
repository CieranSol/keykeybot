const { Permissions } = require("discord.js");

const {
    INTRO_CHANNEL,
    VERIFIED_ROLE,
    WELCOME_CHANNEL,
} = require("../config.json");

const messageReactionAdd = async (reaction, client) => {
    if (ENVIRONMENT === "dev") return;
    // intro channel reacts
    if (reaction.message.channelId === INTRO_CHANNEL && reaction.count === 1) {
        if (reaction.emoji.name === "⚠️") {
            // warning message DM
            await sendWarningDM(reaction, client);
        }
        if (reaction.emoji.name === "✅") {
            // welcome user
            await welcomeUser(reaction, client);
        }
    }
};

const sendWarningDM = async (reaction, client) => {
    const users = await reaction.users.fetch();
    const user = users.entries().next().value[1];
    // check if user has manage channels permission
    const hasManageChannels = await reaction.message.channel.guild.members.cache
        .get(user.id)
        .permissions.has(Permissions.FLAGS.MANAGE_ROLES);
    if (hasManageChannels) {
        // send info message to the user - we put the messages in try/catch blocks
        // just in case we dont have permissions to send to a user
        try {
            await reaction.message.author
                .send(`Heya, welcome to RPHQ! :wave: Your intro has not been approved due to one or more of the following reasons: 

• Your intro's about section must be at least 3 sentences long.
• Your intro's about section must include information about your RP history/preferences.
• Your intro must include your age to confirm that you are over 18.
• Your intro must include what name we should address you by.
• Your intro __must not__ include kinks or NSFW content.

In addtion to your intro, you must select at least one role from the **#roles** channel.

Please adjust your intro in order to gain access to the server. Thank you! - RPHQ Team`);
            // send confirmation message to the person who reacted
            try {
                await client.users.cache
                    .get(user.id)
                    .send(
                        `Intro warning sent to ${reaction.message.author.username}.`
                    );
            } catch (e3) {
                console.log(e3);
            }
        } catch (e) {
            try {
                await client.users.cache
                    .get(user.id)
                    .send(
                        `ERROR! Intro warning could not be sent to ${reaction.message.author.username}.`
                    );
            } catch (e2) {
                console.log(e2);
            }
        }
    }
};

const welcomeUser = async (reaction, client) => {
    const users = await reaction.users.fetch();
    const user = users.entries().next().value[1];
    // check that the user has manage roles permission
    const hasManageRoles = await reaction.message.channel.guild.members.cache
        .get(user.id)
        .permissions.has(Permissions.FLAGS.MANAGE_ROLES);
    if (hasManageRoles) {
        const author = await reaction.message.channel.guild.members.cache.get(
            reaction.message.author.id
        );
        // let the user into the server
        if (author) {
            author.roles.add(VERIFIED_ROLE);
            // announce the user's arrival
            const channel = client.channels.cache.get(WELCOME_CHANNEL);
            channel.send(
                `Welcome to RPHQ, <@${reaction.message.author.id}>! :wave:`
            );
        }
    }
};

module.exports = {
    messageReactionAdd,
};
