import Apify from 'apify';

import { scrapeProductsOrSplitPriceRange } from './helpers/scrapeProductsOrSplitPriceRange.js';
import { countProductsOrSplitPriceRange } from './helpers/countProductsOrSplitPriceRange.js';

import { ACTOR_TYPES } from '../consts.js';

const { DAILY } = ACTOR_TYPES;
const {
    utils: { log },
} = Apify;

export const handleProductList = async ({
    $,
    request: { userData, loadedUrl },
    crawler: { requestQueue },
    type,
}) => {
    log.debug('Entered product list page.');

    /**
     * If this subcategory page isn't a child of a root category
     * and it can't have a categories list of length > 2,
     * then we skip it and go to the child category of the
     * current root category.
     */
    if ($('.breadcrumbs span').length > 1
        && !(userData).longCategory) {
        await requestQueue.addRequest({
            url: $('ul.breadcrumbs li a').attr('href')?.trim(),
            userData,
        });
        return;
    }

    // we also skip current page if it has any filters selected except price
    if ($('.catalog-selection__list li').length
        && !loadedUrl.includes('price=')) return;

    if (type === DAILY) {
        await scrapeProductsOrSplitPriceRange($, loadedUrl, requestQueue, userData);
    } else {
        await countProductsOrSplitPriceRange($, loadedUrl, requestQueue, userData);
    }
};
