const PORT = "1080";
/* test */
const DEBUG_DB = true;
const SHH = require("../www-node-secrets.js");
const DEV = true;
const BCRYPT_SALT_ROUNDS = 12;


/***
 * DB
 */
const log_db_status = function(connection) {
	if (DEBUG_DB) {
		// connection
		connection.db.listCollections().toArray(function (err, collections) {
			collections.forEach(function(collection) {
				// collection
				connection.db.collection(collection.name, function(err, coll) {
					coll.countDocuments({}, function(error, count) {
						console.log(connection.name + "."+ collection.name + " has " + count + " documents");
					});
				});
			});	
		});
	}
};
const mongoose = require('mongoose');
const Mongoose = mongoose.Mongoose;
const ObjectID = mongoose.ObjectID;
/***
* aggregators
*/
const m_a_schema = (new Mongoose).Schema({ email: 'string', password: 'string' });
const m_a_connection = mongoose.createConnection("mongodb://" + SHH.mongod.user + ":" + SHH.mongod.pwd + "@localhost/" + "aggregators", { useNewUrlParser: true }).then(function(connection){
	log_db_status(connection);
	global.m_a_model = connection.model('all', m_a_schema);
	// sandbox
	console.log('find',m_a_model.find({}));
});
// (new Mongoose()).connect("mongodb://" + SHH.mongod.user + ":" + SHH.mongod.pwd + "@localhost/" + "results", { useNewUrlParser: true }).then(function(mongoose_instance){
// 	log_db_status(mongoose_instance);
// 	global.mongoose_results = mongoose_instance;
// });
// (new Mongoose()).connect("mongodb://" + SHH.mongod.user + ":" + SHH.mongod.pwd + "@localhost/" + "sites", { useNewUrlParser: true }).then(function(mongoose_instance){
// 	log_db_status(mongoose_instance);
// 	global.mongoose_sites = mongoose_instance;
// });


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
* HTTP RESPONSE
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