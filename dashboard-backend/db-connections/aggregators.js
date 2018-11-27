const DB_NAME = "aggregators";
const SHH = require("../../../www-node-secrets.js");

// connect
const mongoose = require('mongoose');
mongoose.connect("mongodb://" + SHH.mongodb[DB_NAME].user + ":" + SHH.mongodb[DB_NAME].pwd + "@localhost/" + DB_NAME,{ useNewUrlParser: true }).then(function() {});
module.exports = exports = mongoose;