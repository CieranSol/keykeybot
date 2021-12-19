import { hasRoleplay } from "../logic.js";
import { ENVIRONMENT } from "../config.js";

const channelCreate = async (channel) => {
    if (ENVIRONMENT === "dev") return;
    // when we create or update channels, if theyre
    // in roleplay categories, sort them in alphabetical
    // order
    if (await hasRoleplay({ channel })) {
        const sortedSiblings = channel.parent.children
            .filter((c) => c.type === "GUILD_TEXT")
            .map(({ name, id, position }) => {
                return {
                    name,
                    id,
                    position,
                };
            })
            .sort((a, b) => {
                return a.position - b.position;
            });
        for (let i = 0; i < sortedSiblings.length; i++) {
            if (sortedSiblings[i].name === "info") {
                // don't sort the info channel, that stays at the top
                continue;
            }
            if (channel.name.localeCompare(sortedSiblings[i].name) === -1) {
                await channel.setPosition(i);
                break;
            } else {
                continue;
            }
        }
    }
};

export { channelCreate };
