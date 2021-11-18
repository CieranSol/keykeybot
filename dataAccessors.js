// this file is for methods that query the database
const { Op } = require("sequelize");

const {
    sequelize,
    Character,
    RoleplayFilter,
    RoleplayLog,
} = require("./models.js");

let characterCache = {};
let roleplayFilterCache = {};

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

// update a row in the roleplay log
const updateRoleplayLog = async (update, where) => {
    return RoleplayLog.update(update, where);
};

// create a row in the roleplay log
const createRoleplayLog = async (fields) => {
    return RoleplayLog.create(fields);
};

module.exports = {
    getCharacters,
    getLeaderboard,
    getRoleplayFilters,
    updateRoleplayLog,
    createRoleplayLog,
};
