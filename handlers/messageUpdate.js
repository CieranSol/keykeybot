const crypto = require("crypto");

const { updateRoleplayLog } = require("../dataAccessors.js");
const { hasRoleplay, trimText } = require("../logic.js");

const messageUpdate = async (oldMessage, newMessage) => {
    // when a roleplay message is updated, we should update the DB
    // with the new length and the new hash (unique identifier)
    const isRoleplay = await hasRoleplay(oldMessage);
    if (isRoleplay) {
        const trimmedText = trimText(newMessage.content);
        const hash = crypto
            .createHash("sha1")
            .update(trimmedText)
            .digest("base64");
        updateRoleplayLog(
            { hash, length: trimmedText.length },
            { where: { messageId: oldMessage.id } }
        );
    }
};

module.exports = {
    messageUpdate,
};
