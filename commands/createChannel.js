const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
    .setName("create")
    .setDescription("Create a roleplay channel")
    .setDefaultPermission(false)
    .addStringOption((option) =>
        option
            .setName("type")
            .setDescription("Type of channel")
            .setRequired(true)
            .addChoice("1:1 Roleplay", "one_one")
            .addChoice("RP Starter", "starter")
    )
    .addUserOption((option) =>
        option
            .setName("user")
            .setDescription("The user requesting the channel")
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName("channelname")
            .setDescription(
                "Name of the channel (spaces will be replaced with dashes)"
            )
            .setRequired(true)
    );

module.exports = {
    data,
};
