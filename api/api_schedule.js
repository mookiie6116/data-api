var express = require("express");
var router = express.Router();
var db = require("../models/connectMssql");

router.get("/today", function (req, res) {
  let currentpage = parseInt(req.query.offset) + 1;
  let userId = req.query.userId.trim();
  let data = { "pagination": {}, "items": {} }
  let sql = ` SELECT 
                followup_template.name,
                customer_case.id as uuid,
                customer_case.ref_no,
                'cases' as ref_type,
                customer_case.followup_message,
                customer_case.followup_date
              FROM customer_case,followup_template
              WHERE cast(followup_date as date) = cast(getdate() as date)
                and followup_template.id = customer_case.followup_template_id
                `;
  sql += (userId || userId != '') ? `and assign_user_id = '${userId}' ` : `and assign_user_id is null `
  let promise = new Promise((resolve, reject) => {
    db.query(sql + ";", function (response) {
      data.pagination = {
        "limit": "3",
        "previouspage": ((currentpage - 1) > 0) ? currentpage - 1 : 1,
        "nextpage": (currentpage + 1),
        "currentpage": currentpage,
        "pagecount": (Math.ceil(response.length / 3)) ? Math.ceil(response.length / 3) : 0,
        "totalcount": (response.length > 0) ? response.length : 0
      }
      resolve(data)
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      if (json.pagination.totalcount > 0) {
        let offset = (json.pagination.currentpage == 1) ? 0 : ((json.pagination.currentpage - 1) * 3)
        sql += ` ORDER BY followup_date DESC
                     OFFSET ${offset} ROWS
                     FETCH NEXT 3 ROWS ONLY;`;
        db.query(sql, function (response) {
          data.items = response
          resolve(data)
        })
      } else {
        resolve(data)
      }
    })
  }).then(json => {
    res.status(200).json(json)
  })
})

router.get("/id", function (req, res) {
  let id = req.query.id;
  let sql = ` SELECT 
                *
              FROM customer_case
              WHERE customer_case.id = '${id}' `;
  db.query(sql, function (response) {
    res.status(200).json(response)
  })
})

module.exports = router;