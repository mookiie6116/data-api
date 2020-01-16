const express = require("express");
const path = require('path')
const cors = require('cors')
const app = express();
const bodyParser = require("body-parser");
var db = require("./models/connectMssql");
//require the http module
const http = require("http").Server(app);
const port = process.env.PORT || 9002;
db.connect();
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1', require('./api.js'));

// app.use('/mock',require('./api/api_mock'));

app.use('/connect',function (req,res) {
  db.connect()
  res.status(200).send('connect')
})
app.use('/disconnect',function (req,res) {
  db.disconnect()
  res.status(200).send('disconnect')
})
app.get('/',(req,res)=>{
  res.send('hello')
})
http.listen(port, () => {
  console.log("Running on Port: " + port);
});