/*
	process.env
*/
process.env.PATH = __dirname;
process.env.PORT = 1080;
const DEV = process.env.NODE_ENV === "development";
/*
	global.shh
*/
global.shh = require("/www/secret/all.js"); // not on GitHub!
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
/*
	global.S3 (AWS)
*/
process.env.AWS_ACCESS_KEY_ID = global.shh.AWS.ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = global.shh.AWS.SECRET_ACCESS_KEY;
process.env.AWS_SESSION_TOKEN = global.shh.AWS.SESSION_TOKEN;
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
			global.logger.error({ "S3UploadToBucket failed to upload:": { Key: bucketParams.Key, Bucket: bucketParams.Bucket } });
		}
		if (data) {
			console.log("Upload Success", data.Location);
		}
	});
};
/*
	global.logger
*/
let dna_logger = require("logdna").setupDefaultLogger(global.shh.logdna.ingestionKey, {
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
global.db
global.model
global.schema
*/
global.db = global.rqr.mongoose.connection.db;
// global.model = {};
// global.schema = {};
// global.schema.jobs = new global.rqr.mongoose.Schema({
// 	_id: String,
// 	_status: String,
// 	name: String,
// 	link: String,
// 	company: String,
// 	location: String,
// 	posted: Number,
// 	text: String
// });
// global.model.jobs = global.db.model("jobs", global.schema.jobs);
/*
global.collection
*/
// global.collections = [];
global.collection = {};
global.rqr.mongoose.connect("mongodb://" + global.shh.mongod.user + ":" + global.shh.mongod.pwd + "@localhost/admin").then(function() {
	// global.collections
	// global.rqr.mongoose.connection.db
	// 	.listCollections()
	// 	.toArray()
	// 	.then(function(collections) {
	// 		collections.forEach(function(col) {
	// 			if (col.name.indexOf("system.") === -1) {
	// 				// add to list
	// 				global.collections.push(col);
	// 				if (process.argv.indexOf("purge") !== -1) {
	// 					// remove all documents
	// 				} else {
	// 					// open collection
	// 					global.collection[col.name] = global.rqr.mongoose.connection.db.collection(col.name, function(err, collection) {
	// 						collection.count({}, function(error, count) {
	// 							console.log("collection." + col.name + ".count() => " + count);
	// 						});
	// 					});
	// 				}
	// 			}
	// 		});
	// 	});
	global.collection["jobs"] = global.rqr.mongoose.connection.db.collection("jobs", function(err, collection) {
		collection.count({}, function(error, count) {
			console.log("collection." + "jobs" + ".count() => " + count);
		});
	});
});
global.collectionSearch = function(params = { collection: undefined, find: {}, options: {}, sort: undefined, skip: 0, pg: 0, limit: 50, gt: undefined, lt: undefined }) {
	// params type, filter, default
	params.limit = +params.limit;
	params.skip = +params.skip;
	params.pg = +params.pg;
	if (params.pg) {
		params.skip = (params.pg - 1) * params.limit;
	}
	// handle request
	var mPromise = new Promise(function(resolve, reject) {
		global.rqr.mongoose.connection.db.collection(params.collection, function(err, collection) {
			console.log("collection?:");
			console.log(typeof collection);
			// build query
			if (params.gt) {
				params.find = Object.assign(params.find, { [params.gt[0]]: { $gte: params.gt[1] } });
			}
			if (params.lt) {
				params.find = Object.assign(params.find, { [params.lt[0]]: { $lte: params.lt[1] } });
			}
			let query = collection.find(params.find, null, params.options).limit(params.limit);
			if (params.skip) {
				query = query.skip(params.skip);
			}
			if (params.sort) {
				query = query.sort(params.sort);
			}
			// exec query
			query.toArray(function(error, results) {
				console.log("collection." + params.collection + ".find(" + JSON.stringify(params.find) + ") => " + results.length);
				resolve(results);
			});
		});
	});
	return mPromise;
};
global.collectionSaveDocuments = function(params = { collection: undefined }, documents = []) {
	var mPromise = new Promise(function(resolve, reject) {
		global.rqr.mongoose.connection.db.collection(params.collection, function(err, collection) {
			if (err) {
				global.logger.error({ ["mongoose " + params.collection + " failed to connect"]: { message: err.message, stack: err.stack } });
			}
			documents.forEach(function(doc) {
				collection.save(doc);
			});
			resolve("saved " + documents.length);
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
global.server.get("/api/v1/:coll/:_area?.json", async function(request, response) {
	// undefined
	if (!request.params._area) {
		request.params._area = ""; // make sure it's a string, not undefined
	}
	// meta
	const coll_area = request.params._area;
	const coll_gt = ["posted", Date.now() - 604800000 * 2]; // posted since 2 weeks ago
	const coll = request.params.coll;
	const coll_find = {};
	if (coll_area) {
		coll_find._area = coll_area;
	}
	// data
	let data = await global.collectionSearch({ collection: coll, find: coll_find, gt: coll_gt, sort: { posted: -1 }, ...request.query });
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
global.server.post("/api/v1/:collection/apify-webhook/:_area?", function(request, response) {
	// lets see what happens if _area is undefined, if it will use empty string, or the word "undefined"
	// meta
	const collection_area = request.params._area;
	const collection = request.params.collection;
	const cacheUrl_initial = `api/v1/${collection}${collection_area ? "/" + collection_area : ""}-50.json`;
	const cacheUrl = `api/v1/${collection}${collection_area ? "/" + collection_area : ""}.json`;
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
			var resultsObject = {};
			let resultsSets = JSON.parse(body);
			if (resultsSets && resultsSets[0] && resultsSets[0].pageFunctionResult) {
				for (var rD in resultsSets) {
					let results = resultsSets[rD].pageFunctionResult;
					// format
					for (var r in results) {
						// each
						var res = results[r];
						for (var k in res) {
							if (typeof res[k] === "string") {
								res[k] = res[k].replace(/\s/g, " ");
								res[k] = res[k].trim();
							}
						}
						res.text = res.text;
						// filter (timestamp in milliseconds)
						if (res.posted.toLowerCase() === "just posted") {
							res.posted = "today";
						}
						console.log(JSON.stringify(res));
						// console.log(global.rqr.chrono.parseDate(res.posted));
						// console.log(global.rqr.moment(global.rqr.chrono.parseDate(res.posted)).format("x"));
						res.posted = parseInt(global.rqr.moment(global.rqr.chrono.parseDate(res.posted)).format("x"));
						// save to DB
						res._area = collection_area;
						res._status = "new";
						res._id = global.rqr.crypto
							.createHash("md5")
							.update(res.name + " " + res.company)
							.digest("hex");
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
					global.collectionSaveDocuments({ collection: collection }, resultsArray);
					global.logger.info({ ["API: POST `/api/v1/" + collection + "/apify-webhook/" + collection_area + '` saved to collection "' + collection + '"']: { resultsUrl, results: resultsArray.length } });

					/*
						save to CDN
					*/
					if (!DEV) {
						global.collectionSearch({ collection: collection, find: { _area: collection_area }, sort: { posted: -1 }, skip: 0, limit: 3000 }).then(function(data) {
							// send to S3/Cloud
							global.S3UploadToBucket(cacheUrl, JSON.stringify(data));
							global.S3UploadToBucket(cacheUrl_initial, JSON.stringify(data.slice(0, 50)));
							global.logger.info({ ["API: POST `/api/v1/" + collection + "/apify-webhook/" + collection_area + "` uploading to CDN:"]: { results: data.length } });
						});
					}
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
