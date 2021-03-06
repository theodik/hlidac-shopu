const { S3Client } = require("@aws-sdk/client-s3");
const s3 = new S3Client({ region: "eu-central-1" });
const { uploadToKeboola } = require("@hlidac-shopu/actors-common/keboola.js");
const { CloudFrontClient } = require("@aws-sdk/client-cloudfront");
const {
  invalidateCDN,
  toProduct,
  uploadToS3,
  s3FileName
} = require("@hlidac-shopu/actors-common/product.js");
const rollbar = require("@hlidac-shopu/actors-common/rollbar.js");
const Apify = require("apify");
const randomUA = require("modern-random-ua");
const tools = require("./tools");

const { LABEL, COUNTRY, ROOT_WEB_URL } = require("./const");

const { log } = Apify.utils;

async function enqueuRequests(requestQueue, items) {
  for (const item of items) {
    await requestQueue.addRequest(item);
  }
}

// fetch links and names of categories
async function fetchCategories($, requestQueue, country, test) {
  let categories = [];
  $("#js-main-nav-box .js_level-2 a.main-nav__item__dropdown").each(
    function () {
      const link = $(this).attr("href");
      const category = [];
      category.push(
        $(this)
          .closest(".main-nav__item.js_level-1")
          .find("a.main-nav__item__dropdown")
          .first()
          .text()
          .trim()
      );
      category.push($(this).text().trim());

      categories.push({
        url: tools.buildUrl(ROOT_WEB_URL(country), link),
        headers: { userAgent: randomUA.generate() },
        userData: { label: LABEL.CATEGORY, category }
      });
    }
  );
  if (categories.length === 0) {
    $("#js-main-nav-box .js_level-1 a.main-nav__item__dropdown").each(
      function () {
        const link = $(this).attr("href");
        const category = [];
        category.push($(this).text().trim());

        categories.push({
          url: tools.buildUrl(ROOT_WEB_URL(country), link),
          headers: { userAgent: randomUA.generate() },
          userData: { label: LABEL.SUB_CATEGORY, category }
        });
      }
    );
  }

  if (test) {
    categories = categories.slice(0, 1);
    log.info("TEST run");
  }
  log.info(`Found ${categories.length} categories.`);
  await enqueuRequests(requestQueue, categories, false);
}

async function fetchSubCategories($, requestQueue, request, country) {
  const categories = [];
  $(".subcategories .subcategories__link").each(function () {
    const link = $(this).attr("href");
    const { category } = request.userData;
    category.push($(this).text().trim().split("\n")[0].trim());

    categories.push({
      url: tools.buildUrl(ROOT_WEB_URL(country), link),
      headers: { userAgent: randomUA.generate() },
      userData: { label: LABEL.CATEGORY, category }
    });
  });
  log.info(`Found ${categories.length} categories.`);
  await enqueuRequests(requestQueue, categories, false);
}

// generate category pages
async function generateCategoryPages($, requestQueue, request) {
  let maxPage = 0;
  const pages = [];

  if ($("#pagination ul.pagination").length > 0) {
    maxPage = parseInt(
      $("#pagination ul.pagination li a.pagination__link").last().text(),
      10
    );
  }

  for (let i = 2; i <= maxPage; i++) {
    pages.push({
      url: `${request.url}?page=${i}`,
      headers: { userAgent: randomUA.generate() },
      userData: {
        label: LABEL.CATEGORY_PAGE,
        category: request.userData.category
      }
    });
  }
  log.info(
    `Found ${pages.length} pages for category ${request.userData.category}.`
  );
  await enqueuRequests(requestQueue, pages, false);
}

// fetch product base info from category page
async function fetchProductBase($, requestQueue, request, country, type) {
  const products = [];
  let productsCards = $(".product-cards, .top-product-cards").find(
    ".product-prev__content"
  );
  if (type === "BF") {
    productsCards = $(".product-prev__content");
  }

  productsCards.each(function () {
    try {
      const result = {};
      const item = $(this);
      const name = item.find("picture img").attr("alt");
      const id = item.find('form input[name="productId"]').val();
      const link = item.find("a.product-prev__title").attr("href");
      const imgLink = item.find("picture img").data("src");
      const shortDesc = item.find(".product-prev__description").text().trim();
      const availability = item
        .find(".js-trigger-availability-modal span")
        .first()
        .text()
        .trim();
      let originalPrice = null;
      const currentPrice = parseFloat(
        item
          .find(".js-trigger-availability-modal")
          .data("product-price")
          .replace(/\s/g, "")
      );

      if (!Number.isNaN(currentPrice) && currentPrice > 0 && id != undefined) {
        if (item.data("event") === "ProductTopCategory") {
          originalPrice = parseFloat(
            item
              .find(".top-product__add-to-cart--container a s.text-gray")
              .text()
              .replace(/\s/g, "")
          );
        } else {
          originalPrice = parseFloat(
            item.find(".product-prev__price-discount").text().replace(/\s/g, "")
          );
        }
        if (!Number.isNaN(originalPrice) && originalPrice > 0) {
          result.originalPrice = originalPrice;
          result.currentPrice = currentPrice;
          result.discounted = true;
        } else {
          result.originalPrice = null;
          result.currentPrice = currentPrice;
          result.discounted = false;
        }

        result.img = tools.buildUrl(ROOT_WEB_URL(country), imgLink);
        result.itemId = id;
        result.itemUrl = tools.buildUrl(ROOT_WEB_URL(country), link);
        result.itemName = name;
        result.shortDesc = shortDesc;
        result.availability = availability;
        result.category = request.userData.category;

        products.push(result);
      } else {
        log.info(`Skip non price product [${name}]`);
      }
    } catch (e) {
      log.error(`Products extraction failed on url: ${request.url}`);
    }
  });
  for (const product of products) {
    await uploadToS3(
      s3,
      `pilulka.${country.toLowerCase()}`,
      await s3FileName(product),
      "jsonld",
      toProduct(
        {
          ...product,
          inStock: true
        },
        { priceCurrency: country === COUNTRY.CZ ? "CZK" : "EUR" }
      )
    );
  }

  await Apify.pushData(products);
}

// fetch product details URLs
async function fetchProductUrl($, requestQueue, request) {
  await Apify.utils.enqueueLinks({
    $,
    requestQueue,
    selector:
      ".product-cards a.product-prev__title, .top-product-cards a.product-prev__title",
    baseUrl: request.loadedUrl,
    transformRequestFunction: req => {
      req.userData = request.userData;
      req.userData.label = LABEL.PRODUCT_DETAIL;
      req.headers = { userAgent: randomUA.generate() };
      return req;
    }
  });
}

// fetch details from each product detail page
async function fetchProductDetail($, requestQueue, request, country) {
  const result = {};

  try {
    const currentPrice = parseFloat(
      $("form.js-amount-add").data("at-product-price").replace(/\s/g, "")
    );
    const originalPrice = parseFloat(
      $("#js-product-layer-pc .product-layer__grid-old-price")
        .text()
        .replace(/\s/g, "")
    );
    const detailTable = $("#product-info .product-detail__table");

    result.img = tools.buildUrl(
      ROOT_WEB_URL(country),
      $(".product-detail__images picture img").data("src")
    );
    result.itemId = $('form input[name="productId"]').val();
    result.itemUrl = request.url;
    result.itemName = $("h1.product-detail__main-heading").text().trim();
    result.shortDesc = $(".product-detail__reduced > div > div > p")
      .text()
      .trim();
    result.availability = $('div[data-event="ProductDetailMaster"] > strong')
      .text()
      .trim();
    result.sukl = detailTable
      .find('tr:contains("SUKL kód:") td:nth-child(2)')
      .text()
      .trim();
    result.ean = detailTable
      .find('tr:contains("EAN:") td:nth-child(2)')
      .text()
      .trim();
    result.category = request.userData.category;

    if (!Number.isNaN(currentPrice) && currentPrice > 0) {
      if (!Number.isNaN(originalPrice) && originalPrice > 0) {
        result.originalPrice = originalPrice;
        result.currentPrice = currentPrice;
        result.discounted = true;
      } else {
        result.originalPrice = null;
        result.currentPrice = currentPrice;
        result.discounted = false;
      }

      await uploadToS3(
        s3,
        `pilulka.${country.toLowerCase()}`,
        await s3FileName(result),
        "jsonld",
        toProduct(
          {
            ...result,
            inStock: true
          },
          { priceCurrency: country === COUNTRY.CZ ? "CZK" : "EUR" }
        )
      );

      await Apify.pushData(result);
    } else {
      log.info(`Skip non price product [${result.itemName}]`);
    }
  } catch (e) {
    log.error(`Product extraction failed on url: ${request.url}`);
  }
}

Apify.main(async () => {
  rollbar.init();
  const cloudfront = new CloudFrontClient({ region: "eu-central-1" });
  const input = await Apify.getInput();
  const { test = false, country = COUNTRY.CZ, debugLog = false, type } = input;

  const requestQueue = await Apify.openRequestQueue();
  if (debugLog) {
    Apify.utils.log.setLevel(Apify.utils.log.LEVELS.DEBUG);
  }
  if (type === "BF") {
    await requestQueue.addRequest({
      url: `${ROOT_WEB_URL(country)}/black-friday`,
      headers: { userAgent: randomUA.generate() },
      userData: { label: LABEL.CATEGORY_PAGE }
    });
  } else {
    await requestQueue.addRequest({
      url: ROOT_WEB_URL(country),
      headers: { userAgent: randomUA.generate() },
      userData: { label: LABEL.START }
    });
  }

  const proxyConfiguration = await Apify.createProxyConfiguration({
    groups: ["CZECH_LUMINATI"]
  });

  // Create crawler
  const crawler = new Apify.CheerioCrawler({
    requestQueue,
    maxConcurrency: 20,
    maxRequestRetries: 4,
    proxyConfiguration,
    handlePageFunction: async ({ $, request }) => {
      if (request.userData.label === LABEL.START) {
        log.info(
          `START scraping pilulka.${country.toLowerCase()} type=${type} test=${test}`
        );
        await fetchCategories($, requestQueue, country, test);
      } else if (request.userData.label === LABEL.SUB_CATEGORY) {
        log.info(`START with sub_category ${request.url}`);
        await fetchSubCategories($, requestQueue, request, country);
      } else if (request.userData.label === LABEL.CATEGORY) {
        log.info(`START with category ${request.url}`);
        await generateCategoryPages($, requestQueue, request);
        if (input.parseDetails) {
          await fetchProductUrl($, requestQueue, request);
        } else {
          await fetchProductBase($, requestQueue, request, country, type);
        }
      } else if (request.userData.label === LABEL.CATEGORY_PAGE) {
        if (input.parseDetails) {
          await fetchProductUrl($, requestQueue, request);
        } else {
          await fetchProductBase($, requestQueue, request, country, type);
        }
      } else if (request.userData.label === LABEL.PRODUCT_DETAIL) {
        await fetchProductDetail($, requestQueue, request, country);
      }
    },
    // If request failed 10 times then this function is executed.
    handleFailedRequestFunction: async ({ request }) => {
      log.error(`Request ${request.url} failed 10 times`);
    }
  });

  // Run crawler
  await crawler.run();

  await invalidateCDN(
    cloudfront,
    "EQYSHWUECAQC9",
    `pilulka.${country.toLowerCase()}`
  );
  log.info("invalidated Data CDN");
  if (!test) {
    let tableName = country === COUNTRY.CZ ? "pilulka_cz" : "pilulka_sk";
    if (type === "BF") {
      tableName = `${tableName}_bf`;
    }

    await uploadToKeboola(tableName);
    log.info("upload to Keboola finished");
  }

  log.info("Finished.");
});
