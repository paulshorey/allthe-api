'use strict';
var results = [];

const puppeteer = require('puppeteer');
(async() => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 741 })




  await page.goto('https://www.glassdoor.com/Job/jobs.htm?sc.keyword=javascript&locT=C&locId=1146787&locKeyword=Glendale,%20CA&jobType=all&fromAge=-1&minSalary=0&includeNoSalaryJobs=true&radius=0&cityId=-1&minRating=0.0&industryId=-1&companyId=-1&applicationType=0&employerSizes=0&remoteWorkType=0');

  await page.waitForSelector('.jl');
  var items = Array.from(await page.$$('.jl'));
  results.push('found '+items.length);

  for (let i = 1; i < 5; i++) {
    let item = items[i];

    // Title
    // var title = (await item.$eval('.jobLink', el => el.innerText)) || "";
    // results.push(title);
    var itemSummary = await item.getProperty('innerText');
    var title = await itemSummary.jsonValue();
    results.push(title.split('\n'));

    // Description
    await page.$eval('#JobDescriptionContainer', el => { try { el.remove(); } catch(e) {} });
    await item.$eval('a', el => { try { el.click(); } catch(e) {} });
    await page.waitForSelector('#JobDescriptionContainer');
    var desc = await page.$eval('#JobDescriptionContainer', el => el.innerText) || "";
    results.push(desc.replace(/\n/g,'').substring(0,222));

  };




  // return
  // console.log('\n'+results.join('\n')+'\n');
  await browser.close();

  console.log('final...');
  console.log(results);
})();