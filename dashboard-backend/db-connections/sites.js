const DB_NAME = "sites";
const SHH = require("../../../www-node-secrets.js");

const mongoose = require('mongoose');
// connect
mongoose.connect("mongodb://" + SHH.mongodb[DB_NAME].user + ":" + SHH.mongodb[DB_NAME].pwd + "@localhost/" + DB_NAME,{ useNewUrlParser: true }).then(function() {});
module.exports = exports = mongoose;