
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
		// account data
		var newAggregator = {title:req.body.title};

		/***
		* ADD NEW AGGREGATOR
		*/
		global.m.AGGREGATOR.collection(account._id+'').insertMany([newAggregator], function(error, data) {
			if (error) {
				global.http_response(res, 500, "configuration error: aggregator insertOne: " + error ); return;
			}
			// aggregator data
			const aggregator_id = data.insertedIds[0];

			/***
			* CREATE CRAWLER COLLECTION
			*/
			global.m.CRAWLER.createCollection(aggregator_id+'', (error , collection) => {
				if (error) {
					global.http_response(res, 403, "access error: crawler createCollection: " + error ); return;
				}
				// crawler data
				console.log("Crawler collection created successfully");
				
				/***
				* FIND THE ADDED AGGREGATOR
				*/
			  global.m.AGGREGATOR.collection(account._id+'').findOne({_id:aggregator_id}, function(err, aggregator) {
	  	  	if(!aggregator) {
	  	  		// fail
	  				global.http_response(res, 403, "access error: aggregator findOne _id: " + aggregator_id + " in collection: "+account._id+"" ); return;
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
		global.m.AGGREGATOR.collection(account._id+'').find({}).toArray(function(err, data) {
	    if (err) {
	    	// fail
	    	global.http_response(res, 500, "configuration error: aggregator find: " + err ); return;
	    } else {
	    	// success
	    	global.http_response(res, 200, { aggregators:data, _in_collection:account._id, _access_token:req.params.accessToken });
	    }
	  });
	});
});