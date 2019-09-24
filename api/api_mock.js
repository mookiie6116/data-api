var express = require("express");
var router = express.Router();
var db = require("../models/connectMssql");
var data = require('./data/data.json')
var mongo = require('./../models/connectMongo')
var interactions = require('./../models/mock_interactions')
var handelTabs = require('./../models/mock_handelTabs')
const uuidv1 = require('uuid/v1');

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
  let sql = ` SELECT
                customer.id as customerId,
                customer.abbr as customerAbbr,
                customer.abbr_color as customerAbbrColor,
                CONCAT(customer.first_name,' ',customer.last_name) as customerName,
                null as customerClassify,
                null as customerImage,
                null as customerDescription,
                'case' as subMenu
              FROM customer
              LEFT JOIN interaction ON customer.id = interaction.customer_id
							where interaction.id = '${id}'`;
  db.query(sql, function (response) {
    if (0 < response.length) {
      interactions.find({ customerId: response[0].customerId }).then(dataInteractions => {
        let dataset = {
          ...response[0],
          ...data
        }
        dataset.interactions = dataInteractions
        res.status(200).json(dataset)
      })
    } else {
      res.status(404).json("user not found")
    }
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
  let dataset = new interactions({ interactionId: uuidv1(), ...req.body })
  dataset.save(function (err) {
    dataset.contactId = dataset.interactionId
    if (err) res.status(500).json('fail')
    res.status(200).json(dataset)
  })
})

router.delete("/customer", function (req, res) {
  interactions.deleteMany({}).then(() => {
    res.status(200).json("OK")
  });
})

router.delete("/customer/:id", function (req, res) {
  let id = req.params.id;
  if (id) {
    interactions.deleteOne({ "interactionId": id }).then(() => {
      res.status(200).json("OK")
    });
  } else {
    res.status(404).json("id undefined")
  }
})

router.post("/transfer", function (req, res) {
  let id_transfer = req.body.customerId
  let interactionId = req.body.interactionId
  interactions.findOneAndUpdate({ interactionId: interactionId },{customerId: id_transfer})
  .then(data => {
    return res.status(200).json("OK")
  }).catch(err => {
    return res.status(500).json("update fail")
  })
})

router.get("/tabs", function (req, res) {
  handelTabs.find({}, {
    id: 1,
    activityLog: 1,
    leadInfo: 1,
    customerInformation: 1,
    policyInformation: 1,
    contactHandling: 1,
    campaign: 1,
    campaignAssign: 1,
    case: 1,
    customerProfile: 1
  }).then(dataHandelTabs => {
    res.status(200).json(dataHandelTabs)
  })
})

router.get("/tabs/:id", function (req, res) {
  handelTabs.find({ id: req.params.id }, {
    id: 1,
    activityLog: 1,
    leadInfo: 1,
    customerInformation: 1,
    policyInformation: 1,
    contactHandling: 1,
    campaign: 1,
    campaignAssign: 1,
    case: 1,
    customerProfile: 1
  }).then(dataHandelTabs => {
    res.status(200).json(dataHandelTabs[0])
  })
})

router.post("/tabs", function (req, res) {
  let { id } = req.body;
  handelTabs.find({ id: id }).then(dataHandelTabs => {
    if (dataHandelTabs.length) {
      // edit
      handelTabs.findOneAndUpdate({ id: id }, req.body)
        .then(data => {
          return res.status(200).json(req.body)
        }).catch(err => {
          return res.status(500).json("update fail")
        })

    } else {
      // add
      let dataset = new handelTabs({ ...req.body })
      dataset.save(function (err) {
        if (err) res.status(500).json('insert fail')
        res.status(200).json(dataset)
      })
    }
  })
})

module.exports = router;