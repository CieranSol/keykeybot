const { updateRoleplayLog } = require("../dataAccessors.js");
const { hasRoleplay } = require("../logic.js");

const messageDelete = async (message) => {
    // if a roleplay message is deleted, we should mark it as such in the DB.
    // this includes when tupper deletes a message.  in the message handler,
    // when tupper creates the replacement message, we un-delete the original
    // and update the message ID to point to the tupper one.
    const isRoleplay = await hasRoleplay(message);
    if (isRoleplay) {
        updateRoleplayLog(
            { deletedAt: new Date().getTime() },
            { where: { messageId: message.id } }
        );
    }
};

module.exports = {
    messageDelete,
};
