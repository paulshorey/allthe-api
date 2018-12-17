const fs = require("fs");
const PORT = "1080";
const DEBUG_DB = true;
const SHH = require("/www-node-secrets.js");
const DEV = true;


/***
 * DB
 */
global.m = {}; // will be a dictionary of mongo connections
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient('mongodb+srv://'+encodeURI(SHH.mongodb.user)+':'+encodeURI(SHH.mongodb.pwd)+'@allthe-api-cluster-lylz1.mongodb.net/test?retryWrites=true&useNewUrlParser=true');
client.connect(function(err) {


	/***
	 * ACCOUNTS
	 * m.ACCOUNTS.collection('all')
	 */
	global.m.ACCOUNTS = client.db('accounts');
	// count
	global.m.ACCOUNTS.collection('all').count({}, function(err, docs) {
		console.log('\naccounts.all documents:', docs);
	});


	/***
	 * AGGREGATORS
	 * m.AGGREGATORS.collection( user_id )
	 */
	global.m.AGGREGATORS = client.db('crawlers');


	// client.close(); // do not close, so we can use this connection in API requests
});


/***
* EXPRESS APP
*/
const bodyParser = require('body-parser');
global.express_app = require("express")();
global.express_app.use(function(request, response, next) {
	response.setHeader("Access-Control-Allow-Origin", "*"); // CHANGE THIS BEFORE ADDING SENSITIVE DATsA!
	response.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
	response.setHeader("Access-Control-Allow-Headers", "Content-Type, Cache-Control, Pragma, Authorization, Content-Length, X-Requested-With, X-Host");
	if ("OPTIONS" == request.method) {
		response.writeHead(200);
		response.end();
		return;
	} else {
		next();
		return;
	}
});
global.express_app.use(bodyParser.json());
// global.express_app.use(bodyParser.urlencoded({ extended: true }));


/***
* EXPRESS APP ~ HTTP_RESPONSE
*/
global.http_response = function(response, statusCode, data) {
	response.setHeader("Content-Type", "application/json");
	response.writeHead(statusCode);
	let output = {};
	if (statusCode < 300) { // success
		output.data = data;
	} else { // error
		output.error = data;
	}
	response.write(JSON.stringify(output, null, "\t"));
	response.end();
}





/***
* API ENDPOINTS
*/
require('./api/account.js');





/***
* SERVE
*/
function onError(error) {
  if (error.syscall !== 'listen') {
	throw error;
  }
  var bind = typeof port === 'string'
	? 'Pipe ' + port
	: 'Port ' + port
  ;
  switch (error.code) {
	case 'EACCES':
	  console.error(bind + ' requires elevated privileges');
	  process.exit(1);
	  break;
	case 'EADDRINUSE':
	  console.error(bind + ' is already in use');
	  process.exit(1);
	  break;
	default:
	  throw error;
  }
}
// HTTP
const http = require('http');
const httpServer = http.createServer(global.express_app);
httpServer.on('error', onError);
httpServer.listen(1080, () => {
	console.log('HTTP Server running on port 1080');
});
// HTTPS
try {
	const privateKey = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem', 'utf8');
	if (privateKey) {
		const certificate = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/cert.pem', 'utf8');
		const ca = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/chain.pem', 'utf8');
		const credentials = {
			key: privateKey,
			cert: certificate,
			ca: ca
		};
		const https = require('https');
		const httpsServer = https.createServer(credentials, global.express_app);
		httpsServer.on('error', onError);
		httpsServer.listen(1443, () => {
			console.log('HTTPS Server running on port 1443');
		});
	}
} catch(e) {
	console.log('\nNO HTTPS key files found. Guessing this is a dev environment.\n');
}