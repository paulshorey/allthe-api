const bcrypt = require('bcrypt');
const bcrypt_salt_rounds = 12;


/***
* EXPRESS APP ~ AUTH ~ REGISTER
*/
global.express_app.post('/account/register', function (req, res, next) {
	//
	// hash password
	bcrypt.hash(req.body.password, bcrypt_salt_rounds)
	.then(function(hashedPassword) {
		//
		// insert to mongoDB
		global.m.ACCOUNTS.collection('all').insertMany([
			{email:req.body.email, password:hashedPassword, title:"test1"}
		], function(error, data) {
			if (error) {
				//
				// fail
				global.http_response(res, 500, { "mongoDB insertOne error" : error });
			} else {
				//
				// success
				var account_id = data.insertedIds[0];
				console.log('created account _id:',(typeof account_id),(typeof account_id+""));

				/***
				* ADD NEW AGGREGATOR COLLECTION
				*/
				global.m.AGGREGATORS.createCollection(account_id+'', (error , collection) => {
					if (error) {
						global.http_response(res, 403, { "mongoDB createCollection" : error });
					} else {
						console.log("Details collection created successfully");
					  global.m.ACCOUNTS.collection('all').findOne({_id:account_id}, function(err, account) {
			  	  	if(!account) {
			  				global.http_response(res, 403, { "account _id" : "something went wrong" });
			  				return false;
			  			} else {
			        	delete account.password;
								global.http_response(res, 200, account);
							}
					  });
					}
				});
			}
		})
	})
});


/***
* EXPRESS APP ~ AUTH ~ LOGIN
*/
global.express_app.post('/account/login', function (req, res, next) {
  //
  // find account
  // global.mongoDB_aggregators.connection.collection('all').findOne({email:req.body.email}, function(err, account) {
  // global.Aggregator.findOne({email:req.body.email}, function(err, account) {
  global.m.ACCOUNTS.collection('all').findOne({email:req.body.email}, function(err, account) {
  	if(!account) {
			global.http_response(res, 403, { "email" : "email not found" });
			return false;
		}
    //
    // compare password
    bcrypt.compare(req.body.password, (account && account.password))
    .then(function(samePassword) {
        if(!samePassword) {
					global.http_response(res, 403, { "password" : "password does not match records" });
        } else {
        	delete account.password;
					global.http_response(res, 200, account);
        }
    })
    .catch(function(error) {
    	global.http_response(res, 500, { "bcrypt" : error });
    	console.log('\nerror',error,'\n');
    })
  });
});


/***
* EXPRESS APP ~ AUTH ~ CHANGE PASSWORD
*/
global.express_app.post('/account/password', function (req, res, next) {
  //
  // find account
  global.m.ACCOUNTS.collection('all').findOne({email:req.body.email}, function(err, account) {
    //
    // compare password
    bcrypt.compare(req.body.password, (account && account.password))
    .then(function(samePassword) {
        if(!samePassword) {
			global.http_response(res, 403, { "password" : "password does not match records" });
        } else {
        	//
			// generate NEW hashed password
			bcrypt.hash(req.body.password2, bcrypt_salt_rounds)
			.then(function(hashedPassword) {
				global.m.ACCOUNTS.collection('all').updateOne({_id:account._id},{$set:{password:hashedPassword}}, function(err, data) {
					if (err) {
						global.http_response(res, 500, { "mongoDB updateOne if" : err });
					} else {
        		delete account.password;
						global.http_response(res, 200, account);
					}
				})
			})
        }
    })
  });
});