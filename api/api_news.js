var express = require("express");
var router = express.Router();
var db = require("../models/connectMssql");
var moment = require("moment")
const path = require('path');
const fs = require('fs-extra');
const formidable = require('formidable');
var base64Img = require('base64-img');
const bodyParser = require("body-parser");
const uuidv1 = require('uuid/v1');

moment.locale('th')

var urlencodedParser = bodyParser.urlencoded({
  extended: true,
  limit: '2147483648'
});

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
                AND a.status = 'approved'
                AND b.user_id = '${userId}'
                ;`;
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
                      AND a.status = 'approved'
                      AND c.user_id = '${userId}'
                    ORDER BY a.id
                    ;`;
          db.query(sql, function (response) {
            data.items = response
            resolve(data)
          })
        } else {
          res.status(200).json('data not found')
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
                                        CONCAT('http://172.18.60.2:9002/user/downloadImg/',news_attachment.name) as urlFile,
                                        news_attachment.is_thumbnail
                                       FROM news_attachment
                                       WHERE news_id ='${element.id}' 
                                        AND is_thumbnail = '1'
                                        AND is_deleted = '0'`;
              db.query(sql_news_attachment, function (response) {
                data.items[i].attachments = response.length ? response : []
                res(response)
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
                                        CONCAT('http://172.18.60.2:9002/user/downloadImg/',news_attachment.name) as urlFile,
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

  let sql = ` SELECT news.id,	news.subject,	news.content,	news.start_date, news.end_date, news.update_date,	news.update_by,
	              CONCAT(user_ruamitr.first_name,' ',user_ruamitr.last_name) as update_name
              FROM news
              LEFT JOIN user_ruamitr on news.update_by = user_ruamitr.user_id
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
router.get("/news/data/:id", function (req, res) {
  let newsId = req.params.id;
  let item
  let sql = `SELECT id as newsId,	subject,	content,	start_date,	end_date	 FROM news WHERE id = '${newsId}'`
  let promise = new Promise((resolve, reject) => {
    db.query(sql, function (response) {
      if (response.length > 0) {
        item = response[0]
        item.activePeriod = new Array(item.start_date, item.end_date)
        resolve(item)
      }
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql_news_attachment = `SELECT
          news_attachment.file_id as fileId,
          CONCAT('http://localhost:9002/user/downloadImg/',news_attachment.name) as image
        FROM news_attachment
        WHERE news_id ='${newsId}' 
          AND is_deleted = '0'
          AND is_thumbnail = '1'`;
      db.query(sql_news_attachment, function (response) {
        json.fileThumbNail = response[0]
        resolve(json)
      })
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql_news_attachment = `SELECT
          news_attachment.file_id as fileId,
          CONCAT('http://localhost:9002/user/downloadImg/',news_attachment.name) as url
        FROM news_attachment
        WHERE news_id ='${newsId}' 
          AND is_deleted = '0'
          AND is_thumbnail = '0'`;
      db.query(sql_news_attachment, function (response) {
        json.image = response
        resolve(json)
      })
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql_news_attachment = `SELECT user_id
                                 FROM news_recipient 
                                 WHERE news_id = '${newsId}'`;
      db.query(sql_news_attachment, function (response) {
        json.assignTo = response
        resolve(json)
      })
    })
  }).then(json => {
    res.status(200).json(json)
  })
})
router.post("/addContent", function (req, res) {
  let newsId = req.body.newsId
  let subject = req.body.subject
  let content = req.body.content
  let start_date = req.body.times[0]
  let end_date = req.body.times[1]
  let userId = req.body.userId
  let recipient = req.body.assignTo
  let fileId = req.body.thumbnail.fileId
  let thumbnail = req.body.thumbnail.image
  let attachments = req.body.images
  let status = req.body.status ? `'approve'` : null
  if (!newsId) {
    let promise = new Promise((resolve, reject) => {
      let sql = `INSERT INTO news (subject, content, start_date,end_date,create_by,update_by,status)
                  VALUES ('${subject}', '${content}', '${start_date}','${end_date}','${userId}','${userId}',${status});`
      db.query(sql, function (response) {
        resolve()
      })
    }).then((json) => {
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
    }).then((json) => {
      return new Promise((resolve, reject) => {
        for (let i = 0, p = Promise.resolve(); i <= attachments.length; i++) {
          p = p.then(_ => new Promise(res => {
            if (i < attachments.length) {
              const element = attachments[i];
              let fileId = uuidv1()
              base64ToImage(element.url, function (name) {
                let sql_attachment = `INSERT INTO news_attachment (file_id, name,create_by,news_id,is_thumbnail)
                                        VALUES ('${fileId}','${name}','${userId}','${json}','0');`
                db.query(sql_attachment, function (response) {
                  res(response)
                })
              })
            }
            else {
              resolve(json)
            }
          }));
        }
      })
    }).then((json) => {
      return new Promise((resolve, reject) => {
        let fileId = uuidv1()
        base64ToImage(thumbnail, function (name) {
          let sql_attachment = `INSERT INTO news_attachment (file_id, name,create_by,news_id,is_thumbnail)
          VALUES ('${fileId}','${name}','${userId}','${json}','1');`
          db.query(sql_attachment, function (response) {
            resolve(json)
          })
        })
      })
    }).then((json) => {
      return new Promise((resolve, reject) => {
        for (let i = 0, p = Promise.resolve(); i <= recipient.length; i++) {
          p = p.then(_ => new Promise(res => {
            if (i < recipient.length) {
              const element = recipient[i];
              let sql_recipient = `INSERT INTO news_recipient (news_id, user_id)
                                        VALUES ('${json}','${element}');`
              db.query(sql_recipient, function (response) {
                res(response)
              })
            }
            else {
              resolve(json)
            }
          }));
        }
      })
    }).then((json) => {
      res.status(200).json({ "news_id": json })
    })
  } else {
    let date = moment().format('YYYY-MM-DD HH:mm:ss');
    let promise = new Promise((resolve, reject) => {
      let sqld = `DELETE FROM news_recipient WHERE news_recipient.news_id = ${newsId};`
      db.query(sqld, function (response) {
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
        let array_attachments = []
        attachments.map(items=>{
          array_attachments.push(`'${items.fileId}'`)
        })
        let sql_attachmentsdelete = `UPDATE news_attachment
        SET is_deleted = '1' WHERE news_id = '${newsId}' AND is_thumbnail = '0' AND is_deleted = '0' AND file_id not in (${array_attachments})`
        db.query(sql_attachmentsdelete, function (response) {
          for (let i = 0, p = Promise.resolve(); i <= attachments.length; i++) {
            p = p.then(_ => new Promise(res => {
              if (i < attachments.length) {
                const element = attachments[i];
                  if (!element.fileId) {
                    let fileId = uuidv1()
                    base64ToImage(element.url, function (name) {
                      let sql_attachment = `INSERT INTO news_attachment (file_id, name,create_by,news_id,is_thumbnail)
                                            VALUES ('${fileId}','${name}','${userId}','${json}','0');`
                      db.query(sql_attachment, function (response) {
                        res()
                      })
                    })
                  } else {
                      res()
                  }
              }
              else {
                resolve(json)
              }
            }));
          }
        })
      })
    }).then(json => {
      return new Promise((resolve, reject) => {
        if (!fileId) {
          let sql_deleted = `UPDATE news_attachment SET is_deleted = '1'
                             WHERE news_id = '${json}' 
                             AND is_thumbnail = '1' 
                             AND is_deleted = '0';`
          db.query(sql_deleted, function (response) {
            let fileId = uuidv1()
            base64ToImage(thumbnail, function (name) {
              let sql_attachment = `INSERT INTO news_attachment (file_id, name,create_by,news_id,is_thumbnail)
                                  VALUES ('${fileId}','${name}','${userId}','${json}','1');`
              db.query(sql_attachment, function (response) {
                resolve(json)
              })
            })
          })
        } else {
          resolve(json)
        }
      })
    }).then(json => {
      return new Promise((resolve, reject) => {
        for (let i = 0, p = Promise.resolve(); i <= recipient.length; i++) {
          p = p.then(_ => new Promise(res => {
            if (i < recipient.length) {
              const element = recipient[i];
              let sql_recipient = `INSERT INTO news_recipient (news_id, user_id) VALUES ('${json}','${element}');`;
              db.query(sql_recipient, function (response) {
                res()
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
  }
})
router.post("/addImage", function (req, res) {
  let file_id = req.body.fileId
  let name = req.body.name
  let size = req.body.size
  let content_type = req.body.content_type
  let create_by = req.body.userId
  let news_id = req.body.newsId
  let is_thumbnail = req.body.thumbnail
  let sql = `INSERT INTO news_attachment (file_id, name, size,content_type,create_by,news_id,is_thumbnail)
              VALUES ('${file_id}','${name}','${size}','${content_type}','${create_by}','${news_id}','${is_thumbnail}');`
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
  let sql = `UPDATE news_attachment
              SET is_deleted = '1'
              WHERE news_id = '${newsId} 
                AND file_id = '${fileId}';`
  db.query(sql, function (response) {
    res.status(200).json('OK')
  })
})
router.post("/upload", function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    console.log(files);
    console.log(fields);
    var file = files.file
    // upload(file,function (data) {
    //   console.log(data);
    // })
  })
})
router.get("/downloadImg/:filename", function (req, res, next) {
  let filename = req.params.filename
  res.sendFile(`${path.resolve("uploads")}/${filename}`);
})

function upload(file, callback) {
  var id = `${new Date().getTime()}_${Math.floor(Math.random() * (10000 - 1000)) + 1000}`
  var oldpath = file.path;
  var newfile = `${id}.${file.name.split(".")[1]}`;
  var newpath = path.resolve("uploads") + "/" + newfile;
  fs.move(oldpath, newpath, function (err) {
    if (err) { callback() }
    else { callback(newfile) }
  });
}
function ImageToBase64(file, callback) {
  var oldpath = file.path;
  base64Img.base64(oldpath, function (err, data) {
    if (err) { callback() }
    else { callback(data) }
  });
}
function base64ToImage(file, callback) {
  var id = `${new Date().getTime()}_${Math.floor(Math.random() * (10000 - 1000)) + 1000}`
  return new Promise((resolve, reject) => {
    base64Img.img(file, path.resolve("uploads"), id, function (err, filepath) {
      if (err) { reject() }
      else {
        let filename = filepath.split(path.resolve("uploads") + "\\")
        resolve(filename[1])
      }
    });
  }).then(data => {
    callback(data)
  }).catch(err => {
    callback()
  })
}



module.exports = router;