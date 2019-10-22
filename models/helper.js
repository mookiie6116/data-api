const moment = require('moment');
moment.locale('th');

module.exports = {
  TrueAndFalse : function (params) {
    if (params) {
      return true
    } else {
      return false
    }
  }
}