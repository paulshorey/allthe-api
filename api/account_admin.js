const bcrypt = require('bcrypt');
const bcrypt_salt_rounds = 12;
const uuidv4 = require('uuid/v4');


/***
* REGISTER
*/
global.express_app.post('/account/register', function (req, res, next) {
	//
	// hash password
	bcrypt.hash(req.body.password, bcrypt_salt_rounds)
	.then(function(hashedPassword) {
		let userData = {email:req.body.email, password:hashedPassword};
		
		/***
		* ADD ACCOUNT
		*/
		global.m.ACCOUNT.collection('admin').insertMany([userData], function(error, data) {
			if (error) {
				// fail
				global.http_response(res, 500, "configuration error: mongoDB account.admin.insert: " + error ); return;
			} else {
				// success
				var account_id = data.insertedIds[0];
				
				/***
				* FIND ACCOUNT
				*/
			  global.m.ACCOUNT.collection('admin').findOne({_id:account_id}, function(err, account) {
	  	  	if(!account) {
	  	  		// fail
	  				global.http_response(res, 403, "access error: account _id: " + "something went wrong" ); return;
	  			} else {
	  				// success
			      delete account.password;
			      let account_access = {_access_token:uuidv4().toString(), _access_token_expires: Date.now()+(1000*60*60*24*30) };
			      console.log('\n','_access_token:'+account_access._access_token,'\n');

    				/***
    				* ADD ACCESS TOKEN
    				*/
    				global.m.ACCOUNT.collection('admin').updateOne({_id:account._id}, {$set:  {...account_access}}, function(error, token) {
    					if (error) {
    						// fail
    						global.http_response(res, 500, "configuration error: mongoDB insertOne: " + error ); return;
    					} else {
  		        	// success
  		        	// RETURN ACCOUNT INFO, WITH ACCESS TOKEN
  							global.http_response(res, 200, { ...account, ...account_access });
  						}
  					});
					}
			  });
			}
		})
	})
});


/***
* LOGIN
*/
global.express_app.post('/account/login', function (req, res, next) {
  
  /***
  * FIND ACCOUNT
  */
  global.m.ACCOUNT.collection('admin').findOne({email:req.body.email}, function(err, account) {
  	if(!account) {
			global.http_response(res, 403, "access error: " + "email not found" ); return;
		}
    // compare password
    bcrypt.compare(req.body.password, (account && account.password))
    .then(function(samePassword) {
        if(!samePassword) {
        	// fail
					global.http_response(res, 403, "access error: password does not match records" ); return;
        } else {
  				// success
		      delete account.password;
		      let account_access = {_access_token:uuidv4().toString(), _access_token_expires: Date.now()+(1000*60*60*24*30) };
		      console.log('\n','_access_token:'+account_access._access_token,'\n');

  				/***
  				* ADD ACCESS TOKEN
  				*/
  				global.m.ACCOUNT.collection('admin').updateOne({_id:account._id}, {$set: {...account_access}}, function(error, token) {
  					if (!token) {
  						// fail
  						global.http_response(res, 500, "configuration error: mongoDB insertOne: " + error ); return;
  					} else {
		        	// success
		        	// RETURN ACCOUNT AND ACCESS TOKEN
							global.http_response(res, 200, { ...account, ...account_access });
						}
					});
        }
    })
    .catch(function(error) {
    	global.http_response(res, 500, "configuration error: bcrypt: " + error );
    	console.log('\nerror',error,'\n');
    })
  });
});


/***
* CHANGE PASSWORD
*/
global.express_app.post('/account/password', function (req, res, next) {
  
  /***
  * FIND ACCOUNT
  */
  global.m.ACCOUNT.collection('admin').findOne({email:req.body.email}, function(err, account) {
    //
    // compare password
    bcrypt.compare(req.body.password, (account && account.password))
    .then(function(samePassword) {
      if(!samePassword) {
				global.http_response(res, 403, "access error: password does not match records" ); return;
      } else {
      	//
				// generate NEW hashed password
				bcrypt.hash(req.body.password2, bcrypt_salt_rounds)
				.then(function(hashedPassword) {

					/***
					* EDIT ACCOUNT
					*/
					global.m.ACCOUNT.collection('admin').updateOne({_id:account._id},{$set:{password:hashedPassword}}, function(err, data) {
						if (err) {
							global.http_response(res, 500, "configuration error: mongoDB updateOne if: " + err ); return;
						} else {
	        		delete account.password;
	        		// success
	        		// RETURN ACCOUNT (WITH SAME ACCESS TOKEN AS BEFORE)
							global.http_response(res, 200, account);
						}
					})
				})
      }
    })
  });
});


/***
* TODO: RENEW ACCESS TOKEN
* With every action, call a common function to update access token to a later time. 
* Not necessary yet because currently token has no expiration.
*/