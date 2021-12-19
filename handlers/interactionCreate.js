import got from "got";
import cheerio from "cheerio";

import {
    SENPAIS_STICK_ROLE,
    VERIFIED_ROLE,
    INACTIVE_ONE_ON_ONE_CATEGORIES,
    ONE_ON_ONE_CATEGORIES,
    STARTER_CATEGORIES,
    ARCHIVE_CATEGORIES,
} from "../config.js";

import { findCategory } from "../logic.js";

const interactionCreate = async (interaction, client) => {
    if (!interaction.isCommand()) return;
    switch (interaction.commandName) {
        case "stick":
            stickHandler(interaction, client);
            break;
        case "channel":
            channelHandler(interaction, client);
            break;
        case "word":
            wordHandler(interaction, client);
            break;
    }
};

const wordHandler = async (interaction, client) => {
    const page = await got.get(
        "https://www.merriam-webster.com/word-of-the-day/"
    );
    const $ = cheerio.load(page.body);

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const word = capitalizeFirstLetter($(".word-and-pronunciation h1").text());
    const definition = $(".wod-definition-container > p").text();
    const editedDef = definition
        .substring(0, definition.length - 15)
        .replace("// ", "\n*");
    interaction.reply(`Word of the Day: **${word}**
${editedDef}*`);
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

const channelHandler = async (interaction) => {
    const subcommand = await interaction.options.getSubcommand();
    const channelManager = await interaction.guild.channels;
    const user = await interaction.options.get("user");
    if (subcommand === "create") {
        const typeResponse = await interaction.options.get("type");
        const type = typeResponse.value;
        const channelResponse = await interaction.options.get("channel");
        const channel = channelResponse.value.replace(" ", "-");
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
        const parent = findCategory(channel, categoryCategory);
        const channelCreateResponse = await channelManager.create(channel, {
            parent,
        });
        interaction.reply(
            `**${categoryString}** <#${channelCreateResponse?.id}> has been created for <@${user.user.id}>`
        );
    }

    if (subcommand === "move") {
        const channel = await interaction.options.get("channel");
        const destinationResponse = await interaction.options.get(
            "destination"
        );
        const destination = destinationResponse.value;
        let destinationCategories;
        let destinationString = "";
        switch (destination) {
            case "starter":
                destinationCategories = STARTER_CATEGORIES;
                destinationString = "RP Starters";
                break;
            case "one_one":
                destinationCategories = ONE_ON_ONE_CATEGORIES;
                destinationString = "1:1 Roleplay";
                break;
            case "inactive":
            default:
                destinationCategories = INACTIVE_ONE_ON_ONE_CATEGORIES;
                destinationString = "Inactive Roleplay";
                break;
        }

        const parent = findCategory(
            channel.channel.name,
            destinationCategories
        );
        const c = await channelManager.fetch(channel.channel.id);
        await c.setParent(parent);
        interaction.reply(
            `<#${channel.channel.id}> has been moved to ${destinationString}${
                user ? ` on behalf of <@${user.user.id}>` : ""
            }.`
        );
    }

    if (subcommand === "archive") {
        const channel = await interaction.options.get("channel");
        const parent = findCategory(channel.channel.name, ARCHIVE_CATEGORIES);
        const c = await channelManager.fetch(channel.channel.id);
        await c.setParent(parent);
        interaction.reply(`<#${channel.channel.id}> has been archived.`);
    }
};

export { interactionCreate };
