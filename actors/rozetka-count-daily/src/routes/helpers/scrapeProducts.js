import Apify from 'apify';

import { CURRENCY } from '../../consts.js';

export async function scrapeProducts($, category) {
    const products = $('.catalog-grid__cell');
    const datasetArr = [];

    for (let i = 0; i < products.length; i++) {
        datasetArr.push(scrapeOneProduct(products.eq(i), category));
    }

    await Apify.pushData(datasetArr);
}

function scrapeOneProduct(product,
    category) {
    const itemId = product.find('[data-goods-id]')?.eq(0).attr('data-goods-id')?.trim();
    const itemName = product.find('.goods-tile__heading')?.eq(0).attr('title')?.trim();
    const itemUrl = product.find('.goods-tile__heading')?.eq(0).attr('href')?.trim();
    const itemImg = product.find('.goods-tile__picture img')?.eq(0).attr('src')?.trim();
    const currentPrice = product.find('.goods-tile__price-value')
        ?.eq(0).text()?.trim()
        .split(' ')
        .join('');
    const originalPrice = product.find('.goods-tile__price--old')
        ?.eq(0).text()?.trim()
        .match(/\d.*\d/)?.[0].split(' ').join('') || null;
    const discounted = !(originalPrice === null);
    const sale = product.find('.promo-label_type_action')
        .eq(0).text()?.trim()
        .match(/\d+/)?.[0] || undefined;
    const rating = product
        .find('.goods-tile__stars svg[aria-label]')?.eq(0).attr('aria-label')
        ?.trim()
        ?.match(/[\d|.]+/)?.[0] || undefined;

    const inStockMessageStart = product.find('.goods-tile__availability')
        .eq(0).text()?.trim()?.[0];
    const inStock = inStockMessageStart === 'Є' || inStockMessageStart === 'Е';

    return {
        itemId,
        itemName,
        itemUrl,
        itemImg,
        category,
        currentPrice,
        currency: CURRENCY,
        originalPrice,
        discounted,
        sale,
        rating,
        inStock,
    };
}
