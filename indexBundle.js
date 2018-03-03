'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const rp = require('request-promise');
const u = require('uuid/v4');

exports.handler = (() => {
  var _ref = _asyncToGenerator(function* (event, context) {
    let getPageCount = (() => {
      var _ref2 = _asyncToGenerator(function* (options) {
        return rp(options).then(function (result) {
          return JSON.parse(JSON.stringify(result)).pageCount;
        }).catch(function (e) {
          console.log(e);
        });
      });

      return function getPageCount(_x3) {
        return _ref2.apply(this, arguments);
      };
    })();

    const storeIds = ['041', '065'];
    const categoryId = '4294966937';
    const baseUrl = 'http://' + process.env.BASE_URL;
    // generate a uuid for the run
    const uuid = u();
    const timeout = function (ms) {
      return new Promise(function (res) {
        return setTimeout(res, ms);
      });
    };

    for (let i = 0; i < storeIds.length; i++) {
      let options = {
        method: 'POST',
        uri: baseUrl + '/category/count',
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
      yield timeout(4000);
      let pages = yield getPageCount(options);
      console.log('page count: ' + pages);
      // loop through # pages and save products

      for (let j = 0; j < pages; j++) {
        yield timeout(3000);

        let options = {
          method: 'POST',
          uri: baseUrl + '/scrape',
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

        let products = yield rp(options).then(function (result) {
          return JSON.parse(JSON.stringify(result)).body;
        });
        console.log('products found: ' + JSON.stringify(products));
        // save to mongodb
        let optionsMongo = {
          method: 'POST',
          uri: baseUrl + '/products',
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: products,
          json: true
        };
        let saveToMongod = yield rp(optionsMongo).then(function (result) {
          console.log('saving to mongodb');
          return result;
        }).catch(function (e) {
          console.log('something went wrong saving to mongodb');
          return e;
        });
        console.log('save to mongoDB results: ' + JSON.stringify(saveToMongod));
      }
    }
    console.log('finished scrape for microcenter');
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();
