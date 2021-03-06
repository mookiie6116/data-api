var express = require("express");
var router = express.Router();
var mssql = require('mssql')
var db = require("../models/connectMssql");

router.get("/today", async function (req, res) {
  let offset = parseInt(req.query.offset)
  let currentpage = parseInt(req.query.offset) + 1
  let userId = req.query.userId.trim()
  let sql = `exec sp_GetAgentSchedule N'${userId}'`
  let limit = 3
  let result = await mssql.query(sql)
  console.log('offset',limit * offset, limit * (offset + 1))
  return res.json({
    pagination: {
      limit: limit,
      previouspage: offset,
      nextpage: currentpage + 1,
      currentpage: currentpage,
      pagecount: Math.ceil(result.recordset.length / 3),
      totalcount: result.recordset.length,
    },
    items: result.recordset.slice(limit * offset, limit * (offset + 1)),
  })
})

router.get("/today2", function (req, res) {
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