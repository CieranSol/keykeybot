// this file is for defining our database models
import { Sequelize } from "sequelize";

import { POSTGRES_URI } from "./config.js";

const sequelize = new Sequelize(POSTGRES_URI);

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
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    discordId: { type: Sequelize.STRING },
    type: { type: Sequelize.STRING },
});

const RoleplayLog = sequelize.define("roleplay_log", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    messageId: { type: Sequelize.STRING },
    userId: { type: Sequelize.STRING },
    length: { type: Sequelize.INTEGER },
    createdAt: { type: Sequelize.DATE },
    deletedAt: { type: Sequelize.DATE },
    channelId: { type: Sequelize.STRING },
});

const Cooldown = sequelize.define("cooldown", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    item: { type: Sequelize.STRING },
    userId: { type: Sequelize.STRING },
    usedAt: { type: Sequelize.DATE },
});

const Counter = sequelize.define("counter", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: Sequelize.STRING },
    userId: { type: Sequelize.STRING },
    count: { type: Sequelize.INTEGER },
    createdAt: { type: Sequelize.DATE },
    updatedAt: { type: Sequelize.DATE },
});

const Achievement = sequelize.define("achievement", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    description: { type: Sequelize.STRING },
    roleId: { type: Sequelize.STRING },
    icon: { type: Sequelize.STRING },
    createdAt: { type: Sequelize.DATE },
    updatedAt: { type: Sequelize.DATE },
});

const AchievementLog = sequelize.define("achievement_log", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: Sequelize.STRING },
    achievementId: { type: Sequelize.INTEGER },
    createdAt: { type: Sequelize.DATE },
    updatedAt: { type: Sequelize.DATE },
});

AchievementLog.hasOne(Achievement, {
    foreignKey: "id",
    sourceKey: "achievementId",
});

export {
    sequelize,
    Cooldown,
    Counter,
    Character,
    RoleplayFilter,
    RoleplayLog,
    Achievement,
    AchievementLog,
};
