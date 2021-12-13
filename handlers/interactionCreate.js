const {
    SENPAIS_STICK_ROLE,
    VERIFIED_ROLE,
    ONE_ON_ONE_CATEGORIES,
    STARTER_CATEGORIES,
} = require("../config.json");

const { findCategory } = require("../logic.js");

const interactionCreate = async (interaction, client) => {
    if (!interaction.isCommand()) return;
    if (ENVIRONMENT === "dev") return;
    switch (interaction.commandName) {
        case "stick":
            stickHandler(interaction, client);
            break;
        case "create":
            createHandler(interaction, client);
            break;
    }
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

const createHandler = async (interaction) => {
    const typeResponse = await interaction.options.get("type");
    const type = typeResponse.value;
    const user = await interaction.options.get("user");
    const channelNameResponse = await interaction.options.get("channelname");
    const channelName = channelNameResponse.value.replace(" ", "-");
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
    const parent = findCategory(channelName, categoryCategory);
    console.log("PARENT: ", parent);
    const channelManager = await interaction.guild.channels;
    const channelResponse = await channelManager.create(channelName, {
        parent,
    });
    interaction.reply(
        `**${categoryString}** <#${channelResponse?.id}> has been created for <@${user.user.id}>`
    );
};

module.exports = {
    interactionCreate,
};
