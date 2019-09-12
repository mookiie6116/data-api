var express = require("express");
var router = express.Router();
var db = require("../models/connectMssql");
var data = require('./data/data.json')
var mongo = require('./../models/connectMongo')
var interactions = require('./../models/mock_interactions')

router.get("/customer", function (req, res) {
  let sql = ` SELECT TOP 10
                customer.id as customerId,
                customer.abbr as customerAbbr,
                customer.abbr_color as customerAbbrColor,
                CONCAT(customer.first_name,' ',customer.last_name) as customerName,
                null as customerClassify,
                null as customerImage,
                null as customerDescription,
                'case' as subMenu
              FROM customer `;
  db.query(sql, function (response) {
    let dataset = response.map(item => {
      return { ...item, ...data }
    })
    res.status(200).json(dataset)
  })
})

router.get("/customer-3", function (req, res) {
  let sql = ` SELECT TOP 10
                customer.id as customerId,
                customer.abbr as customerAbbr,
                customer.abbr_color as customerAbbrColor,
                CONCAT(customer.first_name,' ',customer.last_name) as customerName,
                null as customerClassify,
                null as customerImage,
                null as customerDescription,
                'case' as subMenu
              FROM customer `;
  db.query(sql, function (response) {
    let dataSet = response.map(item => {
      interactions.find({ customerId: item.customerId })
        .then(response => {
          console.log(response)
          return { ...item, ...response, ...data }
        })
    })
    Promise.all(promises).then(function (results) {
      console.log(results)
    })

  })
})


router.get("/customer/:id", function (req, res) {
  let id = req.params.id;
  let sql = ` SELECT TOP 10
                customer.id as customerId,
                customer.abbr as customerAbbr,
                customer.abbr_color as customerAbbrColor,
                CONCAT(customer.first_name,' ',customer.last_name) as customerName,
                null as customerClassify,
                null as customerImage,
                null as customerDescription,
                'case' as subMenu
              FROM customer
              WHERE customer.id = '${id}'`;
  db.query(sql, function (response) {
    interactions.find({ customerId: response[0].customerId }).then(dataInteractions => {
      let dataset = {
        ...response[0],
        ...data
      }
      dataset.interactions = dataInteractions
      res.status(200).json(dataset)
    })
  })
})

router.put("/customer-1", function (req, res) {
  console.log("put");
  let dataset = {
    "contactId": req.body.contactId,
    "channelCode": "EMAIL",
    "interactionDirectionCode": "IN"
  }
  data.contacts.push(dataset)
  let id = req.body.customerId;
  let sql = ` SELECT TOP 10
                customer.id as customerId,
                customer.abbr as customerAbbr,
                customer.abbr_color as customerAbbrColor,
                CONCAT(customer.first_name,' ',customer.last_name) as customerName,
                null as customerClassify,
                null as customerImage,
                null as customerDescription,
                'case' as subMenu
              FROM customer
              WHERE customer.id = '${id}'`;
  db.query(sql, function (response) {
    let dataset = response.map(item => {
      return { ...item, ...data }
    })
    res.status(200).json(dataset[0])
  })
})

router.put("/customer-2", function (req, res) {
  let dataset = {
    ...req.body,
    "channelCode": "EMAIL",
    "interactionDirectionCode": "IN"
  }
  res.status(200).json(dataset)
})

router.post("/customer", function (req, res) {
  let dataset = new interactions({ ...req.body })
  dataset.save(function (err) {
    dataset.contactId = dataset._id
    console.log(dataset);
    if (err) res.status(500).json('fail')
    res.status(200).json(dataset)
  })
})

module.exports = router;