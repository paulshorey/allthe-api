const DEBUG = {db:true};

/***
 * DB
 */
const SHH = require("../../www-node-secrets.js");
const mongoose_welcome_function = function(mongoose) {
	if (DEBUG && DEBUG.db) {
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
const Mongoose = require('mongoose').Mongoose;
const mongoose_aggregators = (new Mongoose()).connect("mongodb://" + SHH.mongodb["aggregators"].user + ":" + SHH.mongodb["aggregators"].pwd + "@localhost/" + "aggregators", { useNewUrlParser: true }).then(mongoose_welcome_function);
const mongoose_results = (new Mongoose()).connect("mongodb://" + SHH.mongodb["results"].user + ":" + SHH.mongodb["results"].pwd + "@localhost/" + "results", { useNewUrlParser: true }).then(mongoose_welcome_function);
const mongoose_sites = (new Mongoose()).connect("mongodb://" + SHH.mongodb["sites"].user + ":" + SHH.mongodb["sites"].pwd + "@localhost/" + "sites", { useNewUrlParser: true }).then(mongoose_welcome_function);


/***
* SERVER
*/
let bodyParser = require('body-parser');
global.app = require("express")();
global.app.use(function(request, response, next) {
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
global.app.use(bodyParser.json());
global.app.use(bodyParser.urlencoded({ extended: true }));


/***
* AUTH
*/
const BCRYPT_SALT_ROUNDS = 12;
global.bcrypt = require('bcrypt');
// global.app.post('/register', function (req, res, next) {
// 	var username = req.body.username;
// 	var password = req.body.password;

// 	bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
// 		.then(function(hashedPassword) {
// 			console.log("saveUser("+username+", "+hashedPassword+")");
// 		 // return usersDB.saveUser(username, hashedPassword);
// 		})
// 		.then(function() {
// 		 // res.send();
// 		})
// 		.catch(function(error){
// 		 console.log("Error saving user: ");
// 		 console.log(error);
// 		 // next();
// 		});
// });
var savePassword = "";
setTimeout(function(){
	var username = "pauly"
	var password = "awesome";

	bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
		.then(function(hashedPassword) {
			savePassword = hashedPassword;
			console.log("saveUser("+username+", "+hashedPassword+")");
		 // return usersDB.saveUser(username, hashedPassword);
		})
		.then(function() {
		 // res.send();
		})
		.catch(function(error){
		 console.log("Error saving user: ");
		 console.log(error);
		 // next();
		});
},1000);


// app.post('/login', function (req, res, next) { 
//   var username = req.body.username;
//   var password = req.body.password;

//   usersDB.getUserByUsername(username)
//     .then(function(user) {
//         return bcrypt.compare(password, user.password);
//     })
//     .then(function(samePassword) {
//         if(!samePassword) {
//             res.status(403).send();
//         }
//         res.send();
//     })
//     .catch(function(error){
//         console.log("Error authenticating user: ");
//         console.log(error);
//         next();
//     });
// });


setTimeout(function(){
	var password = "awesome";	
	console.log('\n\nsamePassword?\n');
	bcrypt.compare(password, savePassword).then(function(samePassword) {
		console.log(samePassword);
	});
},2000);