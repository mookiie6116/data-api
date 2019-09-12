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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', require('./api.js'));

app.use('/user',require('./api/api_news'));
app.use('/schedule',require('./api/api_schedule'));
app.use('/note',require('./api/api_note'));
app.use('/mock',require('./api/api_mock'));

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