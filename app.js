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
app.use('/api', require('./api.js'));

app.use('/user',require('./api/api_news'));
app.use('/schedule',require('./api/api_schedule'));
app.use('/note',require('./api/api_note'));
app.use('/activity-log',require('./api/api_activityLog'));
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