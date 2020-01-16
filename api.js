const express = require('express');
const router = express.Router();
const moment = require('moment');
moment.locale('th');

router.use('/user',require('./api/api_news'));
router.use('/schedule',require('./api/api_schedule'));
router.use('/note',require('./api/api_note'));
router.use('/activity-log',require('./api/api_activityLog'));
router.use("/export" ,require('./api/export'));

module.exports = router;