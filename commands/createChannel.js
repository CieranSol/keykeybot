import { SlashCommandBuilder } from "@discordjs/builders";

const data = new SlashCommandBuilder()
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
    );

export { data };
