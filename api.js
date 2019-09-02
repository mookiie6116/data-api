const express = require('express');
const router = express.Router();
const moment = require('moment');
moment.locale('th');

router.use(require('./api/api_news'));
router.use(require('./api/api_schedule'));




module.exports = router;