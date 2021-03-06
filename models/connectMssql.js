const moment = require('moment');
moment.locale('th');

var mssql = require('mssql')
const config = {
    user: 'sa',
    password: "P@ssw0rd",
    server: '172.18.60.3',
    database: 'ruamitr_tfa',
    options: {
        encrypt: true // Use this if you're on Windows Azure
    },
    pool: {
        requestTimeout: 300000,
        max: 300,
        idleTimeoutMillis: 300000
    }
}
module.exports = {
    connect: function () {
        mssql.connect(config, function (err) {
            console.log(moment().format('DD/MM/YYYY HH:mm:ss') + " - connected ");
            if (err) console.log(moment().format('DD/MM/YYYY HH:mm:ss') + " - Error Connect : " + err);
        })
    },
    query: function (sql, callback) {
        mssql.query(sql, function (err, result, fields) {
            if (err) {
                console.log(moment().format('DD/MM/YYYY HH:mm:ss') + " - Error Query : " + err);
                callback(err);
            }
            else {
                callback(result.recordsets[0])
            }
        });
    },
    disconnect: function () {
        mssql.close();
        console.log(moment().format('DD/MM/YYYY HH:mm:ss') + " - disconnected ");
    }

}