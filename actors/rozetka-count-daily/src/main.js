import Apify from 'apify';
import { migrationConfig, getOrIncStatsValue } from './tools.js';
import { handleMainPage, handleCategory, handleProductList,
    handleRestaurantCategory, handleRestaurantSubcategory,
    handleClothesCategory } from './routes.js';
import { LABELS, START_REQUESTS, ACTOR_TYPES } from './consts.js';

const { MAIN_PAGE, CATEGORY, PRODUCT_LIST,
    RESTAURANT_CATEGORY, RESTAURANT_SUBCATEGORY,
    CLOTHES_CATEGORY } = LABELS;

const { COUNT, DAILY } = ACTOR_TYPES;

const {
    utils: { log },
} = Apify;

Apify.main(async () => {
    const {
        maxConcurrency = 100,
        proxyCountryCode,
        maxRequestsPerCrawl,
        type,
    } = (await Apify.getInput()) || {};

    if (type !== COUNT && type !== DAILY) {
        log.error('type input value has to be either "COUNT" or "DAILY"');
        return;
    }

    const requestList = await Apify.openRequestList('start-url', START_REQUESTS);
    const requestQueue = await Apify.openRequestQueue();
    const proxyConfiguration = await Apify.createProxyConfiguration({
        countryCode: proxyCountryCode,
    });

    if (type === COUNT) {
        await migrationConfig();
    }

    const crawler = new Apify.CheerioCrawler({
        requestList,
        requestQueue,
        proxyConfiguration,
        useSessionPool: true,
        persistCookiesPerSession: true,
        maxRequestRetries: 5,
        handlePageTimeoutSecs: 120,
        requestTimeoutSecs: 120,
        autoscaledPoolOptions: {
            maxConcurrency,
        },
        maxRequestsPerCrawl,
        handlePageFunction: async (context) => {
            const { request } = context;
            const { url, userData } = request;

            const { label } = userData;
            log.info('Page opened.', { label, url });
            switch (label) {
                case MAIN_PAGE:
                    await handleMainPage(context);
                    break;
                case CATEGORY:
                    await handleCategory(context);
                    break;
                case PRODUCT_LIST:
                    await handleProductList({
                        ...context,
                        type,
                    });
                    break;
                case RESTAURANT_CATEGORY:
                    await handleRestaurantCategory(context);
                    break;
                case RESTAURANT_SUBCATEGORY:
                    await handleRestaurantSubcategory(context);
                    break;
                case CLOTHES_CATEGORY:
                    await handleClothesCategory(context);
                    break;

                default:
                    break;
            }
        },
        handleFailedRequestFunction: async ({ request }) => {
            const debugDataSet = await Apify.openDataset('debug-rozetka-count-daily');
            await debugDataSet.pushData({
                '#debug': Apify.utils.createRequestDebugInfo(request),
            });
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');

    if (type === COUNT) {
        await Apify.pushData({ totalCount: await getOrIncStatsValue() });
    }
});
