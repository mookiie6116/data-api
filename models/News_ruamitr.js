const reqSequelize = require('./connectSequelize');
const Sequelize  = reqSequelize.Sequelize

var News = sequelize.define('news', {
  id: {
    type: Sequelize.STRING,
    field: 'id',
    primaryKey: true
  },
  subject: {
    type: Sequelize.STRING,
    field: 'content'
  },
  content: {
    type: Sequelize.STRING,
    field: 'content'
  },
  createDate: {
    type: Sequelize.STRING,
    field: 'create_date'
  },
}, {
    underscored: true,
    tableName: 'news'
  });

module.exports = News;