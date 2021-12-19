import { SlashCommandBuilder } from "@discordjs/builders";

const data = new SlashCommandBuilder()
    .setName("word")
    .setDescription("Word of the day.");

export { data };
