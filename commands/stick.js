import { SlashCommandBuilder } from "@discordjs/builders";

const data = new SlashCommandBuilder()
    .setName("stick")
    .setDescription("Use Senpai's Stick.")
    .setDefaultPermission(false);

export { data };
