var express = require("express");
var router = express.Router();
const reqSequelize = require('./../models/connectSequelize');
// const Sequelize  = reqSequelize.Sequelize
// const sequelize = reqSequelize.SequelizeConfig;


// var Files = sequelize.define('attachment', {
//   id: {
//     type: Sequelize.INTEGER,
//     field: 'id',
//     primaryKey: true
//   },
//   fileId: {
//     type: Sequelize.STRING,
//     field: 'file_id'
//   },
//   name: {
//     type: Sequelize.STRING,
//     field: 'name'
//   },
//   size: {
//     type: Sequelize.INTEGER,
//     field: 'size'
//   }
// }, {
//     timestamps: false,
//     freezeTableName: true,
//     underscored: true,
//     tableName: 'news_attachment'
//   });
// var View = sequelize.define('recipient', {
//   userId: {
//     type: Sequelize.STRING,
//     field: 'user_id',
//     primaryKey: true
//   },
// }, {
//     timestamps: false,
//     freezeTableName: true,
//     underscored: true,
//     tableName: 'news_recipient'
//   });
// var News = sequelize.define('news', {
//   id: {
//     type: Sequelize.STRING,
//     field: 'id',
//     primaryKey: true
//   },
//   subject: {
//     type: Sequelize.STRING,
//     field: 'content'
//   },
//   content: {
//     type: Sequelize.STRING,
//     field: 'content'
//   },
//   createDate: {
//     type: Sequelize.STRING,
//     field: 'create_date'
//   },
// }, {
//     timestamps: false,
//     underscored: true,
//     // freezeTableName: true,
//     tableName: 'news'
//   }); // timestamps is false by defaul
// var User = sequelize.define('user', {
//   id: {
//     type: Sequelize.STRING,
//     field: 'user_id',
//     primaryKey: true
//   },
//   firstName: {
//     type: Sequelize.STRING,
//     field: 'first_name'
//   },
//   lastName: {
//     type: Sequelize.STRING,
//     field: 'last_name'
//   }
// }, {
//     timestamps: false,
//     underscored: true,
//     freezeTableName: true,
//     tableName: 'user_ruamitr'
//   });

router.get('/',(req,res)=>{
  res.send('hello users')
})

// router.get('/new', async (req, res) => {
//   console.log("new");
//   // const news = await News.findAll();
//   // News.belongsTo(User)
//   News.belongsTo(User, { foreignKey: 'createBy' })
//   // News.belongsTo(Files, { foreignKey: 'id' })
//   // News.belongsTo(View, { foreignKey: 'id' })
  
//   // News.hasMany(Files)
//   News.hasMany(Files)
//   News.hasMany(View)
//   // const items = await News.findAll({ where: ["user_id = createBy"], include: [User] })
//   // const items = await News.findAll({include: [Files, View, { models:User ,where: ["user_id = createBy"] }] })
//   const items = await News.findAll({ include: [Files, View, User] })
//   res.json(items)
// })

module.exports = router;