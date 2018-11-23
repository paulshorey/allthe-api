/*
	process.env
*/
process.env.PATH = __dirname;
process.env.PORT = 1080;
const DEV = process.env.NODE_ENV === "development";
/*
	SECRET
*/
const SECRET = require("/www/secret/all.js");
/*
	global.rqr
*/
global.rqr = global.rqr || {};
global.rqr.express = require("express");
global.rqr.express_parser = require("body-parser");
global.rqr.fs = require("fs");
global.rqr.http = require("http");
global.rqr.https = require("https");
global.rqr.url = require("url");
global.rqr.crypto = require("crypto");
global.rqr.moment = require("moment");
global.rqr.chrono = require("chrono-node");
global.rqr.cookieParser = require("cookie-parser");
global.rqr.bodyParser = require("body-parser");
global.rqr.mongoose = require("mongoose");
global.rqr.MongoClient = require("mongodb").MongoClient;
global.rqr.async = require("async");
/*
	global.S3 (AWS)
*/
process.env.AWS_ACCESS_KEY_ID = SECRET.AWS.ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = SECRET.AWS.SECRET_ACCESS_KEY;
process.env.AWS_SESSION_TOKEN = SECRET.AWS.SESSION_TOKEN;
global.S3 = require("aws-sdk/clients/s3");
global.S3UploadToBucket = function(name, content) {
	// bucket
	var bucket = new global.S3({ apiVersion: "2006-03-01" });
	var bucketParams = { Bucket: "jsjobsapi" };
	// file
	bucketParams.Body = content;
	bucketParams.Key = name;
	bucketParams.ContentType = "text/json; charset=utf-8";
	bucketParams.ContentDisposition = "inline";
	// upload
	bucket.upload(bucketParams, function(err, data) {
		if (err) {
			console.log("Error", err);
		}
		if (data) {
			console.log("Upload Success", data.Location);
		}
	});
};
/*
	global.logger
*/
let dna_logger = require("logdna").setupDefaultLogger(SECRET.logdna.ingestionKey, {
	index_meta: true,
	hostname: "jsjobs.us/api",
	app: DEV ? "API-dev" : "API-pro"
});
let fixLogger = function(useLib) {
	var doLog = function(level, ...args) {
		if (args[0].stack) {
			// Error
			this[level](args[0].stack, args[0].message);
			console[level](args[0].stack);
		} else {
			// multiple
			this[level](...args);
			console[level](...args);
		}
	}.bind(useLib);
	return {
		log: function(...logWhat) {
			doLog("log", ...logWhat);
		},
		info: function(...logWhat) {
			doLog("info", ...logWhat);
		},
		warn: function(...logWhat) {
			doLog("warn", ...logWhat);
		},
		error: function(...logWhat) {
			doLog("error", ...logWhat);
		}
	};
};
global.logger = fixLogger(dna_logger);
/*
global.server
*/
global.server = global.rqr.express();
global.server.use(function(request, response, next) {
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
global.server.use(global.rqr.bodyParser.json());
global.server.use(global.rqr.bodyParser.urlencoded({ extended: false }));
global.server.use(global.rqr.cookieParser());
/*
global.collection
*/
global.collection = {};
global.rqr.mongoose.connect("mongodb://" + global.shh.mongod.user + ":" + global.shh.mongod.pwd + "@localhost").then(function() {
	global.collection.jobs = global.rqr.mongoose.connection.db.collection("jobs", function(err, collection) {
		collection.count({}, function(error, count) {
			console.log("collection.jobs.count() => " + count);
		});
	});
});
/*
global.mongo
*/
global.mongo = {
	url: "mongodb://" + SECRET.mongod.user + ":" + SECRET.mongod.pwd + "@localhost:27017/",
	db: "admin"
};
global.mongo.queryCollection = function(collection, params = { find: {}, options: {}, sort: undefined, skip: 0, limit: 50, gt: undefined, lt: undefined }) {
	var mPromise = new Promise(function(resolve, reject) {
		// connect
		global.rqr.MongoClient.connect(global.mongo.url, function(err, db) {
			var dbo = db.db(global.mongo.db);
			if (err) {
				throw err;
			} // find
			// params.find = Object.assign(params.find, { posted: { $gte: 0 } });
			var query = dbo.collection(collection).find(params.find);
			if (params.limit) {
				query = query.limit(params.limit);
			}
			if (params.skip) {
				query = query.skip(params.skip);
			}
			if (params.sort) {
				query = query.sort(params.sort);
			}
			query.toArray(function(err, results) {
				if (err) {
					throw err;
				}
				db.close();
				resolve(results);
			});
		});
	});
	return mPromise;
};
global.mongo.insertDocuments = function(collection, documents = []) {
	var mPromise = new Promise(function(resolve, reject) {
		// connect
		// global.rqr.MongoClient.connect(global.mongo.url, function(err, db) {
		// 	if (err) {
		// 		throw err;
		// 	}
		// 	// options
		// 	var insertOptions = { ordered: false };
		// 	// add
		//	var dbo = db.db(global.mongo.db);
		// 	var col = dbo.collection(collection);
		// 	col.insertMany(documents, insertOptions, function(err, res) {
		// 		if (err) throw err;
		// 		console.log("Number of documents inserted: " + res.insertedCount);
		// 		db.close();
		// 		resolve(res);
		// 	});
		// });

		global.rqr.MongoClient.connect(global.mongo.url, function(err, db) {
			var dbo = db.db(global.mongo.db);
			var col = dbo.collection(collection);
			var bulk = col.initializeOrderedBulkOp();
			var i = 0;
			global.rqr.async.whilst(
				// Iterator condition
				function() {
					return i < documents.length;
				},
				// Do this in the iterator
				function(callback) {
					i++;
					console.log(documents[i]);
					bulk.insert(documents[i]);
					if (i % 1000 == 0) {
						bulk.execute(function(err, result) {
							bulk = col.initializeOrderedBulkOp();
							callback(err);
						});
					} else {
						callback();
					}
				},
				// When all is done
				function(err) {
					if (i % 1000 != 0)
						bulk.execute(function(err, result) {
							console.log("inserted some more");
						});
					console.log("I'm finished now");
					db.close();
				}
			);
		});
	});
	return mPromise;
};

/************************************************************************************
	API
*/
/*
	API: 500 Error
*/
global.server.use(function(err, req, response, next) {
	let data = { error: 1, message: err.message };
	if (DEV) {
		data.stack = err.stack;
	}
	response.setHeader("Content-Type", "application/json");
	response.writeHead(500);
	response.write(JSON.stringify(data, null, "\t"));
	response.end();
});

/*
	API: GET
*/
global.server.get("/api/v1/:collection/:area?", async function(request, response) {
	// meta
	const collection_area = request.params.area;
	const collection_gt = ["posted", Date.now() - 604800000 * 2]; // posted since 2 weeks ago
	const collection = request.params.collection;
	// data
	let data = await global.mongo.queryCollection(collection, { area: collection_area, find: {}, gt: collection_gt, sort: { posted: -1 }, skip: 0, limit: 50 });
	// send
	response.setHeader("Content-Type", "application/json");
	response.writeHead(200);
	response.write(JSON.stringify({ results: data.length, data: data }, null, "\t"));
	response.end();
});
/*
	API: POST
*/
/*	
	webhook from APIFY after a site crawl has completed
*/
global.server.post("/api/v1/:collection/apify-webhook/:area?", function(request, response) {
	// meta
	const collection_area = request.params.area || "";
	const collection = request.params.collection;
	const cacheUrl_initial = `api/v1/${collection + collection_area}-50.json`;
	const cacheUrl = `api/v1/${collection + collection_area}.json`;
	/*
		fetch data from last crawl, because webhook does not give us the data
	*/
	const resultsUrl = "https://api.apify.com/v1/execs/" + request.body._id + "/results";
	global.rqr.https.get(resultsUrl, res => {
		res.setEncoding("utf8");
		let body = "";
		res.on("data", data => {
			body += data;
		});
		res.on("end", () => {
			/*
				the data is an array of arrays - each having max 50 objects
			*/
			// data
			let resultsObject = {};
			let resultsSets = JSON.parse(body);
			if (resultsSets && resultsSets[0] && resultsSets[0].pageFunctionResult) {
				for (var rD in resultsSets.reverse()) {
					let results = resultsSets[rD].pageFunctionResult;
					// format
					for (var r in results.reverse()) {
						// each
						var res = results[r];
						for (var k in res) {
							if (typeof res[k] === "string") {
								res[k] = res[k].replace(/\s/g, " ");
								res[k] = res[k].trim();
							}
						}
						// filter (timestamp in milliseconds)
						res.posted = global.rqr.moment(global.rqr.chrono.parseDate(res.posted)).format("x");
						// save to DB
						res._area = collection_area;
						res._status = "new";
						res._id = global.rqr.crypto
							.createHash("md5")
							.update(res.name + " " + res.company)
							.digest("hex");
						/*
							save to Object
						*/
						resultsObject[res._id] = res;
					}
				}
				/*
					save to DB
				*/
				let resultsArray = Object.values(resultsObject);
				if (resultsArray.length) {
					/* 
						save to DB 
					*/
					global.mongo.insertDocuments(collection, resultsArray);
					global.logger.info({ ["API: POST `/api/v1/" + collection + "/apify-webhook/" + collection_area + '` saved to collection "' + collection + '"']: { resultsUrl, results: resultsArray.length } });

					/*
						save to CDN
					*/
					global.mongo.queryCollection(collection, { area: collection_area, find: {}, sort: { posted: -1 }, skip: 0, limit: 3000 }).then(function(data) {
						// send to S3/Cloud
						global.S3UploadToBucket(cacheUrl, JSON.stringify(resultsArray));
						global.S3UploadToBucket(cacheUrl_initial, JSON.stringify(resultsArray.slice(0, 50)));
						global.logger.info({ ["API: POST `/api/v1/" + collection + "/apify-webhook/" + collection_area + "` uploading to CDN:"]: { results: data.length } });
					});
				}
			} else {
				// no data in (resultsSets[0].pageFunctionResult)
				global.logger.error({ ["API: POST `/api/v1/" + collection + "/apify-webhook/" + collection_area + "` failed to return data: "]: resultsUrl });
			}
		});
	});
	// success response without waiting for async data above
	response.setHeader("Content-Type", "application/json");
	response.writeHead(200);
	response.write(JSON.stringify({ data: "OK", error: 0 }, null, "\t"));
	response.end();
});

/*
SERVE
*/
module.exports = global.server;
