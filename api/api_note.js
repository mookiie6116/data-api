var express = require("express");
var router = express.Router();
var db = require("../models/connectMssql");
var moment = require("moment")
moment.locale('th')

router.get("/show", function (req, res) {
  let userId = req.query.userId;
  let sql = `SELECT 
                CASE
                  WHEN LEN(user_note.description) > 50 THEN CONCAT(SUBSTRING(user_note.description, 0, 50),'...')
                  ELSE user_note.description
                END AS topic,
                user_note.description,
                user_note.id,
                user_note.is_sticky,
                user_note.update_date,
                user_note.is_schedule,
                user_note.schedule_date,
                user_note.is_status as isStatus,
                color.id as colorId,
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
  let sql = `SELECT 
                CASE
                  WHEN LEN(user_note.description) > 50 THEN CONCAT(SUBSTRING(user_note.description, 0, 50),'...')
                  ELSE user_note.description
                END AS topic,
                user_note.description,
                user_note.is_sticky,
                user_note.update_date,
                user_note.is_schedule,
                user_note.schedule_date,
                user_note.is_status as isStatus,
                color.id as colorId,
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
  let schedule_date = (req.body.schedule_date == null) ? null : `'${req.body.schedule_date}'`;
  let is_schedule = (schedule_date == null) ? 0 : 1
  let status = (schedule_date == null) ? 0 : 1
  let is_sticky = req.body.is_sticky ? 1 : 0
  let userId = req.body.userId;
  let date = moment().utc().format();
  let id = req.body.noteId;
  let sql = ""
  if (!id) {
    sql += `INSERT INTO user_note (description, color_id, create_by,update_by,is_sticky,is_status,is_schedule,schedule_date)
            VALUES ('${description}', '${colorId}','${userId}','${userId}','${is_sticky}','${status}', ${is_schedule}, ${schedule_date});`
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
  } else {
    sql += `UPDATE user_note
            SET description = '${description}',
                color_id = '${colorId}',
                update_by = '${userId}',
                schedule_date = ${schedule_date},
                is_schedule = '${is_schedule}',
                is_sticky = '${is_sticky}',
                update_date = '${date}',
                is_status = ${status}
                WHERE id = '${id}';`
    let promise = new Promise((resolve, reject) => {
      db.query(sql, function (response) {
        resolve(response)
      })
    }).then(() => {
      res.status(200).json('OK')
    })
  }

})

router.post("/edit", function (req, res) {

  let description = req.body.description;
  let colorId = req.body.colorId;
  let schedule_date = (req.body.schedule_date == null) ? null : `'${req.body.schedule_date}'`;
  let is_schedule = (schedule_date == null) ? 0 : 1
  let is_sticky = req.body.is_sticky
  let userId = req.body.userId;
  let id = req.body.noteId;
  let date = moment().utc().format();
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
router.get("/close", function (req, res) {
  let id = req.query.id;
  let sql = `UPDATE user_note
              SET is_status = 0,
              is_schedule = '0',
              schedule_date = null
              WHERE id = '${id}'`
  db.query(sql, function (response) {
    res.status(200).json('OK')
  })
})
router.get("/color", function (req, res) {
  let sql = `select color.id,color.font_color,
              color.back_color
              FROM color
              WHERE color.type = 'note'`
  db.query(sql, function (response) {
    res.status(200).json(response)
  })
})

module.exports = router;