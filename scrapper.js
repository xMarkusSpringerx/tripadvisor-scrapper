const puppeteer = require('puppeteer');
const fs = require('fs');
const json2xls = require('json2xls');
const BASE_URL = 'https://www.tripadvisor.de';
let dataObj = [];
const {dialog} = require('electron').remote;

let pageNumbers= 0;
let initItemCount = 0;

let town = "";
let currentIndex = 0;
async function run() {
  document.getElementById('downloadStarted').style.display = 'block';
  const browser = await puppeteer.launch({
      headless: true
  });

  const page = await browser.newPage();
  
  await page.goto(BASE_URL + '/Restaurants');

  const SEARCH_FIELD_SELECTOR = '#taplc_trip_search_home_restaurants_0 > div.ui_columns.datepicker_box.trip_search.metaDatePicker.rounded_lockup.easyClear.usePickerTypeIcons.preDates.noDates.with_children > div.prw_rup.prw_search_typeahead.ui_column.is-3.responsive_inline_priority.search_typeahead.wctx-tripsearch > div > span > input';
  const BUTTON_SELECTOR = '#SUBMIT_RESTAURANTS'
  await page.click(SEARCH_FIELD_SELECTOR);
  await page.keyboard.type(town);
  await page.click(BUTTON_SELECTOR);

  await page.waitForNavigation();

  pageNumbers = await getNumPages(page);

  console.log('Anzahl Seiten: ', pageNumbers);
  
  document.getElementById('countPages').innerHTML = pageNumbers;

  let actPage = 1;

  for (let j = 1; j <= pageNumbers; j++) {

    try {

      await parsePage(browser, page);

      const PAGE_SELECTOR = '#EATERY_LIST_CONTENTS > div.deckTools.btm > div > a.nav.next.rndBtn.ui_button.primary.taLnk';
      console.log("Neue Seite");
      await page.click(PAGE_SELECTOR);
      await page.waitFor(3*1000);
      actPage++;
    } catch(e) {
      console.log(e);
    }

  }


  let content = "Some text to save into the file";

  // You can obviously give a direct path without use the dialog (C:/Program Files/path/myfileexample.txt)
  dialog.showSaveDialog((fileName) => {
      if (fileName === undefined){
          console.log("You didn't save the file");
          return;
      }

      // fileName is a string that contains the path and filename created in the save file dialog.  
      var xls = json2xls(dataObj);

      fs.writeFileSync(fileName, xls, 'binary');

      
  }); 

  browser.close();
}
async function getNumPages(page) {
    const NUM_USER_SELECTOR = '#EATERY_LIST_CONTENTS > div.deckTools.btm > div > div > a:last-child';
    let maxPages = await page.evaluate((sel) => {
      return document.querySelector(sel).getAttribute('data-page-number');
    }, NUM_USER_SELECTOR);
    return parseInt(maxPages);  
}

async function parsePage(browser, page) {


    const LENGTH_SELECTOR_CLASS = '#EATERY_SEARCH_RESULTS > div.listing';
    let listLength = await page.evaluate((sel) => {
      return document.querySelectorAll(sel).length;
    }, LENGTH_SELECTOR_CLASS);

    console.log("Anzahl Elemente: ", listLength);
    initItemCount = listLength;

    document.getElementById('allCount').innerHTML = parseInt(initItemCount) * parseInt(pageNumbers);
    
    const LIST_LINK_SELECTOR = '#EATERY_SEARCH_RESULTS > div.listingIndex-INDEX div.title a:first-child';  
    for (let i = 1; i <= listLength; i++) {
      document.getElementById('downloaded').innerHTML = currentIndex;
      currentIndex++;

      let linkSelector = LIST_LINK_SELECTOR.replace("INDEX", i);
      //console.log(linkSelector);

      let linkUrl = await page.evaluate((sel) => {
          return document.querySelector(sel).getAttribute('href');
      }, linkSelector);
      
      //console.log(linkUrl);
      const restaurantDetailPage = await browser.newPage();
      await restaurantDetailPage.goto(BASE_URL + linkUrl);
  
      
      const TEL_SELECTOR = '#taplc_location_detail_header_restaurants_0 > div.prw_rup.prw_common_atf_header_bl.headerBL > div > div.blEntry.phone.directContactInfo > span:nth-child(2)';
      const NAME_SELECTOR = '#HEADING';
      const EMAIL_SELECTOR = '#RESTAURANT_DETAILS > div.details_tab > div.additional_info > div.content > ul > li > a'
      const STREET_SELECTOR = '#taplc_location_detail_header_restaurants_0 span.street-address'

      const COUNTRY_SELECTOR = '#taplc_location_detail_header_restaurants_0 span.country-name'
      const LOCALITY_SELECTOR = '#taplc_location_detail_header_restaurants_0 span.locality'
      const WEBSITE_LINK = '#taplc_location_detail_header_restaurants_0 div.blEntry.website'

      // click on a 'target:_blank' link
    
    /*
      await restaurantDetailPage.click(WEBSITE_LINK);
    */
      let tel = await restaurantDetailPage.evaluate((sel) => {
          if(document.querySelector(sel)) {
              return document.querySelector(sel).innerHTML; 
          } else {
              return "Keine Telefonnummer";
          }
      }, TEL_SELECTOR);
  
      let name = await restaurantDetailPage.evaluate((sel) => {
           return document.querySelector(sel).innerHTML;
      }, NAME_SELECTOR);

      let email = await restaurantDetailPage.evaluate((sel) => {
          if(document.querySelector(sel)){
            return document.querySelector(sel).getAttribute('href').replace('mailto:', '');
          }
          return 'Keine E-Mail'
      }, EMAIL_SELECTOR);



      let street = await restaurantDetailPage.evaluate((sel) => {
        if(document.querySelector(sel)){
          return document.querySelector(sel).innerHTML;
        }
        return 'Keine Straße'
    }, STREET_SELECTOR);

    let country = await restaurantDetailPage.evaluate((sel) => {
        if(document.querySelector(sel)){
          return document.querySelector(sel).innerHTML;
        }
        return 'Kein Land'
    }, COUNTRY_SELECTOR);

    let locality = await restaurantDetailPage.evaluate((sel) => {
        if(document.querySelector(sel)){
          return document.querySelector(sel).innerHTML;
        }
        return 'Kein Ort'
    }, LOCALITY_SELECTOR);
      

      console.log("Hotel: ", i , " Name: ", name, " Tel: ", tel, 'E-Mail: ', email, 'URL: ', linkUrl);

      dataObj.push(
          {
              "Name": name, 
              "Telefon": tel, 
              "EMAIL": email, 
              "URL": BASE_URL + linkUrl, 
              "COUNTRY": country, 
              "STREET": street,
              "LOCAL": locality
            });
      //console.log(dataObj);

      restaurantDetailPage.close(); 
    }
}

function search() {
  let val = document.getElementById('town').value;
  if(val) {
    town = val;
    run();
  }
}