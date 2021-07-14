import { getOrIncStatsValue } from '../../tools.js';
import { enqueueLastPage } from './enqueueLastPage.js';
import { splitPriceRangeToTwoRequest } from './splitPriceRangeToTwoRequest.js';
import { MAX_PAGE_COUNT } from '../../consts.js';

export const countProductsOrSplitPriceRange = async ($, url, requestQueue, userData) => {
    if (!$('.pagination').length
        || !$('.pagination__direction_type_forward[href]').length) {
        await getOrIncStatsValue($('.catalog-grid__cell').length, url);
        return;
    }

    const minPrice = parseInt($('input.slider-filter__input[formcontrolname="min"]')
        .attr('value'), 10);
    const maxPrice = parseInt($('input.slider-filter__input[formcontrolname="max"]')
        .attr('value'), 10);

    // count products from all pages except the last one (60 pr./page)
    const pagesCount = parseInt($('li.pagination__item:last-child').text(), 10);
    if (pagesCount < MAX_PAGE_COUNT || minPrice === maxPrice) {
        await enqueueLastPage($, url, requestQueue, userData);
        await getOrIncStatsValue((pagesCount - 1) * 60, url);
        return;
    }

    await splitPriceRangeToTwoRequest(url, minPrice, maxPrice, requestQueue, userData);
};
