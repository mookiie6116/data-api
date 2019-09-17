const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TabsSchema = new Schema(
  { 
    id:{
      type: String
    },
    activityLog:{
      type: Boolean
    },
    leadInfo:{
      type: Boolean
    },
    customerInformation:{
      type: Boolean
    },
    policyInformation:{
      type: Boolean
    },
    contactHandling:{
      type: Boolean
    },
    campaign:{
      type: Boolean
    },
    campaignAssign:{
      type: Boolean
    },
    case:{
      type: Boolean
    },
    customerProfile:{
      type: Boolean
    }
  }
);

let tabs = mongoose.model("tabs", TabsSchema);

module.exports = tabs;