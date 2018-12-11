const PORT = "1080";
const DEBUG_DB = true;
const SHH = require("../../www-node-secrets.js");
const DEV = true;
const BCRYPT_SALT_ROUNDS = 12;


/***
 * DB
 */
const log_db_status = function(mongoose) {
	if (DEBUG_DB) {
		// connection
		mongoose.connection.db.listCollections().toArray(function (err, collections) {
			collections.forEach(function(collection) {
				// collection
				mongoose.connection.db.collection(collection.name, function(err, coll) {
					coll.countDocuments({}, function(error, count) {
						console.log(mongoose.connection.name + "."+ collection.name + " has " + count + " documents");
					});
				});
			});	
		});
	}
};
const mongoose = require('mongoose');
const Mongoose = mongoose.Mongoose;
const ObjectID = mongoose.ObjectID;
(new Mongoose()).connect("mongodb://" + SHH.mongodb["aggregators"].user + ":" + SHH.mongodb["aggregators"].pwd + "@localhost/" + "aggregators", { useNewUrlParser: true }).then(function(mongoose_instance){
	log_db_status(mongoose_instance);
	global.mongoose_aggregators = mongoose_instance;
});
(new Mongoose()).connect("mongodb://" + SHH.mongodb["results"].user + ":" + SHH.mongodb["results"].pwd + "@localhost/" + "results", { useNewUrlParser: true }).then(function(mongoose_instance){
	log_db_status(mongoose_instance);
	global.mongoose_results = mongoose_instance;
});
(new Mongoose()).connect("mongodb://" + SHH.mongodb["sites"].user + ":" + SHH.mongodb["sites"].pwd + "@localhost/" + "sites", { useNewUrlParser: true }).then(function(mongoose_instance){
	log_db_status(mongoose_instance);
	global.mongoose_sites = mongoose_instance;
});


/***
* EXPRESS APP
*/
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const express_app = require("express")();
express_app.use(function(request, response, next) {
	response.setHeader("Access-Control-Allow-Origin", "*"); // CHANGE THIS BEFORE ADDING SENSITIVE DATA!
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
* EXPRESS APP ~ AUTH ~ NEW USER
*/
express_app.post('/register', function (req, res, next) {
	//
	// generate hashed password
	bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS)
		// 
		// save user account
		.then(function(hashedPassword) {
			global.mongoose_aggregators.connection.collection('all').insertOne({email:req.body.email, password:hashedPassword, title:"test1"}, function(err, data) {
				console.log('saved');
				console.log(err);
				console.log(data);
			})
		})
		//
		// output
		.then(function() {
			res.send();
		})
		.catch(function(error){
			console.log("Error saving user: ");
			console.log(error);
			next();
		});
});


/***
* EXPRESS APP ~ AUTH ~ LOGIN
*/
express_app.post('/login', function (req, res, next) {
  //
  // find user
  global.mongoose_aggregators.connection.collection('all').findOne({email:req.body.email}, function(err, user) {
    //
    // compare password
    bcrypt.compare(req.body.password, user.password)
    //
    // output
    .then(function(samePassword) {
        if(!samePassword) {
            res.status(403).send();
        }
        res.send();
    })
    .catch(function(error){
        console.log("Error authenticating user: ");
        console.log(error);
        next();
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
server.listen(PORT);