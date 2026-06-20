const User    = require('./User');
const Task    = require('./Task');
const Version = require('./Version');
const Project = require('./Project');

User.hasMany(Project, { foreignKey: 'userId', onDelete: 'CASCADE' });
Project.belongsTo(User, { foreignKey: 'userId' });

Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(Version, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Version.belongsTo(Project, { foreignKey: 'projectId' });

Version.hasMany(Task, { foreignKey: 'versionId', onDelete: 'SET NULL' });
Task.belongsTo(Version, { foreignKey: 'versionId' });

module.exports = { User, Task, Version, Project };
