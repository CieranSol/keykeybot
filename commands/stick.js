const { SlashCommandBuilder } = require("@discordjs/builders");

const data = new SlashCommandBuilder()
    .setName("stick")
    .setDescription("Use Senpai's Stick.")
    .setDefaultPermission(false);

module.exports = {
    data,
};
