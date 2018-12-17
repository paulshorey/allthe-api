const args = require('minimist')(process.argv.slice(2)); // agg, sit, res
const SHH = require("/www-node-secrets.js");


/***
 * DB
 */
global.m = {}; // dictionary of database connections
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient('mongodb+srv://'+encodeURI(SHH.mongodb.user)+':'+encodeURI(SHH.mongodb.pwd)+'@allthe-api-cluster-lylz1.mongodb.net/test?retryWrites=true&useNewUrlParser=true');
client.connect(function(err) {

	/***
	 * AGGREGATORS
	 * m.ACCOUNTS.collection('all')
	 */
	global.m.ACCOUNTS = client.db('accounts');
	switch (args['accounts']) {

		case "remove":
			// removing
			global.m.ACCOUNTS.collection('all').remove({}, function(err, docs) {
				console.log('\nremoved = ', docs.result.n);
			});
		break;

		case "index":
			// email:unique
			global.m.ACCOUNTS.collection('all').createIndex(
				{ email : 1 }, { unique:true }, function(err, result) {
				if (err) {
					console.log('\nerror = ',err);
				} else {
					console.log('\ncreated index = email:unique');
				}
			});
		break;

	}



	/***
	 * COUNT
	 */
	global.m.ACCOUNTS.collection('all').count({}, function(err, docs) {
		console.log('\naccounts count:', docs);
	});


	client.close();
});