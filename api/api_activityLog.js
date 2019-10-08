var express = require("express");
var router = express.Router();
var db = require("../models/connectMssql");

router.get("/:id", function (req, res) {
  let customerId = req.params.id
  let sql = `exec sp_GetInteractionActivityLog '${customerId}'`
  let promise = new Promise((resolve, reject) => {
    db.query(sql, function (response) {
      resolve(response)
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let array = []
      for (let i = 0, p = Promise.resolve(); i <= json.length; i++) {
        p = p.then(_ => new Promise(res => {
          if (i < json.length) {
            const element = json[i];
            let item_detail = {
              "interactionDate": element.interaction_date,
              "channelCode": element.channel_code,
              "interactionDirection": element.interaction_direction,
              "hasAttachment": TrueAndFalse(element.has_attachment),
              "subject": element.subject,
              "contactResult": element.contact_result_trace,
              "contactName": element.contact_name.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'),
              "interactionUserName": element.user_name,
              "interactionRelatedActivity": {
                "module": element.module,
                "priority": element.priority,
                "refNo": element.ref_no,
                "subject": element.title,
                "id": element.id,
                "activityDueDate": element.sla_accept_date,
                "latestActivityType": element.activity_name,
                "description": element.description,
                "updateDate": element.update_date,
                "updateBy": element.update_by,
                "tag": [
                  {
                    "name": element.name,
                    "fontColor": `#${element.font_color}`,
                    "backColor": `#${element.back_color}`,
                    "description": element.tag_description
                  }
                ],
                "overSlaAccept": TrueAndFalse(element.over_sla_accept),
                "overSlaResponse": TrueAndFalse(element.over_sla_response),
                "overSlaClose": TrueAndFalse(element.over_sla_closed),
                "allowFollow": TrueAndFalse(element.allow_follow)
              }
            }
            let sql_detail = `exec sp_GetInteractionPropActivityLog '${element.interaction_id}'`
            db.query(sql_detail, function (response) {
              item_detail.itemList = response.length ? response : []
              array[i] = item_detail;
              res(response)
            })
          }
          else {
            resolve(array)
          }
        }));
      }
    })
  })
    .then(json => {
      let dataSet = { "items": json }
      res.status(200).json(dataSet)
    })
})

function TrueAndFalse(params) {
  if (params) {
    return true
  }else{
    return false
  }
}
module.exports = router;