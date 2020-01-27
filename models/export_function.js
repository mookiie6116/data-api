const fs = require('fs');
const XLSX = require("xlsx");
const axios = require('axios');
const FormData = require('form-data');
const archiver = require('archiver');
const { spawn } = require("child_process");
const extract = require('extract-zip')
const rimraf = require('rimraf')
const moment = require('moment');
const path = require('path');
const db = require("./connectMssql");

module.exports = {
  excel: function (sql, filename, pathFile) {
    var wb = XLSX.utils.book_new();
    wb.Props = {
      Title: filename,
      Author: "Ruammit",
      CreatedDate: new Date()
    };
    wb.SheetNames.push(filename);
    return new Promise(function (resolve, reject) {
      db.query(sql, function (response) {
          var ws = XLSX.utils.json_to_sheet(response);
          wb.Sheets[filename] = ws;
          var newpath = path.join(pathFile,filename);
          XLSX.writeFile(wb, newpath, { type: "application/xls" });
          resolve({ status: true, msg: response, count: response.length })
      })
    })
  },
  csv: function (sql, filename, pathFile) {
    var wb = XLSX.utils.book_new();
    wb.Props = {
      Title: filename,
      Author: "Ruammit",
      CreatedDate: new Date()
    };
    wb.SheetNames.push(filename);
    db.query(sql, function (response) {
        var ws = XLSX.utils.json_to_sheet(response);
        wb.Sheets[filename] = ws;
        var newpath = pathFile + filename;
        var stream = XLSX.stream.to_csv(ws);
        stream.pipe(fs.createWriteStream(`${newpath}`));
        return { status: true, msg: response, count: response.length }
    })
  },
  txt: function (sql, filename, pathFile,delimiter) {
    var wb = XLSX.utils.book_new();
    wb.Props = {
      Title: filename,
      Author: "Ruammit",
      CreatedDate: new Date()
    };
    wb.SheetNames.push(filename);
    return new Promise(function (resolve, reject) {
      db.query(sql, function (response) {
          var ws = XLSX.utils.json_to_sheet(response);
          wb.Sheets[filename] = ws;
          var newpath = path.join(pathFile,filename);
          var stream = XLSX.stream.to_csv(ws,{FS:delimiter});
          stream.pipe(fs.createWriteStream(`${newpath}`));
          resolve ({ status: true, msg: response, count: response.length })
      })
    })
  },
  zip: function (filename, pathFile, directory) {
    var newpath = path.join(pathFile,filename);
    var output = fs.createWriteStream(`${newpath}`);
    return new Promise(function (resolve, reject) {
      var archive = archiver('zip', {
        gzip: true,
        zlib: { level: 9 } // Sets the compression level.
      });
      archive.directory(directory, false);
      archive.on('error', function (err) {
        throw err;
      });
      archive.pipe(output);
      archive.finalize()
        .then(function (params) {
          resolve({ status: true, msg: '' })
        })
        .catch(function (params) {
          reject({ status: false, msg: '' })
        })
    })
  },
  uploadFile: function (api, key, pathFile) {
    return new Promise(function (resolve, reject) {
      let file = fs.createReadStream(pathFile)
      let form = new FormData();
      form.append(key, file);
      axios
        .create({
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        })
        .post(api, form)
        .then(response => {
          let size = fs.statSync(pathFile).size
          response.data.size = size
          resolve({ status: true, msg: JSON.stringify(response.data, null, 4), data: response.data })
        }).catch(error => {
          reject({ status: false, msg: JSON.stringify(error.message, null, 4), data: error.response })
        });
    });
  },
  word2pdf: function (data, isfiles, pathFile) {
    return new Promise(function (resolve, reject) {
      var pdfPath= path.join(pathFile, 'pdf')
      if (!fs.existsSync(pdfPath)) {
        fs.mkdirSync(pdfPath, 777);
      }
      const readDir = function () {
        fs.readdir(pdfPath, function (err, files) {
          if (isfiles.length == files.length) {
            console.log('convert pdf complete !')
            resolve(pdfPath)
          }
        })
      }
      let arr = []
      const convertFile = function () {
        for (let i = 0; i < isfiles.length; i++) {
          const file = isfiles[i];
          let fileName = `${file.path.split("/")[file.path.split("/").length-1].split('.')[0]}.pdf`
            arr.push(new Promise(function (resolveMain, rejectMain) {
              let docFile = path.join(pathFile, file.path)
              let pdfFile = path.join(pdfPath, fileName)
              spawn(`${path.join(path.resolve("lib"), 'OfficePDF.exe')}`, [`\"${docFile}\" \"${pdfFile}\"`], { shell: true })
                .on('exit', function (message) {
                  resolveMain()
                })
                .on('error', function (err) {
                  console.log(err);
                })
            }))
        }
      }
      convertFile()
      Promise.all(arr).then((res) => {
        setTimeout(() => {
          readDir()
        }, 1500);
      })
      // for (let i = 0; i < files.length; i++) {
      //   const file = files[i];
      //   let filename = `${data[i].ref_no}__LONB_Application.pdf`
      //   if (i == 0) { output += file.path.split("/")[1] }
      //   spawn(".\\lib\\OfficePDF.exe", [`${file.path} ${pathFile}${pdfPath}`], { shell: true })
      //     .on('exit', function (message) {
      //       console.log(`${path.resolve("lib")}\\OfficePDF.exe`, [`\"${file.path} ${pathFile}\" \"${pdfPath}\"`], { shell: true });
      //     })
      // }
    })
  },
  extract: function (pathZip, pathFile) {
    return new Promise(function (resolve, reject) {
      extract(pathZip, { dir: pathFile }, function (err) {
        if (err) {
          resolve({ status: false, msg: '' })
        } else {
          reject({ status: true, msg: '' })
        }
      })
    })
  },
  downloadVoice: function (voiceResult, pathFile) {
    return new Promise(function (resolve, reject) {
      var count = voiceResult.length
      var arr = []
      var voicePath= path.join(pathFile, 'voice')
      if (!fs.existsSync(voicePath)) {
        fs.mkdirSync(voicePath, 777);
      }
      const readDir = function () {
        fs.readdir(`${voicePath}`, function (err, files) {
          if (count == files.length) {
            resolve(voicePath)
          }
        })
      }
      const wirteFile = function (fileName, resVoice) {
        return new Promise(function (res, rej) {
          var voiceFile= path.join(voicePath, fileName)
          resVoice.data.pipe(fs.createWriteStream(`${voiceFile}`))
            .on('finish', function () {
              res()
            })
        })
      }
      const downLoadFile = function () {
        voiceResult.map(function (item) {
          arr.push(new Promise(function (resolveMain, rejectMain) {
            axios.get(item.downloadUrl, { responseType: 'stream' })
              .then(function (response) {
                return wirteFile(item.fileName, response)
              })
              .then(function (params) {
                resolveMain()
              })
          }))
        })
      }
      downLoadFile()
      Promise.all(arr).then((res) => {
        setTimeout(() => {
          readDir()
        }, 1500);

      })
    })
  },
  printLog: function (msg, item) {
    if (!item) { item = '' }
    console.log({ msg, item, time: moment().format() });
  },
  removeFile: function (directory,folder) {
    // let pathFind = path.join(directory, folder)
    // let listDir = fs.readdirSync(directory)
    console.log("delete",directory);
    rimraf.sync(directory)
    // listDir.forEach(dir => {
      // rimraf.sync(path.join(findDir, dir))
    // });
  },
  diffDate:function (params) {
    let date = new Date()
    var diff =(date.getTime() - params.getTime()) / 1000;
    return diff
    return Math.abs(Math.round(diff));
  }
}