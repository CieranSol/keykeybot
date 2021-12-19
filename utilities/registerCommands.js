import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { BOT_TOKEN, CLIENT_ID, GUILD_ID } from "../config.js";
import fs from "fs";

const commands = [];
const commandFiles = fs
    .readdirSync("../commands")
    .filter((file) => file.endsWith(".js"));
console.log(commandFiles);
for (const file of commandFiles) {
    const command = import(`../commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(BOT_TOKEN);

(async () => {
    try {
        console.log("Started refreshing application (/) commands.");

        const res = await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            {
                body: commands,
            }
        );

        console.log(res);
        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
})();
