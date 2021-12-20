import { Client, Intents } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
    BOT_TOKEN,
    CLIENT_ID,
    GUILD_ID,
    COMMAND_PERMISSIONS,
} from "../config.js";

const commands = [
    new SlashCommandBuilder()
        .setName("channel")
        .setDescription("Manage roleplay channels")
        .setDefaultPermission(false)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create an RP channel")
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
                        .setName("channel")
                        .setDescription(
                            "Name of the channel (spaces will be replaced with dashes)"
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("move")
                .setDescription("Move a channel")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("The channel to move")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("destination")
                        .setDescription("Where to move the channel")
                        .setRequired(true)
                        .addChoice("RP Starters", "starter")
                        .addChoice("1:1 Roleplay", "one_one")
                        .addChoice("Inactive Roleplay", "inactive")
                )
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("The user requesting the operation")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("archive")
                .setDescription("Archive a channel")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("The channel to archive.")
                        .setRequired(true)
                )
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("The user requesting the operation")
                )
        ),
    new SlashCommandBuilder()
        .setName("echo")
        .setDescription("Echoes a statement using the bot.")
        .setDefaultPermission(false)
        .addStringOption((option) =>
            option
                .setName("statement")
                .setDescription("The thing you want to say.")
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName("stick")
        .setDescription("Use Senpai's Stick.")
        .setDefaultPermission(false),
    new SlashCommandBuilder()
        .setName("word")
        .setDescription("Word of the day."),
    new SlashCommandBuilder()
        .setName("achievements")
        .setDescription("List all achievements."),
    new SlashCommandBuilder()
        .setName("badge")
        .setDescription("Sets the badge next to your name.")
        .addStringOption((option) =>
            option
                .setName("emoji")
                .setDescription("The badge you'd like to switch to.")
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Displays a user's profile.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription(
                    "Which user's profile. Leave empty to see your own."
                )
        ),
    new SlashCommandBuilder()
        .setName("fact")
        .setDescription("Checks if the bot knows anything about a user.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Which user. Leave empty for yourself.")
        ),
    new SlashCommandBuilder()
        .setName("leaders")
        .setDescription("View leaderboards.")
        .addStringOption((option) =>
            option
                .setName("board")
                .setDescription("Which leaderboard to display.")
                .addChoice("Current 12 hours", "hour")
                .addChoice("Previous 12 hours", "phour")
                .addChoice("Today", "day")
                .addChoice("Yesterday", "pday")
                .addChoice("This week", "week")
                .addChoice("Last week", "pweek")
                .addChoice("This month", "month")
                .addChoice("Last month", "pmonth")
        ),
];

(async function () {
    const commandJson = [];
    commands.forEach((command) => {
        commandJson.push(command.toJSON());
    });

    try {
        // register the commands
        console.log("Started refreshing application (/) commands.");
        const rest = new REST({ version: "9" }).setToken(BOT_TOKEN);
        const res = await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            {
                body: commands,
            }
        );

        console.log(res);
        console.log("Successfully reloaded application (/) commands.");

        // register the command permissions
        const client = new Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_PRESENCES,
            ],
        });

        client.on("ready", async () => {
            if (!client.application?.owner) await client.application?.fetch();

            await Promise.all(
                res.map(async (cmd) => {
                    const c = COMMAND_PERMISSIONS.find(
                        (p) => p.name === cmd.name
                    );
                    if (c) {
                        const command = await client.guilds.cache
                            .get(GUILD_ID)
                            ?.commands.fetch(cmd.id);

                        const response = await command.permissions.set({
                            permissions: c.permissions,
                        });
                        console.log(response);
                    }
                })
            );

            client.destroy();
        });

        client.login(BOT_TOKEN);
    } catch (error) {
        console.error(error);
    }
})();
