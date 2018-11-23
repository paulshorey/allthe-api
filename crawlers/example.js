'use strict';
const puppeteer = require('puppeteer');

(async() => {

  const logit = function(what){
    console.log(what);
  }
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  // await page.setViewport({ width: 1080, height: 741 })

  await page.goto('https://developers.google.com/web/');

  // Type into search box.
  await page.type('#searchbox input', 'Headless Chrome');

  // Wait for suggest overlay to appear and click "show all results".
  const allResultsSelector = '.devsite-suggest-all-results';
  await page.waitForSelector(allResultsSelector);
  await page.click(allResultsSelector);

  // Wait for the results page to load and display the results.
  const resultsSelector = '.gsc-results .gsc-thumbnail-inside a.gs-title';
  await page.waitForSelector(resultsSelector);

  // Extract the results from the page.
  const links = await page.evaluate(resultsSelector => {
    const anchors = Array.from(document.querySelectorAll(resultsSelector));
    return anchors.map(anchor => {
      const title = anchor.textContent.split('|')[0].trim();
      return `${title} - ${anchor.href}`;
    });
  }, resultsSelector);

  console.log('\n'+links.join('\n')+'\n');

  await browser.close();

  links.forEach(function(each,i) {

    {
        "query": "mutation insert_article {\n  insert_test(objects: [{title: \"Article 1\", description: \"Sample article content\"}]) {\n    returning {\n      title\n      description\n    }\n  }\n}\n",
        "variables": null,
        "operationName": "insert_article"
    }

  });

})();