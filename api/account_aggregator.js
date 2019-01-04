
/***
* ADD
*/
global.express_app.post('/aggregator/add/:accessToken', function (req, res, next) {
	/***
	* VALIDATE ACCOUNT BY TOKEN
	*/
  global.m.ACCOUNT.collection('admin').findOne({_access_token:req.params.accessToken}, function(err, account) {
  	if(!account) {
			global.http_response(res, 403, "access error: token not found: "+req.params.accessToken ); return;
		}
		// post data
		var add_aggregator = {title:req.body.title};

		/***
		* ADD NEW AGGREGATOR
		*/
		global.m.ACCOUNT.collection('aggregator').insertMany([add_aggregator], function(error, data) {
			if (error) {
				global.http_response(res, 500, "configuration error: mongoDB account.aggregator.insert: " + error ); return;
			}
			// aggregator data
			const aggregator_id = data.insertedIds[0];

			/***
			* CREATE RESULT COLLECTION
			*/
			global.m.RESULT.createCollection(aggregator_id+'', (error , collection) => {
				if (error) {
					global.http_response(res, 403, "access error: results.createCollection("+aggregator_id+"): " + error ); return;
				}
				// crawler data
				console.log("RESULT _aggregator_id:"+aggregator_id+" collection created successfully");
				
				/***
				* FIND THE ADDED AGGREGATOR
				*/
			  global.m.ACCOUNT.collection('aggregator').findOne({_id:aggregator_id}, function(err, aggregator) {
	  	  	if(!aggregator) {
	  	  		// fail
	  	  		global.http_response(res, 403, "database error: account.aggregator.findOne _id:"+crawler_id+"" ); return;
	  			} else {
	  				// success
						global.http_response(res, 200, aggregator);
					}
			  });
			});
		});
	});
});


/***
* FIND
*/
global.express_app.post('/aggregator/find/:accessToken', function (req, res, next) {
	/***
	* VALIDATE ACCOUNT BY TOKEN
	*/
  global.m.ACCOUNT.collection('admin').findOne({_access_token:req.params.accessToken}, function(err, account) {
  	if(!account) {
			global.http_response(res, 403, "access error: token not found: "+req.params.accessToken ); return;
		}
		console.log('\n',JSON.stringify(account),'\n');

		/***
		* FIND AGGREGATORS
		*/
		global.m.ACCOUNT.collection('aggregator').find({}).toArray(function(err, data) {
	    if (err) {
	    	// fail
	    	global.http_response(res, 500, "configuration error: aggregator find: " + err ); return;
	    } else {
	    	// success
	    	global.http_response(res, 200, (data.length ? data : []) );
	    }
	  });
	});
});