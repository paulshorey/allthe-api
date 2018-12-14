const bcrypt = require('bcrypt');
const bcrypt_salt_rounds = 12;


/***
* EXPRESS APP ~ AUTH ~ REGISTER
*/
global.express_app.post('/auth/register', function (req, res, next) {
	//
	// hash password
	bcrypt.hash(req.body.password, bcrypt_salt_rounds)
	.then(function(hashedPassword) {
		//
		// insert to mongoDB
		global.m.AGGREGATORS.collection('all').insertMany([
			{email:req.body.email, password:hashedPassword, title:"test1"}
		], function(error, data) {
			if (error) {
				//
				// fail
				global.http_response(res, 500, { "mongoDB insertOne error" : error });
			} else {
				//
				// success
				var agg_id = data.insertedIds[0];
				console.log('created aggregator _id:',(typeof agg_id),(typeof agg_id+""));

				/***
				* ADD NEW CRAWLER COLLECTION
				*/
				global.m.CRAWLERS.createCollection(agg_id+'', (error , collection) => {
					if (error) {
						global.http_response(res, 403, { "mongoDB createCollection" : error });
					} else {
						console.log("Details collection created successfully");
						global.http_response(res, 200, "collection created successfully");
					}
				});
			}
		})
	})
});


/***
* EXPRESS APP ~ AUTH ~ LOGIN
*/
global.express_app.post('/auth/login', function (req, res, next) {
  //
  // find user
  // global.mongoDB_aggregators.connection.collection('all').findOne({email:req.body.email}, function(err, user) {
  // global.Aggregator.findOne({email:req.body.email}, function(err, user) {
  global.m.AGGREGATORS.collection('all').findOne({email:req.body.email}, function(err, user) {
    //
    // compare password
    bcrypt.compare(req.body.password, (user && user.password))
    .then(function(samePassword) {
        if(!samePassword) {
			global.http_response(res, 403, { "password" : "password does not match records" });
        } else {
        	delete user.password;
			global.http_response(res, 200, { "user" : user });
        }
    })
  });
});


/***
* EXPRESS APP ~ AUTH ~ CHANGE PASSWORD
*/
global.express_app.post('/auth/password', function (req, res, next) {
  //
  // find user
  global.m.AGGREGATORS.collection('all').findOne({email:req.body.email}, function(err, user) {
    //
    // compare password
    bcrypt.compare(req.body.password, (user && user.password))
    .then(function(samePassword) {
        if(!samePassword) {
			global.http_response(res, 403, { "password" : "password does not match records" });
        } else {
        	//
			// generate NEW hashed password
			bcrypt.hash(req.body.password2, bcrypt_salt_rounds)
			.then(function(hashedPassword) {
				global.m.AGGREGATORS.collection('all').updateOne({_id:user._id},{$set:{password:hashedPassword}}, function(err, data) {
					if (err) {
						global.http_response(res, 500, { "mongoDB updateOne if" : err });
					} else {
						global.http_response(res, 200, data.result);
					}
				})
			})
        }
    })
  });
});