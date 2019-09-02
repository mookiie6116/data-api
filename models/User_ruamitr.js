const reqSequelize = require('./connectSequelize');
const Sequelize  = reqSequelize.Sequelize

var User = sequelize.define('user_ruamitr', {
  id: {
    type: Sequelize.STRING,
    field: 'user_id',
    primaryKey: true
  },
  firstName: {
    type: Sequelize.STRING,
    field: 'first_name'
  },
  lastName: {
    type: Sequelize.STRING,
    field: 'last_name'
  }
}, {
    underscored: true,
    freezeTableName: true,
    tableName: 'user_ruamitr'
  });

module.exports = User;