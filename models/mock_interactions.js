const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const interactionSchema = new Schema(
  { 
    interactionId:{
      type: String
    },
    customerId:{
      type: String
    },
    channelCode:{
      type: String
    },
    interactionDirectionCode:{
      type: String
    },
    contactId: {
      type : String
    }
  }
);

let interaction = mongoose.model("mock", interactionSchema);

module.exports = interaction;