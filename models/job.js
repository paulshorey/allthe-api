var mongoose = require('mongoose');
var Schema = mongoose.Schema;
let JobSchema = new Schema({
    title: String
});
module.exports = mongoose.model('Job', JobSchema);