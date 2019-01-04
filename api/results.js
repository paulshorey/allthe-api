
/***
* ADD MANY
*/
global.express_app.post('/results/add/:aggregator_id', function (req, res, next) {
	if (!req.body.results.length) {
		global.http_response(res, 403, "request error: expected POST data to have results property of type Array" ); return;
	}
	// post data
	var add_results = req.body.data;

	/***
	* ADD NEW RESULTS
	*/
	try {
		global.m.RESULTS.collection(req.params.aggregator_id).insertMany(add_results, function(error, data) {
			if (error) {
				throw error;
			}
			// added data
			const added_rows = data.insertedIds;
			// fail
			if (!added_rows.length) {
				global.http_response(res, 500, "unexpected error: failed to write results to database "); return;
			}
			// success
			// RETURN NUMBER OF ROWS ADDED
			global.http_response(res, 200, { results_length:added_rows.length });

		});
	} catch(error) {
		// fail:
		// collection not found: maybe garbage or deleted "aggregator_id"
		global.http_response(res, 500, "database error: results.collection("+req.params.aggregator_id+").insertMany: " + error ); return;
	}
});


/***
* FIND ALL
*/
global.express_app.post('/results/find/:aggregator_id', function (req, res, next) {

		/***
		* FIND RESULTS
		*/
		global.m.RESULTS.collection(req.params.aggregator_id).find({}).toArray(function(err, data) {
	    if (err) {
	    	// fail
	    	global.http_response(res, 500, "configuration error: result find: " + err ); return;
	    } else {
	    	// success
	    	global.http_response(res, 200, (data.length ? data : []) );
	    }
	  });

});