const rp = require('request-promise');
const u = require('uuid/v4');

exports.handler = async (event, context, callback) => {
  const storeIds = ['041', '065'];
  const categoryId = '4294966937';
  const baseUrl = process.env.BASE_URL;
  // generate a uuid for the run
  const uuid = u();
  const timeout = ms => new Promise(res => setTimeout(res, ms));

  async function getPageCount(options) {
    return rp(options).then((result) => {
      return JSON.parse(JSON.stringify(result)).pageCount;
    }).catch((e) => {
      console.log(e);
    });
  }

  for (let i = 0; i < storeIds.length; i++) {
    let options = {
      method: 'POST',
      uri: 'http://localhost:3000/category/count',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: {
        "categoryId": categoryId,
        "storeId": storeIds[i]
      },
      json: true
    };
    // for a given store first check # pages
    await timeout(4000);
    let pages = await getPageCount(options);
    console.log('page count: ' + pages);
    // loop through # pages and save products

    for (let j = 0; j < pages; j++) {
      await timeout(3000);

      let options = {
        method: 'POST',
        uri: 'http://localhost:3000/scrape',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: {
          "storeId": storeIds[i],
          "guid": uuid,
          "page": j + 1,
          "categoryId": categoryId
        },
        json: true
      };
      console.log('processing store id ' + storeIds[i]);
      console.log('processing page ' + (j + 1));

      let products = await rp(options).then((result) => {
        return JSON.parse(JSON.stringify(result)).body;
      });
      console.log('products found: ' + JSON.stringify(products));
      // save to mongodb
      let optionsMongo = {
        method: 'POST',
        uri: 'http://localhost:3000/products',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: products,
        json: true
      };
      let saveToMongod = await rp(optionsMongo).then((result) => {
        console.log('saving to mongodb');
        return result;
      }).catch((e) => {
        console.log('something went wrong saving to mongodb');
        return e;
      });
      console.log('save to mongoDB results: ' + JSON.stringify(saveToMongod));
    }
  }
  console.log('finished scrape for microcenter');
};

//exports.handler('e', 'e', 'e');