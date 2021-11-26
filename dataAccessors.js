// this file is for methods that query the database
const { Op } = require("sequelize");

const {
    sequelize,
    Character,
    RoleplayFilter,
    RoleplayLog,
    Cooldown,
} = require("./models.js");

let characterCache = {};
let roleplayFilterCache = {};

// create a row in the roleplay log
const createRoleplayLog = async (fields) => {
    return RoleplayLog.create(fields);
};

// find all tupper-esque characters for a user
const getCharacters = async (message) => {
    if (!characterCache[message.author.id]) {
        const characters = await Character.findAll({
            where: { owner: message.author.id },
        });
        characterCache[message.author.id] = characters.map((c) => c.dataValues);
    }

    return characterCache[message.author.id];
};

// get config key/value store from DB
const getCooldown = async (item, userId) => {
    const cooldown = await Cooldown.findOne({
        where: {
            item,
            userId,
        },
    });
    return cooldown?.dataValues?.usedAt;
};

// get a leaderboard for a given time period
const getLeaderboard = async (from, to, limit = 20) => {
    const leaders = await RoleplayLog.findAll({
        attributes: [
            "userId",
            [sequelize.fn("sum", sequelize.col("length")), "totalLength"],
        ],
        where: {
            createdAt: {
                [Op.gt]: from.toDate(),
                [Op.lt]: to.toDate(),
            },
            deletedAt: {
                [Op.eq]: null,
            },
        },
        group: ["userId"],
        order: [[sequelize.literal("totalLength"), "DESC"]],
        limit,
    });
    return leaders;
};

// get the list of roleplay channels & categories
const getRoleplayFilters = async () => {
    if (Object.keys(roleplayFilterCache).length === 0) {
        const roleplayFilters = await RoleplayFilter.findAll();
        roleplayFilterCache = roleplayFilters.map((f) => f.dataValues);
    }
    return roleplayFilterCache;
};

// update a row in the config key/value store
const updateCooldown = async (update, where, rowExists) => {
    if (rowExists) {
        return Cooldown.update(update, where);
    }
    return Cooldown.create(update);
};

// update a row in the roleplay log
const updateRoleplayLog = async (update, where) => {
    return RoleplayLog.update(update, where);
};

module.exports = {
    createRoleplayLog,
    getCharacters,
    getCooldown,
    getLeaderboard,
    getRoleplayFilters,
    updateCooldown,
    updateRoleplayLog,
};
