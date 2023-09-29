var express = require('express');
const mqtt = require("mqtt");
const fs = require("fs");
const path = require("path");
var router = express.Router();

router.use(express.static('a3_frontend/dist/a3_frontend/'))

router.get('/', function (req, res) {
  res.sendFile(path.resolve('a3_frontend/dist/a3_frontend/index.html'))
})

module.exports = router;
