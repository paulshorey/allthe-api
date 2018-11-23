/*
    process.env
*/
process.env.PATH = __dirname;
process.env.PORT = 1080;
const dev = process.env.NODE_ENV === 'development';
/*
    global.shh
*/
global.shh = require('../secret/all.js'); // not on GitHub!
/*
    global.rqr
*/
global.rqr = global.rqr || {};
global.rqr.express = require('express');
global.rqr.express_parser = require('body-parser');
global.rqr.fs = require('fs');
global.rqr.http = require('http');
global.rqr.https = require('https');
global.rqr.url = require('url');
global.rqr.crypto = require('crypto');
global.rqr.chrono = require('chrono-node');
/*
    global.logger
*/
let dna_logger = require('logdna').setupDefaultLogger(global.shh.logdna.ingestionKey, {
    index_meta: true,
    hostname: "ps-jobs",
    app: dev ? "API-dev" : "API-pro"
});
let fixLogger = function(useLib) {
    var doLog = function(level, ...args) {
        if (args[0].stack) {
            // Error
            this[level]( args[0].stack, args[0].message );
            console[level]( args[0].stack );
        }
        else {
            // multiple
            this[level]( ...args );
            console[level]( ...args);
        }
    }.bind(useLib);
    return {
        log: function(...logWhat){ doLog("log",...logWhat) },
        info: function(...logWhat){ doLog("info",...logWhat) },
        warn: function(...logWhat){ doLog("warn",...logWhat) },
        error: function(...logWhat){ doLog("error",...logWhat) }
    }
}
global.logger = fixLogger(dna_logger);
// global.logger.error(Error('test error'));
// global.logger.log({test:"test object"});
/*
    global.app
*/
global.app = global.rqr.express();
global.app.use(global.rqr.express_parser.json({
	limit: '50mb',
	parameterLimit: 10000,
	extended: true
}));
global.app.use(global.rqr.express_parser.urlencoded({
	limit: '50mb',
	parameterLimit: 10000,
	extended: true
}));
global.app.use(global.rqr.express.static('api_public'));
global.app.disable('trust proxy');
global.app.use(function(request, response, next){
	var referrer = global.rqr.url.parse(request.headers.referer||'', true, true).hostname;
	response.setHeader('Access-Control-Allow-Origin', '*'); // CHANGE THIS BEFORE ADDING SENSITIVE DATA!
	response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma, Authorization, Content-Length, X-Requested-With, X-Host');
	if ('OPTIONS' == request.method) {
		response.writeHead(200);
		response.end();
		return;
	} else {
		next();
		return;
	}
});
/*
    DB
*/
// const model = {};
// // mongoose (items)
// process.mongoose = require('mongoose');
// process.mongoose.connect('mongodb://localhost/api');
// // mongoose
// model.mongoose = {};
// model.mongoose.schemas = {};
// model.mongoose.schemas.item = { 
// 	_id: String,
// 	texts: { type:Object, required: true },
// 	timestamp: { type:Number, required: true },
// 	image: String,
// 	link: String,
// 	category: { type:String, default: '' },
// 	scene: { type:String, default: '' },
// 	venue: String,
// 	date: String,
// 	time: String,
// 	featured: { type:String, default: '' },
// 	price: { type:String, default: '' },
// 	timeAdded: { type:Number, default: Date.now() },
// 	likes: { type:Number, default: 0 },
// 	random: { type:Number, default: 0 },
// 	source: String,
// 	source_host: { type:String, required: true },
// 	source_link: { type:String, required: true },
// 	source_title: { type:String, required: true },
// 	site: Array

// };
// model.mongoose.item = process.mongoose.model('Item', model.mongoose.schemas.item);
// // model.mongoose.item.find({},callback);

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/admin";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});




////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// CONSOLE
// My pretend DB
// It returns an object with key-value pairs. Key is the unique hash generated from the job listing's title and company. 
// I'll then convert it to array and practice filtering and work with data
let jobsDB = {};
const jobsDB_file = "/www/db/v1_jobs";
if (!global.rqr.fs.existsSync("/www/db")){
    global.rqr.fs.mkdirSync("/www/db");
}
if (global.rqr.fs.existsSync(jobsDB_file)) {
    global.rqr.fs.readFile(jobsDB_file, 'utf8', function (err, data) {
        if (data) {
            jobsDB = JSON.parse(data);
        }
    });
} else {
    global.rqr.fs.writeFile(jobsDB_file, jobsDB);
};



////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// GET JOBS
global.app.get('/v1/jobs/all', function(request, response) {
    global.logger.info("GET /v1/jobs/all");
    
    // format response
    let data = Object.values(jobsDB);

    if (data[0]) {

        // filter
        if (request.query) {

                // search
                var query = request.query;
                for (var param in query) {
                    if (typeof data[0][param] !== "undefined") {
                        var qRegEx = new RegExp(query[param], "i"); // I like RegExp! Not most efficient, but ok for a site with one user
                        data = data.filter(function(job) {
                            return qRegEx.test(job[param]); // Don't think you can inject malicious code from a URI variable into a RegExpression. Can you?
                        });
                    }
                }

        }

        // sort
        data.sort(function(a,b) {
            return b._rating - a._rating;
        });

        // limit
        let query_limit = parseInt(request.query.limit) || 1000;
        let query_start = parseInt(request.query.start) || 0;
        data = data.slice( query_start, query_limit+query_start);

    }

    // success response
    response.setHeader('Content-Type', 'application/json');
    response.writeHead(200);
    response.write(JSON.stringify({results: data.length, data:data, error:0},null,"\t"));
    response.end();

});



////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// EDIT JOB
global.app.put('/v1/job', function(request, response) {

    var query = request.body;

    if (jobsDB[query._id]) {
        for (var param in query) {
            jobsDB[query._id][param] = query[param];
        }
    }
    
    // success response
    response.setHeader('Content-Type', 'application/json');
    response.writeHead(200);
    response.write(JSON.stringify({data:"ok", error:0},null,"\t"));
    response.end();

});



////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// ADD MORE JOBS
global.app.post('/apify-webhook', function(request, response) {
    // dev env
    if (!request.body._id) {
        request.body._id = "QhYiWH5sRYN4Rf8vP";
    }

    // fetch data
    const resultsUrl = "https://api.apify.com/v1/execs/"+request.body._id+"/results";
    global.rqr.https.get(resultsUrl, res => {
        res.setEncoding("utf8");
        let body = "";
        res.on("data", data => {
            body += data;
        });
        res.on("end", () => {

            // finally...
            resultsData = JSON.parse(body);
            if (resultsData && resultsData[0] && resultsData[0].pageFunctionResult) {
                for (var rD in resultsData) {
                    processJobs(resultsData[rD].pageFunctionResult);
                }
            } else {
                global.logger.error(Error("Apify-WEBHOOK FAILED to return data"+ resultsUrl));
            }

        });
    });

	// success response without waiting for async data above
	response.setHeader('Content-Type', 'application/json');
	response.writeHead(200);
	response.write(JSON.stringify({data:"OK", error:0},null,"\t"));
    response.end();

});

// magic
const processJobs = function(results){

    // format
    for (var r in results) {
        var res = results[r];
        for (var k in res) {
            if (typeof res[k] === "string") {
                res[k] = res[k].replace(/\s/g, ' ');
                res[k] = res[k].trim();
            }
        }
        // filter
        res.posted = global.rqr.chrono.parseDate(res.posted);

        // rating
        res._rating = 100000;

        // [ - ] location
        if (/, IN|, OH|, VA|, FL|, SC|, NC|, MD|, MO|, WI|, MN|, IL/i.test(res.location)) {
            continue;
        }

        // [ + ] location
        if (/, CA|, NY|Philadelphia|englewood|fort lee|cliffside|west new york|union city|weehawken|hoboken|jersey city|newport, NJ|secaucus|teaneck/i.test(res.location)) {
            res._rating += 3000;
        }
        if (/, AZ|, UT|, CO|, ID/i.test(res.location)) {
            res._rating += 1000;
        }

        // [ - ] text
        if (/entry level|junior|intern/i.test(res.name) && ! (/mid|senior/i.test(res.name))) { // in NAME, exclusive
            continue;
        }
        if (/full stack/i.test(res.name)) { // in NAME
            res._rating -= 1000;
        }
        if (/ASP\.NET|client|full stack|entry level/i.test(res.text)) { 
            res._rating -= 1000;
        }
        if (/software/i.test(res.name) || (/angular/i.test(res.text) && ! (/react/i.test(res.text))) ) { // 1 in NAME or 2,3 exclusive
            res._rating -= 1000;
        }
        if (/Java/i.test(res.text) && /JSP/i.test(res.text)) { // both match
            res._rating -= 1000;
        }
        if (/synergy|financial|bank|invest|account|lend|credit union|drupal|joomla/i.test(res.text)) { // fine with fin-tech, but would rather not work in a very strict corporate and beaurocratic environment
            res._rating -= 1000;
        }
        if ( ! (/html|css|sass|style|front/i.test(res.text)) ) { // !
            res._rating -= 1000;
        }

        // [ + ] text
        if (/front|ui/i.test(res.name)) { // in NAME
            res._rating += 2000;
        }
        if (/react|es6|ui|ux/i.test(res.name)) { // in NAME
            res._rating += 1000;
        }
        if (/react|es6|ui|ux/i.test(res.text)) {
            res._rating += 2000;
        }
        if (/node|front|art|music|design|flexible/i.test(res.text)) {
            res._rating += 1000;
        }
        if (/iot|embedded|php|ux|designer|illustrator|responsive/i.test(res.text)) {
            res._rating += 1000;
        }

        // // _rating to _stars
        // if (res._rating > 105000) {
        //     res._stars = 5;
        // } else if (res._rating > 103000) {
        //     res._stars = 4;
        // } else if (res._rating > 101000) {
        //     res._stars = 3;
        // } else if (res._rating > 99000) {
        //     res._stars = 2;
        // } else {
        //     res._stars = 1;
        // }

        // save to DB
        res._status = "new";
        res._id = global.rqr.crypto.createHash('md5').update(res.name+" "+res.company).digest('hex');
        jobsDB[ res._id ] = res;
    }

    // pretending this is a db
    global.rqr.fs.writeFile(jobsDB_file, JSON.stringify(jobsDB), function(err) {
        if(err) {
            return global.logger.error(err);
        }
        global.logger.info("FS wrote file /www/db/v1_jobs");
    });

    return results;

};



////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// START API SERVER
var httpServer = global.rqr.http.createServer(global.app);
httpServer.listen(process.env.PORT, (err) => {
    if (err) throw err
    console.log(`> API listening on http://localhost:${process.env.PORT}`)
})
// var httpsServer = global.rqr.https.createServer({key: global.rqr.fs.readFileSync('/etc/letsencrypt/live/api.paulshorey.com/privkey.pem', 'utf8'), cert: global.rqr.fs.readFileSync('/etc/letsencrypt/live/api.paulshorey.com/fullchain.pem', 'utf8')}, global.app);
// httpsServer.listen(1443);