const Sequelize = require('sequelize');

var SequelizeConfig = new Sequelize('ruamitr', 'sa', 'P@ssw0rd', {
  host: '172.18.60.3',
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: false,
    }
  },
});

// var SequelizeTestConnect = SequelizeConfig.authenticate().then((err) => {
//   console.log('Connection successful', err);
// }).catch((err) => {
//   console.log('Unable to connect to database', err);
// });

module.exports.Sequelize = Sequelize;
module.exports.SequelizeConfig = SequelizeConfig;

