const PORT = "1080";
/* test */
const DEBUG_DB = true;
const SHH = require("/www-node-secrets.js");
const DEV = true;
const BCRYPT_SALT_ROUNDS = 12;



/***
 * DB
 */
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb+srv://'+encodeURI(SHH.mongodb.user)+':'+encodeURI(SHH.mongodb.pwd)+'@allthe-api-cluster-lylz1.mongodb.net/test?retryWrites=true';

// Database Name
const dbName = 'aggregators';

// Create a new MongoClient
const client = new MongoClient(url);

// Use connect method to connect to the Server
client.connect(function(err) {
	assert.equal(null, err);
	console.log("Connected successfully to server");

	const db = client.db(dbName);

	const collection = db.collection('all');
	collection.find({}).toArray(function(err, docs) {
		assert.equal(err, null);
		console.log("Found the following records");
		console.log(docs)
		// callback(docs);
	});

	client.close();
});


/***
* EXPRESS APP
*/
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const express_app = require("express")();
express_app.use(function(request, response, next) {
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
express_app.use(bodyParser.json());
express_app.use(bodyParser.urlencoded({ extended: true }));


/***
 * DB
 */
// const log_db_status = function(mongoose) {
// 	if (DEBUG_DB) {
// 		// connection
// 		mongoose.connection.db.listCollections().toArray(function (err, collections) {
// 			collections.forEach(function(collection) {
// 				// collection
// 				mongoose.connection.db.collection(collection.name, function(err, coll) {
// 					coll.countDocuments({}, function(error, count) {
// 						console.log(mongoose.connection.name + "."+ collection.name + " has " + count + " documents");
// 					});
// 				});
// 			});	
// 		});
// 	}
// };
// const mongoose = require('mongoose');
// const Mongoose = mongoose.Mongoose;
// const ObjectID = mongoose.ObjectID;
// (new Mongoose()).connect("mongodb://" + SHH.mongod.user + ":" + SHH.mongod.pwd + "@localhost/" + "aggregators", { useNewUrlParser: true }).then(function(mongoose_instance){
// 	log_db_status(mongoose_instance);
// 	global.mongoose_aggregators = mongoose_instance;
// });
// (new Mongoose()).connect("mongodb://" + SHH.mongod.user + ":" + SHH.mongod.pwd + "@localhost/" + "results", { useNewUrlParser: true }).then(function(mongoose_instance){
// 	log_db_status(mongoose_instance);
// 	global.mongoose_results = mongoose_instance;
// });
// (new Mongoose()).connect("mongodb://" + SHH.mongod.user + ":" + SHH.mongod.pwd + "@localhost/" + "sites", { useNewUrlParser: true }).then(function(mongoose_instance){
// 	log_db_status(mongoose_instance);
// 	global.mongoose_sites = mongoose_instance;
// });




/***
* EXPRESS APP ~ HTTP_RESPONSE
*/
const http_response = function(response, statusCode, data) {
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
* EXPRESS APP ~ AUTH ~ NEW USER
*/
express_app.post('/auth/register', function (req, res, next) {
	//
	// generate hashed password
	bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS)
	.then(function(hashedPassword) {
		global.mongoose_aggregators.connection.collection('all').insertOne({email:req.body.email, password:hashedPassword, title:"test1"}, function(err, data) {
			if (err) {
				http_response(res, 500, { "mongoose insertOne if" : err });
			} else {
				http_response(res, 200, data);
			}
		})
		.catch(function(error){
			http_response(res, 500, { "mongoose insertOne catch" : error });
		});
	})
	.catch(function(error){
		http_response(res, 500, { "password" : error });
	});
});


/***
* EXPRESS APP ~ AUTH ~ LOGIN
*/
express_app.post('/auth/login', function (req, res, next) {
  //
  // find user
  // global.mongoose_aggregators.connection.collection('all').findOne({email:req.body.email}, function(err, user) {
  global.Aggregator.findOne({email:req.body.email}, function(err, user) {
    //
    // compare password
    bcrypt.compare(req.body.password, (user && user.password))
    .then(function(samePassword) {
        if(!samePassword) {
			http_response(res, 403, { "password" : "password does not match records" });
        } else {
        	delete user.password;
			http_response(res, 200, { "user" : user });
        }
    })
    .catch(function(error){
		http_response(res, 403, { "password" : error });
    });
  });
});


/***
* EXPRESS APP ~ AUTH ~ CHANGE PASSWORD
*/
express_app.post('/auth/password', function (req, res, next) {
  //
  // find user
  global.mongoose_aggregators.connection.collection('all').findOne({email:req.body.email}, function(err, user) {
    //
    // compare password
    bcrypt.compare(req.body.password, (user && user.password))
    .then(function(samePassword) {
        if(!samePassword) {
			http_response(res, 403, { "password" : "password does not match records" });
        } else {
        	


        	//
			// generate NEW hashed password
			bcrypt.hash(req.body.password2, BCRYPT_SALT_ROUNDS)
				.then(function(hashedPassword) {
					global.mongoose_aggregators.connection.collection('all').updateOne({filter:{_id:req.body._id},update:{$set:{password:hashedPassword}}}, function(err, data) {
						if (err) {
							http_response(res, 500, { "mongoose updateOne if" : err });
						} else {
							http_response(res, 200, data);
						}
					})
					.catch(function(error){
						http_response(res, 500, { "mongoose updateOne catch" : error });
					});
				})
				.catch(function(error){
					http_response(res, 500, { "password" : error });
				});



        }
    })
    .catch(function(error){
		http_response(res, 403, { "password" : error });
    });
  });
});







/***
* SERVE
*/
var http = require('http');
var server = http.createServer(express_app);
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
	? 'pipe ' + addr
	: 'port ' + addr.port;
  console.log('\nListening on ' + bind + '\n');
}
function onError(error) {
  if (error.syscall !== 'listen') {
	throw error;
  }
  var bind = typeof port === 'string'
	? 'Pipe ' + port
	: 'Port ' + port;

  // handle specific listen errors with friendly messages
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
server.on('error', onError);
server.on('listening', onListening);
server.timeout = 1000;
server.listen(PORT);