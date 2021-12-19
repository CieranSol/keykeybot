// this file is for methods that query the database
import Sequelize from "sequelize";
import moment from "moment-timezone";

import {
    sequelize,
    Character,
    RoleplayFilter,
    RoleplayLog,
    Cooldown,
    Counter,
    Achievement,
    AchievementLog,
} from "./models.js";

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
                [Sequelize.Op.gt]: from.toDate(),
                [Sequelize.Op.lt]: to.toDate(),
            },
            deletedAt: {
                [Sequelize.Op.eq]: null,
            },
        },
        group: ["userId"],
        order: [[sequelize.fn("sum", sequelize.col("length")), "DESC"]],
        limit,
    });
    return leaders;
};

const getCurrencyLeader = async (limit = 20) => {
    const leaders = await RoleplayLog.findAll({
        attributes: [
            "userId",
            // "createdAt",
            [
                sequelize.fn(
                    "count",
                    sequelize.fn("distinct", sequelize.col("channelId"))
                ),
                "dayCount",
            ],
        ],
        group: [
            "userId",
            [sequelize.fn("date_trunc", "day", sequelize.col("createdAt"))],
        ],
    });
    const leaderArray = leaders
        .reduce((p, c) => {
            const idx = p.findIndex((i) => i.userId === c.dataValues.userId);
            if (idx > -1) {
                const newCount = p[idx].count + parseInt(c.dataValues.dayCount);
                p[idx].count = newCount;
            } else {
                p.push({
                    userId: c.dataValues.userId,
                    count: parseInt(c.dataValues.dayCount),
                });
            }
            return p;
        }, [])
        .sort((a, b) => b.count - a.count)
        .filter((i) => i.count != 0)
        .slice(0, 20);
    return leaderArray;
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

// get a user's achievements
const getUserAchievements = async (userId) => {
    let achievements = await AchievementLog.findAll({
        where: { userId },
        include: Achievement,
    });
    // add the holiday achievement in november
    if (moment().month() === 11) {
        let christmasAchievement = await Achievement.findOne({
            where: { id: 29 },
        });
        const christmasAchievementLog = {
            dataValues: {
                id: 0,
                userId: userId,
                achievementId: 0,
                createdAt: null,
                updatedAt: null,
                achievement: {
                    dataValues: {},
                },
            },
        };
        christmasAchievementLog.dataValues.achievement = christmasAchievement;
        achievements.push(christmasAchievementLog);
    }
    return achievements;
};

// get the list of all achievements
const getAchievements = async (noSpecials) => {
    let response = [];
    // sometimes we don't want to load "special"
    // achievements - these are achievements which
    // are only meant for a single user.
    if (noSpecials) {
        response = await Achievement.findAll({
            where: {
                special: {
                    [Sequelize.Op.eq]: null,
                },
            },
        });
    } else {
        response = await Achievement.findAll();
    }
    return response.map((a) => a.dataValues);
};

// get a single achievement
const getAchievement = async (id) => {
    const achievement = await Achievement.findOne({
        where: { id },
    });
    return achievement.dataValues;
};

// create a new achievement log
const createAchievementLog = async (fields) => {
    const check = await AchievementLog.findOne({
        where: fields,
    });
    if (check) {
        return false;
    } else {
        return AchievementLog.create(fields);
    }
};

// remove a temporary achievement (leaderboard)
const removeTemporaryAchievement = async (achievementId) => {
    return AchievementLog.destroy({
        where: {
            achievementId,
        },
    });
};

// get a users total number of characters written
const getCharactersWritten = async (userId) => {
    const logs = await RoleplayLog.findAll({
        attributes: [
            [sequelize.fn("sum", sequelize.col("length")), "charactersWritten"],
        ],
        where: {
            userId,
            deletedAt: {
                [Sequelize.Op.eq]: null,
            },
        },
        group: [
            sequelize.literal(
                `to_timestamp(floor((extract('epoch' from "updatedAt") / 840 )) * 840)`
            ),
        ],
    });
    return logs.map((l) => l.dataValues.charactersWritten);
};

// get the value of a specific counter for a specific user
const getCounter = async (type, userId) => {
    const counter = await Counter.findOne({
        where: {
            type,
            userId,
        },
    });
    return counter?.dataValues;
};

// create a specific counter for a specific user
const createCounter = async (type, userId) => {
    Counter.create({
        type,
        userId,
        count: 1,
    });
};

// update a specific counter for a specific user
const updateCounter = async (type, userId, count) => {
    Counter.update(
        {
            count,
        },
        {
            where: {
                type,
                userId,
            },
        }
    );
};

export {
    createAchievementLog,
    createCounter,
    createRoleplayLog,
    getAchievement,
    getAchievements,
    getCurrencyLeader,
    getUserAchievements,
    getCharacters,
    getCharactersWritten,
    getCooldown,
    getCounter,
    getLeaderboard,
    getRoleplayFilters,
    removeTemporaryAchievement,
    updateCooldown,
    updateCounter,
    updateRoleplayLog,
};
