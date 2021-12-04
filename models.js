// this file is for defining our database models
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./keykey.db",
    dialectOptions: {
        supportBigNumbers: true,
        bigNumberStrings: true,
    },
});

const Character = sequelize.define(
    "character",
    {
        id: { type: Sequelize.INTEGER, primaryKey: true },
        owner: { type: Sequelize.STRING },
        trigger: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        avatar: { type: Sequelize.STRING },
    },
    {
        freezeTableName: true,
    }
);

const RoleplayFilter = sequelize.define("roleplay_filter", {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    discordId: { type: Sequelize.STRING },
    type: { type: Sequelize.STRING },
});

const RoleplayLog = sequelize.define("roleplay_log", {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    messageId: { type: Sequelize.STRING },
    userId: { type: Sequelize.STRING },
    length: { type: Sequelize.INTEGER },
    createdAt: { type: Sequelize.DATE },
    hash: { type: Sequelize.STRING },
    deletedAt: { type: Sequelize.DATE },
});

const Cooldown = sequelize.define("cooldown", {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    item: { type: Sequelize.STRING },
    userId: { type: Sequelize.STRING },
    usedAt: { type: Sequelize.DATE },
});

const Achievement = sequelize.define("achievement", {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    description: { type: Sequelize.STRING },
    roleId: { type: Sequelize.STRING },
    icon: { type: Sequelize.STRING },
    createdAt: { type: Sequelize.DATE },
    updatedAt: { type: Sequelize.DATE },
});

const AchievementLog = sequelize.define("achievement_log", {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    userId: { type: Sequelize.STRING },
    achievementId: { type: Sequelize.INTEGER },
    createdAt: { type: Sequelize.DATE },
    updatedAt: { type: Sequelize.DATE },
});

AchievementLog.hasOne(Achievement, {
    foreignKey: "id",
    sourceKey: "achievementId",
});

module.exports = {
    sequelize,
    Cooldown,
    Character,
    RoleplayFilter,
    RoleplayLog,
    Achievement,
    AchievementLog,
};
