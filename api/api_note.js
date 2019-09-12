var express = require("express");
var router = express.Router();
var db = require("../models/connectMssql");
var moment = require("moment")
moment.locale('th')

router.get("/show", function (req, res) {
  let userId = req.query.userId;
  let sql = `SELECT CONCAT(SUBSTRING(user_note.description, 0, 100),'...') AS topic ,
                user_note.id,
                user_note.is_sticky,
                user_note.update_date,
                user_note.is_schedule,
                user_note.schedule_date,
                color.font_color,
                color.back_color
              FROM user_note
              LEFT JOIN color ON user_note.color_id = color.id
              WHERE color.type = 'note' 
                AND user_note.is_delete = '0' 
                AND user_note.create_by = '${userId}'
              ORDER BY user_note.is_sticky DESC ,user_note.update_date DESC`
  db.query(sql, function (response) {
    res.status(200).json(response)
  })
})
router.get("/showId", function (req, res) {
  let id = req.query.id;
  let sql = `SELECT CONCAT(SUBSTRING(user_note.description, 0, 100),'...') AS topic ,
                user_note.description,
                user_note.is_sticky,
                user_note.update_date,
                user_note.is_schedule,
                user_note.schedule_date,
                color.font_color,
                color.back_color
              FROM user_note
              LEFT JOIN color ON user_note.color_id = color.id
              WHERE color.type = 'note' 
                AND user_note.is_delete = '0' 
                AND user_note.id = '${id}'`
  db.query(sql, function (response) {
    res.status(200).json(response)
  })
})
router.post("/add", function (req, res) {
  let description = req.body.description;
  let colorId = req.body.colorId;
  let schedule_date = req.body.schedule_date;
  let is_schedule = req.body.is_schedule
  let is_sticky = req.body.is_sticky
  let userId = req.body.userId;
  let sql = `INSERT INTO user_note (description, color_id, create_by,update_by,is_sticky,is_schedule,schedule_date)
  VALUES ('${description}', '${colorId}','${userId}','${userId}','${is_sticky}','${is_schedule}','${schedule_date}');`
  console.log(sql);
  let promise = new Promise((resolve, reject) => {
    db.query(sql, function (response) {
      resolve(response)
    })
  }).then(() => {
    return new Promise((resolve, reject) => {
      let note_id = `SELECT TOP(1)id
                      FROM user_note
                      WHERE description = '${description}'
                          AND  create_by = '${userId}'
                      ORDER BY update_date DESC`
      db.query(note_id, function (response) {
        resolve(response[0]);
      })
    })
  }).then(json => {
    res.status(200).json(json)
  })
})

router.post("/edit", function (req, res) {
  let description = req.body.description;
  let colorId = req.body.colorId;
  let schedule_date = req.body.schedule_date;
  let is_schedule = req.body.is_schedule
  let is_sticky = req.body.is_sticky
  let userId = req.body.userId;
  let id = req.body.noteId;
  let date = moment().format('YYYY-MM-DD HH:mm:ss');
  let sql = `UPDATE user_note 
             SET description = '${description}',
                 color_id = '${colorId}',
                 update_by = '${userId}',
                 schedule_date = '${schedule_date}',
                 is_schedule = '${is_schedule}',
                 is_sticky = '${is_sticky}',
                 update_date = '${date}',
                 WHERE id = '${id}';`
  let promise = new Promise((resolve, reject) => {
    db.query(sql, function (response) {
      resolve(response)
    })
  }).then(() => {
    res.status(200).json('OK')
  })
})

router.get("/delete", function (req, res) {
  let id = req.query.id;
  let sql = `UPDATE user_note
              SET is_delete = '1'
              WHERE id = '${id}'`
  db.query(sql, function (response) {
    res.status(200).json('OK')
  })
})

module.exports = router;