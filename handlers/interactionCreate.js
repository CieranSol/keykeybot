const { SENPAIS_STICK_ROLE, VERIFIED_ROLE } = require("../config.json");
// const { getCooldown, updateCooldown } = require("../dataAccessors.js");
// const moment = require("moment-timezone");

const interactionCreate = async (interaction, client) => {
    if (!interaction.isCommand()) return;
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
        // } else {
        //     interaction.reply({
        //         content: `Senpai's Stick will cooldown in ${moment(cooldown)
        //             .add(5, "minutes")
        //             .fromNow()}`,
        //         ephemeral: true,
        //     });
        // }
    }
};

module.exports = {
    interactionCreate,
};
