
/***
* ADD
*/
global.express_app.post('/crawler/add/:accessToken', function (req, res, next) {
	/***
	* VALIDATE ACCOUNT BY TOKEN
	*/
  global.m.ACCOUNT.collection('admin').findOne({_access_token:req.params.accessToken}, function(err, account) {
  	if(!account) {
			global.http_response(res, 403, "access error: token not found: "+req.params.accessToken ); return;
		}
		// post data
		var add_crawler = {site_url:req.body.site_url};

		/***
		* ADD NEW CRAWLER
		*/
		global.m.ACCOUNT.collection('crawler').insertMany([add_crawler], function(error, data) {
			if (error) {
				global.http_response(res, 500, "configuration error: mongoDB account.crawler.insert: " + error ); return;
			}
			// crawler data
			const crawler_id = data.insertedIds[0];

			/***
			* FIND THE ADDED CRAWLER
			*/
		  global.m.ACCOUNT.collection('crawler').findOne({_id:crawler_id}, function(err, crawler) {
  	  	if(!crawler) {
  	  		// fail
  				global.http_response(res, 403, "database error: account.crawler.findOne _id:"+crawler_id+"" ); return;
  			} else {
  				// success
					global.http_response(res, 200, crawler);
				}
		  });
		});
	});
});


/***
* FIND
*/
global.express_app.post('/crawler/find/', function (req, res, next) {
	/***
	* FIND CRAWLERS
	*/
	global.m.ACCOUNT.collection('crawler').find({}).toArray(function(err, data) {
    if (err) {
    	// fail
    	global.http_response(res, 500, "configuration error: crawler find: " + err ); return;
    } else {
    	// success
    	global.http_response(res, 200, (data.length ? data : []));
    }
  });
});

/***
* TODO


FIND_NEXT (by crawler)

EDIT (by dashboard... accessToken... just use ADD ?)

CRAWLED (for crawler ~ allow update only specifi of fields)

*/