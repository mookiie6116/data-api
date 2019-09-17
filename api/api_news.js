var express = require("express");
var router = express.Router();
var db = require("../models/connectMssql");
var moment = require("moment")
moment.locale('th')

router.get("/news", function (req, res) {
  let userId = req.query.userId;
  let newsId = req.query.newsId;
  let data = { "pagination": {}, "items": {} }
  let sql = ` SELECT *
              FROM news a
              LEFT JOIN news_recipient b
                      ON a.id = b.news_id
              WHERE is_delete = 0
                AND enable = 1
                AND GETDATE() BETWEEN a.start_date AND a.end_date
                AND b.user_id = '${userId}';`;
  let promise = new Promise((resolve, reject) => {
    db.query(sql, function (response) {
      data.pagination = {
        "limit": "",
        "totalcount": response.length
      }
      resolve(data)
    })
  })
    .then(json => {
      // items
      return new Promise((resolve, reject) => {
        if (json.pagination.totalcount > 0) {
          let offset = (json.pagination.currentpage == 1) ? 0 : ((json.pagination.currentpage - 1) * 3)
          let sql = ` SELECT a.id,
                      a.subject as topic
                    FROM news a
                    LEFT JOIN news_recipient c
                      ON a.id = c.news_id
                    WHERE a.is_delete = 0
                      AND a.enable = 1
                      AND GETDATE() BETWEEN a.start_date AND a.end_date
                      AND c.user_id = '${userId}'
                    ;`;
          db.query(sql, function (response) {
            data.items = response
            resolve(data)
          })
        }
      })
    })
    .then(json => {
      // attachments
      return new Promise((resolve, reject) => {
        let array = json.items
        for (let i = 0, p = Promise.resolve(); i <= json.pagination.totalcount; i++) {
          p = p.then(_ => new Promise(res => {
            if (i < json.pagination.totalcount) {
              const element = array[i];
              let sql_news_attachment = `SELECT
                                        CONCAT('http://172.18.60.2:8009/api/v1/utility/file/download/',news_attachment.file_id) as urlFile,
                                        news_attachment.is_thumbnail
                                       FROM news_attachment
                                       WHERE news_id ='${element.id}' 
                                        AND is_thumbnail = '1'
                                        AND is_deleted = '0'`;
              db.queryOne(sql_news_attachment, function (response) {
                data.items[i].attachments = response.length ? response : []
                res(response)
                // db.disconnect();
              })
            }
            else {
              resolve(data)
            }
          }
          )
          );
        }
      })
    })
    .then(json => {
      res.status(200).json(json)
    })
})
router.get("/news-id", function (req, res) {
  let userId = req.query.userId;
  let newsId = req.query.newsId;
  let data;
  let promise = new Promise((resolve, reject) => {
      let sql = ` SELECT a.id,
                      a.subject as topic ,
                      a.content ,
                      a.create_date as createDate,
                      CONCAT(b.first_name,' ',b.last_name) as createBy
                    FROM news a
                    LEFT JOIN user_ruamitr b
                      ON a.create_by = b.user_id
                    LEFT JOIN news_recipient c
                      ON a.id = c.news_id
                    WHERE a.is_delete = 0
                      AND a.enable = 1
                      AND GETDATE() BETWEEN a.start_date AND a.end_date
                      AND a.id = '${newsId}'
                      AND c.user_id = '${userId}'
                    ;`;
      db.query(sql, function (response) {
        data = response
        resolve(data)
      })
  })
    .then(json => {
      return new Promise((resolve, reject) => {
        let sql_news_attachment = `SELECT news_attachment.news_id,
                                        news_attachment.file_id,
                                        news_attachment.name,
                                        news_attachment.expiration_date,
                                        news_attachment.content_type,
                                        CONCAT('http://172.18.60.2:8009/api/v1/utility/file/download/',news_attachment.file_id) as urlFile,
                                        news_attachment.is_thumbnail
                                       FROM news_attachment
                                       WHERE news_id ='${newsId}' 
                                        AND is_deleted = '0'`;
        db.query(sql_news_attachment, function (response) {
          json[0].attachments = response.length ? response : []
          resolve(json)
        })
      })
    })
    .then(json => {
      res.status(200).json(json)
    })
})
router.get("/news/data", function (req, res) {
  let userId = req.params.userId;
  let offset = parseInt(req.query.offset);
  let currentpage = offset + 1
  let perPage = 20;
  let data = { "pagination": {}, "items": {} };

  let sql = ` SELECT *
              FROM news 
              WHERE is_delete = 0
              ORDER BY id desc `;
  let promise = new Promise((resolve, reject) => {
    db.query(sql, function (response) {
      data.pagination = {
        "limit": perPage,
        "previouspage": ((currentpage - 1) > 0) ? currentpage - 1 : 1,
        "nextpage": (currentpage + 1),
        "currentpage": currentpage,
        "pagecount": (Math.ceil(response.length / perPage)) ? Math.ceil(response.length / perPage) : 0,
        "totalcount": (response.length > 0) ? response.length : 0
      }
      resolve(data)
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      if (json.pagination.totalcount > 0) {
        sql += `OFFSET ${((offset * perPage) - 1 > 0) ? (offset * perPage) - 1 : 0} ROWS
                FETCH NEXT ${perPage} ROWS ONLY;`
        db.query(sql, function (response) {
          data.items = response;
          resolve(data)
        })
      } else {
        resolve(data)
      }
    })
  }).then(json => {
    res.status(200).json(json)
  })
})
router.get("/news/id", function (req, res) {
  let newsId = req.query.id;
  let item
  let sql = `SELECT * FROM news WHERE id = '${newsId}'`
  let promise = new Promise((resolve, reject) => {
    db.query(sql, function (response) {
      if (response.length > 0) item = response
      resolve(item)
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql_news_attachment = `SELECT news_attachment.news_id,
          news_attachment.file_id,
          news_attachment.name,
          news_attachment.expiration_date,
          news_attachment.content_type,
          CONCAT('http://172.18.60.2:8009/api/v1/utility/file/download/',news_attachment.file_id) as urlFile,
          news_attachment.is_thumbnail
        FROM news_attachment
        WHERE news_id ='${newsId}' 
          AND is_deleted = '0'`;
      db.query(sql_news_attachment, function (response) {
        json[0].attachments = response
        resolve(json)
      })
    })
  }).then(json => {
    res.status(200).json(json)
  })
})
router.post("/addContent", function (req, res) {
  let subject = req.body.subject
  let content = req.body.content
  let start_date = req.body.start_date
  let end_date = req.body.end_date
  let userId = req.body.userId
  let recipient = req.body.recipient
  let promise = new Promise((resolve, reject) => {
    let sql = `INSERT INTO news (subject, content, start_date,end_date,create_by)
              VALUES ('${subject}', '${content}', '${start_date}','${end_date}','${userId}');`
    db.query(sql, function (response) {
      resolve()
    })
  })
    .then(json => {
      return new Promise((resolve, reject) => {
        let news_id = `SELECT id
                      FROM news
                      WHERE subject = '${subject}'
                          AND  content = '${content}'
                          AND  start_date = '${start_date}'
                          AND  end_date = '${end_date}'
                          AND  create_by = '${userId}'`
        db.query(news_id, function (response) {
          resolve(response[0].id);
        })
      })
    })
    .then(json => {
      return new Promise((resolve, reject) => {
        for (let i = 0, p = Promise.resolve(); i <= recipient.length; i++) {
          p = p.then(_ => new Promise(res => {
            if (i < recipient.length) {
              const element = recipient[i];
              console.log(element);
              let sql_recipient = `INSERT INTO news_recipient (news_id, user_id)
                                    VALUES ('${json}','${element}');`
              db.queryOne(sql_recipient, function (response) {
                res(response)
                db.disconnect();
              })
            }
            else {
              resolve(json)
            }
          }));
        }
      })
    })
    .then(json => {
      res.status(200).json({ "news_id": json })
    })
})
router.post("/editContent", function (req, res) {
  let newsId = req.body.newsId
  let subject = req.body.subject
  let content = req.body.content
  let start_date = req.body.start_date
  let end_date = req.body.end_date
  let userId = req.body.userId
  let recipient = req.body.recipient
  let date = moment().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql = `DELETE FROM news_recipient WHERE news_id = '${newsId}';`
    db.query(sql, function (response) {
      resolve(newsId)
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql_update = `UPDATE news
                SET subject = '${subject}', 
                    content = '${content}', 
                    start_date = '${start_date}',
                    end_date = '${end_date}',
                    update_date = '${date}',
                    update_by = '${userId}'
                WHERE id = '${json}';`
      db.query(sql_update, function (response) {
        resolve(json)
      })
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      for (let i = 0, p = Promise.resolve(); i <= recipient.length; i++) {
        p = p.then(_ => new Promise(res => {
          if (i < recipient.length) {
            const element = recipient[i];
            let sql_recipient = `INSERT INTO news_recipient (news_id, user_id)
                                  VALUES ('${json}','${element}');`
            db.queryOne(sql_recipient, function (response) {
              res(response)
              db.disconnect();
            })
          }
          else {
            resolve(json)
          }
        }));
      }
    })
  }).then(json => {
    res.status(200).json({ "news_id": json })
  })
})
router.post("/addImage", function (req, res) {
  let file_id = req.body.file_id
  let name = req.body.name
  let size = req.body.size
  let contenty_type = req.body.contenty_type
  let create_by = req.body.userId
  let news_id = req.body.newsId
  let is_thumbnail = req.body.thumbnail
  let sql = `INSERT INTO news_attachment (file_id, name, size,contenty_type,create_by,news_id,is_thumbnail)
              VALUES ('${file_id}','${name}','${size}','${contenty_type}','${create_by}','${news_id}','${is_thumbnail}');`
  db.query(sql, function (response) {
    res.status(200).json(response)
  })
})
router.post("/deleteContent", function (req, res) {
  let date = moment().format('YYYY-MM-DD HH:mm:ss');
  let userId = req.body.userId
  let newsId = req.body.newsId
  let sql = `UPDATE news
              SET enable = '0', is_delete = '1',
                  update_date = '${date}',
                  update_by = '${userId}'
              WHERE id = '${newsId}';`
  db.query(sql, function (response) {
    res.status(200).json('OK')
  })
})
router.post("/deleteImage", function (req, res) {
  let newsId = req.body.newsId
  let fileId = req.body.fileId
  let sql = `UPDATE news
              SET is_delete = '1'
              WHERE news_id = '${newsId} 
                AND file_id = '${fileId}';`
  db.query(sql, function (response) {
    res.status(200).json('OK')
  })
})

module.exports = router;