const express = require("express");
const router = express.Router();
const fs = require('fs');
const XLSX = require("xlsx");
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const moment = require('moment');
const decompress = require('decompress');
// const async = require("async");
const ef = require('./../models/export_function');
const db = require("../models/connectMssql");
const md5 = require('md5')
let api_upload = 'http://172.18.60.2:8009/api/v1/utility/file/upload'
let api_voice = `http://172.18.34.101:9021/api/voice/upload`
let api_mailMerge = `http://172.18.60.2:8203/api/v1/mailMerge`

router.get("/excel", function (req, res, next) {
  var wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Ruammit YesFile",
    Subject: "Ruammit YesFile",
    Author: "Ruammit",
    CreatedDate: new Date()
  };
  wb.SheetNames.push("AppFile");
  let sql = `exec sp_genAppFile`
  db.query(sql, function (response) {
    if (response.length) {
      var ws = XLSX.utils.json_to_sheet(response);
      wb.Sheets["YesFile"] = ws;
      var xlsx_name = 'YesFile.xls'
      var newpath = path.resolve("Exports") + "/" + xlsx_name;
      XLSX.writeFile(wb, newpath, { type: "application/xls" });
      let form = new FormData();
      form.append('file', fs.createReadStream(newpath));
      axios
        .create({
          headers: form.getHeaders()
        })
        .post(api_upload, form)
        .then(response => {
          let size = fs.statSync(newpath).size
          console.log(response.data);
          console.log(size);
          res.status(200).json(response.data)
        }).catch(error => {
          if (error.response) {
            console.log(error.response);
          }
          console.log(error.message);
        });
    }
  })
})

router.get("/csv", function (req, res, next) {
  var wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Ruammit YesFile",
    Subject: "Ruammit YesFile",
    Author: "Ruammit",
    CreatedDate: new Date()
  };
  wb.SheetNames.push("YesFile");
  let sql = `exec sp_genYesFile`
  db.query(sql, function (response) {
    if (response.length) {
      var ws = XLSX.utils.json_to_sheet(response);
      wb.Sheets["YesFile"] = ws;
      var csv_name = "YesFile.csv";
      var newpath = path.resolve("Exports") + "/" + csv_name;
      var stream = XLSX.stream.to_csv(ws);
      stream.pipe(fs.createWriteStream(`${newpath}`));
      let file = fs.createReadStream(newpath)
      let form = new FormData();
      form.append('file', file);
      axios
        .create({
          headers: form.getHeaders()
        })
        .post(api_upload, form)
        .then(response => {
          let size = fs.statSync(newpath).size
          console.log(response.data);
          console.log(size);
          res.status(200).json(response.data)
        }).catch(error => {
          if (error.response) {
            console.log(error.response);
          }
          console.log(error.message);
        });
    }
  })
})

router.get("/zip", function (req, res, next) {
  var pathFile = path.resolve("Exports") + '/' + 'example.zip';
  var output = fs.createWriteStream(`${pathFile}`);
  var archive = archiver('zip', {
    gzip: true,
    zlib: { level: 9 } // Sets the compression level.
  });

  archive.on('error', function (err) {
    throw err;
  });
  archive.pipe(output);
  archive.directory('./Voices');
  archive.finalize()
    .then(function (params) {
      let size = fs.statSync(pathFile).size
      let file = fs.createReadStream(pathFile)
      let form = new FormData();
      form.append('file', file);
      axios
        .create({
          headers: form.getHeaders()
        })
        .post(api_upload, form)
        .then(response => {
          console.log(response.data);
          console.log(size);
          res.status(200).json(response.data)
        }).catch(error => {
          if (error.response) {
            console.log(error.response);
          }
          console.log(error.message);
        });
    });
})
router.get("/aloha", function (req, res, next) {
  // [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (params) {
  //   setTimeout(function () {
  //     console.log(params)
  //   }, 1000)
  // })

  // for use with Node-style callbacks...
  var async = require("async");

  var obj = { dev: "/dev.json", test: "/test.json", prod: "/prod.json" };
  // var configs = {};
  async.forEachOf(obj, function (value, key, callback) {
    setTimeout(function () {
      console.log(key)
      callback()
    }, 1000)
  }, err => {
    if (err) console.error(err.message);
    // configs is now a map of JSON data
    // doSomethingWith(configs);
    console.log("aloha")
    res.json({ message: "aloha" })
  });
})
router.get("/download", function (req, res, next) {
  let folderName = `${moment().format('YYYYMMDD')}-TFA_LONB_VOICE_File_200114`
  let sql = `exec [ruamitr_marketing_tfa]..sp_vwVoice '{
    "fromDate":"2019-12-01 00:00:00"
    ,"toDate":"2020-12-01 23:59:59"
    ,"productId":42
    ,"paymentMethodId":1
    }'`
  let data = []
  db.query(sql, function (response) {
    if (response.length) {
      response.map(function (item) {
        let fileName = `${item.Proposal_No}_LOPOS_Voice_File_${item.track_no}.mp3`
        let obj = {
          folderName,
          trackId: item.track_no,
          fileName
        }
        data.push(obj)
      })
    }
    res.status(200).json({ data, count: response.length })
  })
})

router.get('/generate/YesFile', function name(req, res, next) {
  let pathFolder = md5(Date.now())
  let startTime = new Date()
  let aloha = 0
  let task_id
  let sql = `exec sp_genYesFile`
  db.query(sql, function (response) {
    if (Array.isArray(response)) {
      ef.printLog('Start-Exec', response)
      response.map(function (item) {
        task_id = response[0].export_file_task_id
        var arr = []
        ef.printLog('Start-Loop', item)
        var pathFile = `${path.resolve("Exports")}`
        if ('Yes File' == item.file_type) {
          pathFile = path.join(pathFile, 'YesFile', pathFolder)
          if (!fs.existsSync(pathFile)) {
            fs.mkdirSync(pathFile, 777);
          }
          ef.printLog('Start-YesFile', item.str_query)
          arr.push(ef.excel(item.str_query, item.name, pathFile))
          Promise.all(arr).then(function (responsePromise) {
            ef.printLog('Start-Upload', path.join(pathFile, item.name))
            ef.uploadFile(api_upload, 'file', path.join(pathFile, item.name))
              .then(resUpload => {
                if (resUpload.status) {
                  ef.printLog('Success-Upload', resUpload.data)
                  let data = resUpload.data
                  let sql = `update export_file_list
                              set size = '${data.size}',
                                  file_id = '${data.id}',
                                  content_type = '${data.type}'
                              where id = '${item.id}'`
                  ef.printLog('Start-Update', sql)
                  db.query(sql, function (err, responseUpdate) {
                    if (err) {
                      ef.printLog('fail-Update', sql)
                    }
                    else {
                      ef.removeFile(`${pathFile}`)
                      ef.printLog('Success-Update', sql)
                      aloha += 1
                    }
                  })
                }
                else {
                  ef.printLog('fail-Upload', resUpload.data)
                }
              })
          })
        } else if ('App File' == item.file_type) {
          pathFile = path.join(pathFile, 'AppFile', pathFolder)
          if (!fs.existsSync(pathFile)) {
            fs.mkdirSync(pathFile, 777);
          }
          ef.printLog('Start-AppFile', item.str_query)
          db.query(item.str_query, function (resApp) {
            ef.printLog('Start-mailMerge', resApp.length)
            axios({
              method: 'post',
              url: api_mailMerge,
              data: resApp,
              responseType: 'stream'
            })
              .then(function (resAppDoc) {
                ef.printLog('Success-mailMerge', resAppDoc.length)
                resAppDoc.data.pipe(fs.createWriteStream(path.join(pathFile, item.name))).on('finish', function () {
                  ef.printLog('Start-decompress', '')
                  decompress(path.join(pathFile, item.name), `${pathFile}`).then(files => {
                    ef.printLog('Success-decompress', files.length)
                    ef.word2pdf(resApp, files, pathFile).then(output => {
                      ef.printLog('Success-word2pdf', '')
                      arr.push(ef.zip(`${item.name}`, `${pathFile}\\`, output))
                      Promise.all(arr).then(function (responsePromise) {
                        ef.printLog('Start-Upload', path.join(pathFile, item.name))
                        ef.uploadFile(api_upload, 'file', path.join(pathFile, item.name))
                          .then(resUpload => {
                            if (resUpload.status) {
                              ef.printLog('Success-Upload', resUpload.data)
                              let data = resUpload.data
                              let sql = `update export_file_list
                                              set size = '${data.size}',
                                                  file_id = '${data.id}',
                                                  content_type = '${data.type}'
                                              where id = '${item.id}'`
                              ef.printLog('Start-Update', sql)
                              db.query(sql, function (err, responseUpdate) {
                                if (err) {
                                  ef.printLog('fail-Update', sql)
                                }
                                else {
                                  ef.removeFile(`${pathFile}`)
                                  ef.printLog('Success-Update', sql)
                                  aloha += 1
                                }
                              })
                            }
                            else {
                              ef.printLog('fail-Upload', resUpload.data)
                            }
                          })
                      })
                    })
                  });
                })
              }).catch(function (err) {
                res.status(200).json(err)
              });
          })
        } else if ('Voice File' == item.file_type) {
          pathFile = path.join(pathFile, 'VoiceFile', pathFolder)
          if (!fs.existsSync(pathFile)) {
            fs.mkdirSync(pathFile, 777);
          }
          ef.printLog('Start-VoiceFile', item.str_query)
          let folderName = `${moment().format('YYYYMMDD')}-${item.name.split(".")[0]}`
          let data = []
          db.query(item.str_query, function (responseVoice) {
            responseVoice.map(function (itemVoice) {
              // let fileName = `${itemVoice.Proposal_No}_LOPOS_Voice_File_${itemVoice.track_id}`
              let fileName = `${itemVoice.file_name}`
              let obj = {
                folderName,
                trackId: itemVoice.track_id,
                fileName
              }
              data.push(obj)
            })
            axios
              .create({ headers: { 'Content-Type': 'application/json' } })
              .post(api_voice, data)
              .then(function (responseVoiceFile) {
                ef.downloadVoice(responseVoiceFile.data.voiceResult, pathFile)
                  .then(function (path) {
                    ef.printLog('Success-VoiceFile', `${path}`)
                    arr.push(ef.zip(`${item.name}`, `${pathFile}`, `${path}`))
                    Promise.all(arr).then(function (responsePromise) {
                      ef.printLog('Start-Upload', `${pathFile}\\${item.name}`)
                      ef.uploadFile(api_upload, 'file', `${pathFile}\\${item.name}`)
                        .then(resUpload => {
                          if (resUpload.status) {
                            ef.printLog('Success-Upload', resUpload.data)
                            let data = resUpload.data
                            let sql = `update export_file_list
                              set size = '${data.size}',
                                  file_id = '${data.id}',
                                  content_type = '${data.type}'
                              where id = '${item.id}'`
                            ef.printLog('Start-Update', sql)
                            db.query(sql, function (err, responseUpdate) {
                              if (err) {
                                ef.printLog('fail-Update', sql)
                              }
                              else {
                                ef.removeFile(`${pathFile}`)
                                ef.printLog('Success-Update', sql)
                                aloha += 1
                              }
                            })
                          }
                          else {
                            ef.printLog('fail-Upload', resUpload.data)
                          }
                        })
                        .catch(function (upload) {
                          res.status(200).json({ upload })
                        })
                    })
                      .catch(function (all) {
                        res.status(200).json({ all })
                      })
                  })
                  .catch(function (params) {
                    res.status(200).json({ params })
                  })
              }).catch(function (err) {
                res.status(200).json({ err })
              })
          })
        } else if ('NCB File' == item.file_type) {
          pathFile = path.join(pathFile, 'NCBFile', pathFolder)
          if (!fs.existsSync(pathFile)) {
            fs.mkdirSync(pathFile, 777);
          }
          ef.printLog('Start-NCBFile', item.str_query)
          arr.push(ef.txt(item.str_query, item.name, pathFile,item.output_column_delimeters))
          Promise.all(arr).then(function (responsePromise) {
            ef.printLog('Start-Upload', path.join(pathFile, item.name))
            ef.uploadFile(api_upload, 'file', path.join(pathFile, item.name))
              .then(resUpload => {
                if (resUpload.status) {
                  ef.printLog('Success-Upload', resUpload.data)
                  let data = resUpload.data
                  let sql = `update export_file_list
                              set size = '${data.size}',
                                  file_id = '${data.id}',
                                  content_type = '${data.type}'
                              where id = '${item.id}'`
                  ef.printLog('Start-Update', sql)
                  db.query(sql, function (err, responseUpdate) {
                    if (err) {
                      ef.printLog('fail-Update', sql)
                    }
                    else {
                      // ef.removeFile(`${pathFile}`)
                      ef.printLog('Success-Update', sql)
                      aloha += 1
                    }
                  })
                }
                else {
                  ef.printLog('fail-Upload', resUpload.data)
                }
              }).catch(errUpload=>{
                console.log('errUpload',errUpload);
              })
          })
        }
      })
      let Interval = setInterval(function () {
        if (response.length === aloha) {
          console.log("Complete!")
          clearInterval(Interval)
          if (aloha > 0) {
            let sql_last = `update export_file_task set status = 'completed', end_process_date = getdate() where id = ${task_id}`
            db.query(sql_last,function (err, responseLast) {
              if (err) {
                ef.printLog('fail-LastUpdate', sql)
              }else{
                console.log({ msg: 'OK', startTime: moment(startTime).format(), endTime: moment().format(), timeCount: ef.diffDate(startTime) + ' sec' })
                res.status(200).json({ msg: 'OK', startTime: moment(startTime).format(), endTime: moment().format(), timeCount: ef.diffDate(startTime) + ' sec' })
                return
              }
           })
          }else{
            console.log({ msg: 'Data not found', startTime: moment(startTime).format(), endTime: moment().format(), timeCount: ef.diffDate(startTime) + ' sec' })
            res.status(200).json({ msg: 'Data not found', startTime: moment(startTime).format(), endTime: moment().format(), timeCount: ef.diffDate(startTime) + ' sec' })
            return
          }
        }
      }, 100);
    } else {
      console.log({ msg: 'Not Found Data', startTime: moment(startTime).format(), endTime: moment().format(), timeCount: ef.diffDate(startTime) + ' sec' })
      res.status(200).json({ msg: 'Not Found Data', startTime: moment(startTime).format(), endTime: moment().format(), timeCount: ef.diffDate(startTime) + ' sec' })
      return
    }
  })
})

module.exports = router;